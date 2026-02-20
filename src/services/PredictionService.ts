// Handles all prediction/parlay API calls
import { API_BASE_URL } from '../config';

export interface PredictionFilters {
  sport?: 'all' | 'nba' | 'nfl' | 'nhl' | 'mlb' | 'worldcup' | 'olympics';
  parlayType?: 'all' | 'same_game' | 'multi_sport' | 'spread' | 'over_under' | 'player_props' | 'tournament';
  platform?: string;
  minEdge?: number;
}

class PredictionService {
  async getPredictions(filters: PredictionFilters = {}) {
    const queryParams = new URLSearchParams({
      sport: filters.sport || 'all',
      parlay_type: filters.parlayType || 'all',
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.minEdge && { min_edge: filters.minEdge.toString() })
    });

    const response = await fetch(`${API_BASE_URL}/api/predictions?${queryParams}`);
    return response.json();
  }

  async getAIAnalysis(prompt: string) {
    const response = await fetch(`${API_BASE_URL}/api/predictions?analyze=true&prompt=${encodeURIComponent(prompt)}`);
    return response.json();
  }
}

export default new PredictionService();
