'use client';

import { create } from 'zustand';

interface ConnectionState {
    isConnected: boolean;
    socketId: string | null;
    username: string;
    setUsername: (username: string) => void;
    setConnected: (connected: boolean, socketId?: string) => void;
    reset: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
    isConnected: false,
    socketId: null,
    username: '',
    setUsername: (username) => set({ username }),
    setConnected: (isConnected, socketId) =>
        set({ isConnected, socketId: socketId || null }),
    reset: () => set({ isConnected: false, socketId: null, username: '' }),
}));
