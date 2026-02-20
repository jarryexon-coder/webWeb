import React from 'react';
import { TennisPlayer } from '../../types/tennis';

interface Props {
  players: TennisPlayer[];
}

const TennisPlayerTable: React.FC<Props> = ({ players }) => {
  return (
    <table className="player-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Country</th>
          <th>Age</th>
          <th>Points</th>
          <th>Titles</th>
          {players[0]?.fantasy_points && <th>Fantasy Pts</th>}
          {players[0]?.salary && <th>Salary</th>}
        </tr>
      </thead>
      <tbody>
        {players.map((p, idx) => (
          <tr key={p.name + idx}>
            <td>{p.ranking}</td>
            <td>{p.name}</td>
            <td>{p.country}</td>
            <td>{p.age}</td>
            <td>{p.points}</td>
            <td>{p.titles}</td>
            {p.fantasy_points && <td>{p.fantasy_points.toFixed(1)}</td>}
            {p.salary && <td>${p.salary}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TennisPlayerTable;
