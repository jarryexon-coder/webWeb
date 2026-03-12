import React from 'react';
import { useBracket } from '../../hooks/useNcaab';

export const BracketPage: React.FC = () => {
  const { data, isLoading } = useBracket({ season: 2025 });

  if (isLoading) return <div>Loading bracket...</div>;

  // Simple display – you'd render a visual bracket
  return (
    <div>
      <h1>NCAA Tournament Bracket</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
