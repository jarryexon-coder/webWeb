// src/context/BookmarkContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Player, Game, ParlaySuggestion, PrizePicksSelection } from '../services/apiClient';

// =============================================
// TYPE DEFINITIONS
// =============================================

export type BookmarkType = 
  | 'player' 
  | 'game' 
  | 'parlay' 
  | 'prop' 
  | 'team' 
  | 'analysis'
  | 'article';

export type BookmarkPriority = 'high' | 'medium' | 'low';
export type BookmarkStatus = 'active' | 'archived' | 'completed';

export interface BookmarkMetadata {
  sport?: string;
  team?: string;
  opponent?: string;
  gameTime?: string;
  line?: number;
  projection?: number;
  odds?: string;
  confidence?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  imageUrl?: string;
}

export interface Bookmark<T = any> {
  id: string;
  type: BookmarkType;
  itemId: string;
  item: T;
  metadata: BookmarkMetadata;
  priority: BookmarkPriority;
  status: BookmarkStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  userId?: string;
  collectionId?: string;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  description: string;
  bookmarks: string[]; // Array of bookmark IDs
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isDefault?: boolean;
  isShared?: boolean;
  shareUrl?: string;
}

export interface BookmarkStats {
  totalBookmarks: number;
  byType: Record<BookmarkType, number>;
  byPriority: Record<BookmarkPriority, number>;
  byStatus: Record<BookmarkStatus, number>;
  bySport: Record<string, number>;
  recentBookmarks: Bookmark[];
  mostBookmarkedPlayers: Array<{ name: string; count: number }>;
  mostBookmarkedTeams: Array<{ name: string; count: number }>;
}

export interface BookmarkFilters {
  type?: BookmarkType | BookmarkType[];
  priority?: BookmarkPriority | BookmarkPriority[];
  status?: BookmarkStatus | BookmarkStatus[];
  sport?: string | string[];
  team?: string | string[];
  search?: string;
  tags?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface BookmarkSort {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'type' | 'itemId';
  direction: 'asc' | 'desc';
}

// =============================================
// CONTEXT STATE
// =============================================

export interface BookmarkState {
  // Data
  bookmarks: Bookmark[];
  collections: BookmarkCollection[];
  
  // Selected
  selectedBookmarks: string[];
  selectedCollectionId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // View State
  filters: BookmarkFilters;
  sort: BookmarkSort;
  
  // Stats
  stats: BookmarkStats;
  
  // Sync
  lastSynced: string | null;
  isOffline: boolean;
}

// =============================================
// CONTEXT VALUE
// =============================================

export interface BookmarkContextValue extends BookmarkState {
  // CRUD Operations
  addBookmark: <T>(
    type: BookmarkType,
    itemId: string,
    item: T,
    metadata?: Partial<BookmarkMetadata>,
    priority?: BookmarkPriority
  ) => Promise<Bookmark>;
  
  removeBookmark: (id: string) => Promise<void>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  getBookmark: (id: string) => Bookmark | undefined;
  
  // Bulk Operations
  addBookmarks: (bookmarks: Array<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Bookmark[]>;
  removeBookmarks: (ids: string[]) => Promise<void>;
  updateBookmarks: (ids: string[], updates: Partial<Bookmark>) => Promise<void>;
  clearAllBookmarks: () => Promise<void>;
  
  // Selection
  selectBookmark: (id: string) => void;
  deselectBookmark: (id: string) => void;
  selectAllBookmarks: () => void;
  deselectAllBookmarks: () => void;
  toggleBookmarkSelection: (id: string) => void;
  isBookmarkSelected: (id: string) => boolean;
  
  // Collections
  createCollection: (name: string, description?: string) => Promise<BookmarkCollection>;
  updateCollection: (id: string, updates: Partial<BookmarkCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, bookmarkIds: string[]) => Promise<void>;
  removeFromCollection: (collectionId: string, bookmarkIds: string[]) => Promise<void>;
  getCollection: (id: string) => BookmarkCollection | undefined;
  selectCollection: (id: string | null) => void;
  
  // Status & Priority
  updateBookmarkStatus: (id: string, status: BookmarkStatus) => Promise<void>;
  updateBookmarkPriority: (id: string, priority: BookmarkPriority) => Promise<void>;
  archiveBookmark: (id: string) => Promise<void>;
  unarchiveBookmark: (id: string) => Promise<void>;
  completeBookmark: (id: string) => Promise<void>;
  
  // Metadata
  addTags: (id: string, tags: string[]) => Promise<void>;
  removeTags: (id: string, tags: string[]) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  
  // Filtering & Sorting
  setFilters: (filters: Partial<BookmarkFilters>) => void;
  resetFilters: () => void;
  setSort: (sort: Partial<BookmarkSort>) => void;
  getFilteredBookmarks: () => Bookmark[];
  
  // Search
  searchBookmarks: (query: string) => Bookmark[];
  
  // Export/Import
  exportBookmarks: (format?: 'json' | 'csv') => string;
  importBookmarks: (data: string) => Promise<void>;
  
  // Sync
  syncBookmarks: () => Promise<void>;
  
  // Stats
  refreshStats: () => void;
  
  // Utility
  isBookmarked: (type: BookmarkType, itemId: string) => boolean;
  getBookmarkByItemId: (type: BookmarkType, itemId: string) => Bookmark | undefined;
}

// =============================================
// INITIAL STATE
// =============================================

const STORAGE_KEY = 'fantasy_bookmarks';
const COLLECTIONS_STORAGE_KEY = 'fantasy_bookmark_collections';

const DEFAULT_COLLECTION: BookmarkCollection = {
  id: 'default',
  name: 'All Bookmarks',
  description: 'Default collection for all bookmarks',
  bookmarks: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDefault: true,
};

const DEFAULT_FILTERS: BookmarkFilters = {
  type: undefined,
  priority: undefined,
  status: ['active'],
  sport: undefined,
  team: undefined,
  search: undefined,
  tags: undefined,
  fromDate: undefined,
  toDate: undefined,
};

const DEFAULT_SORT: BookmarkSort = {
  field: 'createdAt',
  direction: 'desc',
};

const createInitialState = (): BookmarkState => ({
  bookmarks: [],
  collections: [DEFAULT_COLLECTION],
  selectedBookmarks: [],
  selectedCollectionId: 'default',
  isLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  sort: DEFAULT_SORT,
  stats: {
    totalBookmarks: 0,
    byType: {} as Record<BookmarkType, number>,
    byPriority: {} as Record<BookmarkPriority, number>,
    byStatus: {} as Record<BookmarkStatus, number>,
    bySport: {},
    recentBookmarks: [],
    mostBookmarkedPlayers: [],
    mostBookmarkedTeams: [],
  },
  lastSynced: null,
  isOffline: false,
});

// =============================================
// CONTEXT CREATION
// =============================================

const BookmarkContext = createContext<BookmarkContextValue | undefined>(undefined);

// =============================================
// PROVIDER COMPONENT
// =============================================

interface BookmarkProviderProps {
  children: ReactNode;
  userId?: string;
  enableSync?: boolean;
  storageKey?: string;
}

export const BookmarkProvider: React.FC<BookmarkProviderProps> = ({
  children,
  userId,
  enableSync = false,
  storageKey = STORAGE_KEY,
}) => {
  const [state, setState] = useState<BookmarkState>(createInitialState());

  // =============================================
  // PERSISTENCE
  // =============================================

  const saveToStorage = useCallback(() => {
    try {
      const data = {
        bookmarks: state.bookmarks,
        collections: state.collections,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(state.collections));
    } catch (error) {
      console.error('❌ Failed to save bookmarks to storage:', error);
    }
  }, [state.bookmarks, state.collections, storageKey]);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          bookmarks: data.bookmarks || [],
          collections: data.collections || [DEFAULT_COLLECTION],
        }));
      }
      
      const storedCollections = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (storedCollections) {
        const collections = JSON.parse(storedCollections);
        setState(prev => ({
          ...prev,
          collections: collections,
        }));
      }
    } catch (error) {
      console.error('❌ Failed to load bookmarks from storage:', error);
    }
  }, [storageKey]);

  // Load on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Save on changes
  useEffect(() => {
    saveToStorage();
  }, [state.bookmarks, state.collections, saveToStorage]);

  // =============================================
  // STATS CALCULATION
  // =============================================

  const calculateStats = useCallback((): BookmarkStats => {
    const bookmarks = state.bookmarks.filter(b => b.status === 'active');
    
    const byType = {} as Record<BookmarkType, number>;
    const byPriority = {} as Record<BookmarkPriority, number>;
    const byStatus = {} as Record<BookmarkStatus, number>;
    const bySport: Record<string, number> = {};
    const playerCounts: Record<string, number> = {};
    const teamCounts: Record<string, number> = {};

    bookmarks.forEach(bookmark => {
      // By type
      byType[bookmark.type] = (byType[bookmark.type] || 0) + 1;
      
      // By priority
      byPriority[bookmark.priority] = (byPriority[bookmark.priority] || 0) + 1;
      
      // By status
      byStatus[bookmark.status] = (byStatus[bookmark.status] || 0) + 1;
      
      // By sport
      if (bookmark.metadata.sport) {
        bySport[bookmark.metadata.sport] = (bySport[bookmark.metadata.sport] || 0) + 1;
      }
      
      // Player counts
      if (bookmark.type === 'player' && bookmark.metadata?.team) {
        const playerName = bookmark.item?.name || 'Unknown';
        playerCounts[playerName] = (playerCounts[playerName] || 0) + 1;
      }
      
      // Team counts
      if (bookmark.metadata.team) {
        teamCounts[bookmark.metadata.team] = (teamCounts[bookmark.metadata.team] || 0) + 1;
      }
    });

    const sortedPlayers = Object.entries(playerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sortedTeams = Object.entries(teamCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalBookmarks: bookmarks.length,
      byType,
      byPriority,
      byStatus,
      bySport,
      recentBookmarks: [...bookmarks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      mostBookmarkedPlayers: sortedPlayers,
      mostBookmarkedTeams: sortedTeams,
    };
  }, [state.bookmarks]);

  const refreshStats = useCallback(() => {
    setState(prev => ({
      ...prev,
      stats: calculateStats(),
    }));
  }, [calculateStats]);

  // Update stats when bookmarks change
  useEffect(() => {
    refreshStats();
  }, [state.bookmarks, refreshStats]);

  // =============================================
  // CRUD OPERATIONS
  // =============================================

  const addBookmark = useCallback(async <T,>(
    type: BookmarkType,
    itemId: string,
    item: T,
    metadata: Partial<BookmarkMetadata> = {},
    priority: BookmarkPriority = 'medium'
  ): Promise<Bookmark> => {
    // Check if already bookmarked
    const existing = state.bookmarks.find(
      b => b.type === type && b.itemId === itemId && b.status === 'active'
    );
    
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newBookmark: Bookmark = {
      id: uuidv4(),
      type,
      itemId,
      item,
      metadata: {
        ...metadata,
        tags: metadata.tags || [],
        notes: metadata.notes || '',
      },
      priority,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      userId,
    };

    setState(prev => ({
      ...prev,
      bookmarks: [newBookmark, ...prev.bookmarks],
    }));

    // Add to default collection
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(col =>
        col.id === 'default'
          ? {
              ...col,
              bookmarks: [...col.bookmarks, newBookmark.id],
              updatedAt: now,
            }
          : col
      ),
    }));

    return newBookmark;
  }, [state.bookmarks, userId]);

  const removeBookmark = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.id !== id),
      collections: prev.collections.map(col => ({
        ...col,
        bookmarks: col.bookmarks.filter(bId => bId !== id),
        updatedAt: new Date().toISOString(),
      })),
      selectedBookmarks: prev.selectedBookmarks.filter(bId => bId !== id),
    }));
  }, []);

  const updateBookmark = useCallback(async (
    id: string,
    updates: Partial<Bookmark>
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.map(bookmark =>
        bookmark.id === id
          ? {
              ...bookmark,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : bookmark
      ),
    }));
  }, []);

  const getBookmark = useCallback((id: string): Bookmark | undefined => {
    return state.bookmarks.find(b => b.id === id);
  }, [state.bookmarks]);

  // =============================================
  // BULK OPERATIONS
  // =============================================

  const addBookmarks = useCallback(async (
    bookmarks: Array<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Bookmark[]> => {
    const now = new Date().toISOString();
    const newBookmarks: Bookmark[] = bookmarks.map(b => ({
      ...b,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      userId,
    }));

    setState(prev => ({
      ...prev,
      bookmarks: [...newBookmarks, ...prev.bookmarks],
    }));

    // Add to default collection
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(col =>
        col.id === 'default'
          ? {
              ...col,
              bookmarks: [...col.bookmarks, ...newBookmarks.map(b => b.id)],
              updatedAt: now,
            }
          : col
      ),
    }));

    return newBookmarks;
  }, [userId]);

  const removeBookmarks = useCallback(async (ids: string[]): Promise<void> => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => !ids.includes(b.id)),
      collections: prev.collections.map(col => ({
        ...col,
        bookmarks: col.bookmarks.filter(id => !ids.includes(id)),
        updatedAt: new Date().toISOString(),
      })),
      selectedBookmarks: prev.selectedBookmarks.filter(id => !ids.includes(id)),
    }));
  }, []);

  const updateBookmarks = useCallback(async (
    ids: string[],
    updates: Partial<Bookmark>
  ): Promise<void> => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.map(bookmark =>
        ids.includes(bookmark.id)
          ? {
              ...bookmark,
              ...updates,
              updatedAt: now,
            }
          : bookmark
      ),
    }));
  }, []);

  const clearAllBookmarks = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      bookmarks: [],
      collections: prev.collections.map(col => ({
        ...col,
        bookmarks: [],
        updatedAt: new Date().toISOString(),
      })),
      selectedBookmarks: [],
    }));
  }, []);

  // =============================================
  // SELECTION
  // =============================================

  const selectBookmark = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedBookmarks: [...prev.selectedBookmarks, id],
    }));
  }, []);

  const deselectBookmark = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedBookmarks: prev.selectedBookmarks.filter(bId => bId !== id),
    }));
  }, []);

  const selectAllBookmarks = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBookmarks: prev.bookmarks.map(b => b.id),
    }));
  }, []);

  const deselectAllBookmarks = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedBookmarks: [],
    }));
  }, []);

  const toggleBookmarkSelection = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selectedBookmarks: prev.selectedBookmarks.includes(id)
        ? prev.selectedBookmarks.filter(bId => bId !== id)
        : [...prev.selectedBookmarks, id],
    }));
  }, []);

  const isBookmarkSelected = useCallback((id: string): boolean => {
    return state.selectedBookmarks.includes(id);
  }, [state.selectedBookmarks]);

  // =============================================
  // COLLECTIONS
  // =============================================

  const createCollection = useCallback(async (
    name: string,
    description: string = ''
  ): Promise<BookmarkCollection> => {
    const now = new Date().toISOString();
    const newCollection: BookmarkCollection = {
      id: uuidv4(),
      name,
      description,
      bookmarks: [],
      createdAt: now,
      updatedAt: now,
      userId,
      isDefault: false,
    };

    setState(prev => ({
      ...prev,
      collections: [...prev.collections, newCollection],
    }));

    return newCollection;
  }, [userId]);

  const updateCollection = useCallback(async (
    id: string,
    updates: Partial<BookmarkCollection>
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(col =>
        col.id === id
          ? {
              ...col,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : col
      ),
    }));
  }, []);

  const deleteCollection = useCallback(async (id: string): Promise<void> => {
    if (id === 'default') {
      console.warn('Cannot delete default collection');
      return;
    }

    // Move bookmarks to default collection
    const collection = state.collections.find(c => c.id === id);
    if (collection) {
      setState(prev => ({
        ...prev,
        collections: prev.collections.filter(c => c.id !== id),
        bookmarks: prev.bookmarks, // Keep bookmarks
      }));

      // Add bookmarks to default collection
      setState(prev => ({
        ...prev,
        collections: prev.collections.map(col =>
          col.id === 'default'
            ? {
                ...col,
                bookmarks: [...col.bookmarks, ...collection.bookmarks],
                updatedAt: new Date().toISOString(),
              }
            : col
        ),
      }));
    }
  }, [state.collections]);

  const addToCollection = useCallback(async (
    collectionId: string,
    bookmarkIds: string[]
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(col =>
        col.id === collectionId
          ? {
              ...col,
              bookmarks: [...new Set([...col.bookmarks, ...bookmarkIds])],
              updatedAt: new Date().toISOString(),
            }
          : col
      ),
    }));
  }, []);

  const removeFromCollection = useCallback(async (
    collectionId: string,
    bookmarkIds: string[]
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(col =>
        col.id === collectionId
          ? {
              ...col,
              bookmarks: col.bookmarks.filter(id => !bookmarkIds.includes(id)),
              updatedAt: new Date().toISOString(),
            }
          : col
      ),
    }));
  }, []);

  const getCollection = useCallback((id: string): BookmarkCollection | undefined => {
    return state.collections.find(c => c.id === id);
  }, [state.collections]);

  const selectCollection = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedCollectionId: id,
    }));
  }, []);

  // =============================================
  // STATUS & PRIORITY
  // =============================================

  const updateBookmarkStatus = useCallback(async (
    id: string,
    status: BookmarkStatus
  ): Promise<void> => {
    await updateBookmark(id, { status });
  }, [updateBookmark]);

  const updateBookmarkPriority = useCallback(async (
    id: string,
    priority: BookmarkPriority
  ): Promise<void> => {
    await updateBookmark(id, { priority });
  }, [updateBookmark]);

  const archiveBookmark = useCallback(async (id: string): Promise<void> => {
    await updateBookmark(id, { status: 'archived' });
  }, [updateBookmark]);

  const unarchiveBookmark = useCallback(async (id: string): Promise<void> => {
    await updateBookmark(id, { status: 'active' });
  }, [updateBookmark]);

  const completeBookmark = useCallback(async (id: string): Promise<void> => {
    await updateBookmark(id, { status: 'completed' });
  }, [updateBookmark]);

  // =============================================
  // METADATA
  // =============================================

  const addTags = useCallback(async (id: string, tags: string[]): Promise<void> => {
    const bookmark = getBookmark(id);
    if (bookmark) {
      const currentTags = bookmark.metadata.tags || [];
      const newTags = [...new Set([...currentTags, ...tags])];
      await updateBookmark(id, {
        metadata: {
          ...bookmark.metadata,
          tags: newTags,
        },
      });
    }
  }, [getBookmark, updateBookmark]);

  const removeTags = useCallback(async (id: string, tags: string[]): Promise<void> => {
    const bookmark = getBookmark(id);
    if (bookmark) {
      const currentTags = bookmark.metadata.tags || [];
      const newTags = currentTags.filter(t => !tags.includes(t));
      await updateBookmark(id, {
        metadata: {
          ...bookmark.metadata,
          tags: newTags,
        },
      });
    }
  }, [getBookmark, updateBookmark]);

  const updateNotes = useCallback(async (id: string, notes: string): Promise<void> => {
    const bookmark = getBookmark(id);
    if (bookmark) {
      await updateBookmark(id, {
        metadata: {
          ...bookmark.metadata,
          notes,
        },
      });
    }
  }, [getBookmark, updateBookmark]);

  // =============================================
  // FILTERING & SORTING
  // =============================================

  const setFilters = useCallback((filters: Partial<BookmarkFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...filters,
      },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: DEFAULT_FILTERS,
    }));
  }, []);

  const setSort = useCallback((sort: Partial<BookmarkSort>) => {
    setState(prev => ({
      ...prev,
      sort: {
        ...prev.sort,
        ...sort,
      },
    }));
  }, []);

  const getFilteredBookmarks = useCallback((): Bookmark[] => {
    let filtered = [...state.bookmarks];
    const { filters, sort } = state;

    // Filter by type
    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      filtered = filtered.filter(b => types.includes(b.type));
    }

    // Filter by priority
    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      filtered = filtered.filter(b => priorities.includes(b.priority));
    }

    // Filter by status
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      filtered = filtered.filter(b => statuses.includes(b.status));
    }

    // Filter by sport
    if (filters.sport) {
      const sports = Array.isArray(filters.sport) ? filters.sport : [filters.sport];
      filtered = filtered.filter(b => 
        b.metadata.sport && sports.includes(b.metadata.sport)
      );
    }

    // Filter by team
    if (filters.team) {
      const teams = Array.isArray(filters.team) ? filters.team : [filters.team];
      filtered = filtered.filter(b => 
        b.metadata.team && teams.includes(b.metadata.team)
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(b => 
        filters.tags!.some(tag => b.metadata.tags?.includes(tag))
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(b => 
        b.metadata.notes?.toLowerCase().includes(searchLower) ||
        b.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        b.item?.name?.toLowerCase().includes(searchLower) ||
        b.item?.player?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate).getTime();
      filtered = filtered.filter(b => new Date(b.createdAt).getTime() >= fromDate);
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate).getTime();
      filtered = filtered.filter(b => new Date(b.createdAt).getTime() <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      const fieldA = a[sort.field];
      const fieldB = b[sort.field];
      
      if (sort.direction === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });

    return filtered;
  }, [state.bookmarks, state.filters, state.sort]);

  // =============================================
  // SEARCH
  // =============================================

  const searchBookmarks = useCallback((query: string): Bookmark[] => {
    if (!query.trim()) return state.bookmarks;
    
    const searchLower = query.toLowerCase();
    return state.bookmarks.filter(b => 
      b.metadata.notes?.toLowerCase().includes(searchLower) ||
      b.metadata.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      b.item?.name?.toLowerCase().includes(searchLower) ||
      b.item?.player?.toLowerCase().includes(searchLower) ||
      b.item?.team?.toLowerCase().includes(searchLower) ||
      b.item?.description?.toLowerCase().includes(searchLower)
    );
  }, [state.bookmarks]);

  // =============================================
  // EXPORT/IMPORT
  // =============================================

  const exportBookmarks = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'json') {
      return JSON.stringify({
        bookmarks: state.bookmarks,
        collections: state.collections,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }, null, 2);
    } else {
      // CSV format
      const headers = ['id', 'type', 'itemId', 'priority', 'status', 'createdAt', 'sport', 'team', 'notes', 'tags'];
      const rows = state.bookmarks.map(b => [
        b.id,
        b.type,
        b.itemId,
        b.priority,
        b.status,
        b.createdAt,
        b.metadata.sport || '',
        b.metadata.team || '',
        b.metadata.notes || '',
        (b.metadata.tags || []).join(';'),
      ]);
      
      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');
    }
  }, [state.bookmarks, state.collections]);

  const importBookmarks = useCallback(async (data: string): Promise<void> => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
        setState(prev => ({
          ...prev,
          bookmarks: [...prev.bookmarks, ...parsed.bookmarks],
          collections: parsed.collections 
            ? [...prev.collections, ...parsed.collections.filter((c: BookmarkCollection) => c.id !== 'default')]
            : prev.collections,
        }));
      }
    } catch (error) {
      console.error('❌ Failed to import bookmarks:', error);
      throw error;
    }
  }, []);

  // =============================================
  // SYNC
  // =============================================

  const syncBookmarks = useCallback(async (): Promise<void> => {
    if (!enableSync) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate sync with server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        lastSynced: new Date().toISOString(),
        isOffline: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error('❌ Failed to sync bookmarks:', error);
      setState(prev => ({
        ...prev,
        isOffline: true,
        isLoading: false,
        error: 'Failed to sync bookmarks',
      }));
    }
  }, [enableSync]);

  // =============================================
  // UTILITY
  // =============================================

  const isBookmarked = useCallback((type: BookmarkType, itemId: string): boolean => {
    return state.bookmarks.some(
      b => b.type === type && b.itemId === itemId && b.status === 'active'
    );
  }, [state.bookmarks]);

  const getBookmarkByItemId = useCallback((
    type: BookmarkType,
    itemId: string
  ): Bookmark | undefined => {
    return state.bookmarks.find(
      b => b.type === type && b.itemId === itemId && b.status === 'active'
    );
  }, [state.bookmarks]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: BookmarkContextValue = {
    ...state,
    
    // CRUD
    addBookmark,
    removeBookmark,
    updateBookmark,
    getBookmark,
    
    // Bulk
    addBookmarks,
    removeBookmarks,
    updateBookmarks,
    clearAllBookmarks,
    
    // Selection
    selectBookmark,
    deselectBookmark,
    selectAllBookmarks,
    deselectAllBookmarks,
    toggleBookmarkSelection,
    isBookmarkSelected,
    
    // Collections
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollection,
    selectCollection,
    
    // Status & Priority
    updateBookmarkStatus,
    updateBookmarkPriority,
    archiveBookmark,
    unarchiveBookmark,
    completeBookmark,
    
    // Metadata
    addTags,
    removeTags,
    updateNotes,
    
    // Filtering & Sorting
    setFilters,
    resetFilters,
    setSort,
    getFilteredBookmarks,
    
    // Search
    searchBookmarks,
    
    // Export/Import
    exportBookmarks,
    importBookmarks,
    
    // Sync
    syncBookmarks,
    
    // Stats
    refreshStats,
    
    // Utility
    isBookmarked,
    getBookmarkByItemId,
  };

  return (
    <BookmarkContext.Provider value={contextValue}>
      {children}
    </BookmarkContext.Provider>
  );
};

// =============================================
// HOOKS
// =============================================

export const useBookmarks = (): BookmarkContextValue => {
  const context = useContext(BookmarkContext);
  
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  
  return context;
};

export const useBookmark = (id: string) => {
  const context = useBookmarks();
  const bookmark = context.getBookmark(id);
  
  const isSelected = context.isBookmarkSelected(id);
  const toggleSelection = () => context.toggleBookmarkSelection(id);
  
  return {
    bookmark,
    isSelected,
    toggleSelection,
    update: (updates: Partial<Bookmark>) => context.updateBookmark(id, updates),
    remove: () => context.removeBookmark(id),
    archive: () => context.archiveBookmark(id),
    unarchive: () => context.unarchiveBookmark(id),
    complete: () => context.completeBookmark(id),
    addTags: (tags: string[]) => context.addTags(id, tags),
    removeTags: (tags: string[]) => context.removeTags(id, tags),
    updateNotes: (notes: string) => context.updateNotes(id, notes),
  };
};

export const usePlayerBookmark = (playerId: string, player: Player) => {
  const context = useBookmarks();
  const isBookmarked = context.isBookmarked('player', playerId);
  const bookmark = context.getBookmarkByItemId('player', playerId);
  
  const toggleBookmark = useCallback(async () => {
    if (isBookmarked && bookmark) {
      await context.removeBookmark(bookmark.id);
    } else {
      await context.addBookmark(
        'player',
        playerId,
        player,
        {
          sport: player.sport?.toLowerCase(),
          team: player.team,
          imageUrl: player.player_image,
        }
      );
    }
  }, [isBookmarked, bookmark, playerId, player, context]);

  return {
    isBookmarked,
    bookmark,
    toggleBookmark,
  };
};

export const useGameBookmark = (gameId: string, game: Game) => {
  const context = useBookmarks();
  const isBookmarked = context.isBookmarked('game', gameId);
  const bookmark = context.getBookmarkByItemId('game', gameId);
  
  const toggleBookmark = useCallback(async () => {
    if (isBookmarked && bookmark) {
      await context.removeBookmark(bookmark.id);
    } else {
      await context.addBookmark(
        'game',
        gameId,
        game,
        {
          sport: game.sport_title?.toLowerCase(),
          team: game.home_team,
          opponent: game.away_team,
          gameTime: game.commence_time,
        }
      );
    }
  }, [isBookmarked, bookmark, gameId, game, context]);

  return {
    isBookmarked,
    bookmark,
    toggleBookmark,
  };
};

export const useParlayBookmark = (parlayId: string, parlay: ParlaySuggestion) => {
  const context = useBookmarks();
  const isBookmarked = context.isBookmarked('parlay', parlayId);
  const bookmark = context.getBookmarkByItemId('parlay', parlayId);
  
  const toggleBookmark = useCallback(async () => {
    if (isBookmarked && bookmark) {
      await context.removeBookmark(bookmark.id);
    } else {
      await context.addBookmark(
        'parlay',
        parlayId,
        parlay,
        {
          sport: parlay.sport?.toLowerCase(),
          confidence: parlay.confidence,
          tags: parlay.legs?.map(leg => leg.market),
        }
      );
    }
  }, [isBookmarked, bookmark, parlayId, parlay, context]);

  return {
    isBookmarked,
    bookmark,
    toggleBookmark,
  };
};

export const useCollection = (collectionId: string) => {
  const context = useBookmarks();
  const collection = context.getCollection(collectionId);
  
  const bookmarks = collection
    ? context.bookmarks.filter(b => collection.bookmarks.includes(b.id))
    : [];
  
  const isSelected = context.selectedCollectionId === collectionId;
  const select = () => context.selectCollection(collectionId);
  
  return {
    collection,
    bookmarks,
    isSelected,
    select,
    update: (updates: Partial<BookmarkCollection>) => 
      context.updateCollection(collectionId, updates),
    delete: () => context.deleteCollection(collectionId),
    addBookmarks: (bookmarkIds: string[]) => 
      context.addToCollection(collectionId, bookmarkIds),
    removeBookmarks: (bookmarkIds: string[]) => 
      context.removeFromCollection(collectionId, bookmarkIds),
  };
};

export const useBookmarkStats = () => {
  const context = useBookmarks();
  return context.stats;
};

export const useBookmarkFilters = () => {
  const context = useBookmarks();
  
  return {
    filters: context.filters,
    setFilters: context.setFilters,
    resetFilters: context.resetFilters,
    sort: context.sort,
    setSort: context.setSort,
    filteredBookmarks: context.getFilteredBookmarks(),
  };
};

// =============================================
// DEFAULT EXPORT
// =============================================

export default BookmarkProvider;
