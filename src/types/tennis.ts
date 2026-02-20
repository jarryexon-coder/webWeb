export interface TennisPlayer {
  id?: string | number;
  name: string;
  country: string;
  ranking: number;
  age: number;
  tour: 'ATP' | 'WTA';
  points?: number;
  hand?: 'Left' | 'Right';
  titles?: number;
  // fantasy fields added by backend
  fantasy_points?: number;
  salary?: number;
  value?: number;
  // ... any other fields
}

export interface TennisTournament {
  name: string;
  tour: 'ATP' | 'WTA';
  location?: string;
  surface?: 'Hard' | 'Clay' | 'Grass';
  date?: string;
}

export interface TennisMatch {
  id: string;
  tour: 'ATP' | 'WTA';
  player1: string;
  player2: string;
  date: string;
  time: string;
  round: string;
  tournament: string;
  surface: string;
  status: 'scheduled' | 'live' | 'completed';
  score?: string;
}
