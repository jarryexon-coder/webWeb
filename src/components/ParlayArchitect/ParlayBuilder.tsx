import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ParlaySuggestion, ParlayLeg, ParlayStrategy } from '../../types/parlay.types';

interface ParlayBuilderProps {
  initialSport?: string;
  onAddToSlip?: (parlay: ParlaySuggestion) => void;
}

const ParlayBuilder: React.FC<ParlayBuilderProps> = ({ 
  initialSport = 'all', 
  onAddToSlip 
}) => {
  const [suggestions, setSuggestions] = useState<ParlaySuggestion[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedParlay, setSelectedParlay] = useState<ParlaySuggestion | null>(null);
  const [customLegs, setCustomLegs] = useState<ParlayLeg[]>([]);

  useEffect(() => {
    fetchParlaySuggestions();
  }, [selectedSport]);

  const fetchParlaySuggestions = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.getParlaySuggestions(selectedSport, 6);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch parlays:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayout = (odds: string, stake: number = 10): number => {
    if (odds.startsWith('+')) {
      const american = parseInt(odds);
      return stake * (american / 100);
    } else {
      const american = parseInt(odds);
      return stake * (100 / Math.abs(american));
    }
  };

  const formatOdds = (odds: string): string => {
    return odds.startsWith('+') ? odds : odds;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 65) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRiskBadge = (riskLevel: number): JSX.Element => {
    const riskMap: Record<number, { label: string; color: string }> = {
      1: { label: 'Very Low', color: 'bg-green-100 text-green-800' },
      2: { label: 'Low', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      5: { label: 'Very High', color: 'bg-red-100 text-red-800' }
    };
    
    const risk = riskMap[riskLevel] || riskMap[3];
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${risk.color}`}>
        {risk.label} Risk
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Parlay Architect</h1>
            <p className="text-gray-600 mt-1">February 11, 2026 • Powered by DeepSeek AI</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-600">Live Odds</span>
          </div>
        </div>

        {/* Sport Filters */}
        <div className="flex space-x-3">
          {[
            { id: 'all', name: 'All Sports', icon: '🏆' },
            { id: 'nba', name: 'NBA', icon: '🏀', badge: 'All-Star Week' },
            { id: 'nhl', name: 'NHL', icon: '🏒', badge: 'Trade Deadline' }
          ].map(sport => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex-1 p-4 rounded-lg border-2 transition ${
                selectedSport === sport.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">{sport.icon}</span>
                <div>
                  <span className="font-semibold">{sport.name}</span>
                  {sport.badge && (
                    <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                      {sport.badge}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Season Context */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">2025-26 Season Update</p>
              <p className="text-sm text-gray-600">
                {selectedSport === 'nba' && '🏀 NBA All-Star Weekend: Feb 13-15 • Trade Deadline: Feb 19'}
                {selectedSport === 'nhl' && '🏒 NHL Trade Deadline: March 7 • 24 days remaining'}
                {selectedSport === 'all' && '🏀 NBA All-Star • 🏒 NHL Playoff Push • ⚾ MLB Spring Training Feb 22'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Parlay Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suggestions.map((parlay) => (
          <div 
            key={parlay.id} 
            className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition ${
              selectedParlay?.id === parlay.id 
                ? 'border-blue-500 shadow-blue-100' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Parlay Header */}
            <div className={`px-6 py-4 bg-gradient-to-r ${
              parlay.sport === 'NBA' 
                ? 'from-orange-500 to-red-500' 
                : parlay.sport === 'NHL'
                ? 'from-blue-600 to-indigo-600'
                : 'from-purple-500 to-indigo-500'
            } text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-xl">{parlay.name}</h3>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                      {parlay.sport}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 mt-1">{parlay.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{parlay.total_odds}</div>
                  <div className="text-sm text-white/90">Estimated Payout</div>
                </div>
              </div>
            </div>

            {/* Parlay Legs */}
            <div className="p-6">
              <div className="space-y-3 mb-4">
                {parlay.legs.map((leg, index) => (
                  <div 
                    key={leg.id} 
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Leg {index + 1}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {leg.sport}
                        </span>
                      </div>
                      <p className="font-medium mt-1">
                        {leg.player || leg.description}
                      </p>
                      {leg.stat && (
                        <p className="text-sm text-gray-600">
                          {leg.stat} {leg.line && `O/U ${leg.line}`} • {leg.prediction}
                        </p>
                      )}
                      {leg.teams && (
                        <p className="text-xs text-gray-500 mt-1">
                          {leg.teams.away} @ {leg.teams.home}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-mono font-bold text-lg text-gray-900">
                        {formatOdds(leg.odds)}
                      </span>
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${
                          leg.confidence >= 80 ? 'bg-green-500' :
                          leg.confidence >= 70 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></span>
                        <span className="text-xs text-gray-600">
                          {leg.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Parlay Analysis */}
              <div className="border-t pt-4">
                <div className="flex items-start space-x-3">
                  <div className={`flex-1 ${getConfidenceColor(parlay.confidence)} p-3 rounded-lg`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">AI Confidence</span>
                      <span className="text-lg font-bold">{parlay.confidence}%</span>
                    </div>
                    <p className="text-sm">{parlay.analysis}</p>
                  </div>
                </div>

                {/* Parlay Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Risk Level</p>
                    {getRiskBadge(parlay.risk_level)}
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Expected Value</p>
                    <p className="font-semibold text-green-600">{parlay.expected_value}</p>
                  </div>
                </div>

                {/* AI Metrics */}
                {parlay.ai_metrics && (
                  <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span>Legs: {parlay.ai_metrics.leg_count}</span>
                      <span>Avg Confidence: {parlay.ai_metrics.avg_leg_confidence}%</span>
                      <span>Recommended Stake: {parlay.ai_metrics.recommended_stake}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => onAddToSlip?.(parlay)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Add to Bet Slip</span>
                  </button>
                  <button
                    onClick={() => setSelectedParlay(selectedParlay?.id === parlay.id ? null : parlay)}
                    className="px-6 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
                  >
                    {selectedParlay?.id === parlay.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Parlay Builder */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4">🎯 Build Your Own Parlay</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-gray-600 mb-2">Select props from NHL or NBA games to build a custom parlay</p>
          <p className="text-sm text-gray-500">AI will analyze correlation and suggest optimal combinations</p>
          <button className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
            Browse Available Props
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParlayBuilder;
