import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ------------------------------------------------------------
// Types (matching your Flask /api/parlay/suggestions response)
// ------------------------------------------------------------
export interface ParlayLeg {
  id: string;
  description: string;
  odds: string; // American odds, e.g. "-110"
  confidence: number;
  sport: string;
  market: string;
  player_name?: string;
  stat_type?: string;
  line?: number;
  value_side?: string;
  teams?: { home: string; away: string };
  confidence_level?: string;
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string;
  ai_metrics: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge: number;
  };
  timestamp: string;
  isToday: boolean;
  is_real_data: boolean;
  has_data: boolean;
}

interface ParlaySuggestionsResponse {
  success: boolean;
  suggestions: ParlaySuggestion[];
  count: number;
  timestamp: string;
  sport: string;
  is_real_data: boolean;
  has_data: boolean;
  message: string;
  version: string;
}

// ------------------------------------------------------------
// Bet Slip Types
// ------------------------------------------------------------
export interface BetSlipLeg extends ParlayLeg {
  // Additional fields for the slip (e.g., custom stake per leg)
  selectedStake?: number;
}

export interface BetSlip {
  id: string; // unique ID for this slip (timestamp + random)
  legs: BetSlipLeg[];
  totalOdds: string; // calculated
  totalStake: number;
  potentialPayout: number;
  createdAt: string;
}

type BetSlipAction =
  | { type: 'ADD_LEG'; payload: BetSlipLeg }
  | { type: 'REMOVE_LEG'; payload: { legId: string } }
  | { type: 'CLEAR_SLIP' }
  | { type: 'SET_STAKE'; payload: { legId: string; stake: number } }
  | { type: 'SET_TOTAL_STAKE'; payload: number };

// ------------------------------------------------------------
// Context Types
// ------------------------------------------------------------
export type SportFilter = 'all' | 'nba' | 'nfl' | 'mlb' | 'nhl';

interface ParlayContextType {
  // Suggestions
  suggestions: ParlaySuggestion[];
  isLoadingSuggestions: boolean;
  suggestionsError: Error | null;
  refetchSuggestions: () => Promise<void>;
  sportFilter: SportFilter;
  setSportFilter: (sport: SportFilter) => void;

  // Bet Slip
  currentSlip: BetSlip | null;
  addLeg: (leg: BetSlipLeg) => void;
  removeLeg: (legId: string) => void;
  clearSlip: () => void;
  updateLegStake: (legId: string, stake: number) => void;
  updateTotalStake: (stake: number) => void;

  // Utilities
  calculateParlayOdds: (legs: ParlayLeg[]) => string;
  calculatePayout: (stake: number, oddsAmerican: string) => number;
  formatOdds: (odds: string) => string;
  getTopSuggestions: (limit?: number) => ParlaySuggestion[];
}

// ------------------------------------------------------------
// API function
// ------------------------------------------------------------
const fetchParlaySuggestions = async (sport: SportFilter): Promise<ParlaySuggestionsResponse> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const params: Record<string, string> = {};
  if (sport !== 'all') {
    params.sport = sport;
  }
  const response = await axios.get(`${API_BASE_URL}/api/parlay/suggestions`, { params });
  return response.data;
};

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------
const americanToDecimal = (americanOdds: string): number => {
  const odds = parseInt(americanOdds, 10);
  if (odds > 0) {
    return odds / 100 + 1;
  }
  return 100 / Math.abs(odds) + 1;
};

const decimalToAmerican = (decimal: number): string => {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
};

const calculateParlayOddsFromLegs = (legs: ParlayLeg[]): string => {
  if (legs.length === 0) return '0';
  let decimalOdds = 1;
  legs.forEach((leg) => {
    decimalOdds *= americanToDecimal(leg.odds);
  });
  return decimalToAmerican(decimalOdds);
};

const calculatePayoutFromStake = (stake: number, americanOdds: string): number => {
  const decimal = americanToDecimal(americanOdds);
  return stake * decimal;
};

// ------------------------------------------------------------
// Reducer for Bet Slip
// ------------------------------------------------------------
const betSlipReducer = (state: BetSlip | null, action: BetSlipAction): BetSlip | null => {
  switch (action.type) {
    case 'ADD_LEG': {
      const newLeg = action.payload;
      if (!state) {
        // Create new slip
        const id = `slip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const legs = [newLeg];
        const totalOdds = calculateParlayOddsFromLegs(legs);
        const totalStake = 10; // default $10
        const potentialPayout = calculatePayoutFromStake(totalStake, totalOdds);
        return {
          id,
          legs,
          totalOdds,
          totalStake,
          potentialPayout,
          createdAt: new Date().toISOString(),
        };
      }
      // Prevent duplicate legs
      if (state.legs.some((leg) => leg.id === newLeg.id)) {
        return state;
      }
      const updatedLegs = [...state.legs, newLeg];
      const totalOdds = calculateParlayOddsFromLegs(updatedLegs);
      const potentialPayout = calculatePayoutFromStake(state.totalStake, totalOdds);
      return {
        ...state,
        legs: updatedLegs,
        totalOdds,
        potentialPayout,
      };
    }

    case 'REMOVE_LEG': {
      if (!state) return null;
      const filteredLegs = state.legs.filter((leg) => leg.id !== action.payload.legId);
      if (filteredLegs.length === 0) {
        return null; // Clear slip if no legs left
      }
      const totalOdds = calculateParlayOddsFromLegs(filteredLegs);
      const potentialPayout = calculatePayoutFromStake(state.totalStake, totalOdds);
      return {
        ...state,
        legs: filteredLegs,
        totalOdds,
        potentialPayout,
      };
    }

    case 'CLEAR_SLIP':
      return null;

    case 'SET_STAKE': {
      if (!state) return null;
      // Optionally support per-leg stake; here we just update the leg's stake (if needed for future)
      const updatedLegs = state.legs.map((leg) =>
        leg.id === action.payload.legId
          ? { ...leg, selectedStake: action.payload.stake }
          : leg
      );
      return {
        ...state,
        legs: updatedLegs,
      };
    }

    case 'SET_TOTAL_STAKE': {
      if (!state) return null;
      const potentialPayout = calculatePayoutFromStake(action.payload, state.totalOdds);
      return {
        ...state,
        totalStake: action.payload,
        potentialPayout,
      };
    }

    default:
      return state;
  }
};

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------
const ParlayContext = createContext<ParlayContextType | undefined>(undefined);

// ------------------------------------------------------------
// Provider Component
// ------------------------------------------------------------
export const ParlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sportFilter, setSportFilter] = React.useState<SportFilter>('all');
  const queryClient = useQueryClient();

  // Fetch suggestions
  const {
    data,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    refetch,
  } = useQuery<ParlaySuggestionsResponse, Error>({
    queryKey: ['parlay-suggestions', sportFilter],
    queryFn: () => fetchParlaySuggestions(sportFilter),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });

  const suggestions = useMemo(() => data?.suggestions ?? [], [data]);

  // Bet slip state (persisted to localStorage)
  const [currentSlip, dispatch] = useReducer(betSlipReducer, null, () => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem('parlay-slip');
      if (stored) {
        return JSON.parse(stored) as BetSlip;
      }
    } catch (e) {
      console.error('Failed to load bet slip from localStorage', e);
    }
    return null;
  });

  // Persist bet slip to localStorage
  useEffect(() => {
    if (currentSlip) {
      localStorage.setItem('parlay-slip', JSON.stringify(currentSlip));
    } else {
      localStorage.removeItem('parlay-slip');
    }
  }, [currentSlip]);

  // Actions
  const addLeg = useCallback((leg: BetSlipLeg) => {
    dispatch({ type: 'ADD_LEG', payload: leg });
  }, []);

  const removeLeg = useCallback((legId: string) => {
    dispatch({ type: 'REMOVE_LEG', payload: { legId } });
  }, []);

  const clearSlip = useCallback(() => {
    dispatch({ type: 'CLEAR_SLIP' });
  }, []);

  const updateLegStake = useCallback((legId: string, stake: number) => {
    dispatch({ type: 'SET_STAKE', payload: { legId, stake } });
  }, []);

  const updateTotalStake = useCallback((stake: number) => {
    dispatch({ type: 'SET_TOTAL_STAKE', payload: stake });
  }, []);

  // Utilities
  const calculateParlayOdds = useCallback((legs: ParlayLeg[]) => {
    return calculateParlayOddsFromLegs(legs);
  }, []);

  const calculatePayout = useCallback((stake: number, oddsAmerican: string) => {
    return calculatePayoutFromStake(stake, oddsAmerican);
  }, []);

  const formatOdds = useCallback((odds: string): string => {
    if (!odds) return 'N/A';
    return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
  }, []);

  const getTopSuggestions = useCallback(
    (limit: number = 3): ParlaySuggestion[] => {
      return suggestions.slice(0, limit);
    },
    [suggestions]
  );

  const refetchSuggestions = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value: ParlayContextType = {
    suggestions,
    isLoadingSuggestions,
    suggestionsError: suggestionsError || null,
    refetchSuggestions,
    sportFilter,
    setSportFilter,
    currentSlip,
    addLeg,
    removeLeg,
    clearSlip,
    updateLegStake,
    updateTotalStake,
    calculateParlayOdds,
    calculatePayout,
    formatOdds,
    getTopSuggestions,
  };

  return <ParlayContext.Provider value={value}>{children}</ParlayContext.Provider>;
};

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------
export const useParlay = (): ParlayContextType => {
  const context = useContext(ParlayContext);
  if (context === undefined) {
    throw new Error('useParlay must be used within a ParlayProvider');
  }
  return context;
};

// ------------------------------------------------------------
// Prefetch utility
// ------------------------------------------------------------
export const usePrefetchParlay = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (sport: SportFilter) => {
      queryClient.prefetchQuery({
        queryKey: ['parlay-suggestions', sport],
        queryFn: () => fetchParlaySuggestions(sport),
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );
};
