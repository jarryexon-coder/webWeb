import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analytics.service';
import { useWebSocket } from './useWebSocket';

export const useParlayAnalytics = (initialSport = 'all', initialParlayType = 'standard') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [selectedParlayType, setSelectedParlayType] = useState(initialParlayType);
  const [historicalData, setHistoricalData] = useState([]);
  
  const { lastMessage } = useWebSocket('analytics-updates');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getParlayAnalytics({
        sport: selectedSport,
        league: selectedSport === 'all' ? 'nba' : selectedSport,
        parlay_type: selectedParlayType
      });
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSport, selectedParlayType]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage) {
      const update = JSON.parse(lastMessage);
      if (update.type === 'analytics' && update.league === selectedSport) {
        setAnalytics(prev => ({ ...prev, ...update.data }));
      }
    }
  }, [lastMessage, selectedSport]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    selectedSport,
    setSelectedSport,
    selectedParlayType,
    setSelectedParlayType,
    refresh,
    historicalData
  };
};
