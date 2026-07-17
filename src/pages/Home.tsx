import React, { useState, useMemo } from 'react';
import { Search, Gamepad2, Play, Star, Compass } from 'lucide-react';
import { GAMES, type GameMetadata } from '../utils/gamesData';
import { audioManager } from '../utils/audioManager';

interface HomeProps {
  onSelectGame: (gameId: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectGame }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Featured Game of the Day
  const gameOfTheDay = useMemo(() => {
    return GAMES.find(g => g.id === 'tetris') || GAMES[0];
  }, []);

  // Filter & Sort Logic
  const filteredGames = useMemo(() => {
    return GAMES.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            game.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            game.difficulty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = selectedDifficulty === 'All' || game.difficulty === selectedDifficulty;
      const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [searchQuery, selectedDifficulty, selectedCategory]);

  const handleGameSelect = (id: string) => {
    audioManager.play('click');
    onSelectGame(id);
  };

  // Group games for the rows
  const trendingGames = useMemo(() => GAMES.filter(g => g.rating >= 4.7).slice(0, 5), []);
  const beginnerGames = useMemo(() => GAMES.filter(g => g.difficulty === 'Easy'), []);
  const challengeGames = useMemo(() => GAMES.filter(g => g.difficulty === 'Hard').slice(0, 5), []);
  const multiPlayerGames = useMemo(() => GAMES.filter(g => g.players === 'Local PvP'), []);

  return (
    <div className="space-y-10 pb-12">
      {/* 1. HERO SECTION & FEATURED GAME */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Animated Gaming Banner */}
        <div className="lg:col-span-2 relative glass-panel rounded-2xl overflow-hidden p-6 md:p-10 flex flex-col justify-between neon-border-purple min-h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10 -z-10 animate-pulse"></div>
          {/* Decorative backdrop particle circles */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-secondary/15 rounded-full blur-2xl"></div>

          <div className="space-y-4">
            <span className="text-secondary font-orbitron font-bold tracking-widest text-xs uppercase bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 inline-block">
              Welcome to the Grid
            </span>
            <h2 className="font-orbitron font-extrabold text-3xl md:text-5xl tracking-wide leading-tight">
              YOUR ULTIMATE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-white">
                ARCADE PLAYGROUND
              </span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-md">
              Browse and play 20 retro classics and challenging puzzles directly in your browser. Track high scores and unlock custom trophy badges!
            </p>
          </div>

          {/* Quick Hub Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 mt-6">
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Games</p>
              <h4 className="font-orbitron font-bold text-xl text-white md:text-2xl neon-glow-text-purple">20</h4>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Players</p>
              <h4 className="font-orbitron font-bold text-xl text-secondary md:text-2xl neon-glow-text-cyan">1,248</h4>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Global XP Level</p>
              <h4 className="font-orbitron font-bold text-xl text-green-400 md:text-2xl neon-glow-text-green">99+</h4>
            </div>
          </div>
        </div>

        {/* Game of the Day (Featured) */}
        <div className="relative glass-panel rounded-2xl overflow-hidden p-6 flex flex-col justify-between border border-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-t from-darkbg via-cardbg/80 to-transparent z-0"></div>
          
          {/* Animated Card visual */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-darkbg font-bold font-orbitron text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              🔥 GAME OF THE DAY
            </span>
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded text-xs text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-yellow-400" />
              <span className="font-bold">4.9</span>
            </div>
          </div>

          <div className="relative z-10 space-y-3 mt-12">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{gameOfTheDay.emoji}</span>
              <div>
                <h3 className="font-orbitron font-black text-xl text-white leading-tight">
                  {gameOfTheDay.title}
                </h3>
                <span className="text-[10px] uppercase font-bold text-secondary tracking-widest">
                  {gameOfTheDay.category} &bull; {gameOfTheDay.difficulty}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-3">
              {gameOfTheDay.description}
            </p>
            <button
              onClick={() => handleGameSelect(gameOfTheDay.id)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-darkbg hover:scale-102 hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] font-orbitron font-black text-xs py-3 rounded-lg uppercase tracking-wider transition-all duration-300"
            >
              <Play className="w-4 h-4 fill-darkbg" />
              PLAY NOW
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CONTROLS DASHBOARD */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center border border-white/5">
        <div className="relative w-full md:max-w-md">
          <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="hub-search"
            type="text"
            placeholder="Search games, genres, difficulties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-lg py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-gray-500 transition"
          />
        </div>

        {/* Filter badging row */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); audioManager.play('click'); }}
            className="bg-cardbg/80 text-xs border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-secondary"
          >
            <option value="All">All Categories</option>
            <option value="Classic">Classic</option>
            <option value="Puzzle">Puzzle</option>
            <option value="Action">Action</option>
            <option value="Strategy">Strategy</option>
            <option value="Rhythm">Rhythm</option>
          </select>

          {/* Difficulty Dropdown */}
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => { setSelectedDifficulty(e.target.value); audioManager.play('click'); }}
            className="bg-cardbg/80 text-xs border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-secondary"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">🟢 Easy</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Hard">🔴 Hard</option>
          </select>
        </div>
      </div>

      {/* 3. DYNAMIC SEARCH RESULTS OR NETFLIX GRID ROWS */}
      {searchQuery || selectedDifficulty !== 'All' || selectedCategory !== 'All' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Compass className="w-5 h-5 text-secondary" />
            <h3 className="font-orbitron font-bold text-lg">
              Search Results ({filteredGames.length})
            </h3>
          </div>
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} onPlay={handleGameSelect} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-cardbg/20 rounded-xl border border-dashed border-white/5">
              <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No games match your active filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedDifficulty('All'); setSelectedCategory('All'); }}
                className="mt-3 text-xs text-secondary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Trending Now */}
          <GameRow title="🔥 Trending Now" games={trendingGames} onPlay={handleGameSelect} />
          
          {/* Beginner Friendly */}
          <GameRow title="🟢 Beginner Friendly" games={beginnerGames} onPlay={handleGameSelect} />

          {/* Local Multiplayer / PVP */}
          <GameRow title="👥 Local Multiplayer (PvP)" games={multiPlayerGames} onPlay={handleGameSelect} />

          {/* Hardcore Challenge */}
          <GameRow title="🏆 Ultimate Challenges" games={challengeGames} onPlay={handleGameSelect} />
        </div>
      )}
    </div>
  );
};

/* COMPONENT: Row of Game Cards */
const GameRow: React.FC<{ title: string; games: GameMetadata[]; onPlay: (id: string) => void }> = ({
  title,
  games,
  onPlay
}) => {
  if (games.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3 className="font-orbitron font-extrabold text-lg md:text-xl tracking-wide flex items-center gap-2 text-white">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
};

/* COMPONENT: Single Game Card */
const GameCard: React.FC<{ game: GameMetadata; onPlay: (id: string) => void }> = ({ game, onPlay }) => {
  const diffColorClass = 
    game.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
    game.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
    'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <div 
      onClick={() => onPlay(game.id)}
      className="glass-card rounded-xl overflow-hidden flex flex-col justify-between group cursor-pointer border border-white/5 hover:border-primary/30"
      id={`game-card-${game.id}`}
    >
      {/* Thumbnail/Art space */}
      <div className="h-32 w-full bg-gradient-to-br from-cardbg to-black/60 relative overflow-hidden flex items-center justify-center select-none border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/5 group-hover:scale-110 transition duration-500"></div>
        <span className="text-5xl transform group-hover:scale-125 group-hover:rotate-6 transition duration-300 relative z-10">
          {game.emoji}
        </span>
        <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-gray-400 border border-white/5 uppercase font-semibold">
          {game.category}
        </div>
      </div>

      {/* Info details */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="font-orbitron font-bold text-sm text-white group-hover:text-secondary transition truncate">
            {game.title}
          </h4>
          <p className="text-[10px] text-gray-500 line-clamp-2 leading-normal">
            {game.description}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {/* Metadata badges */}
          <div className="flex justify-between items-center text-[9px]">
            <span className={`px-2 py-0.5 rounded border font-semibold uppercase ${diffColorClass}`}>
              {game.difficulty}
            </span>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3 h-3 fill-yellow-400" />
              <span className="font-bold">{game.rating}</span>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="w-full flex items-center justify-center gap-1.5 bg-white/5 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary text-gray-400 group-hover:text-darkbg text-[10px] font-orbitron font-bold py-2 rounded-lg uppercase tracking-wider transition-all duration-300">
            <Play className="w-3.5 h-3.5 fill-current" />
            PLAY GAME
          </div>
        </div>
      </div>
    </div>
  );
};
