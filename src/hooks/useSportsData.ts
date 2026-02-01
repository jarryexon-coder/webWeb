// src/hooks/useSportsData.ts
import { useState, useEffect, useCallback } from 'react';

export interface GameData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: string;
  time: string;
  status: 'live' | 'final' | 'upcoming';
  homeLogo?: string;
  awayLogo?: string;
  date?: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  team: string;
  position: string;
  points: number;
  rebounds: number;
  assists: number;
  fantasyPoints: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  image?: string;
  source?: string;
}

export const useSportsData = () => {
  const [games, setGames] = useState<GameData[]>([]);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async (league: string = 'nba') => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockGames: GameData[] = [
        {
          id: '1',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
          homeScore: 112,
          awayScore: 108,
          quarter: '4th',
          time: '2:45',
          status: 'live',
          homeLogo: 'LAL',
          awayLogo: 'GSW',
          date: '2024-03-15'
        },
        {
          id: '2',
          homeTeam: 'Celtics',
          awayTeam: 'Heat',
          homeScore: 98,
          awayScore: 102,
          quarter: 'Final',
          time: '',
          status: 'final',
          homeLogo: 'BOS',
          awayLogo: 'MIA',
          date: '2024-03-15'
        }
      ];
      setGames(mockGames);
    } catch (err) {
      setError('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlayers = useCallback(async (league: string = 'nba') => {
    setLoading(true);
    try {
      // Mock data
      const mockPlayers: PlayerStats[] = [
        {
          id: '1',
          name: 'LeBron James',
          team: 'Lakers',
          position: 'SF',
          points: 25.0,
          rebounds: 7.5,
          assists: 7.0,
          fantasyPoints: 45.5
        },
        {
          id: '2',
          name: 'Stephen Curry',
          team: 'Warriors',
          position: 'PG',
          points: 29.5,
          rebounds: 5.5,
          assists: 6.0,
          fantasyPoints: 48.0
        }
      ];
      setPlayers(mockPlayers);
    } catch (err) {
      setError('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNews = useCallback(async (category: string = 'all') => {
    setLoading(true);
    try {
      // Mock data
      const mockNews: NewsArticle[] = [
        {
          id: '1',
          title: 'Lakers Secure Playoff Spot',
          summary: 'The Los Angeles Lakers have officially secured their playoff position...',
          content: 'Full article content here...',
          category: 'NBA',
          date: '2024-03-15',
          readTime: '3 min',
          image: 'https://example.com/news1.jpg'
        },
        {
          id: '2',
          title: 'Warriors Injury Update',
          summary: 'Key player returns to practice...',
          content: 'Full article content here...',
          category: 'NBA',
          date: '2024-03-14',
          readTime: '2 min',
          image: 'https://example.com/news2.jpg'
        }
      ];
      setNews(mockNews);
    } catch (err) {
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    fetchPlayers();
    fetchNews();
  }, [fetchGames, fetchPlayers, fetchNews]);

  return {
    games,
    players,
    news,
    loading,
    error,
    fetchGames,
    fetchPlayers,
    fetchNews,
    refreshData: () => {
      fetchGames();
      fetchPlayers();
      fetchNews();
    }
  };
};

export default useSportsData;
