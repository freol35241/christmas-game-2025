// Game States
export const GAME_STATES = {
  INIT: 'INIT',
  INTRO: 'INTRO',
  MEMORY_INTRO: 'MEMORY_INTRO',
  MEMORY_PUZZLE: 'MEMORY_PUZZLE',
  MEMORY_PHYSICAL: 'MEMORY_PHYSICAL',
  MEMORY_RESOLUTION: 'MEMORY_RESOLUTION',
  ENDING: 'ENDING'
};

// Puzzle Layers
export const PUZZLE_LAYERS = {
  KIDS: 'KIDS',
  ADULTS: 'ADULTS',
  TOGETHER: 'TOGETHER'
};

// Puzzle Types
export const PUZZLE_TYPES = {
  DRAG_DROP: 'DRAG_DROP',
  CIPHER: 'CIPHER',
  LOCATION_SELECT: 'LOCATION_SELECT',
  TAP_TARGETS: 'TAP_TARGETS',
  SEQUENCE: 'SEQUENCE'
};

// Colors
export const COLORS = {
  // Night/Exterior
  deepBlue: '#1a1a2e',
  navy: '#16213e',
  white: '#ffffff',

  // Warm/Interior
  amber: '#ffb347',
  deepOrange: '#ff8c00',
  brown: '#8b4513',

  // Tomten/Seasonal
  tomteRed: '#8b0000',
  highlight: '#c41e3a',

  // UI/Feedback
  successGreen: '#4a7c4e',
  errorRed: '#8b3a3a',
  gold: '#ffd700',

  // Text
  textLight: '#f5f5f5',
  textDark: '#2d2d2d'
};
