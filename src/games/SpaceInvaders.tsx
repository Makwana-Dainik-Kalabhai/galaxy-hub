import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface SpaceInvadersProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Entity = { x: number; y: number; w: number; h: number; active: boolean };
type Shield = Entity & { lives: number };

export const SpaceInvaders: React.FC<SpaceInvadersProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  const width = 480;
  const height = 400;

  // Refs for animation loop state
  const playerRef = useRef<Entity>({ x: width/2 - 15, y: height - 30, w: 30, h: 15, active: true });
  const lasersRef = useRef<Entity[]>([]);
  const alienLasersRef = useRef<Entity[]>([]);
  const aliensRef = useRef<(Entity & { type: number })[]>([]);
  const shieldsRef = useRef<Shield[]>([]);
  
  const alienDirection = useRef<number>(1); // 1 = right, -1 = left
  const alienMoveTimer = useRef<number>(0);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Bind keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ' && isPlaying && !isPaused) {
        shootPlayerLaser();
      }
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
  }, [isPlaying, isPaused]);

  // Main Loop
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

  const shootPlayerLaser = () => {
    // Restrict to max 3 active lasers to prevent spamming
    if (lasersRef.current.filter(l => l.active).length >= 3) return;
    
    audioManager.play('laser');
    lasersRef.current.push({
      x: playerRef.current.x + playerRef.current.w / 2 - 2,
      y: playerRef.current.y - 12,
      w: 4,
      h: 12,
      active: true
    });
  };

  const updatePhysics = () => {
    // 1. Move Player
    const player = playerRef.current;
    const pSpeed = 4.5;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
      player.x = Math.max(10, player.x - pSpeed);
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
      player.x = Math.min(width - player.w - 10, player.x + pSpeed);
    }

    // 2. Move Player Lasers
    lasersRef.current.forEach(laser => {
      if (laser.active) {
        laser.y -= 7;
        if (laser.y < 0) laser.active = false;
      }
    });

    // 3. Move Alien Lasers
    alienLasersRef.current.forEach(laser => {
      if (laser.active) {
        laser.y += 4.5;
        if (laser.y > height) laser.active = false;
      }
    });

    // 4. Move Aliens (moves every X frames to give retro stepping animation)
    alienMoveTimer.current++;
    const stepInterval = Math.max(15, 45 - Math.floor(score / 200)); // speeds up as aliens die
    if (alienMoveTimer.current >= stepInterval) {
      alienMoveTimer.current = 0;
      
      let hitEdge = false;
      const aliens = aliensRef.current.filter(a => a.active);
      
      if (aliens.length === 0) {
        // Clear Wave! Spawn next wave
        spawnAliens();
        return;
      }

      aliens.forEach(alien => {
        alien.x += alienDirection.current * 12;
        if (alien.x <= 10 || alien.x >= width - alien.w - 10) {
          hitEdge = true;
        }
      });

      if (hitEdge) {
        alienDirection.current = -alienDirection.current;
        aliens.forEach(alien => {
          alien.y += 15;
          // Check if aliens reach player shields height
          if (alien.y + alien.h >= player.y) {
            triggerGameOver();
          }
        });
      }

      // Random alien shooting
      if (Math.random() < 0.35) {
        const firingAlien = aliens[Math.floor(Math.random() * aliens.length)];
        alienLasersRef.current.push({
          x: firingAlien.x + firingAlien.w / 2 - 2,
          y: firingAlien.y + firingAlien.h,
          w: 4,
          h: 12,
          active: true
        });
      }
    }

    // 5. Collision Checks
    const activeLasers = lasersRef.current.filter(l => l.active);
    const activeAlienLasers = alienLasersRef.current.filter(l => l.active);
    const activeAliens = aliensRef.current.filter(a => a.active);
    const shields = shieldsRef.current;

    // Player laser hitting aliens
    activeLasers.forEach(laser => {
      activeAliens.forEach(alien => {
        if (checkRectOverlap(laser, alien)) {
          laser.active = false;
          alien.active = false;
          audioManager.play('hit');
          setScore(prev => prev + 25);
        }
      });

      // Player laser hitting shields
      shields.forEach(shield => {
        if (shield.lives > 0 && checkRectOverlap(laser, shield)) {
          laser.active = false;
          shield.lives--;
          audioManager.play('click');
        }
      });
    });

    // Alien lasers hitting player
    activeAlienLasers.forEach(laser => {
      if (checkRectOverlap(laser, player)) {
        laser.active = false;
        triggerGameOver();
      }

      // Alien lasers hitting shields
      shields.forEach(shield => {
        if (shield.lives > 0 && checkRectOverlap(laser, shield)) {
          laser.active = false;
          shield.lives--;
          audioManager.play('click');
        }
      });
    });
  };

  const checkRectOverlap = (r1: Entity, r2: Entity): boolean => {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  };

  const triggerGameOver = () => {
    setIsPlaying(false);
    audioManager.play('lose');
    onGameOver(score);
  };

  const spawnAliens = () => {
    const cols = 7;
    const rows = 4;
    const aliens = [];
    const alienW = 24;
    const alienH = 16;
    const spacingX = 14;
    const spacingY = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        aliens.push({
          x: 40 + c * (alienW + spacingX),
          y: 40 + r * (alienH + spacingY),
          w: alienW,
          h: alienH,
          active: true,
          type: r
        });
      }
    }
    aliensRef.current = aliens;
  };

  const spawnShields = () => {
    const shields = [];
    const count = 3;
    const shieldW = 45;
    const shieldH = 20;
    const step = width / (count + 1);

    for (let i = 0; i < count; i++) {
      shields.push({
        x: step * (i + 1) - shieldW / 2,
        y: height - 80,
        w: shieldW,
        h: shieldH,
        active: true,
        lives: 6 // 6 hits to break
      });
    }
    shieldsRef.current = shields;
  };

  const startGame = () => {
    audioManager.play('click');
    setScore(0);
    playerRef.current = { x: width/2 - 15, y: height - 30, w: 30, h: 15, active: true };
    lasersRef.current = [];
    alienLasersRef.current = [];
    spawnAliens();
    spawnShields();
    alienDirection.current = 1;
    alienMoveTimer.current = 0;
    setIsPlaying(true);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#070714';
    ctx.fillRect(0, 0, width, height);

    // Stars background decoration
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(50, 60, 2, 2);
    ctx.fillRect(150, 220, 1.5, 1.5);
    ctx.fillRect(280, 80, 2, 2);
    ctx.fillRect(400, 150, 1.5, 1.5);
    ctx.fillRect(320, 280, 2, 2);

    // Draw Player Ship
    const player = playerRef.current;
    ctx.fillStyle = '#6C63FF';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#6C63FF';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Draw nozzle gun
    ctx.fillRect(player.x + player.w/2 - 3, player.y - 5, 6, 5);

    // Draw Player Lasers
    ctx.fillStyle = '#00D4FF';
    ctx.shadowColor = '#00D4FF';
    lasersRef.current.forEach(laser => {
      if (laser.active) {
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      }
    });

    // Draw Alien Lasers
    ctx.fillStyle = '#FF5252';
    ctx.shadowColor = '#FF5252';
    alienLasersRef.current.forEach(laser => {
      if (laser.active) {
        ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      }
    });

    // Draw Shields
    shieldsRef.current.forEach(shield => {
      if (shield.lives > 0) {
        const opacity = shield.lives / 6;
        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
        ctx.shadowColor = `rgba(34, 197, 94, ${opacity})`;
        ctx.fillRect(shield.x, shield.y, shield.w, shield.h);
        
        // Write hits left inside block
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(shield.lives), shield.x + shield.w/2, shield.y + 13);
      }
    });

    // Draw Aliens
    aliensRef.current.forEach(alien => {
      if (alien.active) {
        const colors = ['#FF4500', '#FF8C00', '#32CD32', '#00D4FF'];
        ctx.fillStyle = colors[alien.type % colors.length];
        ctx.shadowColor = colors[alien.type % colors.length];
        ctx.shadowBlur = 6;
        
        // Draw pixelated-looking space alien rectangle
        ctx.fillRect(alien.x, alien.y, alien.w, alien.h);
        
        // Draw alien eyes
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.fillRect(alien.x + 4, alien.y + 4, 3, 3);
        ctx.fillRect(alien.x + alien.w - 7, alien.y + 4, 3, 3);
      }
    });

    ctx.shadowBlur = 0; // reset
  };

  const moveLeftTouch = () => {
    if (!isPlaying || isPaused) return;
    playerRef.current.x = Math.max(10, playerRef.current.x - 30);
    audioManager.play('click');
  };

  const moveRightTouch = () => {
    if (!isPlaying || isPaused) return;
    playerRef.current.x = Math.min(width - playerRef.current.w - 10, playerRef.current.x + 30);
    audioManager.play('click');
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-lg mx-auto">
      {/* Top statistics */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <span className="text-gray-400">SCORE: <span className="text-secondary font-mono font-bold">{score}</span></span>
        <button
          onClick={startGame}
          className="text-xs text-gray-500 hover:text-white transition flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> RESTART
        </button>
      </div>

      {/* Arena Canvas */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[6/5] w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block animate-pulse-slow"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {score > 0 ? `Wave Cleared! Score: ${score}` : 'Ready to Defend?'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-darkbg" /> Start Defense
            </button>
          </div>
        )}
      </div>

      {/* Button Controls for mobile */}
      <div className="flex gap-4 sm:hidden w-full max-w-xs font-orbitron font-bold">
        <button
          onClick={moveLeftTouch}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg text-xs"
        >
          LEFT
        </button>
        <button
          onClick={() => { if (isPlaying && !isPaused) shootPlayerLaser(); }}
          className="flex-1 bg-gradient-to-r from-primary to-secondary text-darkbg py-3 rounded-lg text-xs"
        >
          SHOOT
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
