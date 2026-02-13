'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectionStore } from '@/stores/useConnectionStore';

export default function HomePage() {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const setUsername = useConnectionStore((s) => s.setUsername);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Ingresa un nombre para continuar');
            return;
        }
        if (trimmed.length < 2) {
            setError('El nombre debe tener al menos 2 caracteres');
            return;
        }
        if (trimmed.length > 15) {
            setError('El nombre no puede tener más de 15 caracteres');
            return;
        }
        setUsername(trimmed);
        router.push('/lobby');
    };

    return (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md animate-slide-up">
                {/* Logo / Title */}
                <div className="text-center mb-10">
                    <div className="text-6xl mb-4 animate-bounce-subtle">🎮</div>
                    <h1 className="text-5xl sm:text-6xl font-black gradient-text mb-3">
                        GameRoom
                    </h1>
                    <p className="text-surface-400 text-lg">
                        Juega con amigos en tiempo real
                    </p>
                </div>

                {/* Username Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="glass rounded-2xl p-8 space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-surface-300 mb-2"
                            >
                                ¿Cómo te llamas?
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                placeholder="Tu nombre..."
                                maxLength={15}
                                autoFocus
                                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10
                           text-white text-xl font-medium placeholder-white/25
                           focus:outline-none focus:border-primary-400/50 focus:bg-white/10
                           focus:ring-2 focus:ring-primary-400/20 transition-all duration-300"
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-400 animate-slide-down">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full text-lg py-4 rounded-xl"
                        >
                            🚀 Entrar al Lobby
                        </button>
                    </div>
                </form>

                {/* Game preview */}
                <div className="mt-8 text-center">
                    <p className="text-surface-500 text-sm mb-4">Juegos disponibles</p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        {[
                            { icon: '❌⭕', name: 'Tres en Línea' },
                            { icon: '🔴🟡', name: 'Cuatro en Línea' },
                            { icon: '🚢💥', name: 'Batalla Naval' },
                            { icon: '♟️♚', name: 'Ajedrez' },
                            { icon: '📝🪢', name: 'Ahorcado' },
                        ].map((game) => (
                            <div
                                key={game.name}
                                className="glass rounded-xl px-3 py-2 text-xs text-surface-400
                           hover:bg-white/10 transition-all duration-300 cursor-default"
                                title={game.name}
                            >
                                <span className="text-base">{game.icon}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
