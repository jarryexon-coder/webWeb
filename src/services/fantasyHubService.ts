// nba-frontend-web/src/services/fantasyHubService.ts
import axios from 'axios';

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// All functions call your backend APIs which use the actual service files
export const fetchTank01ADP = async (sport = 'nba') => {
  const response = await axios.get(`${NODE_API_BASE}/api/tank01/adp?sport=${sport}`);
  return response.data;
};

export const fetchTank01Injuries = async () => {
  const response = await axios.get(`${NODE_API_BASE}/api/tank01/injuries`);
  return response.data;
};

export const fetchTank01News = async (maxItems = 5) => {
  const response = await axios.get(`${NODE_API_BASE}/api/tank01/news?max=${maxItems}`);
  return response.data;
};

export const fetchTank01GamesForDate = async (date: string) => {
  const tank01Date = date.replace(/-/g, '');
  const response = await axios.get(`${NODE_API_BASE}/api/tank01/games?date=${tank01Date}`);
  return response.data;
};

export const fetchDraftRankings = async (sport: string, pick: number, strategy: string, limit: number = 3) => {
  const response = await axios.get(
    `${NODE_API_BASE}/api/draft/rankings?sport=${sport}&pick=${pick}&limit=${limit}&strategy=${strategy}`
  );
  return response.data;
};

export const fetchDraftHistory = async (userId: string, sport: string) => {
  const response = await axios.get(
    `${NODE_API_BASE}/api/draft/history?userId=${userId}&sport=${sport.toUpperCase()}`
  );
  return response.data;
};

export const fetchPlayerProps = async (sport: string = 'nba', limit: number = 200) => {
  const response = await axios.get(`${PYTHON_API_BASE}/api/fantasy/props?sport=${sport}&limit=${limit}`);
  return response.data;
};
