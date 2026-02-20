import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { NHLGame, NHLTeam, NHLPlayer, NHLPropLine } from '../../types/nhl.types';

interface NHLGamesProps {
  onSelectGame?: (game: NHLGame) => void;
  onSelectProp?: (prop: NHLPropLine & { player: string; team: string }) => void;
}

const NHLGames: React.FC<NHLGamesProps> = ({ onSelectGame, onSelectProp }) => {
  const [games, setGames] = useState<NHLGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    fetchNHLGames();
  }, [selectedDate]);

  const fetchNHLGames = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getNHLGames(selectedDate, true);
      setGames(data.games || []);
    } catch (error) {
      console.error('Failed to fetch NHL games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamLogo = (teamAbbr: string): string => {
    return `https://assets.nhle.com/logos/nhl/svg/${teamAbbr}_light.svg`;
  };

  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const dates = [
    { value: '2026-02-11', label: 'Today, Feb 11' },
    { value: '2026-02-12', label: 'Tomorrow, Feb 12' },
    { value: '2026-02-13', label: 'Friday, Feb 13' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {dates.map(date => (
          <button
            key={date.value}
            onClick={() => setSelectedDate(date.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              selectedDate === date.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {date.label}
          </button>
        ))}
      </div>

      {/* Trade Deadline Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-4xl">🏒</span>
            <div>
              <p className="text-sm uppercase tracking-wider text-blue-200">NHL Trade Deadline 2026</p>
              <h3 className="text-2xl font-bold">March 7, 2026 • 3:00 PM ET</h3>
              <p className="text-sm text-blue-200 mt-1">24 days remaining • Buyers market expected</p>
            </div>
          </div>
          <div className="bg-white/10 px-6 py-3 rounded-lg">
            <span className="text-3xl font-bold">24</span>
            <span className="text-sm ml-1">days</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition"
          >
            {/* Game Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">{game.time}</span>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">{game.tv}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-yellow-400">
                    {game.confidence_level?.toUpperCase()} CONFIDENCE
                  </span>
                  <span className="text-lg font-bold">{game.confidence_score}%</span>
                </div>
              </div>
            </div>

            {/* Teams */}
            <div className="p-6">
              <div className="flex justify-between items-center">
                {/* Away Team */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    <img 
                      src={getTeamLogo(game.away_team)} 
                      alt={game.away_full}
                      className="h-16 w-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=NHL';
                      }}
                    />
                  </div>
                  <h4 className="font-bold text-lg">{game.away_team}</h4>
                  <p className="text-sm text-gray-600">{game.away_full}</p>
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {game.division}
                    </span>
                  </div>
                </div>

                {/* VS */}
                <div className="px-6">
                  <span className="text-2xl font-bold text-gray-400">@</span>
                </div>

                {/* Home Team */}
                <div className="flex-1 text-center">
                  <div className="flex justify-center mb-3">
                    <img 
                      src={getTeamLogo(game.home_team)} 
                      alt={game.home_full}
                      className="h-16 w-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=NHL';
                      }}
                    />
                  </div>
                  <h4 className="font-bold text-lg">{game.home_team}</h4>
                  <p className="text-sm text-gray-600">{game.home_full}</p>
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {game.division}
                    </span>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="mt-4 text-center text-sm text-gray-500">
                <span className="font-medium">{game.venue}</span>
              </div>

              {/* Odds */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Moneyline</p>
                  <div className="flex justify-around">
                    <div>
                      <p className="text-sm font-medium">{game.away_team}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatOdds(game.odds.moneyline.away)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{game.home_team}</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatOdds(game.odds.moneyline.home)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Spread</p>
                  <div className="flex justify-around">
                    <div>
                      <p className="text-sm font-medium">{game.away_team}</p>
                      <p className="text-sm">+1.5</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatOdds(game.odds.spread.away_odds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{game.home_team}</p>
                      <p className="text-sm">-1.5</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatOdds(game.odds.spread.home_odds)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <div className="flex justify-around">
                    <div>
                      <p className="text-sm font-medium">Over</p>
                      <p className="text-sm">{game.odds.total.line}</p>
                      <p className="text-sm font-bold text-purple-600">
                        {formatOdds(game.odds.total.over)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Under</p>
                      <p className="text-sm">{game.odds.total.line}</p>
                      <p className="text-sm font-bold text-purple-600">
                        {formatOdds(game.odds.total.under)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Props Toggle */}
              <button
                onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-1"
              >
                <span>{expandedGame === game.id ? 'Hide' : 'Show'} Player Props</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${expandedGame === game.id ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Player Props */}
              {expandedGame === game.id && game.player_props && (
                <div className="mt-4 border-t pt-4">
                  <h5 className="font-semibold mb-3">🔥 Featured Props</h5>
                  <div className="space-y-3">
                    {game.player_props.map((prop, idx) => (
                      <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{prop.player}</p>
                            <p className="text-xs text-gray-600">{prop.team} • {prop.position}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            prop.confidence >= 85 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {prop.confidence}% Conf
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {prop.props.map((line, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{line.stat}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono">O {line.line}</span>
                                <span className="text-green-600">{line.over_odds}</span>
                                <button
                                  onClick={() => onSelectProp?.({
                                    ...line,
                                    player: prop.player,
                                    team: prop.team
                                  })}
                                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game Note */}
              {game.note && (
                <div className="mt-4 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <span className="font-semibold">🏒 Note:</span> {game.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🏒</div>
          <h3 className="text-xl font-semibold text-gray-700">No NHL Games Scheduled</h3>
          <p className="text-gray-500 mt-2">Check back tomorrow for matchups</p>
        </div>
      )}
    </div>
  );
};

export default NHLGames;
