import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface PlatformerProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Entity = { x: number; y: number; w: number; h: number };
type Coin = Entity & { active: boolean };
type Spike = Entity;

export const Platformer: React.FC<PlatformerProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const width = 480;
  const height = 300;

  // Player physics state variables (refs to avoid interval staleness)
  const px = useRef(50);
  const py = useRef(150);
  const vx = useRef(0);
  const vy = useRef(0);
  const isGrounded = useRef(false);

  // Level components definition
  const platformsRef = useRef<Entity[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const spikesRef = useRef<Spike[]>([]);
  const checkpointRef = useRef<Entity>({ x: 900, y: 190, w: 20, h: 40 }); // Target Flag
  const scrollOffset = useRef(0);

  const keysPressed = useRef<Record<string, boolean>>({});

  // Bind keyboard inputs
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

  // Set up platforms, coins, spikes based on active level
  const generateLevel = (lvl: number) => {
    px.current = 50;
    py.current = 150;
    vx.current = 0;
    vy.current = 0;
    scrollOffset.current = 0;

    // Standard floor platforms
    platformsRef.current = [
      { x: 0, y: 240, w: 300, h: 60 },
      { x: 380, y: 220, w: 180, h: 80 },
      { x: 620, y: 190, w: 150, h: 110 },
      { x: 840, y: 230, w: 200, h: 70 }
    ];

    // Coins distribution
    coinsRef.current = [
      { x: 120, y: 200, w: 10, h: 10, active: true },
      { x: 200, y: 160, w: 10, h: 10, active: true },
      { x: 440, y: 150, w: 10, h: 10, active: true },
      { x: 480, y: 150, w: 10, h: 10, active: true },
      { x: 680, y: 120, w: 10, h: 10, active: true },
      { x: 880, y: 170, w: 10, h: 10, active: true },
      { x: 920, y: 170, w: 10, h: 10, active: true }
    ];

    // Spikes hazard positions
    spikesRef.current = [
      { x: 460, y: 210, w: 20, h: 10 },
      { x: 700, y: 180, w: 20, h: 10 }
    ];

    // Flag target coordinate
    checkpointRef.current = { x: 970, y: 190, w: 20, h: 40 };
  };

  useEffect(() => {
    generateLevel(level);
  }, [level]);

  // Main game physics loop
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
  }, [isPlaying, isPaused, score, level]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const updatePhysics = () => {
    // 1. Horizontal acceleration inputs
    const speed = 3.2;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
      vx.current = -speed;
    } else if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
      vx.current = speed;
    } else {
      vx.current = 0;
    }

    // 2. Jump input
    if ((keysPressed.current['ArrowUp'] || keysPressed.current[' '] || keysPressed.current['w'] || keysPressed.current['W']) && isGrounded.current) {
      vy.current = -6.5;
      isGrounded.current = false;
      audioManager.play('jump');
    }

    // 3. Gravity acceleration
    const gravity = 0.28;
    vy.current += gravity;

    // Apply velocities
    px.current += vx.current;
    py.current += vy.current;

    // 4. Platform Collisions
    isGrounded.current = false;
    const playerW = 16;
    const playerH = 24;

    platformsRef.current.forEach(p => {
      // Check collision coordinates
      const hitX = px.current + playerW > p.x && px.current < p.x + p.w;
      const hitY = py.current + playerH > p.y && py.current < p.y + p.h;

      if (hitX && hitY) {
        // Resolve falling collision: land player on top of platform
        if (vy.current > 0 && py.current + playerH - vy.current <= p.y + 6) {
          py.current = p.y - playerH;
          vy.current = 0;
          isGrounded.current = true;
        }
      }
    });

    // 5. Coin collection checks
    const playerBox = { x: px.current, y: py.current, w: playerW, h: playerH };
    coinsRef.current.forEach(c => {
      if (c.active && checkOverlap(playerBox, c)) {
        c.active = false;
        audioManager.play('score');
        setScore(prev => prev + 50);
      }
    });

    // 6. Spike crash checks
    spikesRef.current.forEach(s => {
      if (checkOverlap(playerBox, s)) {
        triggerDeath();
      }
    });

    // 7. Pit fall check
    if (py.current > height) {
      triggerDeath();
    }

    // 8. Checkpoint flag reach
    if (checkOverlap(playerBox, checkpointRef.current)) {
      handleCheckpointReached();
    }

    // Adjust camera scroll offset to track player center
    if (px.current - scrollOffset.current > width * 0.55) {
      scrollOffset.current = px.current - width * 0.55;
    } else if (px.current - scrollOffset.current < width * 0.25) {
      scrollOffset.current = Math.max(0, px.current - width * 0.25);
    }
  };

  const checkOverlap = (r1: Entity, r2: Entity): boolean => {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  };

  const triggerDeath = () => {
    audioManager.play('lose');
    setIsPlaying(false);
    onGameOver(score);
  };

  const handleCheckpointReached = () => {
    audioManager.play('win');
    if (level < 3) {
      setLevel(prev => prev + 1);
      setScore(prev => prev + 200);
    } else {
      setIsPlaying(false);
      onGameOver(score + 1000); // Complete campaign bonus
    }
  };

  const startGame = () => {
    audioManager.play('click');
    setScore(0);
    setLevel(1);
    generateLevel(1);
    setIsPlaying(true);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient sky
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#0F0F26');
    sky.addColorStop(1, '#1C1542');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Scroll coordinates translation
    ctx.translate(-scrollOffset.current, 0);

    // Draw Platforms
    platformsRef.current.forEach(p => {
      ctx.fillStyle = '#1A1A3F';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#1A1A3F';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      
      // glowing neon top border line
      ctx.fillStyle = '#6C63FF';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#6C63FF';
      ctx.fillRect(p.x, p.y, p.w, 4);
    });

    // Draw Coins
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
    coinsRef.current.forEach(c => {
      if (c.active) {
        ctx.beginPath();
        ctx.arc(c.x + c.w/2, c.y + c.h/2, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw Spikes
    ctx.fillStyle = '#FF4500';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FF4500';
    spikesRef.current.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w/2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    });

    // Draw Flag Checkpoint
    const flag = checkpointRef.current;
    ctx.fillStyle = '#00D4FF';
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 10;
    ctx.fillRect(flag.x, flag.y, 4, flag.h); // pole
    ctx.beginPath();
    ctx.moveTo(flag.x + 4, flag.y);
    ctx.lineTo(flag.x + 22, flag.y + 10);
    ctx.lineTo(flag.x + 4, flag.y + 20);
    ctx.closePath();
    ctx.fill(); // banner

    // Draw Player
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 12;
    ctx.fillRect(px.current, py.current, 16, 24);

    ctx.restore();
    ctx.shadowBlur = 0; // reset
  };

  const moveLeftTouch = () => {
    if (!isPlaying || isPaused) return;
    vx.current = -3;
    setTimeout(() => { vx.current = 0; }, 300);
  };

  const moveRightTouch = () => {
    if (!isPlaying || isPaused) return;
    vx.current = 3;
    setTimeout(() => { vx.current = 0; }, 300);
  };

  const jumpTouch = () => {
    if (!isPlaying || isPaused || !isGrounded.current) return;
    vy.current = -6.5;
    isGrounded.current = false;
    audioManager.play('jump');
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-lg mx-auto">
      {/* HUD Info */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <span className="text-gray-400">SCORE: <span className="text-secondary font-mono font-bold">{score}</span></span>
        <span className="text-primary font-bold">LEVEL: {level} / 3</span>
      </div>

      {/* Viewport Canvas */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[8/5] w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {score > 0 ? `Run Finished! Final Score: ${score}` : 'Neon Platform Runner'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-darkbg" /> Start Run
            </button>
          </div>
        )}
      </div>

      {/* Touch keys */}
      <div className="flex gap-4 sm:hidden w-full max-w-xs font-orbitron font-bold">
        <button
          onClick={moveLeftTouch}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg text-xs"
        >
          LEFT
        </button>
        <button
          onClick={jumpTouch}
          className="flex-1 bg-gradient-to-r from-primary to-secondary text-darkbg py-3 rounded-lg text-xs"
        >
          JUMP
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
