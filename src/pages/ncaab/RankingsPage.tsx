import React, { useState } from 'react';
import { useRankings } from '../../hooks/useNcaab';

export const RankingsPage: React.FC = () => {
  const [poll, setPoll] = useState<'AP' | 'Coaches'>('AP');
  const { data: rankings, isLoading } = useRankings({ poll });

  return (
    <div>
      <h1>NCAA Basketball Rankings</h1>
      <select value={poll} onChange={(e) => setPoll(e.target.value as any)}>
        <option value="AP">AP Poll</option>
        <option value="Coaches">Coaches Poll</option>
      </select>
      <ol>
        {rankings?.map(r => (
          <li key={`${r.team_id}-${r.week}`}>
            {r.rank}. {r.team?.name} {r.record && `(${r.record})`}
          </li>
        ))}
      </ol>
    </div>
  );
};
