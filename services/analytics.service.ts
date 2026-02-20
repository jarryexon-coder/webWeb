import apiClient from './apiClient';
import { cacheManager } from '../utils/cacheManager';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private cacheTTL = 30000; // 30 seconds for real-time data

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async getParlayAnalytics(params: {
    sport: string;
    league: string;
    parlay_type: string;
  }) {
    const cacheKey = `analytics-${params.sport}-${params.league}-${params.parlay_type}`;
    
    return cacheManager.getOrFetch(cacheKey, this.cacheTTL, async () => {
      const response = await apiClient.get('/api/analytics', { params });
      return response.data;
    });
  }

  async getPropValueOpportunities(league: string) {
    const response = await apiClient.get('/api/analytics/props', {
      params: { league }
    });
    return response.data;
  }

  async getCorrelatedParlays(league: string) {
    const response = await apiClient.get('/api/analytics/correlated', {
      params: { league }
    });
    return response.data;
  }

  async getSharpMoneyIndicators(league: string) {
    const response = await apiClient.get('/api/analytics/sharp-money', {
      params: { league }
    });
    return response.data;
  }

  async getParlaySuccessRates(sport?: string) {
    const response = await apiClient.get('/api/analytics/success-rates', {
      params: { sport }
    });
    return response.data;
  }
}

export const analyticsService = AnalyticsService.getInstance();
