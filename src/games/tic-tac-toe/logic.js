// ==========================================
// Tic-Tac-Toe Game Logic (Pure Functions)
// Shared between server and client
// ==========================================

/**
 * Creates the initial game state
 */
function createInitialState() {
    return {
        board: Array(9).fill(null),
        currentTurn: 'X',
        winner: null,
        isDraw: false,
        winningLine: null,
        scores: { X: 0, O: 0, draws: 0 },
    };
}

/**
 * Winning combinations (indices)
 */
const WINNING_LINES = [
    [0, 1, 2], // top row
    [3, 4, 5], // middle row
    [6, 7, 8], // bottom row
    [0, 3, 6], // left col
    [1, 4, 7], // middle col
    [2, 5, 8], // right col
    [0, 4, 8], // diagonal
    [2, 4, 6], // anti-diagonal
];

/**
 * Check if there's a winner
 * @returns { winner, winningLine } or null
 */
function checkWinner(board) {
    for (const line of WINNING_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], winningLine: line };
        }
    }
    return null;
}

/**
 * Check if board is full (draw)
 */
function checkDraw(board) {
    return board.every((cell) => cell !== null);
}

/**
 * Makes a move and returns new state
 * Returns null if move is invalid
 */
function makeMove(state, position, player) {
    // Validate move
    if (state.winner || state.isDraw) return null;
    if (state.currentTurn !== player) return null;
    if (position < 0 || position > 8) return null;
    if (state.board[position] !== null) return null;

    // Apply move
    const newBoard = [...state.board];
    newBoard[position] = player;

    // Check for winner
    const result = checkWinner(newBoard);

    // Check for draw
    const isDraw = !result && checkDraw(newBoard);

    // Calculate new scores
    const newScores = { ...state.scores };
    if (result) {
        newScores[result.winner]++;
    } else if (isDraw) {
        newScores.draws++;
    }

    return {
        board: newBoard,
        currentTurn: player === 'X' ? 'O' : 'X',
        winner: result ? result.winner : null,
        isDraw,
        winningLine: result ? result.winningLine : null,
        scores: newScores,
    };
}

// CommonJS export for server.js
module.exports = { createInitialState, makeMove, checkWinner, checkDraw };
