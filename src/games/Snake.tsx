import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface SnakeProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const Snake: React.FC<SnakeProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState<'normal' | 'fast'>('normal');
  const [wrapWalls, setWrapWalls] = useState(true);

  // Snake state managed via refs to avoid closure stale state in the animation interval
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const speedMsRef = useRef(120);

  const gridCount = 20;

  useEffect(() => {
    speedMsRef.current = speed === 'normal' ? 120 : 80;
  }, [speed]);

  // Handle Keyboard direction steering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;

      const key = e.key;
      const currentDir = directionRef.current;

      if ((key === 'ArrowUp' || key === 'w' || key === 'W') && currentDir !== 'DOWN') {
        directionRef.current = 'UP';
      } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && currentDir !== 'UP') {
        directionRef.current = 'DOWN';
      } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && currentDir !== 'RIGHT') {
        directionRef.current = 'LEFT';
      } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && currentDir !== 'LEFT') {
        directionRef.current = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused]);

  // Primary animation loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    let animFrame: number;
    let lastTime = 0;

    const gameTick = (time: number) => {
      if (time - lastTime >= speedMsRef.current) {
        lastTime = time;
        moveSnake();
        drawGame();
      }
      animFrame = requestAnimationFrame(gameTick);
    };

    animFrame = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, isPaused, wrapWalls]);

  // Initial draw placeholder
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const generateFood = (snake: Point[]): Point => {
    let newFood: Point;
    let foodOnSnake = true;
    while (foodOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * gridCount),
        y: Math.floor(Math.random() * gridCount)
      };
      foodOnSnake = snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
    }
    return newFood!;
  };

  const moveSnake = () => {
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = directionRef.current;

    switch (dir) {
      case 'UP': head.y -= 1; break;
      case 'DOWN': head.y += 1; break;
      case 'LEFT': head.x -= 1; break;
      case 'RIGHT': head.x += 1; break;
    }

    // Check Wall Collisions
    if (wrapWalls) {
      if (head.x < 0) head.x = gridCount - 1;
      else if (head.x >= gridCount) head.x = 0;
      if (head.y < 0) head.y = gridCount - 1;
      else if (head.y >= gridCount) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
        triggerGameOver();
        return;
      }
    }

    // Check self tail collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      triggerGameOver();
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check if eating food
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      audioManager.play('score');
      setScore(prev => prev + 10);
      foodRef.current = generateFood(snake);
    } else {
      // remove tail to maintain length
      snake.pop();
    }

    snakeRef.current = snake;
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cellSize = size / gridCount;

    // Clear board
    ctx.fillStyle = '#0F0F23';
    ctx.fillRect(0, 0, size, size);

    // Draw grid board gridlines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Draw food
    const food = foodRef.current;
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    // Add glow to food
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF5252';
    ctx.fillStyle = '#FFA1A1';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 5,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // Draw snake segments
    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#00D4FF' : '#6C63FF';
      ctx.shadowBlur = isHead ? 8 : 0;
      ctx.shadowColor = '#00D4FF';

      // Draw rounded rectangle segments
      const pad = 1.5;
      const x = segment.x * cellSize + pad;
      const y = segment.y * cellSize + pad;
      const w = cellSize - pad * 2;
      const h = cellSize - pad * 2;
      const r = isHead ? w / 3 : w / 4;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();

      // Add simple snake eyes
      if (isHead) {
        ctx.fillStyle = '#0A0A1A';
        ctx.shadowBlur = 0;
        const eyeOffset = cellSize / 3.5;
        const eyeSize = cellSize / 7;
        const cx = segment.x * cellSize + cellSize / 2;
        const cy = segment.y * cellSize + cellSize / 2;

        const dir = directionRef.current;
        if (dir === 'RIGHT' || dir === 'LEFT') {
          ctx.beginPath();
          ctx.arc(cx, cy - eyeOffset, eyeSize, 0, 2 * Math.PI);
          ctx.arc(cx, cy + eyeOffset, eyeSize, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(cx - eyeOffset, cy, eyeSize, 0, 2 * Math.PI);
          ctx.arc(cx + eyeOffset, cy, eyeSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
  };

  const startGame = () => {
    audioManager.play('click');
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    foodRef.current = { x: 5, y: 5 };
    setScore(0);
    setIsPlaying(true);
  };

  const triggerGameOver = () => {
    setIsPlaying(false);
    audioManager.play('lose');
    onGameOver(score);
  };

  const sendTouchDir = (dir: Direction) => {
    if (!isPlaying || isPaused) return;
    const current = directionRef.current;
    if (dir === 'UP' && current !== 'DOWN') directionRef.current = 'UP';
    if (dir === 'DOWN' && current !== 'UP') directionRef.current = 'DOWN';
    if (dir === 'LEFT' && current !== 'RIGHT') directionRef.current = 'LEFT';
    if (dir === 'RIGHT' && current !== 'LEFT') directionRef.current = 'RIGHT';
    audioManager.play('click');
  };

  return (
    <div className="flex flex-col items-center gap-5 p-3 max-w-md mx-auto">
      {/* Settings bar */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        {/* Speed */}
        <div className="flex gap-1.5">
          <button
            onClick={() => { setSpeed('normal'); audioManager.play('click'); }}
            className={`px-2.5 py-1 rounded text-[10px] font-bold ${speed === 'normal' ? 'bg-primary text-white' : 'text-gray-400 border border-white/5'
              }`}
          >
            Normal
          </button>
          <button
            onClick={() => { setSpeed('fast'); audioManager.play('click'); }}
            className={`px-2.5 py-1 rounded text-[10px] font-bold ${speed === 'fast' ? 'bg-secondary text-darkbg' : 'text-gray-400 border border-white/5'
              }`}
          >
            Hyper
          </button>
        </div>

        {/* Score display */}
        <div className="text-secondary font-black text-sm">
          SCORE: <span className="text-white font-mono">{score}</span>
        </div>

        {/* Walls wrap */}
        <button
          onClick={() => { setWrapWalls(!wrapWalls); audioManager.play('click'); }}
          className={`px-2.5 py-1 rounded text-[10px] font-bold border ${wrapWalls ? 'border-green-400/30 text-green-400 bg-green-500/5' : 'border-red-400/30 text-red-400 bg-red-500/5'
            }`}
        >
          Wrap: {wrapWalls ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-square w-72 sm:w-80">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {score > 0 ? `Game Over! Score: ${score}` : 'Ready to Slither?'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Game
            </button>
          </div>
        )}
      </div>

      {/* Touch D-Pad for Mobile Players */}
      <div className="flex flex-col items-center gap-1 mt-1 sm:hidden">
        <button
          onClick={() => sendTouchDir('UP')}
          className="w-11 h-11 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-8">
          <button
            onClick={() => sendTouchDir('LEFT')}
            className="w-11 h-11 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => sendTouchDir('RIGHT')}
            className="w-11 h-11 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => sendTouchDir('DOWN')}
          className="w-11 h-11 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
