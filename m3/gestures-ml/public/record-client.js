// @ts-ignore
const socket = io();
let interval;
const updateFrequency = 10;

let gyroscopeData = {
  x: "",
  y: "",
  z: ""
};

let accelerometerData = {
  x: "",
  y: "",
  z: ""
};

let counter = 0;

window.onload = function() {
  if (!permissionNeeded()) {
    prepareSession();
    document.querySelector("#footer").innerHTML = "started";
  }
};

socket.on("predicted gesture", gesture => {
  document.getElementById("footer").innerHTML = "Gesture predicted: " + gesture;
});

function prepareSession() {
  window.addEventListener("devicemotion", recordSensorData);
  const touchPad = document.getElementById("touch-pad");
  touchPad.addEventListener("touchstart", e => {
    document.body.classList.add("touched");
    startRecording();
    interval = setInterval(function() {
      const motionData = `${accelerometerData.x} ${accelerometerData.y} ${accelerometerData.z} ${gyroscopeData.x} ${gyroscopeData.y} ${gyroscopeData.z}`;
      socket.emit("motion data", motionData);
    }, updateFrequency);
  });

  touchPad.addEventListener("touchend", e => {
    document.body.classList.remove("touched");
    socket.emit("end motion data");
    clearInterval(interval);
    stopRecording();
  });
  document.getElementById("header").innerHTML =
    "Press down on the screen while executing a gesture to record data";
  document.getElementById("start-session").style.visibility = "hidden";
}

function startSession() {
  askForPermission();
}

function recordSensorData(e) {
  accelerometerData = e.acceleration;
  gyroscopeData.x = e.rotationRate.beta;
  gyroscopeData.y = e.rotationRate.gamma;
  gyroscopeData.z = e.rotationRate.alpha;

  document.querySelector("#footer").innerHTML = accelerometerData.x;
}

function permissionNeeded() {
  // @ts-ignore
  return typeof DeviceMotionEvent.requestPermission === "function";
}

function askForPermission() {
  if (permissionNeeded()) {
    // @ts-ignore
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == "granted") {
          prepareSession();
        }
      })
      .catch(console.error);
  } else prepareSession();
}

function startRecording() {
  socket.emit("Recording started");
}

function stopRecording() {
  window.removeEventListener("devicemotion", recordSensorData);
  socket.emit("Recording stopped");
}
