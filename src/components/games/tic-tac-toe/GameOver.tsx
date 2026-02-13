'use client';

interface GameOverProps {
    winner: 'X' | 'O' | null;
    isDraw: boolean;
    mySymbol: 'X' | 'O';
    scores: { X: number; O: number; draws: number };
    onRematch: () => void;
    onLeave: () => void;
}

export default function GameOver({
    winner,
    isDraw,
    mySymbol,
    scores,
    onRematch,
    onLeave,
}: GameOverProps) {
    const iWon = winner === mySymbol;

    return (
        <div className="mt-6 animate-slide-up">
            <div className="glass-strong rounded-2xl p-6 text-center">
                {/* Result Icon */}
                <div className="text-5xl mb-3">
                    {isDraw ? '🤝' : iWon ? '🏆' : '😔'}
                </div>

                {/* Result Text */}
                <h2 className="text-2xl font-bold mb-1">
                    {isDraw ? (
                        <span className="text-amber-300">¡Empate!</span>
                    ) : iWon ? (
                        <span className="text-emerald-300">¡Victoria!</span>
                    ) : (
                        <span className="text-red-300">Derrota</span>
                    )}
                </h2>
                <p className="text-surface-400 text-sm mb-5">
                    {isDraw
                        ? 'Ninguno pudo ganar esta vez'
                        : iWon
                            ? '¡Excelente juego! 🎉'
                            : 'Mejor suerte la próxima vez'
                    }
                </p>

                {/* Score Summary */}
                <div className="flex justify-center gap-6 mb-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary-300">{scores.X}</div>
                        <div className="text-xs text-surface-500">X</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-surface-400">{scores.draws}</div>
                        <div className="text-xs text-surface-500">Empates</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-accent-300">{scores.O}</div>
                        <div className="text-xs text-surface-500">O</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    <button onClick={onRematch} className="btn-primary w-full py-3">
                        🔄 Revancha
                    </button>
                    <button onClick={onLeave} className="btn-secondary w-full py-3 text-sm">
                        🚪 Salir
                    </button>
                </div>
            </div>
        </div>
    );
}
