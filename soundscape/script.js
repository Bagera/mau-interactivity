const cameraEl = document.getElementById("camera");
const canvasEl = document.getElementById("canvas");
const resultsEl = document.getElementById("results");
const audio = document.querySelector(".audio");

let model = null;
document.getElementById("btnFreeze").addEventListener("click", evt => {
  if (cameraEl.paused) {
    cameraEl.play();
    audio.play();
  } else {
    cameraEl.pause();
    audio.pause();
  }
});

console.log("Loading coco-ssd model");
cocoSsd.load().then(m => {
  model = m;
  console.log("Model loaded, starting camera");
  startCamera();
});

cameraEl.addEventListener("play", () => {
  // Resize canvas to match camera frame sie
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;

  // Start processing!
  window.requestAnimationFrame(process);
});

// Processes the last frame from camera
function process() {
  let ppl = 0;
  let volume = [];
  let speed = [];

  // Draw frame to canvas
  var ctx = canvasEl.getContext("2d");
  ctx.drawImage(cameraEl, 0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  // Run through model
  model.detect(canvasEl).then(predictions => {
    //console.log('Predictions: ', predictions);
    ctx.fillStyle = "black";
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    ctx.fillStyle = "white";
    ctx.font =
      '48px "Fira Code", Monaco, "Andale Mono", "Lucida Console", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace';
    // As a demo, draw each prediction
    predictions.forEach(prediction => {
      let personCenter;
      if (prediction.class === "person") {
        ppl++;
        personCenter = [
          prediction.bbox[0] + prediction.bbox[2] / 2,
          prediction.bbox[1] + prediction.bbox[3] / 2
        ];

        ctx.beginPath();
        ctx.arc(personCenter[0], personCenter[1], 5, 0, Math.PI * 2, true);
        ctx.fill();

        speed.push(personCenter[0]);
        volume.push(personCenter[1]);
      }
      // drawPrediction(prediction, ctx);
    });

    let averageVol = 0;
    let averageSpeed = 0;
    volume.forEach(vol => (averageVol += vol));
    speed.forEach(spd => (averageSpeed += spd));
    averageVol = Math.round(
      (averageVol / volume.length / canvasEl.height) * 100
    );
    averageSpeed = Math.round(
      (averageSpeed / speed.length / canvasEl.width) * 100
    );

    audio.volume = averageVol / 100;
    audio.playbackRate = averageSpeed / 50;

    ctx.fillText(
      averageVol / 100 + " vol, " + averageSpeed / 50 + " spd",
      10,
      40
    );
  });

  // Repeat, if not paused
  if (cameraEl.paused) {
    console.log("Paused processing");
    return;
  }
  // setTimeout(() => {
  // }, 1000);
  window.requestAnimationFrame(process);
}

/**
Prediction consists of:
 class (string)
 score (0..1)
 bbox[x1,y1,x2,y2]
*/
function drawPrediction(prediction, canvasContext) {
  // Get bounding box coordinates
  var [x1, y1, x2, y2] = prediction.bbox;

  // Draw a white and black offset rectangle around the prediction.
  // Two are used so that rectangle appears in dark or light images
  canvasContext.strokeStyle = "black";
  canvasContext.strokeRect(x1 + 1, y1 + 1, x2 + 1, y2 + 1);
  canvasContext.strokeStyle = "white";
  canvasContext.strokeRect(x1, y1, x2, y2);

  // Create a debug string showing prediction
  let msg = prediction.class + " (" + Math.floor(prediction.score * 100) + ")";

  // Measure how long this will be in pixels
  canvasContext.textBaseline = "top";
  let metrics = canvasContext.measureText(msg);
  let textHeight = 10;

  // Draw rectangle behind text, now we know how wide
  canvasContext.fillStyle = "rgba(0,0,0,0.5)";
  canvasContext.fillRect(
    x1,
    y1 - textHeight - 2,
    metrics.width + 6,
    textHeight + 4
  );

  // Draw text on top of rect
  canvasContext.fillStyle = "white";
  canvasContext.fillText(msg, x1 + 2, y1 - textHeight - 1);
}

function initAudio() {
  audio.play();
  audio.playbackRate = 0;
}

// ------------------------
// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log("Camera not ready: " + err);
    return;
  }
  console.log("Camera ready");
  initAudio();
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
