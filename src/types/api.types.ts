// src/types/api.types.ts
import { BeatWriter, Injury, NewsArticle, InjuryDashboard, SearchResult } from './sports-wire.types';

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface SportsWireResponse extends ApiResponse {
  news: NewsArticle[];
  count: number;
  source: string;
  sport: string;
}

export interface EnhancedSportsWireResponse extends ApiResponse {
  news: NewsArticle[];
  count: number;
  breakdown: {
    regular: number;
    beat_writers: number;
    injuries: number;
  };
  sport: string;
  is_enhanced: boolean;
}

export interface BeatWritersResponse extends ApiResponse {
  sport: string;
  team?: string;
  beat_writers: BeatWriter[] | Record<string, BeatWriter[]>;
  national_insiders: BeatWriter[];
  total_writers: number;
}

export interface BeatWriterNewsResponse extends ApiResponse {
  sport: string;
  team?: string;
  news: NewsArticle[];
  count: number;
  sources_checked: number;
  is_mock: boolean;
}

export interface InjuriesResponse extends ApiResponse {
  sport: string;
  team?: string;
  injuries: Injury[];
  count: number;
  last_updated: string;
  sources: string[];
  is_mock: boolean;
}

export interface InjuryDashboardResponse extends ApiResponse {
  sport: string;
  total_injuries: number;
  status_breakdown: Record<string, number>;
  team_breakdown: Record<string, number>;
  injury_type_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  top_injured_teams: [string, number][];
  injuries: Injury[];
}

export interface TeamNewsResponse extends ApiResponse {
  sport: string;
  team: string;
  news: NewsArticle[];
  count: number;
  beat_writers: BeatWriter[];
}

export interface SearchResponse extends ApiResponse {
  query: string;
  sport: string;
  results: SearchResult[];
  count: number;
}
