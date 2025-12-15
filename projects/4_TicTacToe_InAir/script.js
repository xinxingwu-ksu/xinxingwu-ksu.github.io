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

function onResults(results) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1); // Visually mirror canvas

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    canvasCtx.restore();
    currentHoverIndex = -1;
    hoverStartTime = null;
    return;
  }

  const indexTip = results.multiHandLandmarks[0][8];

  const drawX = indexTip.x * videoElement.videoWidth;
  const drawY = indexTip.y * videoElement.videoHeight;

  // Draw black dot
  canvasCtx.beginPath();
  canvasCtx.arc(drawX, drawY, 10, 0, 2 * Math.PI);
  canvasCtx.fillStyle = 'black';
  canvasCtx.fill();
  canvasCtx.restore();

  // Convert to screen and board space
  const canvasRect = canvasElement.getBoundingClientRect();
  const boardRect = gameBoard.getBoundingClientRect();

  const canvasX = indexTip.x * canvasElement.width;
  const canvasY = indexTip.y * canvasElement.height;

  const screenX = canvasX * (canvasRect.width / canvasElement.width) + canvasRect.left;
  const screenY = canvasY * (canvasRect.height / canvasElement.height) + canvasRect.top;

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

  cellElements.forEach(cell => {
    cell.innerText = '';
    cell.style.color = 'black';
  });
});
