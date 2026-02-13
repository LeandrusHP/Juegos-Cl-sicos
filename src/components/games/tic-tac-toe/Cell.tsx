'use client';

import type { CellValue } from '@/types';

interface CellProps {
    value: CellValue;
    index: number;
    onClick: () => void;
    isWinning: boolean;
    isMyTurn: boolean;
    mySymbol: 'X' | 'O';
    disabled: boolean;
}

export default function Cell({
    value,
    onClick,
    isWinning,
    isMyTurn,
    mySymbol,
    disabled,
}: CellProps) {
    const renderSymbol = () => {
        if (!value) return null;

        if (value === 'X') {
            return (
                <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-14 sm:h-14 animate-pop-in">
                    <line
                        x1="20" y1="20" x2="80" y2="80"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="text-primary-400"
                    />
                    <line
                        x1="80" y1="20" x2="20" y2="80"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="text-primary-400"
                    />
                </svg>
            );
        }

        return (
            <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-14 sm:h-14 animate-pop-in">
                <circle
                    cx="50" cy="50" r="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="text-accent-400"
                />
            </svg>
        );
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        aspect-square rounded-xl flex items-center justify-center
        transition-all duration-200 
        ${isWinning
                    ? 'animate-winning'
                    : value
                        ? 'bg-white/5 border border-white/10'
                        : disabled
                            ? 'bg-white/[0.02] border border-white/5 cursor-not-allowed'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer active:scale-95'
                }
        ${!value && isMyTurn && !disabled ? 'hover:shadow-lg hover:shadow-primary-600/10' : ''}
      `}
            aria-label={`Celda ${value || 'vacía'}`}
        >
            {renderSymbol()}
            {/* Hover preview */}
            {!value && isMyTurn && !disabled && (
                <div className="opacity-0 hover:opacity-20 transition-opacity">
                    {mySymbol === 'X' ? (
                        <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-12 sm:h-12">
                            <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-primary-400" />
                            <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-primary-400" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-12 sm:h-12">
                            <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="12" className="text-accent-400" />
                        </svg>
                    )}
                </div>
            )}
        </button>
    );
}
