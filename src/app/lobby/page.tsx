'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { connectSocket } from '@/lib/socket';

export default function LobbyPage() {
    const [joinCode, setJoinCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    const { username, setConnected } = useConnectionStore();
    const { setRoom, error, setError, isLoading, setLoading } = useLobbyStore();
    const router = useRouter();

    // Redirect if no username
    useEffect(() => {
        if (!username) {
            router.push('/');
        }
    }, [username, router]);

    const setupSocketListeners = useCallback(() => {
        const socket = connectSocket();

        socket.on('connect', () => {
            setConnected(true, socket.id);
        });

        socket.on('room-created', (room) => {
            setRoom(room);
            setCreatedCode(room.code);
            setLoading(false);
            router.push(`/room/${room.code}`);
        });

        socket.on('room-joined', (room) => {
            setRoom(room);
            setLoading(false);
            router.push(`/room/${room.code}`);
        });

        socket.on('error', (message) => {
            setError(message);
            setLoading(false);
        });

        return socket;
    }, [setConnected, setRoom, setLoading, setError, router]);

    useEffect(() => {
        if (!username) return;
        const socket = setupSocketListeners();
        return () => {
            socket.off('connect');
            socket.off('room-created');
            socket.off('room-joined');
            socket.off('error');
        };
    }, [username, setupSocketListeners]);

    const handleCreate = () => {
        setError(null);
        setLoading(true);
        const socket = connectSocket();
        socket.emit('create-room', username);
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) {
            setError('Ingresa el código de la sala');
            return;
        }
        if (code.length !== 4) {
            setError('El código debe tener 4 caracteres');
            return;
        }
        setError(null);
        setLoading(true);
        const socket = connectSocket();
        socket.emit('join-room', { code, username });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(createdCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    if (!username) return null;

    return (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="text-surface-500 hover:text-white transition-colors text-sm mb-4 inline-block"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
                        Lobby
                    </h1>
                    <p className="text-surface-400">
                        Hola, <span className="text-primary-400 font-semibold">{username}</span> 👋
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="glass rounded-2xl p-1.5 flex mb-6">
                    <button
                        onClick={() => { setActiveTab('create'); setError(null); }}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'create'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                : 'text-surface-400 hover:text-white'
                            }`}
                    >
                        🏠 Crear Sala
                    </button>
                    <button
                        onClick={() => { setActiveTab('join'); setError(null); }}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'join'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                : 'text-surface-400 hover:text-white'
                            }`}
                    >
                        🚪 Unirse a Sala
                    </button>
                </div>

                {/* Content */}
                <div className="glass rounded-2xl p-8">
                    {activeTab === 'create' ? (
                        <div className="space-y-5 text-center">
                            <div>
                                <div className="text-4xl mb-3">🎲</div>
                                <h2 className="text-xl font-bold text-white mb-2">
                                    Crear una nueva sala
                                </h2>
                                <p className="text-surface-400 text-sm">
                                    Genera un código único y compártelo con un amigo
                                </p>
                            </div>

                            {createdCode && (
                                <div className="animate-scale-in">
                                    <p className="text-sm text-surface-400 mb-2">Código de sala:</p>
                                    <div
                                        onClick={handleCopy}
                                        className="inline-flex items-center gap-3 px-6 py-3 rounded-xl
                               bg-primary-600/20 border border-primary-400/30 cursor-pointer
                               hover:bg-primary-600/30 transition-all group"
                                    >
                                        <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary-300">
                                            {createdCode}
                                        </span>
                                        <span className="text-surface-400 group-hover:text-white transition-colors text-lg">
                                            {copied ? '✅' : '📋'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleCreate}
                                disabled={isLoading}
                                className="btn-primary w-full text-lg py-4"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span> Creando...
                                    </span>
                                ) : (
                                    '✨ Crear Sala'
                                )}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleJoin} className="space-y-5">
                            <div className="text-center">
                                <div className="text-4xl mb-3">🔑</div>
                                <h2 className="text-xl font-bold text-white mb-2">
                                    Unirse a una sala
                                </h2>
                                <p className="text-surface-400 text-sm">
                                    Ingresa el código que te compartió tu amigo
                                </p>
                            </div>

                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => {
                                    setJoinCode(e.target.value.toUpperCase().slice(0, 4));
                                    setError(null);
                                }}
                                placeholder="XXXX"
                                maxLength={4}
                                className="input-glass"
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={isLoading || joinCode.length !== 4}
                                className="btn-accent w-full text-lg py-4"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span> Uniéndose...
                                    </span>
                                ) : (
                                    '🚀 Unirse'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 text-sm text-center animate-slide-down">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
