const CMD_WRITE = 0;
const CMD_WRITE_US = 1;
const CMD_READ = 2;
const CMD_DETACH = 3;
const CMD_BEAT = 4;
const minAngle = 1300;
const maxAngle = 1500;
let socket;

let direction = 1;
let beating = true;
let angle = minAngle;
let step = 100;

let beat = {
  active: true,
  spd: 60,
  str: 60,
  atk: 50,
  sus: 50
};

let controls = ["spd", "str", "atk", "sus"];

function updateControls(selectors = controls) {
  selectors.forEach(selector => {
    const el = document.querySelector(`.Control-${selector}`);
    el.querySelector(`.Control-value`).innerHTML = beat[selector];
    el.querySelector(`input`).value = beat[selector];
  });
}

function write(servo, pos) {
  const data = {
    cmd: CMD_WRITE,
    servo,
    pos
  };
  socket.send(JSON.stringify(data));
}

function write_micros(servo, pos) {
  const data = {
    cmd: CMD_WRITE_US,
    servo,
    pos
  };
  socket.send(JSON.stringify(data));
}

function sendBeat({ active, spd, str, atk, sus }) {
  const data = {
    cmd: CMD_BEAT,
    servo: 0,
    active,
    spd,
    str,
    atk,
    sus
  };
  socket.send(JSON.stringify(data));
}

function detach(servo) {
  console.log("Detach " + servo);
  socket.send(
    JSON.stringify({
      cmd: CMD_DETACH,
      servo: servo,
      pos: 0
    })
  );
}

function updateBeat(beat) {
  console.log(beat);
  updateControls();
  sendBeat(beat);
}

window.onload = () => {
  // Emergency stop

  const pulseSpeed = document.querySelector("#speed");
  const pulseStrength = document.querySelector("#strength");
  const btnStartStop = document.querySelector("#btnStartStop");
  const btnSave = document.querySelector("#btnSave");
  const btnDelete = document.querySelector("#btnDelete");

  controls.forEach(selector => {
    const el = document.querySelector(`.Control-${selector} input`);
    el.oninput = evt => {
      beat[selector] = parseInt(evt.target.value);
      updateBeat(beat);
    };
  });

  btnStartStop.onclick = evt => {
    beat.active = !beat.active;
    console.log(beat);
    updateBeat(beat);
  };

  socket = new ReconnectingWebsocket("ws://" + location.host + "/serial");
  socket.addEventListener("message", evt => {
    // console.log(evt.data);
  });

  socket.addEventListener("open", () => {
    console.log("Connected to json-serial-bridge 👍");
    detach(0);
  });
  updateControls();
};
