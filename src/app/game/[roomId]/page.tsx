'use client';

import { useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectionStore } from '@/stores/useConnectionStore';
import { useLobbyStore } from '@/stores/useLobbyStore';
import { useGameStore } from '@/stores/useGameStore';
import { getSocket, connectSocket } from '@/lib/socket';

// Game boards
import TicTacToeBoard from '@/components/games/tic-tac-toe/Board';
import ConnectFourBoard from '@/components/games/connect-four/Board';
import BattleshipBoard from '@/components/games/battleship/Board';
import ChessBoard from '@/components/games/chess/Board';
import HangmanBoard from '@/components/games/hangman/Board';

// Game over overlays
import TicTacToeGameOver from '@/components/games/tic-tac-toe/GameOver';
import GenericGameOver from '@/components/games/GenericGameOver';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { username, socketId } = useConnectionStore();
    const { currentRoom } = useLobbyStore();
    const {
        gameState,
        mySymbol,
        isMyTurn,
        opponentDisconnected,
        setGameState,
        setMySymbol,
        setOpponentDisconnected,
        reset: resetGame,
    } = useGameStore();

    const gameType = currentRoom?.gameType || 'tic-tac-toe';

    useEffect(() => {
        if (!username) { router.push('/'); return; }
        if (!gameState) { router.push('/lobby'); }
    }, [username, gameState, router]);

    const setupListeners = useCallback(() => {
        const socket = connectSocket();
        socket.on('game-state-updated', (newState: any) => setGameState(newState));
        socket.on('game-over', () => { });
        socket.on('game-started', ({ gameState: ns, playerSymbol }: any) => {
            resetGame();
            setGameState(ns);
            setMySymbol(playerSymbol);
        });
        socket.on('opponent-disconnected', () => setOpponentDisconnected(true));
        socket.on('opponent-reconnected', () => setOpponentDisconnected(false));
        return socket;
    }, [setGameState, setMySymbol, setOpponentDisconnected, resetGame]);

    useEffect(() => {
        if (!username) return;
        const socket = setupListeners();
        return () => {
            socket.off('game-state-updated');
            socket.off('game-over');
            socket.off('game-started');
            socket.off('opponent-disconnected');
            socket.off('opponent-reconnected');
        };
    }, [username, setupListeners]);

    const emitMove = (move: any) => {
        getSocket().emit('game-move', { roomCode: roomId, move });
    };

    const handleRematch = () => getSocket().emit('request-rematch', roomId);
    const handleLeave = () => {
        getSocket().emit('leave-room', roomId);
        resetGame();
        useLobbyStore.getState().reset();
        router.push('/lobby');
    };

    if (!username || !gameState || !mySymbol) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass rounded-2xl p-8 text-center animate-pulse">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="text-surface-400">Cargando partida...</p>
                </div>
            </div>
        );
    }

    const gs: any = gameState;
    const opponent = currentRoom?.players.find(p => p.id !== socketId);
    const isGameOver = determineGameOver(gameType, gs);

    // ==========================================
    // GAME-SPECIFIC LABELS
    // ==========================================

    const getGameLabels = () => {
        switch (gameType) {
            case 'tic-tac-toe':
                return {
                    myLabel: `Tú (${mySymbol})`,
                    opLabel: `Rival (${mySymbol === 'X' ? 'O' : 'X'})`,
                    myColor: mySymbol === 'X' ? 'primary' : 'accent',
                    opColor: mySymbol === 'X' ? 'accent' : 'primary',
                    myScore: mySymbol === 'X' ? gs.scores.X : gs.scores.O,
                    opScore: mySymbol === 'X' ? gs.scores.O : gs.scores.X,
                    draws: gs.scores.draws,
                    icon: mySymbol,
                };
            case 'connect-four':
                return {
                    myLabel: `Tú (${mySymbol === 'red' ? '🔴' : '🟡'})`,
                    opLabel: `Rival (${mySymbol === 'red' ? '🟡' : '🔴'})`,
                    myColor: mySymbol === 'red' ? 'primary' : 'accent',
                    opColor: mySymbol === 'red' ? 'accent' : 'primary',
                    myScore: gs.scores[mySymbol],
                    opScore: gs.scores[mySymbol === 'red' ? 'yellow' : 'red'],
                    draws: gs.scores.draws,
                    icon: mySymbol === 'red' ? '🔴' : '🟡',
                };
            case 'chess':
                return {
                    myLabel: `Tú (${mySymbol === 'white' ? '♔' : '♚'})`,
                    opLabel: `Rival (${mySymbol === 'white' ? '♚' : '♔'})`,
                    myColor: mySymbol === 'white' ? 'primary' : 'accent',
                    opColor: mySymbol === 'white' ? 'accent' : 'primary',
                    myScore: gs.scores[mySymbol],
                    opScore: gs.scores[mySymbol === 'white' ? 'black' : 'white'],
                    draws: gs.scores.draws,
                    icon: mySymbol === 'white' ? '♔' : '♚',
                };
            case 'battleship':
                return {
                    myLabel: 'Tú 🚢',
                    opLabel: 'Rival 💣',
                    myColor: 'primary',
                    opColor: 'accent',
                    myScore: gs.scores[mySymbol],
                    opScore: gs.scores[mySymbol === 'player1' ? 'player2' : 'player1'],
                    draws: gs.scores.draws,
                    icon: '🚢',
                };
            case 'hangman':
                return {
                    myLabel: mySymbol === gs.currentTurn ? 'Adivinador 🧠' : 'Observador 👀',
                    opLabel: mySymbol !== gs.currentTurn ? 'Adivinador 🧠' : 'Observador 👀',
                    myColor: 'primary',
                    opColor: 'accent',
                    myScore: gs.scores[mySymbol],
                    opScore: gs.scores[mySymbol === 'player1' ? 'player2' : 'player1'],
                    draws: gs.scores.draws,
                    icon: '📝',
                };
            default:
                return { myLabel: 'Tú', opLabel: 'Rival', myColor: 'primary', opColor: 'accent', myScore: 0, opScore: 0, draws: 0, icon: '🎮' };
        }
    };

    const labels = getGameLabels();

    const getTurnText = () => {
        if (isGameOver) return getGameOverText(gameType, gs, mySymbol);
        if (gameType === 'battleship' && gs.phase === 'placing') return '📍 Coloca tus barcos';
        return isMyTurn ? '🎯 ¡Tu turno!' : '⏳ Turno del oponente...';
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 overflow-y-auto">
            <div className="w-full max-w-lg animate-fade-in">
                {/* Disconnect Warning */}
                {opponentDisconnected && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-300 text-sm text-center animate-slide-down">
                        ⚠️ Tu oponente se ha desconectado
                    </div>
                )}

                {/* Player Info Bar */}
                <div className="glass rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-${labels.myColor}-600/30 text-${labels.myColor}-300`}>
                                {labels.icon}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white">{username}</div>
                                <div className="text-xs text-surface-500">{labels.myLabel}</div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-primary-300">{labels.myScore}</span>
                                <span className="text-surface-600 text-sm">-</span>
                                <span className="text-xl font-bold text-accent-300">{labels.opScore}</span>
                            </div>
                            <div className="text-[10px] text-surface-600 mt-0.5">Empates: {labels.draws}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div>
                                <div className="text-sm font-semibold text-white text-right">{opponent?.username || '???'}</div>
                                <div className="text-xs text-surface-500 text-right">{labels.opLabel}</div>
                            </div>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-${labels.opColor}-600/30 text-${labels.opColor}-300`}>
                                🎮
                            </div>
                        </div>
                    </div>
                </div>

                {/* Turn Indicator */}
                <div className={`text-center mb-4 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${isGameOver ? 'bg-surface-800/50 text-surface-400'
                        : isMyTurn ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 animate-pulse-slow'
                            : 'bg-surface-800/50 text-surface-400'
                    }`}>
                    {getTurnText()}
                </div>

                {/* Game Board */}
                {renderGameBoard(gameType, gs, mySymbol, isMyTurn, isGameOver, emitMove)}

                {/* Game Over */}
                {isGameOver && renderGameOver(gameType, gs, mySymbol, handleRematch, handleLeave)}

                {/* Leave Button */}
                {!isGameOver && (
                    <button onClick={handleLeave}
                        className="mt-6 w-full py-2 rounded-xl text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm">
                        🚪 Abandonar partida
                    </button>
                )}
            </div>
        </div>
    );
}

// ==========================================
// HELPERS
// ==========================================

function determineGameOver(gameType: string, gs: any): boolean {
    switch (gameType) {
        case 'tic-tac-toe':
        case 'connect-four':
            return gs.winner !== null || gs.isDraw;
        case 'chess':
            return gs.winner !== null || gs.isDraw;
        case 'battleship':
            return gs.winner !== null;
        case 'hangman':
            return gs.isFinished;
        default:
            return false;
    }
}

function getGameOverText(gameType: string, gs: any, mySymbol: string): string {
    switch (gameType) {
        case 'tic-tac-toe':
        case 'connect-four':
            return gs.winner ? (gs.winner === mySymbol ? '🏆 ¡Ganaste!' : '😔 Perdiste') : '🤝 ¡Empate!';
        case 'chess':
            return gs.winner ? (gs.winner === mySymbol ? '🏆 ¡Jaque Mate!' : '😔 Jaque Mate') : '🤝 ¡Tablas!';
        case 'battleship':
            return gs.winner === mySymbol ? '🏆 ¡Hundiste toda la flota!' : '😔 Tu flota fue hundida';
        case 'hangman':
            if (gs.winner === 'guesser') return '🏆 ¡Palabra adivinada!';
            return '💀 ¡Ahorcado!';
        default:
            return '';
    }
}

function renderGameBoard(gameType: string, gs: any, mySymbol: string, isMyTurn: boolean, isGameOver: boolean, emitMove: (m: any) => void) {
    switch (gameType) {
        case 'tic-tac-toe':
            return (
                <TicTacToeBoard
                    board={gs.board}
                    onCellClick={(pos: number) => {
                        if (!isMyTurn || isGameOver || gs.board[pos] !== null) return;
                        emitMove({ position: pos, player: mySymbol });
                    }}
                    isMyTurn={isMyTurn}
                    winningLine={gs.winningLine}
                    mySymbol={mySymbol as 'X' | 'O'}
                    disabled={isGameOver || !isMyTurn}
                />
            );
        case 'connect-four':
            return (
                <ConnectFourBoard
                    board={gs.board}
                    onColumnClick={(col: number) => emitMove({ col, player: mySymbol })}
                    isMyTurn={isMyTurn}
                    myColor={mySymbol}
                    winningLine={gs.winningLine}
                    lastMove={gs.lastMove}
                    disabled={isGameOver || !isMyTurn}
                />
            );
        case 'battleship':
            return (
                <BattleshipBoard
                    myBoard={gs.boards?.mine || { ships: [], shots: [], shipsPlaced: [] }}
                    opponentBoard={gs.boards?.opponent || { shots: [], shipsPlaced: [] }}
                    phase={gs.phase}
                    isMyTurn={isMyTurn}
                    myRole={mySymbol}
                    onPlaceShip={(shipIndex, row, col, isHorizontal) =>
                        emitMove({ type: 'place-ship', shipIndex, row, col, isHorizontal })
                    }
                    onAutoPlace={() => emitMove({ type: 'auto-place' })}
                    onShoot={(row, col) => emitMove({ type: 'shoot', row, col })}
                    disabled={isGameOver}
                    lastShot={gs.lastShot}
                />
            );
        case 'chess':
            return (
                <ChessBoard
                    fen={gs.fen}
                    isMyTurn={isMyTurn}
                    myColor={mySymbol as 'white' | 'black'}
                    lastMove={gs.lastMove}
                    isCheck={gs.isCheck}
                    disabled={isGameOver || !isMyTurn}
                    onMove={(from, to, promotion) => emitMove({ from, to, promotion })}
                    capturedPieces={gs.capturedPieces || { white: [], black: [] }}
                    moveHistory={gs.moveHistory || []}
                />
            );
        case 'hangman':
            return (
                <HangmanBoard
                    revealedWord={gs.revealedWord}
                    guessedLetters={gs.guessedLetters}
                    wrongLetters={gs.wrongLetters}
                    wrongCount={gs.wrongCount}
                    maxWrong={gs.maxWrong}
                    hint={gs.hint}
                    isMyTurn={isMyTurn}
                    isGuesser={mySymbol === gs.currentTurn || (gs.isFinished && mySymbol === 'player2')}
                    isFinished={gs.isFinished}
                    winner={gs.winner}
                    word={gs.word}
                    onGuess={(letter) => emitMove({ letter })}
                    disabled={isGameOver}
                />
            );
        default:
            return <div className="text-center text-surface-400">Juego no soportado</div>;
    }
}

function renderGameOver(gameType: string, gs: any, mySymbol: string, onRematch: () => void, onLeave: () => void) {
    if (gameType === 'tic-tac-toe') {
        return (
            <TicTacToeGameOver
                winner={gs.winner}
                isDraw={gs.isDraw}
                mySymbol={mySymbol as 'X' | 'O'}
                scores={gs.scores}
                onRematch={onRematch}
                onLeave={onLeave}
            />
        );
    }

    const iWon = (() => {
        if (gameType === 'hangman') {
            // Complex: depends on who is guesser
            if (gs.winner === 'guesser') return mySymbol === 'player2';
            return mySymbol === 'player1';
        }
        return gs.winner === mySymbol;
    })();

    const isDraw = gs.isDraw || false;

    const configs: Record<string, any> = {
        'connect-four': {
            emoji: iWon ? '🏆' : isDraw ? '🤝' : '😔',
            title: iWon ? '¡Ganaste!' : isDraw ? '¡Empate!' : 'Perdiste',
            subtitle: iWon ? 'Conectaste 4 fichas' : isDraw ? 'El tablero se llenó' : 'Tu rival conectó 4',
            scoreLabels: ['Tú', 'Empates', 'Rival'],
            scores: { a: gs.scores[mySymbol], b: gs.scores.draws, c: gs.scores[mySymbol === 'red' ? 'yellow' : 'red'] },
        },
        'battleship': {
            emoji: iWon ? '🏆' : '😔',
            title: iWon ? '¡Victoria!' : 'Derrota',
            subtitle: iWon ? 'Hundiste toda la flota enemiga' : 'Tu flota fue hundida',
            scoreLabels: ['Tú', 'Empates', 'Rival'],
            scores: { a: gs.scores[mySymbol], b: gs.scores.draws, c: gs.scores[mySymbol === 'player1' ? 'player2' : 'player1'] },
        },
        'chess': {
            emoji: iWon ? '🏆' : isDraw ? '🤝' : '😔',
            title: iWon ? '¡Jaque Mate!' : isDraw ? '¡Tablas!' : 'Jaque Mate',
            subtitle: iWon ? 'Gran partida' : isDraw ? gs.isStalemate ? 'Rey ahogado' : 'Posición tablas' : 'Mejor suerte la próxima',
            scoreLabels: ['Tú', 'Tablas', 'Rival'],
            scores: { a: gs.scores[mySymbol], b: gs.scores.draws, c: gs.scores[mySymbol === 'white' ? 'black' : 'white'] },
        },
        'hangman': {
            emoji: iWon ? '🏆' : '😔',
            title: iWon ? '¡Ganaste!' : 'Perdiste',
            subtitle: gs.winner === 'guesser' ? `La palabra era: ${gs.revealedWord?.join('') || ''}` : `La palabra era: ${gs.revealedWord?.join('') || ''}`,
            scoreLabels: ['Tú', 'Empates', 'Rival'],
            scores: { a: gs.scores[mySymbol], b: gs.scores.draws, c: gs.scores[mySymbol === 'player1' ? 'player2' : 'player1'] },
        },
    };

    const cfg = configs[gameType];
    if (!cfg) return null;

    return (
        <GenericGameOver
            emoji={cfg.emoji}
            title={cfg.title}
            subtitle={cfg.subtitle}
            scoreLabels={cfg.scoreLabels}
            scores={cfg.scores}
            onRematch={onRematch}
            onLeave={onLeave}
        />
    );
}
