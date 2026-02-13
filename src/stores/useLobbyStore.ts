'use client';

import { create } from 'zustand';
import type { Room, Player, GameType } from '@/types';

interface LobbyState {
    currentRoom: Room | null;
    error: string | null;
    isLoading: boolean;
    setRoom: (room: Room | null) => void;
    updatePlayers: (players: Player[]) => void;
    addPlayer: (player: Player) => void;
    removePlayer: (playerId: string) => void;
    setPlayerReady: (playerId: string, isReady: boolean) => void;
    setGameType: (gameType: GameType) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    isHost: (socketId: string | null) => boolean;
    reset: () => void;
}

export const useLobbyStore = create<LobbyState>((set, get) => ({
    currentRoom: null,
    error: null,
    isLoading: false,

    setRoom: (room) => set({ currentRoom: room, error: null }),

    updatePlayers: (players) =>
        set((state) => ({
            currentRoom: state.currentRoom
                ? { ...state.currentRoom, players }
                : null,
        })),

    addPlayer: (player) =>
        set((state) => ({
            currentRoom: state.currentRoom
                ? {
                    ...state.currentRoom,
                    players: [...state.currentRoom.players, player],
                }
                : null,
        })),

    removePlayer: (playerId) =>
        set((state) => ({
            currentRoom: state.currentRoom
                ? {
                    ...state.currentRoom,
                    players: state.currentRoom.players.filter((p) => p.id !== playerId),
                }
                : null,
        })),

    setPlayerReady: (playerId, isReady) =>
        set((state) => ({
            currentRoom: state.currentRoom
                ? {
                    ...state.currentRoom,
                    players: state.currentRoom.players.map((p) =>
                        p.id === playerId ? { ...p, isReady } : p
                    ),
                }
                : null,
        })),

    setGameType: (gameType) =>
        set((state) => ({
            currentRoom: state.currentRoom
                ? { ...state.currentRoom, gameType }
                : null,
        })),

    setError: (error) => set({ error }),
    setLoading: (isLoading) => set({ isLoading }),

    isHost: (socketId) => {
        const room = get().currentRoom;
        return room ? room.hostId === socketId : false;
    },

    reset: () => set({ currentRoom: null, error: null, isLoading: false }),
}));
