'use client';

interface GenericGameOverProps {
    title: string;
    subtitle: string;
    emoji: string;
    scores: Record<string, number>;
    scoreLabels: [string, string, string];
    onRematch: () => void;
    onLeave: () => void;
}

export default function GenericGameOver({
    title,
    subtitle,
    emoji,
    scores,
    scoreLabels,
    onRematch,
    onLeave,
}: GenericGameOverProps) {
    const keys = Object.keys(scores);
    return (
        <div className="mt-6 animate-slide-up">
            <div className="glass-strong rounded-2xl p-6 text-center">
                <div className="text-5xl mb-3">{emoji}</div>
                <h2 className="text-2xl font-bold mb-1">{title}</h2>
                <p className="text-surface-400 text-sm mb-5">{subtitle}</p>

                <div className="flex justify-center gap-6 mb-6">
                    {scoreLabels.map((label, i) => (
                        <div key={label} className="text-center">
                            <div className={`text-2xl font-bold ${i === 0 ? 'text-primary-300' : i === 2 ? 'text-accent-300' : 'text-surface-400'
                                }`}>
                                {scores[keys[i]] || 0}
                            </div>
                            <div className="text-xs text-surface-500">{label}</div>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <button onClick={onRematch} className="btn-primary w-full py-3">🔄 Revancha</button>
                    <button onClick={onLeave} className="btn-secondary w-full py-3 text-sm">🚪 Salir</button>
                </div>
            </div>
        </div>
    );
}
