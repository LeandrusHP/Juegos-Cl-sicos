// ==========================================
// GameRoom - Shared TypeScript Types
// ==========================================

export type GameType = 'tic-tac-toe' | 'battleship' | 'connect-four' | 'chess' | 'hangman';

export interface Player {
    id: string;
    username: string;
    isReady: boolean;
}

export interface Room {
    id: string;
    code: string;
    players: Player[];
    gameType: GameType | null;
    status: 'waiting' | 'playing' | 'finished';
    hostId: string;
}

// Tic-Tac-Toe Types
export type CellValue = 'X' | 'O' | null;
export type TicTacToeBoard = CellValue[];

export interface TicTacToeState {
    board: TicTacToeBoard;
    currentTurn: 'X' | 'O';
    winner: 'X' | 'O' | null;
    isDraw: boolean;
    winningLine: number[] | null;
    scores: { X: number; O: number; draws: number };
}

export interface GameMove {
    position: number;
    player: 'X' | 'O';
}

// Game catalog metadata
export interface GameInfo {
    id: GameType;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    icon: string;
    available: boolean;
}

// Socket Events
export interface ServerToClientEvents {
    'room-created': (room: Room) => void;
    'room-joined': (room: Room) => void;
    'player-joined': (player: Player) => void;
    'player-left': (playerId: string) => void;
    'player-ready-changed': (data: { playerId: string; isReady: boolean }) => void;
    'game-type-changed': (gameType: GameType) => void;
    'game-started': (data: { gameState: TicTacToeState; playerSymbol: 'X' | 'O' }) => void;
    'game-state-updated': (gameState: TicTacToeState) => void;
    'game-over': (data: { winner: 'X' | 'O' | null; isDraw: boolean; winningLine: number[] | null }) => void;
    'rematch-started': (gameState: TicTacToeState) => void;
    'opponent-disconnected': () => void;
    'opponent-reconnected': () => void;
    'error': (message: string) => void;
}

export interface ClientToServerEvents {
    'create-room': (username: string) => void;
    'join-room': (data: { code: string; username: string }) => void;
    'toggle-ready': (roomCode: string) => void;
    'set-game-type': (data: { roomCode: string; gameType: GameType }) => void;
    'start-game': (roomCode: string) => void;
    'game-move': (data: { roomCode: string; move: GameMove }) => void;
    'request-rematch': (roomCode: string) => void;
    'leave-room': (roomCode: string) => void;
}
