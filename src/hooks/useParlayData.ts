// src/hooks/useParlayData.ts
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

const fetchParlays = async () => {
  const response = await fetch(`${API_BASE}/api/parlay/suggestions`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch parlays: ${response.status}`);
  }
  
  return response.json();
};

export const useParlayData = (options = {}) => {
  return useQuery({
    queryKey: ['parlays'],
    queryFn: fetchParlays,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Optional: Create a hook for specific sport parlays
export const useParlayDataBySport = (sport = 'all', options = {}) => {
  const fetchParlaysBySport = async () => {
    const response = await fetch(
      `${API_BASE}/api/parlay/suggestions?sport=${sport}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sport} parlays: ${response.status}`);
    }
    
    return response.json();
  };

  return useQuery({
    queryKey: ['parlays', sport],
    queryFn: fetchParlaysBySport,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
};
