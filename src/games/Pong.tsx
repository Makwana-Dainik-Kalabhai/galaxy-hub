import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Play, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface PongProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

export const Pong: React.FC<PongProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [aiSpeed, setAiSpeed] = useState<number>(3.5); // AI paddle track speed

  // Physics dimensions mapping
  const width = 600;
  const height = 400;
  const paddleWidth = 10;
  const paddleHeight = 70;

  const playerY = useRef(height / 2 - paddleHeight / 2);
  const computerY = useRef(height / 2 - paddleHeight / 2);
  const ballX = useRef(width / 2);
  const ballY = useRef(height / 2);
  const ballSpeedX = useRef(4);
  const ballSpeedY = useRef(3);
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
  }, [isPlaying, isPaused, aiSpeed, playerScore, computerScore]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const updatePhysics = () => {
    // 1. Move Player paddle
    const pSpeed = 6;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
      playerY.current = Math.max(0, playerY.current - pSpeed);
    }
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
      playerY.current = Math.min(height - paddleHeight, playerY.current + pSpeed);
    }

    // 2. Move Computer paddle (AI tracking)
    const targetY = ballY.current - paddleHeight / 2;
    const diff = targetY - computerY.current;
    const step = Math.min(Math.abs(diff), aiSpeed);
    if (diff > 0) {
      computerY.current = Math.min(height - paddleHeight, computerY.current + step);
    } else {
      computerY.current = Math.max(0, computerY.current - step);
    }

    // 3. Move Ball
    ballX.current += ballSpeedX.current;
    ballY.current += ballSpeedY.current;

    // 4. Wall Collisions (Top/Bottom)
    if (ballY.current <= 0 || ballY.current >= height) {
      ballSpeedY.current = -ballSpeedY.current;
      audioManager.play('click');
    }

    // 5. Paddle Collisions (Left / Player)
    if (ballX.current <= paddleWidth + 10) {
      if (ballY.current >= playerY.current && ballY.current <= playerY.current + paddleHeight) {
        ballSpeedX.current = -ballSpeedX.current;
        // Increase speed slightly
        ballSpeedX.current += ballSpeedX.current > 0 ? 0.3 : -0.3;
        audioManager.play('hit');
      } else if (ballX.current <= 0) {
        // Computer Scores!
        scorePoint('computer');
      }
    }

    // 6. Paddle Collisions (Right / Computer)
    if (ballX.current >= width - paddleWidth - 10) {
      if (ballY.current >= computerY.current && ballY.current <= computerY.current + paddleHeight) {
        ballSpeedX.current = -ballSpeedX.current;
        ballSpeedX.current += ballSpeedX.current > 0 ? 0.3 : -0.3;
        audioManager.play('hit');
      } else if (ballX.current >= width) {
        // Player Scores!
        scorePoint('player');
      }
    }
  };

  const scorePoint = (who: 'player' | 'computer') => {
    audioManager.play('score');
    if (who === 'player') {
      const nextScore = playerScore + 1;
      setPlayerScore(nextScore);
      if (nextScore >= 5) {
        endGame(true);
      } else {
        resetBall(1);
      }
    } else {
      const nextScore = computerScore + 1;
      setComputerScore(nextScore);
      if (nextScore >= 5) {
        endGame(false);
      } else {
        resetBall(-1);
      }
    }
  };

  const resetBall = (dir: number) => {
    ballX.current = width / 2;
    ballY.current = height / 2;
    ballSpeedX.current = dir * 4;
    ballSpeedY.current = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
  };

  const endGame = (playerWon: boolean) => {
    setIsPlaying(false);
    if (playerWon) {
      audioManager.play('win');
      onGameOver(500); // Max points
    } else {
      audioManager.play('lose');
      onGameOver(playerScore * 50); // Fractional points
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear board
    ctx.fillStyle = '#0F0F23';
    ctx.fillRect(0, 0, width, height);

    // Center divider dash line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Draw Left Player Paddle
    ctx.fillStyle = '#6C63FF';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#6C63FF';
    ctx.fillRect(10, playerY.current, paddleWidth, paddleHeight);

    // Draw Right Computer Paddle
    ctx.fillStyle = '#00D4FF';
    ctx.shadowColor = '#00D4FF';
    ctx.fillRect(width - paddleWidth - 10, computerY.current, paddleWidth, paddleHeight);

    // Draw Ball
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ballX.current, ballY.current, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowBlur = 0; // reset
  };

  const startGame = () => {
    audioManager.play('click');
    setPlayerScore(0);
    setComputerScore(0);
    playerY.current = height / 2 - paddleHeight / 2;
    computerY.current = height / 2 - paddleHeight / 2;
    resetBall(1);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-3 max-w-xl mx-auto">
      {/* Slider controls & scoring board */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <div className="flex flex-col gap-1 items-start">
          <label className="text-[9px] text-gray-500 font-bold uppercase">CPU Difficulty</label>
          <input
            id="pong-cpu-difficulty"
            type="range"
            min={1.5}
            max={6}
            step={0.5}
            value={aiSpeed}
            onChange={(e) => { setAiSpeed(parseFloat(e.target.value)); audioManager.play('click'); }}
            className="w-24 accent-secondary bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
          />
        </div>

        <div className="flex gap-4 text-sm font-black">
          <span className="text-primary">{playerScore}</span>
          <span className="text-gray-600">:</span>
          <span className="text-secondary">{computerScore}</span>
        </div>

        <div className="text-[10px] text-gray-500 font-bold">FIRST TO 5 WINS</div>
      </div>

      {/* Canvas */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[3/2] w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {playerScore >= 5 ? '🏆 PLAYER VICTORIOUS!' : computerScore >= 5 ? '💀 CPU VICTORIOUS!' : 'Retro Table Tennis'}
            </h4>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Match
            </button>
          </div>
        )}
      </div>

      {/* Mobile touch keys */}
      <div className="flex gap-4 sm:hidden w-full max-w-xs">
        <button
          onTouchStart={() => { keysPressed.current['ArrowUp'] = true; }}
          onTouchEnd={() => { keysPressed.current['ArrowUp'] = false; }}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg flex items-center justify-center"
        >
          <ArrowUp className="w-5 h-5 text-gray-400" />
        </button>
        <button
          onTouchStart={() => { keysPressed.current['ArrowDown'] = true; }}
          onTouchEnd={() => { keysPressed.current['ArrowDown'] = false; }}
          className="flex-1 bg-cardbg border border-white/5 py-3 rounded-lg flex items-center justify-center"
        >
          <ArrowDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
};
