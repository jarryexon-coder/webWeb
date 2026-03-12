import React from 'react';
import { useStandings } from '../../hooks/useNcaab';

export const StandingsPage: React.FC = () => {
  const { data: standings, isLoading } = useStandings({ season: 2025 });

  // Group by conference
  const grouped = standings?.reduce((acc, s) => {
    const confId = s.conference_id;
    if (!acc[confId]) acc[confId] = [];
    acc[confId].push(s);
    return acc;
  }, {} as Record<number, typeof standings>);

  return (
    <div>
      <h1>NCAA Basketball Standings</h1>
      {isLoading && <p>Loading...</p>}
      {grouped && Object.entries(grouped).map(([confId, teams]) => (
        <div key={confId}>
          <h3>Conference {confId}</h3>
          <table>
            <thead>
              <tr><th>Team</th><th>W</th><th>L</th><th>PCT</th></tr>
            </thead>
            <tbody>
              {teams.map(s => (
                <tr key={s.team_id}>
                  <td>{s.team?.name}</td>
                  <td>{s.wins}</td>
                  <td>{s.losses}</td>
                  <td>{(s.wins / (s.wins + s.losses)).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};
