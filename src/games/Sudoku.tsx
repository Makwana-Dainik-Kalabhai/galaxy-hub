import React, { useState, useEffect } from 'react';
import { HelpCircle, Check, Lightbulb, RotateCcw, Timer } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface SudokuProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

// A base solved Sudoku board to derive puzzles
const SOLVED_GRID = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

export const Sudoku: React.FC<SudokuProps> = ({ onGameOver, isPaused }) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [solution, setSolution] = useState<number[][]>([]);
  const [initialBoard, setInitialBoard] = useState<boolean[][]>([]); // true = pre-filled
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [pencilMode, setPencilMode] = useState(false);
  const [pencilNotes, setPencilNotes] = useState<Record<string, number[]>>({}); // "r,c" -> [digits]
  const [time, setTime] = useState(0);
  const [checkTriggered, setCheckTriggered] = useState(false);

  // Generate board based on solved grid by mapping shuffled digit mappings
  const generatePuzzle = (diff: 'easy' | 'medium' | 'hard') => {
    audioManager.play('click');
    
    // Create random map of digits 1-9
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledDigits = [...digits].sort(() => Math.random() - 0.5);
    const digitMap: Record<number, number> = {};
    digits.forEach((d, idx) => {
      digitMap[d] = shuffledDigits[idx];
    });

    // Generate new solved grid using mapping
    const solved = SOLVED_GRID.map(row => row.map(cell => digitMap[cell]));
    setSolution(solved);

    // Mask cells based on difficulty
    const fillChance = diff === 'easy' ? 0.55 : diff === 'medium' ? 0.4 : 0.28;
    const initial = Array(9).fill(null).map(() => Array(9).fill(false));
    const current = Array(9).fill(null).map(() => Array(9).fill(0));

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (Math.random() < fillChance) {
          initial[r][c] = true;
          current[r][c] = solved[r][c];
        } else {
          initial[r][c] = false;
          current[r][c] = 0;
        }
      }
    }

    setInitialBoard(initial);
    setBoard(current);
    setSelectedCell(null);
    setPencilNotes({});
    setTime(0);
    setCheckTriggered(false);
  };

  useEffect(() => {
    generatePuzzle(difficulty);
  }, [difficulty]);

  // Timer tick
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleCellSelect = (r: number, c: number) => {
    if (initialBoard[r][c]) return;
    audioManager.play('click');
    setSelectedCell({ r, c });
    setCheckTriggered(false);
  };

  const fillDigit = (digit: number) => {
    if (!selectedCell || isPaused) return;
    audioManager.play('click');
    const { r, c } = selectedCell;

    if (pencilMode) {
      // Toggle pencil notes
      const key = `${r},${c}`;
      const notes = pencilNotes[key] || [];
      const updatedNotes = notes.includes(digit) 
        ? notes.filter(n => n !== digit) 
        : [...notes, digit].sort();
      setPencilNotes(prev => ({ ...prev, [key]: updatedNotes }));
      setBoard(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = 0; // erase final digit if editing notes
        return next;
      });
    } else {
      // Input final value
      setBoard(prev => {
        const next = prev.map(row => [...row]);
        next[r][c] = next[r][c] === digit ? 0 : digit; // toggle same value
        return next;
      });
    }
  };

  const getHint = () => {
    if (!selectedCell || isPaused) return;
    audioManager.play('score');
    const { r, c } = selectedCell;
    
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = solution[r][c];
      return next;
    });

    const key = `${r},${c}`;
    setPencilNotes(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const checkSolutionAction = () => {
    audioManager.play('click');
    setCheckTriggered(true);

    let mistakes = 0;
    let complete = true;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        if (cell === 0) {
          complete = false;
        } else if (cell !== solution[r][c]) {
          mistakes++;
        }
      }
    }

    if (complete && mistakes === 0) {
      audioManager.play('win');
      const diffBonus = difficulty === 'easy' ? 200 : difficulty === 'medium' ? 400 : 800;
      const score = Math.max(50, diffBonus - Math.floor(time / 2));
      onGameOver(score);
    } else {
      audioManager.play('lose');
    }
  };

  const formattedTime = () => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-md mx-auto">
      {/* Sudoku configs */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-2 py-1 rounded capitalize text-[10px] font-bold ${
                difficulty === diff ? 'bg-primary text-white' : 'text-gray-400'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-secondary font-mono">
          <Timer className="w-4 h-4" />
          <span>{formattedTime()}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-9 gap-0.5 bg-gray-800 p-0.5 border border-white/10 rounded-xl overflow-hidden aspect-square w-full relative">
        {board.map((row, r) => 
          row.map((cell, c) => {
            const isPrefilled = initialBoard[r][c];
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const pencilKey = `${r},${c}`;
            const notes = pencilNotes[pencilKey] || [];
            
            // Subgrid visual separator thick borders
            const borderR = (r === 2 || r === 5) ? 'border-b-2 border-gray-700' : '';
            const borderC = (c === 2 || c === 5) ? 'border-r-2 border-gray-700' : '';
            
            // Validation indicator if check was pressed
            const hasError = checkTriggered && cell !== 0 && cell !== solution[r][c];

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellSelect(r, c)}
                className={`w-full aspect-square text-sm font-orbitron font-bold flex items-center justify-center relative select-none ${borderR} ${borderC} ${
                  isPrefilled ? 'bg-white/5 text-gray-400 cursor-not-allowed' :
                  isSelected ? 'bg-secondary/20 text-secondary border border-secondary' :
                  hasError ? 'bg-red-500/20 text-red-400 border border-red-500' :
                  'bg-cardbg text-white hover:bg-white/5'
                }`}
              >
                {cell > 0 ? (
                  <span>{cell}</span>
                ) : (
                  // Render draft notes inside empty gridcell
                  <div className="grid grid-cols-3 gap-0.5 absolute inset-0.5 text-[7px] text-gray-500 text-center leading-none">
                    {[1,2,3,4,5,6,7,8,9].map(num => (
                      <span key={num}>{notes.includes(num) ? num : ''}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Numerical Selection row */}
      <div className="grid grid-cols-9 gap-1.5 w-full">
        {[1,2,3,4,5,6,7,8,9].map(num => (
          <button
            key={num}
            onClick={() => fillDigit(num)}
            className="aspect-square bg-cardbg border border-white/5 hover:border-secondary rounded-lg flex items-center justify-center text-sm font-orbitron font-black text-white"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Tools controller footer */}
      <div className="flex gap-2.5 w-full justify-between font-orbitron font-bold text-xs">
        <button
          onClick={() => { setPencilMode(!pencilMode); audioManager.play('click'); }}
          className={`flex-1 py-2 rounded-lg border ${
            pencilMode ? 'border-secondary/40 text-secondary bg-secondary/5' : 'border-white/5 text-gray-400'
          }`}
        >
          ✏️ Pencil Notes: {pencilMode ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={getHint}
          disabled={!selectedCell}
          className="flex items-center gap-1.5 border border-white/5 hover:border-yellow-400 hover:text-yellow-400 rounded-lg px-3 py-2 disabled:opacity-30 transition"
        >
          <Lightbulb className="w-4 h-4" /> Hint
        </button>

        <button
          onClick={checkSolutionAction}
          className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-darkbg rounded-lg px-4 py-2 hover:shadow-[0_0_12px_rgba(0,212,255,0.45)] transition"
        >
          <Check className="w-4 h-4" /> Submit Check
        </button>
      </div>
    </div>
  );
};
