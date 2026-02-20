import { useState, useEffect, useCallback } from 'react';
import { use2026Data } from './use2026Data';

export interface WorldCupTeam {
  name: string;
  fifaRank: number;
  group: string;
  odds: number;
  starPlayer: string;
}

export interface WorldCupMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stage: 'qualifiers' | 'group' | 'round-16' | 'quarter' | 'semi' | 'final';
  venue: string;
}

export const useWorldCup2026 = () => {
  const { worldCupMarkets, isLoading, fetch2026Markets } = use2026Data();
  const [topTeams, setTopTeams] = useState<WorldCupTeam[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<WorldCupMatch[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');

  // FIFA Rankings as of Feb 2026
  const worldCupTeams2026: WorldCupTeam[] = [
    { name: 'Argentina', fifaRank: 1, group: 'C', odds: 5.5, starPlayer: 'Messi' },
    { name: 'France', fifaRank: 2, group: 'D', odds: 6.0, starPlayer: 'Mbappé' },
    { name: 'Brazil', fifaRank: 3, group: 'F', odds: 6.5, starPlayer: 'Vinicius Jr' },
    { name: 'England', fifaRank: 4, group: 'B', odds: 7.0, starPlayer: 'Kane' },
    { name: 'Spain', fifaRank: 5, group: 'E', odds: 9.0, starPlayer: 'Yamal' },
    { name: 'Germany', fifaRank: 6, group: 'A', odds: 10.0, starPlayer: 'Wirtz' },
    { name: 'USA', fifaRank: 11, group: 'A', odds: 15.0, starPlayer: 'Pulisic' },
    { name: 'Mexico', fifaRank: 14, group: 'A', odds: 20.0, starPlayer: 'Jimenez' },
  ];

  const getGoldenBootOdds = useCallback(() => {
    return [
      { player: 'Kylian Mbappé', odds: 4.5, goals: 7, matches: 5 },
      { player: 'Erling Haaland', odds: 5.0, goals: 6, matches: 4 },
      { player: 'Harry Kane', odds: 6.5, goals: 5, matches: 5 },
      { player: 'Lautaro Martínez', odds: 8.0, goals: 4, matches: 4 },
      { player: 'Vinicius Jr', odds: 9.0, goals: 4, matches: 5 },
    ];
  }, []);

  const getGroupStageOdds = useCallback((group: string) => {
    return worldCupMarkets.filter(m => 
      m.question?.includes(`Group ${group}`) || 
      m.question?.includes(`Group ${group} winner`)
    );
  }, [worldCupMarkets]);

  const getQualificationMarkets = useCallback((confederation: string) => {
    return worldCupMarkets.filter(m => 
      m.question?.includes(`${confederation} qualifier`) ||
      m.question?.includes(`${confederation} qualifying`)
    );
  }, [worldCupMarkets]);

  return {
    worldCupMarkets,
    teams: worldCupTeams2026,
    topTeams: worldCupTeams2026.sort((a, b) => a.odds - b.odds).slice(0, 5),
    goldenBootOdds: getGoldenBootOdds(),
    selectedGroup,
    setSelectedGroup,
    getGroupStageOdds,
    getQualificationMarkets,
    isLoading
  };
};
