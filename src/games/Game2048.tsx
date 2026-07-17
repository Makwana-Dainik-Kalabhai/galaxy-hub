import React, { useState, useEffect } from 'react';
import { RotateCcw, HelpCircle, ArrowLeft } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface Game2048Props {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Board2048 = number[][];

export const Game2048: React.FC<Game2048Props> = ({ onGameOver, isPaused }) => {
  const [board, setBoard] = useState<Board2048>([]);
  const [score, setScore] = useState(0);
  const [boardHistory, setBoardHistory] = useState<{ board: Board2048; score: number }[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const initGame = () => {
    let freshBoard = Array(4).fill(null).map(() => Array(4).fill(0));
    freshBoard = spawnRandomTile(freshBoard);
    freshBoard = spawnRandomTile(freshBoard);
    setBoard(freshBoard);
    setScore(0);
    setBoardHistory([]);
    setAiTip(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Listen to keyboard arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleSlide('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleSlide('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleSlide('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleSlide('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, score, boardHistory, isPaused]);

  const spawnRandomTile = (currentBoard: Board2048): Board2048 => {
    const nextBoard = currentBoard.map(row => [...row]);
    const emptyCells: { r: number; c: number }[] = [];
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (nextBoard[r][c] === 0) emptyCells.push({ r, c });
      }
    }

    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      nextBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    return nextBoard;
  };

  const handleSlide = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    audioManager.play('click');
    
    // Save state history for Undo function
    const prevBoardState = board.map(row => [...row]);
    const prevScoreState = score;

    let { newBoard, points } = slideAndMerge(board, direction);

    // If board actually changed, spawn a tile
    if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
      newBoard = spawnRandomTile(newBoard);
      
      setBoardHistory(prev => [...prev, { board: prevBoardState, score: prevScoreState }]);
      setBoard(newBoard);
      setScore(prev => prev + points);
      setAiTip(null);

      // Check if game over
      if (checkGameOver(newBoard)) {
        audioManager.play('lose');
        onGameOver(score + points);
      } else if (points > 0) {
        audioManager.play('score');
      }
    }
  };

  const slideAndMerge = (currentBoard: Board2048, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    let nextBoard = currentBoard.map(row => [...row]);
    let points = 0;

    // Helper: compress zero spaces
    const compress = (row: number[]): number[] => {
      const filtered = row.filter(val => val !== 0);
      const zeros = Array(4 - filtered.length).fill(0);
      return [...filtered, ...zeros];
    };

    // Helper: merge matching adjacent items
    const merge = (row: number[]): { merged: number[]; points: number } => {
      let r = [...row];
      let scoreGained = 0;
      for (let i = 0; i < 3; i++) {
        if (r[i] !== 0 && r[i] === r[i + 1]) {
          r[i] = r[i] * 2;
          scoreGained += r[i];
          r[i + 1] = 0;
        }
      }
      return { merged: r, points: scoreGained };
    };

    const processLine = (line: number[]): { processed: number[]; points: number } => {
      const c1 = compress(line);
      const { merged, points } = merge(c1);
      const c2 = compress(merged);
      return { processed: c2, points };
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        let row = nextBoard[r];
        if (direction === 'RIGHT') row = [...row].reverse();

        const { processed, points: linePoints } = processLine(row);
        points += linePoints;

        nextBoard[r] = direction === 'RIGHT' ? processed.reverse() : processed;
      }
    } else {
      // UP or DOWN vertical slides
      for (let c = 0; c < 4; c++) {
        let col = [nextBoard[0][c], nextBoard[1][c], nextBoard[2][c], nextBoard[3][c]];
        if (direction === 'DOWN') col = col.reverse();

        const { processed, points: linePoints } = processLine(col);
        points += linePoints;

        const finalCol = direction === 'DOWN' ? processed.reverse() : processed;
        for (let r = 0; r < 4; r++) {
          nextBoard[r][c] = finalCol[r];
        }
      }
    }

    return { newBoard: nextBoard, points };
  };

  const undoAction = () => {
    if (boardHistory.length === 0) return;
    audioManager.play('click');
    const prev = boardHistory[boardHistory.length - 1];
    setBoard(prev.board);
    setScore(prev.score);
    setBoardHistory(prev => prev.slice(0, -1));
    setAiTip(null);
  };

  const getAiSuggestion = () => {
    audioManager.play('score');
    
    // Evaluate all 4 options, pick the direction leaving the most empty spaces
    const directions: ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    let bestDir = 'UP';
    let maxEmpty = -1;

    directions.forEach(dir => {
      const { newBoard } = slideAndMerge(board, dir);
      if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
        // Count empty spaces
        const emptyCount = newBoard.flat().filter(v => v === 0).length;
        if (emptyCount > maxEmpty) {
          maxEmpty = emptyCount;
          bestDir = dir;
        }
      }
    });

    setAiTip(bestDir);
  };

  const checkGameOver = (currentBoard: Board2048): boolean => {
    // If any empty spots exist
    if (currentBoard.flat().includes(0)) return false;

    // Check if any matching adjacent pairs exist
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = currentBoard[r][c];
        if (r < 3 && val === currentBoard[r + 1][c]) return false;
        if (c < 3 && val === currentBoard[r][c + 1]) return false;
      }
    }
    return true;
  };

  // Color mappings for tiles
  const getTileStyles = (val: number) => {
    const colors: Record<number, { bg: string; text: string; shadow: string }> = {
      2: { bg: 'bg-zinc-800', text: 'text-zinc-400', shadow: '' },
      4: { bg: 'bg-zinc-700', text: 'text-zinc-300', shadow: '' },
      8: { bg: 'bg-orange-600/30 text-orange-400 border border-orange-500/20', text: 'text-orange-400', shadow: 'shadow-[0_0_10px_rgba(234,88,12,0.15)]' },
      16: { bg: 'bg-amber-600/30 text-amber-400 border border-amber-500/20', text: 'text-amber-400', shadow: 'shadow-[0_0_12px_rgba(217,119,6,0.2)]' },
      32: { bg: 'bg-red-600/30 text-red-400 border border-red-500/20', text: 'text-red-400', shadow: 'shadow-[0_0_12px_rgba(220,38,38,0.2)]' },
      64: { bg: 'bg-rose-600/30 text-rose-400 border border-rose-500/20', text: 'text-rose-400', shadow: 'shadow-[0_0_15px_rgba(225,29,72,0.25)]' },
      128: { bg: 'bg-yellow-600/30 text-yellow-400 border border-yellow-500/20', text: 'text-yellow-400', shadow: 'shadow-[0_0_15px_rgba(202,138,4,0.3)]' },
      256: { bg: 'bg-green-600/30 text-green-400 border border-green-500/20', text: 'text-green-400', shadow: 'shadow-[0_0_18px_rgba(22,163,74,0.35)]' },
      512: { bg: 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/20', text: 'text-emerald-400', shadow: 'shadow-[0_0_18px_rgba(5,150,105,0.4)]' },
      1024: { bg: 'bg-primary/20 text-secondary border border-primary/30', text: 'text-secondary', shadow: 'shadow-[0_0_20px_rgba(108,99,255,0.4)] animate-pulse' },
      2048: { bg: 'bg-gradient-to-br from-primary/30 to-secondary/30 text-white border-2 border-white', text: 'text-white', shadow: 'shadow-[0_0_25px_rgba(0,212,255,0.5)]' }
    };

    return colors[val] || { bg: 'bg-purple-950/40 border border-purple-500/30', text: 'text-purple-300', shadow: 'shadow-[0_0_30px_rgba(0,212,255,0.6)]' };
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-md mx-auto select-none">
      {/* Undo & AI tips headers */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <div className="text-secondary font-black text-sm">
          SCORE: <span className="text-white font-mono">{score}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undoAction}
            disabled={boardHistory.length === 0}
            className="flex items-center gap-1 border border-white/5 hover:border-primary px-2.5 py-1 rounded text-[10px] font-bold disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Undo
          </button>
          
          <button
            onClick={getAiSuggestion}
            className="flex items-center gap-1 border border-white/5 hover:border-yellow-400 hover:text-yellow-400 px-2.5 py-1 rounded text-[10px] font-bold transition"
          >
            💡 AI Hint
          </button>
        </div>
      </div>

      {aiTip && (
        <div className="w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 py-1.5 rounded-lg text-center text-[10px] font-orbitron font-bold animate-pulse">
          🎯 OPTIMAL MOVEMENT ADVICE: SLIDE {aiTip}
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-4 gap-3 bg-cardbg/80 border border-white/5 p-3 rounded-2xl aspect-square w-72 sm:w-80 relative">
        {board.map((row, r) => 
          row.map((val, c) => {
            const styles = val > 0 ? getTileStyles(val) : { bg: 'bg-black/20', text: 'text-gray-700', shadow: '' };
            return (
              <div
                key={`${r}-${c}`}
                className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg md:text-xl font-orbitron font-black transition-all duration-300 ${styles.bg} ${styles.text} ${styles.shadow}`}
              >
                {val > 0 ? val : ''}
              </div>
            );
          })
        )}
      </div>

      {/* Slide controller D-Pad for mobile */}
      <div className="flex flex-col items-center gap-1 sm:hidden">
        <button
          onClick={() => handleSlide('UP')}
          className="w-10 h-10 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
        >
          UP
        </button>
        <div className="flex gap-6">
          <button
            onClick={() => handleSlide('LEFT')}
            className="w-10 h-10 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
          >
            L
          </button>
          <button
            onClick={() => handleSlide('RIGHT')}
            className="w-10 h-10 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
          >
            R
          </button>
        </div>
        <button
          onClick={() => handleSlide('DOWN')}
          className="w-10 h-10 bg-cardbg border border-white/5 hover:border-secondary flex items-center justify-center rounded-lg text-white"
        >
          DN
        </button>
      </div>
    </div>
  );
};
