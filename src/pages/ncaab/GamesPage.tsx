import React, { useState } from 'react';
import { useGames } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

export const GamesPage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data, isLoading } = useGames({ dates: [date], per_page: 25 });

  return (
    <div>
      <h1>NCAA Basketball Games</h1>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <ul>
        {data?.data.map(game => (
          <li key={game.id}>
            <Link to={`/ncaab/games/${game.id}`}>
              {game.away_team?.name} @ {game.home_team?.name} – {game.away_team_score} : {game.home_team_score}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
