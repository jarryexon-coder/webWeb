// Platform-specific configurations
export const PLATFORM_CONFIGS = {
  kalshi: {
    name: 'Kalshi',
    color: '#6366F1',
    icon: 'stats-chart',
    baseUrl: 'https://kalshi.com/markets/'
  },
  prizepicks: {
    name: 'PrizePicks',
    color: '#FF4B4B',
    icon: 'trophy',
    baseUrl: 'https://prizepicks.com/projections/'
  },
  draftkings: {
    name: 'DraftKings',
    color: '#00B25D',
    icon: 'cash',
    baseUrl: 'https://draftkings.com/lobby/'
  },
  fanduel: {
    name: 'FanDuel',
    color: '#0E461E',
    icon: 'football',
    baseUrl: 'https://fanduel.com/games/'
  },
  betmgm: {
    name: 'BetMGM',
    color: '#FFC500',
    icon: 'dice',
    baseUrl: 'https://betmgm.com/sports/'
  },
  underdog: {
    name: 'Underdog',
    color: '#00A3FF',
    icon: 'paw',
    baseUrl: 'https://underdogfantasy.com/'
  },
  pointsbet: {
    name: 'PointsBet',
    color: '#E31B23',
    icon: 'point',
    baseUrl: 'https://pointsbet.com/sports/'
  },
  caesars: {
    name: 'Caesars',
    color: '#A67C4F',
    icon: 'crown',
    baseUrl: 'https://caesars.com/sportsbook/'
  },
  bet365: {
    name: 'Bet365',
    color: '#1E7A44',
    icon: 'leaf',
    baseUrl: 'https://bet365.com/sports/'
  }
};

export const SPORT_MAPPINGS = {
  nba: { name: 'NBA', icon: 'basketball', season: '2025-26' },
  nfl: { name: 'NFL', icon: 'football', season: '2026' },
  mlb: { name: 'MLB', icon: 'baseball', season: '2026' },
  nhl: { name: 'NHL', icon: 'snow', season: '2025-26' },
  worldcup: { name: 'World Cup 2026', icon: 'flag', season: '2026' },
  olympics: { name: 'Winter Olympics', icon: 'medal', season: '2026' }
};
