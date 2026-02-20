// src/types/betting.types.ts

/**
 * Core betting insight interfaces
 */

export type InsightCategory = 
  | 'expert_prediction'
  | 'trend'
  | 'player_trend'
  | 'value_bet'
  | 'advanced_analytics'
  | 'insider_tip'
  | 'public_betting'
  | 'historical_trend'
  | 'injury_update'
  | 'weather_impact'
  | 'sharp_money'
  | 'reverse_line_movement';

export type BetType = 
  | 'moneyline'
  | 'spread'
  | 'over_under'
  | 'prop'
  | 'parlay'
  | 'teaser'
  | 'round_robin'
  | 'futures'
  | 'live_betting';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export type MarketCategory = 'player' | 'team' | 'game';

/**
 * Sport interfaces
 */

export interface Sport {
  id: string;
  name: string;
  icon: string;
  leagues: string[];
  active?: boolean;
  popular?: boolean;
  regions?: string[];
}

export interface League {
  id: string;
  name: string;
  sportId: string;
  country?: string;
  logo?: string;
}

/**
 * Bookmaker interfaces
 */

export interface Bookmaker {
  id: string;
  name: string;
  logo: string;
  rating: number;
  bonus?: string;
  features?: string[];
  isActive?: boolean;
}

/**
 * Market interfaces
 */

export interface Market {
  id: string;
  name: string;
  category: MarketCategory;
  sport: string;
  league?: string;
  isMain?: boolean;
  sortOrder?: number;
  group?: string;
}

export interface MarketOutcome {
  id: string;
  name: string;
  odds: number; // American odds
  decimal_odds?: number;
  implied_probability?: number;
  point?: number; // For spreads/totals
  is_main?: boolean;
  is_live?: boolean;
  volume?: number;
  last_updated: string;
}

export interface MarketWithOutcomes extends Market {
  outcomes: MarketOutcome[];
  event_id: string;
  event_name?: string;
  event_start_time?: string;
  last_updated: string;
  book?: string;
  is_live?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Betting line interfaces
 */

export interface BettingLine {
  bookmaker: Bookmaker;
  market: string;
  marketId?: string;
  line: number;
  odds: number;
  decimalOdds?: number;
  impliedProbability?: number;
  lastUpdated: string;
  isLive?: boolean;
  isMain?: boolean;
  volume?: number;
  movement?: number; // Odds change in last 24h
}

export interface LineMovement {
  timestamp: string;
  odds: number;
  line?: number;
  volume?: number;
}

export interface BettingLineWithHistory extends BettingLine {
  history: LineMovement[];
}

/**
 * Betting insight interfaces
 */

export interface BettingInsight {
  id: string;
  text: string;
  source: string;
  category: InsightCategory;
  confidence: number; // 0-100
  confidence_level?: ConfidenceLevel;
  tags?: string[];
  market_alignment?: number; // -100 to 100, positive = aligns with market
  is_live?: boolean;
  is_contested?: boolean; // Whether there's disagreement among sources
  scraped_at: string;
  market_context?: string;
  sport?: string;
  league?: string;
  event_id?: string;
  event_name?: string;
  event_start_time?: string;
  suggested_bet?: SuggestedBet;
  related_players?: string[];
  related_teams?: string[];
  metadata?: Record<string, any>;
}

export interface SuggestedBet {
  type: BetType;
  outcome: string;
  odds: number; // American odds
  decimal_odds?: number;
  implied_probability?: number;
  edge?: number; // Positive = value
  unit_recommendation?: number; // 1-5 units
  book?: string;
  bookmaker?: Bookmaker;
  market?: string;
  marketId?: string;
  point?: number; // For spreads/totals
}

export interface AggregatedInsights {
  consensus_topic: string;
  avg_confidence: number;
  weighted_confidence?: number;
  total_insights: number;
  unique_sources: number;
  source_distribution?: Record<string, number>;
  category_distribution?: Record<InsightCategory, number>;
  sentiment_score?: number; // -1 to 1
  controversy_score?: number; // 0-100, higher = more disagreement
  sport: string;
  league?: string;
  last_updated: string;
  recommended_bet_type?: BetType;
  recommended_bet?: SuggestedBet;
  key_takeaways?: string[];
}

/**
 * Parlay interfaces
 */

export interface ParlayLeg {
  eventId: string;
  eventName?: string;
  eventStartTime?: string;
  marketId: string;
  marketName?: string;
  marketCategory?: MarketCategory;
  outcomeId: string;
  outcomeName: string;
  odds: number;
  decimalOdds?: number;
  impliedProbability?: number;
  isLive?: boolean;
  sport?: string;
  sportId?: string;
  league?: string;
  leagueId?: string;
  startTime?: string;
  bookmaker?: Bookmaker;
  bookmakerId?: string;
  line?: number;
  metadata?: Record<string, any>;
}

export interface Parlay {
  id?: string;
  legs: ParlayLeg[];
  combinedOdds: number;
  decimalOdds?: number;
  impliedProbability?: number;
  stake?: number;
  potentialPayout?: number;
  correlationFactor?: number;
  isValid?: boolean;
  validationErrors?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  tags?: string[];
  sport?: string;
  legCount: number;
}

export interface ParlayTemplate {
  id: string;
  name: string;
  legs: ParlayLeg[];
  sport: string;
  sportId?: string;
  league?: string;
  createdAt: string;
  updatedAt?: string;
  winRate: number; // Historical win rate percentage
  usageCount?: number;
  combinedOdds?: number;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
}

/**
 * User betting interfaces
 */

export interface UserBet {
  id: string;
  userId: string;
  betType: BetType;
  parlay?: Parlay;
  singleBet?: {
    eventId: string;
    eventName?: string;
    marketId: string;
    marketName?: string;
    outcomeId: string;
    outcomeName: string;
    odds: number;
    line?: number;
    bookmaker?: Bookmaker;
  };
  stake: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'push' | 'cash_out';
  placedAt: string;
  settledAt?: string;
  cashOutAt?: string;
  cashOutValue?: number;
  profit?: number;
  roi?: number;
  notes?: string;
  tags?: string[];
}

export interface UserBetStats {
  totalBets: number;
  totalWagered: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  bestBet?: UserBet;
  worstBet?: UserBet;
  sportBreakdown: Record<string, {
    bets: number;
    profit: number;
    winRate: number;
  }>;
  periodBreakdown: {
    today: { profit: number; bets: number };
    week: { profit: number; bets: number };
    month: { profit: number; bets: number };
    year: { profit: number; bets: number };
  };
}

/**
 * API response interfaces
 */

export interface SecretPhraseResponse {
  success: boolean;
  phrases: BettingInsight[];
  count: number;
  timestamp: string;
  sources: string[];
  scraped: boolean;
  aggregated_insights: AggregatedInsights;
  sport: string;
  league?: string;
  category_filter?: InsightCategory | 'all';
  avg_confidence: number;
  refreshed_at: string;
  secret_phrase_hint?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Filter and query interfaces
 */

export interface InsightsFilter {
  sport?: string;
  sportId?: string;
  league?: string;
  leagueId?: string;
  categories?: InsightCategory[];
  confidence_min?: number;
  sources?: string[];
  is_live?: boolean;
  event_id?: string;
  player_name?: string;
  team_name?: string;
  bookmaker_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'confidence' | 'scraped_at' | 'market_alignment' | 'edge';
  sort_order?: 'asc' | 'desc';
}

export interface ParlayFilter {
  sport?: string;
  league?: string;
  legCount?: number;
  minOdds?: number;
  maxOdds?: number;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * WebSocket event interfaces
 */

export interface InsightUpdateEvent {
  type: 'insight_update';
  data: BettingInsight[];
  timestamp: string;
  sport?: string;
  league?: string;
}

export interface MarketMovementEvent {
  type: 'market_movement';
  data: {
    event_id: string;
    market_id: string;
    outcome_id: string;
    old_odds: number;
    new_odds: number;
    movement: number;
    line_movement?: number;
    bookmaker_id?: string;
    timestamp: string;
  };
}

export interface ParlayUpdateEvent {
  type: 'parlay_update';
  data: {
    parlay_id: string;
    status: 'settled' | 'updated' | 'cash_out_available';
    profit?: number;
    cash_out_value?: number;
    timestamp: string;
  };
}

/**
 * Utility types
 */

export type BettingInsightSummary = Pick<BettingInsight, 
  'id' | 'text' | 'category' | 'confidence' | 'source' | 'scraped_at'
>;

export type ParlayTemplateSummary = Pick<ParlayTemplate,
  'id' | 'name' | 'sport' | 'legCount' | 'winRate' | 'combinedOdds' | 'createdAt'
>;

export type MarketComparison = {
  insight: BettingInsight;
  market_odds: number;
  market_probability: number;
  edge: number;
  recommendation: 'strong_value' | 'value' | 'neutral' | 'avoid';
  best_book?: Bookmaker;
};

/**
 * Constants
 */

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  expert_prediction: 'Expert Prediction',
  trend: 'Trend',
  player_trend: 'Player Trend',
  value_bet: 'Value Bet',
  advanced_analytics: 'Advanced Analytics',
  insider_tip: 'Insider Tip',
  public_betting: 'Public Betting',
  historical_trend: 'Historical Trend',
  injury_update: 'Injury Update',
  weather_impact: 'Weather Impact',
  sharp_money: 'Sharp Money',
  reverse_line_movement: 'Reverse Line Movement'
};

export const BET_TYPE_LABELS: Record<BetType, string> = {
  moneyline: 'Moneyline',
  spread: 'Spread',
  over_under: 'Over/Under',
  prop: 'Prop Bet',
  parlay: 'Parlay',
  teaser: 'Teaser',
  round_robin: 'Round Robin',
  futures: 'Futures',
  live_betting: 'Live Betting'
};

export const MARKET_CATEGORY_LABELS: Record<MarketCategory, string> = {
  player: 'Player Props',
  team: 'Team Props',
  game: 'Game Lines'
};

export const CONFIDENCE_THRESHOLDS = {
  low: 40,
  medium: 60,
  high: 80,
  very_high: 90
};

export const DEFAULT_INSIGHTS_LIMIT = 50;
export const MAX_INSIGHTS_LIMIT = 200;
export const MAX_PARLAY_LEGS = 10;
export const MIN_PARLAY_LEGS = 2;

/**
 * Type guards
 */

export const isParlay = (bet: UserBet | Parlay): bet is Parlay => {
  return (bet as Parlay).legs !== undefined;
};

export const isUserBet = (bet: UserBet | Parlay): bet is UserBet => {
  return (bet as UserBet).userId !== undefined;
};

export const isLiveInsight = (insight: BettingInsight): boolean => {
  return insight.is_live === true;
};

export const isHighConfidence = (insight: BettingInsight): boolean => {
  return insight.confidence >= CONFIDENCE_THRESHOLDS.high;
};
