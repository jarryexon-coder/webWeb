// src/hooks/useTeams.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { NewsArticle, BeatWriter } from '../types/sports-wire.types';

export const useTeams = (sport: string) => {
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamNews, setTeamNews] = useState<NewsArticle[]>([]);
  const [teamBeatWriters, setTeamBeatWriters] = useState<BeatWriter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await apiClient.getBeatWriters(sport);
        if (data.success) {
          setTeams(Object.keys(data.beat_writers || {}));
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    };

    fetchTeams();
  }, [sport]);

  // Fetch team-specific news
  const fetchTeamNews = async (team: string) => {
    if (!team) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getTeamNews(team, sport);
      if (data.success) {
        setTeamNews(data.news || []);
        setTeamBeatWriters(data.beat_writers || []);
        setSelectedTeam(team);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team news');
    } finally {
      setLoading(false);
    }
  };

  return {
    teams,
    selectedTeam,
    teamNews,
    teamBeatWriters,
    loading,
    error,
    fetchTeamNews,
    setSelectedTeam
  };
};
