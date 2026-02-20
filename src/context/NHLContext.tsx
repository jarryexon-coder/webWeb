// src/context/NHLContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface NHLState {
  selectedDate: string;
  selectedGame: any | null;
  viewMode: 'games' | 'props' | 'parlays' | 'fantasy' | 'standings';
  showFourNations: boolean;
  favorites: string[];
}

const initialState: NHLState = {
  selectedDate: new Date().toISOString().split('T')[0],
  selectedGame: null,
  viewMode: 'games',
  showFourNations: true,
  favorites: []
};

// 👇 Define the missing reducer
const nhlReducer = (state: NHLState, action: any) => {
  // For now, just return state (no actions defined)
  // You can add cases later
  return state;
};

const NHLContext = createContext<any>(null);

export const NHLProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(nhlReducer, initialState);

  return (
    <NHLContext.Provider value={{ state, dispatch }}>
      {children}
    </NHLContext.Provider>
  );
};

export const useNHL = () => useContext(NHLContext);
