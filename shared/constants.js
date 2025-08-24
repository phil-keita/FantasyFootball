/**
 * Shared constants and types between frontend and backend
 */

// API Base URLs
export const API_CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  SLEEPER_API_URL: 'https://api.sleeper.app/v1'
};

// NFL Positions
export const POSITIONS = {
  QB: 'QB',
  RB: 'RB', 
  WR: 'WR',
  TE: 'TE',
  K: 'K',
  DEF: 'DEF'
};

// Fantasy Scoring Formats
export const SCORING_FORMATS = {
  STANDARD: 'standard',
  PPR: 'ppr',
  HALF_PPR: 'half_ppr',
  TWO_QB: '2qb',
  SUPERFLEX: '2qb' // alias
};

// NFL Teams
export const NFL_TEAMS = {
  ARI: 'Arizona Cardinals',
  ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',
  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',
  DET: 'Detroit Lions',
  GB: 'Green Bay Packers',
  HOU: 'Houston Texans',
  IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  LV: 'Las Vegas Raiders',
  LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams',
  MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',
  NE: 'New England Patriots',
  NO: 'New Orleans Saints',
  NYG: 'New York Giants',
  NYJ: 'New York Jets',
  PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers',
  SF: 'San Francisco 49ers',
  SEA: 'Seattle Seahawks',
  TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders'
};

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
};

// Draft Strategy Types
export const STRATEGY_TYPES = {
  EARLY_ROUNDS: 'earlyRounds',
  MIDDLE_ROUNDS: 'middleRounds', 
  LATE_ROUNDS: 'lateRounds',
  SLEEPERS: 'sleepers'
};

// Season Types
export const SEASON_TYPES = {
  REGULAR: 'regular',
  POSTSEASON: 'postseason',
  PRESEASON: 'preseason'
};

// Default League Settings
export const DEFAULT_LEAGUE = {
  SIZE: 12,
  FORMAT: SCORING_FORMATS.PPR,
  ROSTER_POSITIONS: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1,
    K: 1,
    DEF: 1,
    BENCH: 6
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Health & Status
  HEALTH: '/api/health',
  DATA_STATUS: '/api/data/status',
  
  // Players
  PLAYERS: '/api/players',
  PLAYER_BY_ID: '/api/players/:id',
  PLAYER_SEARCH: '/api/players/search/:query',
  TOP_PLAYERS: '/api/players/position/:position/top',
  
  // Statistics
  SEASON_STATS: '/api/stats/season/:season',
  PLAYER_STATS: '/api/stats/player/:playerId',
  
  // Data Management
  FETCH_DATA: '/api/data/fetch',
  QUICK_FETCH: '/api/data/fetch/quick',
  
  // Analysis
  DRAFT_STRATEGY: '/api/analysis/draft-strategy',
  TRENDING: '/api/analysis/trending'
};

// Color Themes (for frontend)
export const COLORS = {
  PRIMARY: '#1a365d',
  SECONDARY: '#2d3748',
  SUCCESS: '#38a169',
  WARNING: '#d69e2e',
  ERROR: '#e53e3e',
  INFO: '#3182ce',
  LIGHT: '#f7fafc',
  DARK: '#1a202c'
};

// Position Colors
export const POSITION_COLORS = {
  QB: '#e53e3e', // Red
  RB: '#38a169', // Green
  WR: '#3182ce', // Blue
  TE: '#d69e2e', // Yellow
  K: '#805ad5',  // Purple
  DEF: '#2d3748' // Gray
};
