import { useState, useEffect, useCallback } from 'react';

const useSportsWire = (sport: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const endpoint = `${baseUrl}/api/sports-wire/enhanced?sport=${sport.toLowerCase()}&include_beat_writers=true&include_injuries=true&_t=${timestamp}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result.news || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
};

export default useSportsWire;
