import { GameInfo } from '@/types';

export const GAME_CATALOG: GameInfo[] = [
    {
        id: 'tic-tac-toe',
        name: 'Tres en Línea',
        description: 'El clásico juego de gato. ¡Haz tres en fila para ganar!',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '❌⭕',
        available: true,
    },
    {
        id: 'connect-four',
        name: 'Cuatro en Línea',
        description: 'Deja caer fichas y conecta cuatro en fila.',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '🔴🟡',
        available: true,
    },
    {
        id: 'battleship',
        name: 'Batalla Naval',
        description: 'Hunde la flota de tu oponente antes que él hunda la tuya.',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '🚢💥',
        available: true,
    },
    {
        id: 'chess',
        name: 'Ajedrez',
        description: 'El juego de estrategia por excelencia.',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '♟️♚',
        available: true,
    },
    {
        id: 'hangman',
        name: 'Ahorcado',
        description: 'Adivina la palabra antes de que se complete el dibujo.',
        minPlayers: 2,
        maxPlayers: 2,
        icon: '📝🪢',
        available: true,
    },
];

export const SOCKET_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
