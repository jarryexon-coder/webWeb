const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export const rookiesApi = {
  getRookies: async (sport: string = 'all', limit: number = 20) => {
    const response = await fetch(`${API_BASE}/api/rookies?sport=${sport}&limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  }
};
