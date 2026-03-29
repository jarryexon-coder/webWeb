// src/services/fantasyHubService.ts
// CORRECTED IMPORTS - using two levels up, not three
import { getADP, getInjuries, getNews, getDepthCharts, getGamesForDate, getPlayerList } from '../../services/tank01Service';
import { getUserLeagues, getLeagueRosters, getAllPlayers } from '../../services/sleeperService';
import axios from 'axios';

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ============= TANK01 SERVICE FUNCTIONS =============

/**
 * Fetch ADP data using the actual tank01Service
 */
export const fetchTank01ADP = async (sport = 'nba') => {
  try {
    console.log(`[Service] Fetching ADP for ${sport} from tank01Service...`);
    const adpList = await getADP(sport);
    return { 
      success: true, 
      data: adpList,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching ADP from service:', error);
    // Fallback to API endpoint
    try {
      const response = await axios.get(`${NODE_API_BASE}/api/tank01/adp?sport=${sport}`);
      return response.data;
    } catch (fallbackError) {
      console.error('[Service] Fallback also failed:', fallbackError);
      return { success: false, data: [] };
    }
  }
};

/**
 * Fetch injuries using the actual tank01Service
 */
export const fetchTank01Injuries = async (sport = 'nba') => {
  try {
    console.log(`[Service] Fetching injuries for ${sport} from tank01Service...`);
    const injuries = await getInjuries(sport);
    return { 
      success: true, 
      data: injuries,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching injuries from service:', error);
    // Fallback to API endpoint
    try {
      const response = await axios.get(`${NODE_API_BASE}/api/tank01/injuries`);
      return response.data;
    } catch (fallbackError) {
      console.error('[Service] Fallback also failed:', fallbackError);
      return { success: false, data: [] };
    }
  }
};

/**
 * Fetch news using the actual tank01Service
 */
export const fetchTank01News = async (maxItems = 5, sport = 'nba') => {
  try {
    console.log(`[Service] Fetching news for ${sport} from tank01Service...`);
    const news = await getNews(maxItems, sport);
    return { 
      success: true, 
      data: news,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching news from service:', error);
    // Fallback to API endpoint
    try {
      const response = await axios.get(`${NODE_API_BASE}/api/tank01/news?max=${maxItems}`);
      return response.data;
    } catch (fallbackError) {
      console.error('[Service] Fallback also failed:', fallbackError);
      return { success: false, data: [] };
    }
  }
};

/**
 * Fetch depth charts using the actual tank01Service
 */
export const fetchTank01DepthCharts = async (sport = 'nba') => {
  try {
    console.log(`[Service] Fetching depth charts for ${sport} from tank01Service...`);
    const depthCharts = await getDepthCharts(sport);
    return { 
      success: true, 
      data: depthCharts,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching depth charts from service:', error);
    // Fallback to API endpoint
    try {
      const response = await axios.get(`${NODE_API_BASE}/api/tank01/depthcharts`);
      return response.data;
    } catch (fallbackError) {
      console.error('[Service] Fallback also failed:', fallbackError);
      return { success: false, data: [] };
    }
  }
};

/**
 * Fetch games for a specific date using the actual tank01Service
 */
export const fetchTank01GamesForDate = async (date: string, sport = 'nba') => {
  try {
    console.log(`[Service] Fetching games for ${date} from tank01Service...`);
    const games = await getGamesForDate(date, sport);
    return { 
      success: true, 
      data: games,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching games from service:', error);
    // Fallback to API endpoint
    try {
      const tank01Date = date.replace(/-/g, '');
      const response = await axios.get(`${NODE_API_BASE}/api/tank01/games?date=${tank01Date}`);
      return response.data;
    } catch (fallbackError) {
      console.error('[Service] Fallback also failed:', fallbackError);
      return { success: false, data: [] };
    }
  }
};

/**
 * Fetch player list using the actual tank01Service
 */
export const fetchTank01PlayerList = async (sport = 'nba') => {
  try {
    console.log(`[Service] Fetching player list for ${sport} from tank01Service...`);
    const players = await getPlayerList(sport);
    return { 
      success: true, 
      data: players,
      source: 'tank01Service'
    };
  } catch (error) {
    console.error('[Service] Error fetching player list from service:', error);
    return { success: false, data: [] };
  }
};

// ============= SLEEPER SERVICE FUNCTIONS =============

/**
 * Fetch user leagues using the actual sleeperService
 */
export const fetchSleeperUserLeagues = async (username: string, sport = 'nba', season = '2025') => {
  try {
    console.log(`[Service] Fetching Sleeper leagues for ${username}...`);
    const leagues = await getUserLeagues(username, sport, season);
    return { 
      success: true, 
      data: leagues,
      source: 'sleeperService'
    };
  } catch (error) {
    console.error('[Service] Error fetching Sleeper leagues:', error);
    return { success: false, data: [] };
  }
};

/**
 * Fetch league rosters using the actual sleeperService
 */
export const fetchSleeperLeagueRosters = async (leagueId: string) => {
  try {
    console.log(`[Service] Fetching rosters for league ${leagueId}...`);
    const rosters = await getLeagueRosters(leagueId);
    return { 
      success: true, 
      data: rosters,
      source: 'sleeperService'
    };
  } catch (error) {
    console.error('[Service] Error fetching league rosters:', error);
    return { success: false, data: [] };
  }
};

/**
 * Fetch all players using the actual sleeperService
 */
export const fetchSleeperAllPlayers = async (sport = 'nba') => {
  try {
    console.log(`[Service] Fetching all players from Sleeper...`);
    const players = await getAllPlayers(sport);
    return { 
      success: true, 
      data: players,
      source: 'sleeperService'
    };
  } catch (error) {
    console.error('[Service] Error fetching players from Sleeper:', error);
    return { success: false, data: {} };
  }
};

// ============= DRAFT ENDPOINTS (via backend) =============

/**
 * Fetch draft rankings from the backend
 * The backend should be using your services and nba_static.py
 */
export const fetchDraftRankings = async (sport: string, pick: number, strategy: string, limit: number = 3) => {
  try {
    console.log(`[Service] Fetching draft rankings from backend for pick ${pick}...`);
    const response = await axios.get(
      `${NODE_API_BASE}/api/draft/rankings?sport=${sport}&pick=${pick}&limit=${limit}&strategy=${strategy}`
    );
    return response.data;
  } catch (error) {
    console.error('[Service] Error fetching draft rankings:', error);
    throw error;
  }
};

/**
 * Fetch draft history from the backend
 */
export const fetchDraftHistory = async (userId: string, sport: string) => {
  try {
    console.log(`[Service] Fetching draft history for user ${userId}...`);
    const response = await axios.get(
      `${NODE_API_BASE}/api/draft/history?userId=${userId}&sport=${sport.toUpperCase()}`
    );
    return response.data;
  } catch (error) {
    console.error('[Service] Error fetching draft history:', error);
    throw error;
  }
};

// ============= PLAYER PROPS FROM PYTHON BACKEND =============

/**
 * Fetch player props from the Python backend
 */
export const fetchPlayerProps = async (sport: string = 'nba', limit: number = 200) => {
  try {
    console.log(`[Service] Fetching player props from Python backend...`);
    const response = await axios.get(`${PYTHON_API_BASE}/api/fantasy/props?sport=${sport}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('[Service] Error fetching player props:', error);
    throw error;
  }
};

// Export all functions as a default object for convenience
export default {
  fetchTank01ADP,
  fetchTank01Injuries,
  fetchTank01News,
  fetchTank01DepthCharts,
  fetchTank01GamesForDate,
  fetchTank01PlayerList,
  fetchSleeperUserLeagues,
  fetchSleeperLeagueRosters,
  fetchSleeperAllPlayers,
  fetchDraftRankings,
  fetchDraftHistory,
  fetchPlayerProps
};
