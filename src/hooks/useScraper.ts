// src/hooks/useScraper.ts
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

interface ScrapedGame {
  id: string;
  away_team: string;
  home_team: string;
  away_score: string;
  home_score: string;
  status: string;
  quarter?: string;
  time?: string;
  source: string;
  last_updated: string;
}

interface ScrapedNews {
  title: string;
  url: string;
  summary?: string;
  source: string;
  timestamp: string;
}

interface ScrapedPlayerStats {
  player: string;
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  fantasy_points: number;
  last_updated: string;
  source: string;
}

interface ScraperResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  sport?: string;
  timestamp: string;
  sources?: string[];
  error?: string;
}

export const useScraper = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrapeScores = useCallback(async (sport: 'nba' | 'nfl' | 'mlb' = 'nba'): Promise<ScrapedGame[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/scores?sport=${sport}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: ScraperResponse<ScrapedGame> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape scores');
      }
      
      return data.data;
    } catch (err: any) {
      setError(err.message);
      console.error('Scraper error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const scrapeNews = useCallback(async (): Promise<ScrapedNews[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/news`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: ScraperResponse<ScrapedNews> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape news');
      }
      
      return data.data;
    } catch (err: any) {
      setError(err.message);
      console.error('News scraper error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const scrapePlayerStats = useCallback(async (player?: string, sport: string = 'nba'): Promise<ScrapedPlayerStats[]> => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_BASE_URL}/api/scraper/player-stats?sport=${sport}`;
      if (player) {
        url += `&player=${encodeURIComponent(player)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: ScraperResponse<ScrapedPlayerStats> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape player stats');
      }
      
      return data.data;
    } catch (err: any) {
      setError(err.message);
      console.error('Player stats scraper error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const scrapeInjuries = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/scraper/injuries`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape injuries');
      }
      
      return data.injuries;
    } catch (err: any) {
      setError(err.message);
      console.error('Injuries scraper error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getLiveGames = useCallback(async (sport: string = 'nba') => {
    try {
      // First try the scraper for live scores
      const scrapedGames = await scrapeScores(sport as any);
      
      if (scrapedGames.length > 0) {
        return scrapedGames;
      }
      
      // Fallback to the regular odds API
      const response = await fetch(`${API_BASE_URL}/api/odds/games?sport=${sport}`);
      const data = await response.json();
      
      if (data.success && data.games) {
        return data.games.map((game: any) => ({
          id: game.id,
          away_team: game.away_team,
          home_team: game.home_team,
          away_score: '0',
          home_score: '0',
          status: game.commence_time ? 'Scheduled' : 'TBD',
          source: 'odds-api',
          last_updated: new Date().toISOString()
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Error getting live games:', err);
      return [];
    }
  }, [scrapeScores]);

  return {
    loading,
    error,
    scrapeScores,
    scrapeNews,
    scrapePlayerStats,
    scrapeInjuries,
    getLiveGames
  };
};

// Usage example in a React component:
export const useLiveScores = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => {
  const [scores, setScores] = useState<ScrapedGame[]>([]);
  const { loading, error, scrapeScores } = useScraper();

  useEffect(() => {
    const fetchScores = async () => {
      const data = await scrapeScores(sport);
      setScores(data);
    };

    fetchScores();
    
    // Refresh every 30 seconds for live scores
    const interval = setInterval(fetchScores, 30000);
    
    return () => clearInterval(interval);
  }, [sport, scrapeScores]);

  return { scores, loading, error };
};
