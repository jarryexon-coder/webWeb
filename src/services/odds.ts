const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export const oddsApi = {
  getAltLines: async (params: Record<string, any>) => {
    const url = new URL(`${API_BASE}/api/odds/basketball_nba`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  }
};
