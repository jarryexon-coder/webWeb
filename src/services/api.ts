// src/services/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

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
