import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface RhythmProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Note = { id: number; lane: number; y: number; active: boolean };

const LANES = [0, 1, 2, 3];
const LANE_KEYS = ['D', 'F', 'J', 'K'];
const LANE_COLORS = ['#6C63FF', '#00D4FF', '#32CD32', '#FF8C00'];

export const Rhythm: React.FC<RhythmProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(40); // 40 second round

  const width = 360;
  const height = 440;
  const targetY = height - 60;

  // Loop references to keep values updated in intervals
  const notesRef = useRef<Note[]>([]);
  const noteIdCounter = useRef(0);
  const frameCountRef = useRef(0);
  const feedbackTimerRef = useRef<any>(null);

  const keysPressed = useRef<Record<string, boolean>>({});

  // Bind keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;

      const key = e.key.toUpperCase();
      const laneIdx = LANE_KEYS.indexOf(key);

      if (laneIdx !== -1 && !keysPressed.current[key]) {
        keysPressed.current[key] = true;
        triggerLaneHit(laneIdx);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isPaused, score, combo]);

  // Game countdown timer
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, score]);

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
  }, [isPlaying, isPaused, score, combo]);

  // Initial draw
  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  const triggerLaneHit = (lane: number) => {
    // Find closest note in this lane
    const laneNotes = notesRef.current.filter(n => n.lane === lane && n.active);
    if (laneNotes.length === 0) return;

    // Sort by y coordinates (closest to bottom first)
    laneNotes.sort((a, b) => b.y - a.y);
    const closest = laneNotes[0];

    const dist = Math.abs(closest.y - targetY);

    if (dist <= 18) {
      // PERFECT HIT
      triggerHitFeedback('PERFECT!', 'text-green-400');
      audioManager.play('score');
      closest.active = false;
      
      const scoreAdd = 100 * (1 + Math.floor(combo / 10) * 0.25);
      setScore(prev => prev + Math.floor(scoreAdd));
      setCombo(prev => {
        const next = prev + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });
    } else if (dist <= 38) {
      // GOOD HIT
      triggerHitFeedback('GOOD!', 'text-secondary');
      audioManager.play('click');
      closest.active = false;
      
      const scoreAdd = 50 * (1 + Math.floor(combo / 10) * 0.1);
      setScore(prev => prev + Math.floor(scoreAdd));
      setCombo(prev => {
        const next = prev + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });
    } else if (closest.y > targetY - 60 && closest.y < targetY + 30) {
      // BAD/EARLY PRESS -> MISS
      triggerHitFeedback('MISS', 'text-red-500');
      audioManager.play('lose');
      setCombo(0);
    }
  };

  const triggerHitFeedback = (text: string, color: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ text, color });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 450);
  };

  const updatePhysics = () => {
    // 1. Move Notes Downwards
    const notes = notesRef.current;
    const speed = 3.6 + Math.floor(score / 800) * 0.3; // accelerates as score grows

    notes.forEach(note => {
      if (note.active) {
        note.y += speed;
        // Check if note falls past bottom (Miss)
        if (note.y > height) {
          note.active = false;
          triggerHitFeedback('MISS', 'text-red-500');
          audioManager.play('lose');
          setCombo(0);
        }
      }
    });

    // 2. Spawn Notes
    frameCountRef.current++;
    // spawn rates (based on difficulty/tempo)
    const spawnRate = Math.max(20, 36 - Math.floor(score / 1200) * 3);
    if (frameCountRef.current % spawnRate === 0) {
      const activeLanesCount = 1 + (Math.random() < 0.25 ? 1 : 0); // 25% chance of chord (double note)
      const shuffledLanes = [...LANES].sort(() => Math.random() - 0.5);

      for (let i = 0; i < activeLanesCount; i++) {
        noteIdCounter.current++;
        notes.push({
          id: noteIdCounter.current,
          lane: shuffledLanes[i],
          y: -15,
          active: true
        });
      }
    }

    notesRef.current = notes.filter(n => n.active);
  };

  const endGame = () => {
    setIsPlaying(false);
    audioManager.play('win');
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    onGameOver(score + maxCombo * 10);
  };

  const startGame = () => {
    audioManager.play('click');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(40);
    notesRef.current = [];
    frameCountRef.current = 0;
    setFeedback(null);
    setIsPlaying(true);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark grid background
    ctx.fillStyle = '#090918';
    ctx.fillRect(0, 0, width, height);

    const laneW = width / 4;

    // Draw Lane lines and key indicators
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW, 0);
      ctx.lineTo(i * laneW, height);
      ctx.stroke();
    }

    // Draw target bars at the bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, targetY - 12, width, 24);

    LANES.forEach(idx => {
      // Draw target rings
      ctx.strokeStyle = LANE_COLORS[idx];
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = LANE_COLORS[idx];
      ctx.beginPath();
      ctx.arc(idx * laneW + laneW/2, targetY, 15, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw keyboard bind key inside ring
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(LANE_KEYS[idx], idx * laneW + laneW/2, targetY + 3);
    });

    // Draw Falling Notes
    notesRef.current.forEach(note => {
      if (note.active) {
        ctx.fillStyle = LANE_COLORS[note.lane];
        ctx.shadowBlur = 10;
        ctx.shadowColor = LANE_COLORS[note.lane];
        
        // draw rounded note capsule block
        const rx = note.lane * laneW + 10;
        const ry = note.y - 6;
        const rw = laneW - 20;
        const rh = 12;
        const rr = 4;

        ctx.beginPath();
        ctx.moveTo(rx + rr, ry);
        ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rr);
        ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rr);
        ctx.arcTo(rx, ry + rh, rx, ry, rr);
        ctx.arcTo(rx, ry, rx + rw, ry, rr);
        ctx.closePath();
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0; // reset
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-md mx-auto select-none">
      {/* Score and combo counts */}
      <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 p-3 rounded-xl w-full text-center font-orbitron text-[10px]">
        <div>
          <p className="text-gray-500 font-bold">SCORE</p>
          <h4 className="text-sm font-black text-white mt-0.5 font-mono">{score}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">COMBO</p>
          <h4 className="text-sm font-black text-secondary mt-0.5 font-mono">{combo}x</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">TIME</p>
          <h4 className="text-sm font-black text-yellow-400 mt-0.5 font-mono">{timeLeft}s</h4>
        </div>
      </div>

      {/* Main track screen viewport */}
      <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[4/5] w-72 sm:w-80">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {feedback && (
          <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron font-black text-xl tracking-wider select-none animate-ping ${feedback.color}`}>
            {feedback.text}
          </div>
        )}

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {score > 0 ? `Show Finished! Score: ${score}` : 'Rhythm Beats Hero'}
            </h4>
            <p className="text-[10px] text-gray-500 max-w-xs mb-3 font-orbitron">
              Press D, F, J, K when descending notes align with the targets at the bottom. Maintain combo streaks!
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Beats
            </button>
          </div>
        )}
      </div>

      {/* Touch keys */}
      <div className="flex gap-2 w-full max-w-xs font-orbitron font-bold sm:hidden">
        {LANE_KEYS.map((k, idx) => (
          <button
            key={k}
            onTouchStart={() => triggerLaneHit(idx)}
            className="flex-1 py-4 border border-white/5 rounded-xl flex items-center justify-center font-black"
            style={{ color: LANE_COLORS[idx], backgroundColor: 'rgba(26, 26, 46, 0.6)' }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};
