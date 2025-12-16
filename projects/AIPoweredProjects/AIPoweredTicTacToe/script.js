const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const gameBoard = document.getElementById('game-board');
const cellElements = Array.from(document.querySelectorAll('.cell'));

let cells = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let currentHoverIndex = -1;
let hoverStartTime = null;

// Smooth the fingertip point so it stays on the tip (less jitter)
let smoothX = null;
let smoothY = null;
const SMOOTH_ALPHA = 0.35; // 0..1 (higher = follows faster, lower = smoother)

// MediaPipe Hands setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});

camera.start();

function mapNormalizedToCoverPixels(xNorm, yNorm, containerW, containerH, videoW, videoH) {
  // Match CSS: object-fit: cover
  const scale = Math.max(containerW / videoW, containerH / videoH);
  const dispW = videoW * scale;
  const dispH = videoH * scale;
  const offsetX = (containerW - dispW) / 2;
  const offsetY = (containerH - dispH) / 2;

  return {
    x: xNorm * dispW + offsetX,
    y: yNorm * dispH + offsetY
  };
}

function onResults(results) {
  const videoRect = videoElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Make canvas match what the user SEE on screen (not the raw video pixels)
  canvasElement.width = Math.round(videoRect.width * dpr);
  canvasElement.height = Math.round(videoRect.height * dpr);
  canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels

  canvasCtx.clearRect(0, 0, videoRect.width, videoRect.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    currentHoverIndex = -1;
    hoverStartTime = null;
    smoothX = null;
    smoothY = null;
    return;
  }

  // Index fingertip landmark
  const indexTip = results.multiHandLandmarks[0][8];

  // Video is mirrored visually, so mirror X in code
  const xNorm = 1 - indexTip.x;
  const yNorm = indexTip.y;

  // Guard: video metadata might not be ready yet
  const vw = videoElement.videoWidth || 640;
  const vh = videoElement.videoHeight || 480;

  const p = mapNormalizedToCoverPixels(xNorm, yNorm, videoRect.width, videoRect.height, vw, vh);

  // Smooth the point so it sticks to the fingertip visually
  if (smoothX === null || smoothY === null) {
    smoothX = p.x;
    smoothY = p.y;
  } else {
    smoothX = smoothX * (1 - SMOOTH_ALPHA) + p.x * SMOOTH_ALPHA;
    smoothY = smoothY * (1 - SMOOTH_ALPHA) + p.y * SMOOTH_ALPHA;
  }

  // Draw black dot (fingertip point)
  canvasCtx.beginPath();
  canvasCtx.arc(smoothX, smoothY, 10, 0, 2 * Math.PI);
  canvasCtx.fillStyle = 'black';
  canvasCtx.fill();

  // Convert to board space using screen coordinates
  const boardRect = gameBoard.getBoundingClientRect();
  const screenX = videoRect.left + smoothX;
  const screenY = videoRect.top + smoothY;

  const relX = screenX - boardRect.left;
  const relY = screenY - boardRect.top;

  const col = Math.floor(relX / (boardRect.width / 3));
  const row = Math.floor(relY / (boardRect.height / 3));
  const index = row * 3 + col;

  if (
    relX < 0 || relY < 0 ||
    col < 0 || col > 2 ||
    row < 0 || row > 2 ||
    gameOver
  ) {
    currentHoverIndex = -1;
    hoverStartTime = null;
    return;
  }

  if (index !== currentHoverIndex) {
    currentHoverIndex = index;
    hoverStartTime = Date.now();
  } else {
    const now = Date.now();
    if (hoverStartTime && now - hoverStartTime > 1000 && !cells[index]) {
      placeMark(index);
      currentHoverIndex = -1;
      hoverStartTime = null;
    }
  }
}

function placeMark(index) {
  cells[index] = currentPlayer;
  cellElements[index].innerText = currentPlayer;
  cellElements[index].style.color = currentPlayer === 'X' ? 'red' : 'blue';
  checkWinner();
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

function checkWinner() {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  for (const [a,b,c] of wins) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      alert(`${cells[a]} wins!`);
      gameOver = true;
      return;
    }
  }

  if (!cells.includes(null)) {
    alert("It's a tie!");
    gameOver = true;
  }
}

document.getElementById('restart').addEventListener('click', () => {
  cells = Array(9).fill(null);
  currentPlayer = 'X';
  gameOver = false;
  currentHoverIndex = -1;
  hoverStartTime = null;
  smoothX = null;
  smoothY = null;

  cellElements.forEach(cell => {
    cell.innerText = '';
    cell.style.color = 'black';
  });
});
