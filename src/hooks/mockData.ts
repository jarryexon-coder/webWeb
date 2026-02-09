// src/hooks/mockData.ts - Mock data generators for unified API hook

// ========== MOCK DATA GENERATORS ==========
export const generateMockDailyPicks = (sport: string) => {
  const sportName = sport.toUpperCase();
  return [
    {
      id: 'pick-mock-1',
      sport: sportName,
      player: 'LeBron James',
      market: 'Points',
      line: 27.5,
      side: 'over',
      confidence: 85,
      odds: -140,
      edge: 9.3,
      projection: 29.8,
      game: 'Lakers vs Warriors',
      timestamp: new Date().toISOString(),
      analysis: 'Strong offensive matchup with high pace. LeBron averaging 30.2 PPG in last 5 games.',
      confidence_level: 'high',
      value_rating: 'A+',
      bookmaker: 'DraftKings',
      is_live: false,
      start_time: new Date(Date.now() + 7200000).toISOString()
    },
    {
      id: 'pick-mock-2',
      sport: sportName,
      player: 'Stephen Curry',
      market: 'Three Pointers Made',
      line: 4.5,
      side: 'over',
      confidence: 78,
      odds: -110,
      edge: 6.2,
      projection: 5.2,
      game: 'Warriors vs Lakers',
      timestamp: new Date().toISOString(),
      analysis: 'High volume 3PT shooter in favorable matchup. Averaging 5.3 threes last 3 games.',
      confidence_level: 'medium',
      value_rating: 'B+',
      bookmaker: 'FanDuel',
      is_live: false,
      start_time: new Date(Date.now() + 7200000).toISOString()
    },
    {
      id: 'pick-mock-3',
      sport: sportName,
      player: 'Nikola Jokic',
      market: 'Rebounds',
      line: 12.5,
      side: 'over',
      confidence: 82,
      odds: -120,
      edge: 7.8,
      projection: 14.2,
      game: 'Nuggets vs Celtics',
      timestamp: new Date().toISOString(),
      analysis: 'Dominant rebounder against smaller Celtics frontcourt. Averaging 13.8 rebounds last 5.',
      confidence_level: 'high',
      value_rating: 'A-',
      bookmaker: 'BetMGM',
      is_live: false,
      start_time: new Date(Date.now() + 10800000).toISOString()
    }
  ];
};

export const generateMockParlaySuggestions = (sport: string, limit: number) => {
  const sports = sport === 'all' ? ['NBA', 'NFL', 'NHL'] : [sport.toUpperCase()];
  
  return sports.slice(0, limit).map((sportName, index) => ({
    id: `parlay-mock-${sport}-${index}`,
    name: `${sportName} Expert Parlay`,
    sport: sportName,
    type: 'moneyline',
    legs: [
      {
        id: `leg-mock-${index}-1`,
        game_id: `game-mock-${index}-1`,
        description: `${sportName} Leg 1 - Home Team ML`,
        odds: '-150',
        confidence: 78,
        sport: sportName,
        market: 'h2h',
        teams: { home: 'Home Team', away: 'Away Team' },
        confidence_level: 'high'
      },
      {
        id: `leg-mock-${index}-2`,
        game_id: `game-mock-${index}-2`,
        description: `${sportName} Leg 2 - Away Team +3.5`,
        odds: '-110',
        confidence: 72,
        sport: sportName,
        market: 'spreads',
        teams: { home: 'Home Team', away: 'Away Team' },
        confidence_level: 'medium'
      }
    ],
    total_odds: '+265',
    confidence: 75,
    confidence_level: 'high',
    analysis: `AI-generated ${sportName} parlay with strong value picks.`,
    expected_value: '+7.5%',
    risk_level: 'medium',
    timestamp: new Date().toISOString(),
    isToday: true,
    is_real_data: false,
    ai_metrics: {
      leg_count: 2,
      avg_leg_confidence: 75,
      recommended_stake: '$5.00'
    }
  }));
};

export const generateMockGames = (sport: string = 'basketball_nba') => {
  if (sport.includes('basketball') || sport === 'nba') {
    return [
      {
        id: 'mock-nba-1',
        sport_key: 'basketball_nba',
        sport_title: 'NBA',
        commence_time: new Date(Date.now() + 7200000).toISOString(),
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
      }
    ];
  }
  
  return [
    {
      id: 'mock-game-1',
      sport_key: sport,
      sport_title: sport.toUpperCase(),
      commence_time: new Date(Date.now() + 7200000).toISOString(),
      home_team: 'Home Team',
      away_team: 'Away Team',
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
                { name: 'Home Team', price: -150 },
                { name: 'Away Team', price: +130 }
              ]
            }
          ]
        }
      ]
    }
  ];
};

export const generateMockPrizepicksSelections = (sport: string) => {
  return [
    {
      id: 'pp-mock-1',
      player: 'LeBron James',
      sport: sport.toUpperCase(),
      stat_type: 'Points',
      line: 27.5,
      projection: 29.8,
      projection_diff: 2.3,
      projection_edge: 0.093,
      value_side: 'over',
      over_price: -140,
      under_price: +120,
      game: 'Lakers vs Warriors',
      edge: 9.3,
      confidence: 85,
      timestamp: new Date().toISOString()
    }
  ];
};

export const generateMockPlayerTrends = (sport: string) => {
  const sportName = sport.toUpperCase();
  
  if (sport === 'nba') {
    return [
      {
        id: 'trend-mock-1',
        player: 'LeBron James',
        team: 'Lakers',
        sport: sportName,
        trend: 'up',
        metric: 'Points',
        value: 28.5,
        change: '+2.1%',
        analysis: 'Scoring average increased over last 5 games due to higher usage rate',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 30.2,
        season_avg: 25.8
      },
      {
        id: 'trend-mock-2',
        player: 'Stephen Curry',
        team: 'Warriors',
        sport: sportName,
        trend: 'up',
        metric: 'Three Pointers',
        value: 5.2,
        change: '+3.5%',
        analysis: 'Shooting efficiency improved with return of key teammates',
        confidence: 0.78,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 5.8,
        season_avg: 4.9
      },
      {
        id: 'trend-mock-3',
        player: 'Nikola Jokic',
        team: 'Nuggets',
        sport: sportName,
        trend: 'up',
        metric: 'Assists',
        value: 9.8,
        change: '+1.8%',
        analysis: 'Playmaking role expanded with team injuries',
        confidence: 0.82,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 11.2,
        season_avg: 9.1
      }
    ];
  }
  
  return [
    {
      id: 'trend-mock-1',
      player: 'Top Player',
      team: 'Team A',
      sport: sportName,
      trend: 'up',
      metric: 'Performance',
      value: 25.3,
      change: '+2.1%',
      analysis: 'Performance trending upward',
      confidence: 0.75,
      timestamp: new Date().toISOString()
    }
  ];
};

export const generateMockAnalytics = (sport: string) => {
  return [
    {
      id: 'analytics-mock-1',
      title: 'Player Efficiency Analysis',
      sport: sport.toUpperCase(),
      metric: 'Player Efficiency Rating',
      value: 28.5,
      trend: 'up',
      insights: ['Top players showing increased efficiency', 'Defensive ratings declining'],
      timestamp: new Date().toISOString()
    },
    {
      id: 'analytics-mock-2',
      title: 'Team Performance Trends',
      sport: sport.toUpperCase(),
      metric: 'Win Probability',
      value: 0.68,
      trend: 'stable',
      insights: ['Home teams performing above expectations', 'Underdogs covering spreads'],
      timestamp: new Date().toISOString()
    }
  ];
};

export const generateMockSportsWireNews = (sport: string) => {
  console.log('🔄 Generating enhanced mock sports wire news data');
  
  const sportName = sport.toUpperCase();
  const now = new Date();
  
  // Generate more realistic and varied data
  const categories = ['trades', 'injuries', 'rosters', 'analytics', 'previews', 'rumors', 'signings'];
  const sources = ['ESPN', 'Sports Illustrated', 'Bleacher Report', 'The Athletic', 'CBS Sports', 'Fox Sports'];
  
  const mockNews = Array.from({ length: 15 }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const hoursAgo = Math.floor(Math.random() * 24);
    const publishedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
    const source = sources[Math.floor(Math.random() * sources.length)];
    const confidence = 70 + Math.floor(Math.random() * 25); // 70-95
    
    // Sport-specific content
    const contentTemplates: Record<string, string[]> = {
      'NBA': [
        `${sportName} team looking to make a big move before trade deadline`,
        `Star ${sportName} player reaches new career milestone`,
        `${sportName} coach discusses strategy for upcoming playoffs`,
        `Injury update: ${sportName} player expected to return soon`,
        `${sportName} analytics show surprising trends in player efficiency`
      ],
      'NFL': [
        `${sportName} quarterback sets new passing record`,
        `${sportName} team announces draft strategy`,
        `Injury report: ${sportName} player week-to-week`,
        `${sportName} coach press conference highlights`,
        `${sportName} free agency rumors heating up`
      ],
      'MLB': [
        `${sportName} pitcher throws no-hitter`,
        `${sportName} team makes roster moves`,
        `Spring training updates for ${sportName}`,
        `${sportName} player extension negotiations`,
        `${sportName} analytics: New metrics reveal hidden value`
      ]
    };
    
    const templates = contentTemplates[sportName] || contentTemplates['NBA'];
    const title = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      id: `news-mock-${i + 1}`,
      title: title,
      description: `Latest ${sportName} ${category} news and updates from around the league.`,
      content: `Detailed analysis and insights about the latest developments in ${sportName}. This story includes expert commentary and team reactions.`,
      source: { name: source },
      publishedAt: publishedAt,
      url: `https://example.com/${sport}-news-${i + 1}`,
      urlToImage: `https://picsum.photos/400/300?random=${i + 1}&sport=${sport}&t=${Date.now()}`,
      category: category,
      sport: sportName,
      player: ['LeBron James', 'Stephen Curry', 'Patrick Mahomes', 'Mike Trout'][Math.floor(Math.random() * 4)],
      team: ['Lakers', 'Warriors', 'Chiefs', 'Yankees'][Math.floor(Math.random() * 4)],
      confidence: confidence,
      valueScore: confidence - 5 + Math.floor(Math.random() * 10),
      is_real_data: false
    };
  });
  
  return {
    news: mockNews,
    count: mockNews.length,
    source: 'mock_enhanced',
    success: true,
    timestamp: new Date().toISOString(),
    sport: sport,
    is_real_data: false,
    message: 'Using enhanced mock sports news data'
  };
};

export const generateFallbackFantasyPlayers = (sport: string) => {
  console.log('🔄 Generating fallback fantasy players data');
  
  const players = [
    {
      id: '1',
      name: 'LeBron James',
      team: 'Los Angeles Lakers',
      position: 'SF',
      points: 25.3,
      rebounds: 7.9,
      assists: 7.5,
      steals: 1.2,
      blocks: 0.9,
      three_pointers: 2.1,
      fantasy_points: 45.2,
      fantasyScore: 45.2,
      projected_points: 48.5,
      projection: 48.5,
      salary: 10500,
      fanDuelSalary: 10500,
      draftKingsSalary: 9500,
      value: 4.31,
      valueScore: 4.31,
      ownership: 22.5,
      trend: 'up',
      projectedFantasyScore: 48.5,
      projections: {
        fantasy_points: 48.5,
        points: 28.5,
        rebounds: 8.2,
        assists: 8.5,
        value: 4.62,
        confidence: 0.75
      },
      stats: {
        points: 25.3,
        rebounds: 7.9,
        assists: 7.5,
        steals: 1.2,
        blocks: 0.9,
        three_pointers_made: 2.1,
        minutes: 35.5
      }
    },
    {
      id: '2',
      name: 'Stephen Curry',
      team: 'Golden State Warriors',
      position: 'PG',
      points: 29.4,
      rebounds: 5.5,
      assists: 6.3,
      steals: 1.2,
      blocks: 0.4,
      three_pointers: 5.1,
      fantasy_points: 52.8,
      fantasyScore: 52.8,
      projected_points: 55.2,
      projection: 55.2,
      salary: 11500,
      fanDuelSalary: 11500,
      draftKingsSalary: 10500,
      value: 4.59,
      valueScore: 4.59,
      ownership: 28.7,
      trend: 'stable',
      projectedFantasyScore: 55.2,
      projections: {
        fantasy_points: 55.2,
        points: 31.2,
        rebounds: 5.8,
        assists: 6.8,
        value: 4.80,
        confidence: 0.82
      },
      stats: {
        points: 29.4,
        rebounds: 5.5,
        assists: 6.3,
        steals: 1.2,
        blocks: 0.4,
        three_pointers_made: 5.1,
        minutes: 34.2
      }
    }
  ];
  
  return {
    success: true,
    count: players.length,
    playersCount: players.length,
    is_real_data: false,
    players: players,
    source: 'fallback_mock',
    timestamp: new Date().toISOString(),
    message: 'Using fallback fantasy players data'
  };
};

export const generateFallbackFantasyTeams = (sport: string) => {
  console.log('🔄 Generating fallback fantasy teams data');
  
  const teams = [
    {
      id: '1',
      name: 'The Dynasty',
      owner: 'Mike Smith',
      sport: 'NBA',
      league: 'Premier League',
      record: '12-3-0',
      points: 1850,
      rank: 1,
      players: ['LeBron James', 'Stephen Curry', 'Nikola Jokic'],
      waiverPosition: 3,
      movesThisWeek: 2,
      lastUpdated: new Date().toISOString(),
      projectedPoints: 1920,
      winProbability: 0.78,
      strengthOfSchedule: 0.65
    }
  ];
  
  return {
    success: true,
    count: teams.length,
    teams: teams,
    is_real_data: false,
    source: 'fallback_mock',
    timestamp: new Date().toISOString(),
    message: 'Using fallback fantasy teams data'
  };
};
