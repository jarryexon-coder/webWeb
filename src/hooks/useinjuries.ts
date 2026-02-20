// src/hooks/useInjuries.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Injury, InjuryDashboard } from '../types/sports-wire.types';
import { InjuriesResponse, InjuryDashboardResponse } from '../types/api.types';

export const useInjuries = (sport: string, team?: string) => {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [dashboard, setDashboard] = useState<InjuryDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInjuries = async () => {
      try {
        setLoading(true);
        
        const data = await apiClient.getInjuries(sport, team);
        if (data.success) {
          setInjuries(data.injuries || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch injuries');
      } finally {
        setLoading(false);
      }
    };

    fetchInjuries();
  }, [sport, team]);

  const fetchDashboard = async () => {
    try {
      const data = await apiClient.getInjuryDashboard(sport);
      if (data.success) {
        setDashboard(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch injury dashboard:', err);
    }
  };

  const getInjuriesByTeam = (teamName: string) => {
    return injuries.filter(injury => injury.team === teamName);
  };

  const getInjuriesByStatus = (status: string) => {
    return injuries.filter(injury => injury.status === status);
  };

  return { 
    injuries, 
    dashboard, 
    loading, 
    error, 
    fetchDashboard,
    getInjuriesByTeam,
    getInjuriesByStatus 
  };
};
