// src/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

// =============================================
// TYPE DEFINITIONS
// =============================================

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationCategory = 
  | 'system' 
  | 'betting' 
  | 'parlay' 
  | 'player' 
  | 'game' 
  | 'odds' 
  | 'promotion' 
  | 'alert' 
  | 'reminder';

export type NotificationAction = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
};

export type NotificationLink = {
  text: string;
  url: string;
  external?: boolean;
};

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  
  // Timestamps
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  expiresAt?: string;
  
  // Actions
  actions?: NotificationAction[];
  link?: NotificationLink;
  
  // Metadata
  metadata?: Record<string, any>;
  source?: string;
  
  // UI State
  isRead: boolean;
  isDismissed: boolean;
  isPersistent?: boolean;
  
  // Progress (for loading notifications)
  progress?: number;
  total?: number;
  
  // Grouping
  groupId?: string;
  groupKey?: string;
}

export interface NotificationGroup {
  id: string;
  key: string;
  notifications: string[]; // Notification IDs
  count: number;
  title: string;
  type: NotificationType;
  createdAt: string;
  updatedAt: string;
  isCollapsed?: boolean;
  isRead?: boolean;
}

export interface NotificationPreferences {
  // Sound settings
  soundEnabled: boolean;
  soundVolume: number;
  soundType: 'default' | 'gentle' | 'alert' | 'none';
  
  // Visual settings
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  duration: number; // Auto-dismiss duration in ms
  maxVisible: number;
  showProgress: boolean;
  showTimestamp: boolean;
  showIcon: boolean;
  
  // Filtering
  enabledTypes: NotificationType[];
  enabledCategories: NotificationCategory[];
  minPriority: NotificationPriority;
  
  // Desktop notifications
  desktopEnabled: boolean;
  desktopOnlyWhenMinimized: boolean;
  
  // Do not disturb
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
  
  // Email/SMS
  emailEnabled: boolean;
  emailAddress?: string;
  smsEnabled: boolean;
  phoneNumber?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  byType: Record<NotificationType, number>;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface NotificationFilters {
  types?: NotificationType[];
  categories?: NotificationCategory[];
  priorities?: NotificationPriority[];
  isRead?: boolean;
  isDismissed?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  groupId?: string;
}

// =============================================
// CONTEXT STATE
// =============================================

export interface NotificationState {
  // Data
  notifications: Notification[];
  groups: NotificationGroup[];
  
  // UI State
  isOpen: boolean;
  activeTab: 'all' | 'unread' | 'mentions' | 'alerts';
  
  // Preferences
  preferences: NotificationPreferences;
  
  // Filters
  filters: NotificationFilters;
  
  // Stats
  stats: NotificationStats;
  
  // Loading
  isLoading: boolean;
  error: string | null;
}

// =============================================
// CONTEXT VALUE
// =============================================

export interface NotificationContextValue extends NotificationState {
  // CRUD Operations
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>
  ) => string;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  getNotification: (id: string) => Notification | undefined;
  
  // Batch Operations
  addNotifications: (notifications: Array<Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string[];
  removeNotifications: (ids: string[]) => void;
  clearAll: () => void;
  clearDismissed: () => void;
  clearRead: () => void;
  
  // Read/Unread
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  markGroupAsRead: (groupId: string) => void;
  
  // Dismiss
  dismiss: (id: string) => void;
  dismissAll: () => void;
  dismissGroup: (groupId: string) => void;
  
  // Groups
  createGroup: (key: string, title: string, type: NotificationType) => string;
  addToGroup: (groupId: string, notificationId: string) => void;
  removeFromGroup: (groupId: string, notificationId: string) => void;
  deleteGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  
  // UI Controls
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setActiveTab: (tab: NotificationState['activeTab']) => void;
  
  // Preferences
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;
  
  // Filters
  setFilters: (filters: Partial<NotificationFilters>) => void;
  resetFilters: () => void;
  getFilteredNotifications: () => Notification[];
  
  // Search
  searchNotifications: (query: string) => Notification[];
  
  // Convenience Methods
  success: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string;
  error: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string;
  warning: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string;
  info: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string;
  loading: (title: string, message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>) => string;
  
  // Progress Updates
  updateProgress: (id: string, progress: number, total?: number) => void;
  
  // Stats
  refreshStats: () => void;
  
  // System
  requestDesktopPermission: () => Promise<boolean>;
  playSound: (type?: NotificationType) => void;
}

// =============================================
// DEFAULT PREFERENCES
// =============================================

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 0.5,
  soundType: 'default',
  position: 'top-right',
  duration: 5000,
  maxVisible: 5,
  showProgress: true,
  showTimestamp: true,
  showIcon: true,
  enabledTypes: ['success', 'error', 'warning', 'info', 'loading'],
  enabledCategories: ['system', 'betting', 'parlay', 'player', 'game', 'odds', 'promotion', 'alert', 'reminder'],
  minPriority: 'low',
  desktopEnabled: false,
  desktopOnlyWhenMinimized: true,
  doNotDisturb: false,
  emailEnabled: false,
  smsEnabled: false,
};

// =============================================
// INITIAL STATE
// =============================================

const STORAGE_KEY = 'fantasy_notifications';
const PREFERENCES_KEY = 'fantasy_notification_preferences';

const createInitialState = (): NotificationState => ({
  notifications: [],
  groups: [],
  isOpen: false,
  activeTab: 'all',
  preferences: DEFAULT_PREFERENCES,
  filters: {},
  stats: {
    total: 0,
    unread: 0,
    read: 0,
    dismissed: 0,
    byType: {} as Record<NotificationType, number>,
    byCategory: {} as Record<NotificationCategory, number>,
    byPriority: {} as Record<NotificationPriority, number>,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  },
  isLoading: false,
  error: null,
});

// =============================================
// CONTEXT CREATION
// =============================================

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// =============================================
// PROVIDER COMPONENT
// =============================================

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  enablePersistence?: boolean;
  enableSounds?: boolean;
  enableDesktop?: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 50,
  enablePersistence = true,
  enableSounds = true,
  enableDesktop = false,
}) => {
  const [state, setState] = useState<NotificationState>(createInitialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  // =============================================
  // PERSISTENCE
  // =============================================

  const loadFromStorage = useCallback(() => {
    if (!enablePersistence) return;
    
    try {
      // Load notifications
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          notifications: parsed.notifications || [],
          groups: parsed.groups || [],
        }));
      }
      
      // Load preferences
      const prefs = localStorage.getItem(PREFERENCES_KEY);
      if (prefs) {
        const parsedPrefs = JSON.parse(prefs);
        setState(prev => ({
          ...prev,
          preferences: { ...DEFAULT_PREFERENCES, ...parsedPrefs },
        }));
      }
    } catch (error) {
      console.error('❌ Failed to load notifications from storage:', error);
    }
  }, [enablePersistence]);

  const saveToStorage = useCallback(() => {
    if (!enablePersistence) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        notifications: state.notifications,
        groups: state.groups,
      }));
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(state.preferences));
    } catch (error) {
      console.error('❌ Failed to save notifications to storage:', error);
    }
  }, [state.notifications, state.groups, state.preferences, enablePersistence]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    saveToStorage();
  }, [state.notifications, state.groups, state.preferences, saveToStorage]);

  // =============================================
  // AUTO-DISMISS
  // =============================================

  const setupAutoDismiss = useCallback((notification: Notification) => {
    if (notification.isPersistent) return;
    
    const duration = state.preferences.duration;
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismiss(notification.id);
      }, duration);
      
      timeoutRefs.current.set(notification.id, timeout);
    }
  }, [state.preferences.duration]);

  // =============================================
  // NOTIFICATION CRUD
  // =============================================

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>
  ): string => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: now,
      isRead: false,
      isDismissed: false,
      priority: notification.priority || 'medium',
      category: notification.category || 'system',
    };
    
    setState(prev => {
      // Enforce max notifications
      let updatedNotifications = [newNotification, ...prev.notifications];
      if (updatedNotifications.length > maxNotifications) {
        updatedNotifications = updatedNotifications.slice(0, maxNotifications);
      }
      
      return {
        ...prev,
        notifications: updatedNotifications,
      };
    });
    
    // Setup auto-dismiss
    setupAutoDismiss(newNotification);
    
    // Play sound
    if (enableSounds && state.preferences.soundEnabled) {
      playSound(notification.type);
    }
    
    // Show desktop notification
    if (enableDesktop && state.preferences.desktopEnabled && desktopPermission === 'granted') {
      showDesktopNotification(notification.title, notification.message);
    }
    
    return id;
  }, [maxNotifications, setupAutoDismiss, enableSounds, state.preferences.soundEnabled, enableDesktop, state.preferences.desktopEnabled, desktopPermission]);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates }
          : notification
      ),
    }));
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Clear auto-dismiss timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      groups: prev.groups.map(group => ({
        ...group,
        notifications: group.notifications.filter(nId => nId !== id),
      })),
    }));
  }, []);

  const getNotification = useCallback((id: string): Notification | undefined => {
    return state.notifications.find(n => n.id === id);
  }, [state.notifications]);

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  const addNotifications = useCallback((
    notifications: Array<Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string[] => {
    const ids: string[] = [];
    const now = new Date().toISOString();
    
    const newNotifications: Notification[] = notifications.map(n => {
      const id = uuidv4();
      ids.push(id);
      
      return {
        ...n,
        id,
        createdAt: now,
        isRead: false,
        isDismissed: false,
        priority: n.priority || 'medium',
        category: n.category || 'system',
      };
    });
    
    setState(prev => {
      let updatedNotifications = [...newNotifications, ...prev.notifications];
      if (updatedNotifications.length > maxNotifications) {
        updatedNotifications = updatedNotifications.slice(0, maxNotifications);
      }
      
      return {
        ...prev,
        notifications: updatedNotifications,
      };
    });
    
    // Setup auto-dismiss for each
    newNotifications.forEach(n => setupAutoDismiss(n));
    
    return ids;
  }, [maxNotifications, setupAutoDismiss]);

  const removeNotifications = useCallback((ids: string[]) => {
    // Clear timeouts
    ids.forEach(id => {
      const timeout = timeoutRefs.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
      }
    });
    
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => !ids.includes(n.id)),
      groups: prev.groups.map(group => ({
        ...group,
        notifications: group.notifications.filter(id => !ids.includes(id)),
      })),
    }));
  }, []);

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    
    setState(prev => ({
      ...prev,
      notifications: [],
      groups: [],
    }));
  }, []);

  const clearDismissed = useCallback(() => {
    const dismissedIds = state.notifications
      .filter(n => n.isDismissed)
      .map(n => n.id);
    
    removeNotifications(dismissedIds);
  }, [state.notifications, removeNotifications]);

  const clearRead = useCallback(() => {
    const readIds = state.notifications
      .filter(n => n.isRead && !n.isDismissed)
      .map(n => n.id);
    
    removeNotifications(readIds);
  }, [state.notifications, removeNotifications]);

  // =============================================
  // READ/UNREAD
  // =============================================

  const markAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id && !n.isRead
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ),
    }));
  }, []);

  const markAsUnread = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id
          ? { ...n, isRead: false, readAt: undefined }
          : n
      ),
    }));
  }, []);

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({
        ...n,
        isRead: true,
        readAt: n.isRead ? n.readAt : now,
      })),
      groups: prev.groups.map(g => ({
        ...g,
        isRead: true,
      })),
    }));
  }, []);

  const markGroupAsRead = useCallback((groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      const now = new Date().toISOString();
      group.notifications.forEach(id => {
        markAsRead(id);
      });
      
      setState(prev => ({
        ...prev,
        groups: prev.groups.map(g =>
          g.id === groupId
            ? { ...g, isRead: true, updatedAt: now }
            : g
        ),
      }));
    }
  }, [state.groups, markAsRead]);

  // =============================================
  // DISMISS
  // =============================================

  const dismiss = useCallback((id: string) => {
    // Clear auto-dismiss timeout
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id && !n.isDismissed
          ? { ...n, isDismissed: true, dismissedAt: new Date().toISOString() }
          : n
      ),
    }));
  }, []);

  const dismissAll = useCallback(() => {
    const now = new Date().toISOString();
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({
        ...n,
        isDismissed: true,
        dismissedAt: n.isDismissed ? n.dismissedAt : now,
      })),
    }));
  }, []);

  const dismissGroup = useCallback((groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      group.notifications.forEach(id => dismiss(id));
    }
  }, [state.groups, dismiss]);

  // =============================================
  // GROUPS
  // =============================================

  const createGroup = useCallback((
    key: string,
    title: string,
    type: NotificationType
  ): string => {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newGroup: NotificationGroup = {
      id,
      key,
      notifications: [],
      count: 0,
      title,
      type,
      createdAt: now,
      updatedAt: now,
      isCollapsed: false,
      isRead: false,
    };
    
    setState(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }));
    
    return id;
  }, []);

  const addToGroup = useCallback((groupId: string, notificationId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              notifications: [...group.notifications, notificationId],
              count: group.count + 1,
              updatedAt: new Date().toISOString(),
              isRead: false,
            }
          : group
      ),
    }));
  }, []);

  const removeFromGroup = useCallback((groupId: string, notificationId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              notifications: group.notifications.filter(id => id !== notificationId),
              count: group.count - 1,
              updatedAt: new Date().toISOString(),
            }
          : group
      ),
    }));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId),
    }));
  }, []);

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === groupId
          ? { ...g, isCollapsed: !g.isCollapsed, updatedAt: new Date().toISOString() }
          : g
      ),
    }));
  }, []);

  // =============================================
  // UI CONTROLS
  // =============================================

  const openPanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const setActiveTab = useCallback((tab: NotificationState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // =============================================
  // PREFERENCES
  // =============================================

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...updates,
      },
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setState(prev => ({
      ...prev,
      preferences: DEFAULT_PREFERENCES,
    }));
  }, []);

  // =============================================
  // FILTERS
  // =============================================

  const setFilters = useCallback((filters: Partial<NotificationFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...filters,
      },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  const getFilteredNotifications = useCallback((): Notification[] => {
    let filtered = [...state.notifications];
    const { filters } = state;
    
    // Don't show dismissed by default
    if (!filters.isDismissed) {
      filtered = filtered.filter(n => !n.isDismissed);
    }
    
    // Filter by type
    if (filters.types && filters.types.length > 0) {
      filtered = filtered.filter(n => filters.types!.includes(n.type));
    }
    
    // Filter by category
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(n => 
        n.category && filters.categories!.includes(n.category)
      );
    }
    
    // Filter by priority
    if (filters.priorities && filters.priorities.length > 0) {
      filtered = filtered.filter(n => 
        n.priority && filters.priorities!.includes(n.priority)
      );
    }
    
    // Filter by read status
    if (filters.isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === filters.isRead);
    }
    
    // Filter by group
    if (filters.groupId) {
      const group = state.groups.find(g => g.id === filters.groupId);
      if (group) {
        filtered = filtered.filter(n => group.notifications.includes(n.id));
      }
    }
    
    // Filter by date range
    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate).getTime();
      filtered = filtered.filter(n => new Date(n.createdAt).getTime() >= fromDate);
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate).getTime();
      filtered = filtered.filter(n => new Date(n.createdAt).getTime() <= toDate);
    }
    
    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower) ||
        n.metadata?.player?.toLowerCase().includes(searchLower) ||
        n.metadata?.team?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [state.notifications, state.filters, state.groups]);

  // =============================================
  // SEARCH
  // =============================================

  const searchNotifications = useCallback((query: string): Notification[] => {
    if (!query.trim()) return getFilteredNotifications();
    
    const searchLower = query.toLowerCase();
    return getFilteredNotifications().filter(n =>
      n.title.toLowerCase().includes(searchLower) ||
      n.message.toLowerCase().includes(searchLower) ||
      n.metadata?.player?.toLowerCase().includes(searchLower) ||
      n.metadata?.team?.toLowerCase().includes(searchLower) ||
      n.metadata?.game?.toLowerCase().includes(searchLower)
    );
  }, [getFilteredNotifications]);

  // =============================================
  // CONVENIENCE METHODS
  // =============================================

  const success = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const error = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const warning = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const info = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const loading = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ): string => {
    return addNotification({
      type: 'loading',
      title,
      message,
      isPersistent: true,
      ...options,
    });
  }, [addNotification]);

  // =============================================
  // PROGRESS UPDATES
  // =============================================

  const updateProgress = useCallback((id: string, progress: number, total?: number) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id
          ? { ...n, progress, total: total || n.total }
          : n
      ),
    }));
  }, []);

  // =============================================
  // STATS
  // =============================================

  const refreshStats = useCallback(() => {
    const now = new Date();
    const today = now.toDateString();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toDateString();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toDateString();
    
    const stats: NotificationStats = {
      total: state.notifications.length,
      unread: state.notifications.filter(n => !n.isRead && !n.isDismissed).length,
      read: state.notifications.filter(n => n.isRead && !n.isDismissed).length,
      dismissed: state.notifications.filter(n => n.isDismissed).length,
      byType: {} as Record<NotificationType, number>,
      byCategory: {} as Record<NotificationCategory, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };
    
    state.notifications.forEach(n => {
      // By type
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
      
      // By category
      if (n.category) {
        stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
      }
      
      // By priority
      if (n.priority) {
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
      }
      
      // Time-based
      const createdAt = new Date(n.createdAt).toDateString();
      if (createdAt === today) stats.today++;
      if (createdAt >= thisWeekStart) stats.thisWeek++;
      if (createdAt >= thisMonthStart) stats.thisMonth++;
    });
    
    setState(prev => ({ ...prev, stats }));
  }, [state.notifications]);

  useEffect(() => {
    refreshStats();
  }, [state.notifications, refreshStats]);

  // =============================================
  // DESKTOP NOTIFICATIONS
  // =============================================

  const requestDesktopPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Desktop notifications not supported');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    setDesktopPermission(permission);
    return permission === 'granted';
  }, []);

  const showDesktopNotification = useCallback((title: string, body: string) => {
    if (desktopPermission === 'granted' && state.preferences.desktopEnabled) {
      if (state.preferences.doNotDisturb) return;
      
      if (state.preferences.desktopOnlyWhenMinimized && document.visibilityState === 'visible') {
        return;
      }
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, [desktopPermission, state.preferences]);

  // =============================================
  // SOUND
  // =============================================

  const playSound = useCallback((type: NotificationType = 'info') => {
    if (!enableSounds || !state.preferences.soundEnabled || state.preferences.doNotDisturb) {
      return;
    }
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      // Map notification types to sounds
      const soundMap = {
        success: '/sounds/success.mp3',
        error: '/sounds/error.mp3',
        warning: '/sounds/warning.mp3',
        info: '/sounds/info.mp3',
        loading: '/sounds/loading.mp3',
      };
      
      audioRef.current.src = soundMap[type] || soundMap.info;
      audioRef.current.volume = state.preferences.soundVolume;
      audioRef.current.play().catch(e => console.warn('Failed to play sound:', e));
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [enableSounds, state.preferences.soundEnabled, state.preferences.doNotDisturb, state.preferences.soundVolume]);

  // =============================================
  // CLEANUP
  // =============================================

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: NotificationContextValue = {
    ...state,
    
    // CRUD
    addNotification,
    updateNotification,
    removeNotification,
    getNotification,
    
    // Batch
    addNotifications,
    removeNotifications,
    clearAll,
    clearDismissed,
    clearRead,
    
    // Read/Unread
    markAsRead,
    markAsUnread,
    markAllAsRead,
    markGroupAsRead,
    
    // Dismiss
    dismiss,
    dismissAll,
    dismissGroup,
    
    // Groups
    createGroup,
    addToGroup,
    removeFromGroup,
    deleteGroup,
    toggleGroupCollapse,
    
    // UI
    openPanel,
    closePanel,
    togglePanel,
    setActiveTab,
    
    // Preferences
    updatePreferences,
    resetPreferences,
    
    // Filters
    setFilters,
    resetFilters,
    getFilteredNotifications,
    
    // Search
    searchNotifications,
    
    // Convenience
    success,
    error,
    warning,
    info,
    loading,
    
    // Progress
    updateProgress,
    
    // Stats
    refreshStats,
    
    // System
    requestDesktopPermission,
    playSound,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// =============================================
// HOOKS
// =============================================

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export const useNotification = (id: string) => {
  const context = useNotifications();
  const notification = context.getNotification(id);
  
  return {
    notification,
    isRead: notification?.isRead || false,
    isDismissed: notification?.isDismissed || false,
    markAsRead: () => context.markAsRead(id),
    markAsUnread: () => context.markAsUnread(id),
    dismiss: () => context.dismiss(id),
    remove: () => context.removeNotification(id),
    updateProgress: (progress: number, total?: number) => 
      context.updateProgress(id, progress, total),
  };
};

export const useUnreadCount = () => {
  const context = useNotifications();
  return context.stats.unread;
};

export const useNotificationSound = () => {
  const context = useNotifications();
  return context.playSound;
};

export const useNotificationFilters = () => {
  const context = useNotifications();
  
  return {
    filters: context.filters,
    setFilters: context.setFilters,
    resetFilters: context.resetFilters,
    filteredNotifications: context.getFilteredNotifications(),
  };
};

export const useNotificationGroup = (groupId: string) => {
  const context = useNotifications();
  const group = context.groups.find(g => g.id === groupId);
  
  const notifications = group
    ? context.notifications.filter(n => group.notifications.includes(n.id))
    : [];
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return {
    group,
    notifications,
    unreadCount,
    isCollapsed: group?.isCollapsed || false,
    toggleCollapse: () => context.toggleGroupCollapse(groupId),
    markAsRead: () => context.markGroupAsRead(groupId),
    dismiss: () => context.dismissGroup(groupId),
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>) => {
      const id = context.addNotification(notification);
      context.addToGroup(groupId, id);
      return id;
    },
  };
};

export const useBettingNotifications = () => {
  const context = useNotifications();
  
  const addBettingAlert = useCallback((
    title: string,
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ) => {
    return context.addNotification({
      type: 'info',
      category: 'betting',
      priority: 'high',
      title,
      message,
      ...options,
    });
  }, [context]);
  
  const addParlayUpdate = useCallback((
    title: string,
    message: string,
    parlayId?: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ) => {
    return context.addNotification({
      type: 'info',
      category: 'parlay',
      priority: 'medium',
      title,
      message,
      metadata: { parlayId },
      ...options,
    });
  }, [context]);
  
  const addOddsAlert = useCallback((
    title: string,
    message: string,
    odds?: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ) => {
    return context.addNotification({
      type: 'info',
      category: 'odds',
      priority: 'high',
      title,
      message,
      metadata: { odds },
      ...options,
    });
  }, [context]);
  
  return {
    addBettingAlert,
    addParlayUpdate,
    addOddsAlert,
  };
};

export const useSystemNotifications = () => {
  const context = useNotifications();
  
  const addSystemAlert = useCallback((
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ) => {
    return context.addNotification({
      type: priority === 'critical' ? 'error' : priority === 'high' ? 'warning' : 'info',
      category: 'system',
      priority,
      title,
      message,
      ...options,
    });
  }, [context]);
  
  const addMaintenanceAlert = useCallback((
    scheduledTime: string,
    duration: string,
    options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'createdAt' | 'isRead' | 'isDismissed'>>
  ) => {
    return context.addNotification({
      type: 'warning',
      category: 'system',
      priority: 'medium',
      title: 'Scheduled Maintenance',
      message: `System maintenance scheduled for ${scheduledTime}. Estimated duration: ${duration}.`,
      isPersistent: true,
      ...options,
    });
  }, [context]);
  
  return {
    addSystemAlert,
    addMaintenanceAlert,
  };
};

// =============================================
// DEFAULT EXPORT
// =============================================

export default NotificationProvider;
