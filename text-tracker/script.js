const cameraEl = document.getElementById("camera");
const canvasEl = document.getElementById("canvas");
const textEl = document.querySelector(".text");

const tracker = new clm.tracker();

let pauseConsole = false;
let activeTimer;
let resetTimer;

document.body.addEventListener("click", e => {
  document.getElementById("canvas").classList.toggle("hidden");
});

startCamera();

cameraEl.addEventListener("play", () => {
  // Resize everything to match the  video frame size
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;
  cameraEl.width = cameraEl.videoWidth;
  cameraEl.height = cameraEl.videoHeight;

  // Initialise and start tracking
  tracker.init();
  tracker.start(cameraEl);

  // Process a frame
  window.requestAnimationFrame(renderFrame);
});

function renderFrame() {
  var ctx = canvasEl.getContext("2d");
  var points = tracker.getCurrentPosition();

  if (points) {
    // Got a tracked head!
    let eventData = processTrack(points);
    resetTimer = false;
    if (!activeTimer) {
      activeTimer = setTimeout(() => {
        textEl.classList.remove("inactive");
        activeTimer = false;
      }, 100);
    }

    const faceX = (points[27][0] + points[32][0]) / 2;
    const centerX = canvasEl.width / 2;
    const faceY = (points[27][1] + points[32][1]) / 2;
    const centerY = canvasEl.height / 2;
    const relFaceX = ((faceX - centerX) / centerX) * 100;
    const relFaceY = ((faceY - centerY) / centerY) * 100;

    if (!pauseConsole) {
      // console.log(eventData);
      console.log(faceX, centerX, relFaceX);
      pauseConsole = true;
      setTimeout(() => {
        pauseConsole = false;
      }, 2000);
    }

    // Draw track data to canvas if canvas itself is visible
    if (!canvasEl.classList.contains("hidden")) {
      ctx.drawImage(cameraEl, 0, 0);
      tracker.draw(canvasEl);
    }

    // Update the red thing
    textEl.style.transform = "translateX(" + relFaceX * 0.33 + "vw)";
    textEl.style.transform += "translateY(" + relFaceY * -0.67 + "vh)";
    textEl.style.transform += " rotate(" + eventData.rotation * -1 + "deg)";
    textEl.style.transform += " scale(" + eventData.horiz * 10 + ")";

    // Update UI labels (for debugging)
    document.getElementById(
      "rotation"
    ).innerText = eventData.rotation.toString();
    document.getElementById("size").innerText =
      Math.floor(eventData.size * 100) + "%";
    document.getElementById("tracking").innerText = "Yes";
  } else {
    // No tracking :(
    document.getElementById("tracking").innerText = "No";
    document.getElementById("rotation").innerText = "";
    document.getElementById("size").innerText = "";

    if (!resetTimer) {
      resetTimer = setTimeout(() => {
        textEl.classList.add("inactive");
        textEl.style.transform = "none";
        activeTimer = false;
      }, 500);
    }
  }

  // Process next frame
  window.requestAnimationFrame(renderFrame);
}

function processTrack(p) {
  var eventData = {
    rotation: NaN,
    size: NaN,
    horiz: NaN,
    vert: NaN
  };

  // Use point 0 and 14, which correspond roughly to the sides of the face
  // See diagram on https://github.com/auduno/clmtrackr
  eventData.rotation = Math.floor(calcAngle(p[0], p[14]));

  // Use points 33 and 7 which correspond roughly to the top and bottom of face
  const vDistance = calcDistance(p[33], p[7]);
  // Get a ratio of vertical distance and canvas height
  eventData.vert = vDistance / canvasEl.height;

  // Points that correspond to sides
  const hDistance = calcDistance(p[1], p[13]);

  // Get a ratio of horizontal distance and canvas width
  eventData.horiz = hDistance / canvasEl.width;

  // Compute an overall relative size based on average of both
  eventData.size = (eventData.vert + eventData.horiz) / 2;

  return eventData;
}

// ------------------------
// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log("Camera not ready: " + err);
    return;
  }
}

// Tries to get the camera ready, and begins streaming video to the cameraEl element.
function startCamera() {
  const constraints = {
    audio: false,
    video: { width: 640, height: 480 }
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(stream) {
      cameraEl.srcObject = stream;
      cameraReady();
    })
    .catch(function(err) {
      cameraReady(err); // Report error
    });
}

// ------------------------
// Utility functions
// ------------------------

// Calculate distance between two coordinates, given as [x,y]
function calcDistance(a, b) {
  let x = b[0] - a[0];
  let y = b[1] - a[1];
  x = x * x;
  y = y * y;
  return Math.sqrt(x + y);
}

// Calculate angle between two coordinates, given as [x,y]
function calcAngle(a, b) {
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
}
