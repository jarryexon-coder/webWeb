// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

export const api = {
  baseUrl: API_BASE_URL,
  async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
  }
};

export default api;
