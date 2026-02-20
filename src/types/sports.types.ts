// Sport-specific types and enums
export type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'worldcup' | 'olympics' | 'ucl';
export type ParlayType = 'same_game' | 'multi_sport' | 'spread' | 'over_under' | 'player_props' | 'tournament';
export type Platform = 'kalshi' | 'prizepicks' | 'draftkings' | 'fanduel' | 'betmgm' | 'underdog' | 'pointsbet' | 'caesars' | 'bet365';

export interface SportConfig {
  id: Sport;
  name: string;
  icon: string;
  markets: string[];
  platforms: Platform[];
}

export interface Player {
  id: string;
  name: string;
  team: string;
  sport: Sport;
  position?: string;
  stats?: PlayerStats;
}

export interface PlayerStats {
  pointsPerGame?: number;
  reboundsPerGame?: number;
  assistsPerGame?: number;
  goalsPerGame?: number;
  battingAverage?: number;
  homeRuns?: number;
}
