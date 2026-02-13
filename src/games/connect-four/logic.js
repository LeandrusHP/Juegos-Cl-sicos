// ==========================================
// Connect Four Game Logic (Pure Functions)
// ==========================================

const ROWS = 6;
const COLS = 7;

function createInitialState() {
    return {
        board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
        currentTurn: 'red',
        winner: null,
        isDraw: false,
        winningLine: null,
        lastMove: null,
        scores: { red: 0, yellow: 0, draws: 0 },
    };
}

function getLowestEmptyRow(board, col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === null) return row;
    }
    return -1;
}

function checkWinner(board, row, col, player) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1],  // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
        const line = [[row, col]];

        // Check in positive direction
        for (let i = 1; i < 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
            line.push([r, c]);
        }

        // Check in negative direction
        for (let i = 1; i < 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
            line.push([r, c]);
        }

        if (line.length >= 4) {
            return line;
        }
    }

    return null;
}

function checkDraw(board) {
    return board[0].every(cell => cell !== null);
}

function makeMove(state, col, player) {
    if (state.winner || state.isDraw) return null;
    if (state.currentTurn !== player) return null;
    if (col < 0 || col >= COLS) return null;

    const row = getLowestEmptyRow(state.board, col);
    if (row === -1) return null;

    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = player;

    const winLine = checkWinner(newBoard, row, col, player);
    const isDraw = !winLine && checkDraw(newBoard);

    const newScores = { ...state.scores };
    if (winLine) {
        newScores[player]++;
    } else if (isDraw) {
        newScores.draws++;
    }

    return {
        board: newBoard,
        currentTurn: player === 'red' ? 'yellow' : 'red',
        winner: winLine ? player : null,
        isDraw,
        winningLine: winLine,
        lastMove: { row, col },
        scores: newScores,
    };
}

module.exports = { createInitialState, makeMove, ROWS, COLS };
