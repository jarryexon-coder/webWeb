// src/services/golf.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export interface GolfPlayer {
  id: string;
  name: string;
  country: string;
  world_rank?: number;
  tour: 'PGA' | 'LPGA';
  // add other fields as needed
}

export interface GolfTournament {
  id: string;
  name: string;
  course: string;
  location: string;
  start_date: string;
  end_date: string;
  purse?: number;
  tour: 'PGA' | 'LPGA';
}

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  position: number;
  total_score: number;
  round_scores: number[];
  // etc.
}

async function fetchFromGolf<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api/golf${endpoint}`);
  if (!response.ok) throw new Error(`Golf API error: ${response.statusText}`);
  return response.json();
}

export const golfApi = {
  getPlayers: (tour?: 'PGA' | 'LPGA'): Promise<{ players: GolfPlayer[] }> => {
    const params = tour ? `?tour=${tour}` : '';
    return fetchFromGolf(`/players${params}`);
  },
  getTournaments: (tour?: 'PGA' | 'LPGA'): Promise<{ tournaments: GolfTournament[] }> => {
    const params = tour ? `?tour=${tour}` : '';
    return fetchFromGolf(`/tournaments${params}`);
  },
  getLeaderboard: (tour?: 'PGA' | 'LPGA', tournament?: string): Promise<{ leaderboard: LeaderboardEntry[] }> => {
    const params = new URLSearchParams();
    if (tour) params.append('tour', tour);
    if (tournament) params.append('tournament', tournament);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchFromGolf(`/leaderboard${queryString}`);
  }
};

export default golfApi;
