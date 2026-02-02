import { useState, useEffect } from 'react';

interface SportsData {
  games: any[];
  players: any[];
  news: any[];
  loading: boolean;
  error: string | null;
  fetchGames: (league?: string) => Promise<void>;
  fetchPlayers: (league?: string) => Promise<void>;
  fetchNews: (category?: string) => Promise<void>;
  refreshData: () => void;
}

export const useSportsData = (options?: { autoRefresh?: boolean; refreshInterval?: number }): SportsData => {
  const [games, setGames] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async (league?: string) => {
    try {
      setLoading(true);
      // Mock implementation
      setGames([]);
    } catch (err) {
      setError('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async (league?: string) => {
    // Mock implementation
    setPlayers([]);
  };

  const fetchNews = async (category?: string) => {
    // Mock implementation
    setNews([]);
  };

  const refreshData = () => {
    fetchGames();
    fetchPlayers();
    fetchNews();
  };

  useEffect(() => {
    if (options?.autoRefresh) {
      const interval = setInterval(refreshData, options.refreshInterval || 30000);
      return () => clearInterval(interval);
    }
  }, [options?.autoRefresh, options?.refreshInterval]);

  return {
    games,
    players,
    news,
    loading,
    error,
    fetchGames,
    fetchPlayers,
    fetchNews,
    refreshData
  };
};
