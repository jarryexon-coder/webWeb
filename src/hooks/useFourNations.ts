// 4 Nations Face-Off Tournament Hook
import { useState, useEffect } from 'react';

export const useFourNations = () => {
  const [tournamentGames, setTournamentGames] = useState([]);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch 4 Nations tournament data (Feb 15-20, 2026)
    const fetchTournament = async () => {
      try {
        const dates = ['2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];
        const games = [];
        
        for (const date of dates) {
          const data = await nhlApi.getGames(date);
          const tournamentGames = data.games.filter(g => g.tournament);
          games.push(...tournamentGames);
        }
        
        setTournamentGames(games);
        
        // Calculate standings
        const standings = calculateTournamentStandings(games);
        setStandings(standings);
      } catch (error) {
        console.error('Error fetching 4 Nations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournament();
  }, []);

  return { tournamentGames, standings, loading };
};
