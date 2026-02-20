// src/api/client.ts
import { API_BASE_URL } from '../config';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`🌐 Fetching: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.defaultHeaders,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Sports Wire Endpoints
  async getSportsWire(sport: string) {
    return this.get(`/api/sports-wire?sport=${sport}`);
  }

  async getEnhancedSportsWire(sport: string, includeBeatWriters = true, includeInjuries = true) {
    return this.get(`/api/sports-wire/enhanced?sport=${sport}&include_beat_writers=${includeBeatWriters}&include_injuries=${includeInjuries}`);
  }

  // Beat Writer Endpoints
  async getBeatWriters(sport: string, team?: string) {
    let endpoint = `/api/beat-writers?sport=${sport.toUpperCase()}`;
    if (team) endpoint += `&team=${encodeURIComponent(team)}`;
    return this.get(endpoint);
  }

  async getBeatWriterNews(sport: string, team?: string, hours = 24) {
    let endpoint = `/api/beat-writer-news?sport=${sport.toUpperCase()}&hours=${hours}`;
    if (team) endpoint += `&team=${encodeURIComponent(team)}`;
    return this.get(endpoint);
  }

  // Injury Endpoints
  async getInjuries(sport: string, team?: string, status?: string) {
    let endpoint = `/api/injuries?sport=${sport.toUpperCase()}`;
    if (team) endpoint += `&team=${encodeURIComponent(team)}`;
    if (status) endpoint += `&status=${status}`;
    return this.get(endpoint);
  }

  async getInjuryDashboard(sport: string) {
    return this.get(`/api/injuries/dashboard?sport=${sport.toUpperCase()}`);
  }

  // Team Endpoints
  async getTeamNews(team: string, sport: string) {
    return this.get(`/api/team/news?team=${encodeURIComponent(team)}&sport=${sport.toUpperCase()}`);
  }

  // Search Endpoint
  async searchAllTeams(query: string, sport: string) {
    return this.get(`/api/search/all-teams?q=${encodeURIComponent(query)}&sport=${sport.toUpperCase()}`);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || 'https://python-api-fresh-production.up.railway.app'
});

export default apiClient;
