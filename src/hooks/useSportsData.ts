// src/hooks/useSportsData.ts - UPDATED VERSION
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';

// Generic response structure based on YOUR API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  timestamp?: string;
  lastUpdated?: string;
  count?: number;
  // Your API returns data in these fields
  players?: T;
  teams?: T;
  analytics?: T;
  selections?: T;
  picks?: T;
  suggestions?: T;
  history?: T;
  trends?: T;
  predictions?: T;
  [key: string]: any;
}

// Generic fetch hook with proper response handling
const useApiData = <T,>(endpoint: string, initialData: T, params?: Record<string, string>) => {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract data from YOUR API response
  const extractDataFromResponse = (response: ApiResponse<T> | null): T => {
    if (!response || !response.success) {
      console.warn(`⚠️ API response not successful:`, response);
      return initialData;
    }
    
    console.log(`📦 Extracting data from API response for ${endpoint}:`, {
      success: response.success,
      count: response.count,
      keys: Object.keys(response)
    });
    
    // Your API returns data in these fields
    const propertyPriority = [
      'players',     // /api/players returns players array
      'teams',       // /api/fantasy/teams returns teams array
      'selections',  // /api/prizepicks/selections returns selections array
      'analytics',   // /api/analytics returns analytics array
      'picks',       // /api/picks returns picks array
      'suggestions', // /api/suggestions returns suggestions array
      'history',     // /api/history returns history array
      'trends',      // /api/trends returns trends array
      'predictions', // /api/predictions returns predictions array
      'data'         // Generic data field
    ];
    
    for (const prop of propertyPriority) {
      if (response[prop] !== undefined) {
        console.log(`✅ Found data in property: ${prop}`);
        return response[prop] as T;
      }
    }
    
    // If response itself is an array (unlikely but possible)
    if (Array.isArray(response)) {
      return response as T;
    }
    
    console.warn(`⚠️ No data found in API response for ${endpoint}, returning initial data`);
    return initialData;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const url = buildApiUrl(endpoint, params);
      
      console.log(`📡 [useApiData] Fetching from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<T> = await response.json();
      console.log(`📦 [useApiData] Raw API response:`, {
        success: result.success,
        count: result.count,
        message: result.message,
        endpoint
      });
      
      // Extract data from response
      const extractedData = extractDataFromResponse(result);
      
      if (Array.isArray(extractedData)) {
        console.log(`✅ [useApiData] Extracted ${extractedData.length} items from ${endpoint}`);
      } else if (extractedData && typeof extractedData === 'object') {
        console.log(`✅ [useApiData] Extracted object from ${endpoint}`);
      }
      
      setData(extractedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [useApiData] Error fetching ${endpoint}:`, err);
      setError(errorMessage);
      
      // Log more details for debugging
      console.log(`🔍 Debug info for ${endpoint}:`, {
        url: buildApiUrl(endpoint, params),
        params,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    console.log(`🔄 [useApiData] Refetching ${endpoint}`);
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Type-safe hooks with proper return types

// 🎯 FANTASY HUB HOOKS
export const useFantasyPlayers = (sport?: string) => {
  const params = sport ? { sport } : undefined;
  return useApiData<any[]>(API_ENDPOINTS.fantasyPlayers, [], params);
};

export const useFantasyTeams = () => 
  useApiData<any[]>(API_ENDPOINTS.fantasyTeams, []);

// 🎯 PRIZEPICKS SCREEN HOOK
export const usePrizePicks = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData<any[]>(API_ENDPOINTS.prizePicksSelections, [], { sport });

export const usePrizePicksAnalytics = () => 
  useApiData<any[]>(API_ENDPOINTS.prizePicksAnalytics, []);

// SPORTS WIRE SCREEN
export const useSportsWire = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData<any[]>(API_ENDPOINTS.sportsWire, [], { sport });

// DAILY PICKS SCREEN
export const useDailyPicks = () => 
  useApiData<any[]>(API_ENDPOINTS.dailyPicks, []);

// ADVANCED ANALYTICS SCREEN
export const useAdvancedAnalytics = () => 
  useApiData<any[]>(API_ENDPOINTS.advancedAnalytics, []);

// PARLAY ARCHITECT SCREEN
export const useParlaySuggestions = () => 
  useApiData<any[]>(API_ENDPOINTS.parlaySuggestions, []);

// KALSHI PREDICTIONS SCREEN
export const useKalshiPredictions = () => 
  useApiData<any[]>(API_ENDPOINTS.kalshiPredictions, []);

// PREDICTIONS OUTCOME SCREEN
export const usePredictionsHistory = () => 
  useApiData<any[]>(API_ENDPOINTS.predictionsHistory, []);

// PLAYER STATS TRENDS
export const usePlayerTrends = (playerName?: string) => {
  const params = playerName ? { player: playerName } : undefined;
  return useApiData<any[]>(API_ENDPOINTS.playerTrends, [], params);
};

// SYSTEM STATUS
export const useSystemStatus = () => 
  useApiData<any>(API_ENDPOINTS.systemStatus, {});

// ALERTS
export const useAlerts = () => 
  useApiData<any[]>(API_ENDPOINTS.alerts, []);

// INJURIES
export const useInjuries = () => 
  useApiData<any[]>(API_ENDPOINTS.injuries, []);

// WEATHER IMPACTS
export const useWeatherImpacts = () => 
  useApiData<any[]>(API_ENDPOINTS.weather, []);

// Export helper function for other components to use
export const extractArrayFromResponse = (response: any): any[] => {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) return response;
  
  // If response has success flag and data fields (your API structure)
  if (response.success !== undefined) {
    const arrayProps = ['players', 'teams', 'selections', 'analytics', 'picks', 'suggestions', 'history', 'trends', 'predictions', 'data'];
    
    for (const prop of arrayProps) {
      if (response[prop] && Array.isArray(response[prop])) {
        return response[prop];
      }
    }
  }
  
  // If it's an object with common array properties
  if (typeof response === 'object') {
    const arrayProps = ['data', 'results', 'items', 'analytics', 'players', 'teams', 'games'];
    
    for (const prop of arrayProps) {
      if (response[prop] && Array.isArray(response[prop])) {
        return response[prop];
      }
    }
    
    // If it's a single object, wrap it in array
    return [response];
  }
  
  // Fallback to empty array
  return [];
};

// Data transformation helpers for YOUR API data
export const transformPlayerData = (apiPlayer: any) => {
  return {
    id: apiPlayer.id || '',
    name: apiPlayer.name || apiPlayer.playerName || 'Unknown Player',
    playerName: apiPlayer.playerName || apiPlayer.name || 'Unknown Player',
    team: apiPlayer.team || '',
    teamAbbrev: apiPlayer.teamAbbrev || (apiPlayer.team ? apiPlayer.team.substring(0, 3).toUpperCase() : 'N/A'),
    position: apiPlayer.position || apiPlayer.pos || 'N/A',
    pos: apiPlayer.pos || apiPlayer.position || 'N/A',
    salary: apiPlayer.salary || apiPlayer.fanDuelSalary || apiPlayer.fdSalary || 0,
    fanDuelSalary: apiPlayer.fanDuelSalary || apiPlayer.fdSalary || apiPlayer.salary || 0,
    fdSalary: apiPlayer.fdSalary || apiPlayer.fanDuelSalary || apiPlayer.salary || 0,
    draftKingsSalary: apiPlayer.draftKingsSalary || apiPlayer.dkSalary || 0,
    dkSalary: apiPlayer.dkSalary || apiPlayer.draftKingsSalary || 0,
    fantasyScore: apiPlayer.fantasyScore || apiPlayer.fp || 0,
    fp: apiPlayer.fp || apiPlayer.fantasyScore || 0,
    points: apiPlayer.points || apiPlayer.pts || 0,
    pts: apiPlayer.pts || apiPlayer.points || 0,
    rebounds: apiPlayer.rebounds || apiPlayer.reb || 0,
    reb: apiPlayer.reb || apiPlayer.rebounds || 0,
    assists: apiPlayer.assists || apiPlayer.ast || 0,
    ast: apiPlayer.ast || apiPlayer.assists || 0,
    steals: apiPlayer.steals || apiPlayer.stl || 0,
    stl: apiPlayer.stl || apiPlayer.steals || 0,
    blocks: apiPlayer.blocks || apiPlayer.blk || 0,
    blk: apiPlayer.blk || apiPlayer.blocks || 0,
    threePointers: apiPlayer.threePointers || apiPlayer.threes || 0,
    threes: apiPlayer.threes || apiPlayer.threePointers || 0,
    ownership: apiPlayer.ownership || apiPlayer.own || 0,
    own: apiPlayer.own || apiPlayer.ownership || 0,
    projection: apiPlayer.projection || apiPlayer.proj || apiPlayer.projectedFantasyScore || apiPlayer.projFP || 0,
    proj: apiPlayer.proj || apiPlayer.projection || apiPlayer.projectedFantasyScore || apiPlayer.projFP || 0,
    projectedFantasyScore: apiPlayer.projectedFantasyScore || apiPlayer.projFP || apiPlayer.projection || apiPlayer.proj || 0,
    projFP: apiPlayer.projFP || apiPlayer.projectedFantasyScore || apiPlayer.projection || apiPlayer.proj || 0,
    projectionEdge: apiPlayer.projectionEdge || 0,
    projectionConfidence: apiPlayer.projectionConfidence || 'medium',
    valueScore: apiPlayer.valueScore || 0,
    value: apiPlayer.value || 0,
    trend: apiPlayer.trend || 'stable',
    injuryStatus: apiPlayer.injuryStatus || 'healthy',
    minutesProjected: apiPlayer.minutesProjected || 0,
    usageRate: apiPlayer.usageRate || 0,
    efficiency: apiPlayer.efficiency || 0,
    last5Avg: apiPlayer.last5Avg || 0,
    seasonAvg: apiPlayer.seasonAvg || 0,
    homeAway: apiPlayer.homeAway || 'home',
    opponent: apiPlayer.opponent || '',
    opponentRank: apiPlayer.opponentRank || 0,
    gameTime: apiPlayer.gameTime || '',
    weatherImpact: apiPlayer.weatherImpact || 'none',
    last_update: apiPlayer.last_update || apiPlayer.lastUpdated || apiPlayer.timestamp || '',
    timestamp: apiPlayer.timestamp || apiPlayer.lastUpdated || apiPlayer.last_update || ''
  };
};

export const transformFantasyTeamData = (apiTeam: any) => {
  return {
    id: apiTeam.id || '',
    name: apiTeam.name || apiTeam.teamName || 'Unknown Team',
    teamName: apiTeam.teamName || apiTeam.name || 'Unknown Team',
    owner: apiTeam.owner || apiTeam.user || 'Unknown Owner',
    user: apiTeam.user || apiTeam.owner || 'Unknown Owner',
    ownerId: apiTeam.ownerId || '',
    sport: apiTeam.sport || 'NBA',
    league: apiTeam.league || apiTeam.leagueName || 'Unknown League',
    leagueName: apiTeam.leagueName || apiTeam.league || 'Unknown League',
    record: apiTeam.record || '0-0-0',
    wins: apiTeam.wins || 0,
    losses: apiTeam.losses || 0,
    ties: apiTeam.ties || 0,
    points: apiTeam.points || apiTeam.totalPoints || 0,
    totalPoints: apiTeam.totalPoints || apiTeam.points || 0,
    rank: apiTeam.rank || apiTeam.position || 0,
    position: apiTeam.position || apiTeam.rank || 0,
    players: (apiTeam.players || []).map(transformPlayerData),
    roster: apiTeam.roster || [],
    waiverPosition: apiTeam.waiverPosition || apiTeam.waiver || 0,
    waiver: apiTeam.waiver || apiTeam.waiverPosition || 0,
    movesThisWeek: apiTeam.movesThisWeek || apiTeam.transactions || 0,
    transactions: apiTeam.transactions || apiTeam.movesThisWeek || 0,
    lastUpdated: apiTeam.lastUpdated || apiTeam.updatedAt || '',
    updatedAt: apiTeam.updatedAt || apiTeam.lastUpdated || '',
    projectionRank: apiTeam.projectionRank || 0,
    projectedPoints: apiTeam.projectedPoints || 0,
    winProbability: apiTeam.winProbability || 0,
    strengthOfSchedule: apiTeam.strengthOfSchedule || 0,
    totalSalary: apiTeam.totalSalary || 0,
    remainingSalary: apiTeam.remainingSalary || 0,
    teamValue: apiTeam.teamValue || 0,
    draftPosition: apiTeam.draftPosition || 0,
    playoffStatus: apiTeam.playoffStatus || 'unknown',
    nextOpponent: apiTeam.nextOpponent || '',
    nextOpponentRank: apiTeam.nextOpponentRank || 0,
    matchupDifficulty: apiTeam.matchupDifficulty || 'medium'
  };
};
