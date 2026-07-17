export interface GameMetadata {
  id: string;
  title: string;
  emoji: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Classic' | 'Puzzle' | 'Action' | 'Strategy' | 'Rhythm';
  players: 'Single' | 'Local PvP';
  rating: number;
  playCount: number;
  description: string;
  instructions: string[];
}

export const GAMES: GameMetadata[] = [
  // Easy
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    emoji: '❌',
    difficulty: 'Easy',
    category: 'Classic',
    players: 'Local PvP',
    rating: 4.5,
    playCount: 4200,
    description: 'The standard classic 3x3 grid. Play against a smart AI or a friend next to you!',
    instructions: ['Take turns placing X and O on the grid.', 'Line up three matching symbols horizontally, vertically, or diagonally to win.', 'Enable AI Opponent to play against the computer.']
  },
  {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    emoji: '✊',
    difficulty: 'Easy',
    category: 'Classic',
    players: 'Single',
    rating: 4.2,
    playCount: 3100,
    description: 'Test your luck and build a win streak against the computer in this simple game of choices.',
    instructions: ['Select Rock, Paper, or Scissors.', 'Rock beats Scissors, Scissors beats Paper, Paper beats Rock.', 'Try to build the longest win streak possible!']
  },
  {
    id: 'memory-card',
    title: 'Memory Card',
    emoji: '🧠',
    difficulty: 'Easy',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.6,
    playCount: 2800,
    description: 'Flip cards and find matching pairs. Test your visual memory under multiple grid sizes.',
    instructions: ['Choose grid size (4x4 or 6x6).', 'Click to flip cards and find identical matching pairs.', 'Match all cards in the fewest moves possible to score higher.']
  },
  {
    id: 'whack-a-mole',
    title: 'Whack-a-Mole',
    emoji: '🔨',
    difficulty: 'Easy',
    category: 'Action',
    players: 'Single',
    rating: 4.4,
    playCount: 3500,
    description: 'Moles are popping out of their holes! Hit them as fast as you can. Speed escalates over time.',
    instructions: ['Click on moles as soon as they emerge from the holes.', 'Avoid clicking on empty holes.', 'Watch out! The speed increases as your score goes up.']
  },
  {
    id: 'hangman',
    title: 'Hangman',
    emoji: '🪓',
    difficulty: 'Easy',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.3,
    playCount: 1900,
    description: 'Guess the hidden word letter by letter. Choose from categories like Animals, Countries, and Tech.',
    instructions: ['Pick a word category.', 'Click on the virtual keyboard to guess letters.', 'Guess the word before the gallows sketch is completed (max 6 wrong guesses).']
  },
  // Medium
  {
    id: 'snake',
    title: 'Snake',
    emoji: '🐍',
    difficulty: 'Medium',
    category: 'Action',
    players: 'Single',
    rating: 4.8,
    playCount: 8900,
    description: 'Guide the hungry snake to eat food and grow. Avoid crashing into walls or your own tail!',
    instructions: ['Use WASD or Arrow Keys to steer the snake.', 'Eat red apples to grow and increase your score.', 'Enable "Wall Wrapping" to pass through edges, or disable it for classic boundaries.']
  },
  {
    id: 'pong',
    title: 'Pong',
    emoji: '🏓',
    difficulty: 'Medium',
    category: 'Classic',
    players: 'Single',
    rating: 4.5,
    playCount: 4500,
    description: 'The arcade classic that started it all. Bounce the ball past the computer paddle.',
    instructions: ['Control your paddle with Up/Down Arrows (or W/S).', 'Deflect the ball past the opponent paddle to score points.', 'Adjust the AI difficulty slider for a tighter challenge. First to 5 wins.']
  },
  {
    id: 'tetris',
    title: 'Tetris',
    emoji: '🧱',
    difficulty: 'Medium',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.9,
    playCount: 12500,
    description: 'Fit falling blocks together to clear horizontal lines. Features hold piece and next-piece previews.',
    instructions: ['Left/Right Arrows to move, Up Arrow to rotate piece.', 'Down Arrow for soft drop, Spacebar for hard drop.', 'Press "C" or "Shift" to hold a piece. Clear lines to score points and level up.']
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    emoji: '👾',
    difficulty: 'Medium',
    category: 'Action',
    players: 'Single',
    rating: 4.7,
    playCount: 6300,
    description: 'Defend Earth from descending alien swarms. Shoot them down and hide behind barricades.',
    instructions: ['Move left/right with Arrow Keys (or A/D).', 'Press Spacebar to shoot lasers.', 'Destroy all aliens before they reach the bottom of the screen. Hide behind green bunkers.']
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    emoji: '🔢',
    difficulty: 'Medium',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.6,
    playCount: 3900,
    description: 'Fill the 9x9 grid so that every row, column, and 3x3 subgrid contains digits 1-9.',
    instructions: ['Click a cell and type a digit (1-9).', 'Use "Pencil Mode" to write draft notes in cells.', 'Click "Hint" if you get stuck, or click "Check" to see current mistakes.']
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    emoji: '🐦',
    difficulty: 'Medium',
    category: 'Action',
    players: 'Single',
    rating: 4.4,
    playCount: 7200,
    description: 'Flap through narrow green pipes. One crash and it is game over in this addictive endless test.',
    instructions: ['Press Spacebar or Click the game screen to flap upwards.', 'Navigate safely between the gaps in the moving green pipes.', 'Pipes speed up and gap placements change as you score more points.']
  },
  {
    id: 'wordle',
    title: 'Wordle',
    emoji: '📝',
    difficulty: 'Medium',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.7,
    playCount: 5400,
    description: 'Guess the hidden 5-letter word in 6 attempts. Colored tiles provide clues after each guess.',
    instructions: ['Type a 5-letter word and press Enter.', 'GREEN tiles: Letter is correct and in the right spot.', 'YELLOW tiles: Letter is in the word but in a different spot.', 'GRAY tiles: Letter is not in the word at all.']
  },
  {
    id: 'breakout',
    title: 'Breakout',
    emoji: '🥎',
    difficulty: 'Medium',
    category: 'Action',
    players: 'Single',
    rating: 4.6,
    playCount: 5100,
    description: 'Bounce the ball using your paddle to smash rows of colorful bricks. Collect falling power-ups.',
    instructions: ['Move paddle using Arrow Keys or Mouse cursor.', 'Bounce the ball to break all bricks on the screen.', 'Collect falling capsules to expand your paddle, gain extra lives, or trigger multi-ball.']
  },
  // Hard
  {
    id: 'chess',
    title: 'Chess',
    emoji: '👑',
    difficulty: 'Hard',
    category: 'Strategy',
    players: 'Single',
    rating: 4.8,
    playCount: 9600,
    description: 'Play the royal game of strategy against a smart computer opponent. Move log and legal highlights included.',
    instructions: ['Click a piece to highlight all legal moves.', 'Click a highlighted square to move your piece.', 'Checkmate the AI king to win. Review your move history on the side panel.']
  },
  {
    id: 'platformer',
    title: 'Platformer',
    emoji: '🏃',
    difficulty: 'Hard',
    category: 'Action',
    players: 'Single',
    rating: 4.7,
    playCount: 4800,
    description: 'Jump across moving platforms, collect gold coins, avoid spiked pits, and reach the checkpoint flags.',
    instructions: ['Use Left/Right Arrow keys to run, Spacebar/Up to jump.', 'Collect yellow coins to boost your score.', 'Avoid red spikes. Reach the golden flags to trigger level checkposts.']
  },
  {
    id: '2048',
    title: '2048',
    emoji: '➕',
    difficulty: 'Hard',
    category: 'Puzzle',
    players: 'Single',
    rating: 4.8,
    playCount: 11000,
    description: 'Slide matching tiles to double them. Can you merge your way up to the legendary 2048 tile?',
    instructions: ['Swipe or use Arrow Keys to slide all tiles on the board.', 'Tiles with identical numbers merge together when they collide.', 'Use the "Undo" button to reverse your last move, or click "AI Suggestion" for tips.']
  },
  {
    id: 'battleship',
    title: 'Battleship',
    emoji: '🚢',
    difficulty: 'Hard',
    category: 'Strategy',
    players: 'Single',
    rating: 4.6,
    playCount: 3700,
    description: 'Place your fleet, then take turns firing coordinates at the enemy grid to sink their hidden ships.',
    instructions: ['Click ships and select "Rotate" to place them on your grid, then click Start.', 'Take turns clicking on the enemy board to launch torpedoes.', 'The AI will hunt intelligently when it scores a hit! First to sink all 5 ships wins.']
  },
  {
    id: 'roguelike',
    title: 'Roguelike',
    emoji: '⚔️',
    difficulty: 'Hard',
    category: 'Strategy',
    players: 'Single',
    rating: 4.7,
    playCount: 4100,
    description: 'Explore a procedurally generated dungeon. Fight monsters, loot treasure, and find the stairs.',
    instructions: ['Use Arrow Keys or WASD to walk around the dungeon.', 'Walk into monsters to attack them.', 'Collect hearts to heal, swords to increase power, and find the yellow staircase to descend deeper.']
  },
  {
    id: 'rpg',
    title: 'RPG Adventure',
    emoji: '🛡️',
    difficulty: 'Hard',
    category: 'Strategy',
    players: 'Single',
    rating: 4.8,
    playCount: 5200,
    description: 'Fight turn-based battles against scaling beasts. Level up, pick skills, buy gear, and clear quests.',
    instructions: ['Choose your hero class (Warrior, Mage, Rogue).', 'Engage in turn-based combat: select Attack, Special Spell, Heal, or Flee.', 'Defeat enemies to earn gold and EXP. Upgrade your gear in the Shop to complete quests.']
  },
  {
    id: 'rhythm',
    title: 'Rhythm Hero',
    emoji: '🎵',
    difficulty: 'Hard',
    category: 'Rhythm',
    players: 'Single',
    rating: 4.6,
    playCount: 3300,
    description: 'Press the keyboard keys to match descending musical notes. Achieve perfect timing for combos.',
    instructions: ['Press keys D, F, J, or K as the colored notes align with the targets at the bottom.', 'Hitting directly on the target gives "Perfect", slightly off gives "Good", missing gives "Miss".', 'Maintain a combo for score multiplier bonuses!']
  }
];
