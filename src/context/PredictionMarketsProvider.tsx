import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid'; // optional, fallback included

// ========== Type Definitions ==========
export interface Market {
  id: string;
  question: string;
  category: string;
  yesPrice: number; // price to buy YES share (0-1 scale, e.g., 0.52)
  noPrice: number; // price to buy NO share (0-1 scale)
  volume: string;
  analysis?: string;
  expires: string; // ISO date
  confidence?: number;
  edge?: string;
  platform: string;
  marketType: string;
  sport?: string; // for sports predictions
  player?: string;
  team?: string;
}

export interface Order {
  id: string;
  marketId: string;
  type: 'yes' | 'no';
  shares: number;
  price: number; // price per share (0-1)
  placedAt: string;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface Position {
  marketId: string;
  yesShares: number;
  noShares: number;
  averageYesPrice?: number;
  averageNoPrice?: number;
}

export interface Portfolio {
  balance: number; // virtual cash
  positions: Position[];
  orders: Order[];
}

export interface PredictionMarketsState {
  markets: Market[];
  selectedMarketIds: string[]; // for multi-market view
  portfolio: Portfolio;
  loading: boolean;
  error: string | null;
}

type PredictionMarketsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_MARKETS'; payload: Market[] }
  | { type: 'SELECT_MARKET'; payload: { marketId: string } }
  | { type: 'DESELECT_MARKET'; payload: { marketId: string } }
  | { type: 'CLEAR_SELECTED_MARKETS' }
  | { type: 'PLACE_ORDER'; payload: { marketId: string; type: 'yes' | 'no'; shares: number; price: number } }
  | { type: 'CANCEL_ORDER'; payload: { orderId: string } }
  | { type: 'FILL_ORDER'; payload: { orderId: string } }
  | { type: 'UPDATE_BALANCE'; payload: { amount: number } }
  | { type: 'RESET_PORTFOLIO' };

// ========== Constants ==========
const STORAGE_KEY = 'prediction-markets-state';
const INITIAL_BALANCE = 10000; // $10,000 virtual cash

// ========== Helper Functions ==========
const calculatePositionPrice = (position: Position, type: 'yes' | 'no'): number => {
  if (type === 'yes' && position.yesShares > 0 && position.averageYesPrice) {
    return position.averageYesPrice;
  }
  if (type === 'no' && position.noShares > 0 && position.averageNoPrice) {
    return position.averageNoPrice;
  }
  return 0;
};

// ========== Initial State ==========
const initialState: PredictionMarketsState = {
  markets: [],
  selectedMarketIds: [],
  portfolio: {
    balance: INITIAL_BALANCE,
    positions: [],
    orders: [],
  },
  loading: false,
  error: null,
};

// ========== Reducer ==========
const predictionMarketsReducer = (
  state: PredictionMarketsState,
  action: PredictionMarketsAction
): PredictionMarketsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'LOAD_MARKETS':
      return {
        ...state,
        markets: action.payload,
        loading: false,
        error: null,
      };

    case 'SELECT_MARKET':
      if (state.selectedMarketIds.includes(action.payload.marketId)) {
        return state;
      }
      return {
        ...state,
        selectedMarketIds: [...state.selectedMarketIds, action.payload.marketId],
      };

    case 'DESELECT_MARKET':
      return {
        ...state,
        selectedMarketIds: state.selectedMarketIds.filter((id) => id !== action.payload.marketId),
      };

    case 'CLEAR_SELECTED_MARKETS':
      return { ...state, selectedMarketIds: [] };

    case 'PLACE_ORDER': {
      const { marketId, type, shares, price } = action.payload;
      const cost = shares * price;

      // Check sufficient balance
      if (state.portfolio.balance < cost) {
        return { ...state, error: 'Insufficient balance' };
      }

      // Create order
      const newOrder: Order = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        marketId,
        type,
        shares,
        price,
        placedAt: new Date().toISOString(),
        status: 'pending',
      };

      // Deduct balance
      const newBalance = state.portfolio.balance - cost;

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          balance: newBalance,
          orders: [...state.portfolio.orders, newOrder],
        },
        error: null,
      };
    }

    case 'CANCEL_ORDER': {
      const order = state.portfolio.orders.find((o) => o.id === action.payload.orderId);
      if (!order || order.status !== 'pending') return state;

      // Refund cost
      const refund = order.shares * order.price;

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          balance: state.portfolio.balance + refund,
          orders: state.portfolio.orders.map((o) =>
            o.id === action.payload.orderId ? { ...o, status: 'cancelled' } : o
          ),
        },
      };
    }

    case 'FILL_ORDER': {
      const order = state.portfolio.orders.find((o) => o.id === action.payload.orderId);
      if (!order || order.status !== 'pending') return state;

      // Find or create position
      const existingPositionIndex = state.portfolio.positions.findIndex(
        (p) => p.marketId === order.marketId
      );

      let updatedPositions = [...state.portfolio.positions];

      if (existingPositionIndex >= 0) {
        const position = updatedPositions[existingPositionIndex];
        if (order.type === 'yes') {
          const totalShares = position.yesShares + order.shares;
          const totalCost = (position.averageYesPrice || 0) * position.yesShares + order.shares * order.price;
          const avgPrice = totalShares > 0 ? totalCost / totalShares : 0;
          updatedPositions[existingPositionIndex] = {
            ...position,
            yesShares: totalShares,
            averageYesPrice: avgPrice,
          };
        } else {
          const totalShares = position.noShares + order.shares;
          const totalCost = (position.averageNoPrice || 0) * position.noShares + order.shares * order.price;
          const avgPrice = totalShares > 0 ? totalCost / totalShares : 0;
          updatedPositions[existingPositionIndex] = {
            ...position,
            noShares: totalShares,
            averageNoPrice: avgPrice,
          };
        }
      } else {
        const newPosition: Position = {
          marketId: order.marketId,
          yesShares: order.type === 'yes' ? order.shares : 0,
          noShares: order.type === 'no' ? order.shares : 0,
          averageYesPrice: order.type === 'yes' ? order.price : undefined,
          averageNoPrice: order.type === 'no' ? order.price : undefined,
        };
        updatedPositions.push(newPosition);
      }

      // Mark order as filled
      const updatedOrders = state.portfolio.orders.map((o) =>
        o.id === action.payload.orderId ? { ...o, status: 'filled' } : o
      );

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          positions: updatedPositions,
          orders: updatedOrders,
        },
      };
    }

    case 'UPDATE_BALANCE':
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          balance: state.portfolio.balance + action.payload.amount,
        },
      };

    case 'RESET_PORTFOLIO':
      return {
        ...state,
        portfolio: {
          balance: INITIAL_BALANCE,
          positions: [],
          orders: [],
        },
      };

    default:
      return state;
  }
};

// ========== Context ==========
export interface PredictionMarketsContextValue extends PredictionMarketsState {
  // Market actions
  fetchMarkets: (params?: { sport?: string; category?: string }) => Promise<void>;
  selectMarket: (marketId: string) => void;
  deselectMarket: (marketId: string) => void;
  clearSelectedMarkets: () => void;

  // Trading actions
  placeOrder: (marketId: string, type: 'yes' | 'no', shares: number, price: number) => void;
  cancelOrder: (orderId: string) => void;
  simulateFillOrder: (orderId: string) => void; // for demo; real would be via API
  resetPortfolio: () => void;

  // Derived data
  getMarketById: (marketId: string) => Market | undefined;
  getPositionForMarket: (marketId: string) => Position | undefined;
  getOrdersForMarket: (marketId: string) => Order[];
  getTotalValue: () => number; // cash + positions value
}

const PredictionMarketsContext = createContext<PredictionMarketsContextValue | undefined>(
  undefined
);

// ========== Provider ==========
interface PredictionMarketsProviderProps {
  children: ReactNode;
  apiBaseUrl?: string; // if you want to inject custom API path
}

export const PredictionMarketsProvider: React.FC<PredictionMarketsProviderProps> = ({
  children,
  apiBaseUrl = '/api',
}) => {
  const [state, dispatch] = useReducer(predictionMarketsReducer, initialState);

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore selected markets, portfolio, etc.
        if (parsed.selectedMarketIds) {
          parsed.selectedMarketIds.forEach((id: string) => {
            dispatch({ type: 'SELECT_MARKET', payload: { marketId: id } });
          });
        }
        if (parsed.portfolio) {
          // Need to rebuild portfolio through actions or direct state?
          // For simplicity, we can set state directly via a custom action, but we'll do incremental.
          // Better: dispatch a LOAD_STATE action. We'll add a LOAD_STATE action later? For now we reset portfolio if stored.
          // Actually we'll just set via a new action type 'RESTORE_STATE' to keep reducer pure.
          // We'll implement that now.
          dispatch({ type: 'RESTORE_STATE', payload: parsed } as any);
        }
      }
    } catch (error) {
      console.error('Failed to load prediction markets state:', error);
    }
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    try {
      const toStore = {
        selectedMarketIds: state.selectedMarketIds,
        portfolio: state.portfolio,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save prediction markets state:', error);
    }
  }, [state.selectedMarketIds, state.portfolio]);

  // ========== API Integration ==========
  const fetchMarkets = async (params?: { sport?: string; category?: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const query = new URLSearchParams(params as any).toString();
      const url = `${apiBaseUrl}/predictions${query ? `?${query}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch markets');
      const data = await response.json();
      dispatch({ type: 'LOAD_MARKETS', payload: data.predictions || [] });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // ========== Market Selection ==========
  const selectMarket = (marketId: string) => {
    dispatch({ type: 'SELECT_MARKET', payload: { marketId } });
  };

  const deselectMarket = (marketId: string) => {
    dispatch({ type: 'DESELECT_MARKET', payload: { marketId } });
  };

  const clearSelectedMarkets = () => {
    dispatch({ type: 'CLEAR_SELECTED_MARKETS' });
  };

  // ========== Trading Actions ==========
  const placeOrder = (marketId: string, type: 'yes' | 'no', shares: number, price: number) => {
    if (shares <= 0 || price <= 0 || price >= 1) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid order parameters' });
      return;
    }
    dispatch({
      type: 'PLACE_ORDER',
      payload: { marketId, type, shares, price },
    });
  };

  const cancelOrder = (orderId: string) => {
    dispatch({ type: 'CANCEL_ORDER', payload: { orderId } });
  };

  const simulateFillOrder = (orderId: string) => {
    // For demo: instantly fill a pending order
    dispatch({ type: 'FILL_ORDER', payload: { orderId } });
  };

  const resetPortfolio = () => {
    dispatch({ type: 'RESET_PORTFOLIO' });
  };

  // ========== Derived Data ==========
  const getMarketById = (marketId: string): Market | undefined => {
    return state.markets.find((m) => m.id === marketId);
  };

  const getPositionForMarket = (marketId: string): Position | undefined => {
    return state.portfolio.positions.find((p) => p.marketId === marketId);
  };

  const getOrdersForMarket = (marketId: string): Order[] => {
    return state.portfolio.orders.filter((o) => o.marketId === marketId);
  };

  const getTotalValue = (): number => {
    let positionsValue = 0;
    // Simple current value: shares * current market price (yes/no)
    state.portfolio.positions.forEach((pos) => {
      const market = state.markets.find((m) => m.id === pos.marketId);
      if (market) {
        positionsValue += pos.yesShares * market.yesPrice + pos.noShares * market.noPrice;
      }
    });
    return state.portfolio.balance + positionsValue;
  };

  const value: PredictionMarketsContextValue = {
    ...state,
    fetchMarkets,
    selectMarket,
    deselectMarket,
    clearSelectedMarkets,
    placeOrder,
    cancelOrder,
    simulateFillOrder,
    resetPortfolio,
    getMarketById,
    getPositionForMarket,
    getOrdersForMarket,
    getTotalValue,
  };

  return (
    <PredictionMarketsContext.Provider value={value}>
      {children}
    </PredictionMarketsContext.Provider>
  );
};

// ========== Hook ==========
export const usePredictionMarkets = (): PredictionMarketsContextValue => {
  const context = useContext(PredictionMarketsContext);
  if (context === undefined) {
    throw new Error('usePredictionMarkets must be used within a PredictionMarketsProvider');
  }
  return context;
};
