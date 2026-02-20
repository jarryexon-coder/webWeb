const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export const parlayApi = {
  getSuggestions: async (sport: string = 'all', limit: number = 6) => {
    const response = await fetch(`${API_BASE}/api/parlay/suggestions?sport=${sport}&limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  },
  getAnalytics: async (sport: string = 'all') => {
    const response = await fetch(`${API_BASE}/api/parlay/analytics?sport=${sport}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  }
};
