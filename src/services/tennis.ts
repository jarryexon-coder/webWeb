// src/services/tennis.ts
// Tennis-specific API service

const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export interface TennisPlayer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  atp_rank?: number;
  wta_rank?: number;
  points: number;
  age: number;
  turned_pro: number;
  height_cm?: number;
  hand: 'left' | 'right' | 'ambidextrous';
  tour: 'ATP' | 'WTA';
  is_prospect?: boolean;
}

export interface TennisTournament {
  id: string;
  name: string;
  location: string;
  surface: 'hard' | 'clay' | 'grass' | 'carpet';
  tier: string;
  prize_money?: number;
  start_date: string;
  end_date: string;
  tour: 'ATP' | 'WTA';
  defending_champion?: string;
}

export interface TennisMatch {
  id: string;
  tournament_id: string;
  round: string;
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
  scheduled_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: string;
  venue?: string;
  surface?: string;
  tour: 'ATP' | 'WTA';
}

// Generic fetch wrapper
async function fetchFromTennis<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api/tennis${endpoint}`);
  if (!response.ok) {
    throw new Error(`Tennis API error: ${response.statusText}`);
  }
  return response.json();
}

// Tennis API methods
export const tennisApi = {
  getPlayers: (tour?: 'ATP' | 'WTA'): Promise<{ players: TennisPlayer[] }> => {
    const params = tour ? `?tour=${tour}` : '';
    return fetchFromTennis(`/players${params}`);
  },
  
  getTournaments: (tour?: 'ATP' | 'WTA'): Promise<{ tournaments: TennisTournament[] }> => {
    const params = tour ? `?tour=${tour}` : '';
    return fetchFromTennis(`/tournaments${params}`);
  },
  
  getMatches: (tour?: 'ATP' | 'WTA', date?: string): Promise<{ matches: TennisMatch[] }> => {
    const params = new URLSearchParams();
    if (tour) params.append('tour', tour);
    if (date) params.append('date', date);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchFromTennis(`/matches${queryString}`);
  }
};

export default tennisApi;
