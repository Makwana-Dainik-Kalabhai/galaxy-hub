import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface HangmanProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

const CATEGORIES: Record<string, string[]> = {
  Animals: ['ELEPHANT', 'GIRAFFE', 'CHEETAH', 'KANGAROO', 'DOLPHIN', 'PENGUIN', 'PLATYPUS', 'OCTOPUS'],
  Countries: ['AUSTRALIA', 'BRAZIL', 'CANADA', 'JAPAN', 'GERMANY', 'SINGAPORE', 'PORTUGAL', 'SWITZERLAND'],
  Tech: ['JAVASCRIPT', 'TYPESCRIPT', 'GEMINI', 'COMPUTER', 'INTERNET', 'DEVELOPER', 'SOFTWARE', 'ALGORITHM'],
  Movies: ['INCEPTION', 'GLADIATOR', 'AVATAR', 'TITANIC', 'PARASITE', 'MATRIX', 'INTERSTELLAR', 'AVENGERS']
};

export const Hangman: React.FC<HangmanProps> = ({ onGameOver, isPaused }) => {
  const [category, setCategory] = useState<string>('');
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'selecting' | 'playing' | 'win' | 'lose'>('selecting');

  const selectCategory = (cat: string) => {
    audioManager.play('click');
    setCategory(cat);
    const words = CATEGORIES[cat];
    const targetWord = words[Math.floor(Math.random() * words.length)];
    setWord(targetWord);
    setGuessedLetters([]);
    setWrongGuesses([]);
    setGameState('playing');
  };

  const guessLetter = (letter: string) => {
    if (isPaused || gameState !== 'playing' || guessedLetters.includes(letter)) return;

    audioManager.play('click');
    const updatedGuessed = [...guessedLetters, letter];
    setGuessedLetters(updatedGuessed);

    if (word.includes(letter)) {
      // Correct guess
      audioManager.play('score');
      // Check if all letters guessed
      const isWordComplete = word.split('').every(char => updatedGuessed.includes(char));
      if (isWordComplete) {
        setGameState('win');
        audioManager.play('win');
        const score = Math.max(50, 200 - wrongGuesses.length * 20);
        onGameOver(score);
      }
    } else {
      // Wrong guess
      audioManager.play('hit');
      const updatedWrong = [...wrongGuesses, letter];
      setWrongGuesses(updatedWrong);
      if (updatedWrong.length >= 6) {
        setGameState('lose');
        audioManager.play('lose');
        onGameOver(0);
      }
    }
  };

  const handleReset = () => {
    audioManager.play('click');
    setCategory('');
    setWord('');
    setGuessedLetters([]);
    setWrongGuesses([]);
    setGameState('selecting');
  };

  // SVG lines representing the Hangman parts
  const renderHangmanSVG = () => {
    const errorCount = wrongGuesses.length;
    return (
      <svg className="w-40 h-44 stroke-current text-gray-400" viewBox="0 0 100 100" strokeWidth="4" strokeLinecap="round" fill="none">
        {/* Base Scaffold always visible */}
        <line x1="10" y1="90" x2="80" y2="90" />
        <line x1="25" y1="90" x2="25" y2="15" />
        <line x1="25" y1="15" x2="65" y2="15" />
        <line x1="65" y1="15" x2="65" y2="30" />

        {/* 1. Head */}
        {errorCount >= 1 && <circle cx="65" cy="38" r="8" className="text-secondary" />}
        {/* 2. Body */}
        {errorCount >= 2 && <line x1="65" y1="46" x2="65" y2="68" className="text-secondary" />}
        {/* 3. Left Arm */}
        {errorCount >= 3 && <line x1="65" y1="52" x2="50" y2="45" className="text-secondary" />}
        {/* 4. Right Arm */}
        {errorCount >= 4 && <line x1="65" y1="52" x2="80" y2="45" className="text-secondary" />}
        {/* 5. Left Leg */}
        {errorCount >= 5 && <line x1="65" y1="68" x2="50" y2="82" className="text-secondary" />}
        {/* 6. Right Leg */}
        {errorCount >= 6 && <line x1="65" y1="68" x2="80" y2="82" className="text-secondary" />}
      </svg>
    );
  };

  const keyboardKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      {gameState === 'selecting' ? (
        <div className="w-full text-center space-y-4">
          <h4 className="font-orbitron font-extrabold text-sm uppercase text-gray-400 tracking-wider">
            Select Category
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className="p-4 bg-cardbg border border-white/5 rounded-xl font-orbitron font-black text-xs uppercase tracking-wider hover:border-primary hover:text-primary transition"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-5">
          {/* Category Header */}
          <div className="flex justify-between items-center w-full bg-black/40 border border-white/5 px-4 py-2.5 rounded-lg text-xs font-orbitron font-bold">
            <span className="text-gray-400 uppercase">CATEGORY: <span className="text-secondary">{category}</span></span>
            <span className="text-red-400">STRIKES: {wrongGuesses.length} / 6</span>
          </div>

          {/* Gallows visual box */}
          <div className="bg-cardbg/40 border border-white/5 w-full rounded-2xl p-4 flex items-center justify-center relative min-h-[200px]">
            {renderHangmanSVG()}

            {gameState !== 'playing' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-2xl z-10 text-center p-4">
                <h4 className={`font-orbitron font-black text-lg uppercase tracking-wider mb-2 ${gameState === 'win' ? 'text-green-400 text-neon-green' : 'text-red-400 text-neon-red'
                  }`}>
                  {gameState === 'win' ? 'WORD GUESSED!' : 'GAME OVER!'}
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  The word was: <span className="text-white font-bold font-mono tracking-widest">{word}</span>
                </p>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Game
                </button>
              </div>
            )}
          </div>

          {/* Hidden Word Display */}
          <div className="flex gap-2 justify-center py-2 flex-wrap max-w-full">
            {word.split('').map((char, index) => {
              const showChar = guessedLetters.includes(char) || gameState === 'lose';
              return (
                <div
                  key={index}
                  className={`w-8 h-10 border-b-2 font-mono text-xl font-bold flex items-center justify-center ${showChar ? 'text-white border-secondary' : 'text-transparent border-gray-600'
                    }`}
                >
                  {char}
                </div>
              );
            })}
          </div>

          {/* Virtual Keyboard */}
          <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
            {keyboardKeys.map(key => {
              const isUsed = guessedLetters.includes(key);
              const isWrong = wrongGuesses.includes(key);
              return (
                <button
                  key={key}
                  disabled={isUsed || gameState !== 'playing'}
                  onClick={() => guessLetter(key)}
                  className={`w-8 h-8 rounded text-xs font-bold font-mono transition-all flex items-center justify-center ${isWrong ? 'bg-red-500/10 border border-red-500/30 text-red-500 opacity-60' :
                      isUsed ? 'bg-green-500/10 border border-green-500/30 text-green-500 opacity-60' :
                        'bg-cardbg border border-white/5 hover:border-primary text-gray-300 hover:text-white'
                    }`}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {gameState === 'playing' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 border border-white/10 hover:border-red-500/40 hover:text-red-400 rounded-lg px-4 py-2 text-xs font-orbitron font-bold transition"
            >
              <RotateCcw className="w-4 h-4" /> Abandon Word
            </button>
          )}
        </div>
      )}
    </div>
  );
};
