// src/services/api.ts
import { GameData, PlayerStats, NewsArticle } from '../hooks/useSportsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Games
  async getGames(league: string): Promise<GameData[]> {
    const response = await fetch(`${API_BASE_URL}/games/${league}`);
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  },

  async getLiveGames(): Promise<GameData[]> {
    const response = await fetch(`${API_BASE_URL}/games/live`);
    if (!response.ok) throw new Error('Failed to fetch live games');
    return response.json();
  },

  // Players
  async getPlayers(league: string): Promise<PlayerStats[]> {
    const response = await fetch(`${API_BASE_URL}/players/${league}`);
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  },

  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const response = await fetch(`${API_BASE_URL}/players/${playerId}/stats`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    return response.json();
  },

  // News
  async getNews(category?: string): Promise<NewsArticle[]> {
    const url = category 
      ? `${API_BASE_URL}/news?category=${category}`
      : `${API_BASE_URL}/news`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch news');
    return response.json();
  },

  async getArticle(articleId: string): Promise<NewsArticle> {
    const response = await fetch(`${API_BASE_URL}/news/${articleId}`);
    if (!response.ok) throw new Error('Failed to fetch article');
    return response.json();
  },

  // Analytics
  async getTeamStats(teamId: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/teams/${teamId}`);
    if (!response.ok) throw new Error('Failed to fetch team stats');
    return response.json();
  },

  async getMatchAnalytics(gameId: string) {
    const response = await fetch(`${API_BASE_URL}/analytics/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch match analytics');
    return response.json();
  },
};

export default api;
