import { useState, useCallback } from 'react';
import { use2026Data } from './use2026Data';

export interface AltLineProp {
  id: string;
  player: string;
  team: string;
  statType: string;
  standardLine: number;
  altLine: number;
  projection: number;
  edge: number;
  confidence: number;
  odds: string;
}

export const useAltLines = () => {
  const { altLineMarkets, isLoading } = use2026Data();
  const [selectedStat, setSelectedStat] = useState<'points' | 'assists' | 'rebounds' | 'pra'>('points');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const getAltLineVariations = useCallback((player: string, stat: string, baseLine: number) => {
    const variations = [];
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const altLine = baseLine + (i * 0.5);
      variations.push({
        line: altLine,
        odds: altLine > baseLine ? `+${150 + (i * 20)}` : `${-120 - (i * 10)}`,
        impliedProbability: altLine > baseLine ? 0.4 : 0.55
      });
    }
    return variations;
  }, []);

  const playerAltLines2026 = [
    {
      player: 'Luka Dončić',
      team: 'DAL',
      points: { standard: 31.5, altOptions: [28.5, 29.5, 30.5, 32.5, 33.5, 34.5] },
      assists: { standard: 9.5, altOptions: [7.5, 8.5, 9.5, 10.5, 11.5] },
      rebounds: { standard: 8.5, altOptions: [6.5, 7.5, 8.5, 9.5, 10.5] },
      pra: { standard: 49.5, altOptions: [44.5, 46.5, 48.5, 50.5, 52.5, 54.5] }
    },
    {
      player: 'Shai Gilgeous-Alexander',
      team: 'OKC',
      points: { standard: 32.5, altOptions: [29.5, 30.5, 31.5, 33.5, 34.5, 35.5] },
      assists: { standard: 6.5, altOptions: [4.5, 5.5, 6.5, 7.5, 8.5] },
      pra: { standard: 42.5, altOptions: [38.5, 40.5, 41.5, 43.5, 44.5, 45.5] }
    },
    {
      player: 'Victor Wembanyama',
      team: 'SAS',
      points: { standard: 24.5, altOptions: [21.5, 22.5, 23.5, 25.5, 26.5, 27.5] },
      rebounds: { standard: 11.5, altOptions: [9.5, 10.5, 11.5, 12.5, 13.5] },
      blocks: { standard: 3.5, altOptions: [1.5, 2.5, 3.5, 4.5, 5.5] }
    }
  ];

  const getRecommendedAlts = useCallback(() => {
    return altLineMarkets
      .filter(m => {
        const edge = parseFloat(m.edge?.replace('+', '') || '0');
        return edge > 8; // >8% edge on alt lines
      })
      .sort((a, b) => {
        const edgeA = parseFloat(a.edge?.replace('+', '') || '0');
        const edgeB = parseFloat(b.edge?.replace('+', '') || '0');
        return edgeB - edgeA;
      })
      .slice(0, 5);
  }, [altLineMarkets]);

  return {
    altLines: playerAltLines2026,
    selectedStat,
    setSelectedStat,
    selectedPlayer,
    setSelectedPlayer,
    recommendedAlts: getRecommendedAlts(),
    getAltLineVariations,
    isLoading
  };
};
