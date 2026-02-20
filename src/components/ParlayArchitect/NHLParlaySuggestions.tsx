import React from 'react';
import { ParlaySuggestion, ParlayLeg } from '../../types/parlay.types';

interface NHLParlaySuggestionsProps {
  onSelectParlay: (parlay: ParlaySuggestion) => void;
}

const NHLParlaySuggestions: React.FC<NHLParlaySuggestionsProps> = ({ onSelectParlay }) => {
  // February 2026 NHL Parlay Suggestions
  const nhlParlays: ParlaySuggestion[] = [
    {
      id: 'nhl-parlay-1',
      name: 'Superstar Points Parlay',
      sport: 'NHL',
      type: 'Player Props',
      legs: [
        {
          id: 'leg-mcdavid-1',
          player: 'Connor McDavid',
          team: 'EDM',
          position: 'C',
          stat: 'Points',
          line: 1.5,
          prediction: 'OVER',
          odds: '-115',
          confidence: 88,
          sport: 'NHL',
          confidence_level: 'high'
        },
        {
          id: 'leg-matthews-1',
          player: 'Auston Matthews',
          team: 'TOR',
          position: 'C',
          stat: 'Goals',
          line: 0.5,
          prediction: 'OVER',
          odds: '+105',
          confidence: 85,
          sport: 'NHL',
          confidence_level: 'high'
        },
        {
          id: 'leg-makar-1',
          player: 'Cale Makar',
          team: 'COL',
          position: 'D',
          stat: 'Points',
          line: 0.5,
          prediction: 'OVER',
          odds: '-150',
          confidence: 82,
          sport: 'NHL',
          confidence_level: 'high'
        }
      ],
      total_odds: '+475',
      confidence: 84,
      confidence_level: 'high',
      analysis: 'Three of NHL\'s top scorers in favorable matchups. McDavid (10-game streak), Matthews (8 goals last 7), Makar (12 points last 10). All have cleared these lines consistently.',
      risk_level: 3,
      expected_value: '+16.8%',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      ai_metrics: {
        leg_count: 3,
        avg_leg_confidence: 85,
        recommended_stake: '$8.50',
        correlation_score: 0.72
      }
    },
    {
      id: 'nhl-parlay-2',
      name: 'Goalie Duel Under',
      sport: 'NHL',
      type: 'Totals',
      legs: [
        {
          id: 'leg-wpg-1',
          game_id: 'nhl-wpg-vs-min',
          description: 'Winnipeg Jets vs Minnesota Wild',
          stat: 'Total Goals',
          line: 5.5,
          prediction: 'UNDER',
          odds: '-110',
          confidence: 78,
          sport: 'NHL',
          teams: {
            home: 'Winnipeg Jets',
            away: 'Minnesota Wild'
          },
          confidence_level: 'medium'
        },
        {
          id: 'leg-nyr-1',
          game_id: 'nhl-nyr-vs-car',
          description: 'New York Rangers vs Carolina Hurricanes',
          stat: 'Total Goals',
          line: 5.5,
          prediction: 'UNDER',
          odds: '-115',
          confidence: 76,
          sport: 'NHL',
          teams: {
            home: 'New York Rangers',
            away: 'Carolina Hurricanes'
          },
          confidence_level: 'medium'
        }
      ],
      total_odds: '+210',
      confidence: 77,
      confidence_level: 'medium',
      analysis: 'Hellebuyck (.924 SV%) and Shesterkin (.918 SV%) both top-5 in save percentage. Both games feature elite goaltending and defensive systems.',
      risk_level: 2,
      expected_value: '+8.7%',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      ai_metrics: {
        leg_count: 2,
        avg_leg_confidence: 77,
        recommended_stake: '$7.70'
      }
    },
    {
      id: 'nhl-parlay-3',
      name: 'Pacific Division Battle',
      sport: 'NHL',
      type: 'Moneyline',
      legs: [
        {
          id: 'leg-edm-1',
          game_id: 'nhl-edm-vs-vgk',
          description: 'Edmonton Oilers vs Vegas Golden Knights',
          prediction: 'Edmonton Oilers ML',
          odds: '-140',
          confidence: 82,
          sport: 'NHL',
          teams: {
            home: 'Vegas Golden Knights',
            away: 'Edmonton Oilers'
          },
          confidence_level: 'high'
        },
        {
          id: 'leg-van-1',
          game_id: 'nhl-van-vs-sea',
          description: 'Vancouver Canucks vs Seattle Kraken',
          prediction: 'Vancouver Canucks ML',
          odds: '-125',
          confidence: 75,
          sport: 'NHL',
          teams: {
            home: 'Seattle Kraken',
            away: 'Vancouver Canucks'
          },
          confidence_level: 'medium'
        }
      ],
      total_odds: '+185',
      confidence: 79,
      confidence_level: 'medium',
      analysis: 'Oilers on 8-1-1 run, McDavid leading charge. Canucks 6-2-2 in last 10, strong road team.',
      risk_level: 2,
      expected_value: '+11.2%',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      ai_metrics: {
        leg_count: 2,
        avg_leg_confidence: 78.5,
        recommended_stake: '$7.90'
      }
    }
  ];

  return (
    <div className="space-y-4">
      {nhlParlays.map((parlay) => (
        <div key={parlay.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{parlay.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {parlay.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{parlay.analysis}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">{parlay.total_odds}</span>
              <div className="flex items-center space-x-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${
                  parlay.confidence >= 80 ? 'bg-green-500' : 'bg-blue-500'
                }`}></span>
                <span className="text-sm text-gray-600">{parlay.confidence}%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">{parlay.legs.length} legs</span>
              <span className="text-gray-500">EV: {parlay.expected_value}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                parlay.risk_level <= 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                Risk: {parlay.risk_level}/5
              </span>
            </div>
            
            <button
              onClick={() => onSelectParlay(parlay)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Add to Parlay
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NHLParlaySuggestions;
