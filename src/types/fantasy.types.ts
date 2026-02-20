// February 2026 Fantasy Sports Types

export type Sport = 'nba' | 'nhl' | 'nfl' | 'mlb';

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  fantasy_projection: number;
  fantasy_points?: number;
  value?: string | number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  injury_status?: 'Healthy' | 'Questionable' | 'Out' | 'Probable';
  is_rookie_2025?: boolean;
  season?: string;
}

export interface NHLPlayer extends Player {
  goals?: number;
  assists?: number;
  shots?: number;
  points_line?: number;
  assists_line?: number;
  goals_line?: number;
  shots_line?: number;
  streak?: string;
}

export interface NBAPlayer extends Player {
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fantasy_avg: number;
  mvp_odds?: string;
  roy_odds?: string;
  dpoy_odds?: string;
}

export interface PlayerProp {
  player: string;
  team: string;
  position: string;
  stat: string;
  line: number;
  projection: number;
  confidence: number;
  analysis: string;
  value: string;
  edge_percentage: number;
  sport: string;
  matchup?: string;
  tip?: string;
  salary?: number;
  fantasy_projection?: number;
}

export interface NHLProp extends PlayerProp {
  game: string;
  time: string;
  over_odds: string;
  under_odds: string;
  props: NHLPropLine[];
}

export interface NHLPropLine {
  stat: string;
  line: number;
  over_odds: string;
  under_odds: string;
  projection: number;
  value: string;
}

export interface ParlayLeg {
  id: string;
  player?: string;
  game_id?: string;
  description?: string;
  stat?: string;
  line?: number;
  prediction?: string;
  odds: string;
  confidence: number;
  sport: string;
  market?: string;
  teams?: {
    home: string;
    away: string;
  };
  confidence_level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
}

export interface TennisPlayer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  atp_rank?: number;
  wta_rank?: number;
  points: number;
  age: number;
  turned_pro: number;
  height_cm?: number;
  hand: 'left' | 'right' | 'ambidextrous';
  tour: 'ATP' | 'WTA';
  is_prospect?: boolean;
}

export interface TennisTournament {
  id: string;
  name: string;
  location: string;
  country: string;
  surface: string;
  category: string;
  start_date: string;
  end_date: string;
  prize_money_usd: number;
  draw_size: number;
  defending_champion?: string;
}

export interface TennisMatch {
  id: string;
  tournament: string;
  round: string;
  player1: { name: string; seed?: number; rank?: number };
  player2: { name: string; seed?: number; rank?: number };
  score?: string;
  status: string;
  date: string;
  court?: string;
  surface: string;
  best_of: number;
  winner?: number;
}

export interface GolfPlayer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  world_ranking: number;
  points_avg: number;
  events_played: number;
  wins: number;
  top10s: number;
  earnings_usd: number;
  age: number;
  turned_pro: number;
}

export interface GolfTournament {
  id: string;
  name: string;
  location: string;
  course: string;
  country: string;
  start_date: string;
  end_date: string;
  purse_usd: number;
  format: string;
  tour: string;
  status: string;
  defending_champion?: string;
  winner?: string;
  winner_score?: string;
}

export interface LeaderboardEntry {
  id: string;
  position: number | string;
  player_name: string;
  country_code: string;
  to_par: number;
  round_1?: number;
  round_2?: number;
  round_3?: number;
  round_4?: number;
  total: number;
  status?: string;
  today?: number;
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  analysis: string;
  risk_level: number;
  expected_value: string;
  timestamp: string;
  isGenerated: boolean;
  isToday: boolean;
  ai_metrics: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
  };
}

export interface LineupSlot {
  position: string;
  player: Player | null;
}

export interface FantasyLineup {
  id?: string;
  sport: Sport;
  slots: LineupSlot[];
  total_salary: number;
  total_projection: number;
  remaining_cap: number;
  created_at: string;
  updated_at: string;
}

export interface AllStar2026 {
  event: string;
  date: string;
  location: string;
  host_team: string;
  starters: {
    east: {
      guards: string[];
      frontcourt: string[];
    };
    west: {
      guards: string[];
      frontcourt: string[];
    };
  };
  rising_stars: {
    team_flagg: string[];
    team_wemby: string[];
  };
  three_point_contest: string[];
  slam_dunk_contest: string[];
  skills_challenge: string[];
  timeline: Record<string, string>;
}

export interface SeasonStatus2026 {
  season: string;
  date: string;
  week: string;
  all_star_game: string;
  trade_deadline: string;
  games_remaining: string;
  playoff_picture: string;
  current_leaders: Record<string, string>;
  mvp_race: Array<{ player: string; team: string; odds: string }>;
  rookie_of_year_race: Array<{ player: string; team: string; stats: string }>;
  defending_champion: string;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  sport: string;
  category: string;
  timestamp: string;
  image_url?: string;
  priority: number;
}

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  timestamp: string;
  [key: string]: any;
}
