'use client';

import { create } from 'zustand';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface GameStoreState {
    gameState: any;
    mySymbol: string | null;
    isMyTurn: boolean;
    opponentDisconnected: boolean;
    rematchRequested: boolean;

    setGameState: (state: any) => void;
    setMySymbol: (symbol: string) => void;
    setOpponentDisconnected: (disconnected: boolean) => void;
    setRematchRequested: (requested: boolean) => void;
    computeIsMyTurn: () => void;
    reset: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
    gameState: null,
    mySymbol: null,
    isMyTurn: false,
    opponentDisconnected: false,
    rematchRequested: false,

    setGameState: (gameState) => {
        set({ gameState });
        const { mySymbol } = get();
        if (mySymbol && gameState?.currentTurn !== undefined) {
            set({ isMyTurn: gameState.currentTurn === mySymbol });
        }
    },

    setMySymbol: (mySymbol) => {
        set({ mySymbol });
        const { gameState } = get();
        if (gameState?.currentTurn !== undefined) {
            set({ isMyTurn: gameState.currentTurn === mySymbol });
        }
    },

    setOpponentDisconnected: (opponentDisconnected) => set({ opponentDisconnected }),
    setRematchRequested: (rematchRequested) => set({ rematchRequested }),

    computeIsMyTurn: () => {
        const { gameState, mySymbol } = get();
        if (gameState?.currentTurn !== undefined && mySymbol) {
            set({ isMyTurn: gameState.currentTurn === mySymbol });
        }
    },

    reset: () =>
        set({
            gameState: null,
            mySymbol: null,
            isMyTurn: false,
            opponentDisconnected: false,
            rematchRequested: false,
        }),
}));
