// src/context/FantasyContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Player, FantasyLineup, Sport, LineupSlot } from '../types/fantasy.types';

// Constants
const SALARY_CAP = 50000;
const MAX_PLAYERS = 9;

// Helper to create an empty lineup for a given sport
const createEmptyLineup = (sport: Sport): FantasyLineup => {
  const positions = sport === 'nba'
    ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
    : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];
  
  const slots: LineupSlot[] = positions.map(pos => ({
    position: pos,
    player: null
  }));
  
  return {
    id: `lineup-${Date.now()}`,
    sport,
    slots,
    total_salary: 0,
    total_projection: 0,
    remaining_cap: SALARY_CAP,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Player interface (matches the one used in FantasyHubScreen)
export interface FantasyPlayer extends Player {
  points?: number;
  rebounds?: number;
  assists?: number;
  goals?: number;
  is_rookie?: boolean;
  note?: string;
  trend?: string;
  injury_status?: string;
}

// Context state interface
interface FantasyContextState {
  // Sport & lineup
  activeSport: Sport;
  lineup: FantasyLineup | null;
  savedLineups: Record<string, FantasyLineup>;
  showLineupHistory: boolean;
  
  // Players
  players: FantasyPlayer[];
  filteredPlayers: FantasyPlayer[];
  isLoadingPlayers: boolean;
  error: string | null;
  
  // Actions
  setActiveSport: (sport: Sport) => void;
  addPlayerToLineup: (player: FantasyPlayer) => void;
  removePlayerFromLineup: (playerId: string) => void;
  clearLineup: () => void;
  saveLineup: () => void;
  loadLineup: (lineupId: string) => void;
  setShowLineupHistory: (show: boolean) => void;
  fetchPlayers: () => Promise<void>;
  refreshData: () => void;
}

// Default context value
const defaultContext: FantasyContextState = {
  activeSport: 'nba',
  lineup: null,
  savedLineups: {},
  showLineupHistory: false,
  players: [],
  filteredPlayers: [],
  isLoadingPlayers: false,
  error: null,
  setActiveSport: () => {},
  addPlayerToLineup: () => {},
  removePlayerFromLineup: () => {},
  clearLineup: () => {},
  saveLineup: () => {},
  loadLineup: () => {},
  setShowLineupHistory: () => {},
  fetchPlayers: async () => {},
  refreshData: () => {},
};

const FantasyContext = createContext<FantasyContextState>(defaultContext);

// Provider props
interface FantasyProviderProps {
  children: ReactNode;
  initialSport?: Sport;
}

export const FantasyProvider: React.FC<FantasyProviderProps> = ({ 
  children, 
  initialSport = 'nba' 
}) => {
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [lineup, setLineup] = useState<FantasyLineup | null>(null);
  const [savedLineups, setSavedLineups] = useState<Record<string, FantasyLineup>>({});
  const [showLineupHistory, setShowLineupHistory] = useState(false);
  
  const [players, setPlayers] = useState<FantasyPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<FantasyPlayer[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lineup from localStorage on mount or sport change
  useEffect(() => {
    loadInitialData();
  }, [activeSport]);

  const loadInitialData = async () => {
    try {
      const storageKey = `fantasyHubLineups_${activeSport}_2026`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const lineups: Record<string, FantasyLineup> = JSON.parse(saved);
        setSavedLineups(lineups);
        const lineupArray = Object.values(lineups);
        if (lineupArray.length > 0) {
          setLineup(lineupArray[0]);
        } else {
          setLineup(createEmptyLineup(activeSport));
        }
      } else {
        setLineup(createEmptyLineup(activeSport));
        setSavedLineups({});
      }
    } catch (error) {
      console.error('Failed to load lineup data:', error);
      setLineup(createEmptyLineup(activeSport));
    }
  };

  // Fetch players from backend
  const fetchPlayers = useCallback(async () => {
    setIsLoadingPlayers(true);
    setError(null);

    try {
      const url = `https://python-api-fresh-production.up.railway.app/api/fantasy/players?sport=${activeSport}&limit=100`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      // Handle multiple response formats
      let playersArray = [];
      if (Array.isArray(data)) {
        playersArray = data;
      } else if (data.success && Array.isArray(data.players)) {
        playersArray = data.players;
      } else if (Array.isArray(data.data)) {
        playersArray = data.data;
      } else {
        console.warn('Unexpected API response format:', data);
        playersArray = [];
      }

      const enhancedPlayers: FantasyPlayer[] = playersArray.map((player: any) => ({
        ...player,
        id: player.id || `player-${Math.random()}`,
        name: player.name || 'Unknown Player',
        team: player.team || 'N/A',
        position: player.position || 'N/A',
        salary: player.salary || player.fanduel_salary || 5000,
        fantasy_projection: player.projection || player.projected_points || 0,
        points: player.points || 0,
        rebounds: player.rebounds || 0,
        assists: player.assists || 0,
        value: player.value || player.valueScore || 0,
        injury_status: player.injury_status || 'Healthy',
        sport: activeSport.toUpperCase()
      }));

      setPlayers(enhancedPlayers);
      setFilteredPlayers(enhancedPlayers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
      console.error('Error fetching players:', err);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [activeSport]);

  // Initial fetch
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Lineup manipulation functions
  const addPlayerToLineup = (player: FantasyPlayer) => {
    if (!lineup) return;
    
    const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
    if (filledSlots >= MAX_PLAYERS) {
      alert('Maximum 9 players per lineup');
      return;
    }

    if (player.salary > lineup.remaining_cap) {
      alert(`Insufficient salary cap. Need $${(player.salary - lineup.remaining_cap).toLocaleString()} more.`);
      return;
    }

    const emptySlotIndex = lineup.slots.findIndex(slot => slot.player === null);
    if (emptySlotIndex === -1) return;

    const newSlots = [...lineup.slots];
    newSlots[emptySlotIndex] = {
      ...newSlots[emptySlotIndex],
      player
    };

    const totalSalary = newSlots.reduce(
      (sum, slot) => sum + (slot.player?.salary || 0), 
      0
    );
    const totalProjection = newSlots.reduce(
      (sum, slot) => sum + (slot.player?.fantasy_projection || 0), 
      0
    );

    setLineup({
      ...lineup,
      slots: newSlots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      updated_at: new Date().toISOString()
    });
  };

  const removePlayerFromLineup = (playerId: string) => {
    if (!lineup) return;
    
    const newSlots = lineup.slots.map(slot => 
      slot.player?.id === playerId 
        ? { ...slot, player: null }
        : slot
    );

    const totalSalary = newSlots.reduce(
      (sum, slot) => sum + (slot.player?.salary || 0), 
      0
    );
    const totalProjection = newSlots.reduce(
      (sum, slot) => sum + (slot.player?.fantasy_projection || 0), 
      0
    );

    setLineup({
      ...lineup,
      slots: newSlots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      updated_at: new Date().toISOString()
    });
  };

  const clearLineup = () => {
    if (lineup && window.confirm('Clear your entire lineup?')) {
      setLineup(createEmptyLineup(activeSport));
    }
  };

  const saveLineup = () => {
    if (!lineup) return;
    
    const updatedHistory = {
      ...savedLineups,
      [lineup.id || `lineup-${Date.now()}`]: lineup
    };
    localStorage.setItem(
      `fantasyHubLineups_${activeSport}_2026`,
      JSON.stringify(updatedHistory)
    );
    setSavedLineups(updatedHistory);
    alert('Lineup saved successfully!');
  };

  const loadLineup = (lineupId: string) => {
    const lineupToLoad = savedLineups[lineupId];
    if (lineupToLoad) {
      setLineup(lineupToLoad);
      setShowLineupHistory(false);
    }
  };

  const refreshData = () => {
    loadInitialData();
    fetchPlayers();
  };

  const value: FantasyContextState = {
    activeSport,
    lineup,
    savedLineups,
    showLineupHistory,
    players,
    filteredPlayers,
    isLoadingPlayers,
    error,
    setActiveSport,
    addPlayerToLineup,
    removePlayerFromLineup,
    clearLineup,
    saveLineup,
    loadLineup,
    setShowLineupHistory,
    fetchPlayers,
    refreshData,
  };

  return (
    <FantasyContext.Provider value={value}>
      {children}
    </FantasyContext.Provider>
  );
};

// Custom hook for using the fantasy context
export const useFantasy = () => {
  const context = useContext(FantasyContext);
  if (context === undefined) {
    throw new Error('useFantasy must be used within a FantasyProvider');
  }
  return context;
};
