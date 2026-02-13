'use client';

import type { CellValue } from '@/types';
import Cell from './Cell';

interface BoardProps {
    board: CellValue[];
    onCellClick: (position: number) => void;
    isMyTurn: boolean;
    winningLine: number[] | null;
    mySymbol: 'X' | 'O';
    disabled: boolean;
}

export default function TicTacToeBoard({
    board,
    onCellClick,
    isMyTurn,
    winningLine,
    mySymbol,
    disabled,
}: BoardProps) {
    return (
        <div className="glass rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 aspect-square max-w-[340px] mx-auto">
                {board.map((cell, index) => (
                    <Cell
                        key={index}
                        value={cell}
                        index={index}
                        onClick={() => onCellClick(index)}
                        isWinning={winningLine?.includes(index) || false}
                        isMyTurn={isMyTurn}
                        mySymbol={mySymbol}
                        disabled={disabled || cell !== null}
                    />
                ))}
            </div>
        </div>
    );
}
