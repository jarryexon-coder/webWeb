import { useState, useCallback } from 'react';
import { use2026Data } from './use2026Data';

export interface FuturesMarket {
  id: string;
  title: string;
  sport: string;
  category: 'championship' | 'mvp' | 'roy' | 'cy-young';
  favorite: string;
  odds: number;
  impliedProbability: number;
  analysis: string;
}

export const useFutures2026 = () => {
  const { futuresMarkets, isLoading } = use2026Data();
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb' | 'nhl'>('nba');
  const [selectedCategory, setSelectedCategory] = useState<'championship' | 'mvp' | 'roy' | 'cy-young'>('championship');

  const championshipOdds2026 = {
    nba: [
      { team: 'Oklahoma City Thunder', odds: 450, record: '38-12', plusMinus: '+8.4' },
      { team: 'Boston Celtics', odds: 500, record: '35-15', plusMinus: '+7.2' },
      { team: 'Denver Nuggets', odds: 600, record: '34-16', plusMinus: '+6.8' },
      { team: 'Milwaukee Bucks', odds: 750, record: '32-18', plusMinus: '+5.9' },
      { team: 'Dallas Mavericks', odds: 900, record: '31-19', plusMinus: '+5.4' }
    ],
    nfl: [
      { team: 'Kansas City Chiefs', odds: 650, record: '12-5', plusMinus: '+6.2' },
      { team: 'San Francisco 49ers', odds: 700, record: '11-6', plusMinus: '+5.8' },
      { team: 'Baltimore Ravens', odds: 850, record: '11-6', plusMinus: '+5.1' }
    ],
    mlb: [
      { team: 'Los Angeles Dodgers', odds: 400, wins: 98, runDiff: '+124' },
      { team: 'Atlanta Braves', odds: 550, wins: 95, runDiff: '+98' },
      { team: 'New York Yankees', odds: 700, wins: 92, runDiff: '+76' }
    ],
    nhl: [
      { team: 'Edmonton Oilers', odds: 550, points: 78, goalDiff: '+42' },
      { team: 'Colorado Avalanche', odds: 600, points: 76, goalDiff: '+38' },
      { team: 'New Jersey Devils', odds: 800, points: 72, goalDiff: '+31' }
    ]
  };

  const mvpOdds2026 = {
    nba: [
      { player: 'Shai Gilgeous-Alexander', team: 'OKC', odds: 175, ppg: 32.4, apg: 6.8 },
      { player: 'Nikola Jokić', team: 'DEN', odds: 200, ppg: 26.8, rpg: 12.4, apg: 9.1 },
      { player: 'Luka Dončić', team: 'DAL', odds: 250, ppg: 33.1, rpg: 9.4, apg: 10.2 },
      { player: 'Victor Wembanyama', team: 'SAS', odds: 400, ppg: 24.6, rpg: 11.8, bpg: 3.9 }
    ],
    nfl: [
      { player: 'Patrick Mahomes', team: 'KC', odds: 300, yds: 4850, td: 38 },
      { player: 'Josh Allen', team: 'BUF', odds: 350, yds: 4620, td: 35, rushTd: 12 },
      { player: 'Lamar Jackson', team: 'BAL', odds: 400, yds: 3980, td: 32, rushYds: 890 }
    ]
  };

  const royOdds2026 = {
    nba: [
      { player: 'Zaccharie Risacher', team: 'ATL', odds: 150, ppg: 16.4, rpg: 5.2 },
      { player: 'Alex Sarr', team: 'WAS', odds: 200, ppg: 13.8, rpg: 7.6, bpg: 2.1 },
      { player: 'Reed Sheppard', team: 'HOU', odds: 300, ppg: 12.9, apg: 4.8, spg: 1.8 }
    ],
    nfl: [
      { player: 'Caleb Williams', team: 'CHI', odds: 180, yds: 3450, td: 22 },
      { player: 'Jayden Daniels', team: 'WAS', odds: 220, yds: 3210, td: 18, rushYds: 520 }
    ]
  };

  const getMarketsBySport = useCallback((sport: string) => {
    return futuresMarkets.filter(m => m.sport?.toLowerCase() === sport.toLowerCase());
  }, [futuresMarkets]);

  const getValuePlays = useCallback(() => {
    // Find markets with positive edge
    return futuresMarkets.filter(m => {
      const edge = parseFloat(m.edge?.replace('+', '') || '0');
      return edge > 5; // >5% edge
    });
  }, [futuresMarkets]);

  return {
    championshipOdds: championshipOdds2026[selectedSport],
    mvpOdds: mvpOdds2026[selectedSport as keyof typeof mvpOdds2026] || [],
    royOdds: royOdds2026[selectedSport as keyof typeof royOdds2026] || [],
    selectedSport,
    setSelectedSport,
    selectedCategory,
    setSelectedCategory,
    getMarketsBySport,
    getValuePlays,
    isLoading
  };
};
