import React from 'react';
import { useConferences } from '../../hooks/useNcaab';

export const ConferencesPage: React.FC = () => {
  const { data: conferences, isLoading, error } = useConferences();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>NCAA Basketball Conferences</h1>
      <ul>
        {conferences?.map(conf => (
          <li key={conf.id}>
            {conf.name} {conf.division && `(${conf.division})`}
          </li>
        ))}
      </ul>
    </div>
  );
};
