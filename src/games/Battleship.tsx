import React, { useState, useEffect } from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface BattleshipProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type CellState = 'empty' | 'ship' | 'hit' | 'miss';
type ShipType = { name: string; size: number };

const SHIPS: ShipType[] = [
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
];

export const Battleship: React.FC<BattleshipProps> = ({ onGameOver, isPaused }) => {
  const [phase, setPhase] = useState<'placement' | 'battle' | 'win' | 'lose'>('placement');
  const [playerGrid, setPlayerGrid] = useState<CellState[][]>(Array(8).fill(null).map(() => Array(8).fill('empty')));
  const [computerGrid, setComputerGrid] = useState<CellState[][]>(Array(8).fill(null).map(() => Array(8).fill('empty')));
  const [activeShipIdx, setActiveShipIdx] = useState(0);
  const [shipHorizontal, setShipHorizontal] = useState(true);
  const [turn, setTurn] = useState<'player' | 'computer'>('player');

  // AI hunting tracker
  const [aiLastHits, setAiLastHits] = useState<{ r: number; c: number }[]>([]);

  // Start new match
  const initGame = () => {
    audioManager.play('click');
    setPlayerGrid(Array(8).fill(null).map(() => Array(8).fill('empty')));
    setComputerGrid(Array(8).fill(null).map(() => Array(8).fill('empty')));
    setActiveShipIdx(0);
    setShipHorizontal(true);
    setAiLastHits([]);
    setTurn('player');
    setPhase('placement');
  };

  useEffect(() => {
    initGame();
  }, []);

  // Computer AI turn trigger
  useEffect(() => {
    if (phase !== 'battle' || turn === 'player' || isPaused) return;

    const timer = setTimeout(() => {
      executeComputerFire();
    }, 700);

    return () => clearTimeout(timer);
  }, [turn, phase, isPaused]);

  // Click cells to place ships during Placement phase
  const handlePlacementClick = (r: number, c: number) => {
    if (phase !== 'placement' || activeShipIdx >= SHIPS.length) return;

    const ship = SHIPS[activeShipIdx];
    const newGrid = playerGrid.map(row => [...row]);

    // Check boundary
    if (shipHorizontal) {
      if (c + ship.size > 8) return;
      for (let i = 0; i < ship.size; i++) {
        if (newGrid[r][c + i] === 'ship') return; // overlap
      }
      for (let i = 0; i < ship.size; i++) {
        newGrid[r][c + i] = 'ship';
      }
    } else {
      if (r + ship.size > 8) return;
      for (let i = 0; i < ship.size; i++) {
        if (newGrid[r + i][c] === 'ship') return;
      }
      for (let i = 0; i < ship.size; i++) {
        newGrid[r + i][c] = 'ship';
      }
    }

    audioManager.play('click');
    setPlayerGrid(newGrid);
    
    const nextIdx = activeShipIdx + 1;
    setActiveShipIdx(nextIdx);

    if (nextIdx >= SHIPS.length) {
      // Completed placing player ships. Set up computer ships randomly.
      setupComputerShips();
      setPhase('battle');
    }
  };

  const setupComputerShips = () => {
    const grid = Array(8).fill(null).map(() => Array(8).fill('empty'));
    
    SHIPS.forEach(ship => {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() > 0.5;
        const r = Math.floor(Math.random() * 8);
        const c = Math.floor(Math.random() * 8);

        if (horizontal) {
          if (c + ship.size <= 8) {
            let overlap = false;
            for (let i = 0; i < ship.size; i++) {
              if (grid[r][c + i] === 'ship') overlap = true;
            }
            if (!overlap) {
              for (let i = 0; i < ship.size; i++) grid[r][c + i] = 'ship';
              placed = true;
            }
          }
        } else {
          if (r + ship.size <= 8) {
            let overlap = false;
            for (let i = 0; i < ship.size; i++) {
              if (grid[r + i][c] === 'ship') overlap = true;
            }
            if (!overlap) {
              for (let i = 0; i < ship.size; i++) grid[r + i][c] = 'ship';
              placed = true;
            }
          }
        }
      }
    });

    setComputerGrid(grid);
  };

  // Player attacks computer grid
  const handleFireClick = (r: number, c: number) => {
    if (phase !== 'battle' || turn !== 'player' || isPaused) return;

    const cell = computerGrid[r][c];
    if (cell === 'hit' || cell === 'miss') return; // already fired

    audioManager.play('laser');
    const newGrid = computerGrid.map(row => [...row]);
    
    if (cell === 'ship') {
      newGrid[r][c] = 'hit';
      audioManager.play('hit');
    } else {
      newGrid[r][c] = 'miss';
      audioManager.play('score');
    }

    setComputerGrid(newGrid);

    // Check if player won (all computer ships hit)
    const activeCompShips = newGrid.flat().some(cell => cell === 'ship');
    if (!activeCompShips) {
      audioManager.play('win');
      setPhase('win');
      onGameOver(800);
      return;
    }

    setTurn('computer');
  };

  const executeComputerFire = () => {
    const grid = playerGrid.map(row => [...row]);
    let targetR = -1;
    let targetC = -1;

    // Hunting AI logic
    if (aiLastHits.length > 0) {
      // Look around last successful hits
      const directions = [[1,0], [-1,0], [0,1], [0,-1]];
      let found = false;

      for (let i = aiLastHits.length - 1; i >= 0; i--) {
        const last = aiLastHits[i];
        for (const [dr, dc] of directions) {
          const nr = last.r + dr;
          const nc = last.c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const cell = grid[nr][nc];
            if (cell === 'empty' || cell === 'ship') {
              targetR = nr;
              targetC = nc;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }

    // Default target selection (random search)
    if (targetR === -1) {
      const candidates: { r: number; c: number }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cell = grid[r][c];
          if (cell === 'empty' || cell === 'ship') {
            candidates.push({ r, c });
          }
        }
      }
      if (candidates.length > 0) {
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        targetR = choice.r;
        targetC = choice.c;
      }
    }

    if (targetR !== -1) {
      audioManager.play('laser');
      const cell = grid[targetR][targetC];
      
      if (cell === 'ship') {
        grid[targetR][targetC] = 'hit';
        audioManager.play('hit');
        setAiLastHits(prev => [...prev, { r: targetR, c: targetC }]);
      } else {
        grid[targetR][targetC] = 'miss';
        audioManager.play('score');
      }

      setPlayerGrid(grid);

      // Check if computer won
      const activePlayerShips = grid.flat().some(cell => cell === 'ship');
      if (!activePlayerShips) {
        audioManager.play('lose');
        setPhase('lose');
        onGameOver(0);
        return;
      }

      setTurn('player');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 max-w-3xl mx-auto">
      {/* Placements dashboard */}
      {phase === 'placement' && activeShipIdx < SHIPS.length && (
        <div className="glass-panel p-4 rounded-xl border border-primary/20 flex justify-between items-center font-orbitron">
          <div className="space-y-1">
            <span className="text-secondary text-[9px] font-bold uppercase tracking-wider block">Deployment Mode</span>
            <h4 className="text-sm font-black text-white uppercase">
              PLACE YOUR: {SHIPS[activeShipIdx].name} ({SHIPS[activeShipIdx].size} cells)
            </h4>
          </div>
          <button
            onClick={() => { setShipHorizontal(!shipHorizontal); audioManager.play('click'); }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-secondary text-darkbg px-4 py-2 rounded-lg text-xs font-bold"
          >
            <RotateCw className="w-4 h-4" /> Direction: {shipHorizontal ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      )}

      {phase === 'battle' && (
        <div className="glass-panel py-3 px-4 rounded-xl border border-white/5 flex justify-between items-center font-orbitron text-xs">
          <span className="text-gray-400">TURN CONTROL:</span>
          <span className={`font-black text-sm uppercase tracking-wide ${
            turn === 'player' ? 'text-primary neon-glow-text-purple' : 'text-secondary neon-glow-text-cyan'
          }`}>
            {turn === 'player' ? 'Launch Torpedo (Player)' : 'CPU Fire Incoming...'}
          </span>
        </div>
      )}

      {/* Result box */}
      {(phase === 'win' || phase === 'lose') && (
        <div className="bg-black/95 border border-white/10 p-5 rounded-2xl text-center space-y-4">
          <h3 className={`font-orbitron font-black text-lg uppercase ${
            phase === 'win' ? 'text-green-400 text-neon-green' : 'text-red-400 text-neon-red'
          }`}>
            {phase === 'win' ? '🏆 DEFENSE MISSION SUCCESSFUL!' : '💀 FLEET COMPLETELY DESTROYED!'}
          </h3>
          <button
            onClick={initGame}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2 px-6 rounded-lg uppercase tracking-wider mx-auto transition"
          >
            <RotateCcw className="w-4 h-4" /> Restart Battle
          </button>
        </div>
      )}

      {/* Grids Display Panel */}
      <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
        {/* Left Side: Player Grid */}
        <div className="space-y-2 text-center w-full max-w-[280px]">
          <h4 className="font-orbitron font-black text-xs text-gray-500 uppercase tracking-widest">
            Your Fleet Radar
          </h4>
          <div className="grid grid-cols-8 grid-rows-8 gap-1 bg-cardbg/80 border border-white/5 p-2 rounded-xl">
            {playerGrid.map((row, r) => 
              row.map((cell, c) => {
                const bgClass = 
                  cell === 'ship' ? 'bg-primary/25 border border-primary text-primary' :
                  cell === 'hit' ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' :
                  cell === 'miss' ? 'bg-zinc-800 border border-zinc-700 text-zinc-500' :
                  'bg-black/20 hover:bg-white/5';

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={phase !== 'placement'}
                    onClick={() => handlePlacementClick(r, c)}
                    className={`w-full aspect-square rounded text-[8px] font-black flex items-center justify-center border border-white/5 transition select-none ${bgClass}`}
                  >
                    {cell === 'ship' ? '🚢' : cell === 'hit' ? '💥' : cell === 'miss' ? '◦' : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Computer Grid */}
        <div className="space-y-2 text-center w-full max-w-[280px]">
          <h4 className="font-orbitron font-black text-xs text-secondary uppercase tracking-widest">
            Enemy Grid Target
          </h4>
          <div className="grid grid-cols-8 grid-rows-8 gap-1 bg-cardbg/80 border border-white/5 p-2 rounded-xl">
            {computerGrid.map((row, r) => 
              row.map((cell, c) => {
                // Keep enemy ships invisible (hidden) until hit!
                const bgClass = 
                  cell === 'hit' ? 'bg-red-500/20 text-red-500 border border-red-500' :
                  cell === 'miss' ? 'bg-zinc-800 border border-zinc-700 text-zinc-500' :
                  'bg-black/20 hover:bg-white/5 border border-white/5 cursor-crosshair';

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={phase !== 'battle' || turn !== 'player'}
                    onClick={() => handleFireClick(r, c)}
                    className={`w-full aspect-square rounded text-[8px] font-black flex items-center justify-center transition select-none ${bgClass}`}
                  >
                    {cell === 'hit' ? '💥' : cell === 'miss' ? '◦' : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
