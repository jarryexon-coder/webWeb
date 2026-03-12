import React from 'react';
import { useOdds } from '../../hooks/useNcaab';

export const OddsPage: React.FC = () => {
  const { data, isLoading } = useOdds();

  return (
    <div>
      <h1>Betting Odds</h1>
      {isLoading && <p>Loading...</p>}
      <ul>
        {data?.data.map(odd => (
          <li key={`${odd.game_id}-${odd.provider}`}>
            Game {odd.game_id}: Spread {odd.spread}, O/U {odd.over_under}
          </li>
        ))}
      </ul>
    </div>
  );
};
