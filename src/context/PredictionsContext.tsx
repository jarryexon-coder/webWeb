import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ------------------------------------------------------------
// Types (matching your Flask /api/predictions response)
// ------------------------------------------------------------
export interface Prediction {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: 'Low' | 'Medium' | 'High';
  analysis: string;
  expires: string;
  confidence: number;
  edge: string;
  platform: 'kalshi' | 'custom';
  marketType: 'binary' | 'multiple';
  sport?: string;
  player?: string;
  team?: string;
}

interface PredictionsResponse {
  success: boolean;
  predictions: Prediction[];
  count: number;
  timestamp: string;
  is_real_data: boolean;
  has_data: boolean;
  data_source: string;
  platform: string;
}

// ------------------------------------------------------------
// Context Types
// ------------------------------------------------------------
type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'all';

interface PredictionsContextType {
  // Current sport filter
  sport: Sport;
  setSport: (sport: Sport) => void;

  // Predictions data
  predictions: Prediction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;

  // Derived data
  predictionsByCategory: Record<string, Prediction[]>;
  getPredictionsBySport: (sport: string) => Prediction[];
  getPredictionsByCategory: (category: string) => Prediction[];
  getPredictionById: (id: string) => Prediction | undefined;
}

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------
const PredictionsContext = createContext<PredictionsContextType | undefined>(undefined);

// ------------------------------------------------------------
// API function
// ------------------------------------------------------------
const fetchPredictions = async (sport: Sport): Promise<PredictionsResponse> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const params: Record<string, string> = {};
  if (sport !== 'all') {
    params.sport = sport;
  }

  const response = await axios.get(`${API_BASE_URL}/api/predictions`, { params });
  return response.data;
};

// ------------------------------------------------------------
// Provider Component
// ------------------------------------------------------------
export const PredictionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sport, setSport] = useState<Sport>('nba');
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<PredictionsResponse, Error>({
    queryKey: ['predictions', sport],
    queryFn: () => fetchPredictions(sport),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    placeholderData: (previousData) => previousData, // keep previous data while fetching
  });

  // Safely extract predictions array
  const predictions = useMemo(() => data?.predictions ?? [], [data]);

  // Refetch with proper error handling
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Prefetch other sports when idle
  const prefetchSport = useCallback(
    (sportToPrefetch: Sport) => {
      if (sportToPrefetch !== sport) {
        queryClient.prefetchQuery({
          queryKey: ['predictions', sportToPrefetch],
          queryFn: () => fetchPredictions(sportToPrefetch),
          staleTime: 5 * 60 * 1000,
        });
      }
    },
    [queryClient, sport]
  );

  // ---------- Helper functions ----------
  const predictionsByCategory = useMemo(() => {
    return predictions.reduce<Record<string, Prediction[]>>((acc, pred) => {
      if (!acc[pred.category]) {
        acc[pred.category] = [];
      }
      acc[pred.category].push(pred);
      return acc;
    }, {});
  }, [predictions]);

  const getPredictionsBySport = useCallback(
    (targetSport: string) => {
      return predictions.filter((p) => p.sport === targetSport || !p.sport);
    },
    [predictions]
  );

  const getPredictionsByCategory = useCallback(
    (category: string) => {
      return predictions.filter((p) => p.category === category);
    },
    [predictions]
  );

  const getPredictionById = useCallback(
    (id: string) => {
      return predictions.find((p) => p.id === id);
    },
    [predictions]
  );

  const value: PredictionsContextType = {
    sport,
    setSport,
    predictions,
    isLoading,
    error: error || null,
    refetch,
    predictionsByCategory,
    getPredictionsBySport,
    getPredictionsByCategory,
    getPredictionById,
  };

  return (
    <PredictionsContext.Provider value={value}>
      {children}
    </PredictionsContext.Provider>
  );
};

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------
export const usePredictions = (): PredictionsContextType => {
  const context = useContext(PredictionsContext);
  if (context === undefined) {
    throw new Error('usePredictions must be used within a PredictionsProvider');
  }
  return context;
};

// ------------------------------------------------------------
// Optional: Prefetch utility (can be used in layout)
// ------------------------------------------------------------
export const usePrefetchPredictions = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (sport: Sport) => {
      queryClient.prefetchQuery({
        queryKey: ['predictions', sport],
        queryFn: () => fetchPredictions(sport),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );
};
