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
  str: 1
};

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

function sendBeat({ active, spd, str }) {
  const data = {
    cmd: CMD_BEAT,
    servo: 0,
    active,
    spd,
    str
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

window.onload = () => {
  // Emergency stop

  const pulseSpeed = document.querySelector("#speed");
  const pulseStrength = document.querySelector("#strength");
  const btnStartStop = document.querySelector("#btnStartStop");
  const btnSave = document.querySelector("#btnSave");
  const btnDelete = document.querySelector("#btnDelete");
  const post = document.querySelector("#post");

  post.oninput = evt => {
    const postMsg = evt.target.value;
    console.log(postMsg.length);
  };

  btnSave.onmouseover = evt => {
    beat.spd -= 20;
    sendBeat(beat);
  };

  btnSave.onmouseout = evt => {
    beat.spd += 20;
    sendBeat(beat);
  };

  btnDelete.onmouseover = evt => {
    beat.str += 0.3;
    sendBeat(beat);
  };

  btnDelete.onmouseout = evt => {
    beat.str -= 0.3;
    sendBeat(beat);
  };

  pulseSpeed.oninput = evt => {
    beat.spd = evt.target.value;
    console.log(beat);
    sendBeat(beat);
  };

  pulseStrength.oninput = evt => {
    beat.str = evt.target.value / 100;
    console.log(beat);
    sendBeat(beat);
  };

  btnStartStop.onclick = evt => {
    beat.active = !beat.active;
    console.log(beat);
    sendBeat(beat);
  };

  socket = new ReconnectingWebsocket("ws://" + location.host + "/serial");
  socket.addEventListener("message", evt => {
    // console.log(evt.data);
  });

  socket.addEventListener("open", () => {
    console.log("Connected to json-serial-bridge 👍");
    detach(0);
  });
};
