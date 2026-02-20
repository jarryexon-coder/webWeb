// src/components/FantasyHub/FantasyHubDashboard.tsx
import React from 'react';
import NHLProps from './NHLProps';
import NBAProps from './NBAProps';
import FantasyLineupBuilder from './FantasyLineupBuilder';
import PlayerTrends from './PlayerTrends';
import TradeDeadlineTracker from './TradeDeadlineTracker';
import AllStarCountdown from './AllStarCountdown';
import {
  Player,
  Sport,
  FantasyLineup,
} from '../../types/fantasy.types';

interface FantasyHubDashboardProps {
  sport: Sport;
  lineup: FantasyLineup;
  onAddPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  onClearLineup: () => void;
  allPlayers: Player[]; // full player list from parent
}

const FantasyHubDashboard: React.FC<FantasyHubDashboardProps> = ({
  sport,
  lineup,
  onAddPlayer,
  onRemovePlayer,
  onClearLineup,
  allPlayers,
}) => {
  const SALARY_CAP = 50000;
  const MAX_PLAYERS = 9;

  const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
  const totalSalary = lineup.slots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
  const totalProjection = lineup.slots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with sport context and salary cap */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">FantasyHub 2026</h1>
            <p className="text-indigo-200 mt-1">
              February 20, 2026 • 2025-26 Season
            </p>
            <div className="mt-4 flex items-center space-x-4">
              {sport === 'nba' && <AllStarCountdown />}
              {sport === 'nhl' && <TradeDeadlineTracker />}
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-lg text-right">
            <div className="text-sm text-indigo-200">Salary Cap</div>
            <div className="text-2xl font-bold">
              ${totalSalary.toLocaleString()}
            </div>
            <div className="text-xs text-indigo-200">
              of ${SALARY_CAP.toLocaleString()}
            </div>
            <div className="mt-2 text-xs">
              {filledSlots}/{MAX_PLAYERS} players
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: props + lineup builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – Player Props */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="text-xl font-semibold mb-4">
              {sport === 'nba' ? '🏀 NBA Player Props' : '🏒 NHL Player Props'}
            </h2>
            {sport === 'nba' ? (
              <NBAProps onAddToLineup={onAddPlayer} allPlayers={allPlayers} />
            ) : (
              <NHLProps onAddToLineup={onAddPlayer} allPlayers={allPlayers} />
            )}
          </div>
        </div>

        {/* Right column – Lineup Builder and Trends */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="text-xl font-semibold mb-4">📋 Your Lineup</h2>
            <FantasyLineupBuilder
              lineup={lineup}
              onRemovePlayer={onRemovePlayer}
              onClearLineup={onClearLineup}
            />
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <h3 className="text-lg font-semibold mb-3">📈 Trending</h3>
            <PlayerTrends sport={sport} onSelectPlayer={onAddPlayer} allPlayers={allPlayers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FantasyHubDashboard;
