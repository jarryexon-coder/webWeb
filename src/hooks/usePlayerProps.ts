// src/hooks/usePlayerProps.ts
import { useState, useEffect, useCallback } from 'react';

export const usePlayerProps = () => {
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerProps = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call your Python backend for player props
      const response = await fetch('/api/player/props');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player props: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.props)) {
        setPlayerProps(data.props);
      } else {
        // Fallback to your 300+ player database
        throw new Error('No props available, using fallback');
      }
    } catch (err: any) {
      console.log('Using player database fallback');
      // In a real implementation, fetch from your player database
      setPlayerProps([]); // Placeholder
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayerProps();
  }, [fetchPlayerProps]);

  return {
    playerProps,
    loading,
    error,
    refetch: fetchPlayerProps
  };
};
