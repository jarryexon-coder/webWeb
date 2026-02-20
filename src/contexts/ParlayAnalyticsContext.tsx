import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { analyticsService } from '../services/analytics.service';

interface ParlayAnalyticsState {
  favoriteProps: any[];
  savedCorrelatedParlays: any[];
  historicalPerformance: any;
  userPreferences: {
    defaultSport: string;
    defaultParlayType: string;
    showSharpMoney: boolean;
  };
}

type ParlayAnalyticsAction = 
  | { type: 'SAVE_CORRELATED_PARLAY'; payload: any }
  | { type: 'REMOVE_CORRELATED_PARLAY'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: any }
  | { type: 'SET_FAVORITE_PROPS'; payload: any[] };

const initialState: ParlayAnalyticsState = {
  favoriteProps: [],
  savedCorrelatedParlays: [],
  historicalPerformance: {},
  userPreferences: {
    defaultSport: 'all',
    defaultParlayType: 'standard',
    showSharpMoney: true
  }
};

const ParlayAnalyticsContext = createContext<{
  state: ParlayAnalyticsState;
  dispatch: React.Dispatch<ParlayAnalyticsAction>;
  saveParlay: (parlay: any) => void;
  trackPropPerformance: (propId: string, result: boolean) => void;
} | null>(null);

function parlayAnalyticsReducer(
  state: ParlayAnalyticsState,
  action: ParlayAnalyticsAction
): ParlayAnalyticsState {
  switch (action.type) {
    case 'SAVE_CORRELATED_PARLAY':
      return {
        ...state,
        savedCorrelatedParlays: [...state.savedCorrelatedParlays, action.payload]
      };
    case 'REMOVE_CORRELATED_PARLAY':
      return {
        ...state,
        savedCorrelatedParlays: state.savedCorrelatedParlays.filter(
          p => p.id !== action.payload
        )
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
    case 'SET_FAVORITE_PROPS':
      return {
        ...state,
        favoriteProps: action.payload
      };
    default:
      return state;
  }
}

export const ParlayAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(parlayAnalyticsReducer, initialState);

  const saveParlay = (parlay: any) => {
    dispatch({ type: 'SAVE_CORRELATED_PARLAY', payload: parlay });
  };

  const trackPropPerformance = (propId: string, result: boolean) => {
    // Track prop bet performance for future edge calculations
    console.log(`Prop ${propId}: ${result ? 'won' : 'lost'}`);
  };

  return (
    <ParlayAnalyticsContext.Provider value={{ state, dispatch, saveParlay, trackPropPerformance }}>
      {children}
    </ParlayAnalyticsContext.Provider>
  );
};

export const useParlayAnalyticsContext = () => {
  const context = useContext(ParlayAnalyticsContext);
  if (!context) {
    throw new Error('useParlayAnalyticsContext must be used within ParlayAnalyticsProvider');
  }
  return context;
};
