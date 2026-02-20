// src/types/sports-wire.types.ts
export interface BeatWriter {
  name: string;
  twitter: string;
  outlet: string;
  national?: boolean;
}

export interface Injury {
  id: string;
  player: string;
  team: string;
  sport: string;
  position?: string;
  injury: string;
  status: 'out' | 'questionable' | 'doubtful' | 'day-to-day' | 'probable' | 'healthy';
  description: string;
  date: string;
  expected_return?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
  source: string;
  confidence: number;
}

export interface NewsArticle {
  id: string | number;
  title: string;
  description: string;
  content?: string;
  source: { name: string } | string;
  publishedAt: string;
  url?: string;
  urlToImage?: string;
  category: string;
  sport: string;
  confidence?: number;
  player?: string;
  team?: string;
  status?: string;
  injuryStatus?: string;
  expectedReturn?: string;
  author?: string;
  isBeatWriter?: boolean;
  gameInfo?: GameInfo;
}

export interface GameInfo {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  time: string;
  venue?: string;
}

export interface PlayerProp {
  id: string | number;
  playerName: string;
  team: string;
  sport: string;
  propType: string;
  line: string;
  odds: string;
  impliedProbability: number;
  matchup: string;
  time: string;
  confidence: number;
  isBookmarked: boolean;
  aiInsights?: string[];
  category: string;
  url?: string;
  image?: string;
  injuryStatus?: string;
  expectedReturn?: string;
  isBeatWriter?: boolean;
  author?: string;
  gameInfo?: GameInfo;
  originalArticle: NewsArticle;
}

export interface InjuryDashboard {
  total_injuries: number;
  status_breakdown: Record<string, number>;
  team_breakdown: Record<string, number>;
  injury_type_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  top_injured_teams: [string, number][];
  injuries: Injury[];
}

export interface SearchResult {
  type: 'beat_writer' | 'player' | 'injury' | 'team';
  team?: string;
  name?: string;
  player?: string;
  outlet?: string;
  twitter?: string;
  status?: string;
  injury?: string;
  sport?: string;
}
