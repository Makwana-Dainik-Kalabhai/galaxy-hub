import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface WordleProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

const WORDS_DATABASE = [
  'REACT', 'WORLD', 'SMART', 'SHARK', 'BRICK', 'SPACE', 'CHESS', 'SNAKE', 'PIXEL', 'ROBOT',
  'CRAFT', 'MOUSE', 'SOUND', 'LIGHT', 'GAMES', 'MATCH', 'LEVEL', 'FORCE', 'LASER', 'BOARD'
];

export const Wordle: React.FC<WordleProps> = ({ onGameOver, isPaused }) => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'win' | 'lose'>('playing');

  const startNewGame = () => {
    audioManager.play('click');
    const secret = WORDS_DATABASE[Math.floor(Math.random() * WORDS_DATABASE.length)];
    setTargetWord(secret);
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
  };

  useEffect(() => {
    startNewGame();
  }, []);

  // Listen to physical keyboard presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || gameState !== 'playing') return;

      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        setCurrentGuess(prev => prev.slice(0, -1));
        audioManager.play('click');
      } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
        if (currentGuess.length < 5) {
          setCurrentGuess(prev => prev + key);
          audioManager.play('click');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, guesses, gameState, isPaused, targetWord]);

  const submitGuess = () => {
    if (currentGuess.length !== 5) return;

    audioManager.play('click');
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === targetWord) {
      setGameState('win');
      audioManager.play('win');
      // Score calculation: higher points for fewer guesses
      const score = 1000 - (guesses.length * 150);
      onGameOver(score);
    } else if (newGuesses.length >= 6) {
      setGameState('lose');
      audioManager.play('lose');
      onGameOver(0);
    }
  };

  const getLetterStatus = (char: string, index: number, word: string) => {
    if (targetWord[index] === char) return 'green';
    if (targetWord.includes(char)) {
      // Handle duplicates correctly by comparing occurrences
      const targetCount = targetWord.split(char).length - 1;
      const guessIndices = [...word].map((c, i) => c === char ? i : -1).filter(i => i !== -1);
      const greenIndices = guessIndices.filter(i => targetWord[i] === char);

      const remainingCount = targetCount - greenIndices.length;
      const yellowIndices = guessIndices.filter(i => targetWord[i] !== char).slice(0, remainingCount);

      if (yellowIndices.includes(index)) return 'yellow';
    }
    return 'gray';
  };

  // Keyboard mapping states
  const getKeyboardKeyStatus = (key: string) => {
    let status = 'none';
    guesses.forEach(guess => {
      for (let i = 0; i < 5; i++) {
        if (guess[i] === key) {
          if (targetWord[i] === key) {
            status = 'green';
          } else if (targetWord.includes(key) && status !== 'green') {
            status = 'yellow';
          } else if (status !== 'green' && status !== 'yellow') {
            status = 'gray';
          }
        }
      }
    });
    return status;
  };

  const renderGridRows = () => {
    const rows = [];
    for (let r = 0; r < 6; r++) {
      const word = guesses[r] || (r === guesses.length ? currentGuess : '');
      const isSubmitted = r < guesses.length;

      const cells = [];
      for (let c = 0; c < 5; c++) {
        const char = word[c] || '';
        let status = 'none';
        if (isSubmitted) {
          status = getLetterStatus(char, c, word);
        }

        const bgClass =
          status === 'green' ? 'bg-green-600 border-green-600' :
            status === 'yellow' ? 'bg-yellow-600 border-yellow-600' :
              status === 'gray' ? 'bg-zinc-800 border-zinc-800 opacity-60' :
                'bg-cardbg/80 border-white/5';

        cells.push(
          <div
            key={c}
            className={`w-11 h-12 border rounded-lg flex items-center justify-center text-sm font-orbitron font-black text-white transition-all duration-500 uppercase ${bgClass}`}
          >
            {char}
          </div>
        );
      }
      rows.push(
        <div key={r} className="flex gap-2 justify-center">
          {cells}
        </div>
      );
    }
    return rows;
  };

  const keyboardLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ];

  const handleKeyClick = (key: string) => {
    if (isPaused || gameState !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      audioManager.play('click');
    } else {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key);
        audioManager.play('click');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      {/* Target display on defeat */}
      {gameState !== 'playing' && (
        <div className="bg-black/90 p-4 border border-white/5 rounded-xl text-center w-full relative z-10 animate-fade-in">
          <h4 className={`font-orbitron font-black text-base uppercase mb-1 ${gameState === 'win' ? 'text-green-400 text-neon-green' : 'text-red-400 text-neon-red'
            }`}>
            {gameState === 'win' ? 'Word Decoded!' : 'Access Denied!'}
          </h4>
          <p className="text-xs text-gray-400 mb-3">
            Secret Word: <span className="text-white font-black font-mono tracking-widest">{targetWord}</span>
          </p>
          <button
            onClick={startNewGame}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2 px-6 rounded-lg uppercase tracking-wider mx-auto transition transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" /> Try Another Word
          </button>
        </div>
      )}

      {/* Main Grid rows */}
      <div className="grid gap-2 w-full max-w-[270px]">
        {renderGridRows()}
      </div>

      {/* Keyboard overlay */}
      <div className="flex flex-col gap-1.5 w-full mt-2">
        {keyboardLayout.map((row, idx) => (
          <div key={idx} className="flex gap-1 justify-center">
            {row.map(key => {
              const status = getKeyboardKeyStatus(key);
              const keyBg =
                status === 'green' ? 'bg-green-600 border-green-600 text-white' :
                  status === 'yellow' ? 'bg-yellow-600 border-yellow-600 text-white' :
                    status === 'gray' ? 'bg-zinc-800 border-zinc-800 text-zinc-500 opacity-55' :
                      'bg-cardbg border-white/5 text-gray-300';

              const isLarge = key === 'ENTER' || key === '⌫';

              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={`py-3 rounded text-[10px] font-black font-mono flex items-center justify-center border transition-all ${keyBg} ${isLarge ? 'px-2.5 flex-1' : 'w-7.5 sm:w-8.5'
                    }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
