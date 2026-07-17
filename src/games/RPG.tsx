import React, { useState } from 'react';
import { RotateCcw, Heart, Sword } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface RPGProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

type HeroClass = 'Warrior' | 'Mage' | 'Rogue';
type Enemy = { name: string; hp: number; maxHp: number; atk: number; expValue: number; goldValue: number; emoji: string };

const QUESTS = [
  { id: 1, name: 'Cave Slime Menace', desc: 'Slay the toxic green cave slime', rewardGold: 60, exp: 50, enemyEmoji: '🟢' },
  { id: 2, name: 'Goblin Patrol Raid', desc: 'Clear the goblin scouting outpost', rewardGold: 120, exp: 100, enemyEmoji: '👺' },
  { id: 3, name: 'Conquer the Onyx Dragon', desc: 'Defeat the scaling beast in the ruins', rewardGold: 300, exp: 200, enemyEmoji: '🐉' }
];

export const RPG: React.FC<RPGProps> = ({ onGameOver, isPaused }) => {
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null);
  const [stats, setStats] = useState({ lvl: 1, hp: 80, maxHp: 80, atk: 12, exp: 0, gold: 50 });
  const [weapon, setWeapon] = useState('Iron Sword');
  const [armor, setArmor] = useState('Leather Vest');
  const [activeQuestIdx, setActiveQuestIdx] = useState(0);
  const [combatEnemy, setCombatEnemy] = useState<Enemy | null>(null);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [menuTab, setMenuTab] = useState<'quest' | 'shop'>('quest');

  // Select Hero Class to begin
  const selectHeroClass = (cls: HeroClass) => {
    audioManager.play('click');
    setHeroClass(cls);
    const baseStats =
      cls === 'Warrior' ? { lvl: 1, hp: 110, maxHp: 110, atk: 11, exp: 0, gold: 50 } :
        cls === 'Mage' ? { lvl: 1, hp: 75, maxHp: 75, atk: 16, exp: 0, gold: 50 } :
          { lvl: 1, hp: 90, maxHp: 90, atk: 13, exp: 0, gold: 50 }; // Rogue

    setStats(baseStats);
    setWeapon(cls === 'Warrior' ? 'Steel Sword' : cls === 'Mage' ? 'Wooden Staff' : 'Twin Daggers');
    setArmor('Initiate Tunic');
    setActiveQuestIdx(0);
    setCombatEnemy(null);
    setCombatLogs([]);
  };

  const startQuest = () => {
    audioManager.play('click');
    const quest = QUESTS[activeQuestIdx];
    const enemyLvl = activeQuestIdx + 1;

    setCombatEnemy({
      name: quest.name.replace('Menace', '').replace('Raid', '').replace('Conquer the', ''),
      hp: 35 + enemyLvl * 25,
      maxHp: 35 + enemyLvl * 25,
      atk: 5 + enemyLvl * 3,
      expValue: quest.exp,
      goldValue: quest.rewardGold,
      emoji: quest.enemyEmoji
    });
    setCombatLogs([`A wild ${quest.name} blocks your path! Prepare to fight.`]);
  };

  const handleCombatAction = (action: 'attack' | 'special' | 'heal' | 'flee') => {
    if (!combatEnemy || isPaused) return;

    audioManager.play('click');
    const logs = new Array();
    let pDamage = stats.atk;
    let enemy = { ...combatEnemy };
    let player = { ...stats };

    if (action === 'attack') {
      audioManager.play('hit');
      enemy.hp -= pDamage;
      logs.push(`You slashed the ${enemy.name} for ${pDamage} damage.`);
    } else if (action === 'special') {
      audioManager.play('hit');
      const specDamage = Math.floor(pDamage * 1.5);
      enemy.hp -= specDamage;
      logs.push(`You unleashed your special spell dealing ${specDamage} critical damage!`);
    } else if (action === 'heal') {
      audioManager.play('score');
      const healAmount = 25 + player.lvl * 5;
      player.hp = Math.min(player.maxHp, player.hp + healAmount);
      logs.push(`You drank a potion restoring +${healAmount} HP.`);
    } else {
      // Flee
      setCombatEnemy(null);
      setCombatLogs([]);
      return;
    }

    // Check if enemy dead
    if (enemy.hp <= 0) {
      audioManager.play('win');
      player.gold += enemy.goldValue;
      player.exp += enemy.expValue;

      logs.push(`Defeated ${enemy.name}! Gained ${enemy.goldValue} Gold and ${enemy.expValue} EXP.`);

      // Level Up Check
      const nextExpReq = player.lvl * 120;
      if (player.exp >= nextExpReq) {
        player.lvl += 1;
        player.exp -= nextExpReq;
        player.maxHp += 15;
        player.hp = player.maxHp;
        player.atk += 3;
        logs.push(`✨ LEVEL UP! You reached Level ${player.lvl}! Health and attack increased.`);
        audioManager.play('levelUp');
      }

      setStats(player);
      setCombatEnemy(null);
      setCombatLogs(logs);

      // Quest campaign progress
      const nextQuest = activeQuestIdx + 1;
      if (nextQuest >= QUESTS.length) {
        onGameOver(player.gold + player.lvl * 200);
      } else {
        setActiveQuestIdx(nextQuest);
      }
      return;
    }

    // Enemy turn attack
    const enemyAtk = enemy.atk;
    player.hp = Math.max(0, player.hp - enemyAtk);
    logs.push(`The ${enemy.name} retaliated dealing ${enemyAtk} damage.`);

    if (player.hp <= 0) {
      audioManager.play('lose');
      setCombatEnemy(null);
      setCombatLogs([`You perished in battle. Quest failed.`]);
      onGameOver(0);
    }

    setStats(player);
    setCombatEnemy(enemy);
    setCombatLogs(prev => [...prev, ...logs]);
  };

  const buyItem = (type: 'weapon' | 'armor', cost: number, name: string, statBonus: number) => {
    if (stats.gold < cost) return;

    audioManager.play('score');
    setStats(prev => ({
      ...prev,
      gold: prev.gold - cost,
      atk: type === 'weapon' ? prev.atk + statBonus : prev.atk,
      maxHp: type === 'armor' ? prev.maxHp + statBonus : prev.maxHp,
      hp: type === 'armor' ? prev.hp + statBonus : prev.hp
    }));

    if (type === 'weapon') setWeapon(name);
    else setArmor(name);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 max-w-md mx-auto select-none">
      {!heroClass ? (
        <div className="w-full text-center space-y-4">
          <h4 className="font-orbitron font-extrabold text-sm uppercase text-gray-400 tracking-wider">
            Choose Your Hero Class
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {(['Warrior', 'Mage', 'Rogue'] as HeroClass[]).map(cls => (
              <button
                key={cls}
                onClick={() => selectHeroClass(cls)}
                className="p-4 bg-cardbg border border-white/5 rounded-xl font-orbitron font-black text-xs hover:border-primary hover:text-primary transition"
              >
                <span className="text-3xl block mb-2">
                  {cls === 'Warrior' ? '🛡️' : cls === 'Mage' ? '🔮' : '🗡️'}
                </span>
                {cls}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 bg-black/40 border border-white/5 p-3 rounded-xl w-full text-center font-orbitron text-[9px]">
            <div className="flex items-center justify-center gap-1 text-red-400 font-bold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>HP: {stats.hp}/{stats.maxHp}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-secondary font-bold">
              <Sword className="w-3.5 h-3.5" />
              <span>ATK: {stats.atk}</span>
            </div>
            <div>
              <p className="text-gray-500 font-bold">GOLD</p>
              <h4 className="text-xs font-black text-yellow-400 mt-0.5 font-mono">{stats.gold}g</h4>
            </div>
            <div>
              <p className="text-gray-500 font-bold">HERO</p>
              <h4 className="text-xs font-black text-white mt-0.5 font-mono">LVL {stats.lvl}</h4>
            </div>
          </div>

          {/* Weapons/Armor display */}
          <div className="grid grid-cols-2 gap-2 bg-cardbg border border-white/5 py-2 px-3 rounded-lg text-[9px] font-orbitron text-gray-400">
            <div>Weapon: <span className="text-white font-bold">{weapon}</span></div>
            <div>Armor: <span className="text-white font-bold">{armor}</span></div>
          </div>

          {combatEnemy ? (
            /* Combat Arena UI */
            <div className="glass-panel p-4 rounded-xl border border-red-500/20 space-y-4">
              <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-3xl animate-bounce">{combatEnemy.emoji}</span>
                  <div>
                    <h5 className="font-orbitron font-bold text-xs text-white">{combatEnemy.name}</h5>
                    <p className="text-[10px] text-gray-500">HP: {combatEnemy.hp}/{combatEnemy.maxHp}</p>
                  </div>
                </div>
                <div className="w-20 h-1.5 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(combatEnemy.hp / combatEnemy.maxHp) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action logs */}
              <div className="bg-black/50 border border-white/5 p-3 rounded-lg h-32 overflow-y-auto text-[10px] font-mono space-y-1 text-gray-400 select-text">
                {combatLogs.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>

              {/* Combat Action Triggers */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleCombatAction('attack')}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-orbitron font-bold text-[10px]"
                >
                  ⚔️ ATTACK
                </button>
                <button
                  onClick={() => handleCombatAction('special')}
                  className="bg-primary hover:bg-primary/80 text-white py-2 rounded font-orbitron font-bold text-[10px]"
                >
                  🔥 SPELL
                </button>
                <button
                  onClick={() => handleCombatAction('heal')}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 rounded font-orbitron font-bold text-[10px]"
                >
                  🧪 HEAL
                </button>
                <button
                  onClick={() => handleCombatAction('flee')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-gray-400 py-2 rounded font-orbitron font-bold text-[10px]"
                >
                  🏃 FLEE
                </button>
              </div>
            </div>
          ) : (
            /* Hub / Shop / Quests Tabs */
            <div className="space-y-4">
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => { setMenuTab('quest'); audioManager.play('click'); }}
                  className={`flex-1 py-2 font-orbitron font-bold text-xs uppercase ${menuTab === 'quest' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500'
                    }`}
                >
                  Active Quests
                </button>
                <button
                  onClick={() => { setMenuTab('shop'); audioManager.play('click'); }}
                  className={`flex-1 py-2 font-orbitron font-bold text-xs uppercase ${menuTab === 'shop' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500'
                    }`}
                >
                  Vendor Shop
                </button>
              </div>

              {menuTab === 'quest' ? (
                <div className="space-y-3">
                  {activeQuestIdx < QUESTS.length ? (
                    <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-3">
                      <div>
                        <h5 className="font-orbitron font-extrabold text-sm text-white">
                          {QUESTS[activeQuestIdx].name}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">{QUESTS[activeQuestIdx].desc}</p>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Reward Gold: <span className="text-yellow-500 font-bold">{QUESTS[activeQuestIdx].rewardGold}g</span></span>
                        <span>Exp gained: <span className="text-secondary font-bold">+{QUESTS[activeQuestIdx].exp} xp</span></span>
                      </div>
                      <button
                        onClick={startQuest}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-darkbg font-orbitron font-black text-xs py-2 rounded uppercase tracking-wider transition transform hover:scale-102"
                      >
                        Embark on Quest
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-green-400 font-bold">
                      🏆 ALL QUESTS COMPLETED! Campaign Won.
                    </div>
                  )}
                </div>
              ) : (
                /* SHOP */
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="glass-panel p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <h6 className="font-orbitron font-bold text-white">Mithril Dagger</h6>
                      <p className="text-[9px] text-gray-500">+10 Attack damage</p>
                    </div>
                    <button
                      onClick={() => buyItem('weapon', 60, 'Mithril Dagger', 10)}
                      disabled={stats.gold < 60 || weapon === 'Mithril Dagger'}
                      className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-35 text-darkbg px-3 py-1.5 rounded font-orbitron font-bold text-[10px]"
                    >
                      Buy (60g)
                    </button>
                  </div>

                  <div className="glass-panel p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <h6 className="font-orbitron font-bold text-white">Paladin Cuirass</h6>
                      <p className="text-[9px] text-gray-500">+35 Max HP points</p>
                    </div>
                    <button
                      onClick={() => buyItem('armor', 80, 'Paladin Cuirass', 35)}
                      disabled={stats.gold < 80 || armor === 'Paladin Cuirass'}
                      className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-35 text-darkbg px-3 py-1.5 rounded font-orbitron font-bold text-[10px]"
                    >
                      Buy (80g)
                    </button>
                  </div>
                </div>
              )}

              {/* Combat Logs show even outside combat */}
              {combatLogs.length > 0 && !combatEnemy && (
                <div className="bg-black/30 p-3 rounded-lg text-[9px] font-mono text-gray-400">
                  {combatLogs[combatLogs.length - 1]}
                </div>
              )}
            </div>
          )}

          {/* Reset selection */}
          <button
            onClick={() => selectHeroClass(heroClass)}
            className="w-full flex items-center justify-center gap-1.5 border border-white/10 hover:border-red-500/40 hover:text-red-400 rounded-lg py-2 text-xs font-orbitron font-bold transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset Hero Class
          </button>
        </div>
      )}
    </div>
  );
};
