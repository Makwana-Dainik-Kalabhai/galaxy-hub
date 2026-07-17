import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface TetrisProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type Grid = (string | null)[][];
type PieceMatrix = number[][];

const COLS = 10;
const ROWS = 20;

const COLORS: Record<string, string> = {
  I: '#00D4FF', // Cyan
  O: '#FFD700', // Yellow
  T: '#9932CC', // Purple
  S: '#32CD32', // Green
  Z: '#FF4500', // Red
  J: '#1E90FF', // Blue
  L: '#FF8C00'  // Orange
};

const SHAPES: Record<string, PieceMatrix> = {
  I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  O: [[1,1], [1,1]],
  T: [[0,1,0], [1,1,1], [0,0,0]],
  S: [[0,1,1], [1,1,0], [0,0,0]],
  Z: [[1,1,0], [0,1,1], [0,0,0]],
  J: [[1,0,0], [1,1,1], [0,0,0]],
  L: [[0,0,1], [1,1,1], [0,0,0]]
};

export const Tetris: React.FC<TetrisProps> = ({ onGameOver, isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextPiece, setNextPiece] = useState<string>('T');
  const [heldPiece, setHeldPiece] = useState<string | null>(null);
  const [hasHeld, setHasHeld] = useState(false);

  // Core board logic refs
  const boardRef = useRef<Grid>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const currentPieceType = useRef<string>('I');
  const currentMatrix = useRef<PieceMatrix>([]);
  const currentPos = useRef<{ x: number; y: number }>({ x: 3, y: 0 });
  const gameTimerRef = useRef<any>(null);

  // Seed next piece
  const pieceBag = useRef<string[]>([]);
  const getNextFromBag = () => {
    if (pieceBag.current.length === 0) {
      pieceBag.current = Object.keys(SHAPES);
      // Shuffle
      for (let i = pieceBag.current.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieceBag.current[i], pieceBag.current[j]] = [pieceBag.current[j], pieceBag.current[i]];
      }
    }
    return pieceBag.current.pop()!;
  };

  const spawnPiece = (type?: string) => {
    const active = type || nextPiece;
    const incoming = getNextFromBag();
    
    currentPieceType.current = active;
    currentMatrix.current = SHAPES[active];
    currentPos.current = { x: Math.floor((COLS - currentMatrix.current[0].length) / 2), y: 0 };
    
    setNextPiece(incoming);
    setHasHeld(false);

    if (checkCollision(currentMatrix.current, currentPos.current)) {
      // Game Over
      triggerGameOver();
    }
  };

  const checkCollision = (matrix: PieceMatrix, pos: { x: number; y: number }, customBoard?: Grid): boolean => {
    const board = customBoard || boardRef.current;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const nextX = pos.x + c;
          const nextY = pos.y + r;
          
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }
          if (nextY >= 0 && board[nextY][nextX]) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotatePiece = () => {
    const matrix = currentMatrix.current;
    const rotated = matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
    
    // Kick wall adjustments if out of bounds
    const pos = { ...currentPos.current };
    let offset = 0;
    while (checkCollision(rotated, pos)) {
      pos.x += offset > 0 ? -1 : 1;
      offset = offset > 0 ? -offset - 1 : -offset + 1;
      if (Math.abs(offset) > matrix[0].length) {
        return; // rotation impossible
      }
    }

    currentMatrix.current = rotated;
    currentPos.current = pos;
    audioManager.play('click');
    drawGame();
  };

  const movePiece = (dir: number) => {
    const pos = { ...currentPos.current, x: currentPos.current.x + dir };
    if (!checkCollision(currentMatrix.current, pos)) {
      currentPos.current = pos;
      audioManager.play('click');
      drawGame();
    }
  };

  const dropPiece = () => {
    const pos = { ...currentPos.current, y: currentPos.current.y + 1 };
    if (!checkCollision(currentMatrix.current, pos)) {
      currentPos.current = pos;
      drawGame();
      return true;
    } else {
      lockPiece();
      return false;
    }
  };

  const hardDrop = () => {
    let pos = { ...currentPos.current };
    while (!checkCollision(currentMatrix.current, { ...pos, y: pos.y + 1 })) {
      pos.y += 1;
    }
    currentPos.current = pos;
    audioManager.play('hit');
    lockPiece();
  };

  const holdPieceAction = () => {
    if (hasHeld) return;
    audioManager.play('click');
    const typeToHold = currentPieceType.current;
    
    if (heldPiece === null) {
      setHeldPiece(typeToHold);
      spawnPiece();
    } else {
      const prevHeld = heldPiece;
      setHeldPiece(typeToHold);
      spawnPiece(prevHeld);
    }
    setHasHeld(true);
  };

  const lockPiece = () => {
    const matrix = currentMatrix.current;
    const pos = currentPos.current;
    const type = currentPieceType.current;
    const board = [...boardRef.current.map(row => [...row])];

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const y = pos.y + r;
          const x = pos.x + c;
          if (y >= 0) {
            board[y][x] = type;
          }
        }
      }
    }

    boardRef.current = board;
    checkLineClears();
    spawnPiece();
  };

  const checkLineClears = () => {
    let board = [...boardRef.current.map(row => [...row])];
    let clearedCount = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        clearedCount++;
        r++; // check this row index again since items shifted down
      }
    }

    if (clearedCount > 0) {
      audioManager.play('score');
      const linesReward = [0, 100, 300, 500, 800];
      const xpGained = linesReward[clearedCount] * level;
      setScore(prev => prev + xpGained);
      
      const newLines = lines + clearedCount;
      setLines(newLines);
      
      const targetLevel = Math.floor(newLines / 10) + 1;
      if (targetLevel > level) {
        setLevel(targetLevel);
        audioManager.play('levelUp');
      }
      
      boardRef.current = board;
    }
  };

  const triggerGameOver = () => {
    setIsPlaying(false);
    audioManager.play('lose');
    onGameOver(score);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePiece(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePiece(1);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotatePiece();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dropPiece();
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          holdPieceAction();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, heldPiece, hasHeld]);

  // Interval Tick
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const currentSpeed = Math.max(100, 1000 - (level - 1) * 100);

    const tick = () => {
      dropPiece();
      gameTimerRef.current = setTimeout(tick, currentSpeed);
    };

    gameTimerRef.current = setTimeout(tick, currentSpeed);

    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current);
    };
  }, [isPlaying, isPaused, level]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cellW = w / COLS;
    const cellH = h / ROWS;

    // Clear board
    ctx.fillStyle = '#0F0F23';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid outline lines
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(w, r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, h);
      ctx.stroke();
    }

    // Draw locked blocks on the board
    const board = boardRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (cell) {
          drawBlock(ctx, c, r, cellW, cellH, COLORS[cell]);
        }
      }
    }

    // Draw active falling piece
    if (isPlaying) {
      const matrix = currentMatrix.current;
      const pos = currentPos.current;
      const type = currentPieceType.current;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            drawBlock(ctx, pos.x + c, pos.y + r, cellW, cellH, COLORS[type]);
          }
        }
      }
    }
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    
    const pad = 1.5;
    ctx.fillRect(x * w + pad, y * h + pad, w - pad*2, h - pad*2);
    
    // Add shine bevel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * w + pad + 1.5, y * h + pad + 1.5, w - pad*2 - 3, (h - pad*2) / 3);
    
    ctx.shadowBlur = 0; // reset
  };

  const startGame = () => {
    audioManager.play('click');
    boardRef.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    setScore(0);
    setLines(0);
    setLevel(1);
    setHeldPiece(null);
    setHasHeld(false);
    pieceBag.current = [];
    
    const first = getNextFromBag();
    const second = getNextFromBag();
    currentPieceType.current = first;
    currentMatrix.current = SHAPES[first];
    currentPos.current = { x: 3, y: 0 };
    setNextPiece(second);

    setIsPlaying(true);
  };

  useEffect(() => {
    drawGame();
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-lg mx-auto">
      {/* HUD Info panel */}
      <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 p-3 rounded-xl w-full text-center font-orbitron text-[10px]">
        <div>
          <p className="text-gray-500 font-bold">SCORE</p>
          <h4 className="text-sm font-black text-white mt-0.5 font-mono">{score}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">LINES</p>
          <h4 className="text-sm font-black text-secondary mt-0.5 font-mono">{lines}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">LEVEL</p>
          <h4 className="text-sm font-black text-green-400 mt-0.5 font-mono">{level}</h4>
        </div>
      </div>

      <div className="flex gap-4 items-stretch w-full justify-center">
        {/* Left Side: Hold piece */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-3 rounded-xl border border-white/5 w-20 text-center flex flex-col items-center justify-center font-orbitron">
            <span className="text-[9px] font-bold text-gray-500 block mb-2 uppercase">Hold</span>
            <div className="w-12 h-12 bg-black/40 border border-white/5 rounded flex items-center justify-center text-xl select-none">
              {heldPiece ? (
                <span style={{ color: COLORS[heldPiece] }}>{heldPiece}</span>
              ) : (
                <span className="text-gray-700 text-xs">EMPTY</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Main board canvas */}
        <div className="relative border border-white/5 bg-cardbg rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center aspect-[1/2] w-56 sm:w-64">
          <canvas
            ref={canvasRef}
            width={200}
            height={400}
            className="w-full h-full block"
          />

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
              <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
                {score > 0 ? `Game Over! Score: ${score}` : 'Retro Block Stacker'}
              </h4>
              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4" /> Start Tetris
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Next piece preview */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-3 rounded-xl border border-white/5 w-20 text-center flex flex-col items-center justify-center font-orbitron">
            <span className="text-[9px] font-bold text-gray-500 block mb-2 uppercase">Next</span>
            <div className="w-12 h-12 bg-black/40 border border-white/5 rounded flex items-center justify-center text-xl select-none" style={{ color: COLORS[nextPiece] }}>
              {nextPiece}
            </div>
          </div>
        </div>
      </div>

      {/* Button Controls for mobile */}
      <div className="flex gap-2 justify-center flex-wrap sm:hidden w-full max-w-xs font-orbitron font-bold">
        <button
          onClick={() => movePiece(-1)}
          className="flex-1 bg-cardbg border border-white/5 py-2.5 rounded text-xs text-gray-400"
        >
          LEFT
        </button>
        <button
          onClick={rotatePiece}
          className="flex-1 bg-cardbg border border-white/5 py-2.5 rounded text-xs text-secondary"
        >
          ROT
        </button>
        <button
          onClick={() => movePiece(1)}
          className="flex-1 bg-cardbg border border-white/5 py-2.5 rounded text-xs text-gray-400"
        >
          RIGHT
        </button>
        <button
          onClick={holdPieceAction}
          className="flex-1 bg-cardbg border border-white/5 py-2.5 rounded text-xs text-primary"
        >
          HOLD
        </button>
        <button
          onClick={hardDrop}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-2 rounded text-xs text-white"
        >
          HARD DROP
        </button>
      </div>
    </div>
  );
};
