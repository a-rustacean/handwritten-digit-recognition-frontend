import init, { predict as _predict } from "../pkg/handwritten_digit_recognition.js";

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {HTMLButtonElement} */
const clearButton = document.getElementById("clear");
/** @type {HTMLInputElement} */
const debugCheckbox = document.getElementById("debug");
/** @type {HTMLParagraphElement} */
const predictionOutput = document.getElementById("prediction");
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width;
canvas.height = rect.height;
let isDrawing = false;
let strokes = [];
let currentStroke = -1;
const lineWidth = 10;
const additionalPadding = 10;
let debug = false;

init();

/**
 * 
 * source: https://stackoverflow.com/a/1480137/16424102
 * 
 * @param {HTMLElement} element
 * @returns {{ top: number, left: number }}
 */
function cumulativeOffset(element) {
  let top = 0;
  let left = 0;

  while (element) {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  };

  return {
    top,
    left
  };
};

const ctx = canvas.getContext("2d");

/**
 *
 * @param {number} x
 * @param {number} y
 */
function start(x, y) {
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
  isDrawing = true;
  strokes[++currentStroke] = [];
  strokes[currentStroke].push([x, y]);
  redraw();
}

/**
 *
 * @param {number} x
 * @param {number} y
 */
function draw(x, y) {
  if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
  if (!isDrawing) return;
  strokes[currentStroke].push([x, y]);
  redraw();
  visualize();
}

function stop() {
  isDrawing = false;
  predict();
}

function clear() {
  strokes = [];
  currentStroke = -1;
  redraw();
}

function predict() {
  const mappedStrokes = strokes.map(stroke => stroke.map(point => ({ x: point[0], y: point[1] }))).flat();
  if (mappedStrokes.length < 2) return;
  const sortedByX = mappedStrokes.sort((a, b) => a.x - b.x);
  const minX = sortedByX[0].x - lineWidth / 2;
  const maxX = sortedByX[sortedByX.length - 1].x + lineWidth / 2;

  const sortedByY = mappedStrokes.sort((a, b) => a.y - b.y);
  const minY = sortedByY[0].y - lineWidth / 2;
  const maxY = sortedByY[sortedByX.length - 1].y + lineWidth / 2;
  const width = maxX - minX;
  const height = maxY - minY;
  const vMax = Math.max(width, height);
  const paddingX = (vMax - width) / 2;
  const paddingY = (vMax - height) / 2;
  const remapSize = 28;

  if (debug) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.rect(minX, minY, width, height);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.rect(minX - paddingX, minY - paddingY, width + 2 * paddingX, height + 2 * paddingY);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.rect(minX - paddingX - additionalPadding, minY - paddingY - additionalPadding, width + 2 * paddingX + 2 * additionalPadding, height + 2 * paddingY + 2 * additionalPadding);
    ctx.stroke();
    ctx.closePath();
  }
  const newCanvas = document.createElement("canvas");
  newCanvas.width = remapSize;
  newCanvas.height = remapSize;
  const newCtx = newCanvas.getContext("2d");
  newCtx.fillStyle = "#000";
  newCtx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  newCtx.strokeStyle = "#fff";
  newCtx.lineCap = "round";
  newCtx.lineJoin = "round";
  newCtx.lineWidth = 2 * remapSize * lineWidth / canvas.width;
  for (const stroke of strokes) {
    newCtx.beginPath();
    newCtx.moveTo(mapRange(stroke[0][0], minX - paddingX - additionalPadding, maxX + paddingX + additionalPadding, 0, remapSize), mapRange(stroke[0][1], minY - paddingY - additionalPadding, maxY + paddingY + additionalPadding, 0, remapSize));
    for (const point of stroke) {
      newCtx.lineTo(mapRange(point[0], minX - paddingX - additionalPadding, maxX + paddingX + additionalPadding, 0, remapSize), mapRange(point[1], minY - paddingY - additionalPadding, maxY + paddingY + additionalPadding, 0, remapSize));
    }
    newCtx.stroke();
    newCtx.closePath();
  }
  const output = document.getElementById("output-image");
  output.innerHTML = "";
  if (debug) {
    newCanvas.style.imageRendering = "pixelated";
    newCanvas.style.width = (3 * remapSize) + "px";
    newCanvas.style.height = (3 * remapSize) + "px";
    output.appendChild(newCanvas);
  }

  const imageData = newCtx.getImageData(0, 0, remapSize, remapSize);
  const data = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    data.push(imageData.data[i]);
  }
  predictionOutput.textContent = `Prediction: ${_predict(data)}`;
}

function visualize() {
  const mappedStrokes = strokes.map(stroke => stroke.map(point => ({ x: point[0], y: point[1] }))).flat();
  if (mappedStrokes.length < 2) return;
  const sortedByX = mappedStrokes.sort((a, b) => a.x - b.x);
  const minX = sortedByX[0].x - lineWidth / 2;
  const maxX = sortedByX[sortedByX.length - 1].x + lineWidth / 2;

  const sortedByY = mappedStrokes.sort((a, b) => a.y - b.y);
  const minY = sortedByY[0].y - lineWidth / 2;
  const maxY = sortedByY[sortedByX.length - 1].y + lineWidth / 2;
  const width = maxX - minX;
  const height = maxY - minY;
  const vMax = Math.max(width, height);
  const paddingX = (vMax - width) / 2;
  const paddingY = (vMax - height) / 2;

  if (debug) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.rect(minX, minY, width, height);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.rect(minX - paddingX, minY - paddingY, width + 2 * paddingX, height + 2 * paddingY);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.rect(minX - paddingX - additionalPadding, minY - paddingY - additionalPadding, width + 2 * paddingX + 2 * additionalPadding, height + 2 * paddingY + 2 * additionalPadding);
    ctx.stroke();
    ctx.closePath();
  }
}

/**
 * 
 * source: https://stackoverflow.com/a/23202637/16424102
 * 
 * @param {number} number
 * @param {number} inMin
 * @param {number} inMax
 * @param {number} outMin
 * @param {number} outMax
 */
function mapRange(number, inMin, inMax, outMin, outMax) {
  return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;
  for (const stroke of strokes) {
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (const point of stroke) {
      ctx.lineTo(point[0], point[1]);
    }
    ctx.stroke();
    ctx.closePath();
  }
}

clearButton.addEventListener("click", clear)

canvas.addEventListener("touchstart", (e) => {
  const offset = cumulativeOffset(canvas);
  start(e.touches[0].clientX - offset.left, e.touches[0].clientY - offset.top);
  e.preventDefault();
});

canvas.addEventListener("touchmove", (e) => {
  const offset = cumulativeOffset(canvas);
  draw(e.touches[0].clientX - offset.left, e.touches[0].clientY - offset.top);
  e.preventDefault();
});

canvas.addEventListener("touchend", (e) => {
  stop();
  e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
  const offset = cumulativeOffset(canvas);
  start(e.pageX - offset.left, e.pageY - offset.top);
  e.preventDefault();
});

canvas.addEventListener("mousemove", (e) => {
  const offset = cumulativeOffset(canvas);
  draw(e.pageX - offset.left, e.pageY - offset.top);
  e.preventDefault();
});

canvas.addEventListener("mouseup", (e) => {
  stop();
  e.preventDefault();
});

debugCheckbox.addEventListener("change", () => {
  debug = debugCheckbox.checked;
  redraw();
  predict();
})
