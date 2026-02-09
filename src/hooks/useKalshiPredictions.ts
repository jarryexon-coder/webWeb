import { useState, useEffect } from 'react';
import axios from 'axios';

interface KalshiPrediction {
  id: string;
  market: string;  // This is actually the question
  category: string;
  yesPrice: number;
  noPrice: number;
  volume?: string | number;
  closeDate?: string;
  confidence?: number;
  trend?: string;
  // Additional fields we might want
  analysis?: string;
  expires?: string;
  edge?: string;
}

interface UseKalshiPredictionsReturn {
  data: KalshiPrediction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useKalshiPredictions = (): UseKalshiPredictionsReturn => {
  const [data, setData] = useState<KalshiPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKalshiPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://pleasing-determination-production.up.railway.app';
      const response = await axios.get(`${apiUrl}/api/kalshi/predictions`);
      
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
      console.error('❌ Kalshi API Error:', err);
      setError(err.message || 'Failed to fetch Kalshi predictions');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKalshiPredictions();
    
    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(fetchKalshiPredictions, 30000);
    return () => clearInterval(interval);
  }, []);

  const refetch = async () => {
    await fetchKalshiPredictions();
  };

  return { data, loading, error, refetch };
};
