// src/context/OddsWebSocketContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { OddsGame, Game, PlayerProp, PrizePicksSelection } from '../services/apiClient';

// =============================================
// TYPE DEFINITIONS
// =============================================

export type WebSocketStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';
export type SubscriptionType = 'odds' | 'games' | 'player_props' | 'scores' | 'all';
export type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'all';

export interface OddsUpdate {
  type: 'odds_update';
  sport: string;
  gameId: string;
  bookmaker: string;
  market: string;
  outcome: {
    name: string;
    price: number;
    point?: number;
  };
  timestamp: string;
}

export interface GameUpdate {
  type: 'game_update';
  sport: string;
  gameId: string;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  timeRemaining?: string;
  status: string;
  timestamp: string;
}

export interface PlayerPropUpdate {
  type: 'prop_update';
  sport: string;
  gameId: string;
  playerId: string;
  playerName: string;
  market: string;
  line: number;
  overOdds: number;
  underOdds: number;
  timestamp: string;
}

export interface ScoreUpdate {
  type: 'score_update';
  sport: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  timeRemaining: string;
  timestamp: string;
}

export type WebSocketMessage = 
  | OddsUpdate 
  | GameUpdate 
  | PlayerPropUpdate 
  | ScoreUpdate;

export interface Subscription {
  id: string;
  type: SubscriptionType;
  sport: Sport;
  gameId?: string;
  playerId?: string;
  createdAt: string;
}

export interface SubscriptionOptions {
  sport?: Sport;
  gameId?: string;
  playerId?: string;
}

export interface ConnectionStats {
  connectedAt: string | null;
  disconnectedAt: string | null;
  reconnectAttempts: number;
  messagesReceived: number;
  messagesSent: number;
  lastMessageAt: string | null;
  latency: number | null;
}

export interface OddsWebSocketState {
  // Connection
  status: WebSocketStatus;
  socket: Socket | null;
  
  // Data
  latestOdds: Record<string, OddsUpdate>;
  latestGames: Record<string, GameUpdate>;
  latestProps: Record<string, PlayerPropUpdate>;
  latestScores: Record<string, ScoreUpdate>;
  
  // Subscriptions
  subscriptions: Subscription[];
  activeSubscriptions: Record<string, boolean>;
  
  // History
  messageHistory: WebSocketMessage[];
  maxHistoryLength: number;
  
  // Stats
  stats: ConnectionStats;
  
  // Error
  error: string | null;
  
  // Config
  url: string;
  autoConnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

// =============================================
// CONTEXT VALUE
// =============================================

export interface OddsWebSocketContextValue extends OddsWebSocketState {
  // Connection
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Subscriptions
  subscribe: (type: SubscriptionType, options?: SubscriptionOptions) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  
  // Manual fetch
  fetchLatestOdds: (sport?: Sport, gameId?: string) => void;
  fetchLatestGames: (sport?: Sport) => void;
  fetchLatestProps: (sport?: Sport, gameId?: string) => void;
  
  // Data access
  getOddsForGame: (gameId: string) => OddsUpdate[];
  getGameUpdates: (gameId: string) => GameUpdate | null;
  getPropsForPlayer: (playerId: string) => PlayerPropUpdate[];
  getPropsForGame: (gameId: string) => PlayerPropUpdate[];
  
  // History
  clearHistory: () => void;
  setMaxHistoryLength: (length: number) => void;
  
  // Config
  setAutoConnect: (auto: boolean) => void;
  setReconnectInterval: (interval: number) => void;
  setMaxReconnectAttempts: (attempts: number) => void;
  
  // Utility
  ping: () => Promise<number>;
  isSubscribed: (type: SubscriptionType, options?: SubscriptionOptions) => boolean;
}

// =============================================
// INITIAL STATE
// =============================================

const DEFAULT_URL = import.meta.env.VITE_WS_URL || 'wss://python-api-fresh-production.up.railway.app';
const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_MAX_HISTORY_LENGTH = 100;

const createInitialState = (): OddsWebSocketState => ({
  status: 'disconnected',
  socket: null,
  latestOdds: {},
  latestGames: {},
  latestProps: {},
  latestScores: {},
  subscriptions: [],
  activeSubscriptions: {},
  messageHistory: [],
  maxHistoryLength: DEFAULT_MAX_HISTORY_LENGTH,
  stats: {
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    messagesReceived: 0,
    messagesSent: 0,
    lastMessageAt: null,
    latency: null,
  },
  error: null,
  url: DEFAULT_URL,
  autoConnect: true,
  reconnectInterval: DEFAULT_RECONNECT_INTERVAL,
  maxReconnectAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
});

// =============================================
// CONTEXT CREATION
// =============================================

const OddsWebSocketContext = createContext<OddsWebSocketContextValue | undefined>(undefined);

// =============================================
// PROVIDER COMPONENT
// =============================================

interface OddsWebSocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  maxHistoryLength?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
}

export const OddsWebSocketProvider: React.FC<OddsWebSocketProviderProps> = ({
  children,
  url = DEFAULT_URL,
  autoConnect = true,
  reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
  maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
  maxHistoryLength = DEFAULT_MAX_HISTORY_LENGTH,
  onConnect,
  onDisconnect,
  onMessage,
  onError,
}) => {
  const [state, setState] = useState<OddsWebSocketState>(() => ({
    ...createInitialState(),
    url,
    autoConnect,
    reconnectInterval,
    maxReconnectAttempts,
    maxHistoryLength,
  }));
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // =============================================
  // MESSAGE HANDLERS
  // =============================================

  const handleOddsUpdate = useCallback((data: OddsUpdate) => {
    setState(prev => ({
      ...prev,
      latestOdds: {
        ...prev.latestOdds,
        [`${data.gameId}-${data.bookmaker}-${data.market}-${data.outcome.name}`]: data,
      },
      messageHistory: [
        data,
        ...prev.messageHistory.slice(0, prev.maxHistoryLength - 1),
      ],
      stats: {
        ...prev.stats,
        messagesReceived: prev.stats.messagesReceived + 1,
        lastMessageAt: new Date().toISOString(),
      },
    }));
    onMessage?.(data);
  }, [onMessage]);

  const handleGameUpdate = useCallback((data: GameUpdate) => {
    setState(prev => ({
      ...prev,
      latestGames: {
        ...prev.latestGames,
        [data.gameId]: data,
      },
      messageHistory: [
        data,
        ...prev.messageHistory.slice(0, prev.maxHistoryLength - 1),
      ],
      stats: {
        ...prev.stats,
        messagesReceived: prev.stats.messagesReceived + 1,
        lastMessageAt: new Date().toISOString(),
      },
    }));
    onMessage?.(data);
  }, [onMessage]);

  const handlePlayerPropUpdate = useCallback((data: PlayerPropUpdate) => {
    setState(prev => ({
      ...prev,
      latestProps: {
        ...prev.latestProps,
        [`${data.playerId}-${data.market}`]: data,
      },
      messageHistory: [
        data,
        ...prev.messageHistory.slice(0, prev.maxHistoryLength - 1),
      ],
      stats: {
        ...prev.stats,
        messagesReceived: prev.stats.messagesReceived + 1,
        lastMessageAt: new Date().toISOString(),
      },
    }));
    onMessage?.(data);
  }, [onMessage]);

  const handleScoreUpdate = useCallback((data: ScoreUpdate) => {
    setState(prev => ({
      ...prev,
      latestScores: {
        ...prev.latestScores,
        [data.gameId]: data,
      },
      messageHistory: [
        data,
        ...prev.messageHistory.slice(0, prev.maxHistoryLength - 1),
      ],
      stats: {
        ...prev.stats,
        messagesReceived: prev.stats.messagesReceived + 1,
        lastMessageAt: new Date().toISOString(),
      },
    }));
    onMessage?.(data);
  }, [onMessage]);

  // =============================================
  // SOCKET EVENT HANDLERS
  // =============================================

  const handleConnect = useCallback(() => {
    console.log('🔌 WebSocket connected');
    
    setState(prev => ({
      ...prev,
      status: 'connected',
      error: null,
      stats: {
        ...prev.stats,
        connectedAt: new Date().toISOString(),
        disconnectedAt: null,
        reconnectAttempts: 0,
      },
    }));
    
    reconnectAttemptsRef.current = 0;
    
    // Resubscribe to all active subscriptions
    state.subscriptions.forEach(sub => {
      state.socket?.emit('subscribe', {
        type: sub.type,
        sport: sub.sport,
        gameId: sub.gameId,
        playerId: sub.playerId,
      });
    });
    
    // Start ping interval
    pingIntervalRef.current = setInterval(() => {
      ping();
    }, 30000);
    
    onConnect?.();
  }, [state.subscriptions, state.socket, onConnect]);

  const handleDisconnect = useCallback((reason: string) => {
    console.log(`🔌 WebSocket disconnected: ${reason}`);
    
    setState(prev => ({
      ...prev,
      status: 'disconnected',
      stats: {
        ...prev.stats,
        disconnectedAt: new Date().toISOString(),
      },
    }));
    
    clearInterval(pingIntervalRef.current);
    
    onDisconnect?.();
  }, [onDisconnect]);

  const handleError = useCallback((error: Error) => {
    console.error('❌ WebSocket error:', error);
    
    setState(prev => ({
      ...prev,
      status: 'error',
      error: error.message,
    }));
    
    onError?.(error);
  }, [onError]);

  const handleReconnect = useCallback((attempt: number) => {
    console.log(`🔄 WebSocket reconnecting... Attempt ${attempt}/${maxReconnectAttempts}`);
    
    setState(prev => ({
      ...prev,
      status: 'reconnecting',
      stats: {
        ...prev.stats,
        reconnectAttempts: attempt,
      },
    }));
  }, [maxReconnectAttempts]);

  // =============================================
  // CONNECTION MANAGEMENT
  // =============================================

  const connect = useCallback(() => {
    if (state.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }
    
    setState(prev => ({ ...prev, status: 'connecting' }));
    
    const socket = io(url, {
      path: '/ws',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectInterval,
      timeout: 10000,
    });
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('reconnect_attempt', handleReconnect);
    
    // Message handlers
    socket.on('odds_update', handleOddsUpdate);
    socket.on('game_update', handleGameUpdate);
    socket.on('prop_update', handlePlayerPropUpdate);
    socket.on('score_update', handleScoreUpdate);
    
    // Pong response for latency
    socket.on('pong', (timestamp: number) => {
      const latency = Date.now() - timestamp;
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          latency,
        },
      }));
    });
    
    setState(prev => ({ ...prev, socket }));
  }, [
    url,
    maxReconnectAttempts,
    reconnectInterval,
    handleConnect,
    handleDisconnect,
    handleError,
    handleReconnect,
    handleOddsUpdate,
    handleGameUpdate,
    handlePlayerPropUpdate,
    handleScoreUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.disconnect();
      state.socket.removeAllListeners();
      setState(prev => ({ ...prev, socket: null }));
    }
    
    clearInterval(pingIntervalRef.current);
    clearTimeout(reconnectTimeoutRef.current);
  }, [state.socket]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (state.autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
      clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // =============================================
  // SUBSCRIPTION MANAGEMENT
  // =============================================

  const subscribe = useCallback((
    type: SubscriptionType,
    options: SubscriptionOptions = {}
  ): string => {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: Subscription = {
      id,
      type,
      sport: options.sport || 'all',
      gameId: options.gameId,
      playerId: options.playerId,
      createdAt: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, subscription],
      activeSubscriptions: {
        ...prev.activeSubscriptions,
        [id]: true,
      },
    }));
    
    // Send subscription to server if connected
    if (state.socket?.connected) {
      state.socket.emit('subscribe', {
        type,
        sport: options.sport,
        gameId: options.gameId,
        playerId: options.playerId,
      });
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
    
    return id;
  }, [state.socket]);

  const unsubscribe = useCallback((subscriptionId: string) => {
    const subscription = state.subscriptions.find(s => s.id === subscriptionId);
    
    setState(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(s => s.id !== subscriptionId),
      activeSubscriptions: Object.fromEntries(
        Object.entries(prev.activeSubscriptions).filter(([id]) => id !== subscriptionId)
      ),
    }));
    
    // Send unsubscription to server if connected
    if (state.socket?.connected && subscription) {
      state.socket.emit('unsubscribe', {
        type: subscription.type,
        sport: subscription.sport,
        gameId: subscription.gameId,
        playerId: subscription.playerId,
      });
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
  }, [state.subscriptions, state.socket]);

  const unsubscribeAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      subscriptions: [],
      activeSubscriptions: {},
    }));
    
    if (state.socket?.connected) {
      state.socket.emit('unsubscribe_all');
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
  }, [state.socket]);

  // =============================================
  // MANUAL FETCH
  // =============================================

  const fetchLatestOdds = useCallback((sport?: Sport, gameId?: string) => {
    if (state.socket?.connected) {
      state.socket.emit('fetch_odds', { sport, gameId });
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
  }, [state.socket]);

  const fetchLatestGames = useCallback((sport?: Sport) => {
    if (state.socket?.connected) {
      state.socket.emit('fetch_games', { sport });
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
  }, [state.socket]);

  const fetchLatestProps = useCallback((sport?: Sport, gameId?: string) => {
    if (state.socket?.connected) {
      state.socket.emit('fetch_props', { sport, gameId });
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          messagesSent: prev.stats.messagesSent + 1,
        },
      }));
    }
  }, [state.socket]);

  // =============================================
  // DATA ACCESS
  // =============================================

  const getOddsForGame = useCallback((gameId: string): OddsUpdate[] => {
    return Object.values(state.latestOdds).filter(
      odds => odds.gameId === gameId
    );
  }, [state.latestOdds]);

  const getGameUpdates = useCallback((gameId: string): GameUpdate | null => {
    return state.latestGames[gameId] || null;
  }, [state.latestGames]);

  const getPropsForPlayer = useCallback((playerId: string): PlayerPropUpdate[] => {
    return Object.values(state.latestProps).filter(
      prop => prop.playerId === playerId
    );
  }, [state.latestProps]);

  const getPropsForGame = useCallback((gameId: string): PlayerPropUpdate[] => {
    return Object.values(state.latestProps).filter(
      prop => prop.gameId === gameId
    );
  }, [state.latestProps]);

  // =============================================
  // HISTORY MANAGEMENT
  // =============================================

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      messageHistory: [],
    }));
  }, []);

  const setMaxHistoryLength = useCallback((length: number) => {
    setState(prev => ({
      ...prev,
      maxHistoryLength: length,
      messageHistory: prev.messageHistory.slice(0, length),
    }));
  }, []);

  // =============================================
  // CONFIGURATION
  // =============================================

  const setAutoConnect = useCallback((auto: boolean) => {
    setState(prev => ({ ...prev, autoConnect: auto }));
  }, []);

  const setReconnectInterval = useCallback((interval: number) => {
    setState(prev => ({ ...prev, reconnectInterval: interval }));
  }, []);

  const setMaxReconnectAttempts = useCallback((attempts: number) => {
    setState(prev => ({ ...prev, maxReconnectAttempts: attempts }));
  }, []);

  // =============================================
  // UTILITY
  // =============================================

  const ping = useCallback(async (): Promise<number> => {
    return new Promise((resolve) => {
      if (!state.socket?.connected) {
        resolve(-1);
        return;
      }
      
      const start = Date.now();
      state.socket.emit('ping', start);
      
      const handler = (timestamp: number) => {
        const latency = Date.now() - timestamp;
        setState(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            latency,
          },
        }));
        state.socket?.off('pong', handler);
        resolve(latency);
      };
      
      state.socket.once('pong', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        state.socket?.off('pong', handler);
        resolve(-1);
      }, 5000);
    });
  }, [state.socket]);

  const isSubscribed = useCallback((
    type: SubscriptionType,
    options: SubscriptionOptions = {}
  ): boolean => {
    return state.subscriptions.some(sub =>
      sub.type === type &&
      sub.sport === (options.sport || 'all') &&
      sub.gameId === options.gameId &&
      sub.playerId === options.playerId
    );
  }, [state.subscriptions]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: OddsWebSocketContextValue = {
    ...state,
    
    // Connection
    connect,
    disconnect,
    reconnect,
    
    // Subscriptions
    subscribe,
    unsubscribe,
    unsubscribeAll,
    
    // Manual fetch
    fetchLatestOdds,
    fetchLatestGames,
    fetchLatestProps,
    
    // Data access
    getOddsForGame,
    getGameUpdates,
    getPropsForPlayer,
    getPropsForGame,
    
    // History
    clearHistory,
    setMaxHistoryLength,
    
    // Config
    setAutoConnect,
    setReconnectInterval,
    setMaxReconnectAttempts,
    
    // Utility
    ping,
    isSubscribed,
  };

  return (
    <OddsWebSocketContext.Provider value={contextValue}>
      {children}
    </OddsWebSocketContext.Provider>
  );
};

// =============================================
// HOOKS
// =============================================

export const useOddsWebSocket = (): OddsWebSocketContextValue => {
  const context = useContext(OddsWebSocketContext);
  
  if (context === undefined) {
    throw new Error('useOddsWebSocket must be used within an OddsWebSocketProvider');
  }
  
  return context;
};

export const useOddsSubscription = (sport?: Sport, gameId?: string) => {
  const context = useOddsWebSocket();
  
  useEffect(() => {
    const subId = context.subscribe('odds', { sport, gameId });
    return () => context.unsubscribe(subId);
  }, [sport, gameId, context]);
  
  const odds = gameId
    ? context.getOddsForGame(gameId)
    : Object.values(context.latestOdds).filter(o => 
        sport ? o.sport === sport : true
      );
  
  return {
    odds,
    isConnected: context.status === 'connected',
    lastUpdate: context.stats.lastMessageAt,
    latency: context.stats.latency,
  };
};

export const useGameSubscription = (sport?: Sport) => {
  const context = useOddsWebSocket();
  
  useEffect(() => {
    const subId = context.subscribe('games', { sport });
    return () => context.unsubscribe(subId);
  }, [sport, context]);
  
  const games = Object.values(context.latestGames).filter(g =>
    sport ? g.sport === sport : true
  );
  
  return {
    games,
    isConnected: context.status === 'connected',
    lastUpdate: context.stats.lastMessageAt,
  };
};

export const usePlayerPropsSubscription = (sport?: Sport, gameId?: string, playerId?: string) => {
  const context = useOddsWebSocket();
  
  useEffect(() => {
    const subId = context.subscribe('player_props', { sport, gameId, playerId });
    return () => context.unsubscribe(subId);
  }, [sport, gameId, playerId, context]);
  
  const props = playerId
    ? context.getPropsForPlayer(playerId)
    : gameId
      ? context.getPropsForGame(gameId)
      : Object.values(context.latestProps).filter(p =>
          sport ? p.sport === sport : true
        );
  
  return {
    props,
    isConnected: context.status === 'connected',
    lastUpdate: context.stats.lastMessageAt,
  };
};

export const useScoreSubscription = (sport?: Sport, gameId?: string) => {
  const context = useOddsWebSocket();
  
  useEffect(() => {
    const subId = context.subscribe('scores', { sport, gameId });
    return () => context.unsubscribe(subId);
  }, [sport, gameId, context]);
  
  const scores = gameId
    ? context.latestScores[gameId]
    : Object.values(context.latestScores).filter(s =>
        sport ? s.sport === sport : true
      );
  
  return {
    scores,
    isConnected: context.status === 'connected',
    lastUpdate: context.stats.lastMessageAt,
  };
};

export const useGameOdds = (gameId: string) => {
  const context = useOddsWebSocket();
  
  useEffect(() => {
    const subId = context.subscribe('all', { gameId });
    return () => context.unsubscribe(subId);
  }, [gameId, context]);
  
  const odds = context.getOddsForGame(gameId);
  const game = context.getGameUpdates(gameId);
  const props = context.getPropsForGame(gameId);
  const score = context.latestScores[gameId];
  
  return {
    game,
    odds,
    props,
    score,
    isConnected: context.status === 'connected',
    lastUpdate: context.stats.lastMessageAt,
  };
};

export const useWebSocketStatus = () => {
  const context = useOddsWebSocket();
  
  return {
    status: context.status,
    isConnected: context.status === 'connected',
    isConnecting: context.status === 'connecting',
    isReconnecting: context.status === 'reconnecting',
    isDisconnected: context.status === 'disconnected',
    isError: context.status === 'error',
    stats: context.stats,
    error: context.error,
    reconnect: context.reconnect,
  };
};

export const useLatestOdds = (limit: number = 10) => {
  const context = useOddsWebSocket();
  
  return Object.values(context.latestOdds)
    .sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
};

export const useLatestProps = (limit: number = 10) => {
  const context = useOddsWebSocket();
  
  return Object.values(context.latestProps)
    .sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
};

// =============================================
// DEFAULT EXPORT
// =============================================

export default OddsWebSocketProvider;
