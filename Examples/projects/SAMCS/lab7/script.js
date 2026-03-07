const board = document.getElementById("board");
const status = document.getElementById("status");

// NEW: network UI
const netStatus = document.getElementById("netStatus");
const roleEl = document.getElementById("role");

let cells = [];
let currentPlayer = "X";
let boardState = Array(9).fill(null);

// NEW: network state
let mySymbol = null;     // "X" | "O" | "S" (spectator) | null
let gameOver = false;
let ws = null;

function createBoard() {
    board.innerHTML = "";
    cells = [];
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.addEventListener("click", handleMove);
        board.appendChild(cell);
        cells.push(cell);
    }
}

function renderBoard() {
    for (let i = 0; i < 9; i++) {
        cells[i].textContent = boardState[i] ? boardState[i] : "";
    }
}

function canPlayNow() {
    return mySymbol === currentPlayer && !gameOver;
}

function handleMove(event) {
    const index = Number(event.target.dataset.index);

    // Local checks to prevent spam; server is the source of truth.
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!canPlayNow()) return;
    if (boardState[index]) return;

    ws.send(JSON.stringify({ type: "move", index }));
}

// Keep your original win logic (server uses the same logic)
function checkWin() {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winningCombos.some(combo => {
        const [a, b, c] = combo;
        return boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c];
    });
}

function disableBoard() {
    cells.forEach(cell => cell.removeEventListener("click", handleMove));
}

// Network reset: ask server to reset for everyone
function resetGame() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "reset" }));
}

// ===============================
// Network (LAN) WebSocket client
// ===============================
function connect() {
    const proto = (location.protocol === "https:") ? "wss" : "ws";
    const wsUrl = `${proto}://${location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
        netStatus.textContent = "Connected ✅ (waiting for another player if needed)";
    });

    ws.addEventListener("close", () => {
        netStatus.textContent = "Disconnected ❌ (refresh to reconnect)";
        roleEl.textContent = "Role: —";
        mySymbol = null;
        gameOver = true;
        status.textContent = "Disconnected";
    });

    ws.addEventListener("error", () => {
        netStatus.textContent = "Connection error ❌";
    });

    ws.addEventListener("message", (msg) => {
        let data = null;
        try {
            data = JSON.parse(msg.data);
        } catch {
            return;
        }

        if (data.type === "assign") {
            mySymbol = data.symbol; // "X" | "O" | "S"
            roleEl.textContent = `Role: ${mySymbol === "S" ? "Spectator" : "Player " + mySymbol}`;
            return;
        }

        if (data.type === "state") {
            boardState = data.boardState;
            currentPlayer = data.currentPlayer;
            gameOver = data.gameOver;

            status.textContent = data.statusText || `Player ${currentPlayer}'s Turn`;
            renderBoard();

            // Optional: if game is over, disable clicks
            if (gameOver) {
                disableBoard();
            } else {
                // Ensure the board is clickable again after reset
                // (listeners exist because createBoard sets them; disableBoard removes them)
                // So we recreate to restore listeners.
                createBoard();
                renderBoard();
            }

            // Small hint about whose turn locally
            if (mySymbol === "X" || mySymbol === "O") {
                if (!gameOver) {
                    netStatus.textContent = canPlayNow()
                        ? "Your turn ✅"
                        : "Opponent's turn ⏳";
                }
            }

            return;
        }
    });
}

createBoard();
connect();
