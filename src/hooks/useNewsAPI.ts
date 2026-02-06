// src/hooks/useNewsAPI.ts
import { useQuery } from '@tanstack/react-query';

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

const fetchNews = async (sport: string = 'nba'): Promise<NewsResponse> => {
  if (!NEWS_API_KEY) {
    throw new Error('News API key not configured');
  }

  const query = encodeURIComponent(`${sport} basketball`);
  const url = `${NEWS_API_BASE}/everything?q=${query}&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`);
  }
  
  return response.json();
};

export const useNewsAPI = (sport: string = 'nba', options = {}) => {
  return useQuery({
    queryKey: ['news', sport],
    queryFn: () => fetchNews(sport),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!NEWS_API_KEY,
    ...options,
  });
};
