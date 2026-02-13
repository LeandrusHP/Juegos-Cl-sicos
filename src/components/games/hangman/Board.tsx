'use client';

interface HangmanBoardProps {
    revealedWord: string[];
    guessedLetters: string[];
    wrongLetters: string[];
    wrongCount: number;
    maxWrong: number;
    hint: string;
    isMyTurn: boolean;
    isGuesser: boolean;
    isFinished: boolean;
    winner: string | null;
    word?: string;
    onGuess: (letter: string) => void;
    disabled: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

export default function HangmanBoard({
    revealedWord,
    guessedLetters,
    wrongLetters,
    wrongCount,
    maxWrong,
    hint,
    isMyTurn,
    isGuesser,
    isFinished,
    winner,
    word,
    onGuess,
    disabled,
}: HangmanBoardProps) {
    return (
        <div className="glass rounded-2xl p-4 sm:p-6 space-y-5">
            {/* Hangman Drawing */}
            <div className="flex justify-center">
                <svg viewBox="0 0 200 220" className="w-40 h-44 sm:w-48 sm:h-52">
                    {/* Gallows */}
                    <line x1="20" y1="210" x2="100" y2="210" stroke="currentColor" strokeWidth="4" className="text-surface-500" />
                    <line x1="60" y1="210" x2="60" y2="30" stroke="currentColor" strokeWidth="4" className="text-surface-500" />
                    <line x1="60" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="4" className="text-surface-500" />
                    <line x1="140" y1="30" x2="140" y2="50" stroke="currentColor" strokeWidth="4" className="text-surface-500" />

                    {/* Head */}
                    {wrongCount >= 1 && (
                        <circle cx="140" cy="70" r="20" fill="none" stroke="currentColor" strokeWidth="3"
                            className="text-accent-400 animate-pop-in" />
                    )}
                    {/* Body */}
                    {wrongCount >= 2 && (
                        <line x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="3"
                            className="text-accent-400 animate-pop-in" />
                    )}
                    {/* Left arm */}
                    {wrongCount >= 3 && (
                        <line x1="140" y1="110" x2="110" y2="130" stroke="currentColor" strokeWidth="3"
                            className="text-accent-400 animate-pop-in" />
                    )}
                    {/* Right arm */}
                    {wrongCount >= 4 && (
                        <line x1="140" y1="110" x2="170" y2="130" stroke="currentColor" strokeWidth="3"
                            className="text-accent-400 animate-pop-in" />
                    )}
                    {/* Left leg */}
                    {wrongCount >= 5 && (
                        <line x1="140" y1="150" x2="115" y2="185" stroke="currentColor" strokeWidth="3"
                            className="text-accent-400 animate-pop-in" />
                    )}
                    {/* Right leg */}
                    {wrongCount >= 6 && (
                        <line x1="140" y1="150" x2="165" y2="185" stroke="currentColor" strokeWidth="3"
                            className="text-red-400 animate-pop-in" />
                    )}

                    {/* Face (on death) */}
                    {wrongCount >= 6 && (
                        <>
                            <line x1="132" y1="63" x2="138" y2="69" stroke="currentColor" strokeWidth="2" className="text-red-400" />
                            <line x1="138" y1="63" x2="132" y2="69" stroke="currentColor" strokeWidth="2" className="text-red-400" />
                            <line x1="142" y1="63" x2="148" y2="69" stroke="currentColor" strokeWidth="2" className="text-red-400" />
                            <line x1="148" y1="63" x2="142" y2="69" stroke="currentColor" strokeWidth="2" className="text-red-400" />
                            <path d="M130 80 Q140 75 150 80" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400" />
                        </>
                    )}
                </svg>
            </div>

            {/* Wrong count */}
            <div className="text-center">
                <span className="text-sm text-surface-400">Errores: </span>
                <span className={`font-bold ${wrongCount >= 5 ? 'text-red-400' : wrongCount >= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {wrongCount}/{maxWrong}
                </span>
            </div>

            {/* Hint */}
            <div className="text-center">
                <span className="text-xs text-surface-500">Pista: </span>
                <span className="text-sm text-primary-300 font-medium">{hint}</span>
            </div>

            {/* Word */}
            <div className="flex justify-center gap-2 flex-wrap">
                {revealedWord.map((letter, i) => (
                    <div
                        key={i}
                        className={`w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center rounded-lg font-bold text-xl sm:text-2xl font-mono
              border-b-2 transition-all
              ${letter === '_'
                                ? 'border-surface-500 text-transparent'
                                : isFinished && winner !== 'guesser'
                                    ? 'border-red-400 text-red-300 animate-pop-in'
                                    : 'border-primary-400 text-white animate-pop-in'
                            }`}
                    >
                        {letter === '_' ? '•' : letter}
                    </div>
                ))}
            </div>

            {/* Wrong letters */}
            {wrongLetters.length > 0 && (
                <div className="flex justify-center gap-1 flex-wrap">
                    {wrongLetters.map(l => (
                        <span key={l} className="text-sm text-red-400/60 line-through font-mono">{l}</span>
                    ))}
                </div>
            )}

            {/* Keyboard */}
            {isGuesser && !isFinished && (
                <div className="grid grid-cols-9 gap-1 sm:gap-1.5 max-w-sm mx-auto">
                    {ALPHABET.split('').map(letter => {
                        const used = guessedLetters.includes(letter);
                        const isWrong = wrongLetters.includes(letter);
                        const isCorrect = used && !isWrong;

                        return (
                            <button
                                key={letter}
                                onClick={() => onGuess(letter)}
                                disabled={disabled || used || !isMyTurn}
                                className={`py-2 rounded-lg text-sm font-bold transition-all
                  ${isCorrect
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                                        : isWrong
                                            ? 'bg-red-500/10 text-red-400/40 border border-red-400/10'
                                            : !disabled && isMyTurn
                                                ? 'bg-white/10 text-white hover:bg-primary-600/30 hover:text-primary-300 active:scale-90 border border-white/10'
                                                : 'bg-white/5 text-surface-600 border border-white/5'
                                    }`}
                            >
                                {letter}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Watcher view (non-guesser) */}
            {!isGuesser && !isFinished && word && (
                <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-400/20">
                    <p className="text-xs text-amber-300">La palabra es:</p>
                    <p className="text-2xl font-bold font-mono tracking-widest text-amber-200 mt-1">{word}</p>
                    <p className="text-xs text-surface-500 mt-1">Esperando a que tu oponente adivine...</p>
                </div>
            )}
        </div>
    );
}
