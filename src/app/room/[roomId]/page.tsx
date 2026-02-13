'use client';

import { useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { useGameStore } from '@/stores/useGameStore';
import { getSocket, connectSocket } from '@/lib/socket';
import { GAME_CATALOG } from '@/lib/constants';
import type { GameType } from '@/types';

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { username, socketId } = useConnectionStore();
    const { currentRoom, setRoom, addPlayer, removePlayer, setPlayerReady, setGameType, setError, error } = useLobbyStore();
    const { setGameState, setMySymbol, reset: resetGame } = useGameStore();

    // Redirect if no username
    useEffect(() => {
        if (!username) {
            router.push('/');
        }
    }, [username, router]);

    const setupListeners = useCallback(() => {
        const socket = connectSocket();

        socket.on('player-joined', (player) => {
            addPlayer(player);
        });

        socket.on('player-left', (playerId) => {
            removePlayer(playerId);
        });

        socket.on('player-ready-changed', ({ playerId, isReady }) => {
            setPlayerReady(playerId, isReady);
        });

        socket.on('game-type-changed', (gameType) => {
            setGameType(gameType);
        });

        socket.on('game-started', ({ gameState, playerSymbol }) => {
            resetGame();
            setGameState(gameState);
            setMySymbol(playerSymbol);
            router.push(`/game/${roomId}`);
        });

        socket.on('error', (message) => {
            setError(message);
        });

        return socket;
    }, [addPlayer, removePlayer, setPlayerReady, setGameType, setError, resetGame, setGameState, setMySymbol, roomId, router]);

    useEffect(() => {
        if (!username) return;
        const socket = setupListeners();
        return () => {
            socket.off('player-joined');
            socket.off('player-left');
            socket.off('player-ready-changed');
            socket.off('game-type-changed');
            socket.off('game-started');
            socket.off('error');
        };
    }, [username, setupListeners]);

    const handleToggleReady = () => {
        const socket = getSocket();
        socket.emit('toggle-ready', roomId);
    };

    const handleSetGameType = (gameType: GameType) => {
        const socket = getSocket();
        socket.emit('set-game-type', { roomCode: roomId, gameType });
    };

    const handleStartGame = () => {
        const socket = getSocket();
        socket.emit('start-game', roomId);
    };

    const handleLeave = () => {
        const socket = getSocket();
        socket.emit('leave-room', roomId);
        useLobbyStore.getState().reset();
        router.push('/lobby');
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
        } catch { }
    };

    if (!username || !currentRoom) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass rounded-2xl p-8 text-center animate-pulse">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="text-surface-400">Cargando sala...</p>
                </div>
            </div>
        );
    }

    const isHost = currentRoom.hostId === socketId;
    const allReady = currentRoom.players.length === 2 && currentRoom.players.every(p => p.isReady);
    const mePlayer = currentRoom.players.find(p => p.id === socketId);

    return (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-lg animate-slide-up">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        🏠 Sala de Espera
                    </h1>
                    <div
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-primary-600/20 border border-primary-400/30 cursor-pointer
                       hover:bg-primary-600/30 transition-all"
                        title="Click para copiar"
                    >
                        <span className="text-sm text-surface-400">Código:</span>
                        <span className="font-mono text-xl font-bold tracking-[0.2em] text-primary-300">
                            {currentRoom.code}
                        </span>
                        <span className="text-surface-500">📋</span>
                    </div>
                </div>

                {/* Players */}
                <div className="glass rounded-2xl p-6 mb-6">
                    <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
                        Jugadores ({currentRoom.players.length}/2)
                    </h2>
                    <div className="space-y-3">
                        {currentRoom.players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${player.isReady
                                        ? 'bg-emerald-500/10 border-emerald-400/30'
                                        : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${player.id === socketId
                                            ? 'bg-primary-600/30 text-primary-300'
                                            : 'bg-accent-600/30 text-accent-300'
                                        }`}>
                                        {player.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-white">
                                            {player.username}
                                        </span>
                                        {player.id === currentRoom.hostId && (
                                            <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                                                👑 Host
                                            </span>
                                        )}
                                        {player.id === socketId && (
                                            <span className="ml-2 text-xs text-surface-500">(Tú)</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-sm font-medium ${player.isReady ? 'text-emerald-400' : 'text-surface-500'
                                    }`}>
                                    {player.isReady ? '✅ Listo' : '⏳ Esperando'}
                                </span>
                            </div>
                        ))}

                        {currentRoom.players.length < 2 && (
                            <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-white/10 text-surface-500">
                                <span className="animate-pulse">Esperando al segundo jugador...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Selection (Host Only) */}
                {isHost && (
                    <div className="glass rounded-2xl p-6 mb-6">
                        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
                            Seleccionar Juego
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {GAME_CATALOG.map((game) => (
                                <button
                                    key={game.id}
                                    onClick={() => game.available && handleSetGameType(game.id)}
                                    disabled={!game.available}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${currentRoom.gameType === game.id
                                            ? 'bg-primary-600/20 border-primary-400/30 text-white'
                                            : game.available
                                                ? 'bg-white/5 border-white/10 text-surface-300 hover:bg-white/10 hover:border-white/20'
                                                : 'bg-white/[0.02] border-white/5 text-surface-600 cursor-not-allowed'
                                        }`}
                                >
                                    <span className="text-2xl">{game.icon}</span>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{game.name}</div>
                                        <div className="text-xs text-surface-500">{game.description}</div>
                                    </div>
                                    {!game.available && (
                                        <span className="text-xs bg-surface-800 text-surface-500 px-2 py-1 rounded-full">
                                            Pronto
                                        </span>
                                    )}
                                    {currentRoom.gameType === game.id && (
                                        <span className="text-primary-400">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Not host - show selected game */}
                {!isHost && currentRoom.gameType && (
                    <div className="glass rounded-2xl p-6 mb-6">
                        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-3">
                            Juego Seleccionado
                        </h2>
                        {(() => {
                            const game = GAME_CATALOG.find(g => g.id === currentRoom.gameType);
                            return game ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-600/10 border border-primary-400/20">
                                    <span className="text-2xl">{game.icon}</span>
                                    <div>
                                        <div className="font-semibold text-white">{game.name}</div>
                                        <div className="text-xs text-surface-400">{game.description}</div>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleToggleReady}
                        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300
                       active:scale-[0.97] ${mePlayer?.isReady
                                ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
                                : 'btn-primary'
                            }`}
                    >
                        {mePlayer?.isReady ? '✅ ¡Estoy Listo! (click para cancelar)' : '🎯 Estoy Listo'}
                    </button>

                    {isHost && (
                        <button
                            onClick={handleStartGame}
                            disabled={!allReady}
                            className="btn-accent w-full text-lg py-4"
                        >
                            {allReady ? '🎮 ¡Iniciar Partida!' : '⏳ Esperando a que todos estén listos...'}
                        </button>
                    )}

                    <button
                        onClick={handleLeave}
                        className="w-full py-3 rounded-xl font-medium text-surface-500 hover:text-red-400
                       hover:bg-red-500/10 border border-transparent hover:border-red-400/20
                       transition-all duration-300 text-sm"
                    >
                        🚪 Salir de la Sala
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 text-sm text-center animate-slide-down">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
