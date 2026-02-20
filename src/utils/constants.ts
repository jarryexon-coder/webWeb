// src/utils/constants.ts
export const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
} as const;

export const CATEGORY_COLORS = {
  'injury': '#ef4444',
  'injuries': '#ef4444',
  'performance': '#10b981',
  'trades': '#f59e0b',
  'value': '#8b5cf6',
  'preview': '#3b82f6',
  'beat-writers': '#8b5cf6',
  'beatwriter': '#8b5cf6',
  'team-news': '#3b82f6',
  'game-preview': '#f59e0b',
  'recap': '#6b7280',
  'interview': '#ec4899',
  'analysis': '#14b8a6',
  'news': '#6b7280'
} as const;

export const INJURY_STATUS_COLORS = {
  'out': '#ef4444',
  'questionable': '#f59e0b',
  'doubtful': '#f97316',
  'day-to-day': '#3b82f6',
  'probable': '#10b981',
  'healthy': '#6b7280'
} as const;

export const INJURY_STATUS_LABELS = {
  'out': '❌ OUT',
  'questionable': '⚠️ QUESTIONABLE',
  'doubtful': '⚠️ DOUBTFUL',
  'day-to-day': '📅 DAY-TO-DAY',
  'probable': '✅ PROBABLE',
  'healthy': '💪 HEALTHY'
} as const;

export const SPORTS = [
  { id: 'nba', label: 'NBA', icon: '🏀', color: '#ef4444' },
  { id: 'nfl', label: 'NFL', icon: '🏈', color: '#3b82f6' },
  { id: 'mlb', label: 'MLB', icon: '⚾', color: '#10b981' },
  { id: 'nhl', label: 'NHL', icon: '🏒', color: '#1e40af' }
] as const;

export const CATEGORIES = [
  { id: 'all', label: 'All Sports', icon: '🔥' },
  { id: 'beat-writers', label: 'Beat Writers', icon: '✍️', color: '#8b5cf6' },
  { id: 'injuries', label: 'Injuries', icon: '🏥', color: '#ef4444' },
  { id: 'value', label: 'High Value', icon: '📈', color: '#10b981' }
] as const;

export const NATIONAL_INSIDERS = [
  'Shams Charania',
  'Adrian Wojnarowski',
  'Chris Haynes',
  'Marc Stein',
  'Brian Windhorst',
  'Zach Lowe',
  'Adam Schefter',
  'Ian Rapoport'
] as const;
