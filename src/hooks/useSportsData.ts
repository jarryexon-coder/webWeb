import { useState, useEffect } from 'react';

interface SportsData {
  games?: any[];
  news?: any[];
  analytics?: any[];
  fetchFromBackend?: (endpoint: string) => Promise<any>;
}

export const useSportsData = (options: any = {}): SportsData => {
  const [data, setData] = useState<SportsData>({});

  useEffect(() => {
    const loadData = async () => {
      setData({
        games: [],
        news: [],
        analytics: [],
      });
    };
    
    loadData();
  }, []);

  return data;
};

export const useSportsDataHelpers = () => {
  const fetchFromBackend = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (error) {
      console.error('Error fetching from backend:', error);
      return null;
    }
  };

  const fetchNews = async (sport: string) => {
    const endpoint = `/api/news?sport=${sport.toLowerCase()}`;
    return await fetchFromBackend(endpoint);
  };

  return {
    fetchFromBackend,
    fetchNews,
  };
};

