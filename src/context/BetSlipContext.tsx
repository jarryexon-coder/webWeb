import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// ========== Type Definitions ==========
export interface BetSelection {
  id: string;
  player: string;
  market: string;
  line: number;
  odds: number; // American odds (e.g., -110, +150)
  type: 'over' | 'under' | 'spread' | 'moneyline';
  sport: string;
  team?: string;
  opponent?: string;
  gameTime?: string;
  bookmaker?: string;
  confidence?: number;
}

export interface BetSlipState {
  selections: BetSelection[];
  totalOdds: number; // American odds (calculated)
  totalStake: number; // in dollars
  potentialPayout: number;
  maxSelections: number;
}

type BetSlipAction =
  | { type: 'ADD_SELECTION'; payload: BetSelection }
  | { type: 'REMOVE_SELECTION'; payload: { id: string } }
  | { type: 'CLEAR_BETSLIP' }
  | { type: 'SET_STAKE'; payload: { stake: number } }
  | { type: 'REORDER_SELECTIONS'; payload: { selections: BetSelection[] } };

// ========== Constants ==========
const STORAGE_KEY = 'fantasy-bet-slip';
const DEFAULT_MAX_SELECTIONS = 10;

// ========== Helper Functions ==========
const calculateTotalOdds = (selections: BetSelection[]): number => {
  if (selections.length === 0) return 0;
  if (selections.length === 1) return selections[0].odds;

  // Convert American odds to decimal, multiply, convert back
  const decimalOdds = selections.map((sel) => {
    if (sel.odds > 0) return 1 + sel.odds / 100;
    else return 1 + 100 / Math.abs(sel.odds);
  });
  const totalDecimal = decimalOdds.reduce((acc, curr) => acc * curr, 1);
  if (totalDecimal >= 2) {
    return Math.round((totalDecimal - 1) * 100);
  } else {
    return Math.round(-100 / (totalDecimal - 1));
  }
};

const calculatePayout = (stake: number, odds: number): number => {
  if (odds > 0) {
    return stake + stake * (odds / 100);
  } else {
    return stake + stake * (100 / Math.abs(odds));
  }
};

// ========== Initial State ==========
const initialState: BetSlipState = {
  selections: [],
  totalOdds: 0,
  totalStake: 0,
  potentialPayout: 0,
  maxSelections: DEFAULT_MAX_SELECTIONS,
};

// ========== Reducer ==========
const betSlipReducer = (
  state: BetSlipState,
  action: BetSlipAction
): BetSlipState => {
  let newSelections: BetSelection[];
  let newTotalOdds: number;
  let newPayout: number;

  switch (action.type) {
    case 'ADD_SELECTION':
      // Prevent duplicate selections (by id)
      if (state.selections.some((sel) => sel.id === action.payload.id)) {
        return state;
      }
      if (state.selections.length >= state.maxSelections) {
        return state; // or show error via toast later
      }
      newSelections = [...state.selections, action.payload];
      newTotalOdds = calculateTotalOdds(newSelections);
      newPayout = calculatePayout(state.totalStake, newTotalOdds);
      return {
        ...state,
        selections: newSelections,
        totalOdds: newTotalOdds,
        potentialPayout: newPayout,
      };

    case 'REMOVE_SELECTION':
      newSelections = state.selections.filter(
        (sel) => sel.id !== action.payload.id
      );
      newTotalOdds = calculateTotalOdds(newSelections);
      newPayout = calculatePayout(state.totalStake, newTotalOdds);
      return {
        ...state,
        selections: newSelections,
        totalOdds: newTotalOdds,
        potentialPayout: newPayout,
      };

    case 'CLEAR_BETSLIP':
      return {
        ...initialState,
        selections: [],
        totalOdds: 0,
        totalStake: 0,
        potentialPayout: 0,
      };

    case 'SET_STAKE':
      newPayout = calculatePayout(action.payload.stake, state.totalOdds);
      return {
        ...state,
        totalStake: action.payload.stake,
        potentialPayout: newPayout,
      };

    case 'REORDER_SELECTIONS':
      newSelections = action.payload.selections;
      newTotalOdds = calculateTotalOdds(newSelections);
      newPayout = calculatePayout(state.totalStake, newTotalOdds);
      return {
        ...state,
        selections: newSelections,
        totalOdds: newTotalOdds,
        potentialPayout: newPayout,
      };

    default:
      return state;
  }
};

// ========== Context ==========
interface BetSlipContextValue extends BetSlipState {
  addSelection: (selection: BetSelection) => void;
  removeSelection: (id: string) => void;
  clearBetSlip: () => void;
  setStake: (stake: number) => void;
  reorderSelections: (selections: BetSelection[]) => void;
  isSelectionInSlip: (id: string) => boolean;
}

const BetSlipContext = createContext<BetSlipContextValue | undefined>(undefined);

// ========== Provider ==========
interface BetSlipProviderProps {
  children: ReactNode;
  maxSelections?: number;
}

export const BetSlipProvider: React.FC<BetSlipProviderProps> = ({
  children,
  maxSelections = DEFAULT_MAX_SELECTIONS,
}) => {
  const [state, dispatch] = useReducer(betSlipReducer, {
    ...initialState,
    maxSelections,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate shape (basic)
        if (Array.isArray(parsed.selections)) {
          // Restore state
          parsed.selections.forEach((sel: BetSelection) => {
            dispatch({ type: 'ADD_SELECTION', payload: sel });
          });
          if (typeof parsed.totalStake === 'number') {
            dispatch({ type: 'SET_STAKE', payload: { stake: parsed.totalStake } });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load bet slip from localStorage:', error);
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    try {
      const toStore = {
        selections: state.selections,
        totalStake: state.totalStake,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save bet slip to localStorage:', error);
    }
  }, [state.selections, state.totalStake]);

  const addSelection = (selection: BetSelection) => {
    dispatch({ type: 'ADD_SELECTION', payload: selection });
  };

  const removeSelection = (id: string) => {
    dispatch({ type: 'REMOVE_SELECTION', payload: { id } });
  };

  const clearBetSlip = () => {
    dispatch({ type: 'CLEAR_BETSLIP' });
  };

  const setStake = (stake: number) => {
    if (stake < 0) return;
    dispatch({ type: 'SET_STAKE', payload: { stake } });
  };

  const reorderSelections = (selections: BetSelection[]) => {
    dispatch({ type: 'REORDER_SELECTIONS', payload: { selections } });
  };

  const isSelectionInSlip = (id: string): boolean => {
    return state.selections.some((sel) => sel.id === id);
  };

  const value: BetSlipContextValue = {
    ...state,
    addSelection,
    removeSelection,
    clearBetSlip,
    setStake,
    reorderSelections,
    isSelectionInSlip,
  };

  return (
    <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>
  );
};

// ========== Hook ==========
export const useBetSlip = (): BetSlipContextValue => {
  const context = useContext(BetSlipContext);
  if (context === undefined) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};
