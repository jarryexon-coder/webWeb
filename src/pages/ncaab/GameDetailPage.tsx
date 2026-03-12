import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame, useTeamStats, usePlayerStats } from '../../hooks/useNcaab';

export const GameDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const gameId = Number(id);
  const { data: game, isLoading } = useGame(gameId);
  const { data: teamStats } = useTeamStats({ game_ids: [gameId] });
  const { data: playerStats } = usePlayerStats({ game_ids: [gameId] });

  if (isLoading) return <div>Loading...</div>;
  if (!game) return <div>Game not found</div>;

  return (
    <div>
      <h1>{game.away_team?.name} @ {game.home_team?.name}</h1>
      <p>Date: {new Date(game.date).toLocaleDateString()}</p>
      <p>Score: {game.away_team_score} – {game.home_team_score}</p>
      <p>Status: {game.status}</p>

      <h3>Team Stats</h3>
      {teamStats?.data.map(stat => (
        <pre key={stat.team_id}>{JSON.stringify(stat, null, 2)}</pre>
      ))}

      <h3>Player Stats</h3>
      <table>
        <thead>
          <tr><th>Player</th><th>PTS</th><th>REB</th><th>AST</th></tr>
        </thead>
        <tbody>
          {playerStats?.data.map(stat => (
            <tr key={stat.player_id}>
              <td>{stat.player_id}</td>
              <td>{stat.points}</td>
              <td>{stat.rebounds}</td>
              <td>{stat.assists}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
