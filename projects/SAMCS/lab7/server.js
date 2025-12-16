// server.js
// Simple LAN Tic-Tac-Toe server using Express + WebSocket (ws).
// Run: npm install && npm start
// Then open on two devices in the same network:
//   http://<YOUR_LAN_IP>:3000

const path = require("path");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

// Serve your existing front-end files (index.html, script.js, styles.css)
app.use(express.static(__dirname));

// ---- Game state (single shared game) ----
let boardState = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;

// track sockets -> symbol
const socketSymbol = new Map(); // ws -> "X" | "O" | "S"

function checkWin(state) {
  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return winningCombos.some(([a, b, c]) =>
    state[a] && state[a] === state[b] && state[a] === state[c]
  );
}

function playersConnected() {
  let x = false, o = false;
  for (const sym of socketSymbol.values()) {
    if (sym === "X") x = true;
    if (sym === "O") o = true;
  }
  return { x, o };
}

function statusText() {
  const { x, o } = playersConnected();
  if (!x || !o) return "Waiting for two players to connect…";
  if (gameOver) {
    if (checkWin(boardState)) return `Player ${currentPlayer} Wins!`; // currentPlayer will have been left as winner when game ends
    if (boardState.every(Boolean)) return "It's a Draw!";
    return "Game over";
  }
  return `Player ${currentPlayer}'s Turn`;
}

function broadcastState(extraText = null) {
  const payload = JSON.stringify({
    type: "state",
    boardState,
    currentPlayer,
    gameOver,
    statusText: extraText || statusText()
  });

  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

function resetGame() {
  boardState = Array(9).fill(null);
  currentPlayer = "X";
  gameOver = false;
}

function assignSymbol() {
  // Give X to first, O to second, others spectators.
  let hasX = false, hasO = false;
  for (const sym of socketSymbol.values()) {
    if (sym === "X") hasX = true;
    if (sym === "O") hasO = true;
  }
  if (!hasX) return "X";
  if (!hasO) return "O";
  return "S";
}

wss.on("connection", (ws) => {
  const sym = assignSymbol();
  socketSymbol.set(ws, sym);

  ws.send(JSON.stringify({ type: "assign", symbol: sym }));
  broadcastState(); // update waiting text/turn

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const mySym = socketSymbol.get(ws);

    if (msg.type === "reset") {
      resetGame();
      broadcastState();
      return;
    }

    if (msg.type === "move") {
      const index = Number(msg.index);
      if (!Number.isInteger(index) || index < 0 || index > 8) return;

      // Validate
      if (gameOver) return;
      if (mySym !== "X" && mySym !== "O") return;          // spectators can't play
      if (mySym !== currentPlayer) return;                 // not your turn
      if (boardState[index]) return;                        // occupied
      // also require both players present
      const { x, o } = playersConnected();
      if (!x || !o) return;

      // Apply move
      boardState[index] = mySym;

      // Check end conditions
      if (checkWin(boardState)) {
        gameOver = true;
        // Keep currentPlayer as the winner symbol
        broadcastState(`Player ${mySym} Wins!`);
        return;
      }

      if (boardState.every(Boolean)) {
        gameOver = true;
        broadcastState("It's a Draw!");
        return;
      }

      // Switch turn
      currentPlayer = (currentPlayer === "X") ? "O" : "X";
      broadcastState();
      return;
    }
  });

  ws.on("close", () => {
    const leaving = socketSymbol.get(ws);
    socketSymbol.delete(ws);

    // If a player leaves, reset the game so the next join starts clean
    if (leaving === "X" || leaving === "O") {
      resetGame();
    }

    broadcastState();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`LAN Tic-Tac-Toe running on: http://localhost:${PORT}`);
  console.log("Open from another device on the same Wi‑Fi/LAN using your computer's LAN IP.");
});
