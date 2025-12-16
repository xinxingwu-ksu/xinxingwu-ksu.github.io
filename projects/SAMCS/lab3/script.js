// AI Tic-Tac-Toe (TensorFlow.js)
// UI intentionally matches the "2 Web version of TicTacToe" project.

// -----------------------------
// DOM
// -----------------------------
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtnEl = document.getElementById("resetBtn");

// -----------------------------
// State
// -----------------------------
let cells = [];
let boardState = Array(9).fill(null);
let currentPlayer = "X"; // Human = X, AI = O
let gameOver = false;

let model = null;
let isTraining = true;
let isAIMoving = false;

// Used to ignore stale AI moves after a reset
let aiTurnToken = 0;

// -----------------------------
// UI
// -----------------------------
function createBoard() {
  boardEl.innerHTML = "";
  cells = [];

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", function () {
      handleMove(i);
    });
    boardEl.appendChild(cell);
    cells.push(cell);
  }
}

function setBoardInteractivity(enabled) {
  cells.forEach(function (cell) {
    if (enabled) cell.classList.remove("disabled");
    else cell.classList.add("disabled");
  });
}

function render() {
  // Draw marks
  for (let i = 0; i < 9; i++) {
    cells[i].textContent = boardState[i] ? boardState[i] : "";
  }

  // Status line (match web UI style)
  if (isTraining) {
    statusEl.textContent = "Training AI model…";
  } else if (gameOver) {
    // statusEl already set to win/draw message
  } else if (currentPlayer === "X") {
    statusEl.textContent = "Player X's Turn";
  } else {
    statusEl.textContent = "Player O's Turn";
  }

  // Interactivity
  const userCanClick = !isTraining && !gameOver && !isAIMoving && currentPlayer === "X";
  setBoardInteractivity(userCanClick);

  // Reset button is always available
  resetBtnEl.disabled = false;
}

// -----------------------------
// Game Logic
// -----------------------------
function checkWin(state) {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  return winningCombos.some(function (combo) {
    const a = combo[0];
    const b = combo[1];
    const c = combo[2];
    return state[a] && state[a] === state[b] && state[a] === state[c];
  });
}

function isDraw(state) {
  return state.every(function (v) {
    return v !== null;
  });
}

function endGame(message) {
  gameOver = true;
  statusEl.textContent = message;
  render();
}

function handleMove(index) {
  if (isTraining || isAIMoving || gameOver) return;
  if (currentPlayer !== "X") return;
  if (boardState[index] !== null) return;

  boardState[index] = "X";
  render();

  if (checkWin(boardState)) {
    endGame("Player X Wins!");
    return;
  }

  if (isDraw(boardState)) {
    endGame("It's a Draw!");
    return;
  }

  currentPlayer = "O";
  render();
  aiMove();
}

function resetGame() {
  aiTurnToken += 1; // cancel any in-flight AI move
  boardState = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;
  isAIMoving = false;

  // Keep training status if training is still running
  if (!isTraining) {
    statusEl.textContent = "Player X's Turn";
  } else {
    statusEl.textContent = "Training AI model…";
  }

  createBoard();
  render();
}

// Make resetGame available for the inline onclick handler in index.html
window.resetGame = resetGame;

// -----------------------------
// AI Model Training (once)
// -----------------------------
async function trainAIModel() {
  isTraining = true;
  render();

  await tf.ready();

  const m = tf.sequential();
  m.add(tf.layers.dense({ inputShape: [9], units: 64, activation: "relu" }));
  m.add(tf.layers.dense({ units: 32, activation: "relu" }));
  m.add(tf.layers.dense({ units: 9, activation: "softmax" }));
  m.compile({ optimizer: "adam", loss: "categoricalCrossentropy" });

  // Tiny synthetic dataset (for demo purposes)
  const inputs = [];
  const outputs = [];

  for (let i = 0; i < 2000; i++) {
    const state = Array(9)
      .fill(null)
      .map(function () {
        return Math.random() > 0.5 ? "X" : "O";
      });

    const move = Math.floor(Math.random() * 9);
    const out = Array(9).fill(0);
    out[move] = 1;

    inputs.push(
      state.map(function (cell) {
        if (cell === "X") return 1;
        if (cell === "O") return -1;
        return 0;
      })
    );
    outputs.push(out);
  }

  const xs = tf.tensor2d(inputs);
  const ys = tf.tensor2d(outputs);

  await m.fit(xs, ys, {
    epochs: 20,
    batchSize: 32,
    callbacks: {
      onEpochEnd: async function (epoch) {
        statusEl.textContent = "Training AI model… (epoch " + (epoch + 1) + "/20)";
        await tf.nextFrame();
      },
    },
  });

  xs.dispose();
  ys.dispose();

  model = m;
  isTraining = false;
  statusEl.textContent = "Player X's Turn";
  render();
}

// -----------------------------
// AI Move
// -----------------------------
async function aiMove() {
  if (isTraining || gameOver || currentPlayer !== "O") return;
  if (!model) return;

  const myToken = aiTurnToken;
  isAIMoving = true;
  render();

  // Small delay to feel natural
  await new Promise(function (r) {
    setTimeout(r, 200);
  });
  if (aiTurnToken !== myToken) return;

  const inputArray = boardState.map(function (cell) {
    if (cell === "X") return 1;
    if (cell === "O") return -1;
    return 0;
  });

  const predictionData = await tf.tidy(async function () {
    const inputTensor = tf.tensor2d([inputArray]);
    const pred = model.predict(inputTensor);
    const data = await pred.data();
    return Array.from(data);
  });

  // Pick the best legal move
  let bestIndex = -1;
  let bestValue = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (boardState[i] !== null) continue;
    if (predictionData[i] > bestValue) {
      bestValue = predictionData[i];
      bestIndex = i;
    }
  }

  // Fallback: first empty
  if (bestIndex === -1) {
    bestIndex = boardState.findIndex(function (v) {
      return v === null;
    });
  }

  if (aiTurnToken !== myToken) return;

  if (bestIndex !== -1) {
    boardState[bestIndex] = "O";
  }

  isAIMoving = false;

  if (checkWin(boardState)) {
    endGame("Player O Wins!");
    return;
  }

  if (isDraw(boardState)) {
    endGame("It's a Draw!");
    return;
  }

  currentPlayer = "X";
  render();
}

// -----------------------------
// Start
// -----------------------------
createBoard();
render();
trainAIModel();
