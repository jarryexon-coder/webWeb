// src/services/playerProps.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

export const playerPropsApi = {
  getProps: async (sport: string = 'nba', date?: string) => {
    const params = new URLSearchParams({ sport });
    if (date) params.append('date', date);
    const url = `${API_BASE}/api/player-props?${params}`;
    console.log(`🌐 Fetching from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();
    console.log('📦 API response:', data);
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch player props');
    }
    return data.props || [];
  }
};
