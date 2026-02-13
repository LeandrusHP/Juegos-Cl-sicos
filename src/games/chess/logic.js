// ==========================================
// Chess Game Logic (using chess.js)
// ==========================================

const { Chess } = require('chess.js');

function createInitialState() {
    const chess = new Chess();
    return {
        fen: chess.fen(),
        pgn: chess.pgn(),
        currentTurn: 'white',
        winner: null,
        isDraw: false,
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        lastMove: null,
        capturedPieces: { white: [], black: [] },
        moveHistory: [],
        scores: { white: 0, black: 0, draws: 0 },
    };
}

function makeMove(state, from, to, promotion) {
    const chess = new Chess(state.fen);

    const currentColor = chess.turn() === 'w' ? 'white' : 'black';
    if (currentColor !== state.currentTurn) return null;

    const moveResult = chess.move({ from, to, promotion: promotion || 'q' });
    if (!moveResult) return null;

    // Track captured pieces
    const capturedPieces = { ...state.capturedPieces };
    capturedPieces.white = [...capturedPieces.white];
    capturedPieces.black = [...capturedPieces.black];
    if (moveResult.captured) {
        // The capturing player "has" the opponent's piece
        if (currentColor === 'white') {
            capturedPieces.white.push(moveResult.captured);
        } else {
            capturedPieces.black.push(moveResult.captured);
        }
    }

    const isCheckmate = chess.isCheckmate();
    const isStalemate = chess.isStalemate();
    const isDraw = chess.isDraw();
    const isCheck = chess.isCheck();

    let winner = null;
    const newScores = { ...state.scores };

    if (isCheckmate) {
        winner = currentColor;
        newScores[currentColor]++;
    } else if (isDraw || isStalemate) {
        newScores.draws++;
    }

    return {
        fen: chess.fen(),
        pgn: chess.pgn(),
        currentTurn: chess.turn() === 'w' ? 'white' : 'black',
        winner,
        isDraw: isDraw || isStalemate,
        isCheck,
        isCheckmate,
        isStalemate,
        lastMove: { from, to, piece: moveResult.piece, san: moveResult.san },
        capturedPieces,
        moveHistory: [...state.moveHistory, moveResult.san],
        scores: newScores,
    };
}

function getLegalMoves(fen, square) {
    const chess = new Chess(fen);
    if (square) {
        return chess.moves({ square, verbose: true });
    }
    return chess.moves({ verbose: true });
}

module.exports = { createInitialState, makeMove, getLegalMoves };
