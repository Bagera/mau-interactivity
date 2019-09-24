/**
 * Average number of all entries in array
 *
 * @param {number[]} numbers
 * @returns {number} Average number
 */
export function average(numbers) {
  let total = 0;
  numbers.forEach(number => (total += number));
  return total / numbers.length;
}

/**
 * Get center point of object bounding box
 *
 * @param {[number, number, number, number]} bbox - x, y, width, height
 * @return {[number, number]} - x and y coordinates to center point
 */
export function center(bbox) {
  return [bbox[0] + bbox[2] / 2, bbox[1] + bbox[3] / 2];
}

export function head(bbox) {
  return [bbox[0] + bbox[2] / 2, bbox[1] + bbox[3] * 0.1];
}

export function setLoadingMsg(msg, selector = ".loader-message") {
  const node = document.querySelector(selector);
  if (node) {
    node.innerHTML = msg;
  }
  console.log(msg);
}

export function enumerateDevices() {
  // Based on: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }

  // List cameras and microphones.
  navigator.mediaDevices
    .enumerateDevices()
    .then(function(devices) {
      devices.forEach(function(device) {
        if (device.kind !== "videoinput") return;
        console.log(device.label + " id = " + device.deviceId);
      });
    })
    .catch(function(err) {
      console.log(err.name + ": " + err.message);
    });
}

export function calcDistance(pointA, pointB) {
  const base = pointA[0] - pointB[0];
  const height = pointA[1] - pointB[1];

  return Math.sqrt(Math.pow(base, 2) + Math.pow(height, 2));
}
