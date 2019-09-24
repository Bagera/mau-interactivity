import {
  head,
  setLoadingMsg,
  enumerateDevices,
  calcDistance
} from "../lib/utils.js";
import { dot, line, circle } from "../lib/draw.js";

const cameraEl = document.getElementById("camera");
const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");
const audio = document.querySelector(".audio");
const defFont =
  '10px "Fira Code", Monaco, "Andale Mono", "Lucida Console", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace';
let model = null;
let trigger = [375, 180];

// Setup motion detection
const maxFrames = 10;
let motionFrames = [];
let oldFrame;

// Init sound generators
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const compressor = audioCtx.createDynamicsCompressor();
compressor.connect(audioCtx.destination);
const toneTypes = ["sine", "sine"];
const maxDist = 175;
const maxFreq = 330;
const tones = [];

for (let index = 0; index < 20; index++) {
  tones[index] = audioCtx.createOscillator();
  const tone = tones[index];
  tone.frequency.setValueAtTime(0, audioCtx.currentTime);
  tone.connect(compressor);
  tone.type = toneTypes[index % toneTypes.length];
  tone.start();
}

setLoadingMsg("Loading coco-ssd model");

cocoSsd.load().then(m => {
  model = m;
  console.log("Model loaded, starting camera");
  document.body.classList.remove("loading");
  getSavedTriggerPoint();
  startCamera();
});

function getSavedTriggerPoint() {
  const pos = JSON.parse(localStorage.getItem("triggerPos"));
  if (pos) {
    setTriggerPoint(pos[0], pos[1]);
  }
}

function setTriggerPoint(x, y) {
  const pos = [x, y];
  trigger = pos;
  localStorage.setItem("triggerPos", JSON.stringify(pos));
}

canvasEl.addEventListener("click", evt => {
  const target = evt.target;
  const scale = target.width / target.clientWidth;
  const targetX = evt.clientX - target.offsetLeft;
  const targetY = evt.clientY - target.offsetTop;
  setTriggerPoint(Math.round(scale * targetX), Math.round(scale * targetY));
});

cameraEl.addEventListener("play", () => {
  // Resize canvas to match camera frame sie
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;

  // Start processing!
  window.requestAnimationFrame(process);
});

function comparePixel(frameA, frameB, i, threshold = 20) {
  let rA = frameA.data[i * 4 + 0];
  let gA = frameA.data[i * 4 + 1];
  let bA = frameA.data[i * 4 + 2];
  let bwA = (rA + gA + bA) / 3.0; // B&W value

  let rB = frameB.data[i * 4 + 0];
  let gB = frameB.data[i * 4 + 1];
  let bB = frameB.data[i * 4 + 2];
  let bwB = (rB + gB + bB) / 3.0; // B&W value

  let diff = Math.abs(bwA - bwB);
  if (diff < threshold) return true;
  return false;
}

function getMotionFrame(frameA, frameB, threshold = 20) {
  const totalPixels = frameA.data.length / 4;

  if (frameB) {
    for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
      // Compare this pixel between two frames
      if (comparePixel(frameA, frameB, pixelIndex, threshold)) {
        frameA.data[pixelIndex * 4 + 3] = 0;
      } else {
        for (let colorIndex = 0; colorIndex < 3; colorIndex++) {
          frameA.data[pixelIndex * 4 + colorIndex] = 0;
        }
      }
    }
    return frameA;
  }
  return null;
}

function getOpacity(frame) {
  let relOpacity = 0;
  // Keep track of how many pixels have changed
  let opacityCount = 0;
  let totalPixels = frame.data.length / 4; // 4 is used here since frame is represented as RGBA

  // If we've already processed a frame, compare the new frame with it
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
    if (frame.data[pixelIndex * 4 + 3] < 20) {
      opacityCount++; // Keep track of how many we find
    }
  }

  // Give a numerical readout of proportion of pixels that have changed
  relOpacity = Math.round(1000 - 1000 * (opacityCount / totalPixels)) / 10;
  return relOpacity;
}

// Processes the last frame from camera
function process() {
  let ppl = [];
  // setup context
  ctx.fillStyle = "white";
  ctx.font = defFont;

  // Draw frame to canvas
  ctx.drawImage(cameraEl, 0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (!oldFrame) {
    oldFrame = frame;
  } else {
    motionFrames.push(getMotionFrame(frame, oldFrame));
  }
  if (motionFrames.length > maxFrames) {
    motionFrames.shift();
  }
  oldFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Run through model
  model.detect(canvasEl).then(predictions => {
    let volume = 1;
    let greatestDist = null;
    let shortestDist = null;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    if (motionFrames.length > 0) {
      motionFrames.forEach(frame => {
        ctx.putImageData(frame, 0, 0);
      });
    }
    const opacity = getOpacity(
      ctx.getImageData(0, 0, canvas.width, canvas.height)
    );

    ctx.fillStyle = "RGBA(47, 79, 79, 0.5)";
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    dot(trigger, ctx, { size: 10 });
    circle(trigger, ctx, { size: maxDist });

    let filtered = predictions.filter(
      prediction => prediction.class === "person"
    );

    for (let i = 0; i < tones.length / 2; i++) {
      const tone1 = tones[i];
      const tone2 = tones[i + tones.length / 2];
      const prediction = filtered[i];

      if (prediction) {
        const point = head(prediction.bbox);
        const dist = calcDistance(point, trigger);

        if (dist < maxDist) {
          // Check distance for volume
          if (!shortestDist || dist < shortestDist) {
            shortestDist = dist;
          }
          if (!greatestDist || dist > greatestDist) {
            greatestDist = dist;
          }

          // Set tones
          let relFreq = dist / maxDist;
          tone1.frequency.setValueAtTime(
            (1 - relFreq) * maxFreq,
            audioCtx.currentTime
          );
          tone2.type = "sawtooth";
          tone2.frequency.setValueAtTime(
            (1 - relFreq) * maxFreq * (opacity / 25),
            audioCtx.currentTime
          );

          dot(point, ctx);
          line(point, trigger, ctx);
        } else {
          tone1.frequency.setValueAtTime(0, audioCtx.currentTime);
          tone2.frequency.setValueAtTime(0, audioCtx.currentTime);
        }
      } else {
        tone1.frequency.setValueAtTime(0, audioCtx.currentTime);
        tone2.frequency.setValueAtTime(0, audioCtx.currentTime);
      }
    }

    if (greatestDist !== shortestDist) {
      volume = (shortestDist / greatestDist) * 0.75 + 0.25;
    }

    audio.volume = volume;

    ctx.textBaseline = "top";
    ctx.fillText(`change: ${opacity}, volume: ${volume}`, 10, 10);

    window.requestAnimationFrame(process);
  });
}

function initAudio() {
  // audio.play();
  audio.volume = 0;
}

// ------------------------
// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log("Camera error", err);
    return;
  }
  initAudio();
}

// Tries to get the camera ready, and begins streaming video to the cameraEl element.
function startCamera() {
  enumerateDevices();
  navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  if (!navigator.getUserMedia) {
    cameraReady("getUserMedia not supported");
    return;
  }
  navigator.getUserMedia(
    { video: true },
    stream => {
      try {
        cameraEl.srcObject = stream;
      } catch (error) {
        cameraEl.srcObject = window.URL.createObjectURL(stream);
      }
      cameraReady();
    },
    error => {
      cameraReady(error);
    }
  );
}
