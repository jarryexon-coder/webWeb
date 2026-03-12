import React, { useState } from 'react';
import { usePlayers } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

export const PlayersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [teamIds, setTeamIds] = useState<number[]>([]);
  const { data, isLoading, error } = usePlayers({ search, team_ids: teamIds, per_page: 25 });

  return (
    <div>
      <h1>NCAA Basketball Players</h1>
      <input
        type="text"
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ul>
        {data?.data.map(player => (
          <li key={player.id}>
            <Link to={`/ncaab/players/${player.id}`}>
              {player.full_name} {player.team && `- ${player.team.name}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
