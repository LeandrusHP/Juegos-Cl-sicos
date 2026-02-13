// ==========================================
// Battleship Game Logic (Pure Functions)
// ==========================================

const GRID_SIZE = 10;

const SHIP_TYPES = [
    { name: 'Portaaviones', size: 5 },
    { name: 'Acorazado', size: 4 },
    { name: 'Crucero', size: 3 },
    { name: 'Submarino', size: 3 },
    { name: 'Destructor', size: 2 },
];

function createEmptyGrid() {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

function createInitialState() {
    return {
        phase: 'placing', // 'placing' | 'playing' | 'finished'
        currentTurn: 'player1',
        winner: null,
        boards: {
            player1: { ships: createEmptyGrid(), shots: createEmptyGrid(), shipsPlaced: [] },
            player2: { ships: createEmptyGrid(), shots: createEmptyGrid(), shipsPlaced: [] },
        },
        scores: { player1: 0, player2: 0, draws: 0 },
    };
}

function canPlaceShip(grid, row, col, size, isHorizontal) {
    for (let i = 0; i < size; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
        if (grid[r][c] !== null) return false;
    }
    return true;
}

function placeShip(state, playerKey, shipIndex, row, col, isHorizontal) {
    if (state.phase !== 'placing') return null;
    const board = state.boards[playerKey];
    if (!board) return null;

    const ship = SHIP_TYPES[shipIndex];
    if (!ship) return null;
    if (board.shipsPlaced.includes(shipIndex)) return null;

    if (!canPlaceShip(board.ships, row, col, ship.size, isHorizontal)) return null;

    const newShips = board.ships.map(r => [...r]);
    const cells = [];
    for (let i = 0; i < ship.size; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        newShips[r][c] = shipIndex;
        cells.push([r, c]);
    }

    const newBoards = { ...state.boards };
    newBoards[playerKey] = {
        ...board,
        ships: newShips,
        shipsPlaced: [...board.shipsPlaced, shipIndex],
    };

    const newState = { ...state, boards: newBoards };

    // Check if both players have placed all ships
    const p1Done = newBoards.player1.shipsPlaced.length === SHIP_TYPES.length;
    const p2Done = newBoards.player2.shipsPlaced.length === SHIP_TYPES.length;
    if (p1Done && p2Done) {
        newState.phase = 'playing';
    }

    return newState;
}

function autoPlaceShips(state, playerKey) {
    const board = state.boards[playerKey];
    const newShips = board.ships.map(r => [...r]);
    const placed = [];

    for (let i = 0; i < SHIP_TYPES.length; i++) {
        if (board.shipsPlaced.includes(i)) continue;
        let attempts = 0;
        while (attempts < 200) {
            const isHorizontal = Math.random() < 0.5;
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            if (canPlaceShip(newShips, row, col, SHIP_TYPES[i].size, isHorizontal)) {
                for (let j = 0; j < SHIP_TYPES[i].size; j++) {
                    const r = isHorizontal ? row : row + j;
                    const c = isHorizontal ? col + j : col;
                    newShips[r][c] = i;
                }
                placed.push(i);
                break;
            }
            attempts++;
        }
    }

    const newBoards = { ...state.boards };
    newBoards[playerKey] = {
        ...board,
        ships: newShips,
        shipsPlaced: [...board.shipsPlaced, ...placed],
    };

    const newState = { ...state, boards: newBoards };
    const p1Done = newBoards.player1.shipsPlaced.length === SHIP_TYPES.length;
    const p2Done = newBoards.player2.shipsPlaced.length === SHIP_TYPES.length;
    if (p1Done && p2Done) {
        newState.phase = 'playing';
    }

    return newState;
}

function shoot(state, shooterKey, row, col) {
    if (state.phase !== 'playing') return null;
    if (state.currentTurn !== shooterKey) return null;
    if (state.winner) return null;

    const targetKey = shooterKey === 'player1' ? 'player2' : 'player1';
    const targetBoard = state.boards[targetKey];
    const shooterBoard = state.boards[shooterKey];

    // Check if already shot there
    if (shooterBoard.shots[row][col] !== null) return null;

    const newShots = shooterBoard.shots.map(r => [...r]);
    const shipAtTarget = targetBoard.ships[row][col];

    if (shipAtTarget !== null) {
        newShots[row][col] = 'hit';
    } else {
        newShots[row][col] = 'miss';
    }

    const newBoards = { ...state.boards };
    newBoards[shooterKey] = { ...shooterBoard, shots: newShots };

    // Check if all ships sunk
    let allSunk = true;
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (targetBoard.ships[r][c] !== null && newShots[r][c] !== 'hit') {
                allSunk = false;
                break;
            }
        }
        if (!allSunk) break;
    }

    const newScores = { ...state.scores };
    let winner = null;
    if (allSunk) {
        winner = shooterKey;
        newScores[shooterKey]++;
    }

    return {
        ...state,
        boards: newBoards,
        currentTurn: shipAtTarget !== null ? shooterKey : targetKey, // Extra turn on hit
        winner,
        phase: allSunk ? 'finished' : state.phase,
        scores: newScores,
        lastShot: { row, col, result: shipAtTarget !== null ? 'hit' : 'miss', shooter: shooterKey },
    };
}

module.exports = { createInitialState, placeShip, autoPlaceShips, shoot, GRID_SIZE, SHIP_TYPES };
