const board = document.getElementById("board");
const status = document.getElementById("status");
let cells = [];
let currentPlayer = "X";
let boardState = Array(9).fill(null);

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

function handleMove(event) {
    const index = event.target.dataset.index;
    if (!boardState[index]) {
        boardState[index] = currentPlayer;
        event.target.textContent = currentPlayer;
        if (checkWin()) {
            status.textContent = `Player ${currentPlayer} Wins!`;
            disableBoard();
            return;
        }
        if (boardState.every(cell => cell)) {
            status.textContent = "It's a Draw!";
            return;
        }
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        status.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

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

function resetGame() {
    boardState.fill(null);
    currentPlayer = "X";
    status.textContent = "Player X's Turn";
    createBoard();
}

createBoard();
