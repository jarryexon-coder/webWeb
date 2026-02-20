// src/services/storageService.ts
import { ParlaySuggestion, ParlayLeg } from './apiClient';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface SavedParlay extends ParlaySuggestion {
  savedAt: string;
  userId?: string;
  notes?: string;
  stake?: number;
  potentialPayout?: number;
  status?: 'pending' | 'won' | 'lost' | 'cash_out';
  actualResult?: number;
}

export interface ParlayTemplate {
  id: string;
  name: string;
  description: string;
  sport: string;
  type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  successRate?: number;
  tags: string[];
  isFavorite: boolean;
  isCustom: boolean;
}

export interface UserPreferences {
  favoriteSports: string[];
  favoriteTeams: string[];
  favoritePlayers: string[];
  defaultStake: number;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  oddsFormat: 'american' | 'decimal' | 'fractional';
  defaultParlayLimit: number;
}

export interface ParlayHistory {
  id: string;
  parlayId: string;
  placedAt: string;
  settledAt?: string;
  stake: number;
  potentialPayout: number;
  actualPayout?: number;
  status: 'pending' | 'won' | 'lost' | 'cash_out';
  legs: Array<{
    description: string;
    odds: string;
    result?: 'win' | 'loss' | 'push' | 'pending';
  }>;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// =============================================
// STORAGE KEYS
// =============================================

const STORAGE_KEYS = {
  PARLAY_TEMPLATES: 'fantasy_parlay_templates',
  SAVED_PARLAYS: 'fantasy_saved_parlays',
  USER_PREFERENCES: 'fantasy_user_preferences',
  PARLAY_HISTORY: 'fantasy_parlay_history',
  API_CACHE: 'fantasy_api_cache',
  RECENT_SEARCHES: 'fantasy_recent_searches',
  FAVORITE_PLAYERS: 'fantasy_favorite_players',
  FAVORITE_TEAMS: 'fantasy_favorite_teams',
  CUSTOM_PROJECTIONS: 'fantasy_custom_projections',
};

// =============================================
// DEFAULT TEMPLATES
// =============================================

const DEFAULT_TEMPLATES: ParlayTemplate[] = [
  {
    id: 'template-nba-star-prop',
    name: 'NBA Star Props',
    description: 'Combine top NBA players for points and rebounds',
    sport: 'NBA',
    type: 'player_props',
    legs: [
      {
        id: 'leg-1',
        description: 'LeBron James Points Over 25.5',
        odds: '-115',
        confidence: 78,
        sport: 'NBA',
        market: 'player_props',
        player_name: 'LeBron James',
        stat_type: 'Points',
        line: 25.5,
        value_side: 'over',
        confidence_level: 'high'
      },
      {
        id: 'leg-2',
        description: 'Giannis Antetokounmpo Rebounds Over 11.5',
        odds: '-110',
        confidence: 72,
        sport: 'NBA',
        market: 'player_props',
        player_name: 'Giannis Antetokounmpo',
        stat_type: 'Rebounds',
        line: 11.5,
        value_side: 'over',
        confidence_level: 'medium'
      },
      {
        id: 'leg-3',
        description: 'Stephen Curry Assists Over 6.5',
        odds: '-120',
        confidence: 75,
        sport: 'NBA',
        market: 'player_props',
        player_name: 'Stephen Curry',
        stat_type: 'Assists',
        line: 6.5,
        value_side: 'over',
        confidence_level: 'high'
      }
    ],
    total_odds: '+450',
    confidence: 75,
    confidence_level: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    tags: ['nba', 'player-props', 'star-players'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'template-nfl-touchdown',
    name: 'NFL TD Scorers',
    description: 'Anytime touchdown scorers parlay',
    sport: 'NFL',
    type: 'player_props',
    legs: [
      {
        id: 'leg-1',
        description: 'Patrick Mahomes Anytime TD',
        odds: '+180',
        confidence: 65,
        sport: 'NFL',
        market: 'player_props',
        player_name: 'Patrick Mahomes',
        stat_type: 'Touchdowns',
        line: 0.5,
        value_side: 'over',
        confidence_level: 'medium'
      },
      {
        id: 'leg-2',
        description: 'Christian McCaffrey Anytime TD',
        odds: '-130',
        confidence: 82,
        sport: 'NFL',
        market: 'player_props',
        player_name: 'Christian McCaffrey',
        stat_type: 'Touchdowns',
        line: 0.5,
        value_side: 'over',
        confidence_level: 'very-high'
      },
      {
        id: 'leg-3',
        description: 'Tyreek Hill Anytime TD',
        odds: '+120',
        confidence: 70,
        sport: 'NFL',
        market: 'player_props',
        player_name: 'Tyreek Hill',
        stat_type: 'Touchdowns',
        line: 0.5,
        value_side: 'over',
        confidence_level: 'high'
      }
    ],
    total_odds: '+650',
    confidence: 72,
    confidence_level: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    tags: ['nfl', 'touchdowns', 'anytime-scorer'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'template-mlb-strikeouts',
    name: 'MLB Strikeout Machine',
    description: 'Pitcher strikeout overs',
    sport: 'MLB',
    type: 'player_props',
    legs: [
      {
        id: 'leg-1',
        description: 'Shohei Ohtani Strikeouts Over 7.5',
        odds: '-115',
        confidence: 76,
        sport: 'MLB',
        market: 'player_props',
        player_name: 'Shohei Ohtani',
        stat_type: 'Strikeouts',
        line: 7.5,
        value_side: 'over',
        confidence_level: 'high'
      },
      {
        id: 'leg-2',
        description: 'Jacob deGrom Strikeouts Over 8.5',
        odds: '-120',
        confidence: 80,
        sport: 'MLB',
        market: 'player_props',
        player_name: 'Jacob deGrom',
        stat_type: 'Strikeouts',
        line: 8.5,
        value_side: 'over',
        confidence_level: 'high'
      }
    ],
    total_odds: '+280',
    confidence: 78,
    confidence_level: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    tags: ['mlb', 'strikeouts', 'pitchers'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'template-nhl-shots',
    name: 'NHL Shots on Goal',
    description: 'Shots on goal overs for top scorers',
    sport: 'NHL',
    type: 'player_props',
    legs: [
      {
        id: 'leg-1',
        description: 'Connor McDavid Shots Over 3.5',
        odds: '-125',
        confidence: 74,
        sport: 'NHL',
        market: 'player_props',
        player_name: 'Connor McDavid',
        stat_type: 'Shots',
        line: 3.5,
        value_side: 'over',
        confidence_level: 'high'
      },
      {
        id: 'leg-2',
        description: 'Auston Matthews Shots Over 4.5',
        odds: '-110',
        confidence: 71,
        sport: 'NHL',
        market: 'player_props',
        player_name: 'Auston Matthews',
        stat_type: 'Shots',
        line: 4.5,
        value_side: 'over',
        confidence_level: 'medium'
      }
    ],
    total_odds: '+210',
    confidence: 72,
    confidence_level: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    tags: ['nhl', 'shots', 'goals'],
    isFavorite: false,
    isCustom: false
  },
  {
    id: 'template-mixed-moneylines',
    name: 'Mixed Sports Moneylines',
    description: 'Strong favorites across different sports',
    sport: 'Mixed',
    type: 'moneyline',
    legs: [
      {
        id: 'leg-1',
        description: 'Boston Celtics ML',
        odds: '-220',
        confidence: 85,
        sport: 'NBA',
        market: 'h2h',
        confidence_level: 'very-high'
      },
      {
        id: 'leg-2',
        description: 'Kansas City Chiefs ML',
        odds: '-180',
        confidence: 78,
        sport: 'NFL',
        market: 'h2h',
        confidence_level: 'high'
      },
      {
        id: 'leg-3',
        description: 'New York Yankees ML',
        odds: '-160',
        confidence: 72,
        sport: 'MLB',
        market: 'h2h',
        confidence_level: 'high'
      }
    ],
    total_odds: '+190',
    confidence: 78,
    confidence_level: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    tags: ['mixed', 'moneyline', 'favorites'],
    isFavorite: false,
    isCustom: false
  }
];

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteSports: ['NBA', 'NFL'],
  favoriteTeams: [],
  favoritePlayers: [],
  defaultStake: 10,
  notificationsEnabled: true,
  theme: 'system',
  oddsFormat: 'american',
  defaultParlayLimit: 4
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const getStorage = () => {
  if (!isLocalStorageAvailable()) {
    console.warn('⚠️ localStorage is not available, using in-memory fallback');
    return new Map<string, string>();
  }
  return localStorage;
};

const memoryStorage = new Map<string, string>();

const safeGetItem = (key: string): string | null => {
  try {
    const storage = getStorage();
    if (storage instanceof Map) {
      return storage.get(key) || null;
    }
    return storage.getItem(key);
  } catch (error) {
    console.error(`❌ Error reading from storage: ${key}`, error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    const storage = getStorage();
    if (storage instanceof Map) {
      storage.set(key, value);
    } else {
      storage.setItem(key, value);
    }
  } catch (error) {
    console.error(`❌ Error writing to storage: ${key}`, error);
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    const storage = getStorage();
    if (storage instanceof Map) {
      storage.delete(key);
    } else {
      storage.removeItem(key);
    }
  } catch (error) {
    console.error(`❌ Error removing from storage: ${key}`, error);
  }
};

// =============================================
// CACHE MANAGEMENT
// =============================================

const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 15 * 60 * 1000,    // 15 minutes
  LONG: 60 * 60 * 1000,      // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

const cache = new Map<string, CachedData<any>>();

export const setCacheItem = <T>(key: string, data: T, ttl: number = CACHE_DURATION.MEDIUM): void => {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
};

export const getCacheItem = <T>(key: string): T | null => {
  const item = cache.get(key);
  if (!item) return null;
  
  const now = Date.now();
  if (now > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.data as T;
};

export const clearCache = (): void => {
  cache.clear();
  safeRemoveItem(STORAGE_KEYS.API_CACHE);
};

export const removeCacheItem = (key: string): void => {
  cache.delete(key);
};

// =============================================
// PARLAY TEMPLATES
// =============================================

export const loadParlayTemplates = (): ParlayTemplate[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.PARLAY_TEMPLATES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('❌ Failed to load parlay templates:', error);
  }
  
  // Initialize with default templates
  saveParlayTemplates(DEFAULT_TEMPLATES);
  return DEFAULT_TEMPLATES;
};

export const saveParlayTemplates = (templates: ParlayTemplate[]): void => {
  try {
    safeSetItem(STORAGE_KEYS.PARLAY_TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('❌ Failed to save parlay templates:', error);
  }
};

export const getParlayTemplate = (id: string): ParlayTemplate | null => {
  const templates = loadParlayTemplates();
  return templates.find(t => t.id === id) || null;
};

export const saveParlayTemplate = (template: ParlayTemplate): void => {
  const templates = loadParlayTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  
  if (index >= 0) {
    templates[index] = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
  } else {
    templates.push({
      ...template,
      id: template.id || `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isCustom: true,
    });
  }
  
  saveParlayTemplates(templates);
};

export const deleteParlayTemplate = (id: string): void => {
  const templates = loadParlayTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveParlayTemplates(filtered);
};

export const toggleFavoriteTemplate = (id: string): void => {
  const templates = loadParlayTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index >= 0) {
    templates[index].isFavorite = !templates[index].isFavorite;
    templates[index].updatedAt = new Date().toISOString();
    saveParlayTemplates(templates);
  }
};

export const incrementTemplateUsage = (id: string): void => {
  const templates = loadParlayTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index >= 0) {
    templates[index].usageCount += 1;
    templates[index].updatedAt = new Date().toISOString();
    saveParlayTemplates(templates);
  }
};

export const getFavoriteTemplates = (): ParlayTemplate[] => {
  const templates = loadParlayTemplates();
  return templates.filter(t => t.isFavorite);
};

export const getCustomTemplates = (): ParlayTemplate[] => {
  const templates = loadParlayTemplates();
  return templates.filter(t => t.isCustom);
};

export const getTemplatesBySport = (sport: string): ParlayTemplate[] => {
  const templates = loadParlayTemplates();
  return templates.filter(t => t.sport === sport || t.sport === 'Mixed');
};

export const searchTemplates = (query: string): ParlayTemplate[] => {
  const templates = loadParlayTemplates();
  const lowerQuery = query.toLowerCase();
  
  return templates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    t.legs.some(leg => leg.description.toLowerCase().includes(lowerQuery))
  );
};

export const resetToDefaultTemplates = (): void => {
  saveParlayTemplates(DEFAULT_TEMPLATES);
};

// =============================================
// SAVED PARLAYS
// =============================================

export const loadSavedParlays = (): SavedParlay[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.SAVED_PARLAYS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load saved parlays:', error);
  }
  return [];
};

export const saveParlay = (parlay: SavedParlay): void => {
  const parlays = loadSavedParlays();
  const existingIndex = parlays.findIndex(p => p.id === parlay.id);
  
  if (existingIndex >= 0) {
    parlays[existingIndex] = {
      ...parlay,
      savedAt: new Date().toISOString(),
    };
  } else {
    parlays.push({
      ...parlay,
      savedAt: new Date().toISOString(),
      status: 'pending',
    });
  }
  
  safeSetItem(STORAGE_KEYS.SAVED_PARLAYS, JSON.stringify(parlays));
};

export const deleteSavedParlay = (id: string): void => {
  const parlays = loadSavedParlays();
  const filtered = parlays.filter(p => p.id !== id);
  safeSetItem(STORAGE_KEYS.SAVED_PARLAYS, JSON.stringify(filtered));
};

export const updateParlayStatus = (
  id: string, 
  status: SavedParlay['status'], 
  actualResult?: number
): void => {
  const parlays = loadSavedParlays();
  const index = parlays.findIndex(p => p.id === id);
  
  if (index >= 0) {
    parlays[index].status = status;
    if (actualResult !== undefined) {
      parlays[index].actualResult = actualResult;
    }
    parlays[index].savedAt = new Date().toISOString();
    safeSetItem(STORAGE_KEYS.SAVED_PARLAYS, JSON.stringify(parlays));
  }
};

// =============================================
// USER PREFERENCES
// =============================================

export const loadUserPreferences = (): UserPreferences => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.USER_PREFERENCES);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('❌ Failed to load user preferences:', error);
  }
  return DEFAULT_PREFERENCES;
};

export const saveUserPreferences = (preferences: Partial<UserPreferences>): void => {
  const current = loadUserPreferences();
  const updated = { ...current, ...preferences };
  safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
};

export const resetUserPreferences = (): void => {
  safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
};

// =============================================
// PARLAY HISTORY
// =============================================

export const loadParlayHistory = (): ParlayHistory[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.PARLAY_HISTORY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load parlay history:', error);
  }
  return [];
};

export const addToParlayHistory = (history: ParlayHistory): void => {
  const histories = loadParlayHistory();
  histories.unshift({
    ...history,
    placedAt: new Date().toISOString(),
  });
  
  // Keep only last 50 entries
  if (histories.length > 50) {
    histories.pop();
  }
  
  safeSetItem(STORAGE_KEYS.PARLAY_HISTORY, JSON.stringify(histories));
};

export const updateParlayHistory = (id: string, updates: Partial<ParlayHistory>): void => {
  const histories = loadParlayHistory();
  const index = histories.findIndex(h => h.id === id);
  
  if (index >= 0) {
    histories[index] = { ...histories[index], ...updates };
    safeSetItem(STORAGE_KEYS.PARLAY_HISTORY, JSON.stringify(histories));
  }
};

export const clearParlayHistory = (): void => {
  safeSetItem(STORAGE_KEYS.PARLAY_HISTORY, JSON.stringify([]));
};

// =============================================
// FAVORITES
// =============================================

export const loadFavoritePlayers = (): string[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.FAVORITE_PLAYERS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load favorite players:', error);
  }
  return [];
};

export const saveFavoritePlayers = (players: string[]): void => {
  safeSetItem(STORAGE_KEYS.FAVORITE_PLAYERS, JSON.stringify(players));
};

export const toggleFavoritePlayer = (playerName: string): boolean => {
  const favorites = loadFavoritePlayers();
  const index = favorites.indexOf(playerName);
  
  if (index >= 0) {
    favorites.splice(index, 1);
    saveFavoritePlayers(favorites);
    return false; // Removed
  } else {
    favorites.push(playerName);
    saveFavoritePlayers(favorites);
    return true; // Added
  }
};

export const isFavoritePlayer = (playerName: string): boolean => {
  const favorites = loadFavoritePlayers();
  return favorites.includes(playerName);
};

export const loadFavoriteTeams = (): string[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.FAVORITE_TEAMS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load favorite teams:', error);
  }
  return [];
};

export const saveFavoriteTeams = (teams: string[]): void => {
  safeSetItem(STORAGE_KEYS.FAVORITE_TEAMS, JSON.stringify(teams));
};

export const toggleFavoriteTeam = (teamName: string): boolean => {
  const favorites = loadFavoriteTeams();
  const index = favorites.indexOf(teamName);
  
  if (index >= 0) {
    favorites.splice(index, 1);
    saveFavoriteTeams(favorites);
    return false;
  } else {
    favorites.push(teamName);
    saveFavoriteTeams(favorites);
    return true;
  }
};

export const isFavoriteTeam = (teamName: string): boolean => {
  const favorites = loadFavoriteTeams();
  return favorites.includes(teamName);
};

// =============================================
// RECENT SEARCHES
// =============================================

export const loadRecentSearches = (): string[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.RECENT_SEARCHES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load recent searches:', error);
  }
  return [];
};

export const addRecentSearch = (searchTerm: string): void => {
  const searches = loadRecentSearches();
  
  // Remove if already exists
  const index = searches.indexOf(searchTerm);
  if (index >= 0) {
    searches.splice(index, 1);
  }
  
  // Add to beginning
  searches.unshift(searchTerm);
  
  // Keep only last 10 searches
  if (searches.length > 10) {
    searches.pop();
  }
  
  safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
};

export const clearRecentSearches = (): void => {
  safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([]));
};

// =============================================
// CUSTOM PROJECTIONS
// =============================================

export interface CustomProjection {
  playerId: string;
  playerName: string;
  sport: string;
  statType: string;
  customLine: number;
  originalLine: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
  confidence: number;
}

export const loadCustomProjections = (): CustomProjection[] => {
  try {
    const stored = safeGetItem(STORAGE_KEYS.CUSTOM_PROJECTIONS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Failed to load custom projections:', error);
  }
  return [];
};

export const saveCustomProjection = (projection: CustomProjection): void => {
  const projections = loadCustomProjections();
  const index = projections.findIndex(p => 
    p.playerId === projection.playerId && p.statType === projection.statType
  );
  
  if (index >= 0) {
    projections[index] = {
      ...projection,
      updatedAt: new Date().toISOString(),
    };
  } else {
    projections.push({
      ...projection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  safeSetItem(STORAGE_KEYS.CUSTOM_PROJECTIONS, JSON.stringify(projections));
};

export const deleteCustomProjection = (playerId: string, statType: string): void => {
  const projections = loadCustomProjections();
  const filtered = projections.filter(p => 
    !(p.playerId === playerId && p.statType === statType)
  );
  safeSetItem(STORAGE_KEYS.CUSTOM_PROJECTIONS, JSON.stringify(filtered));
};

// =============================================
// STORAGE MANAGEMENT
// =============================================

export const clearAllStorage = (): void => {
  try {
    const storage = getStorage();
    if (storage instanceof Map) {
      storage.clear();
    } else {
      Object.values(STORAGE_KEYS).forEach(key => storage.removeItem(key));
    }
    cache.clear();
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('❌ Failed to clear storage:', error);
  }
};

export const getStorageUsage = (): Record<string, number> => {
  const usage: Record<string, number> = {};
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const value = safeGetItem(key);
    usage[key] = value ? new Blob([value]).size : 0;
  });
  
  return usage;
};

export const exportData = (): string => {
  const data: Record<string, any> = {};
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const value = safeGetItem(key);
    if (value) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  });
  
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    Object.entries(data).forEach(([key, value]) => {
      if (Object.values(STORAGE_KEYS).includes(key as any)) {
        safeSetItem(key, JSON.stringify(value));
      }
    });
    
    console.log('✅ Data imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to import data:', error);
    return false;
  }
};

// =============================================
// INITIALIZATION
// =============================================

export const initializeStorage = (): void => {
  // Initialize parlay templates if not exists
  if (!safeGetItem(STORAGE_KEYS.PARLAY_TEMPLATES)) {
    saveParlayTemplates(DEFAULT_TEMPLATES);
  }
  
  // Initialize user preferences if not exists
  if (!safeGetItem(STORAGE_KEYS.USER_PREFERENCES)) {
    saveUserPreferences(DEFAULT_PREFERENCES);
  }
  
  console.log('✅ Storage service initialized');
};

// Run initialization
initializeStorage();

// =============================================
// DEFAULT EXPORT
// =============================================

export default {
  // Templates
  loadParlayTemplates,
  saveParlayTemplates,
  getParlayTemplate,
  saveParlayTemplate,
  deleteParlayTemplate,
  toggleFavoriteTemplate,
  incrementTemplateUsage,
  getFavoriteTemplates,
  getCustomTemplates,
  getTemplatesBySport,
  searchTemplates,
  resetToDefaultTemplates,
  
  // Saved Parlays
  loadSavedParlays,
  saveParlay,
  deleteSavedParlay,
  updateParlayStatus,
  
  // Preferences
  loadUserPreferences,
  saveUserPreferences,
  resetUserPreferences,
  
  // History
  loadParlayHistory,
  addToParlayHistory,
  updateParlayHistory,
  clearParlayHistory,
  
  // Favorites
  loadFavoritePlayers,
  saveFavoritePlayers,
  toggleFavoritePlayer,
  isFavoritePlayer,
  loadFavoriteTeams,
  saveFavoriteTeams,
  toggleFavoriteTeam,
  isFavoriteTeam,
  
  // Recent Searches
  loadRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  
  // Custom Projections
  loadCustomProjections,
  saveCustomProjection,
  deleteCustomProjection,
  
  // Cache
  setCacheItem,
  getCacheItem,
  clearCache,
  removeCacheItem,
  
  // Storage Management
  clearAllStorage,
  getStorageUsage,
  exportData,
  importData,
  
  // Constants
  STORAGE_KEYS,
  DEFAULT_TEMPLATES,
  DEFAULT_PREFERENCES,
  CACHE_DURATION,
};
