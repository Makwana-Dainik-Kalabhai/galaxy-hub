import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { audioManager } from '../utils/audioManager';

interface MemoryCardProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOLS = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍍', '🥥', '🥝', '🥑', '🍆', '🥕', '🌶️', '🌽', '🍠', '🍯', '🍰', '🍔', '🍕'];

export const MemoryCard: React.FC<MemoryCardProps> = ({ onGameOver, isPaused }) => {
  const [gridSize, setGridSize] = useState<16 | 36>(16);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const initGame = (size: 16 | 36) => {
    const pairCount = size / 2;
    const selectedSymbols = SYMBOLS.slice(0, pairCount);
    const doubledSymbols = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle doubled symbols
    for (let i = doubledSymbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubledSymbols[i], doubledSymbols[j]] = [doubledSymbols[j], doubledSymbols[i]];
    }

    const initialCards: Card[] = doubledSymbols.map((symbol, idx) => ({
      id: idx,
      symbol,
      isFlipped: false,
      isMatched: false
    }));

    setCards(initialCards);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setIsChecking(false);
  };

  useEffect(() => {
    initGame(gridSize);
  }, [gridSize]);

  const handleCardClick = (id: number) => {
    if (isPaused || isChecking || selectedCards.includes(id)) return;

    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isMatched || clickedCard.isFlipped) return;

    audioManager.play('click');
    const updatedCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);
      
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = clickedCard;

      if (firstCard.symbol === secondCard.symbol) {
        // MATCH FOUND
        setTimeout(() => {
          audioManager.play('score');
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isMatched: true, isFlipped: true } 
              : c
          ));
          setMatches(prev => {
            const nextMatches = prev + 1;
            const targetMatches = gridSize / 2;
            if (nextMatches === targetMatches) {
              audioManager.play('win');
              // Submit score: higher score for fewer moves
              const score = Math.max(10, Math.floor((targetMatches * 200) - (moves * 10)));
              onGameOver(score);
            }
            return nextMatches;
          });
          setSelectedCards([]);
          setIsChecking(false);
        }, 600);
      } else {
        // NO MATCH
        setTimeout(() => {
          audioManager.play('click');
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 max-w-xl mx-auto">
      {/* Configuration Header */}
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl font-orbitron">
        <div className="flex gap-2">
          <button
            onClick={() => { setGridSize(16); audioManager.play('click'); }}
            className={`px-3 py-1.5 rounded text-xs font-bold ${
              gridSize === 16 ? 'bg-gradient-to-r from-primary to-secondary text-darkbg' : 'text-gray-400 border border-white/5'
            }`}
          >
            4x4 Grid
          </button>
          <button
            onClick={() => { setGridSize(36); audioManager.play('click'); }}
            className={`px-3 py-1.5 rounded text-xs font-bold ${
              gridSize === 36 ? 'bg-gradient-to-r from-primary to-secondary text-darkbg' : 'text-gray-400 border border-white/5'
            }`}
          >
            6x6 Grid
          </button>
        </div>

        <div className="flex gap-6 text-xs text-gray-400 font-bold uppercase tracking-wider">
          <div>Moves: <span className="text-white font-mono">{moves}</span></div>
          <div>Matches: <span className="text-secondary font-mono">{matches} / {gridSize / 2}</span></div>
        </div>
      </div>

      {/* Grid container */}
      <div className={`grid gap-2 w-full max-w-md ${
        gridSize === 16 ? 'grid-cols-4 aspect-square' : 'grid-cols-6 aspect-square'
      }`}>
        {cards.map(card => {
          const showSymbol = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`rounded-lg border text-3xl flex items-center justify-center transition-all duration-300 relative transform ${
                showSymbol 
                  ? 'bg-cardbg border-secondary rotate-y-180 scale-102 shadow-[0_0_10px_rgba(0,212,255,0.1)]' 
                  : 'bg-gradient-to-br from-primary/10 to-cardbg border-white/5 hover:border-primary/50'
              } ${card.isMatched ? 'opacity-40 pointer-events-none' : ''}`}
              style={{ minHeight: gridSize === 16 ? '80px' : '55px' }}
            >
              {showSymbol ? (
                <span>{card.symbol}</span>
              ) : (
                <span className="text-lg font-orbitron font-black text-primary/30">?</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Control buttons */}
      <button
        onClick={() => { initGame(gridSize); audioManager.play('click'); }}
        className="flex items-center gap-2 border border-white/10 hover:border-secondary hover:text-secondary rounded-lg px-4 py-2 text-xs font-orbitron font-bold transition"
      >
        <RotateCcw className="w-4 h-4" /> Restart Match
      </button>
    </div>
  );
};
