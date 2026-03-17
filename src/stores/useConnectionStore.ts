'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConnectionState {
    isConnected: boolean;
    socketId: string | null;
    sessionId: string | null;
    username: string;
    setUsername: (username: string) => void;
    setConnected: (connected: boolean, socketId?: string) => void;
    reset: () => void;
}

export const useConnectionStore = create<ConnectionState>()(
    persist(
        (set, get) => ({
            isConnected: false,
            socketId: null,
            sessionId: null,
            username: '',
            setUsername: (username) => {
                const currentSessionId = get().sessionId;
                const newSessionId = currentSessionId || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                set({ username, sessionId: newSessionId });
            },
            setConnected: (isConnected, socketId) =>
                set({ isConnected, socketId: socketId || null }),
            reset: () => set({ isConnected: false, socketId: null, username: '', sessionId: null }),
        }),
        {
            name: 'gameroom-connection-storage',
            partialize: (state) => ({ username: state.username, sessionId: state.sessionId }),
        }
    )
);
