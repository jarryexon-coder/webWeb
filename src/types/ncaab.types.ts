export interface Conference {
  id: number;
  name: string;
  division?: string;
  logo?: string;
}

export interface Team {
  id: number;
  conference_id: number;
  name: string;
  full_name: string;
  nickname?: string;
  logo?: string;
  city?: string;
  state?: string;
  color?: string;
  alt_color?: string;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position?: string;
  height?: string;
  weight?: string;
  jersey_number?: number;
  team_id: number;
  team?: Team;
  class?: string;
  hometown?: string;
}

export interface Game {
  id: number;
  date: string;
  home_team_id: number;
  home_team_score: number;
  away_team_id: number;
  away_team_score: number;
  period: number;
  status: string;
  time?: string;
  postseason?: boolean;
  season: number;
  home_team?: Team;
  away_team?: Team;
  home_team_record?: string;
  away_team_record?: string;
  broadcast?: string;
  arena?: string;
}

export interface Standing {
  team_id: number;
  conference_id: number;
  season: number;
  wins: number;
  losses: number;
  conference_wins?: number;
  conference_losses?: number;
  home_wins?: number;
  home_losses?: number;
  away_wins?: number;
  away_losses?: number;
  streak?: string;
  last_ten?: string;
  team?: Team;
}

export interface Ranking {
  team_id: number;
  season: number;
  week: number;
  poll: string; // 'AP' | 'Coaches'
  rank: number;
  points?: number;
  record?: string;
  team?: Team;
}

export interface PlayerStats {
  game_id: number;
  player_id: number;
  team_id: number;
  minutes?: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  fouls?: number;
  field_goals_made?: number;
  field_goals_attempted?: number;
  three_point_made?: number;
  three_point_attempted?: number;
  free_throws_made?: number;
  free_throws_attempted?: number;
}

export interface PlayerSeasonStats {
  player_id: number;
  season: number;
  games_played: number;
  minutes_per_game: number;
  points_per_game: number;
  rebounds_per_game: number;
  assists_per_game: number;
  steals_per_game: number;
  blocks_per_game: number;
  field_goal_pct: number;
  three_point_pct: number;
  free_throw_pct: number;
}

export interface BracketGame {
  round: number;
  region?: string;
  game_id: number;
  team1_id?: number;
  team2_id?: number;
  winner_id?: number;
  game?: Game;
}

export interface Odds {
  game_id: number;
  provider: string;
  spread?: number;
  over_under?: number;
  home_moneyline?: number;
  away_moneyline?: number;
  last_update: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}
