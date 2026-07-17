export interface UserProfile {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  achievements: string[];
  totalPlaytime: number; // in seconds
  gamesPlayed: Record<string, number>; // gameId -> playCount
}

export interface ScoreRecord {
  username: string;
  score: number;
  date: string;
  level?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_play', name: 'First Steps', description: 'Play your first game on the Gaming Hub', icon: '🎮', points: 50 },
  { id: 'high_roller', name: 'High Roller', description: 'Reach a score of 1,000 points or more in any game', icon: '🔥', points: 100 },
  { id: 'gaming_veteran', name: 'Gaming Veteran', description: 'Play 5 different games', icon: '🏆', points: 150 },
  { id: 'level_5', name: 'Elite Level', description: 'Reach level 5 in the Hub', icon: '⭐', points: 200 },
  { id: 'perfect_match', name: 'Winner!', description: 'Win a game of Memory Card or Tic-Tac-Toe', icon: '🧠', points: 100 },
  { id: 'snake_master', name: 'Snake Master', description: 'Score 100+ points in Snake', icon: '🐍', points: 100 },
  { id: 'arcade_champion', name: 'Arcade Champion', description: 'Submit 10 scores total across any games', icon: '👾', points: 150 },
];

const DEFAULT_PROFILE: UserProfile = {
  username: 'Guest Player',
  avatar: '🎮',
  xp: 0,
  level: 1,
  achievements: [],
  totalPlaytime: 0,
  gamesPlayed: {},
};

export const getProfile = (): UserProfile => {
  const data = localStorage.getItem('gaming_hub_profile');
  if (!data) return DEFAULT_PROFILE;
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_PROFILE;
  }
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem('gaming_hub_profile', JSON.stringify(profile));
};

export const getLeaderboard = (gameId: string): ScoreRecord[] => {
  const data = localStorage.getItem(`gaming_hub_leaderboard_${gameId}`);
  if (!data) {
    // Generate some mock entries initially so it looks active
    const mocks: ScoreRecord[] = [
      { username: 'AlphaByte', score: 850, date: '2026-07-16' },
      { username: 'RetroKing', score: 720, date: '2026-07-15' },
      { username: 'PixelQueen', score: 600, date: '2026-07-17' },
      { username: 'CyberSamurai', score: 450, date: '2026-07-17' },
    ].sort((a, b) => b.score - a.score);
    localStorage.setItem(`gaming_hub_leaderboard_${gameId}`, JSON.stringify(mocks));
    return mocks;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const submitScore = (gameId: string, score: number, level?: number) => {
  const profile = getProfile();
  
  // Track play count
  profile.gamesPlayed[gameId] = (profile.gamesPlayed[gameId] || 0) + 1;
  
  // Calculate XP gained: score + 10 XP base for playing
  const xpGained = Math.max(10, Math.floor(score / 10) + 15);
  profile.xp += xpGained;
  
  // Level up threshold: level * 300 XP
  let leveledUp = false;
  while (profile.xp >= profile.level * 300) {
    profile.xp -= profile.level * 300;
    profile.level += 1;
    leveledUp = true;
  }
  
  // Add score to leaderboard
  const scores = getLeaderboard(gameId);
  const newRecord: ScoreRecord = {
    username: profile.username,
    score,
    date: new Date().toISOString().split('T')[0],
    level
  };
  scores.push(newRecord);
  scores.sort((a, b) => b.score - a.score);
  // Keep top 10
  localStorage.setItem(`gaming_hub_leaderboard_${gameId}`, JSON.stringify(scores.slice(0, 10)));
  
  // Check achievements
  const unlockedNow: string[] = [];
  
  const checkUnlock = (id: string) => {
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
      unlockedNow.push(id);
    }
  };
  
  // Achievement conditions
  checkUnlock('first_play');
  
  if (score >= 1000) {
    checkUnlock('high_roller');
  }
  
  const uniqueGamesPlayed = Object.keys(profile.gamesPlayed).length;
  if (uniqueGamesPlayed >= 5) {
    checkUnlock('gaming_veteran');
  }
  
  if (profile.level >= 5) {
    checkUnlock('level_5');
  }
  
  const totalScoresSubmitted = Object.values(profile.gamesPlayed).reduce((a, b) => a + b, 0);
  if (totalScoresSubmitted >= 10) {
    checkUnlock('arcade_champion');
  }
  
  if (gameId === 'snake' && score >= 100) {
    checkUnlock('snake_master');
  }
  
  if ((gameId === 'memory-card' || gameId === 'tic-tac-toe') && score > 0) {
    checkUnlock('perfect_match');
  }
  
  saveProfile(profile);
  
  return {
    xpGained,
    leveledUp,
    newLevel: profile.level,
    unlockedNow: unlockedNow.map(id => ACHIEVEMENTS_LIST.find(a => a.id === id)!)
  };
};

export const updatePlaytime = (seconds: number) => {
  const profile = getProfile();
  profile.totalPlaytime += seconds;
  saveProfile(profile);
};
