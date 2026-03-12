import axios from 'axios';
import {
  Conference, Team, Player, Game, Standing, Ranking,
  PlayerStats, PlayerSeasonStats, BracketGame, Odds,
  PaginatedResponse
} from '../types/ncaab.types';

// ✅ Use absolute URL to bypass Vite proxy
const API_BASE = 'https://python-api-fresh-production.up.railway.app/api/ncaab';

interface QueryParams {
  [key: string]: string | number | boolean | (string | number)[];
}

const buildQueryString = (params: QueryParams) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(`${key}[]`, String(v)));
    } else if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

const get = async <T>(endpoint: string, params?: QueryParams): Promise<T> => {
  const url = params
    ? `${API_BASE}${endpoint}?${buildQueryString(params)}`
    : `${API_BASE}${endpoint}`;
  const response = await axios.get<T>(url);
  return response.data;
};

// Conferences
export const getConferences = () => get<Conference[]>('/conferences');

// Teams
export const getTeams = (params?: { cursor?: number; per_page?: number }) =>
  get<PaginatedResponse<Team>>('/teams', params);

// Players
export const getPlayers = (params?: {
  cursor?: number;
  per_page?: number;
  team_ids?: number[];
  search?: string;
}) => get<PaginatedResponse<Player>>('/players', params);

export const getPlayer = (id: number) => get<Player>(`/players/${id}`);

export const getActivePlayers = (params?: {
  cursor?: number;
  per_page?: number;
  team_ids?: number[];
  search?: string;
}) => get<PaginatedResponse<Player>>('/players/active', params);

// Standings
export const getStandings = (params?: {
  conference_id?: number;
  season?: number;
  team_ids?: number[];
}) => get<Standing[]>('/standings', params);

// Games
export const getGames = (params?: {
  cursor?: number;
  per_page?: number;
  dates?: string[];
  team_ids?: number[];
  seasons?: number[];
  postseason?: boolean;
  status?: string;
}) => get<PaginatedResponse<Game>>('/games', params);

export const getGame = (id: number) => get<Game>(`/games/${id}`);

// Rankings
export const getRankings = (params?: {
  season?: number;
  week?: number;
  poll?: string;
  team_ids?: number[];
}) => get<Ranking[]>('/rankings', params);

// Plays
export const getPlays = (params: {
  game_id: number;
  cursor?: number;
  per_page?: number;
  team_ids?: number[];
  player_ids?: number[];
  types?: string[];
}) => get<any[]>('/plays', params);

// Player Stats
export const getPlayerStats = (params: {
  game_ids?: number[];
  player_ids?: number[];
  team_ids?: number[];
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<PlayerStats>>('/player_stats', params);

// Team Stats
export const getTeamStats = (params: {
  game_ids?: number[];
  team_ids?: number[];
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<any>>('/team_stats', params);

// Player Season Stats
export const getPlayerSeasonStats = (params: {
  season: number;
  player_ids?: number[];
  team_ids?: number[];
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<PlayerSeasonStats>>('/player_season_stats', params);

// Team Season Stats
export const getTeamSeasonStats = (params: {
  season: number;
  team_ids?: number[];
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<any>>('/team_season_stats', params);

// Bracket
export const getBracket = (params?: {
  season?: number;
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<BracketGame>>('/bracket', params);

// Odds
export const getOdds = (params?: {
  game_id?: number;
  dates?: string[];
  cursor?: number;
  per_page?: number;
}) => get<PaginatedResponse<Odds>>('/odds', params);
