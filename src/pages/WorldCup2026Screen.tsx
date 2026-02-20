// pages/WorldCup2026Screen.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import {
  EmojiEvents,
  SportsSoccer,
  Groups,
  Timeline,
  TrendingUp,
  Info,
  Schedule,
  LocationOn,
  Flag,
  Star,
  Assessment,
  ArrowForward,
  Public,
  Stadium,
  CalendarMonth,
  Map,
  Analytics,
  MenuBook,
  MilitaryTech
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// =============================================
// TYPES
// =============================================

interface WorldCupTeam {
  id: string;
  name: string;
  fifaRank: number;
  group: string;
  flag: string;
  odds?: {
    toWin: number;
    toAdvance: number;
  };
  keyPlayers?: Array<{
    name: string;
    position: string;
    goals?: number;
    assists?: number;
  }>;
}

interface WorldCupMatch {
  id: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  stage: 'Group' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final';
  group?: string;
  status: 'scheduled' | 'live' | 'final';
  score?: {
    home: number;
    away: number;
  };
  predictions?: {
    homeWin: number;
    awayWin: number;
    draw: number;
    totalGoals: number;
  };
}

interface WorldCupGroup {
  name: string;
  teams: Array<{
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
    qualified: boolean;
  }>;
}

interface HostCity {
  name: string;
  stadium: string;
  capacity: number;
  matches: number;
  image?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// =============================================
// MOCK DATA (Enhanced with real 2026 info)
// =============================================

const HOST_CITIES: HostCity[] = [
  { name: 'New York/New Jersey', stadium: 'MetLife Stadium', capacity: 82500, matches: 7 },
  { name: 'Dallas', stadium: 'AT&T Stadium', capacity: 80000, matches: 9 },
  { name: 'Kansas City', stadium: 'Arrowhead Stadium', capacity: 76416, matches: 6 },
  { name: 'Houston', stadium: 'NRG Stadium', capacity: 72220, matches: 5 },
  { name: 'Atlanta', stadium: 'Mercedes-Benz Stadium', capacity: 71000, matches: 5 },
  { name: 'Los Angeles', stadium: 'SoFi Stadium', capacity: 70240, matches: 8 },
  { name: 'Philadelphia', stadium: 'Lincoln Financial Field', capacity: 69596, matches: 5 },
  { name: 'Seattle', stadium: 'Lumen Field', capacity: 69000, matches: 6 },
  { name: 'San Francisco Bay Area', stadium: 'Levi\'s Stadium', capacity: 68500, matches: 6 },
  { name: 'Boston', stadium: 'Gillette Stadium', capacity: 65678, matches: 5 },
  { name: 'Miami', stadium: 'Hard Rock Stadium', capacity: 64767, matches: 7 },
  { name: 'Vancouver', stadium: 'BC Place', capacity: 54500, matches: 5 },
  { name: 'Mexico City', stadium: 'Estadio Azteca', capacity: 87523, matches: 4 },
  { name: 'Monterrey', stadium: 'Estadio BBVA', capacity: 53500, matches: 4 },
  { name: 'Guadalajara', stadium: 'Estadio Akron', capacity: 49675, matches: 4 },
  { name: 'Toronto', stadium: 'BMO Field', capacity: 30000, matches: 5 }
];

const WORLD_CUP_TEAMS: WorldCupTeam[] = [
  // Group A
  { id: 'usa', name: 'United States', fifaRank: 11, group: 'A', flag: '🇺🇸', odds: { toWin: 28, toAdvance: -350 } },
  { id: 'mex', name: 'Mexico', fifaRank: 14, group: 'A', flag: '🇲🇽', odds: { toWin: 40, toAdvance: -275 } },
  { id: 'uru', name: 'Uruguay', fifaRank: 15, group: 'A', flag: '🇺🇾', odds: { toWin: 45, toAdvance: -200 } },
  { id: 'jpn', name: 'Japan', fifaRank: 18, group: 'A', flag: '🇯🇵', odds: { toWin: 80, toAdvance: +150 } },
  
  // Group B
  { id: 'fra', name: 'France', fifaRank: 2, group: 'B', flag: '🇫🇷', odds: { toWin: 12, toAdvance: -800 } },
  { id: 'eng', name: 'England', fifaRank: 4, group: 'B', flag: '🇬🇧', odds: { toWin: 14, toAdvance: -750 } },
  { id: 'ned', name: 'Netherlands', fifaRank: 7, group: 'B', flag: '🇳🇱', odds: { toWin: 25, toAdvance: -400 } },
  { id: 'sen', name: 'Senegal', fifaRank: 20, group: 'B', flag: '🇸🇳', odds: { toWin: 100, toAdvance: +250 } },
  
  // Group C
  { id: 'arg', name: 'Argentina', fifaRank: 1, group: 'C', flag: '🇦🇷', odds: { toWin: 8, toAdvance: -900 } },
  { id: 'bra', name: 'Brazil', fifaRank: 5, group: 'C', flag: '🇧🇷', odds: { toWin: 7, toAdvance: -850 } },
  { id: 'crc', name: 'Costa Rica', fifaRank: 32, group: 'C', flag: '🇨🇷', odds: { toWin: 250, toAdvance: +400 } },
  { id: 'cmr', name: 'Cameroon', fifaRank: 38, group: 'C', flag: '🇨🇲', odds: { toWin: 200, toAdvance: +350 } },
  
  // Group D
  { id: 'ger', name: 'Germany', fifaRank: 16, group: 'D', flag: '🇩🇪', odds: { toWin: 18, toAdvance: -600 } },
  { id: 'esp', name: 'Spain', fifaRank: 8, group: 'D', flag: '🇪🇸', odds: { toWin: 16, toAdvance: -650 } },
  { id: 'ita', name: 'Italy', fifaRank: 9, group: 'D', flag: '🇮🇹', odds: { toWin: 22, toAdvance: -500 } },
  { id: 'pol', name: 'Poland', fifaRank: 28, group: 'D', flag: '🇵🇱', odds: { toWin: 60, toAdvance: +120 } },
  
  // Additional teams for other groups
  { id: 'por', name: 'Portugal', fifaRank: 6, group: 'E', flag: '🇵🇹', odds: { toWin: 20, toAdvance: -550 } },
  { id: 'bel', name: 'Belgium', fifaRank: 3, group: 'E', flag: '🇧🇪', odds: { toWin: 24, toAdvance: -500 } },
  { id: 'cro', name: 'Croatia', fifaRank: 10, group: 'F', flag: '🇭🇷', odds: { toWin: 35, toAdvance: -300 } },
  { id: 'mar', name: 'Morocco', fifaRank: 13, group: 'F', flag: '🇲🇦', odds: { toWin: 75, toAdvance: +180 } },
];

const WORLD_CUP_MATCHES: WorldCupMatch[] = [
  {
    id: 'wc-1',
    date: '2026-06-11',
    time: '20:00',
    venue: 'Estadio Azteca',
    city: 'Mexico City',
    homeTeam: 'Mexico',
    awayTeam: 'United States',
    homeFlag: '🇲🇽',
    awayFlag: '🇺🇸',
    stage: 'Group',
    group: 'A',
    status: 'scheduled',
    predictions: { homeWin: 35, awayWin: 40, draw: 25, totalGoals: 2.5 }
  },
  {
    id: 'wc-2',
    date: '2026-06-12',
    time: '15:00',
    venue: 'MetLife Stadium',
    city: 'New York/New Jersey',
    homeTeam: 'Argentina',
    awayTeam: 'Brazil',
    homeFlag: '🇦🇷',
    awayFlag: '🇧🇷',
    stage: 'Group',
    group: 'C',
    status: 'scheduled',
    predictions: { homeWin: 45, awayWin: 30, draw: 25, totalGoals: 3.2 }
  },
  {
    id: 'wc-3',
    date: '2026-06-13',
    time: '18:00',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    homeTeam: 'France',
    awayTeam: 'England',
    homeFlag: '🇫🇷',
    awayFlag: '🇬🇧',
    stage: 'Group',
    group: 'B',
    status: 'scheduled',
    predictions: { homeWin: 35, awayWin: 38, draw: 27, totalGoals: 2.8 }
  },
  {
    id: 'wc-4',
    date: '2026-06-14',
    time: '16:00',
    venue: 'AT&T Stadium',
    city: 'Dallas',
    homeTeam: 'Germany',
    awayTeam: 'Spain',
    homeFlag: '🇩🇪',
    awayFlag: '🇪🇸',
    stage: 'Group',
    group: 'D',
    status: 'scheduled',
    predictions: { homeWin: 32, awayWin: 42, draw: 26, totalGoals: 3.0 }
  }
];

const GROUP_STANDINGS: WorldCupGroup[] = [
  {
    name: 'A',
    teams: [
      { name: 'United States', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'Mexico', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'Uruguay', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'Japan', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false }
    ]
  },
  {
    name: 'B',
    teams: [
      { name: 'France', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'England', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'Netherlands', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false },
      { name: 'Senegal', played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, qualified: false }
    ]
  }
];

// =============================================
// API FUNCTIONS (Connects to your Flask backend)
// =============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://python-api-fresh-production.up.railway.app';

const fetchWorldCupOdds = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/odds/soccer_world_cup`);
    return response.data;
  } catch (error) {
    console.log('Using mock World Cup odds data');
    return { data: WORLD_CUP_TEAMS.map(t => ({ 
      name: t.name, 
      odds: { toWin: t.odds?.toWin || 50 } 
    })) };
  }
};

const fetchWorldCupNews = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/news?sport=world-cup-2026`);
    return response.data;
  } catch (error) {
    console.log('Using mock World Cup news');
    return { 
      news: [
        { title: 'USA Announces Preliminary Squad', source: 'ESPN', publishedAt: new Date().toISOString() },
        { title: 'Messi Confirms Final World Cup Campaign', source: 'BBC Sport', publishedAt: new Date().toISOString() }
      ] 
    };
  }
};

// =============================================
// MAIN COMPONENT
// =============================================

const WorldCup2026Screen: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('A');

  // Fetch data from your backend
  const { data: oddsData, isLoading: oddsLoading } = useQuery({
    queryKey: ['worldCupOdds'],
    queryFn: fetchWorldCupOdds,
    staleTime: 5 * 60 * 1000
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['worldCupNews'],
    queryFn: fetchWorldCupNews,
    staleTime: 10 * 60 * 1000
  });

  // Filter teams by selected group
  const filteredTeams = WORLD_CUP_TEAMS.filter(t => t.group === selectedGroup);
  
  // Get matches for selected tab
  const getFilteredMatches = () => {
    switch(tabValue) {
      case 0: return WORLD_CUP_MATCHES; // All matches
      case 1: return WORLD_CUP_MATCHES.filter(m => m.stage === 'Group'); // Group stage
      case 2: return WORLD_CUP_MATCHES.filter(m => m.homeTeam === 'United States' || m.awayTeam === 'United States'); // USA matches
      default: return WORLD_CUP_MATCHES;
    }
  };

  const displayedMatches = getFilteredMatches();
  const currentGroup = GROUP_STANDINGS.find(g => g.name === selectedGroup);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc',
      pb: 8
    }}>
      {/* Hero Section */}
      <Box sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1f2e 0%, #0d1425 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <Stadium sx={{ width: '100%', height: '100%' }} />
        </Box>
        
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, position: 'relative' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip 
                icon={<EmojiEvents />} 
                label="FIFA World Cup 2026™" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  mb: 2,
                  fontWeight: 600
                }} 
              />
              <Typography variant="h2" sx={{ 
                fontWeight: 800, 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2
              }}>
                United 2026
              </Typography>
              <Typography variant="h5" sx={{ 
                opacity: 0.9,
                maxWidth: 600,
                mb: 3
              }}>
                USA • Canada • Mexico • June 11 – July 19, 2026
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 20 }} />
                  <Typography>16 Host Cities</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Stadium sx={{ fontSize: 20 }} />
                  <Typography>48 Teams</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 20 }} />
                  <Typography>104 Matches</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2
              }}>
                <Flag sx={{ fontSize: 60 }} />
                <Flag sx={{ fontSize: 60 }} />
                <Flag sx={{ fontSize: 60 }} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, mt: -4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Tournament Odds
                  </Typography>
                  <MilitaryTech color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  Brazil +700
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Argentina +800 · France +1200
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Days Until Kickoff
                  </Typography>
                  <CalendarMonth color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  119
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  June 11, 2026 · Mexico City
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Host Cities
                  </Typography>
                  <Map color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  16
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  11 USA · 3 Mexico · 2 Canada
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    USA Odds
                  </Typography>
                  <TrendingUp color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  +2800
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  To Win · To Advance: -350
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs Navigation */}
        <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              pt: 1,
              '& .MuiTab-root': { minHeight: 64, fontWeight: 600 },
              '& .Mui-selected': { color: theme.palette.primary.main }
            }}
          >
            <Tab icon={<SportsSoccer />} iconPosition="start" label="Matches" />
            <Tab icon={<Groups />} iconPosition="start" label="Groups" />
            <Tab icon={<Flag />} iconPosition="start" label="USA Schedule" />
            <Tab icon={<Stadium />} iconPosition="start" label="Venues" />
            <Tab icon={<Assessment />} iconPosition="start" label="Predictions" />
            <Tab icon={<Analytics />} iconPosition="start" label="Analytics" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <Box sx={{ mt: 3 }}>
          {/* Matches Panel */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsSoccer />
                        <Typography variant="h6">Upcoming Matches</Typography>
                      </Box>
                    }
                    action={
                      <Chip label="Group Stage" size="small" />
                    }
                  />
                  <Divider />
                  <CardContent>
                    {displayedMatches.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SportsSoccer sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">No matches scheduled</Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {displayedMatches.map((match) => (
                          <Grid item xs={12} key={match.id}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                                  borderColor: theme.palette.primary.main
                                }
                              }}
                            >
                              <Grid container alignItems="center" spacing={2}>
                                <Grid item xs={12} sm={3}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {match.date} · {match.time}
                                  </Typography>
                                  <Typography variant="body2" fontWeight="500">
                                    {match.venue}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={match.stage} 
                                    sx={{ mt: 0.5, fontSize: '0.7rem' }} 
                                  />
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                                        {match.homeFlag} {match.homeTeam}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ fontWeight: 700, px: 2 }}>
                                      vs
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                                        {match.awayTeam} {match.awayFlag}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                                  <Chip 
                                    label={match.status === 'scheduled' ? 'Scheduled' : 'Live'} 
                                    color={match.status === 'live' ? 'error' : 'default'}
                                    size="small"
                                  />
                                  {match.predictions && (
                                    <Box sx={{ mt: 1 }}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Win Prob: {match.predictions.homeWin}% / {match.predictions.awayWin}%
                                      </Typography>
                                    </Box>
                                  )}
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBook />
                        <Typography variant="h6">World Cup News</Typography>
                      </Box>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {newsLoading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={40} />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {newsData?.news?.slice(0, 5).map((item: any, i: number) => (
                          <Box key={i}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {item.title}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {item.source?.name || item.source}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.publishedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            {i < 4 && <Divider sx={{ mt: 1.5 }} />}
                          </Box>
                        ))}
                        
                        <Button 
                          variant="outlined" 
                          endIcon={<ArrowForward />}
                          sx={{ mt: 2 }}
                        >
                          View All News
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Groups Panel */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Groups />
                        <Typography variant="h6">Group Stage</Typography>
                      </Box>
                    }
                    action={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(group => (
                          <Chip 
                            key={group}
                            label={`Group ${group}`}
                            onClick={() => setSelectedGroup(group)}
                            color={selectedGroup === group ? 'primary' : 'default'}
                            variant={selectedGroup === group ? 'filled' : 'outlined'}
                            size="small"
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    }
                  />
                  <Divider />
                  
                  {currentGroup && (
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Group {currentGroup.name}
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell>Team</TableCell>
                              <TableCell align="center">P</TableCell>
                              <TableCell align="center">W</TableCell>
                              <TableCell align="center">D</TableCell>
                              <TableCell align="center">L</TableCell>
                              <TableCell align="center">GF</TableCell>
                              <TableCell align="center">GA</TableCell>
                              <TableCell align="center">GD</TableCell>
                              <TableCell align="center">Pts</TableCell>
                              <TableCell align="center">Qualified</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentGroup.teams.map((team) => (
                              <TableRow key={team.name} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Flag sx={{ fontSize: 20 }} />
                                    {team.name}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">{team.played}</TableCell>
                                <TableCell align="center">{team.won}</TableCell>
                                <TableCell align="center">{team.drawn}</TableCell>
                                <TableCell align="center">{team.lost}</TableCell>
                                <TableCell align="center">{team.gf}</TableCell>
                                <TableCell align="center">{team.ga}</TableCell>
                                <TableCell align="center">{team.gd}</TableCell>
                                <TableCell align="center">
                                  <Typography fontWeight="bold">{team.points}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {team.qualified ? (
                                    <Chip label="✅" size="small" color="success" variant="outlined" />
                                  ) : (
                                    <Chip label="❌" size="small" variant="outlined" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Top 2 teams advance to Round of 16
                        </Typography>
                        <Chip 
                          icon={<Info />} 
                          label="Updated live" 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                    </CardContent>
                  )}
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star />
                        <Typography variant="h6">Favorites to Win</Typography>
                      </Box>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {filteredTeams
                        .sort((a, b) => (a.odds?.toWin || 999) - (b.odds?.toWin || 999))
                        .slice(0, 5)
                        .map((team, i) => (
                          <Box key={team.id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  #{i + 1}
                                </Typography>
                                <Typography variant="body1">
                                  {team.flag} {team.name}
                                </Typography>
                              </Box>
                              <Chip 
                                label={`+${team.odds?.toWin}`} 
                                size="small" 
                                color={i === 0 ? 'primary' : 'default'}
                              />
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={100 - (i * 15)} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: i === 0 ? theme.palette.primary.main : 
                                          i === 1 ? theme.palette.success.main : 
                                          theme.palette.warning.main
                                }
                              }} 
                            />
                          </Box>
                        ))}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Group Stage Odds
                      </Typography>
                      
                      {filteredTeams.slice(0, 4).map((team) => (
                        <Box key={team.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">
                            {team.flag} {team.name}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {team.odds?.toAdvance > 0 ? '+' : ''}{team.odds?.toAdvance}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Host Cities Panel */}
          {tabValue === 3 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn />
                    <Typography variant="h6">2026 Host Cities & Stadiums</Typography>
                  </Box>
                }
                subheader="16 venues across North America"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        <strong>Final:</strong> MetLife Stadium, East Rutherford, NJ · July 19, 2026
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      United States (11 Cities)
                    </Typography>
                  </Grid>
                  
                  {HOST_CITIES.filter(c => c.name !== 'Mexico City' && c.name !== 'Monterrey' && c.name !== 'Guadalajara' && c.name !== 'Vancouver' && c.name !== 'Toronto')
                    .map((city) => (
                    <Grid item xs={12} sm={6} md={4} key={city.name}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {city.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {city.stadium}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Chip size="small" label={`${city.capacity.toLocaleString()} capacity`} />
                          <Chip size="small" label={`${city.matches} matches`} variant="outlined" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Mexico (3 Cities)
                    </Typography>
                  </Grid>
                  
                  {HOST_CITIES.filter(c => c.name === 'Mexico City' || c.name === 'Monterrey' || c.name === 'Guadalajara')
                    .map((city) => (
                    <Grid item xs={12} sm={6} md={4} key={city.name}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {city.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {city.stadium}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Chip size="small" label={`${city.capacity.toLocaleString()} capacity`} />
                          <Chip size="small" label={`${city.matches} matches`} variant="outlined" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Canada (2 Cities)
                    </Typography>
                  </Grid>
                  
                  {HOST_CITIES.filter(c => c.name === 'Vancouver' || c.name === 'Toronto')
                    .map((city) => (
                    <Grid item xs={12} sm={6} md={4} key={city.name}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {city.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {city.stadium}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Chip size="small" label={`${city.capacity.toLocaleString()} capacity`} />
                          <Chip size="small" label={`${city.matches} matches`} variant="outlined" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* USA Schedule Panel */}
          {tabValue === 2 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag sx={{ color: '#3c3b6e' }} />
                    <Typography variant="h6">United States - Group Stage Schedule</Typography>
                  </Box>
                }
                subheader="2026 FIFA World Cup"
                avatar={
                  <Avatar sx={{ bgcolor: '#3c3b6e' }}>
                    🇺🇸
                  </Avatar>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Match 1</Typography>
                        <Chip label="Group A" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h5">🇺🇸</Typography>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">United States</Typography>
                            <Typography variant="caption" color="text.secondary">Home</Typography>
                          </Box>
                        </Box>
                        <Typography variant="h5" sx={{ px: 2 }}>vs</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="bold">Mexico</Typography>
                            <Typography variant="caption" color="text.secondary">Away</Typography>
                          </Box>
                          <Typography variant="h5">🇲🇽</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Date</Typography>
                          <Typography variant="body2" fontWeight="bold">June 11, 2026</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Venue</Typography>
                          <Typography variant="body2" fontWeight="bold">Estadio Azteca</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Time</Typography>
                          <Typography variant="body2" fontWeight="bold">20:00 EST</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">Odds</Typography>
                        <Typography variant="body2">
                          USA +180 · Draw +220 · Mexico +160
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Match 2</Typography>
                        <Chip label="Group A" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h5">🇺🇸</Typography>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">United States</Typography>
                            <Typography variant="caption" color="text.secondary">Away</Typography>
                          </Box>
                        </Box>
                        <Typography variant="h5" sx={{ px: 2 }}>vs</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" fontWeight="bold">Uruguay</Typography>
                            <Typography variant="caption" color="text.secondary">Home</Typography>
                          </Box>
                          <Typography variant="h5">🇺🇾</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Date</Typography>
                          <Typography variant="body2" fontWeight="bold">June 16, 2026</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Venue</Typography>
                          <Typography variant="body2" fontWeight="bold">MetLife Stadium</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Time</Typography>
                          <Typography variant="body2" fontWeight="bold">15:00 EST</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">Odds</Typography>
                        <Typography variant="body2">
                          USA +150 · Draw +200 · Uruguay +190
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Predictions Panel */}
          {tabValue === 4 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment />
                    <Typography variant="h6">AI Predictions & Simulations</Typography>
                  </Box>
                }
                action={
                  <Tooltip title="Powered by SportsData.io + DeepSeek AI">
                    <IconButton>
                      <Info />
                    </IconButton>
                  </Tooltip>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Tournament Winner Probability
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Brazil</Typography>
                          <Typography variant="body2" fontWeight="bold">15.3%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={15.3} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Argentina</Typography>
                          <Typography variant="body2" fontWeight="bold">13.8%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={13.8} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">France</Typography>
                          <Typography variant="body2" fontWeight="bold">11.2%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={11.2} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">England</Typography>
                          <Typography variant="body2" fontWeight="bold">9.7%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={9.7} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Spain</Typography>
                          <Typography variant="body2" fontWeight="bold">8.4%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={8.4} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Germany</Typography>
                          <Typography variant="body2" fontWeight="bold">7.1%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={7.1} sx={{ height: 8, borderRadius: 2 }} />
                      </Box>
                    </Box>
                    
                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        <strong>AI Analysis:</strong> Brazil and Argentina are co-favorites based on Elo ratings, 
                        current form, and squad depth. European teams show strong metrics in defensive organization.
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Group Stage Predictions
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableCell>Group</TableCell>
                            <TableCell>1st Place</TableCell>
                            <TableCell>2nd Place</TableCell>
                            <TableCell align="center">Confidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>A</TableCell>
                            <TableCell>🇺🇾 Uruguay</TableCell>
                            <TableCell>🇺🇸 USA</TableCell>
                            <TableCell align="center">78%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>B</TableCell>
                            <TableCell>🇫🇷 France</TableCell>
                            <TableCell>🏴󠁧󠁢󠁥󠁮󠁧󠁿 England</TableCell>
                            <TableCell align="center">85%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>C</TableCell>
                            <TableCell>🇦🇷 Argentina</TableCell>
                            <TableCell>🇧🇷 Brazil</TableCell>
                            <TableCell align="center">82%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>D</TableCell>
                            <TableCell>🇪🇸 Spain</TableCell>
                            <TableCell>🇩🇪 Germany</TableCell>
                            <TableCell align="center">76%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Golden Boot Prediction
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 48, height: 48 }}>
                            🥇
                          </Avatar>
                          <Box>
                            <Typography variant="h6">Kylian Mbappé</Typography>
                            <Typography variant="body2" color="text.secondary">
                              France · Predicted: 7.4 goals
                            </Typography>
                          </Box>
                          <Chip label="+450" color="primary" sx={{ ml: 'auto' }} />
                        </Box>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default WorldCup2026Screen;
