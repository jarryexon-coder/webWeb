import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  getConferences,
  getTeams,
  getPlayers,
  getPlayer,
  getActivePlayers,
  getStandings,
  getGames,
  getGame,
  getRankings,
  getPlays,
  getPlayerStats,
  getTeamStats,
  getPlayerSeasonStats,
  getTeamSeasonStats,
  getBracket,
  getOdds,
} from '../services/ncaab.service';
import { PaginatedResponse } from '../types/ncaab.types';

// Conferences
export const useConferences = (options?: UseQueryOptions) =>
  useQuery({ queryKey: ['conferences'], queryFn: getConferences, ...options });

// Teams
export const useTeams = (params?: Parameters<typeof getTeams>[0]) =>
  useQuery({
    queryKey: ['teams', params],
    queryFn: () => getTeams(params),
  });

// Players
export const usePlayers = (params?: Parameters<typeof getPlayers>[0]) =>
  useQuery({
    queryKey: ['players', params],
    queryFn: () => getPlayers(params),
  });

export const usePlayer = (id: number) =>
  useQuery({
    queryKey: ['player', id],
    queryFn: () => getPlayer(id),
    enabled: !!id,
  });

export const useActivePlayers = (params?: Parameters<typeof getActivePlayers>[0]) =>
  useQuery({
    queryKey: ['activePlayers', params],
    queryFn: () => getActivePlayers(params),
  });

// Standings
export const useStandings = (params?: Parameters<typeof getStandings>[0]) =>
  useQuery({
    queryKey: ['standings', params],
    queryFn: () => getStandings(params),
  });

// Games
export const useGames = (params?: Parameters<typeof getGames>[0]) =>
  useQuery({
    queryKey: ['games', params],
    queryFn: () => getGames(params),
  });

export const useGame = (id: number) =>
  useQuery({
    queryKey: ['game', id],
    queryFn: () => getGame(id),
    enabled: !!id,
  });

// Rankings
export const useRankings = (params?: Parameters<typeof getRankings>[0]) =>
  useQuery({
    queryKey: ['rankings', params],
    queryFn: () => getRankings(params),
  });

// Plays
export const usePlays = (params: Parameters<typeof getPlays>[0]) =>
  useQuery({
    queryKey: ['plays', params],
    queryFn: () => getPlays(params),
    enabled: !!params.game_id,
  });

// Player Stats (game logs)
export const usePlayerStats = (params: Parameters<typeof getPlayerStats>[0]) =>
  useQuery({
    queryKey: ['playerStats', params],
    queryFn: () => getPlayerStats(params),
  });

// Team Stats (game logs)
export const useTeamStats = (params: Parameters<typeof getTeamStats>[0]) =>
  useQuery({
    queryKey: ['teamStats', params],
    queryFn: () => getTeamStats(params),
  });

// Player Season Stats
export const usePlayerSeasonStats = (params: Parameters<typeof getPlayerSeasonStats>[0]) =>
  useQuery({
    queryKey: ['playerSeasonStats', params],
    queryFn: () => getPlayerSeasonStats(params),
  });

// Team Season Stats
export const useTeamSeasonStats = (params: Parameters<typeof getTeamSeasonStats>[0]) =>
  useQuery({
    queryKey: ['teamSeasonStats', params],
    queryFn: () => getTeamSeasonStats(params),
  });

// Bracket
export const useBracket = (params?: Parameters<typeof getBracket>[0]) =>
  useQuery({
    queryKey: ['bracket', params],
    queryFn: () => getBracket(params),
  });

// Odds
export const useOdds = (params?: Parameters<typeof getOdds>[0]) =>
  useQuery({
    queryKey: ['odds', params],
    queryFn: () => getOdds(params),
  });
