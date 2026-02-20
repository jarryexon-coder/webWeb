// Add new screens to navigation
export type BettingStackParamList = {
  DailyPicks: undefined;
  ParlayBuilder: { sport: string };
  PredictionMarkets: { sport: string };
  TrendAnalysis: { player: string; sport: string };
  ParlayDetails: { parlayId: string };
};
