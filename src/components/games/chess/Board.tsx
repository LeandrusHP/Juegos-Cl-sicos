'use client';

import { useState, useMemo, useCallback } from 'react';

interface ChessBoardProps {
    fen: string;
    isMyTurn: boolean;
    myColor: 'white' | 'black';
    lastMove: { from: string; to: string } | null;
    isCheck: boolean;
    disabled: boolean;
    onMove: (from: string, to: string, promotion?: string) => void;
    capturedPieces: { white: string[]; black: string[] };
    moveHistory: string[];
}

const PIECE_UNICODE: Record<string, string> = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const CAPTURED_UNICODE: Record<string, string> = {
    q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

function fenToBoard(fen: string): (string | null)[][] {
    const rows = fen.split(' ')[0].split('/');
    return rows.map(row => {
        const cells: (string | null)[] = [];
        for (const ch of row) {
            if (/\d/.test(ch)) {
                for (let i = 0; i < parseInt(ch); i++) cells.push(null);
            } else {
                cells.push(ch);
            }
        }
        return cells;
    });
}

function squareToAlg(row: number, col: number): string {
    return String.fromCharCode(97 + col) + (8 - row);
}

export default function ChessBoard({
    fen,
    isMyTurn,
    myColor,
    lastMove,
    isCheck,
    disabled,
    onMove,
    capturedPieces,
    moveHistory,
}: ChessBoardProps) {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [showPromotion, setShowPromotion] = useState<{ from: string; to: string } | null>(null);

    const board = useMemo(() => fenToBoard(fen), [fen]);
    const isFlipped = myColor === 'black';

    const findKingPosition = useCallback((): string | null => {
        const currentTurn = fen.split(' ')[1];
        const kingChar = currentTurn === 'w' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingChar) return squareToAlg(r, c);
            }
        }
        return null;
    }, [board, fen]);

    const kingInCheck = isCheck ? findKingPosition() : null;

    const handleSquareClick = (row: number, col: number) => {
        if (disabled || !isMyTurn) return;

        const alg = squareToAlg(row, col);
        const piece = board[row][col];

        if (selectedSquare) {
            if (alg === selectedSquare) {
                setSelectedSquare(null);
                return;
            }

            // Check for pawn promotion
            const srcRow = 8 - parseInt(selectedSquare[1]);
            const srcPiece = board[srcRow][selectedSquare.charCodeAt(0) - 97];
            const isPawn = srcPiece === 'P' || srcPiece === 'p';
            const isPromotionRow = (srcPiece === 'P' && row === 0) || (srcPiece === 'p' && row === 7);

            if (isPawn && isPromotionRow) {
                setShowPromotion({ from: selectedSquare, to: alg });
                setSelectedSquare(null);
                return;
            }

            onMove(selectedSquare, alg);
            setSelectedSquare(null);
        } else {
            // Select a piece
            if (piece) {
                const isWhitePiece = piece === piece.toUpperCase();
                const canSelect = (myColor === 'white' && isWhitePiece) || (myColor === 'black' && !isWhitePiece);
                if (canSelect) setSelectedSquare(alg);
            }
        }
    };

    const handlePromotion = (piece: string) => {
        if (showPromotion) {
            onMove(showPromotion.from, showPromotion.to, piece);
            setShowPromotion(null);
        }
    };

    const renderBoard = () => {
        const rows = isFlipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
        const cols = isFlipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

        return rows.map(r => (
            <div key={r} className="flex">
                <div className="w-4 sm:w-5 flex items-center justify-center text-[10px] text-surface-500 font-mono">
                    {8 - r}
                </div>
                {cols.map(c => {
                    const alg = squareToAlg(r, c);
                    const piece = board[r][c];
                    const isLight = (r + c) % 2 === 0;
                    const isSelected = selectedSquare === alg;
                    const isLastMove = lastMove && (lastMove.from === alg || lastMove.to === alg);
                    const isKingCheck = kingInCheck === alg;

                    return (
                        <button
                            key={c}
                            onClick={() => handleSquareClick(r, c)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl transition-all relative
                ${isLight ? 'bg-amber-100/80' : 'bg-amber-800/60'}
                ${isSelected ? 'ring-2 ring-primary-400 z-10' : ''}
                ${isLastMove ? 'bg-emerald-400/30' : ''}
                ${isKingCheck ? 'bg-red-500/40 ring-2 ring-red-400' : ''}
                ${!disabled && isMyTurn ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
              `}
                        >
                            {piece && (
                                <span className={`${piece === piece.toUpperCase() ? 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'}`}>
                                    {PIECE_UNICODE[piece]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        ));
    };

    return (
        <div className="glass rounded-2xl p-3 sm:p-4">
            {/* Opponent captured pieces */}
            <div className="flex items-center gap-1 mb-2 min-h-[20px] flex-wrap">
                <span className="text-[10px] text-surface-500">Capturas:</span>
                {capturedPieces[myColor === 'white' ? 'white' : 'black'].map((p, i) => (
                    <span key={i} className="text-sm">{CAPTURED_UNICODE[p] || p}</span>
                ))}
            </div>

            {/* Board */}
            <div className="flex flex-col items-center">
                <div className="border border-surface-700/50 rounded overflow-hidden">
                    {renderBoard()}
                    {/* Column labels */}
                    <div className="flex ml-4 sm:ml-5">
                        {(isFlipped ? 'hgfedcba' : 'abcdefgh').split('').map(l => (
                            <div key={l} className="w-8 sm:w-10 text-center text-[10px] text-surface-500 font-mono">{l}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* My captured pieces */}
            <div className="flex items-center gap-1 mt-2 min-h-[20px] flex-wrap">
                <span className="text-[10px] text-surface-500">Capturas:</span>
                {capturedPieces[myColor === 'white' ? 'black' : 'white'].map((p, i) => (
                    <span key={i} className="text-sm">{CAPTURED_UNICODE[p] || p}</span>
                ))}
            </div>

            {/* Move history */}
            {moveHistory.length > 0 && (
                <div className="mt-3 max-h-20 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                        {moveHistory.map((m, i) => (
                            <span key={i} className={`text-[10px] px-1 rounded font-mono ${i === moveHistory.length - 1 ? 'bg-primary-600/30 text-primary-300' : 'text-surface-500'
                                }`}>
                                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            {showPromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPromotion(null)}>
                    <div className="glass-strong rounded-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <p className="text-sm text-surface-300 mb-3 text-center">Promocionar peón a:</p>
                        <div className="flex gap-3">
                            {['q', 'r', 'b', 'n'].map(p => (
                                <button key={p} onClick={() => handlePromotion(p)}
                                    className="w-14 h-14 rounded-xl bg-white/10 hover:bg-white/20 text-3xl flex items-center justify-center transition-all active:scale-90">
                                    {PIECE_UNICODE[myColor === 'white' ? p.toUpperCase() : p]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
