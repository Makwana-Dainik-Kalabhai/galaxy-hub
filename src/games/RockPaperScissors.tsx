import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface RockPaperScissorsProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Choice = 'rock' | 'paper' | 'scissors';

const EMOJIS: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️'
};

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ onGameOver, isPaused }) => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const handleChoice = (choice: Choice) => {
    if (isPaused) return;

    audioManager.play('click');
    setPlayerChoice(choice);

    // Choose computer choice
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    const comp = choices[Math.floor(Math.random() * choices.length)];
    setComputerChoice(comp);

    // Compute result
    if (choice === comp) {
      setResult('tie');
      audioManager.play('click');
      onGameOver(streak * 20 + 5);
    } else if (
      (choice === 'rock' && comp === 'scissors') ||
      (choice === 'paper' && comp === 'rock') ||
      (choice === 'scissors' && comp === 'paper')
    ) {
      setResult('win');
      audioManager.play('win');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      onGameOver(newStreak * 50); // score escalates with streak
    } else {
      setResult('lose');
      audioManager.play('lose');
      setStreak(0);
      onGameOver(0);
    }
  };

  const handleReset = () => {
    audioManager.play('click');
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      {/* Streak Dashboard */}
      <div className="grid grid-cols-2 gap-4 bg-black/40 border border-white/5 p-4 rounded-xl w-full text-center font-orbitron">
        <div className="border-r border-white/5">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Win Streak</p>
          <h4 className="text-2xl text-secondary font-black neon-glow-text-cyan">{streak}</h4>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Best Streak</p>
          <h4 className="text-2xl text-yellow-400 font-black neon-glow-text-yellow">{bestStreak}</h4>
        </div>
      </div>

      {/* Visual Arena */}
      <div className="h-44 w-full bg-cardbg/80 border border-white/5 rounded-xl flex items-center justify-around relative overflow-hidden">
        {playerChoice ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl animate-bounce">{EMOJIS[playerChoice]}</span>
            <span className="text-[10px] font-orbitron font-bold uppercase text-primary">PLAYER</span>
          </div>
        ) : (
          <div className="text-gray-600 text-sm font-orbitron font-bold">MAKE YOUR MOVE</div>
        )}

        {result && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 border border-white/10 rounded-lg text-center z-10 animate-pulse">
            <h4 className={`font-orbitron font-black text-sm uppercase tracking-wider ${result === 'win' ? 'text-green-400 text-neon-green' :
                result === 'lose' ? 'text-red-400 text-neon-red' :
                  'text-yellow-400 text-neon-yellow'
              }`}>
              {result === 'win' ? 'VICTORY' : result === 'lose' ? 'DEFEAT' : 'TIED'}
            </h4>
          </div>
        )}

        {computerChoice ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl animate-bounce">{EMOJIS[computerChoice]}</span>
            <span className="text-[10px] font-orbitron font-bold uppercase text-secondary">OPPONENT</span>
          </div>
        ) : (
          <div className="text-gray-600 text-sm font-orbitron font-bold">WAITING</div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 w-full">
        {(Object.keys(EMOJIS) as Choice[]).map((choice) => (
          <button
            key={choice}
            onClick={() => handleChoice(choice)}
            className="flex-1 flex flex-col items-center justify-center p-4 bg-cardbg border border-white/5 rounded-xl hover:border-secondary transition transform hover:scale-105"
          >
            <span className="text-4xl">{EMOJIS[choice]}</span>
            <span className="text-[10px] font-orbitron font-black uppercase tracking-wider text-gray-400 mt-2">
              {choice}
            </span>
          </button>
        ))}
      </div>

      {/* Clear/Reset button */}
      {result && (
        <button
          onClick={handleReset}
          className="flex items-center gap-2 border border-white/10 hover:border-secondary hover:text-secondary rounded-lg px-4 py-2 text-xs font-orbitron font-bold transition"
        >
          <RotateCcw className="w-4 h-4" /> Next Round
        </button>
      )}
    </div>
  );
};
