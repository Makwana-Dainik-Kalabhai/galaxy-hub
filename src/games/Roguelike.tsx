import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, RotateCcw, Heart, Sword } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface RoguelikeProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type TileType = 'wall' | 'floor' | 'player' | 'monster' | 'heart' | 'sword' | 'stairs';
type MonsterEntity = { r: number; c: number; hp: number; maxHp: number; atk: number };

const COLS = 20;
const ROWS = 15;

export const Roguelike: React.FC<RoguelikeProps> = ({ onGameOver, isPaused }) => {
  const [map, setMap] = useState<TileType[][]>([]);
  const [playerStats, setPlayerStats] = useState({ hp: 100, maxHp: 100, atk: 15, gold: 0, level: 1 });
  const [monsters, setMonsters] = useState<MonsterEntity[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('Welcome to the Dungeon. Find the stairs (🪜) to descend.');

  const playerPos = useRef({ r: 0, c: 0 });

  // Keyboard navigation tracks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;

      let dr = 0;
      let dc = 0;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dr = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dr = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dc = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dc = 1;
          break;
        default:
          return; // ignore other keys
      }

      if (dr !== 0 || dc !== 0) {
        e.preventDefault();
        movePlayer(dr, dc);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, map, monsters, playerStats]);

  const initGame = () => {
    audioManager.play('click');
    setPlayerStats({ hp: 100, maxHp: 100, atk: 15, gold: 0, level: 1 });
    setMessage('Entering Dungeon Floor 1...');
    generateFloor(1, 100, 15, 0);
    setIsPlaying(true);
  };

  const generateFloor = (floorLvl: number, hp: number, atk: number, gold: number) => {
    // 1. Fill map with wall elements
    const newMap: TileType[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill('wall'));

    // 2. Define simple procedural rooms
    const rooms = [
      { r: 2, c: 2, w: 4, h: 4 },
      { r: 8, c: 3, w: 5, h: 4 },
      { r: 3, c: 12, w: 5, h: 5 },
      { r: 9, c: 11, w: 6, h: 4 }
    ];

    // Carve out rooms
    rooms.forEach(room => {
      for (let r = room.r; r < room.r + room.h; r++) {
        for (let c = room.c; c < room.c + room.w; c++) {
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            newMap[r][c] = 'floor';
          }
        }
      }
    });

    // Connect rooms with corridors
    const connectRooms = (r1: any, r2: any) => {
      const startR = r1.r + Math.floor(r1.h / 2);
      const startC = r1.c + Math.floor(r1.w / 2);
      const endR = r2.r + Math.floor(r2.h / 2);
      const endC = r2.c + Math.floor(r2.w / 2);

      // horizontal carve
      let currC = startC;
      while (currC !== endC) {
        newMap[startR][currC] = 'floor';
        currC += endC > currC ? 1 : -1;
      }
      // vertical carve
      let currR = startR;
      while (currR !== endR) {
        newMap[currR][endC] = 'floor';
        currR += endR > currR ? 1 : -1;
      }
    };

    connectRooms(rooms[0], rooms[1]);
    connectRooms(rooms[1], rooms[3]);
    connectRooms(rooms[0], rooms[2]);
    connectRooms(rooms[2], rooms[3]);

    // Position player in Room 0 center
    const pStartR = rooms[0].r + 1;
    const pStartC = rooms[0].c + 1;
    playerPos.current = { r: pStartR, c: pStartC };

    // Position staircase in Room 3 center
    const stairR = rooms[3].r + 2;
    const stairC = rooms[3].c + 2;
    newMap[stairR][stairC] = 'stairs';

    // Spawn items in Rooms
    const itemRooms = [rooms[1], rooms[2]];
    itemRooms.forEach(room => {
      // Spawn health heart
      const hr = room.r + Math.floor(Math.random() * room.h);
      const hc = room.c + Math.floor(Math.random() * room.w);
      if (newMap[hr][hc] === 'floor' && !(hr === pStartR && hc === pStartC)) {
        newMap[hr][hc] = 'heart';
      }

      // Spawn sword attack boost
      const sr = room.r + Math.floor(Math.random() * room.h);
      const sc = room.c + Math.floor(Math.random() * room.w);
      if (newMap[sr][sc] === 'floor') {
        newMap[sr][sc] = 'sword';
      }
    });

    // Spawn monsters
    const spawnedMonsters: MonsterEntity[] = [];
    const monsterCount = 2 + floorLvl;

    for (let i = 0; i < monsterCount; i++) {
      const room = rooms[1 + Math.floor(Math.random() * 3)];
      const mr = room.r + Math.floor(Math.random() * room.h);
      const mc = room.c + Math.floor(Math.random() * room.w);

      if (newMap[mr][mc] === 'floor' && !(mr === pStartR && mc === pStartC) && !(mr === stairR && mc === stairC)) {
        newMap[mr][mc] = 'monster';
        spawnedMonsters.push({
          r: mr,
          c: mc,
          hp: 25 + floorLvl * 10,
          maxHp: 25 + floorLvl * 10,
          atk: 4 + floorLvl * 2
        });
      }
    }

    setMap(newMap);
    setMonsters(spawnedMonsters);
    setPlayerStats({ hp, maxHp: 100, atk, gold, level: floorLvl });
  };

  const movePlayer = (dr: number, dc: number) => {
    const nextR = playerPos.current.r + dr;
    const nextC = playerPos.current.c + dc;

    if (nextR < 0 || nextR >= ROWS || nextC < 0 || nextC >= COLS) return;

    const destTile = map[nextR][nextC];
    if (destTile === 'wall') return; // blocked

    // Handle Monster battle trigger
    if (destTile === 'monster') {
      executeBattle(nextR, nextC);
      return;
    }

    audioManager.play('click');
    const newMap = map.map(row => [...row]);

    // Handle staircase descend
    if (destTile === 'stairs') {
      audioManager.play('win');
      const nextLvl = playerStats.level + 1;
      setMessage(`Descended to Floor ${nextLvl}! Enemies are stronger.`);
      generateFloor(nextLvl, playerStats.hp, playerStats.atk, playerStats.gold + 100);
      return;
    }

    // Handle Item pick-ups
    if (destTile === 'heart') {
      audioManager.play('score');
      setPlayerStats(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 30) }));
      setMessage('Picked up heart! +30 Health Points.');
    }
    if (destTile === 'sword') {
      audioManager.play('score');
      setPlayerStats(prev => ({ ...prev, atk: prev.atk + 5 }));
      setMessage('Equipped broadsword! +5 Attack Strength.');
    }

    playerPos.current = { r: nextR, c: nextC };
    setMap(newMap);
  };

  const executeBattle = (r: number, c: number) => {
    audioManager.play('hit');
    const monsterIdx = monsters.findIndex(m => m.r === r && m.c === c);
    if (monsterIdx === -1) return;

    const monster = { ...monsters[monsterIdx] };
    const pAtk = playerStats.atk;
    const mAtk = monster.atk;

    // Damage calculations
    monster.hp -= pAtk;
    let nextHp = playerStats.hp;

    if (monster.hp <= 0) {
      // Monster defeated
      setMessage(`Defeated monster! Gained +20 gold.`);
      audioManager.play('score');

      const newMap = map.map(row => [...row]);
      newMap[r][c] = 'floor'; // clear tile
      setMap(newMap);
      setMonsters(prev => prev.filter((_, idx) => idx !== monsterIdx));

      setPlayerStats(prev => ({ ...prev, gold: prev.gold + 20 }));
    } else {
      // Monster fights back
      nextHp = Math.max(0, nextHp - mAtk);
      setMonsters(prev => prev.map((m, idx) => idx === monsterIdx ? monster : m));
      setMessage(`Attacked monster for ${pAtk} damage. Monster hit you back for ${mAtk} HP.`);

      if (nextHp <= 0) {
        // Player Died! Game over
        setIsPlaying(false);
        audioManager.play('lose');
        // submit final score
        onGameOver(playerStats.gold + playerStats.level * 150);
      }
      setPlayerStats(prev => ({ ...prev, hp: nextHp }));
    }
  };

  const getTileEmoji = (type: TileType, r: number, c: number) => {
    if (playerPos.current.r === r && playerPos.current.c === c && isPlaying) return '🧙‍♂️';

    switch (type) {
      case 'wall': return '🧱';
      case 'monster': return '👹';
      case 'heart': return '❤️';
      case 'sword': return '⚔️';
      case 'stairs': return '🪜';
      default: return ' ';
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-xl mx-auto select-none">
      {/* HUD Info stats */}
      <div className="grid grid-cols-4 gap-2 bg-black/40 border border-white/5 p-3 rounded-xl w-full text-center font-orbitron text-[10px]">
        <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold">
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>HP: {playerStats.hp}/{playerStats.maxHp}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-secondary font-bold">
          <Sword className="w-3.5 h-3.5" />
          <span>ATK: {playerStats.atk}</span>
        </div>
        <div>
          <p className="text-gray-500 font-bold">GOLD</p>
          <h4 className="text-xs font-black text-yellow-400 mt-0.5 font-mono">{playerStats.gold}</h4>
        </div>
        <div>
          <p className="text-gray-500 font-bold">DUNGEON</p>
          <h4 className="text-xs font-black text-white mt-0.5 font-mono">Floor {playerStats.level}</h4>
        </div>
      </div>

      {/* Info message board */}
      <div className="w-full text-center bg-cardbg border border-white/5 py-2 px-3 rounded-lg text-xs font-medium text-gray-300 min-h-[36px] flex items-center justify-center">
        {message}
      </div>

      {/* Grid container */}
      <div className="relative border border-white/5 bg-black p-2 rounded-2xl w-full max-w-md overflow-hidden aspect-[4/3] grid grid-cols-20 grid-rows-15 gap-0">
        {map.map((row, r) =>
          row.map((tile, c) => {
            const isPlayer = playerPos.current.r === r && playerPos.current.c === c && isPlaying;
            const emoji = getTileEmoji(tile, r, c);
            const isFloor = tile === 'floor' || isPlayer;

            return (
              <div
                key={`${r}-${c}`}
                className={`w-full aspect-square flex items-center justify-center text-xs md:text-sm ${isFloor ? 'bg-zinc-950/20' : 'bg-indigo-950/40 border border-white/2'
                  }`}
              >
                {emoji}
              </div>
            );
          })
        )}

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mb-2 animate-bounce" />
            <h4 className="font-orbitron font-extrabold text-sm uppercase text-white mb-2">
              {playerStats.hp <= 0 ? `DEFEATED! Reached Floor: ${playerStats.level}` : 'Procedural Roguelike Dungeon'}
            </h4>
            <button
              onClick={initGame}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" /> Start Dungeon
            </button>
          </div>
        )}
      </div>

      {/* Direction steer touch pad */}
      <div className="flex flex-col items-center gap-1 sm:hidden mt-2">
        <button
          onClick={() => movePlayer(-1, 0)}
          className="w-10 h-10 bg-cardbg border border-white/5 flex items-center justify-center rounded-lg text-white"
        >
          ▲
        </button>
        <div className="flex gap-6">
          <button
            onClick={() => movePlayer(0, -1)}
            className="w-10 h-10 bg-cardbg border border-white/5 flex items-center justify-center rounded-lg text-white"
          >
            ◀
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="w-10 h-10 bg-cardbg border border-white/5 flex items-center justify-center rounded-lg text-white"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => movePlayer(1, 0)}
          className="w-10 h-10 bg-cardbg border border-white/5 flex items-center justify-center rounded-lg text-white"
        >
          ▼
        </button>
      </div>
    </div>
  );
};
