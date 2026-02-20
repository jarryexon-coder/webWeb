import { useState, useEffect } from 'react';
import { nhlApi } from '../services/api/nhlApi';
import { nhlCache } from '../services/cache/nhlCache';

export const useNHLData = (date: string) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leagueLeaders, setLeagueLeaders] = useState(null);
  const [standings, setStandings] = useState(null);
  const [tradeDeadline, setTradeDeadline] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await nhlApi.getGames(date);
        
        if (data.success) {
          setGames(data.games);
          setLeagueLeaders(data.league_leaders);
          setStandings(data.standings);
          setTradeDeadline(data.trade_deadline);
          
          // Cache data
          await nhlCache.set(date, data);
        }
      } catch (err) {
        setError(err);
        // Load from cache
        const cached = await nhlCache.get(date);
        if (cached) {
          setGames(cached.games);
          setLeagueLeaders(cached.league_leaders);
          setStandings(cached.standings);
          setTradeDeadline(cached.trade_deadline);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  return { games, loading, error, leagueLeaders, standings, tradeDeadline };
};
