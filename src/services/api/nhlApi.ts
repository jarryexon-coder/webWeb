// NHL API client for February 2026 data
import AsyncStorage from '@react-native-async-storage/async-storage';

const NHL_API_BASE = 'https://python-api-fresh-production.up.railway.app/api/nhl';

export const nhlApi = {
  // Get games for specific date
  getGames: async (date: string, includeProps = true, includeParlays = true) => {
    const url = `${NHL_API_BASE}/games?date=${date}&props=${includeProps}&parlay_ready=${includeParlays}`;
    const response = await fetch(url);
    return response.json();
  },

  // Get single game details
  getGameDetails: async (gameId: string) => {
    const url = `${NHL_API_BASE}/games/${gameId}`;
    const response = await fetch(url);
    return response.json();
  },

  // Get player props for game
  getPlayerProps: async (gameId: string) => {
    const url = `${NHL_API_BASE}/games/${gameId}/props`;
    const response = await fetch(url);
    return response.json();
  },

  // Get NHL standings
  getStandings: async () => {
    const url = `${NHL_API_BASE}/standings`;
    const response = await fetch(url);
    return response.json();
  }
};
