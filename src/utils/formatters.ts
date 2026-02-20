// src/utils/formatters.ts
import { format, formatDistanceToNow } from 'date-fns';

export const formatTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return 'Unknown date';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  } catch {
    return 'Unknown date';
  }
};

export const extractPlayerName = (title: string): string | null => {
  const patterns = [
    /([A-Z][a-z]+ [A-Z][a-z]+) (injured|out|questionable)/,
    /([A-Z][a-z]+ [A-Z][a-z]+) (update|status)/,
    /Injury update:? ([A-Z][a-z]+ [A-Z][a-z]+)/,
    /([A-Z][a-z]+ [A-Z][a-z]+) (injury|status)/,
    /([A-Z][a-z]+ [A-Z][a-z]+) (sidelined|returns|probable)/
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export const extractTeam = (title: string): string | null => {
  const teams = [
    'Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Bucks', 'Suns', 'Nuggets',
    'Clippers', 'Mavericks', '76ers', 'Knicks', 'Kings', 'Pelicans', 'Thunder',
    'Chiefs', '49ers', 'Cowboys', 'Packers', 'Eagles', 'Ravens', 'Bills',
    'Yankees', 'Dodgers', 'Red Sox', 'Astros', 'Braves', 'Padres'
  ];
  
  for (const team of teams) {
    if (title.includes(team)) return team;
  }
  
  return null;
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return '#10b981';
  if (confidence >= 60) return '#f59e0b';
  return '#ef4444';
};

export const getSportEmoji = (sport: string): string => {
  const emojiMap: Record<string, string> = {
    'NBA': '🏀',
    'NFL': '🏈',
    'MLB': '⚾',
    'NHL': '🏒',
    'SOCCER': '⚽',
    'TENNIS': '🎾',
    'GOLF': '⛳'
  };
  
  return emojiMap[sport.toUpperCase()] || '📰';
};
