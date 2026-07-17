import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Timer } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface WhackAMoleProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

export const WhackAMole: React.FC<WhackAMoleProps> = ({ onGameOver, isPaused }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [moleSpeed, setMoleSpeed] = useState(1000); // ms
  const [hitIndex, setHitIndex] = useState<number | null>(null);

  const moleTimerRef = useRef<any>(null);
  const gameTimerRef = useRef<any>(null);

  const holes = Array(9).fill(null);

  const startGame = () => {
    audioManager.play('click');
    setScore(0);
    setTimeLeft(30);
    setMoleSpeed(1000);
    setIsPlaying(true);
    setActiveMole(null);
  };

  // Game countdown timer
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [isPlaying, isPaused]);

  // Mole pop-up logic
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const tick = () => {
      let nextHole;
      do {
        nextHole = Math.floor(Math.random() * 9);
      } while (nextHole === activeMole);

      setActiveMole(nextHole);
      setHitIndex(null);

      moleTimerRef.current = setTimeout(tick, moleSpeed);
    };

    moleTimerRef.current = setTimeout(tick, moleSpeed);

    return () => {
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    };
  }, [isPlaying, isPaused, activeMole, moleSpeed]);

  const whackMole = (index: number) => {
    if (index !== activeMole || isPaused || hitIndex !== null) return;

    audioManager.play('hit');
    setHitIndex(index);
    setScore(prev => {
      const newScore = prev + 10;
      // Increase speed by decreasing popup delay
      setMoleSpeed(speed => Math.max(350, speed - 35));
      return newScore;
    });
  };

  const endGame = () => {
    setIsPlaying(false);
    setActiveMole(null);
    setHitIndex(null);
    audioManager.play('win');
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
  };

  // Trigger onGameOver callback when state switches from playing to completed
  useEffect(() => {
    if (timeLeft === 0 && !isPlaying && score > 0) {
      onGameOver(score);
    }
  }, [isPlaying, timeLeft]);

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4 bg-black/40 border border-white/5 p-4 rounded-xl w-full text-center font-orbitron">
        <div className="border-r border-white/5 flex items-center justify-center gap-2">
          <Timer className="w-5 h-5 text-secondary" />
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Time Left</p>
            <h4 className="text-xl text-white font-black">{timeLeft}s</h4>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Score</p>
          <h4 className="text-xl text-secondary font-black neon-glow-text-cyan">{score}</h4>
        </div>
      </div>

      {/* Grid Arena */}
      <div className="grid grid-cols-3 gap-4 w-72 h-72 bg-cardbg/50 p-4 border border-white/5 rounded-2xl relative select-none">
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-2xl z-10 p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm mb-2 text-white uppercase">
              {timeLeft === 0 ? `Game Over! Score: ${score}` : 'Ready to Whack?'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              {timeLeft === 0 ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-darkbg" />}
              {timeLeft === 0 ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}

        {holes.map((_, index) => {
          const isMoleUp = activeMole === index;
          const isMoleHit = hitIndex === index;
          return (
            <button
              key={index}
              onClick={() => whackMole(index)}
              className={`w-18 h-18 rounded-full border relative flex items-center justify-center transition-all duration-100 ${
                isMoleUp 
                  ? 'bg-amber-900/40 border-secondary scale-102 cursor-crosshair shadow-[0_0_12px_rgba(0,212,255,0.2)]' 
                  : 'bg-black/40 border-white/5'
              }`}
            >
              {/* Hole depth shadow */}
              <div className="absolute inset-2 bg-black/50 rounded-full -z-10 shadow-inner"></div>

              {isMoleUp && (
                <span className={`text-4.5xl absolute transition-all select-none duration-100 ${
                  isMoleHit ? 'scale-75 translate-y-3 opacity-60 animate-wiggle' : 'scale-100 translate-y-0'
                }`}>
                  {isMoleHit ? '💥' : '🐹'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
