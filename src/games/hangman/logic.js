// ==========================================
// Hangman Game Logic (Pure Functions)
// ==========================================

const WORDS = [
    { word: 'JAVASCRIPT', hint: 'Lenguaje de programación web' },
    { word: 'COMPUTADORA', hint: 'Máquina electrónica' },
    { word: 'DINOSAURIO', hint: 'Reptil prehistórico' },
    { word: 'CHOCOLATE', hint: 'Dulce favorito del mundo' },
    { word: 'ELEFANTE', hint: 'El animal terrestre más grande' },
    { word: 'GUITARRA', hint: 'Instrumento musical de cuerdas' },
    { word: 'MARIPOSA', hint: 'Insecto con alas coloridas' },
    { word: 'UNIVERSO', hint: 'Todo lo que existe' },
    { word: 'VOLCAN', hint: 'Montaña que hace erupción' },
    { word: 'PIRAMIDE', hint: 'Construcción del antiguo Egipto' },
    { word: 'ASTRONAUTA', hint: 'Viajero del espacio' },
    { word: 'BIBLIOTECA', hint: 'Lugar lleno de libros' },
    { word: 'CANGURO', hint: 'Animal que salta con bolsa' },
    { word: 'DRAGONES', hint: 'Criaturas míticas que vuelan' },
    { word: 'ESMERALDA', hint: 'Piedra preciosa verde' },
    { word: 'FANTASMA', hint: 'Espíritu que asusta' },
    { word: 'GALAXIA', hint: 'Conjunto de estrellas' },
    { word: 'HIPOPOTAMO', hint: 'Animal grande que vive en el agua' },
    { word: 'IGUANA', hint: 'Reptil tropical' },
    { word: 'JIRAFA', hint: 'El animal más alto' },
    { word: 'KOALA', hint: 'Marsupial australiano' },
    { word: 'LABERINTO', hint: 'Camino lleno de confusión' },
    { word: 'MURCIELAGO', hint: 'Mamífero que vuela de noche' },
    { word: 'NARANJA', hint: 'Fruta cítrica y color' },
    { word: 'ORQUIDEA', hint: 'Flor tropical elegante' },
    { word: 'PINGÜINO', hint: 'Ave que no vuela pero nada' },
    { word: 'RINOCERONTE', hint: 'Animal con cuerno en la nariz' },
    { word: 'SERPIENTE', hint: 'Reptil sin patas' },
    { word: 'TIBURON', hint: 'Depredador del océano' },
    { word: 'UNICORNIO', hint: 'Caballo mítico con cuerno' },
];

const MAX_WRONG = 6;

function createInitialState() {
    const wordData = WORDS[Math.floor(Math.random() * WORDS.length)];
    return {
        word: wordData.word,
        hint: wordData.hint,
        guessedLetters: [],
        wrongLetters: [],
        wrongCount: 0,
        maxWrong: MAX_WRONG,
        currentTurn: 'player1', // Player1 picks, Player2 guesses (or vice versa)
        winner: null, // 'guesser' or 'picker'
        isFinished: false,
        revealedWord: wordData.word.split('').map(() => '_'),
        scores: { player1: 0, player2: 0, draws: 0 },
    };
}

function guessLetter(state, letter, guesserKey) {
    if (state.isFinished) return null;
    if (state.currentTurn !== guesserKey) return null;

    const upperLetter = letter.toUpperCase();
    if (state.guessedLetters.includes(upperLetter)) return null;
    if (!/^[A-ZÑ]$/.test(upperLetter)) return null;

    const newGuessedLetters = [...state.guessedLetters, upperLetter];
    const isCorrect = state.word.includes(upperLetter);

    let newWrongLetters = [...state.wrongLetters];
    let newWrongCount = state.wrongCount;

    if (!isCorrect) {
        newWrongLetters.push(upperLetter);
        newWrongCount++;
    }

    // Update revealed word
    const newRevealedWord = state.word.split('').map((ch, i) =>
        newGuessedLetters.includes(ch) ? ch : '_'
    );

    // Check win
    const wordGuessed = !newRevealedWord.includes('_');
    const hanged = newWrongCount >= MAX_WRONG;

    const newScores = { ...state.scores };
    let winner = null;

    if (wordGuessed) {
        winner = 'guesser';
        newScores[guesserKey]++;
    } else if (hanged) {
        winner = 'picker';
        const pickerKey = guesserKey === 'player1' ? 'player2' : 'player1';
        newScores[pickerKey]++;
    }

    return {
        ...state,
        guessedLetters: newGuessedLetters,
        wrongLetters: newWrongLetters,
        wrongCount: newWrongCount,
        revealedWord: hanged ? state.word.split('') : newRevealedWord,
        winner,
        isFinished: wordGuessed || hanged,
        scores: newScores,
    };
}

function getNewWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

module.exports = { createInitialState, guessLetter, getNewWord, MAX_WRONG, WORDS };
