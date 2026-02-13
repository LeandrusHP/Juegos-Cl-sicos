// ==========================================
// GameRoom - Custom Express + Socket.io Server
// Multi-game support
// ==========================================

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

// Game logic modules
const ticTacToe = require('./src/games/tic-tac-toe/logic');
const connectFour = require('./src/games/connect-four/logic');
const battleship = require('./src/games/battleship/logic');
const chess = require('./src/games/chess/logic');
const hangman = require('./src/games/hangman/logic');

const gameEngines = {
    'tic-tac-toe': ticTacToe,
    'connect-four': connectFour,
    'battleship': battleship,
    'chess': chess,
    'hangman': hangman,
};

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));
    return code;
}

function serializeRoom(room) {
    return {
        id: room.id,
        code: room.code,
        players: room.players,
        gameType: room.gameType,
        status: room.status,
        hostId: room.hostId,
    };
}

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);
    const io = new Server(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Connected: ${socket.id}`);

        // ==================
        // ROOM MANAGEMENT
        // ==================

        socket.on('create-room', (username) => {
            const code = generateRoomCode();
            const room = {
                id: code,
                code,
                players: [{ id: socket.id, username, isReady: false }],
                gameType: 'tic-tac-toe',
                status: 'waiting',
                hostId: socket.id,
                gameState: null,
                playerSymbols: {},
                rematchVotes: new Set(),
            };
            rooms.set(code, room);
            socket.join(code);
            socket.roomCode = code;
            socket.emit('room-created', serializeRoom(room));
            console.log(`🏠 Room ${code} created by ${username}`);
        });

        socket.on('join-room', ({ code, username }) => {
            const upperCode = code.toUpperCase();
            const room = rooms.get(upperCode);
            if (!room) return socket.emit('error', 'Sala no encontrada. Verifica el código.');
            if (room.players.length >= 2) return socket.emit('error', 'La sala está llena.');
            if (room.status === 'playing') return socket.emit('error', 'La partida ya ha comenzado.');

            const player = { id: socket.id, username, isReady: false };
            room.players.push(player);
            socket.join(upperCode);
            socket.roomCode = upperCode;
            socket.emit('room-joined', serializeRoom(room));
            socket.to(upperCode).emit('player-joined', player);
            console.log(`👤 ${username} joined ${upperCode}`);
        });

        socket.on('toggle-ready', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;
            player.isReady = !player.isReady;
            io.to(roomCode).emit('player-ready-changed', { playerId: socket.id, isReady: player.isReady });
        });

        socket.on('set-game-type', ({ roomCode, gameType }) => {
            const room = rooms.get(roomCode);
            if (!room || room.hostId !== socket.id) return;
            room.gameType = gameType;
            io.to(roomCode).emit('game-type-changed', gameType);
        });

        // ==================
        // START GAME
        // ==================

        socket.on('start-game', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room || room.hostId !== socket.id) return;
            if (room.players.length < 2 || !room.players.every(p => p.isReady)) return;

            const engine = gameEngines[room.gameType];
            if (!engine) return;

            room.status = 'playing';
            room.gameState = engine.createInitialState();
            room.rematchVotes = new Set();

            // Assign symbols/roles based on game type
            const p1 = room.players[0].id;
            const p2 = room.players[1].id;

            switch (room.gameType) {
                case 'tic-tac-toe':
                    room.playerSymbols = { [p1]: 'X', [p2]: 'O' };
                    break;
                case 'connect-four':
                    room.playerSymbols = { [p1]: 'red', [p2]: 'yellow' };
                    break;
                case 'battleship':
                    room.playerSymbols = { [p1]: 'player1', [p2]: 'player2' };
                    break;
                case 'chess':
                    room.playerSymbols = { [p1]: 'white', [p2]: 'black' };
                    break;
                case 'hangman':
                    room.playerSymbols = { [p1]: 'player1', [p2]: 'player2' };
                    // Player2 guesses, Player1 watches the word
                    room.gameState.currentTurn = 'player2';
                    break;
            }

            // Preserve scores from rematches
            if (room.previousScores) {
                room.gameState.scores = room.previousScores;
                room.previousScores = null;
            }

            // Send game state to each player
            room.players.forEach(player => {
                const symbol = room.playerSymbols[player.id];
                const payload = { gameState: room.gameState, playerSymbol: symbol };

                // For battleship, only send own ships, not opponent's
                if (room.gameType === 'battleship') {
                    payload.gameState = getBattleshipView(room.gameState, symbol);
                }
                // For hangman, don't reveal the word to the guesser
                if (room.gameType === 'hangman' && symbol === 'player2') {
                    payload.gameState = { ...room.gameState, word: undefined };
                }

                io.to(player.id).emit('game-started', payload);
            });

            console.log(`🎮 ${room.gameType} started in ${roomCode}`);
        });

        // ==================
        // GAME MOVE (unified)
        // ==================

        socket.on('game-move', ({ roomCode, move }) => {
            const room = rooms.get(roomCode);
            if (!room || !room.gameState) return;

            const symbol = room.playerSymbols[socket.id];
            if (!symbol) return;

            let newState = null;

            switch (room.gameType) {
                case 'tic-tac-toe': {
                    if (symbol !== move.player) return;
                    newState = ticTacToe.makeMove(room.gameState, move.position, move.player);
                    break;
                }
                case 'connect-four': {
                    if (symbol !== move.player) return;
                    newState = connectFour.makeMove(room.gameState, move.col, move.player);
                    break;
                }
                case 'battleship': {
                    if (move.type === 'place-ship') {
                        newState = battleship.placeShip(room.gameState, symbol, move.shipIndex, move.row, move.col, move.isHorizontal);
                    } else if (move.type === 'auto-place') {
                        newState = battleship.autoPlaceShips(room.gameState, symbol);
                    } else if (move.type === 'shoot') {
                        newState = battleship.shoot(room.gameState, symbol, move.row, move.col);
                    }
                    break;
                }
                case 'chess': {
                    newState = chess.makeMove(room.gameState, move.from, move.to, move.promotion);
                    break;
                }
                case 'hangman': {
                    newState = hangman.guessLetter(room.gameState, move.letter, symbol);
                    break;
                }
            }

            if (!newState) {
                socket.emit('error', 'Movimiento inválido.');
                return;
            }

            room.gameState = newState;

            // Send appropriate views to each player
            room.players.forEach(player => {
                const playerSymbol = room.playerSymbols[player.id];
                let stateView = newState;

                if (room.gameType === 'battleship') {
                    stateView = getBattleshipView(newState, playerSymbol);
                }
                if (room.gameType === 'hangman' && playerSymbol === 'player2' && !newState.isFinished) {
                    stateView = { ...newState, word: undefined };
                }

                io.to(player.id).emit('game-state-updated', stateView);
            });

            // Check game over
            const isOver = checkGameOver(room.gameType, newState);
            if (isOver) {
                room.status = 'finished';
                room.rematchVotes.clear();
                io.to(roomCode).emit('game-over', isOver);
                console.log(`🏆 Game over in ${roomCode}`);
            }
        });

        // ==================
        // REMATCH
        // ==================

        socket.on('request-rematch', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room) return;

            room.rematchVotes.add(socket.id);
            if (room.rematchVotes.size >= 2) {
                const prevScores = room.gameState ? { ...room.gameState.scores } : null;
                const engine = gameEngines[room.gameType];
                if (!engine) return;

                room.status = 'playing';
                room.gameState = engine.createInitialState();
                if (prevScores) room.gameState.scores = prevScores;
                room.rematchVotes.clear();

                // Swap roles
                const entries = Object.entries(room.playerSymbols);
                if (room.gameType === 'tic-tac-toe') {
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'X' ? 'O' : 'X',
                        [entries[1][0]]: entries[1][1] === 'X' ? 'O' : 'X',
                    };
                } else if (room.gameType === 'connect-four') {
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'red' ? 'yellow' : 'red',
                        [entries[1][0]]: entries[1][1] === 'red' ? 'yellow' : 'red',
                    };
                } else if (room.gameType === 'chess') {
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'white' ? 'black' : 'white',
                        [entries[1][0]]: entries[1][1] === 'white' ? 'black' : 'white',
                    };
                } else if (room.gameType === 'hangman') {
                    // Swap guesser/picker roles
                    room.gameState.currentTurn = room.playerSymbols[entries[1][0]] === 'player2' ? 'player1' : 'player2';
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'player1' ? 'player2' : 'player1',
                        [entries[1][0]]: entries[1][1] === 'player1' ? 'player2' : 'player1',
                    };
                }

                room.players.forEach(player => {
                    const sym = room.playerSymbols[player.id];
                    const payload = { gameState: room.gameState, playerSymbol: sym };

                    if (room.gameType === 'battleship') {
                        payload.gameState = getBattleshipView(room.gameState, sym);
                    }
                    if (room.gameType === 'hangman' && sym === 'player2') {
                        payload.gameState = { ...room.gameState, word: undefined };
                    }

                    io.to(player.id).emit('game-started', payload);
                });

                console.log(`🔄 Rematch in ${roomCode}`);
            }
        });

        // ==================
        // LEAVE / DISCONNECT
        // ==================

        socket.on('leave-room', (roomCode) => handlePlayerLeave(socket, roomCode));
        socket.on('disconnect', () => {
            console.log(`❌ Disconnected: ${socket.id}`);
            if (socket.roomCode) handlePlayerLeave(socket, socket.roomCode);
        });
    });

    function handlePlayerLeave(socket, roomCode) {
        const room = rooms.get(roomCode);
        if (!room) return;
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(roomCode);
        socket.roomCode = null;
        if (room.players.length === 0) {
            rooms.delete(roomCode);
        } else {
            io.to(roomCode).emit('player-left', socket.id);
            io.to(roomCode).emit('opponent-disconnected');
            if (room.status === 'playing') room.status = 'finished';
            if (room.hostId === socket.id) room.hostId = room.players[0].id;
        }
    }

    // ==================
    // HELPER FUNCTIONS
    // ==================

    function getBattleshipView(state, playerKey) {
        const opponentKey = playerKey === 'player1' ? 'player2' : 'player1';
        return {
            ...state,
            boards: {
                mine: state.boards[playerKey],
                opponent: {
                    ships: null, // Hide opponent ships
                    shots: state.boards[opponentKey].shots,
                    shipsPlaced: state.boards[opponentKey].shipsPlaced,
                },
            },
        };
    }

    function checkGameOver(gameType, state) {
        switch (gameType) {
            case 'tic-tac-toe':
            case 'connect-four':
                if (state.winner || state.isDraw) {
                    return { winner: state.winner, isDraw: state.isDraw, winningLine: state.winningLine };
                }
                return null;
            case 'battleship':
                if (state.winner) return { winner: state.winner, isDraw: false };
                return null;
            case 'chess':
                if (state.winner || state.isDraw) {
                    return { winner: state.winner, isDraw: state.isDraw, isCheckmate: state.isCheckmate };
                }
                return null;
            case 'hangman':
                if (state.isFinished) return { winner: state.winner, isDraw: false };
                return null;
            default:
                return null;
        }
    }

    server.all('*', (req, res) => handle(req, res));
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`\n🎮 GameRoom server running on http://localhost:${PORT}\n`);
    });
});
