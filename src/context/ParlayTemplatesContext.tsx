import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// ========== Type Definitions ==========
export interface ParlayLeg {
  id: string;
  description: string;
  odds: number;
  sport: string;
  market: string;
  player?: string;
  line?: number;
  type?: string;
}

export interface ParlayTemplate {
  id: string;
  name: string;
  createdAt: string;
  legs: ParlayLeg[];
  totalOdds: number;
  bookmaker?: string;
  tags?: string[];
}

export interface ParlayTemplatesState {
  templates: ParlayTemplate[];
}

type ParlayTemplatesAction =
  | { type: 'ADD_TEMPLATE'; payload: ParlayTemplate }
  | { type: 'REMOVE_TEMPLATE'; payload: { id: string } }
  | { type: 'UPDATE_TEMPLATE'; payload: { id: string; updates: Partial<ParlayTemplate> } }
  | { type: 'SET_TEMPLATES'; payload: { templates: ParlayTemplate[] } };

// ========== Constants ==========
const STORAGE_KEY = 'parlay-templates';

// ========== Helper Functions ==========
const calculateTotalOdds = (legs: ParlayLeg[]): number => {
  if (legs.length === 0) return 0;
  if (legs.length === 1) return legs[0].odds;

  const decimalOdds = legs.map((leg) => {
    if (leg.odds > 0) return 1 + leg.odds / 100;
    return 1 + 100 / Math.abs(leg.odds);
  });
  const totalDecimal = decimalOdds.reduce((acc, curr) => acc * curr, 1);
  if (totalDecimal >= 2) {
    return Math.round((totalDecimal - 1) * 100);
  }
  return Math.round(-100 / (totalDecimal - 1));
};

// ========== Initial State ==========
const initialState: ParlayTemplatesState = {
  templates: [],
};

// ========== Reducer ==========
const parlayTemplatesReducer = (
  state: ParlayTemplatesState,
  action: ParlayTemplatesAction
): ParlayTemplatesState => {
  switch (action.type) {
    case 'ADD_TEMPLATE':
      return {
        ...state,
        templates: [...state.templates, action.payload],
      };

    case 'REMOVE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload.id),
      };

    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'SET_TEMPLATES':
      return {
        ...state,
        templates: action.payload.templates,
      };

    default:
      return state;
  }
};

// ========== Context ==========
interface ParlayTemplatesContextValue extends ParlayTemplatesState {
  addTemplate: (template: Omit<ParlayTemplate, 'id' | 'createdAt'>) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<ParlayTemplate>) => void;
  loadTemplates: () => void;
  saveTemplates: () => void;
  getTemplateById: (id: string) => ParlayTemplate | undefined;
}

const ParlayTemplatesContext = createContext<ParlayTemplatesContextValue | undefined>(undefined);

// ========== Provider ==========
interface ParlayTemplatesProviderProps {
  children: ReactNode;
}

export const ParlayTemplatesProvider: React.FC<ParlayTemplatesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(parlayTemplatesReducer, initialState);

  // Load templates from localStorage on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    saveTemplates();
  }, [state.templates]);

  const addTemplate = (templateData: Omit<ParlayTemplate, 'id' | 'createdAt'>) => {
    const legs = templateData.legs.map((leg) => ({
      ...leg,
      id: leg.id || `${Date.now()}-${Math.random()}`,
    }));
    const totalOdds = calculateTotalOdds(legs);
    const newTemplate: ParlayTemplate = {
      ...templateData,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      legs,
      totalOdds,
    };
    dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
  };

  const removeTemplate = (id: string) => {
    dispatch({ type: 'REMOVE_TEMPLATE', payload: { id } });
  };

  const updateTemplate = (id: string, updates: Partial<ParlayTemplate>) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: { id, updates } });
  };

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'SET_TEMPLATES', payload: { templates: parsed } });
        }
      }
    } catch (error) {
      console.error('Failed to load parlay templates from localStorage:', error);
    }
  };

  const saveTemplates = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.templates));
    } catch (error) {
      console.error('Failed to save parlay templates to localStorage:', error);
    }
  };

  const getTemplateById = (id: string): ParlayTemplate | undefined => {
    return state.templates.find((t) => t.id === id);
  };

  const value: ParlayTemplatesContextValue = {
    ...state,
    addTemplate,
    removeTemplate,
    updateTemplate,
    loadTemplates,
    saveTemplates,
    getTemplateById,
  };

  return (
    <ParlayTemplatesContext.Provider value={value}>
      {children}
    </ParlayTemplatesContext.Provider>
  );
};

// ========== Hook ==========
export const useParlayTemplates = (): ParlayTemplatesContextValue => {
  const context = useContext(ParlayTemplatesContext);
  if (context === undefined) {
    throw new Error('useParlayTemplates must be used within a ParlayTemplatesProvider');
  }
  return context;
};
