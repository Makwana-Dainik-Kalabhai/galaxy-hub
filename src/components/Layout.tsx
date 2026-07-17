import React, { useState, useEffect } from 'react';
import { Gamepad2, Volume2, VolumeX, Trophy } from 'lucide-react';
import { getProfile, type UserProfile } from '../utils/storage';
import { audioManager } from '../utils/audioManager';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'profile';
  setActiveTab: (tab: 'home' | 'profile') => void;
  profileRefreshTrigger: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  profileRefreshTrigger
}) => {
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());

  useEffect(() => {
    setProfile(getProfile());
  }, [profileRefreshTrigger]);

  const handleMuteToggle = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
    audioManager.play('click');
  };

  const xpPercent = Math.min(100, Math.floor((profile.xp / (profile.level * 300)) * 100));

  return (
    <div className="min-h-screen bg-darkbg text-white relative grid-background overflow-hidden flex flex-col">
      {/* Decorative top neon gradient line */}
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary w-full animate-pulse"></div>

      {/* Global Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => { setActiveTab('home'); audioManager.play('click'); }}
        >
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg neon-border-cyan transform group-hover:scale-110 transition">
            <Gamepad2 className="w-6 h-6 text-darkbg font-bold animate-pulse" />
          </div>
          <div>
            <h1 className="font-orbitron font-black text-xl md:text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-white">
              GALAXY HUB
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-secondary font-semibold font-orbitron block">
              Arcade Station
            </span>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* User Quick Stats Widget */}
          <div 
            onClick={() => { setActiveTab('profile'); audioManager.play('click'); }}
            className="flex items-center gap-3 bg-cardbg/80 border border-white/5 rounded-full pl-3 pr-4 py-1.5 cursor-pointer hover:border-secondary/40 transition-all select-none"
          >
            <span className="text-xl">{profile.avatar}</span>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight truncate max-w-[100px] text-white">
                {profile.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] px-1 bg-primary/20 text-secondary border border-secondary/20 rounded font-bold font-orbitron">
                  LVL {profile.level}
                </span>
                {/* Micro progress bar */}
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center bg-cardbg/80 border border-white/5 rounded-full p-1 gap-1">
            <button
              onClick={() => { setActiveTab('home'); audioManager.play('click'); }}
              className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                activeTab === 'home' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-darkbg font-bold shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Dashboard"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setActiveTab('profile'); audioManager.play('click'); }}
              className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-darkbg font-bold shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Profile & Trophy Room"
            >
              <Trophy className="w-5 h-5" />
            </button>
          </nav>

          {/* Volume Mute Toggle */}
          <button
            onClick={handleMuteToggle}
            className={`p-2.5 rounded-full border transition-all duration-300 ${
              isMuted 
                ? 'border-red-500/30 text-red-400 bg-red-950/20 hover:bg-red-950/40' 
                : 'border-white/5 text-secondary hover:border-secondary/40 hover:bg-white/5'
            }`}
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/5 py-4 text-center mt-auto text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center px-4 md:px-8 gap-2">
        <p>&copy; 2026 Galaxy Hub Arcade. Built for gamers everywhere.</p>
        <div className="flex gap-4">
          <span className="text-secondary font-orbitron font-semibold">100% OFFLINE CAPABLE</span>
          <span>&bull;</span>
          <span className="text-primary font-semibold">HTML5 WEB AUDIO & CANVAS POWERED</span>
        </div>
      </footer>
    </div>
  );
};
