/**
 * Draw a dot at x,y
 *
 * @param {[number, number]} cords - x, y
 * @param {CanvasRenderingContext2D} ctx - Target canvas 2d context
 */
export function dot(cords, ctx, opt = {}) {
  opt = Object.assign({ fill: "pink", size: 5 }, opt);
  ctx.fillStyle = opt.fill;
  ctx.beginPath();
  ctx.arc(cords[0], cords[1], opt.size, 0, Math.PI * 2, true);
  ctx.fill();
}

export function circle(cords, ctx, opt = {}) {
  opt = Object.assign({ stroke: "pink", size: 5 }, opt);
  ctx.strokeStyle = opt.stroke;
  ctx.beginPath();
  ctx.arc(cords[0], cords[1], opt.size, 0, Math.PI * 2, true);
  ctx.stroke();
}
/**
 * Draw a line from start to stop
 *
 * @param {[number, number]} start - x, y
 * @param {[number, number]} stop - x, y
 * @param {CanvasRenderingContext2D} ctx - Target canvas 2d context
 */
export function line(start, stop, ctx, opt = {}) {
  opt = Object.assign({ stroke: "pink", width: 3 }, opt);
  ctx.strokeStyle = opt.stroke;
  ctx.lineWidth = opt.width;
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(stop[0], stop[1]);
  ctx.stroke();
}

/**
 * Draw a box around the predicted object
 *
 * @param {object} prediction - Class of prediction, certainty score, bounding box coordinates
 * @param {string} prediction.class
 * @param {number} prediction.score
 * @param {[number, number, number, number]} prediction.bbox - x1, y1, x2, y2
 * @param {CanvasRenderingContext2D} canvasContext - Target canvas 2d context
 */
export function prediction(prediction, canvasContext) {
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
