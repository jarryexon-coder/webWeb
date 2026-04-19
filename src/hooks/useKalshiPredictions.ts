import { useState, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';

interface KalshiPrediction {
  id: string;
  market: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume?: string | number;
  closeDate?: string;
  confidence?: number;
  trend?: string;
  analysis?: string;
  expires?: string;
  edge?: string;
}

export const useKalshiPredictions = (): {
  data: KalshiPrediction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} => {
  const [data, setData] = useState<KalshiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelTokenSourceRef = useRef<CancelTokenSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const fetchKalshiPredictions = async () => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Request replaced by new fetch');
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const source = axios.CancelToken.source();
    cancelTokenSourceRef.current = source;

    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_BASE_PYTHON || import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
      const url = `${apiUrl}/api/kalshi/predictions`;
      console.log('📡 Fetching Kalshi predictions from:', url);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timed out after 10 seconds'));
        }, 10000);
      });

      const responsePromise = axios.get(url, { cancelToken: source.token });
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      console.log('🔍 Kalshi API Response:', response.data);

      if (response.data.success) {
        if (response.data.predictions && Array.isArray(response.data.predictions)) {
          setData(response.data.predictions);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          console.warn('⚠️ Kalshi API returned success but no array found');
          setData([]);
        }
      } else {
        console.warn('⚠️ Kalshi API returned success=false');
        setData([]);
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log('✅ Kalshi request cancelled');
      } else {
        console.error('❌ Kalshi API Error:', err);
        setError(err.message || 'Failed to fetch Kalshi predictions');
        setData([]);
      }
    } finally {
      setLoading(false);
      cancelTokenSourceRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    fetchKalshiPredictions();
    return () => {
      if (cancelTokenSourceRef.current) cancelTokenSourceRef.current.cancel('Component unmounted');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const refetch = async () => {
    await fetchKalshiPredictions();
  };

  return { data, loading, error, refetch };
};
