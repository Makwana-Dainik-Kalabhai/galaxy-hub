import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface ChessProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';
type Piece = { type: PieceType; color: PieceColor } | null;
type Board = Piece[][];

const INITIAL_BOARD: Board = [
  [
    { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' },
    { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }
  ],
  Array(8).fill(null).map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' },
    { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }
  ]
];

const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
};

export const Chess: React.FC<ChessProps> = ({ onGameOver, isPaused }) => {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // AI turn trigger
  useEffect(() => {
    if (isPaused || turn === 'w' || isAiThinking) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      makeAIMove();
      setIsAiThinking(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, isPaused]);

  const selectCell = (r: number, c: number) => {
    if (isPaused || turn === 'b' || isAiThinking) return;

    const cell = board[r][c];

    // Click on highlighted valid cell to execute move
    const isValid = validMoves.some(m => m.r === r && m.c === c);
    if (isValid && selectedCell) {
      executeMove(selectedCell, { r, c });
      return;
    }

    if (cell && cell.color === 'w') {
      audioManager.play('click');
      setSelectedCell({ r, c });
      setValidMoves(calculateMoves(r, c, board));
    } else {
      setSelectedCell(null);
      setValidMoves([]);
    }
  };

  const executeMove = (from: { r: number; c: number }, to: { r: number; c: number }) => {
    const activePiece = board[from.r][from.c]!;
    const targetPiece = board[to.r][to.c];
    
    const newBoard = board.map(row => [...row]);
    newBoard[to.r][to.c] = activePiece;
    newBoard[from.r][from.c] = null;

    // Check if king captured
    if (targetPiece?.type === 'k') {
      audioManager.play('win');
      setBoard(newBoard);
      setTurn(turn === 'w' ? 'b' : 'w');
      onGameOver(turn === 'w' ? 1000 : 0);
      return;
    }

    // Audio triggers
    if (targetPiece) {
      audioManager.play('hit');
    } else {
      audioManager.play('score');
    }

    // Append move to history
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const pLabel = activePiece.type === 'p' ? '' : activePiece.type.toUpperCase();
    const capLabel = targetPiece ? 'x' : '';
    const moveStr = `${pLabel}${files[from.c]}${rows[from.r]}${capLabel}${files[to.c]}${rows[to.r]}`;
    setMoveHistory(prev => [...prev, moveStr]);

    setBoard(newBoard);
    setSelectedCell(null);
    setValidMoves([]);
    setTurn(turn === 'w' ? 'b' : 'w');
  };

  const calculateMoves = (r: number, c: number, currentBoard: Board): { r: number; c: number }[] => {
    const piece = currentBoard[r][c];
    if (!piece) return [];

    const moves: { r: number; c: number }[] = [];
    const color = piece.color;
    const opp = color === 'w' ? 'b' : 'w';

    // Pawn movement
    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      // Single step forward
      if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
        moves.push({ r: r + dir, c });
        // Double step forward initially
        const startRow = color === 'w' ? 6 : 1;
        if (r === startRow && !currentBoard[r + dir * 2][c]) {
          moves.push({ r: r + dir * 2, c });
        }
      }
      // Diagonal capture
      [-1, 1].forEach(dc => {
        const nextC = c + dc;
        if (nextC >= 0 && nextC < 8 && r + dir >= 0 && r + dir < 8) {
          const target = currentBoard[r + dir][nextC];
          if (target && target.color === opp) {
            moves.push({ r: r + dir, c: nextC });
          }
        }
      });
    }

    // Rook/Queen sliding directions
    if (piece.type === 'r' || piece.type === 'q') {
      const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
      dirs.forEach(([dr, dc]) => {
        let nextR = r + dr;
        let nextC = c + dc;
        while (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
          const cell = currentBoard[nextR][nextC];
          if (!cell) {
            moves.push({ r: nextR, c: nextC });
          } else {
            if (cell.color === opp) moves.push({ r: nextR, c: nextC });
            break;
          }
          nextR += dr;
          nextC += dc;
        }
      });
    }

    // Bishop/Queen diagonal slides
    if (piece.type === 'b' || piece.type === 'q') {
      const dirs = [[1,1], [1,-1], [-1,1], [-1,-1]];
      dirs.forEach(([dr, dc]) => {
        let nextR = r + dr;
        let nextC = c + dc;
        while (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
          const cell = currentBoard[nextR][nextC];
          if (!cell) {
            moves.push({ r: nextR, c: nextC });
          } else {
            if (cell.color === opp) moves.push({ r: nextR, c: nextC });
            break;
          }
          nextR += dr;
          nextC += dc;
        }
      });
    }

    // Knight jumps
    if (piece.type === 'n') {
      const jumps = [
        [2,1], [2,-1], [-2,1], [-2,-1],
        [1,2], [1,-2], [-1,2], [-1,-2]
      ];
      jumps.forEach(([dr, dc]) => {
        const nextR = r + dr;
        const nextC = c + dc;
        if (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
          const cell = currentBoard[nextR][nextC];
          if (!cell || cell.color === opp) {
            moves.push({ r: nextR, c: nextC });
          }
        }
      });
    }

    // King steps
    if (piece.type === 'k') {
      const steps = [
        [1,0], [-1,0], [0,1], [0,-1],
        [1,1], [1,-1], [-1,1], [-1,-1]
      ];
      steps.forEach(([dr, dc]) => {
        const nextR = r + dr;
        const nextC = c + dc;
        if (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
          const cell = currentBoard[nextR][nextC];
          if (!cell || cell.color === opp) {
            moves.push({ r: nextR, c: nextC });
          }
        }
      });
    }

    return moves;
  };

  const makeAIMove = () => {
    // Collect all valid AI (black) moves
    const aiMoves: { from: { r: number; c: number }; to: { r: number; c: number }; score: number }[] = [];
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell && cell.color === 'b') {
          const targets = calculateMoves(r, c, board);
          targets.forEach(t => {
            const targetPiece = board[t.r][t.c];
            // Simple heuristic scoring: prioritize captures
            let moveScore = 0;
            if (targetPiece) {
              const values: Record<PieceType, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 999 };
              moveScore = values[targetPiece.type];
            }
            // Add some minor random variance to prevent repetitive games
            moveScore += Math.random() * 2;
            aiMoves.push({ from: { r, c }, to: t, score: moveScore });
          });
        }
      }
    }

    if (aiMoves.length === 0) {
      // Black has no legal moves -> AI resigns/draw
      audioManager.play('win');
      onGameOver(300);
      return;
    }

    // Sort moves by score (highest evaluation first)
    if (aiDifficulty === 'easy') {
      // Pick random
      const chosen = aiMoves[Math.floor(Math.random() * aiMoves.length)];
      executeMove(chosen.from, chosen.to);
    } else {
      // Sort descending
      aiMoves.sort((a, b) => b.score - a.score);
      const chosen = aiMoves[0];
      executeMove(chosen.from, chosen.to);
    }
  };

  const restartMatch = () => {
    audioManager.play('click');
    setBoard(INITIAL_BOARD);
    setSelectedCell(null);
    setValidMoves([]);
    setMoveHistory([]);
    setTurn('w');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 max-w-4xl mx-auto items-stretch">
      {/* Board Column */}
      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Difficulties Header */}
        <div className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl w-full font-orbitron text-xs">
          <div className="flex gap-1">
            {(['easy', 'normal'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => setAiDifficulty(diff)}
                className={`px-2.5 py-1 rounded uppercase text-[10px] font-bold ${
                  aiDifficulty === diff ? 'bg-primary text-white' : 'text-gray-400'
                }`}
              >
                {diff} AI
              </button>
            ))}
          </div>
          
          <div className="font-bold text-secondary uppercase animate-pulse">
            {isAiThinking ? 'CPU Thinking...' : turn === 'w' ? 'Your Turn' : 'CPU Turn'}
          </div>
        </div>

        {/* The Grid Board */}
        <div className="grid grid-cols-8 grid-rows-8 border-2 border-white/10 rounded-2xl overflow-hidden aspect-square w-full max-w-[400px]">
          {board.map((row, r) => 
            row.map((cell, c) => {
              const isDarkSquare = (r + c) % 2 === 1;
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isValidTarget = validMoves.some(m => m.r === r && m.c === c);

              const bgClass = 
                isSelected ? 'bg-primary/30 border border-primary z-10' :
                isValidTarget ? 'bg-secondary/20 hover:bg-secondary/35 cursor-pointer border border-dashed border-secondary' :
                isDarkSquare ? 'bg-indigo-950/20' : 'bg-cardbg/80';

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => selectCell(r, c)}
                  className={`w-full aspect-square text-2.5xl md:text-3.5xl font-semibold flex items-center justify-center relative transition select-none ${bgClass}`}
                >
                  {cell && (
                    <span 
                      className={`transform transition-all active:scale-90 ${
                        cell.color === 'w' ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]' : 'text-indigo-400 drop-shadow-[0_0_5px_rgba(108,99,255,0.4)]'
                      }`}
                    >
                      {PIECE_SYMBOLS[cell.color][cell.type]}
                    </span>
                  )}
                  {isValidTarget && !cell && (
                    <div className="w-3 h-3 bg-secondary rounded-full animate-ping"></div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* History Log Column */}
      <div className="w-full lg:w-60 glass-panel p-4 rounded-xl border border-white/5 flex flex-col justify-between min-h-[300px]">
        <div className="space-y-3 flex-1 flex flex-col">
          <h4 className="font-orbitron font-extrabold text-xs text-secondary border-b border-white/5 pb-2 uppercase">
            Move Log History
          </h4>
          <div className="flex-1 overflow-y-auto max-h-48 divide-y divide-white/5 pr-1 text-xs font-mono">
            {moveHistory.map((m, idx) => (
              <div key={idx} className="py-1.5 flex justify-between">
                <span className="text-gray-500">{Math.floor(idx / 2) + 1}.</span>
                <span className="text-white font-bold">{m}</span>
              </div>
            ))}
            {moveHistory.length === 0 && (
              <p className="text-gray-500 py-4 text-center">No moves made yet.</p>
            )}
          </div>
        </div>

        <button
          onClick={restartMatch}
          className="w-full mt-4 flex items-center justify-center gap-2 border border-white/10 hover:border-red-500/40 hover:text-red-400 rounded-lg py-2.5 text-xs font-orbitron font-bold transition"
        >
          <RotateCcw className="w-4 h-4" /> Reset Match
        </button>
      </div>
    </div>
  );
};
