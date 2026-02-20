const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

const api = {
  baseURL: API_BASE,
  getTennisPlayers: async (tour?: 'ATP' | 'WTA') => {
    const params = tour ? `?tour=${tour}` : '';
    const response = await fetch(`${API_BASE}/api/tennis/players${params}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  }
};

console.log('All import.meta.env:', import.meta.env);

console.log('VITE_API_BASE from env:', import.meta.env.VITE_API_BASE);

export default api;
