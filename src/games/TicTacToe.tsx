import React, { useState, useEffect } from 'react';
import { User, Cpu, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface TicTacToeProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type BoardValue = 'X' | 'O' | null;

export const TicTacToe: React.FC<TicTacToeProps> = ({ onGameOver, isPaused }) => {
  const [board, setBoard] = useState<BoardValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'hard'>('hard');
  const [scores, setScores] = useState({ playerX: 0, playerO: 0, draws: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'X' | 'O' | 'Draw' | null>(null);
  const [winLine, setWinLine] = useState<number[] | null>(null);

  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  // Run AI move when O is next and useAI is active
  useEffect(() => {
    if (isPaused || gameOver || !useAI || isXNext) return;

    const timer = setTimeout(() => {
      const bestMove = getAIMove();
      if (bestMove !== -1) {
        makeMove(bestMove);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isXNext, useAI, gameOver, isPaused]);

  const checkWinner = (currentBoard: BoardValue[]) => {
    for (let i = 0; i < winningLines.length; i++) {
      const [a, b, c] = winningLines[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: winningLines[i] };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'Draw' as const, line: null };
    }
    return { winner: null, line: null };
  };

  const getAIMove = (): number => {
    const emptyCells = board.map((v, i) => v === null ? i : -1).filter(v => v !== -1);
    if (emptyCells.length === 0) return -1;

    // Easy AI: random move
    if (aiDifficulty === 'easy') {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Hard AI: Minimax
    let bestVal = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const moveVal = minimax(board, 0, false);
        board[i] = null;
        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const minimax = (tempBoard: BoardValue[], depth: number, isMax: boolean): number => {
    const result = checkWinner(tempBoard);
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    if (result.winner === 'Draw') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'O';
          best = Math.max(best, minimax(tempBoard, depth + 1, false));
          tempBoard[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < tempBoard.length; i++) {
        if (tempBoard[i] === null) {
          tempBoard[i] = 'X';
          best = Math.min(best, minimax(tempBoard, depth + 1, true));
          tempBoard[i] = null;
        }
      }
      return best;
    }
  };

  const makeMove = (index: number) => {
    if (board[index] || gameOver || isPaused) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    audioManager.play('click');

    const result = checkWinner(newBoard);
    if (result.winner) {
      setGameOver(true);
      setWinner(result.winner as any);
      setWinLine(result.line);

      if (result.winner === 'X') {
        setScores(prev => ({ ...prev, playerX: prev.playerX + 1 }));
        audioManager.play('win');
        // Submit score to page wrapper (e.g. 100 points for winning Tic-Tac-Toe)
        onGameOver(100);
      } else if (result.winner === 'O') {
        setScores(prev => ({ ...prev, playerO: prev.playerO + 1 }));
        audioManager.play('lose');
        onGameOver(0);
      } else {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        onGameOver(30);
      }
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    audioManager.play('click');
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinner(null);
    setWinLine(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-md mx-auto">
      {/* Modes */}
      <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-1 rounded-lg w-full justify-between">
        <button
          onClick={() => { setUseAI(true); audioManager.play('click'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-orbitron font-bold rounded ${
            useAI ? 'bg-gradient-to-r from-primary to-secondary text-darkbg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" /> AI CPU
        </button>
        <button
          onClick={() => { setUseAI(false); audioManager.play('click'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-orbitron font-bold rounded ${
            !useAI ? 'bg-gradient-to-r from-primary to-secondary text-darkbg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Local PVP
        </button>
      </div>

      {useAI && (
        <div className="flex gap-2 w-full justify-center text-xs font-orbitron font-bold">
          <button
            onClick={() => { setAiDifficulty('easy'); audioManager.play('click'); }}
            className={`px-3 py-1 rounded border ${
              aiDifficulty === 'easy' ? 'border-green-400 text-green-400 bg-green-500/10' : 'border-white/5 text-gray-500'
            }`}
          >
            🟢 EASY CPU
          </button>
          <button
            onClick={() => { setAiDifficulty('hard'); audioManager.play('click'); }}
            className={`px-3 py-1 rounded border ${
              aiDifficulty === 'hard' ? 'border-red-400 text-red-400 bg-red-500/10' : 'border-white/5 text-gray-500'
            }`}
          >
            🔴 HARD CPU
          </button>
        </div>
      )}

      {/* Grid Board */}
      <div className="grid grid-cols-3 gap-3 w-72 h-72 relative">
        {board.map((cell, idx) => {
          const isWinningCell = winLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => makeMove(idx)}
              className={`w-22 h-22 rounded-xl text-4xl font-orbitron font-black flex items-center justify-center border transition-all duration-300 ${
                cell === 'X' ? 'text-primary' : cell === 'O' ? 'text-secondary' : 'text-gray-600'
              } ${
                isWinningCell 
                  ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-white animate-bounce scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                  : 'bg-cardbg/80 border-white/5 hover:border-primary/50'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Result banner */}
      {winner && (
        <div className="text-center font-orbitron font-black text-lg animate-pulse tracking-wide mt-2">
          {winner === 'Draw' ? (
            <span className="text-yellow-400">Match Drawn!</span>
          ) : (
            <span className={winner === 'X' ? 'text-primary text-neon-purple' : 'text-secondary text-neon-cyan'}>
              Player {winner} Wins!
            </span>
          )}
        </div>
      )}

      {/* Score panel */}
      <div className="grid grid-cols-3 gap-2 bg-black/30 border border-white/5 p-3 rounded-lg w-full text-center font-orbitron text-xs">
        <div>
          <p className="text-gray-500 font-bold">PLAYER (X)</p>
          <h4 className="text-white text-base font-black">{scores.playerX}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">DRAWS</p>
          <h4 className="text-white text-base font-black">{scores.draws}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">{useAI ? 'CPU (O)' : 'OPPONENT (O)'}</p>
          <h4 className="text-white text-base font-black">{scores.playerO}</h4>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetGame}
        className="flex items-center gap-2 border border-white/10 hover:border-secondary hover:text-secondary rounded-lg px-4 py-2 text-xs font-orbitron font-bold transition"
      >
        <RotateCcw className="w-4 h-4" /> Reset Board
      </button>
    </div>
  );
};
