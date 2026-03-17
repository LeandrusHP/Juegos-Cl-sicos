// ==========================================
// GameRoom - Custom Express + Socket.io Server
// Multi-game support with Reconnection
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
const sessions = new Map(); // sessionId -> { socketId, username, roomCode, disconnectTimer }

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
        players: room.players.map(p => ({
            id: p.id,
            username: p.username,
            isReady: p.isReady,
            connected: p.connected
        })),
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
        const { sessionId, username } = socket.handshake.auth;
        
        if (!sessionId) {
            console.log(`❌ Disconnecting socket ${socket.id} due to missing sessionId`);
            socket.disconnect();
            return;
        }

        socket.sessionId = sessionId;
        let session = sessions.get(sessionId);

        if (session) {
            console.log(`🔌 Reconnected: ${username || session.username} (${sessionId})`);
            if (session.disconnectTimer) {
                clearTimeout(session.disconnectTimer);
                session.disconnectTimer = null;
            }
            session.socketId = socket.id;
            if (username && username !== session.username) {
                session.username = username;
            }
            
            // Rejoin room if part of one
            if (session.roomCode) {
                socket.join(session.roomCode);
                socket.roomCode = session.roomCode;
                const room = rooms.get(session.roomCode);
                
                if (room) {
                    const player = room.players.find(p => p.id === sessionId);
                    if (player) {
                        player.socketId = socket.id;
                        player.connected = true;
                        
                        // Let everyone know this player is back online
                        io.to(session.roomCode).emit('player-reconnected', sessionId);
                        
                        // Send the full room state to help them catch up
                        socket.emit('room-joined', serializeRoom(room));
                        
                        // Send game state if playing
                        if (room.status === 'playing' && room.gameState) {
                            const symbol = room.playerSymbols[sessionId];
                            const payload = { gameState: room.gameState, playerSymbol: symbol };
                            
                            if (room.gameType === 'battleship') {
                                payload.gameState = getBattleshipView(room.gameState, symbol);
                            }
                            if (room.gameType === 'hangman' && symbol === 'player2' && !room.gameState.isFinished) {
                                payload.gameState = { ...room.gameState, word: undefined };
                            }
                            socket.emit('game-started', payload);
                        }
                    } else {
                        // Shouldn't happen, but clear roomCode if not in room
                        session.roomCode = null;
                        socket.roomCode = null;
                    }
                } else {
                    session.roomCode = null;
                    socket.roomCode = null;
                }
            }
        } else {
            console.log(`🔌 Connected new session: ${username} (${sessionId})`);
            session = { socketId: socket.id, username, roomCode: null, disconnectTimer: null };
            sessions.set(sessionId, session);
        }

        // ==================
        // ROOM MANAGEMENT
        // ==================

        socket.on('create-room', (reqUsername) => {
            const code = generateRoomCode();
            session.roomCode = code;
            socket.roomCode = code;
            
            const room = {
                id: code,
                code,
                players: [{ id: sessionId, socketId: socket.id, username: reqUsername || session.username, isReady: false, connected: true }],
                gameType: 'tic-tac-toe',
                status: 'waiting',
                hostId: sessionId,
                gameState: null,
                playerSymbols: {},
                rematchVotes: new Set(),
            };
            rooms.set(code, room);
            socket.join(code);
            socket.emit('room-created', serializeRoom(room));
            console.log(`🏠 Room ${code} created by ${session.username}`);
        });

        socket.on('join-room', ({ code, username: reqUsername }) => {
            const upperCode = code.toUpperCase();
            const room = rooms.get(upperCode);
            
            if (!room) return socket.emit('error', 'Sala no encontrada. Verifica el código.');
            
            // Check if user is already in this room
            if (room.players.some(p => p.id === sessionId)) {
                session.roomCode = upperCode;
                socket.roomCode = upperCode;
                socket.join(upperCode);
                socket.emit('room-joined', serializeRoom(room));
                return;
            }

            if (room.players.length >= 2) return socket.emit('error', 'La sala está llena.');
            if (room.status === 'playing') return socket.emit('error', 'La partida ya ha comenzado.');

            const player = { id: sessionId, socketId: socket.id, username: reqUsername || session.username, isReady: false, connected: true };
            room.players.push(player);
            
            session.roomCode = upperCode;
            socket.roomCode = upperCode;
            socket.join(upperCode);
            
            socket.emit('room-joined', serializeRoom(room));
            socket.to(upperCode).emit('player-joined', player);
            console.log(`👤 ${session.username} joined ${upperCode}`);
        });

        socket.on('toggle-ready', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            const player = room.players.find(p => p.id === sessionId);
            if (!player) return;
            player.isReady = !player.isReady;
            io.to(roomCode).emit('player-ready-changed', { playerId: sessionId, isReady: player.isReady });
        });

        socket.on('set-game-type', ({ roomCode, gameType }) => {
            const room = rooms.get(roomCode);
            if (!room || room.hostId !== sessionId) return;
            room.gameType = gameType;
            io.to(roomCode).emit('game-type-changed', gameType);
        });

        // ==================
        // START GAME
        // ==================

        socket.on('start-game', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room || room.hostId !== sessionId) return;
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
                    room.gameState.currentTurn = 'player2';
                    break;
            }

            if (room.previousScores) {
                room.gameState.scores = room.previousScores;
                room.previousScores = null;
            }

            room.players.forEach(player => {
                const symbol = room.playerSymbols[player.id];
                const payload = { gameState: room.gameState, playerSymbol: symbol };

                if (room.gameType === 'battleship') {
                    payload.gameState = getBattleshipView(room.gameState, symbol);
                }
                if (room.gameType === 'hangman' && symbol === 'player2') {
                    payload.gameState = { ...room.gameState, word: undefined };
                }

                io.to(player.socketId).emit('game-started', payload);
            });

            console.log(`🎮 ${room.gameType} started in ${roomCode}`);
        });

        // ==================
        // GAME MOVE (unified)
        // ==================

        socket.on('game-move', ({ roomCode, move }) => {
            const room = rooms.get(roomCode);
            if (!room || !room.gameState) return;

            const symbol = room.playerSymbols[sessionId];
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
                socket.emit('error', 'Movimiento inválido o no es tu turno.');
                return;
            }

            room.gameState = newState;

            room.players.forEach(player => {
                const playerSymbol = room.playerSymbols[player.id];
                let stateView = newState;

                if (room.gameType === 'battleship') {
                    stateView = getBattleshipView(newState, playerSymbol);
                }
                if (room.gameType === 'hangman' && playerSymbol === 'player2' && !newState.isFinished) {
                    stateView = { ...newState, word: undefined };
                }

                io.to(player.socketId).emit('game-state-updated', stateView);
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

            room.rematchVotes.add(sessionId);
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
                    if (prevScores) {
                        const temp = prevScores.X;
                        prevScores.X = prevScores.O;
                        prevScores.O = temp;
                    }
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'X' ? 'O' : 'X',
                        [entries[1][0]]: entries[1][1] === 'X' ? 'O' : 'X',
                    };
                } else if (room.gameType === 'connect-four') {
                    if (prevScores) {
                        const temp = prevScores.red;
                        prevScores.red = prevScores.yellow;
                        prevScores.yellow = temp;
                    }
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'red' ? 'yellow' : 'red',
                        [entries[1][0]]: entries[1][1] === 'red' ? 'yellow' : 'red',
                    };
                } else if (room.gameType === 'chess') {
                    if (prevScores) {
                        const temp = prevScores.white;
                        prevScores.white = prevScores.black;
                        prevScores.black = temp;
                    }
                    room.playerSymbols = {
                        [entries[0][0]]: entries[0][1] === 'white' ? 'black' : 'white',
                        [entries[1][0]]: entries[1][1] === 'white' ? 'black' : 'white',
                    };
                } else if (room.gameType === 'hangman') {
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

                    io.to(player.socketId).emit('game-started', payload);
                });

                console.log(`🔄 Rematch in ${roomCode}`);
            }
        });

        // ==================
        // LEAVE / DISCONNECT
        // ==================

        socket.on('leave-room', (roomCode) => {
            handlePlayerLeave(sessionId, roomCode, true);
        });

        socket.on('return-to-lobby', (roomCode) => {
            const room = rooms.get(roomCode);
            if (!room) return;
            
            room.status = 'waiting';
            room.gameState = null;
            room.rematchVotes.clear();
            
            room.players.forEach(p => p.isReady = false);
            
            io.to(roomCode).emit('returned-to-lobby');
            io.to(roomCode).emit('room-joined', serializeRoom(room));
            
            console.log(`⬅️ Room ${roomCode} returned to lobby by ${session.username}`);
        });

        socket.on('disconnect', () => {
            console.log(`⚠️ Disconnected: ${session.username} (${sessionId})`);
            if (session.roomCode) {
                const room = rooms.get(session.roomCode);
                if (room) {
                    const player = room.players.find(p => p.id === sessionId);
                    if (player) {
                        player.connected = false;
                        io.to(session.roomCode).emit('opponent-disconnected', sessionId);
                        
                        // Set 5-minute timer to fully disconnect and end the room
                        session.disconnectTimer = setTimeout(() => {
                            handlePlayerLeave(sessionId, session.roomCode, false);
                        }, 300000); // 5 minutes
                    }
                }
            }
        });
    });

    function handlePlayerLeave(sessId, roomCode, explicitLeave) {
        const room = rooms.get(roomCode);
        if (!room) return;
        
        const session = sessions.get(sessId);
        if (session) {
            session.roomCode = null;
            if (session.disconnectTimer) {
                clearTimeout(session.disconnectTimer);
                session.disconnectTimer = null;
            }
        }

        room.players = room.players.filter(p => p.id !== sessId);
        
        if (room.players.length === 0) {
            rooms.delete(roomCode);
        } else {
            io.to(roomCode).emit('player-left', sessId);
            
            // If they left during a game, auto-resign them or end game
            if (room.status === 'playing') {
                room.status = 'finished';
                // Find remaining player
                const winnerId = room.players[0].id;
                const winnerSymbol = room.playerSymbols[winnerId];
                
                // Emulate game over with remaining player as winner
                io.to(roomCode).emit('game-over', { winner: winnerSymbol, isDraw: false, reason: 'opponent_abandoned' });
            }
            if (room.hostId === sessId) {
                room.hostId = room.players[0].id;
            }
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
                    ships: null,
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
