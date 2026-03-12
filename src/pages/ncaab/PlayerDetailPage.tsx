import React from 'react';
import { useParams } from 'react-router-dom';
import { usePlayer, usePlayerSeasonStats, usePlayerStats } from '../../hooks/useNcaab';

export const PlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const playerId = Number(id);
  const { data: player, isLoading: playerLoading } = usePlayer(playerId);
  const { data: seasonStats } = usePlayerSeasonStats({ season: 2025, player_ids: [playerId] });
  const { data: gameLogs } = usePlayerStats({ player_ids: [playerId], per_page: 10 });

  if (playerLoading) return <div>Loading...</div>;
  if (!player) return <div>Player not found</div>;

  const season = seasonStats?.data[0];

  return (
    <div>
      <h1>{player.full_name}</h1>
      <p>Team: {player.team?.name}</p>
      <p>Position: {player.position}</p>
      <p>Class: {player.class}</p>

      {season && (
        <section>
          <h3>Season Averages</h3>
          <ul>
            <li>PPG: {season.points_per_game}</li>
            <li>RPG: {season.rebounds_per_game}</li>
            <li>APG: {season.assists_per_game}</li>
          </ul>
        </section>
      )}

      <section>
        <h3>Recent Game Logs</h3>
        <table>
          <thead>
            <tr><th>Date</th><th>Opp</th><th>PTS</th><th>REB</th><th>AST</th></tr>
          </thead>
          <tbody>
            {gameLogs?.data.map(stat => (
              <tr key={stat.game_id}>
                <td>{stat.game_id}</td> {/* You'd need to fetch game details for date/opponent */}
                <td>{stat.points}</td>
                <td>{stat.rebounds}</td>
                <td>{stat.assists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
