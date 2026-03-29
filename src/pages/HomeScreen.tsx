// src/pages/HomeScreen.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Container,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SportsGolfIcon from '@mui/icons-material/SportsGolf';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import RocketOutlinedIcon from '@mui/icons-material/RocketOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import MergeIcon from '@mui/icons-material/Merge';
import AddTaskIcon from '@mui/icons-material/AddTask';

const HomeScreen = () => {
  // Parlay & Betting Tools Section
  const parlayTools = [
    {
      title: '🏗️ Parlay Architect',
      description: 'Build data-driven parlays with real-time player props across NBA, NHL, and MLB. AI-powered generation, smart filtering by confidence (60-100%) and risk level, plus support for Standard, Same-Game, Teaser, and Round Robin parlays. Real odds calculation with correlation scoring and payout projections.',
      icon: <MergeIcon fontSize="large" />,
      path: '/parlay-architect',
      color: '#8b5cf6',
      badges: ['Live Data', 'AI-Powered', '6 Parlay Types']
    },
    {
      title: '🎯 Same-Game Parlay',
      description: 'One featured parlay per sport—completely free. AI generator with 15+ curated prompts + custom prompt support. Combines player props, moneyline, and totals into optimized parlays. Each leg shows confidence scoring, projected stats, and risk assessment with expected value calculations.',
      icon: <AddTaskIcon fontSize="large" />,
      path: '/same-game-parlay',
      color: '#ec4899',
      badges: ['Featured Free', 'Instant Generation', 'Mixed Markets']
    },
    {
      title: 'PrizePicks Props',
      description: 'Real-time player props with odds from multiple bookmakers. Kelly Criterion bet sizing calculates optimal wagers based on your bankroll. Filter by stat type, edge threshold, and value side. AI prop generator creates personalized recommendations from natural language prompts.',
      icon: <CasinoOutlinedIcon fontSize="large" />,
      path: '/prizepicks',
      color: '#f59e0b',
      badges: ['Live Odds', 'Kelly Criterion', '+EV Finder']
    },
    {
      title: 'AI Parlay Suggestions',
      description: 'AI-generated parlay recommendations based on real player props. Analyzes confidence levels, betting edges, and odds to suggest high-confidence, best-value, and balanced parlays. Filter by sport, confidence threshold, or number of legs with confidence distribution charts.',
      icon: <AutoAwesomeIcon fontSize="large" />,
      path: '/ai-parlay-suggestions',
      color: '#10b981',
      badges: ['AI Recommendations', 'Edge Analysis', 'Confidence Scoring']
    }
  ];

  // Sports & Analytics Section
  const sportsAnalytics = [
    {
      title: 'Live Games',
      description: 'Catch the action as it happens. Real-time scores, play-by-play updates, and key moments across NBA, NFL, MLB, and NHL. Stay on top of every game without missing a beat—fast, live, and all in one place.',
      icon: <SportsBasketballIcon fontSize="large" />,
      path: '/live-games',
      color: '#1976d2',
      badges: ['Live Scores', 'Multi-Sport', 'Real-Time']
    },
    {
      title: 'NBA Dashboard',
      description: 'Fantasy basketball command center with player projections, top 10 charts, value picks table, and today\'s games. Real-time fantasy points, points, rebounds, assists, and value metrics with data freshness timestamps.',
      icon: <SportsBasketballIcon fontSize="large" />,
      path: '/nba-dashboard',
      color: '#ef4444',
      badges: ['Fantasy Points', 'Value Picks', 'Live Games']
    },
    {
      title: 'NHL Dashboard',
      description: 'Hockey analytics with live games, conference standings, and player stats. Track skaters (goals, assists, points) and goalies (GAA, save %). Points percentage bars, streak chips, and plan-based access tiers.',
      icon: <SportsHockeyIcon fontSize="large" />,
      path: '/nhl-dashboard',
      color: '#1e40af',
      badges: ['Standings', 'Player Stats', 'Fantasy']
    },
    {
      title: 'MLB Spring Training',
      description: 'Spring training hub for Grapefruit and Cactus League games. Track standings, hitting/pitching leaders, and top prospects. Weather integration shows temperature and conditions for outdoor venues.',
      icon: <SportsBaseballIcon fontSize="large" />,
      path: '/mlb-spring-training',
      color: '#10b981',
      badges: ['Spring Games', 'Prospects', 'Weather']
    }
  ];

  // News & Insights Section
  const newsInsights = [
    {
      title: 'SportsWire',
      description: 'The pulse of the league: real-time news, injury dashboard with color-coded severity (Out, Doubtful, Questionable), beat writer integration from top reporters, and smart search by player, team, or writer. Bookmark important news and share updates.',
      icon: <NewspaperIcon fontSize="large" />,
      path: '/sportswire',
      color: '#f97316',
      badges: ['Breaking News', 'Injury Tracker', 'Beat Writers']
    },
    {
      title: 'NewsDesk',
      description: 'Stay informed with your hub for the latest headlines, breaking news, and in-depth stories. Curated for speed and clarity, it gives you the essential updates you need, whenever you need them.',
      icon: <NewspaperIcon fontSize="large" />,
      path: '/newsdesk',
      color: '#3b82f6',
      badges: ['Breaking News', 'Headlines', 'Daily Updates']
    },
    {
      title: 'Daily Picks',
      description: 'AI-curated daily betting picks with real-time updates every 60 seconds. Browse player props, sharp money moves, and game winners. Filter by sport, confidence level, stat type, and edge percentage. 30+ prompts for insider tips and advanced analytics.',
      icon: <TrendingUpIcon fontSize="large" />,
      path: '/daily-picks',
      color: '#d32f2f',
      badges: ['60s Updates', 'Sharp Money', '30+ Prompts']
    },
    {
      title: 'Secret Phrases Hub',
      description: 'Unlock insider betting intelligence with AI-generated secret phrases. Access sharp money moves, advanced analytics, injury updates, line movements, and prop value insights. Special commands like "predictive clustering" and "bayesian inference" for exclusive content.',
      icon: <SecurityIcon fontSize="large" />,
      path: '/secret-phrases',
      color: '#7b1fa2',
      badges: ['Insider Intel', 'Hidden Features', 'Exclusive']
    }
  ];

  // Tennis Section
  const tennisPages = [
    {
      title: 'Tennis Players',
      description: 'Explore detailed profiles of ATP players, including rankings, points, country, age, and playing hand. Browse top 10 players, identify rising stars, and track performance. Filter by tour and view player statistics.',
      icon: <SportsTennisIcon fontSize="large" />,
      path: '/tennis/players',
      color: '#2e7d32',
      badges: ['ATP Rankings', 'Player Profiles', 'Stats']
    },
    {
      title: 'Tennis Tournaments',
      description: 'Explore ATP tour schedules including Grand Slams, Masters 1000, and 500/250 level events. View tournament dates, locations, purse sizes, and defending champions. Filter by tour and year.',
      icon: <SportsTennisIcon fontSize="large" />,
      path: '/tennis/tournaments',
      color: '#2e7d32',
      badges: ['Grand Slams', 'Masters 1000', 'Schedule']
    },
    {
      title: 'Tennis Matches',
      description: 'Stay up to date with ATP tour matches, including Grand Slams, Masters 1000, and 500/250 level events. View match schedules, live scores, and completed results. Filter by surface type and date.',
      icon: <SportsTennisIcon fontSize="large" />,
      path: '/tennis/matches',
      color: '#2e7d32',
      badges: ['Live Scores', 'Match Schedule', 'Surface Filter']
    }
  ];

  // Golf Section
  const golfPages = [
    {
      title: 'Golf Players',
      description: 'Browse comprehensive player profiles for top PGA Tour golfers. View world rankings, points averages, tournament wins, top-10 finishes, and season earnings. Filter by country, explore top-10 players, winners, and earnings leaders.',
      icon: <SportsGolfIcon fontSize="large" />,
      path: '/golf/players',
      color: '#1565c0',
      badges: ['World Rankings', 'Earnings', 'Winners']
    },
    {
      title: 'Golf Tournaments',
      description: 'Explore the complete PGA Tour schedule including majors, elevated events, and regular tournaments. View tournament dates, locations, purse sizes, and defending champions. Filter by tour and year.',
      icon: <SportsGolfIcon fontSize="large" />,
      path: '/golf/tournaments',
      color: '#1565c0',
      badges: ['Majors', 'Purse Sizes', 'Schedule']
    },
    {
      title: 'Golf Leaderboard',
      description: 'Track live PGA Tour leaderboards with real-time scores, round-by-round stats, and earnings. View player positions, scores to par, and tournament progress. Select from upcoming and completed tournaments.',
      icon: <SportsGolfIcon fontSize="large" />,
      path: '/golf/leaderboard',
      color: '#1565c0',
      badges: ['Live Scores', 'Leaderboard', 'Round Stats']
    }
  ];

  // Special Events Section
  const specialEvents = [
    {
      title: 'World Cup 2026',
      description: 'Your complete guide to the FIFA World Cup 2026 across the USA, Canada, and Mexico. Explore group stage standings, match schedules, and host city venues. Track odds to win, view AI-powered predictions, and follow the United States team schedule.',
      icon: <SportsSoccerIcon fontSize="large" />,
      path: '/world-cup-2026',
      color: '#dc2626',
      badges: ['Group Stage', 'Match Schedule', 'AI Predictions']
    },
    {
      title: 'NHL Trends',
      description: 'Stay ahead of the puck with real-time NHL game analysis. View today\'s matchups with full odds, moneyline, spreads, and totals. Dive into player props, parlay recommendations, and fantasy projections. Track standings and league leaders.',
      icon: <SportsHockeyIcon fontSize="large" />,
      path: '/nhl-trends',
      color: '#0891b2',
      badges: ['Game Analysis', 'Player Props', 'Fantasy']
    }
  ];

  // Stats & Analytics Section
  const statsAnalytics = [
    {
      title: 'Analytics Dashboard',
      description: 'Unified sports analytics hub with multi-sport overview. Key performance indicators show total players, injury counts, value bets found. Visual analytics with position distribution charts and edge analysis. Player analysis, injury reports, and value bets tabs.',
      icon: <AnalyticsIcon fontSize="large" />,
      path: '/analytics-dashboard',
      color: '#8b5cf6',
      badges: ['Multi-Sport', 'KPIs', 'Value Bets']
    },
    {
      title: 'Advanced Analytics',
      description: 'AI-powered sports analytics hub combining PrizePicks props, odds data, player trends. Smart prompts library with 20+ analytics-focused prompts. Value picks engine identifies +EV opportunities. Parlay analytics with correlation factors and true probability calculations.',
      icon: <BarChartIcon fontSize="large" />,
      path: '/advanced-analytics',
      color: '#059669',
      badges: ['AI-Powered', '+EV Finder', 'Correlation']
    },
    {
      title: 'Season Stats',
      description: 'Comprehensive season-long statistics across NBA, NFL, MLB, and NHL. View player stats with advanced metrics like efficiency, true shooting percentage, and fantasy points. Explore team standings, offensive/defensive ratings, and league leaders.',
      icon: <TrendingUpIcon fontSize="large" />,
      path: '/season-stats',
      color: '#ea580c',
      badges: ['Advanced Metrics', 'League Leaders', 'Team Stats']
    },
    {
      title: 'Player Stats',
      description: 'Dive deep into player performance with advanced metrics like PER, efficiency scores, and win shares. Browse top performers across NBA, NFL, MLB, and NHL, filter by team or position, and search for any player.',
      icon: <SportsBasketballIcon fontSize="large" />,
      path: '/player-stats',
      color: '#f97316',
      badges: ['Advanced Metrics', 'PER', 'Efficiency']
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 6, 
        pt: 4,
        color: 'text.primary'
      }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          🏀 Sports Analytics GPT
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Humanistic Approach to Analytics At Its Finest
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto' }}>
          Experience the future of sports analytics with our cutting-edge platform
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={Link}
          to="/live-games"
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      </Box>

      {/* Feature Highlights */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        Platform Features
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {[
          { title: '94.7% Success Rate', description: 'Industry-leading prediction accuracy powered by proprietary AI models', icon: <EmojiEventsOutlinedIcon fontSize="large" />, color: '#10b981' },
          { title: 'PrizePicks Generator', description: 'Generate optimal PrizePicks selections with our advanced AI algorithms', icon: <CasinoOutlinedIcon fontSize="large" />, color: '#8b5cf6' },
          { title: 'Kalshi Market Intelligence', description: 'Real-time CFTC-regulated prediction market analytics with AI insights', icon: <TrendingUpIcon fontSize="large" />, color: '#ec4899' }
        ].map((feature, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" gutterBottom>{feature.title}</Typography>
                <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Parlay & Betting Tools Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        🎲 Parlay & Betting Tools
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {parlayTools.map((tool, idx) => (
          <Grid item xs={12} md={6} lg={3} key={idx}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ color: tool.color, mb: 2 }}>{tool.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{tool.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{tool.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {tool.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${tool.color}20`, color: tool.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'medium' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={tool.path} variant="outlined" size="small" sx={{ borderColor: tool.color, color: tool.color, mt: 1 }}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sports & Analytics Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        📊 Sports & Analytics
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {sportsAnalytics.map((sport, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: sport.color, mb: 2 }}>{sport.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{sport.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{sport.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {sport.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${sport.color}20`, color: sport.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={sport.path} variant="outlined" size="small" sx={{ borderColor: sport.color, color: sport.color }}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* News & Insights Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        📰 News & Insights
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {newsInsights.map((news, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: news.color, mb: 2 }}>{news.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{news.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{news.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {news.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${news.color}20`, color: news.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={news.path} variant="outlined" size="small" sx={{ borderColor: news.color, color: news.color }}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tennis Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        🎾 Tennis
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {tennisPages.map((page, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: page.color, mb: 2 }}>{page.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{page.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{page.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {page.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${page.color}20`, color: page.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={page.path} variant="outlined" size="small" sx={{ borderColor: page.color, color: page.color }}>
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Golf Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        ⛳ Golf
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {golfPages.map((page, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: page.color, mb: 2 }}>{page.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{page.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{page.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {page.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${page.color}20`, color: page.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={page.path} variant="outlined" size="small" sx={{ borderColor: page.color, color: page.color }}>
                  View
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats & Analytics Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        📈 Stats & Analytics
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {statsAnalytics.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: stat.color, mb: 2 }}>{stat.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{stat.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{stat.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {stat.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${stat.color}20`, color: stat.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={stat.path} variant="outlined" size="small" sx={{ borderColor: stat.color, color: stat.color }}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Special Events Section */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        🌟 Special Events
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {specialEvents.map((event, idx) => (
          <Grid item xs={12} sm={6} md={6} key={idx}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ color: event.color, mb: 2 }}>{event.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">{event.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{event.description}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {event.badges.map((badge, i) => (
                    <Box key={i} sx={{ bgcolor: `${event.color}20`, color: event.color, px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem' }}>
                      {badge}
                    </Box>
                  ))}
                </Box>
                <Button component={Link} to={event.path} variant="outlined" size="small" sx={{ borderColor: event.color, color: event.color }}>
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 6, 
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white'
      }}>
        <Typography variant="h4" gutterBottom>
          Platform Performance
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">94.7%</Typography>
              <Typography variant="body2">Prediction Accuracy</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">10K+</Typography>
              <Typography variant="body2">Daily Analysis</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">50+</Typography>
              <Typography variant="body2">AI Models</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">24/7</Typography>
              <Typography variant="body2">Live Updates</Typography>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="caption" sx={{ opacity: 0.8, fontStyle: 'italic', mt: 2, display: 'block' }}>
          Updated in real-time
        </Typography>
      </Paper>

      {/* Call to Action */}
      <Paper sx={{ 
        p: 4, 
        mb: 6, 
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        textAlign: 'center'
      }}>
        <RocketOutlinedIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Ready to Elevate Your Game?
        </Typography>
        <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto', opacity: 0.9 }}>
          Join thousands of users making smarter decisions with our analytics platform
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={Link}
          to="/subscription"
          sx={{ 
            mt: 2,
            backgroundColor: 'white',
            color: '#10b981',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          Start Free Trial
        </Button>
      </Paper>
    </Container>
  );
};

export default HomeScreen;
