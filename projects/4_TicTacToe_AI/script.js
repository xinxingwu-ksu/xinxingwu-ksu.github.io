const cells = document.querySelectorAll('[data-cell]');
const board = document.getElementById('board');
const messageElement = document.getElementById('message');
const restartButton = document.getElementById('restartButton');
const difficultySelect = document.getElementById('difficulty');
let currentPlayer = 'X';
let gameBoard = Array(9).fill(null);
let gameActive = true;

cells.forEach(cell => cell.addEventListener('click', handleClick));
restartButton.addEventListener('click', startGame);

function startGame() {
    gameBoard = Array(9).fill(null);
    currentPlayer = 'X';
    gameActive = true;
    messageElement.textContent = '';
    cells.forEach(cell => {
        cell.classList.remove('x', 'o');
        cell.textContent = '';
    });
}

function handleClick(e) {
    const cell = e.target;
    const index = Array.from(cells).indexOf(cell);
    if (gameBoard[index] || !gameActive) return;

    placeMark(cell, index, currentPlayer);
    if (checkWin(currentPlayer)) {
        messageElement.textContent = `${currentPlayer} Wins!`;
        gameActive = false;
        return;
    } else if (gameBoard.every(cell => cell)) {
        messageElement.textContent = `Draw!`;
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

    if (currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
}

function placeMark(cell, index, player) {
    cell.classList.add(player.toLowerCase());
    cell.textContent = player;
    gameBoard[index] = player;
}

function aiMove() {
    let index;
    if (difficultySelect.value === 'easy') {
        index = easyMove();
    } else {
        index = hardMove();
    }
    const cell = cells[index];
    placeMark(cell, index, 'O');

    if (checkWin('O')) {
        messageElement.textContent = `O Wins!`;
        gameActive = false;
    } else if (gameBoard.every(cell => cell)) {
        messageElement.textContent = `Draw!`;
        gameActive = false;
    }

    currentPlayer = 'X';
}

function easyMove() {
    const emptyCells = gameBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function hardMove() {
    return minimax(gameBoard, 'O').index;
}

function minimax(newBoard, player) {
    const emptyCells = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

    if (checkWin('X', newBoard)) return { score: -10 };
    if (checkWin('O', newBoard)) return { score: 10 };
    if (emptyCells.length === 0) return { score: 0 };

    const moves = [];
    emptyCells.forEach(index => {
        const move = { index };
        newBoard[index] = player;
        const result = player === 'O' ? minimax(newBoard, 'X') : minimax(newBoard, 'O');
        move.score = result.score;
        newBoard[index] = null;
        moves.push(move);
    });

    const bestMove = moves.reduce((best, move) =>
        (player === 'O' ? Math.max : Math.min)(move.score, best.score) === move.score ? move : best
    );
    return bestMove;
}

function checkWin(player, board = gameBoard) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return winPatterns.some(pattern => pattern.every(index => board[index] === player));
}

startGame();
