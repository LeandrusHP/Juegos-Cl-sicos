'use client';

import { useState } from 'react';

interface BattleshipBoardProps {
    myBoard: {
        ships: (number | null)[][];
        shots: (string | null)[][];
        shipsPlaced: number[];
    };
    opponentBoard: {
        shots: (string | null)[][];
        shipsPlaced: number[];
    };
    phase: string;
    isMyTurn: boolean;
    myRole: string;
    onPlaceShip: (shipIndex: number, row: number, col: number, isHorizontal: boolean) => void;
    onAutoPlace: () => void;
    onShoot: (row: number, col: number) => void;
    disabled: boolean;
    lastShot?: { row: number; col: number; result: string; shooter: string } | null;
}

const SHIP_TYPES = [
    { name: 'Portaaviones', size: 5, emoji: '🚢' },
    { name: 'Acorazado', size: 4, emoji: '⛴️' },
    { name: 'Crucero', size: 3, emoji: '🛳️' },
    { name: 'Submarino', size: 3, emoji: '🤿' },
    { name: 'Destructor', size: 2, emoji: '🚤' },
];

const LETTERS = 'ABCDEFGHIJ';

export default function BattleshipBoard({
    myBoard,
    opponentBoard,
    phase,
    isMyTurn,
    myRole,
    onPlaceShip,
    onAutoPlace,
    onShoot,
    disabled,
    lastShot,
}: BattleshipBoardProps) {
    const [selectedShip, setSelectedShip] = useState<number | null>(null);
    const [isHorizontal, setIsHorizontal] = useState(true);
    const [activeGrid, setActiveGrid] = useState<'mine' | 'opponent'>('mine');

    const renderGrid = (
        grid: (string | number | null)[][],
        shots: (string | null)[][],
        isOpponent: boolean,
        onClick?: (row: number, col: number) => void
    ) => (
        <div>
            {/* Column headers */}
            <div className="grid grid-cols-[24px_repeat(10,1fr)] gap-[2px] mb-[2px]">
                <div />
                {Array(10).fill(null).map((_, i) => (
                    <div key={i} className="text-[10px] text-surface-500 text-center font-mono">{i + 1}</div>
                ))}
            </div>
            {grid.map((row, ri) => (
                <div key={ri} className="grid grid-cols-[24px_repeat(10,1fr)] gap-[2px] mb-[2px]">
                    <div className="text-[10px] text-surface-500 flex items-center justify-center font-mono">{LETTERS[ri]}</div>
                    {row.map((cell, ci) => {
                        const shot = shots?.[ri]?.[ci];
                        const hasShip = !isOpponent && cell !== null;

                        return (
                            <button
                                key={ci}
                                onClick={() => onClick?.(ri, ci)}
                                disabled={!onClick || (isOpponent && shot !== null) || disabled}
                                className={`aspect-square rounded-sm text-[10px] flex items-center justify-center transition-all border
                  ${shot === 'hit'
                                        ? 'bg-red-500/40 border-red-400/50 text-red-300'
                                        : shot === 'miss'
                                            ? 'bg-surface-700/30 border-surface-600/30 text-surface-500'
                                            : hasShip
                                                ? 'bg-primary-600/30 border-primary-400/30'
                                                : isOpponent && onClick && !disabled
                                                    ? 'bg-white/5 border-white/10 hover:bg-primary-500/20 hover:border-primary-400/30 cursor-pointer'
                                                    : 'bg-white/5 border-white/10'
                                    }
                  ${lastShot && lastShot.row === ri && lastShot.col === ci ? 'ring-1 ring-amber-400/50' : ''}
                `}
                            >
                                {shot === 'hit' ? '💥' : shot === 'miss' ? '•' : hasShip ? '▪' : ''}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    if (phase === 'placing') {
        const allPlaced = myBoard.shipsPlaced.length === 5;
        return (
            <div className="glass rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-surface-300 mb-3 text-center">
                    📍 Coloca tus barcos
                </h3>

                {/* Ship selector */}
                <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {SHIP_TYPES.map((ship, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedShip(i)}
                            disabled={myBoard.shipsPlaced.includes(i)}
                            className={`px-2 py-1 rounded-lg text-xs transition-all ${myBoard.shipsPlaced.includes(i)
                                    ? 'bg-surface-800 text-surface-600 line-through'
                                    : selectedShip === i
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white/5 text-surface-300 hover:bg-white/10'
                                }`}
                        >
                            {ship.emoji} {ship.name} ({ship.size})
                        </button>
                    ))}
                </div>

                <div className="flex justify-center gap-2 mb-3">
                    <button
                        onClick={() => setIsHorizontal(!isHorizontal)}
                        className="px-3 py-1 rounded-lg text-xs bg-white/10 text-surface-300 hover:bg-white/20"
                    >
                        🔄 {isHorizontal ? 'Horizontal' : 'Vertical'}
                    </button>
                    <button
                        onClick={onAutoPlace}
                        className="px-3 py-1 rounded-lg text-xs bg-accent-600/20 text-accent-300 hover:bg-accent-600/30"
                    >
                        🎲 Auto-colocar
                    </button>
                </div>

                {renderGrid(
                    myBoard.ships,
                    myBoard.shots,
                    false,
                    selectedShip !== null && !myBoard.shipsPlaced.includes(selectedShip)
                        ? (row, col) => onPlaceShip(selectedShip, row, col, isHorizontal)
                        : undefined
                )}

                {allPlaced && (
                    <p className="text-center text-sm text-emerald-400 mt-3 animate-pulse">
                        ✅ ¡Barcos listos! Esperando al oponente...
                    </p>
                )}
            </div>
        );
    }

    // Playing phase - show both grids with toggle on mobile
    return (
        <div className="space-y-3">
            {/* Mobile tab toggle */}
            <div className="flex gap-1 sm:hidden glass rounded-xl p-1">
                <button
                    onClick={() => setActiveGrid('opponent')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeGrid === 'opponent' ? 'bg-red-600/30 text-red-300' : 'text-surface-400'
                        }`}
                >
                    🎯 Atacar
                </button>
                <button
                    onClick={() => setActiveGrid('mine')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${activeGrid === 'mine' ? 'bg-primary-600/30 text-primary-300' : 'text-surface-400'
                        }`}
                >
                    🛡️ Mi flota
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opponent grid */}
                <div className={`glass rounded-2xl p-3 ${activeGrid !== 'opponent' ? 'hidden sm:block' : ''}`}>
                    <h3 className="text-xs font-semibold text-red-300 mb-2 text-center">🎯 Tablero Enemigo</h3>
                    {renderGrid(
                        Array(10).fill(null).map(() => Array(10).fill(null)),
                        opponentBoard.shots,
                        true,
                        isMyTurn && !disabled ? onShoot : undefined
                    )}
                </div>

                {/* My grid */}
                <div className={`glass rounded-2xl p-3 ${activeGrid !== 'mine' ? 'hidden sm:block' : ''}`}>
                    <h3 className="text-xs font-semibold text-primary-300 mb-2 text-center">🛡️ Mi Flota</h3>
                    {renderGrid(myBoard.ships, myBoard.shots, false)}
                </div>
            </div>
        </div>
    );
}
