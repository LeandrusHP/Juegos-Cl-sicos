'use client';

interface ConnectFourBoardProps {
    board: (string | null)[][];
    onColumnClick: (col: number) => void;
    isMyTurn: boolean;
    myColor: string;
    winningLine: number[][] | null;
    lastMove: { row: number; col: number } | null;
    disabled: boolean;
}

export default function ConnectFourBoard({
    board,
    onColumnClick,
    isMyTurn,
    myColor,
    winningLine,
    lastMove,
    disabled,
}: ConnectFourBoardProps) {
    const isWinning = (row: number, col: number) => {
        if (!winningLine) return false;
        return winningLine.some(([r, c]) => r === row && c === col);
    };

    return (
        <div className="glass rounded-2xl p-3 sm:p-4">
            <div className="max-w-[400px] mx-auto">
                {/* Column drop buttons */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {Array(7).fill(null).map((_, col) => (
                        <button
                            key={col}
                            onClick={() => onColumnClick(col)}
                            disabled={disabled || board[0][col] !== null}
                            className={`h-8 rounded-lg flex items-center justify-center text-xl transition-all
                ${!disabled && isMyTurn && board[0][col] === null
                                    ? 'hover:bg-white/10 cursor-pointer active:scale-90'
                                    : 'cursor-not-allowed opacity-30'
                                }`}
                        >
                            ⬇️
                        </button>
                    ))}
                </div>

                {/* Board */}
                <div className="bg-primary-900/50 rounded-xl p-2 border border-primary-700/30">
                    {board.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-7 gap-1 mb-1 last:mb-0">
                            {row.map((cell, ci) => (
                                <div
                                    key={ci}
                                    className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${cell === null
                                            ? 'bg-surface-900/80 border-surface-700/30'
                                            : cell === 'red'
                                                ? `bg-red-500 border-red-400 shadow-lg shadow-red-500/30 ${isWinning(ri, ci) ? 'animate-winning' : ''}`
                                                : `bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-400/30 ${isWinning(ri, ci) ? 'animate-winning' : ''}`
                                        }
                    ${lastMove?.row === ri && lastMove?.col === ci ? 'ring-2 ring-white/50' : ''}
                  `}
                                >
                                    {cell && (
                                        <div className="w-3/4 h-3/4 rounded-full animate-pop-in"
                                            style={{
                                                background: cell === 'red'
                                                    ? 'radial-gradient(circle at 30% 30%, #ff6b6b, #c92a2a)'
                                                    : 'radial-gradient(circle at 30% 30%, #ffd43b, #f59f00)',
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
