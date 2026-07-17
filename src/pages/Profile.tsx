import React, { useState } from 'react';
import { Award, Sparkles, User, Flame, Clock, Dumbbell } from 'lucide-react';
import { getProfile, saveProfile, ACHIEVEMENTS_LIST, type UserProfile } from '../utils/storage';
import { GAMES } from '../utils/gamesData';
import { audioManager } from '../utils/audioManager';

interface ProfileProps {
  onProfileUpdated: () => void;
}

const AVATAR_OPTIONS = ['🎮', '👾', '🚀', '🐱‍👓', '🤖', '👑', '🔥', '🧙‍♂️', '🧜‍♀️', '🦄', '☠️', '🎯', '👽', '🐯', '⚡'];

export const Profile: React.FC<ProfileProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    audioManager.play('click');
    const updated = {
      ...profile,
      username: usernameInput.trim() || 'Guest Player'
    };
    saveProfile(updated);
    setProfile(updated);
    onProfileUpdated();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleSelectAvatar = (avatar: string) => {
    audioManager.play('click');
    const updated = { ...profile, avatar };
    saveProfile(updated);
    setProfile(updated);
    onProfileUpdated();
    setShowAvatarSelector(false);
  };

  // Compute overall stats
  const totalGamesPlayed = Object.values(profile.gamesPlayed).reduce((a, b) => a + b, 0);
  const uniqueGamesPlayed = Object.keys(profile.gamesPlayed).length;
  
  const formattedPlaytime = () => {
    const mins = Math.floor(profile.totalPlaytime / 60);
    const secs = profile.totalPlaytime % 60;
    if (mins === 0) return `${secs} seconds`;
    return `${mins}m ${secs}s`;
  };

  const xpPercent = Math.min(100, Math.floor((profile.xp / (profile.level * 300)) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <User className="w-6 h-6 text-primary" />
        <h2 className="font-orbitron font-extrabold text-2xl tracking-wider text-white">
          PLAYER PROFILE
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Card: Edit Profile & Customize Avatar */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="font-orbitron font-bold text-base text-secondary flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Personalize
          </h3>

          <div className="flex flex-col items-center gap-4 py-4 relative">
            {/* Avatar display */}
            <div className="relative group">
              <div 
                onClick={() => { setShowAvatarSelector(!showAvatarSelector); audioManager.play('click'); }}
                className="w-24 h-24 rounded-full bg-cardbg flex items-center justify-center text-5xl cursor-pointer border-2 border-primary/40 hover:border-secondary transition shadow-lg shadow-primary/10"
              >
                {profile.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary to-secondary text-darkbg p-1.5 rounded-full text-[9px] font-bold font-orbitron shadow-md pointer-events-none">
                EDIT
              </div>
            </div>

            {/* Avatar Picker Modal/Dropdown */}
            {showAvatarSelector && (
              <div className="absolute top-36 z-20 bg-cardbg border border-white/15 p-3 rounded-xl shadow-2xl w-64 grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectAvatar(emoji)}
                    className="text-2xl p-1.5 hover:bg-white/10 rounded transition transform hover:scale-115"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* User credentials */}
            <form onSubmit={handleSaveProfile} className="w-full space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">
                  Gamer Tag
                </label>
                <input
                  id="profile-username-input"
                  type="text"
                  maxLength={15}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-secondary text-white transition font-orbitron"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2.5 rounded-lg tracking-wider uppercase transition hover:scale-102 hover:shadow-[0_0_12px_rgba(108,99,255,0.4)]"
              >
                SAVE PROFILE
              </button>
              
              {saveFeedback && (
                <p className="text-center text-xs text-secondary font-bold font-orbitron animate-pulse">
                  ✓ Profile Saved!
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Middle Card: XP Level & Core Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Level and XP Meter */}
          <div className="glass-panel p-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left space-y-2">
              <span className="text-secondary font-orbitron font-extrabold text-[11px] uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 inline-block">
                Level status
              </span>
              <h2 className="font-orbitron font-black text-3xl md:text-4xl text-white">
                LEVEL {profile.level}
              </h2>
              <p className="text-xs text-gray-400">
                Gained {profile.xp} XP towards level {profile.level + 1}. Need {profile.level * 300 - profile.xp} XP to rank up.
              </p>
            </div>
            
            {/* Massive radial/bar level meter */}
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-xs font-orbitron text-gray-400">
                <span>XP PROGRESS</span>
                <span>{xpPercent}%</span>
              </div>
              <div className="h-4 bg-black/40 border border-white/5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-secondary to-green-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                  style={{ width: `${xpPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
              <Flame className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Play Sessions</p>
              <h4 className="font-orbitron font-bold text-lg text-white mt-0.5">{totalGamesPlayed}</h4>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
              <Dumbbell className="w-5 h-5 text-secondary mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Unique Games</p>
              <h4 className="font-orbitron font-bold text-lg text-white mt-0.5">{uniqueGamesPlayed} / 20</h4>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
              <Award className="w-5 h-5 text-yellow-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Achievements</p>
              <h4 className="font-orbitron font-bold text-lg text-white mt-0.5">
                {profile.achievements.length} / {ACHIEVEMENTS_LIST.length}
              </h4>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
              <Clock className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Time Active</p>
              <h4 className="font-orbitron font-bold text-sm text-white mt-1 truncate">{formattedPlaytime()}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACHIEVEMENTS / TROPHY GALLERY */}
      <div className="space-y-4">
        <h3 className="font-orbitron font-extrabold text-lg tracking-wider text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" /> TROPHY GALLERY
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map(ach => {
            const isUnlocked = profile.achievements.includes(ach.id);
            return (
              <div 
                key={ach.id}
                className={`glass-panel p-4 rounded-xl border flex gap-3 transition-all relative overflow-hidden ${
                  isUnlocked 
                    ? 'border-yellow-500/25 bg-gradient-to-br from-yellow-500/5 to-transparent' 
                    : 'border-white/5 opacity-50'
                }`}
              >
                {/* Visual glow indicator */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-darkbg px-2 py-0.5 rounded-bl font-orbitron font-black text-[7px] uppercase tracking-wider shadow">
                    UNLOCKED
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl select-none ${
                  isUnlocked ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-black/40 border border-white/5'
                }`}>
                  {ach.icon}
                </div>
                
                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="font-orbitron font-bold text-xs text-white truncate">
                    {ach.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                    {ach.description}
                  </p>
                  <span className="text-[8px] font-bold font-orbitron text-yellow-500 mt-1 block uppercase">
                    +{ach.points} XP Points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. INDIVIDUAL GAME SESSIONS SUMMARY */}
      <div className="space-y-4">
        <h3 className="font-orbitron font-extrabold text-lg tracking-wider text-white">
          GAME HISTORIES
        </h3>

        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/5 grid grid-cols-3 text-xs font-orbitron text-gray-400 font-bold uppercase tracking-wider">
            <span>Game Title</span>
            <span className="text-center">Times Played</span>
            <span className="text-right">Top Score</span>
          </div>

          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
            {GAMES.map(game => {
              const count = profile.gamesPlayed[game.id] || 0;
              // get top score from leaderboard
              const scores = localStorage.getItem(`gaming_hub_leaderboard_${game.id}`);
              let topScore = 0;
              if (scores) {
                try {
                  const list = JSON.parse(scores);
                  const userScores = list.filter((r: any) => r.username === profile.username);
                  if (userScores.length > 0) {
                    topScore = Math.max(...userScores.map((r: any) => r.score));
                  }
                } catch(e) {}
              }

              return (
                <div key={game.id} className="p-4 grid grid-cols-3 items-center text-xs font-medium hover:bg-white/5 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{game.emoji}</span>
                    <span className="font-orbitron font-bold text-white">{game.title}</span>
                  </div>
                  <div className="text-center text-gray-300 font-mono">{count} times</div>
                  <div className="text-right text-secondary font-mono font-bold">{topScore || '—'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
