import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface FlappyBirdProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Pipe = { x: number; topH: number; bottomH: number; passed: boolean };

export const FlappyBird: React.FC<FlappyBirdProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  const width = 360;
  const height = 480;

  // Physics params
  const gravity = 0.25;
  const jumpStrength = -5.2;

  // Refs for animation tick state
  const birdYRef = useRef<number>(height / 2);
  const birdVelocityRef = useRef<number>(0);
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);

  // Jump trigger keyboard hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused]);

  // Game animation tick
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    let animFrame: number;

    const gameTick = () => {
      updatePhysics();
      drawGame();
      animFrame = requestAnimationFrame(gameTick);
    };

    animFrame = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, isPaused, score]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const flap = () => {
    if (!isPlaying || isPaused) return;
    birdVelocityRef.current = jumpStrength;
    audioManager.play('jump');
  };

  const updatePhysics = () => {
    // 1. Gravity acceleration on bird
    birdVelocityRef.current += gravity;
    birdYRef.current += birdVelocityRef.current;

    // 2. Ceiling / Floor collisions
    if (birdYRef.current <= 0 || birdYRef.current >= height - 20) {
      triggerGameOver();
      return;
    }

    // 3. Move & Span Pipes
    frameCountRef.current++;
    if (frameCountRef.current % 100 === 0) {
      const gap = 110;
      const minHeight = 40;
      const maxHeight = height - gap - minHeight - 40;
      const topH = minHeight + Math.floor(Math.random() * (maxHeight - minHeight));
      const bottomH = height - topH - gap;

      pipesRef.current.push({
        x: width,
        topH,
        bottomH,
        passed: false
      });
    }

    const pipes = pipesRef.current;
    const birdSize = 12;
    const birdX = 60;

    for (let i = 0; i < pipes.length; i++) {
      const p = pipes[i];
      p.x -= 2.2; // scroll speed

      // Collision checks
      const pipeW = 50;
      const hitTop = birdX + birdSize > p.x && birdX - birdSize < p.x + pipeW && birdYRef.current - birdSize < p.topH;
      const hitBottom = birdX + birdSize > p.x && birdX - birdSize < p.x + pipeW && birdYRef.current + birdSize > height - p.bottomH;

      if (hitTop || hitBottom) {
        triggerGameOver();
        return;
      }

      // Check if passed to score points
      if (!p.passed && p.x + pipeW < birdX) {
        p.passed = true;
        audioManager.play('score');
        setScore(prev => prev + 1);
      }
    }

    // Filter out offscreen pipes
    pipesRef.current = pipes.filter(p => p.x > -60);
  };

  const triggerGameOver = () => {
    setIsPlaying(false);
    audioManager.play('lose');
    // submit score scaled
    onGameOver(score * 100);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear / sky
    ctx.fillStyle = '#0F1A3A';
    ctx.fillRect(0, 0, width, height);

    // Draw background city silhouettes
    ctx.fillStyle = '#0A0A1C';
    ctx.fillRect(0, height - 60, width, 60);

    // Draw Pipes
    pipesRef.current.forEach(p => {
      ctx.fillStyle = '#32CD32';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#32CD32';

      const pipeW = 50;
      // Top pipe
      ctx.fillRect(p.x, 0, pipeW, p.topH);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(p.x - 3, p.topH - 12, pipeW + 6, 12); // lip

      // Bottom pipe
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(p.x, height - p.bottomH, pipeW, p.bottomH);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(p.x - 3, height - p.bottomH, pipeW + 6, 12); // lip
    });

    // Draw Bird
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(60, birdYRef.current, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Draw wing flap indicator
    ctx.fillStyle = '#FF8C00';
    ctx.shadowBlur = 0;
    const wingY = birdYRef.current + (birdVelocityRef.current < 0 ? 3 : -3);
    ctx.beginPath();
    ctx.arc(52, wingY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Draw eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(64, birdYRef.current - 3, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowBlur = 0; // reset
  };

  const startGame = () => {
    audioManager.play('click');
    birdYRef.current = height / 2;
    birdVelocityRef.current = 0;
    pipesRef.current = [];
    frameCountRef.current = 0;
    setScore(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-md mx-auto">
      {/* HUD Info */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <span className="text-gray-400">SCORE: <span className="text-secondary font-mono font-bold">{score}</span></span>
        <span className="text-[10px] text-gray-500 font-bold uppercase">SPACEBAR or TAP to flap</span>
      </div>

      {/* Canvas viewport */}
      <div
        onClick={flap}
        className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[3/4] w-72 sm:w-80 cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center cursor-default" onClick={e => e.stopPropagation()}>
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {score > 0 ? `Flap Result: ${score}` : 'Flappy Neon Bird'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Flapping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
