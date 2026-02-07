// src/hooks/useBackendAPI.ts - UPDATED WITH PRIZEPICKS ANALYTICS
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

// Mock data for when API is unavailable
const MOCK_PARLAY_SUGGESTIONS = {
  success: true,
  suggestions: [
    {
      id: 'parlay-1',
      name: 'NBA Triple Threat',
      sport: 'NBA',
      type: 'Mixed',
      legs: [
        {
          id: 'leg-1',
          gameId: 'game-1',
          description: 'Lakers vs Warriors: Lakers ML',
          odds: '-150',
          confidence: 75,
          sport: 'NBA',
          market: 'h2h',
          outcome: 'Lakers'
        },
        {
          id: 'leg-2',
          gameId: 'game-2',
          description: 'Nuggets vs Celtics: Over 225.5',
          odds: '-110',
          confidence: 68,
          sport: 'NBA',
          market: 'totals',
          outcome: 'Over'
        },
        {
          id: 'leg-3',
          gameId: 'game-3',
          description: 'Suns ML vs Mavericks',
          odds: '+120',
          confidence: 72,
          sport: 'NBA',
          market: 'h2h',
          outcome: 'Suns'
        }
      ],
      totalOdds: '+450',
      confidence: 72,
      analysis: 'Strong favorites with good matchups. Lakers at home have advantage.',
      timestamp: new Date().toISOString(),
      isGenerated: false,
      isToday: true,
      source: 'mock',
      confidence_level: 'high',
      expected_value: '+12%'
    },
    {
      id: 'parlay-2',
      name: 'NFL Sunday Special',
      sport: 'NFL',
      type: 'Moneyline',
      legs: [
        {
          id: 'leg-4',
          gameId: 'game-4',
          description: 'Chiefs vs Bills: Chiefs -3.5',
          odds: '-115',
          confidence: 71,
          sport: 'NFL',
          market: 'spreads',
          outcome: 'Chiefs'
        },
        {
          id: 'leg-5',
          gameId: 'game-5',
          description: 'Eagles ML vs Cowboys',
          odds: '-130',
          confidence: 69,
          sport: 'NFL',
          market: 'h2h',
          outcome: 'Eagles'
        }
      ],
      totalOdds: '+260',
      confidence: 70,
      analysis: 'Top AFC and NFC matchups with home field advantage.',
      timestamp: new Date().toISOString(),
      isGenerated: false,
      isToday: true,
      source: 'mock',
      confidence_level: 'medium',
      expected_value: '+8%'
    }
  ],
  message: 'Using mock data - API unavailable'
};

const MOCK_ODDS_GAMES = {
  success: true,
  games: [
    {
      id: 'game-1',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
      home_team: 'Los Angeles Lakers',
      away_team: 'Golden State Warriors',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Los Angeles Lakers', price: -150 },
                { name: 'Golden State Warriors', price: +130 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'game-2',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      home_team: 'Denver Nuggets',
      away_team: 'Boston Celtics',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Over', price: -110, point: 225.5 },
                { name: 'Under', price: -110, point: 225.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'game-3',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      home_team: 'Phoenix Suns',
      away_team: 'Dallas Mavericks',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Phoenix Suns', price: +120 },
                { name: 'Dallas Mavericks', price: -140 }
              ]
            }
          ]
        }
      ]
    }
  ],
  message: 'Using mock data - API unavailable'
};

// Simple fetch function for fallback
const simpleFetchWithFallback = async (endpoint: string, mockData: any): Promise<any> => {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url).catch(() => null);
    
    if (!response || !response.ok) {
      console.log(`Using mock data for ${endpoint}`);
      return mockData;
    }
    
    return await response.json();
  } catch (error) {
    console.log(`Error fetching ${endpoint}, using mock data:`, error);
    return mockData;
  }
};

// Fetch parlay suggestions
export const useParlaySuggestions = (sport: string = 'all', limit: number = 4) => {
  return useQuery({
    queryKey: ['parlaySuggestions', sport, limit],
    queryFn: async () => {
      const endpoint = `/api/parlay/suggestions?sport=${sport}&limit=${limit}`;
      return await simpleFetchWithFallback(endpoint, MOCK_PARLAY_SUGGESTIONS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_PARLAY_SUGGESTIONS
  });
};

// Fetch odds games
export const useOddsGames = (sport?: string, region: string = 'today') => {
  return useQuery({
    queryKey: ['oddsGames', sport, region],
    queryFn: async () => {
      let endpoint = `/api/odds/games?region=${region}`;
      if (sport && sport !== 'all') {
        endpoint += `&sport=${sport}`;
      }
      return await simpleFetchWithFallback(endpoint, MOCK_ODDS_GAMES);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_ODDS_GAMES
  });
};

// Fetch daily picks
export const useDailyPicks = () => {
  const MOCK_DAILY_PICKS = {
    success: true,
    picks: [
      {
        id: 'pick-1',
        player: 'Nikola Jokic',
        team: 'DEN',
        sport: 'NBA',
        pick: 'Over 25.5 Points',
        confidence: 82,
        odds: '-120',
        edge: '+6.5%',
        analysis: 'Jokic averaging 27.8 PPG in last 10 games. Opponent allows 115.2 PPG to centers.',
        timestamp: new Date().toLocaleString(),
        category: 'High Confidence',
        probability: '79%',
        roi: '+18%',
        units: '2.5',
        requiresPremium: false
      },
      {
        id: 'pick-2',
        player: 'Patrick Mahomes',
        team: 'KC',
        sport: 'NFL',
        pick: 'Over 275.5 Passing Yards',
        confidence: 78,
        odds: '+110',
        edge: '+5.2%',
        analysis: 'Mahomes averages 285 YPG at home. Defense ranks 28th vs pass.',
        timestamp: new Date().toLocaleString(),
        category: 'Value Bet',
        probability: '72%',
        roi: '+22%',
        units: '2.0',
        requiresPremium: false
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['dailyPicks'],
    queryFn: async () => {
      return await simpleFetchWithFallback('/api/daily-picks', MOCK_DAILY_PICKS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_DAILY_PICKS
  });
};

// Fetch fantasy players
export const useFantasyPlayers = (sport: string = 'nba') => {
  const MOCK_PLAYERS = {
    success: true,
    players: [
      {
        id: 'player-1',
        name: 'LeBron James',
        team: 'Los Angeles Lakers',
        position: 'SF',
        number: 23,
        age: 39,
        height: "6'9\"",
        weight: '250 lbs',
        salary: '$47.6M/yr',
        contract: '2 years',
        trend: 'up',
        isPremium: true,
        sport: 'NBA',
        stats: {
          points: 28.9,
          rebounds: 8.3,
          assists: 6.8,
          steals: 1.5,
          blocks: 0.9,
          fgPct: 50.0,
          threePtPct: 40.7,
          turnovers: 3.2
        },
        highlights: [
          '4x NBA Champion',
          '4x NBA MVP',
          '19x All-Star',
          'All-time scoring leader'
        ]
      },
      {
        id: 'player-2',
        name: 'Patrick Mahomes',
        team: 'Kansas City Chiefs',
        position: 'QB',
        number: 15,
        age: 28,
        height: "6'3\"",
        weight: '230 lbs',
        salary: '$45M/yr',
        contract: '10 years',
        trend: 'up',
        isPremium: true,
        sport: 'NFL',
        stats: {
          passingYards: 4852,
          passingTDs: 38,
          interceptions: 12,
          rushingYards: 389,
          rushingTDs: 4,
          completionPct: 68.2,
          qbRating: 105.7,
          fumbles: 5
        },
        highlights: [
          '4x Pro Bowl selection',
          '2x Super Bowl MVP',
          '2022 NFL MVP',
          'NFL passing yards leader'
        ]
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['fantasyPlayers', sport],
    queryFn: async () => {
      const endpoint = `/api/players?sport=${sport}`;
      return await simpleFetchWithFallback(endpoint, MOCK_PLAYERS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_PLAYERS
  });
};

// Sports wire endpoint
export const useSportsWire = (sport?: string) => {
  const MOCK_SPORTS_WIRE = {
    success: true,
    news: [
      {
        id: 'news-1',
        title: 'Lakers Star Returns to Practice',
        summary: 'LeBron James returned to full practice after minor injury scare.',
        content: 'The Los Angeles Lakers received positive news as LeBron James participated fully in practice today. The star forward had been nursing a minor ankle injury but appears ready for tomorrow\'s game against the Warriors.',
        sport: 'NBA',
        source: 'ESPN',
        author: 'Ramona Shelburne',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        tags: ['injury', 'practice', 'lakers'],
        importance: 'high',
        isBreaking: false,
        isPremium: false,
        imageUrl: 'https://example.com/lebron.jpg',
        url: 'https://espn.com/nba/story/12345'
      },
      {
        id: 'news-2',
        title: 'Chiefs vs Bills Injury Report',
        summary: 'Key defensive players questionable for Sunday\'s matchup.',
        content: 'The Kansas City Chiefs have listed three defensive starters as questionable for Sunday\'s crucial AFC matchup against Buffalo. Cornerback Trent McDuffie (knee) and linebacker Willie Gay (back) were limited in practice.',
        sport: 'NFL',
        source: 'NFL Network',
        author: 'Ian Rapoport',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        tags: ['injury', 'chiefs', 'bills'],
        importance: 'medium',
        isBreaking: true,
        isPremium: false,
        imageUrl: 'https://example.com/chiefs-bills.jpg',
        url: 'https://nfl.com/news/12345'
      },
      {
        id: 'news-3',
        title: 'MLB Free Agency Heating Up',
        summary: 'Multiple star players nearing deals as winter meetings approach.',
        content: 'The MLB offseason is heating up with several star players reportedly close to signing new contracts. Sources indicate that Shohei Ohtani could make his decision within the next 48 hours.',
        sport: 'MLB',
        source: 'MLB.com',
        author: 'Jon Morosi',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        tags: ['free-agency', 'mlb', 'signings'],
        importance: 'high',
        isBreaking: false,
        isPremium: true,
        imageUrl: 'https://example.com/mlb-free-agency.jpg',
        url: 'https://mlb.com/news/12345'
      },
      {
        id: 'news-4',
        title: 'NHL Trade Rumors: Goalie Market Active',
        summary: 'Several teams inquiring about available goaltenders.',
        content: 'With the trade deadline approaching, multiple NHL teams are actively seeking goaltending help. The Montreal Canadiens and New Jersey Devils have been the most active in discussions.',
        sport: 'NHL',
        source: 'TSN',
        author: 'Pierre LeBrun',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        tags: ['trades', 'nhl', 'goalies'],
        importance: 'medium',
        isBreaking: false,
        isPremium: false,
        imageUrl: 'https://example.com/nhl-goalie.jpg',
        url: 'https://tsn.ca/nhl/12345'
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['sportsWire', sport],
    queryFn: async () => {
      let endpoint = '/api/sports-wire';
      if (sport && sport !== 'all') {
        endpoint += `?sport=${sport}`;
      }
      return await simpleFetchWithFallback(endpoint, MOCK_SPORTS_WIRE);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_SPORTS_WIRE
  });
};

// Predictions endpoint
export const usePredictions = (analyze?: boolean, prompt?: string) => {
  const MOCK_PREDICTIONS = {
    success: true,
    predictions: [
      {
        id: 'pred-1',
        event: 'NBA: Lakers vs Warriors',
        market: 'Moneyline',
        outcome: 'Lakers Win',
        probability: 65,
        confidence: 78,
        timestamp: new Date().toISOString(),
        analysis: 'Lakers have home court advantage and better recent form. Warriors missing key defensive player.',
        edge: '+8.2%',
        suggested_bet: 'Lakers ML -150',
        kalshi_market_id: 'NBA-LAL-WIN-2024',
        source: 'AI Model v2.1'
      },
      {
        id: 'pred-2',
        event: 'NFL: Chiefs vs Bills',
        market: 'Total Points',
        outcome: 'Over 48.5',
        probability: 62,
        confidence: 72,
        timestamp: new Date().toISOString(),
        analysis: 'Both teams have explosive offenses and weak secondaries. Weather conditions favorable for passing.',
        edge: '+6.5%',
        suggested_bet: 'Over 48.5 -110',
        kalshi_market_id: 'NFL-KC-BUF-OVER-2024',
        source: 'AI Model v2.1'
      },
      {
        id: 'pred-3',
        event: 'MLB: Yankees vs Red Sox',
        market: 'Run Line',
        outcome: 'Yankees -1.5',
        probability: 58,
        confidence: 68,
        timestamp: new Date().toISOString(),
        analysis: 'Yankees ace on the mound vs struggling Red Sox lineup. Yankees bullpen much stronger.',
        edge: '+5.8%',
        suggested_bet: 'Yankees -1.5 +120',
        kalshi_market_id: 'MLB-NYY-RL-2024',
        source: 'AI Model v2.1'
      },
      {
        id: 'pred-4',
        event: 'NHL: Avalanche vs Golden Knights',
        market: 'Puck Line',
        outcome: 'Avalanche -1.5',
        probability: 60,
        confidence: 70,
        timestamp: new Date().toISOString(),
        analysis: 'Avalanche home ice advantage with rested roster. Knights on back-to-back.',
        edge: '+7.1%',
        suggested_bet: 'Avalanche -1.5 +140',
        kalshi_market_id: 'NHL-COL-PL-2024',
        source: 'AI Model v2.1'
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['predictions', analyze, prompt],
    queryFn: async () => {
      let endpoint = '/api/predictions';
      const params = [];
      if (analyze) params.push('analyze=true');
      if (prompt) params.push(`prompt=${encodeURIComponent(prompt)}`);
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }
      return await simpleFetchWithFallback(endpoint, MOCK_PREDICTIONS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    enabled: !analyze || !!prompt, // Only enable if we have a prompt when analyze is true
    placeholderData: MOCK_PREDICTIONS
  });
};

// PrizePicks analytics endpoint - ADDED THIS HOOK
export const usePrizePicksAnalytics = () => {
  const MOCK_PRIZEPICKS_ANALYTICS = {
    success: true,
    analytics: {
      overview: {
        totalSelections: 124,
        winRate: 58.7,
        avgEdge: '+6.2%',
        totalProfit: '+24.5u',
        roi: '+19.8%',
        streak: 'W3',
        bestSport: 'NBA',
        bestMarket: 'Points'
      },
      bySport: [
        {
          sport: 'NBA',
          selections: 68,
          winRate: 62.3,
          avgEdge: '+7.1%',
          profit: '+18.2u'
        },
        {
          sport: 'NFL',
          selections: 32,
          winRate: 56.8,
          avgEdge: '+5.8%',
          profit: '+8.5u'
        },
        {
          sport: 'MLB',
          selections: 16,
          winRate: 52.1,
          avgEdge: '+4.9%',
          profit: '+2.1u'
        },
        {
          sport: 'NHL',
          selections: 8,
          winRate: 61.5,
          avgEdge: '+6.5%',
          profit: '+3.7u'
        }
      ],
      byMarket: [
        {
          market: 'Points',
          selections: 58,
          winRate: 63.2,
          avgEdge: '+7.5%',
          profit: '+16.8u'
        },
        {
          market: 'Rebounds',
          selections: 24,
          winRate: 59.4,
          avgEdge: '+6.3%',
          profit: '+5.2u'
        },
        {
          market: 'Assists',
          selections: 18,
          winRate: 55.8,
          avgEdge: '+5.6%',
          profit: '+3.1u'
        },
        {
          market: 'Passing Yards',
          selections: 16,
          winRate: 57.1,
          avgEdge: '+5.9%',
          profit: '+2.8u'
        },
        {
          market: 'Receiving Yards',
          selections: 8,
          winRate: 52.9,
          avgEdge: '+4.8%',
          profit: '+1.2u'
        }
      ],
      recentPerformance: [
        { date: '2024-01-10', result: 'win', profit: '+2.5u' },
        { date: '2024-01-09', result: 'win', profit: '+1.8u' },
        { date: '2024-01-08', result: 'win', profit: '+3.2u' },
        { date: '2024-01-07', result: 'loss', profit: '-1.5u' },
        { date: '2024-01-06', result: 'win', profit: '+2.1u' }
      ],
      topPlayers: [
        {
          player: 'Nikola Jokic',
          sport: 'NBA',
          selections: 12,
          winRate: 75.0,
          avgEdge: '+9.2%',
          profit: '+8.4u'
        },
        {
          player: 'Patrick Mahomes',
          sport: 'NFL',
          selections: 8,
          winRate: 71.4,
          avgEdge: '+8.1%',
          profit: '+5.2u'
        },
        {
          player: 'Luka Doncic',
          sport: 'NBA',
          selections: 10,
          winRate: 70.0,
          avgEdge: '+7.8%',
          profit: '+6.1u'
        },
        {
          player: 'Josh Allen',
          sport: 'NFL',
          selections: 6,
          winRate: 66.7,
          avgEdge: '+7.3%',
          profit: '+3.8u'
        }
      ]
    },
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['prizePicksAnalytics'],
    queryFn: async () => {
      return await simpleFetchWithFallback('/api/prizepicks/analytics', MOCK_PRIZEPICKS_ANALYTICS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: false,
    placeholderData: MOCK_PRIZEPICKS_ANALYTICS
  });
};

// Additional hooks (keeping your original structure)
export const useFantasyTeams = (sport?: string) => {
  const MOCK_TEAMS = {
    success: true,
    teams: [],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['fantasyTeams', sport],
    queryFn: async () => {
      const endpoint = `/api/fantasy/teams?sport=${sport || 'nba'}`;
      return await simpleFetchWithFallback(endpoint, MOCK_TEAMS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_TEAMS
  });
};

export const usePrizePicksSelections = (sport?: string) => {
  const MOCK_SELECTIONS = {
    success: true,
    selections: [
      {
        id: 'pp-1',
        player: 'Nikola Jokic',
        team: 'DEN',
        sport: 'NBA',
        market: 'Points',
        line: 25.5,
        type: 'Over',
        projection: 27.8,
        edge: '+8.2%',
        confidence: 82,
        odds: '-120',
        analysis: 'Jokic averaging 27.8 PPG in last 10 games. Opponent allows 115.2 PPG to centers.',
        timestamp: new Date().toISOString(),
        isPremium: false,
        isLive: false,
        isRecommended: true
      },
      {
        id: 'pp-2',
        player: 'Patrick Mahomes',
        team: 'KC',
        sport: 'NFL',
        market: 'Passing Yards',
        line: 275.5,
        type: 'Over',
        projection: 288.2,
        edge: '+6.5%',
        confidence: 78,
        odds: '+110',
        analysis: 'Mahomes averages 285 YPG at home. Defense ranks 28th vs pass.',
        timestamp: new Date().toISOString(),
        isPremium: false,
        isLive: false,
        isRecommended: true
      },
      {
        id: 'pp-3',
        player: 'Luka Doncic',
        team: 'DAL',
        sport: 'NBA',
        market: 'Points + Rebounds + Assists',
        line: 45.5,
        type: 'Over',
        projection: 48.2,
        edge: '+7.3%',
        confidence: 75,
        odds: '-115',
        analysis: 'Luka averaging 32.4/8.9/8.2 in last month. High usage with Kyrie out.',
        timestamp: new Date().toISOString(),
        isPremium: true,
        isLive: false,
        isRecommended: true
      },
      {
        id: 'pp-4',
        player: 'Josh Allen',
        team: 'BUF',
        sport: 'NFL',
        market: 'Passing + Rushing TDs',
        line: 2.5,
        type: 'Over',
        projection: 2.8,
        edge: '+5.9%',
        confidence: 72,
        odds: '+130',
        analysis: 'Allen has 3+ TDs in 7 of last 10 games. Miami defense vulnerable.',
        timestamp: new Date().toISOString(),
        isPremium: false,
        isLive: true,
        isRecommended: true
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['prizepicksSelections', sport],
    queryFn: async () => {
      const endpoint = `/api/prizepicks/selections?sport=${sport || 'nba'}`;
      return await simpleFetchWithFallback(endpoint, MOCK_SELECTIONS);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_SELECTIONS
  });
};

export const useAnalytics = () => {
  const MOCK_ANALYTICS = {
    success: true,
    analytics: {},
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      return await simpleFetchWithFallback('/api/analytics', MOCK_ANALYTICS);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_ANALYTICS
  });
};

// Optional: If you need more hooks from your original file, add them below:
export const useTrends = (player?: string) => {
  const MOCK_TRENDS = {
    success: true,
    trends: [],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['trends', player],
    queryFn: async () => {
      const endpoint = `/api/trends${player ? `?player=${player}` : ''}`;
      return await simpleFetchWithFallback(endpoint, MOCK_TRENDS);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_TRENDS
  });
};

export const usePredictionHistory = () => {
  const MOCK_HISTORY = {
    success: true,
    history: [],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['predictionHistory'],
    queryFn: async () => {
      return await simpleFetchWithFallback('/api/history', MOCK_HISTORY);
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_HISTORY
  });
};

export const usePlayerProps = (sport?: string) => {
  const MOCK_PROPS = {
    success: true,
    props: [
      {
        id: 'prop-1',
        player: 'Nikola Jokic',
        team: 'DEN',
        sport: 'NBA',
        market: 'Points',
        line: 25.5,
        overOdds: '-120',
        underOdds: '+100',
        projection: 27.8,
        edge: '+8.2%',
        confidence: 82,
        recommendation: 'Over',
        analysis: 'Jokic dominating paint against smaller defenders.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'prop-2',
        player: 'Patrick Mahomes',
        team: 'KC',
        sport: 'NFL',
        market: 'Passing Yards',
        line: 275.5,
        overOdds: '+110',
        underOdds: '-130',
        projection: 288.2,
        edge: '+6.5%',
        confidence: 78,
        recommendation: 'Over',
        analysis: 'Favorable matchup against weak secondary.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'prop-3',
        player: 'Luka Doncic',
        team: 'DAL',
        sport: 'NBA',
        market: 'Rebounds',
        line: 8.5,
        overOdds: '-115',
        underOdds: '-105',
        projection: 9.2,
        edge: '+5.8%',
        confidence: 71,
        recommendation: 'Over',
        analysis: 'Increased rebounding with Porzingis out.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'prop-4',
        player: 'Josh Allen',
        team: 'BUF',
        sport: 'NFL',
        market: 'Rushing Yards',
        line: 45.5,
        overOdds: '+120',
        underOdds: '-140',
        projection: 51.3,
        edge: '+7.1%',
        confidence: 74,
        recommendation: 'Over',
        analysis: 'Designed runs increasing in red zone.',
        timestamp: new Date().toISOString()
      }
    ],
    message: 'Using mock data - API unavailable'
  };
  
  return useQuery({
    queryKey: ['playerProps', sport],
    queryFn: async () => {
      const endpoint = `/api/player-props?sport=${sport || 'nba'}`;
      return await simpleFetchWithFallback(endpoint, MOCK_PROPS);
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
    placeholderData: MOCK_PROPS
  });
};
