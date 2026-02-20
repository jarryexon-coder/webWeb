export type ConfidenceLevel = 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
export type Sport = 'NBA' | 'NHL' | 'NFL' | 'MLB' | 'Mixed' | 'UFC' | 'SOCCER';
export type MarketType = 'h2h' | 'spreads' | 'totals' | 'mixed' | 'player_props';

export interface ParlayLeg {
  id: string;
  game_id?: string;
  player?: string;
  description?: string;
  odds: string;
  confidence: number;
  sport: string;
  market?: string;
  stat?: string;
  line?: number;
  prediction?: string;
  teams?: {
    home: string;
    away: string;
  };
  confidence_level: ConfidenceLevel;
  team?: string;
  position?: string;
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: ConfidenceLevel;
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
    correlation_score?: number;
    hedge_recommendation?: string;
  };
}

export interface ParlayStrategy {
  name: string;
  market_type: MarketType;
  num_legs: number;
  target_confidence: number;
  description: string;
  sport_specific?: string[];
}

export interface ParlayOdds {
  american: string;
  decimal: number;
  implied_probability: number;
  payout_per_10: number;
}

export interface ParlayHistory {
  id: string;
  date: string;
  legs: ParlayLeg[];
  total_odds: string;
  stake: number;
  payout?: number;
  result?: 'win' | 'loss' | 'pending';
  actual_return?: number;
}

export interface ParlayAnalytics {
  success_rate: number;
  average_odds: string;
  roi: number;
  total_staked: number;
  total_returned: number;
  profit_loss: number;
  legs_success_rate: Record<number, number>;
}
