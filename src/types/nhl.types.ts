export interface NHLTeam {
  id: string;
  abbreviation: string;
  name: string;
  division: string;
  arena: string;
  logo?: string;
}

export interface NHLGameOdds {
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: number;
    home_odds: number;
    away: number;
    away_odds: number;
  };
  total: {
    line: number;
    over: number;
    under: number;
  };
}

export interface NHLPropLine {
  stat: string;
  line: number;
  over_odds: string;
  under_odds: string;
  projection: number;
  value: string;
}

export interface NHLPlayerProp {
  player: string;
  team: string;
  position: string;
  game?: string;
  time?: string;
  confidence: number;
  analysis: string;
  props: NHLPropLine[];
}

export interface NHLGame {
  id: string;
  home_team: string;
  home_full: string;
  away_team: string;
  away_full: string;
  date: string;
  time: string;
  venue: string;
  tv: string;
  note?: string;
  division: string;
  sport: string;
  season: string;
  odds: NHLGameOdds;
  confidence_score: number;
  confidence_level?: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  status: string;
  period: string;
  home_score?: number;
  away_score?: number;
  player_props?: NHLPlayerProp[];
  is_real_data: boolean;
  trade_deadline_impact?: boolean;
}

export interface NHLPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  number?: number;
  age?: number;
  games_played?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plus_minus?: number;
  penalty_minutes?: number;
  power_play_goals?: number;
  shorthanded_goals?: number;
  game_winning_goals?: number;
  shots?: number;
  shooting_percentage?: number;
  faceoff_percentage?: number;
  time_on_ice_avg?: number;
  fantasy_points?: number;
  salary?: number;
  injury_status?: 'Healthy' | 'Questionable' | 'Out' | 'IR' | 'Day-to-Day';
  streak?: string;
  last_10_avg?: number;
}

export interface NHLLeagueLeaders {
  points: { player: string; team: string; value: number };
  goals: { player: string; team: string; value: number };
  assists: { player: string; team: string; value: number };
  wins: { player: string; team: string; value: number };
  savePercentage: { player: string; team: string; value: number };
}
