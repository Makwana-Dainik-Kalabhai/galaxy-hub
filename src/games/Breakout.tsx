import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface BreakoutProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Brick = { x: number; y: number; w: number; h: number; color: string; active: boolean };
type PowerUp = { x: number; y: number; w: number; h: number; type: 'expand' | 'life' | 'multiball'; active: boolean };
type Ball = { x: number; y: number; vx: number; vy: number; active: boolean };

export const Breakout: React.FC<BreakoutProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const width = 480;
  const height = 400;

  const brickRows = 4;
  const brickCols = 8;
  const brickH = 15;
  const brickW = 50;

  // Refs for loop physics state
  const paddleRef = useRef({ x: width/2 - 40, y: height - 20, w: 80, h: 10 });
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerupsRef = useRef<PowerUp[]>([]);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Keyboard binding tracks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game tick
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
  }, [isPlaying, isPaused, score, lives]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const updatePhysics = () => {
    // 1. Move paddle
    const pad = paddleRef.current;
    const speed = 5.5;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
      pad.x = Math.max(5, pad.x - speed);
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
      pad.x = Math.min(width - pad.w - 5, pad.x + speed);
    }

    // 2. Move Balls
    const balls = ballsRef.current.filter(b => b.active);
    if (balls.length === 0) {
      // Lost all balls, decrement life
      handleBallLoss();
      return;
    }

    balls.forEach(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x <= 5 || ball.x >= width - 5) {
        ball.vx = -ball.vx;
        audioManager.play('click');
      }
      if (ball.y <= 5) {
        ball.vy = -ball.vy;
        audioManager.play('click');
      }

      // Lose ball check
      if (ball.y >= height) {
        ball.active = false;
        return;
      }

      // Paddle hit
      if (ball.y >= pad.y - 6 && ball.y <= pad.y && ball.x >= pad.x && ball.x <= pad.x + pad.w) {
        ball.vy = -Math.abs(ball.vy);
        // Add velocity variance based on pad bounce center offset
        const hitOffset = (ball.x - (pad.x + pad.w/2)) / (pad.w/2);
        ball.vx = hitOffset * 4;
        audioManager.play('hit');
      }

      // Brick collisions
      bricksRef.current.forEach(brick => {
        if (brick.active && 
            ball.x >= brick.x && ball.x <= brick.x + brick.w &&
            ball.y >= brick.y - 6 && ball.y <= brick.y + brick.h + 6) {
          
          brick.active = false;
          ball.vy = -ball.vy;
          audioManager.play('score');
          setScore(prev => prev + 20);

          // Power-up chance
          if (Math.random() < 0.28) {
            const types: ('expand' | 'life' | 'multiball')[] = ['expand', 'life', 'multiball'];
            powerupsRef.current.push({
              x: brick.x + brick.w/2 - 6,
              y: brick.y + brick.h,
              w: 12,
              h: 12,
              type: types[Math.floor(Math.random() * types.length)],
              active: true
            });
          }
        }
      });
    });

    // Clean inactive balls from reference list
    ballsRef.current = balls;

    // Check level clear
    if (bricksRef.current.filter(b => b.active).length === 0) {
      audioManager.play('win');
      setIsPlaying(false);
      onGameOver(score + 500);
      return;
    }

    // 3. Move Power-Ups
    powerupsRef.current.forEach(pw => {
      if (pw.active) {
        pw.y += 2.5;

        // Catch power-up check
        if (pw.y >= pad.y - pw.h && pw.y <= pad.y + pad.h && pw.x >= pad.x && pw.x <= pad.x + pad.w) {
          pw.active = false;
          triggerPowerup(pw.type);
        }

        if (pw.y > height) pw.active = false;
      }
    });
  };

  const handleBallLoss = () => {
    audioManager.play('lose');
    const nextLives = lives - 1;
    setLives(nextLives);
    if (nextLives <= 0) {
      setIsPlaying(false);
      onGameOver(score);
    } else {
      // Spawn new starting ball
      ballsRef.current = [{
        x: width/2,
        y: height - 40,
        vx: 3,
        vy: -3.5,
        active: true
      }];
    }
  };

  const triggerPowerup = (type: 'expand' | 'life' | 'multiball') => {
    audioManager.play('levelUp');
    const pad = paddleRef.current;
    
    switch (type) {
      case 'expand':
        pad.w = 120;
        // revert width after 8 seconds
        setTimeout(() => {
          paddleRef.current.w = 80;
        }, 8000);
        break;
      case 'life':
        setLives(prev => prev + 1);
        break;
      case 'multiball':
        // Spawn 2 extra balls
        const active = ballsRef.current[0] || { x: width/2, y: height/2 };
        ballsRef.current.push(
          { x: active.x, y: active.y, vx: -3, vy: -3, active: true },
          { x: active.x, y: active.y, vx: 2, vy: -4, active: true }
        );
        break;
    }
  };

  const spawnBricks = () => {
    const bricks = [];
    const colors = ['#FF4500', '#FF8C00', '#FFD700', '#32CD32'];
    const padX = 8;
    const padY = 6;
    const startY = 40;

    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        bricks.push({
          x: 10 + c * (brickW + padX),
          y: startY + r * (brickH + padY),
          w: brickW,
          h: brickH,
          color: colors[r],
          active: true
        });
      }
    }
    bricksRef.current = bricks;
  };

  const startGame = () => {
    audioManager.play('click');
    setScore(0);
    setLives(3);
    paddleRef.current = { x: width/2 - 40, y: height - 20, w: 80, h: 10 };
    ballsRef.current = [{
      x: width/2,
      y: height - 40,
      vx: 3.2,
      vy: -3.8,
      active: true
    }];
    powerupsRef.current = [];
    spawnBricks();
    setIsPlaying(true);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0F0F23';
    ctx.fillRect(0, 0, width, height);

    // Draw Bricks
    bricksRef.current.forEach(b => {
      if (b.active) {
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        // shiny bevel lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(b.x, b.y, b.w, 3);
      }
    });

    // Draw Paddle
    const pad = paddleRef.current;
    ctx.fillStyle = '#6C63FF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#6C63FF';
    ctx.fillRect(pad.x, pad.y, pad.w, pad.h);

    // Draw Balls
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFFFFF';
    ballsRef.current.forEach(ball => {
      if (ball.active) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw Powerups
    powerupsRef.current.forEach(pw => {
      if (pw.active) {
        const colors = { expand: '#00D4FF', life: '#32CD32', multiball: '#FFD700' };
        const color = colors[pw.type];
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(pw.x + pw.w/2, pw.y + pw.h/2, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // draw inner label letter
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pw.type[0].toUpperCase(), pw.x + pw.w/2, pw.y + pw.h/2 + 3);
      }
    });

    ctx.shadowBlur = 0; // reset
  };

  const moveLeftTouch = () => {
    if (!isPlaying || isPaused) return;
    paddleRef.current.x = Math.max(5, paddleRef.current.x - 35);
    audioManager.play('click');
  };

  const moveRightTouch = () => {
    if (!isPlaying || isPaused) return;
    paddleRef.current.x = Math.min(width - paddleRef.current.w - 5, paddleRef.current.x + 35);
    audioManager.play('click');
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-lg mx-auto">
      {/* Top dashboard */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <span className="text-gray-400">SCORE: <span className="text-secondary font-mono font-bold">{score}</span></span>
        <span className="text-red-400 font-bold">LIVES: {Array(lives).fill('❤️').join('')}</span>
      </div>

      {/* Arena Canvas */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[6/5] w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {lives <= 0 ? `Game Over! Final Score: ${score}` : 'Retro Brick Smash'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-darkbg" /> Start Bricks
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-4 sm:hidden w-full max-w-xs font-orbitron font-bold">
        <button
          onClick={moveLeftTouch}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg text-xs"
        >
          LEFT
        </button>
        <button
          onClick={moveRightTouch}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg text-xs"
        >
          RIGHT
        </button>
      </div>
    </div>
  );
};
