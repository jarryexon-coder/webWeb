import { useState, useCallback } from 'react';
import { use2026Data } from './use2026Data';

export interface AllStarEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  participants: string[];
  defendingChampion?: string;
}

export const useAllStar2026 = () => {
  const { allStarMarkets, isLoading } = use2026Data();
  const [selectedEvent, setSelectedEvent] = useState<'game' | 'three-point' | 'skills' | 'slam-dunk'>('game');

  const allStarEvents: Record<string, AllStarEvent> = {
    game: {
      id: 'asg-2026',
      name: 'NBA All-Star Game 2026',
      date: 'February 15, 2026',
      venue: 'Chase Center, San Francisco',
      participants: ['East All-Stars', 'West All-Stars'],
      defendingChampion: 'East'
    },
    threePoint: {
      id: 'three-pt-2026',
      name: '3-Point Contest',
      date: 'February 14, 2026',
      venue: 'Chase Center, San Francisco',
      participants: ['Stephen Curry', 'Damian Lillard', 'Tyrese Haliburton', 'Lauri Markkanen'],
      defendingChampion: 'Damian Lillard'
    },
    skills: {
      id: 'skills-2026',
      name: 'Skills Challenge',
      date: 'February 14, 2026',
      venue: 'Chase Center, San Francisco',
      participants: ['Anthony Edwards', 'Victor Wembanyama', 'Chet Holmgren'],
      defendingChampion: 'Team Jazz (2024)'
    },
    slamDunk: {
      id: 'slam-dunk-2026',
      name: 'Slam Dunk Contest',
      date: 'February 14, 2026',
      venue: 'Chase Center, San Francisco',
      participants: ['Ja Morant', 'Zion Williamson', 'Mac McClung', 'Shaedon Sharpe'],
      defendingChampion: 'Mac McClung'
    }
  };

  const getASGProps = useCallback(() => {
    return allStarMarkets.filter(m => 
      m.question?.includes('All-Star Game') ||
      m.question?.includes('ASG MVP')
    );
  }, [allStarMarkets]);

  const getContestProps = useCallback((contest: string) => {
    return allStarMarkets.filter(m => 
      m.question?.toLowerCase().includes(contest.toLowerCase())
    );
  }, [allStarMarkets]);

  const getStartingLineup = useCallback((conference: 'east' | 'west') => {
    if (conference === 'east') {
      return [
        { name: 'Tyrese Haliburton', team: 'IND', position: 'G', votes: '3.2M' },
        { name: 'Jalen Brunson', team: 'NYK', position: 'G', votes: '2.8M' },
        { name: 'Jayson Tatum', team: 'BOS', position: 'F', votes: '3.5M' },
        { name: 'Giannis Antetokounmpo', team: 'MIL', position: 'F', votes: '3.8M' },
        { name: 'Joel Embiid', team: 'PHI', position: 'C', votes: '2.9M' }
      ];
    } else {
      return [
        { name: 'Luka Dončić', team: 'DAL', position: 'G', votes: '4.1M' },
        { name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'G', votes: '3.3M' },
        { name: 'LeBron James', team: 'LAL', position: 'F', votes: '3.9M' },
        { name: 'Kevin Durant', team: 'PHX', position: 'F', votes: '3.1M' },
        { name: 'Nikola Jokić', team: 'DEN', position: 'C', votes: '3.6M' }
      ];
    }
  }, []);

  return {
    events: allStarEvents,
    selectedEvent,
    setSelectedEvent,
    currentEvent: allStarEvents[selectedEvent],
    asgProps: getASGProps(),
    contestProps: getContestProps(selectedEvent),
    eastStarters: getStartingLineup('east'),
    westStarters: getStartingLineup('west'),
    isLoading
  };
};
