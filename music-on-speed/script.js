const camera = document.getElementById("camera");
const buffer = document.getElementById("offscreenCanvas");
let oldFrame = null;
let oldFrameCapturedAt = 0;

const wave = document.querySelector(".wave-line");
let flipWave = true;

const audio = document.querySelector(".audio");

audio.addEventListener("play", () => {
  audio.playbackRate = 0;
});

startCamera();

camera.addEventListener("play", () => {
  // set off screen canvas size to same as camera
  buffer.width = camera.videoWidth;
  buffer.height = camera.videoHeight;
  // start drawing
  window.requestAnimationFrame(renderFrame);
});

function renderWave(strength = 0, flip) {
  const waveWidth = 512;
  const pointCount = 50;
  const points = [];
  const dist = waveWidth / pointCount;

  for (let i = 0; i < pointCount; i++) {
    let dir = i % 2 ? 1 : -1;
    if (flip) {
      dir = dir * -1;
    }
    const pointAmp = (pointCount - 1) / 2 - Math.abs(i - (pointCount - 1) / 2);
    let amp = 1 + pointAmp / 4;
    points.push(
      `c${dist / 2},0, ${dist / 2},${strength * dir * amp}, ${dist},${strength *
        dir *
        amp}`
    );
  }

  wave.setAttribute("d", "M0,128" + points.join(""));
}

function setSoundSpeed(change) {
  let rate = change / 15;
  if (rate < 0.1) {
    rate = 0;
  }
  audio.playbackRate = rate;
}

function getFrameDiff(frameA, frameB) {
  let relDiff = 0;
  // Keep track of how many pixels have changed
  let diffCount = 0;
  let totalPixels = frameA.data.length / 4; // 4 is used here since frame is represented as RGBA

  // If we've already processed a frame, compare the new frame with it
  if (frameB !== null) {
    for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
      // Compare this pixel between two frames
      if (comparePixel(frameA, frameB, pixelIndex)) {
        diffCount++; // Keep track of how many we find
      }
    }
  }

  // Give a numerical readout of proportion of pixels that have changed
  relDiff = 100 - Math.floor(100 * (diffCount / totalPixels));
  if (relDiff < 2) {
    relDiff = 0;
  }
  return relDiff;
}

function renderFrame() {
  let ctx = buffer.getContext("2d");
  // Copy camera to offscreen buffer
  ctx.drawImage(camera, 0, 0);
  // Get pixel data
  let frame = ctx.getImageData(0, 0, buffer.width, buffer.height);

  const diff = getFrameDiff(frame, oldFrame);

  renderWave(diff, flipWave);
  setSoundSpeed(diff);

  // Save changes for next pass
  oldFrame = frame;
  flipWave = !flipWave;

  // Repeat!
  setTimeout(() => {
    renderFrame();
  }, 50);
}

// Function compares a pixel in two frames, returning true if
// pixel is deemed to be equal
function comparePixel(frameA, frameB, i) {
  let rA = frameA.data[i * 4 + 0];
  let gA = frameA.data[i * 4 + 1];
  let bA = frameA.data[i * 4 + 2];
  let bwA = (rA + gA + bA) / 3.0; // B&W value

  let rB = frameB.data[i * 4 + 0];
  let gB = frameB.data[i * 4 + 1];
  let bB = frameB.data[i * 4 + 2];
  let bwB = (rB + gB + bB) / 3.0; // B&W value

  // Compare B&W values
  // Use Math.abs to make negative values positive
  // (we don't care if the new value is higher or lower, just that it's changed)
  let diff = Math.abs(bwA - bwB);
  if (diff < 20) return true;
  return false;
}

// ------------------------

// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log("Camera not ready: " + err);
    return;
  }
  console.log("Camera ready");
}

// Tries to get the camera ready, and begins streaming video to the cameraEl element.
function startCamera() {
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
        camera.srcObject = stream;
      } catch (error) {
        camera.srcObject = window.URL.createObjectURL(stream);
      }
      cameraReady();
    },
    error => {
      cameraReady(error);
    }
  );
}
