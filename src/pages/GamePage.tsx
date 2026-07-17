import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize2, Trophy, HelpCircle, Star } from 'lucide-react';
import { GAMES } from '../utils/gamesData';
import { audioManager } from '../utils/audioManager';
import { getLeaderboard, submitScore, updatePlaytime, type ScoreRecord } from '../utils/storage';

// Import All 20 Games
import { TicTacToe } from '../games/TicTacToe';
import { RockPaperScissors } from '../games/RockPaperScissors';
import { MemoryCard } from '../games/MemoryCard';
import { WhackAMole } from '../games/WhackAMole';
import { Hangman } from '../games/Hangman';
import { Snake } from '../games/Snake';
import { Pong } from '../games/Pong';
import { Tetris } from '../games/Tetris';
import { SpaceInvaders } from '../games/SpaceInvaders';
import { Sudoku } from '../games/Sudoku';
import { FlappyBird } from '../games/FlappyBird';
import { Wordle } from '../games/Wordle';
import { Breakout } from '../games/Breakout';
import { Chess } from '../games/Chess';
import { Platformer } from '../games/Platformer';
import { Game2048 } from '../games/Game2048';
import { Battleship } from '../games/Battleship';
import { Roguelike } from '../games/Roguelike';
import { RPG } from '../games/RPG';
import { Rhythm } from '../games/Rhythm';

interface GamePageProps {
  gameId: string;
  onBack: () => void;
  onProfileUpdated: () => void;
}

const GAME_MAP: Record<string, React.ComponentType<any>> = {
  'tic-tac-toe': TicTacToe,
  'rock-paper-scissors': RockPaperScissors,
  'memory-card': MemoryCard,
  'whack-a-mole': WhackAMole,
  'hangman': Hangman,
  'snake': Snake,
  'pong': Pong,
  'tetris': Tetris,
  'space-invaders': SpaceInvaders,
  'sudoku': Sudoku,
  'flappy-bird': FlappyBird,
  'wordle': Wordle,
  'breakout': Breakout,
  'chess': Chess,
  'platformer': Platformer,
  '2048': Game2048,
  'battleship': Battleship,
  'roguelike': Roguelike,
  'rpg': RPG,
  'rhythm': Rhythm
};

export const GamePage: React.FC<GamePageProps> = ({ gameId, onBack, onProfileUpdated }) => {
  const game = GAMES.find(g => g.id === gameId);
  const GameComponent = GAME_MAP[gameId];

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const sessionSeconds = useRef(0);

  // Load leaderboard & start playtime counter
  useEffect(() => {
    setLeaderboard(getLeaderboard(gameId));
    sessionSeconds.current = 0;
    
    // Playtime tracker interval
    const interval = setInterval(() => {
      sessionSeconds.current += 1;
    }, 1000);

    return () => {
      clearInterval(interval);
      // Persist elapsed playtime on cleanup
      if (sessionSeconds.current > 0) {
        updatePlaytime(sessionSeconds.current);
      }
    };
  }, [gameId]);

  if (!game || !GameComponent) {
    return (
      <div className="text-center py-20 font-orbitron">
        <p className="text-red-400 font-bold mb-4">Error loading game engine.</p>
        <button onClick={onBack} className="text-secondary hover:underline">Return Home</button>
      </div>
    );
  }

  const handleMuteToggle = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
    audioManager.play('click');
    onProfileUpdated();
  };

  const handleFullscreen = () => {
    audioManager.play('click');
    if (gameAreaRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        gameAreaRef.current.requestFullscreen().catch(err => {
          console.warn("Fullscreen request rejected: ", err);
        });
      }
    }
  };

  const handleGameOver = (score: number) => {
    // Submit score, update profile XP/Levels/Achievements
    const result = submitScore(gameId, score);
    setLeaderboard(getLeaderboard(gameId));
    onProfileUpdated();

    // Trigger visual popups for leveling up or unlocking badges
    if (result.leveledUp) {
      triggerToast(`✨ LEVEL UP! You reached Level ${result.newLevel}!`);
    } else if (result.unlockedNow.length > 0) {
      triggerToast(`🏆 TROPHY UNLOCKED: ${result.unlockedNow[0].name}!`);
    } else if (score > 0) {
      triggerToast(`✓ Score Submitted: +${score} points!`);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Toast Achievements alerts */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs px-5 py-3.5 rounded-xl shadow-2xl z-50 animate-bounce border border-white/20 select-none">
          {toastMessage}
        </div>
      )}

      {/* Header back row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <button
          onClick={() => { audioManager.play('click'); onBack(); }}
          className="flex items-center gap-2 text-xs font-orbitron font-black uppercase text-gray-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" /> Return to Hub
        </button>

        <div className="flex items-center gap-3">
          <span className="text-4xl select-none">{game.emoji}</span>
          <div>
            <h2 className="font-orbitron font-black text-xl md:text-2xl tracking-wider text-white">
              {game.title}
            </h2>
            <span className="text-[10px] uppercase font-bold text-secondary tracking-widest">
              {game.category} &bull; {game.players}
            </span>
          </div>
        </div>

        {/* Rating and count stats */}
        <div className="flex gap-4 text-xs font-orbitron text-gray-400 font-bold select-none">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span>{game.rating}</span>
          </div>
          <div>|</div>
          <div>Play Count: <span className="text-white font-mono">{game.playCount}</span></div>
        </div>
      </div>

      {/* Primary Row: Left is Game Area, Right is Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Game viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            ref={gameAreaRef}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative bg-gradient-to-b from-cardbg/80 to-black/60 shadow-2xl flex flex-col justify-center min-h-[350px]"
          >
            {/* Overlay indicators on pause */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center rounded-2xl z-30 select-none">
                <h3 className="font-orbitron font-black text-lg text-secondary tracking-widest animate-pulse mb-4">
                  GAME PAUSED
                </h3>
                <button
                  onClick={() => { setIsPaused(false); audioManager.play('click'); }}
                  className="bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
                >
                  Resume Play
                </button>
              </div>
            )}

            {/* Sub Game Component */}
            <GameComponent onGameOver={handleGameOver} isPaused={isPaused} />
          </div>

          {/* Quick viewport controls */}
          <div className="flex gap-3 justify-center items-center bg-black/40 border border-white/5 py-2.5 px-4 rounded-xl">
            <button
              onClick={() => { setIsPaused(!isPaused); audioManager.play('click'); }}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition"
              title={isPaused ? "Resume Game" : "Pause Game"}
            >
              {isPaused ? <Play className="w-5 h-5 fill-current text-secondary" /> : <Pause className="w-5 h-5" />}
            </button>

            <button
              onClick={handleMuteToggle}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition"
              title={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-secondary" />}
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition"
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-5 h-5 text-secondary" />
            </button>
          </div>
        </div>

        {/* Side Panel: Instructions & Leaderboards */}
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex justify-between items-center text-left font-orbitron font-bold text-xs uppercase tracking-wider text-secondary"
            >
              <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> How to Play</span>
              <span>{showInstructions ? '▲' : '▼'}</span>
            </button>
            
            {showInstructions && (
              <ul className="list-disc list-inside text-xs text-gray-400 space-y-2 pt-2 border-t border-white/5">
                {game.instructions.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">{step}</li>
                ))}
              </ul>
            )}
          </div>

          {/* High Scores Leaderboard */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h4 className="font-orbitron font-extrabold text-xs uppercase tracking-wider text-white flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-yellow-400" /> Top 10 Leaderboard
            </h4>
            
            <div className="divide-y divide-white/5 text-xs font-medium">
              {leaderboard.map((record, index) => (
                <div key={index} className="py-2.5 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className={`font-orbitron font-bold w-4 text-center ${
                      index === 0 ? 'text-yellow-400 font-black' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-white">{record.username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-secondary font-mono font-bold">{record.score}</span>
                    <span className="text-[9px] text-gray-500 font-mono">{record.date}</span>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-gray-500 py-6 text-center">No scores recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
