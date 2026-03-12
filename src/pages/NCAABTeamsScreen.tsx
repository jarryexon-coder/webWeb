import React, { useState } from 'react';
import { useTeams } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

export const TeamsPage: React.FC = () => {
  const [perPage] = useState(25);
  const [cursor, setCursor] = useState<number | undefined>();
  const { data, isLoading, error } = useTeams({ per_page: perPage, cursor });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>NCAA Basketball Teams</h1>
      <ul>
        {data?.data.map(team => (
          <li key={team.id}>
            <Link to={`/ncaab/teams/${team.id}`}>
              {team.full_name} ({team.name})
            </Link>
          </li>
        ))}
      </ul>
      {data?.meta.next_cursor && (
        <button onClick={() => setCursor(data.meta.next_cursor)}>
          Next Page
        </button>
      )}
    </div>
  );
};
