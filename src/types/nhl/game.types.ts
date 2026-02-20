// NHL Game Types - February 2026
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
  note: string;
  division: string;
  sport: 'NHL';
  season: '2025-26';
  game_type: 'Regular Season' | '4 Nations Face-Off';
  tournament?: boolean;
  
  odds: NHLOdds;
  player_props?: NHLPlayerProp[];
  fantasy_projections?: FantasyProjection[];
  parlay_recommendations?: NHLParlayRecommendation[];
  
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  consensus_pick?: ConsensusPick;
  sharp_money?: number;
  
  team_stats: TeamStats;
  status: GameStatus;
  trade_deadline_impact: boolean;
  playoff_implications: boolean;
}

export interface NHLOdds {
  moneyline: MoneylineOdds;
  spread: SpreadOdds;
  total: TotalOdds;
  alternative_spreads?: AlternativeSpread[];
  team_totals?: TeamTotals;
  period_odds?: PeriodOdds;
}

export type ConfidenceLevel = 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
export type GameStatus = 'Scheduled' | 'Live' | 'Final' | 'Upcoming';
