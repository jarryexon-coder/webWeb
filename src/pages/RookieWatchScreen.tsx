// pages/RookieWatchScreen.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import {
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  EmojiEvents as TrophyIcon,
  Star as RookieIcon,
  TrendingUp as TrendingIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

// ==============================
// Configuration & Types
// ==============================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

export interface RookiePlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  rookie_year: number;
  draft_pick: number;
  draft_round: number;
  draft_team: string;
  age: number;
  height: string;
  weight: string;
  college?: string;
  country?: string;
  stats: {
    games_played: number;
    [key: string]: number | string; // sport-specific stats
  };
  projections?: {
    [key: string]: number;
  };
  rookie_of_year_odds?: {
    odds: string;
    bookmaker: string;
  };
  trending: 'up' | 'down' | 'stable';
  confidence: number;
  last_updated: string;
}

// ==============================
// Mock Data (fallback)
// ==============================

const MOCK_ROOKIES: RookiePlayer[] = [
  // NBA
  {
    id: 'rookie-nba-1',
    name: 'Victor Wembanyama',
    team: 'SAS',
    position: 'C',
    sport: 'NBA',
    rookie_year: 2024,
    draft_pick: 1,
    draft_round: 1,
    draft_team: 'San Antonio Spurs',
    age: 20,
    height: '7\'4"',
    weight: '210 lbs',
    college: 'France',
    country: 'France',
    stats: {
      games_played: 65,
      points: 22.5,
      rebounds: 10.8,
      assists: 3.6,
      blocks: 3.2,
      steals: 1.1,
      fg_pct: 48.2,
      three_pct: 35.1,
    },
    projections: {
      points: 23.1,
      rebounds: 11.2,
      blocks: 3.4,
    },
    rookie_of_year_odds: {
      odds: '-800',
      bookmaker: 'DraftKings',
    },
    trending: 'up',
    confidence: 95,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'rookie-nba-2',
    name: 'Chet Holmgren',
    team: 'OKC',
    position: 'C',
    sport: 'NBA',
    rookie_year: 2024,
    draft_pick: 2,
    draft_round: 1,
    draft_team: 'Oklahoma City Thunder',
    age: 21,
    height: '7\'1"',
    weight: '208 lbs',
    college: 'Gonzaga',
    country: 'USA',
    stats: {
      games_played: 68,
      points: 18.9,
      rebounds: 8.7,
      assists: 2.8,
      blocks: 2.5,
      steals: 0.9,
      fg_pct: 53.1,
      three_pct: 37.2,
    },
    projections: {
      points: 19.5,
      rebounds: 9.0,
      blocks: 2.7,
    },
    rookie_of_year_odds: {
      odds: '+450',
      bookmaker: 'FanDuel',
    },
    trending: 'up',
    confidence: 88,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'rookie-nba-3',
    name: 'Brandon Miller',
    team: 'CHA',
    position: 'SF',
    sport: 'NBA',
    rookie_year: 2024,
    draft_pick: 2,
    draft_round: 1,
    draft_team: 'Charlotte Hornets',
    age: 21,
    height: '6\'9"',
    weight: '200 lbs',
    college: 'Alabama',
    country: 'USA',
    stats: {
      games_played: 70,
      points: 16.8,
      rebounds: 4.2,
      assists: 2.5,
      steals: 0.8,
      fg_pct: 44.2,
      three_pct: 38.5,
    },
    projections: {
      points: 17.2,
      rebounds: 4.5,
      assists: 2.7,
    },
    rookie_of_year_odds: {
      odds: '+1200',
      bookmaker: 'BetMGM',
    },
    trending: 'stable',
    confidence: 75,
    last_updated: new Date().toISOString(),
  },
  // NFL
  {
    id: 'rookie-nfl-1',
    name: 'Caleb Williams',
    team: 'CHI',
    position: 'QB',
    sport: 'NFL',
    rookie_year: 2024,
    draft_pick: 1,
    draft_round: 1,
    draft_team: 'Chicago Bears',
    age: 22,
    height: '6\'1"',
    weight: '215 lbs',
    college: 'USC',
    country: 'USA',
    stats: {
      games_played: 12,
      passing_yards: 2850,
      passing_tds: 19,
      interceptions: 8,
      rushing_yards: 410,
      rushing_tds: 3,
    },
    projections: {
      passing_yards: 3750,
      passing_tds: 24,
    },
    rookie_of_year_odds: {
      odds: '-350',
      bookmaker: 'DraftKings',
    },
    trending: 'up',
    confidence: 92,
    last_updated: new Date().toISOString(),
  },
  {
    id: 'rookie-nfl-2',
    name: 'Marvin Harrison Jr.',
    team: 'ARI',
    position: 'WR',
    sport: 'NFL',
    rookie_year: 2024,
    draft_pick: 4,
    draft_round: 1,
    draft_team: 'Arizona Cardinals',
    age: 21,
    height: '6\'4"',
    weight: '205 lbs',
    college: 'Ohio State',
    country: 'USA',
    stats: {
      games_played: 12,
      receptions: 62,
      receiving_yards: 980,
      receiving_tds: 7,
      targets: 110,
    },
    projections: {
      receiving_yards: 1250,
      receiving_tds: 9,
    },
    rookie_of_year_odds: {
      odds: '+400',
      bookmaker: 'FanDuel',
    },
    trending: 'up',
    confidence: 85,
    last_updated: new Date().toISOString(),
  },
  // MLB
  {
    id: 'rookie-mlb-1',
    name: 'Jackson Holliday',
    team: 'BAL',
    position: 'SS',
    sport: 'MLB',
    rookie_year: 2024,
    draft_pick: 1,
    draft_round: 1,
    draft_team: 'Baltimore Orioles',
    age: 20,
    height: '6\'0"',
    weight: '185 lbs',
    college: 'HS (Oklahoma)',
    country: 'USA',
    stats: {
      games_played: 98,
      avg: 0.275,
      home_runs: 12,
      rbi: 48,
      ops: 0.785,
      stolen_bases: 8,
    },
    projections: {
      avg: 0.282,
      home_runs: 18,
      rbi: 65,
    },
    rookie_of_year_odds: {
      odds: '+280',
      bookmaker: 'BetMGM',
    },
    trending: 'up',
    confidence: 80,
    last_updated: new Date().toISOString(),
  },
  // NHL
  {
    id: 'rookie-nhl-1',
    name: 'Connor Bedard',
    team: 'CHI',
    position: 'C',
    sport: 'NHL',
    rookie_year: 2024,
    draft_pick: 1,
    draft_round: 1,
    draft_team: 'Chicago Blackhawks',
    age: 18,
    height: '5\'10"',
    weight: '185 lbs',
    college: 'Canada',
    country: 'Canada',
    stats: {
      games_played: 72,
      goals: 28,
      assists: 42,
      points: 70,
      plus_minus: -15,
      shots: 210,
    },
    projections: {
      goals: 32,
      assists: 48,
      points: 80,
    },
    rookie_of_year_odds: {
      odds: '-600',
      bookmaker: 'DraftKings',
    },
    trending: 'up',
    confidence: 94,
    last_updated: new Date().toISOString(),
  },
];

// ==============================
// API Hooks
// ==============================

const fetchRookies = async (sport: string = 'all'): Promise<RookiePlayer[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/rookies`, {
      params: { sport, limit: 20 },
    });
    return response.data.rookies || [];
  } catch (error) {
    console.warn('Failed to fetch rookies, using mock data', error);
    if (sport === 'all') return MOCK_ROOKIES;
    return MOCK_ROOKIES.filter((r) => r.sport.toLowerCase() === sport.toLowerCase());
  }
};

// ==============================
// Helper Components
// ==============================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rookie-tabpanel-${index}`}
      aria-labelledby={`rookie-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SportIcon: React.FC<{ sport: string }> = ({ sport }) => {
  switch (sport.toUpperCase()) {
    case 'NBA':
      return <BasketballIcon />;
    case 'NFL':
      return <FootballIcon />;
    case 'MLB':
      return <BaseballIcon />;
    case 'NHL':
      return <HockeyIcon />;
    default:
      return <RookieIcon />;
  }
};

const formatOdds = (odds: string): string => {
  return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
};

// ==============================
// Main Component
// ==============================

const RookieWatchScreen: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Data fetching
  const {
    data: rookies = MOCK_ROOKIES,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rookies', sportTab],
    queryFn: () => {
      const sportMap = ['all', 'nba', 'nfl', 'mlb', 'nhl'];
      return fetchRookies(sportMap[sportTab] || 'all');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSportTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSportTab(newValue);
  };

  // Sort by confidence/trending
  const sortedRookies = [...rookies].sort((a, b) => {
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    return 0;
  });

  // Top ROY candidates (top 3 by confidence)
  const topRoyCandidates = sortedRookies.slice(0, 3);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <RookieIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Rookie Watch
          </Typography>
          <Chip
            label="2024-25 Season"
            size="small"
            icon={<TrophyIcon />}
            sx={{ ml: 2, backgroundColor: theme.palette.grey[100] }}
          />
          <Tooltip title="Tracking top rookies across major sports. Odds for Rookie of the Year are shown where available.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Refresh rookie data">
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ROY Candidates Spotlight */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          🔥 Rookie of the Year Frontrunners
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {topRoyCandidates.map((rookie) => (
            <Grid item xs={12} md={4} key={rookie.id}>
              <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: theme.palette.primary.main,
                    mr: 2,
                  }}
                >
                  <SportIcon sport={rookie.sport} />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {rookie.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rookie.team} • {rookie.position}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={0.5}>
                    <Chip
                      label={`ROY Odds: ${formatOdds(rookie.rookie_of_year_odds?.odds || 'N/A')}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                    <Chip
                      label={`${rookie.confidence}% conf`}
                      size="small"
                      sx={{ ml: 1 }}
                      color={rookie.confidence >= 85 ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Sport Selection Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={sportTab}
          onChange={handleSportTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="sport rookie tabs"
          sx={{ px: 2 }}
        >
          <Tab icon={<RookieIcon />} label="All Sports" iconPosition="start" />
          <Tab icon={<BasketballIcon />} label="NBA" iconPosition="start" />
          <Tab icon={<FootballIcon />} label="NFL" iconPosition="start" />
          <Tab icon={<BaseballIcon />} label="MLB" iconPosition="start" />
          <Tab icon={<HockeyIcon />} label="NHL" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* View Toggle */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          size="small"
          variant={viewMode === 'cards' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('cards')}
          sx={{ mr: 1 }}
        >
          Cards
        </Button>
        <Button
          size="small"
          variant={viewMode === 'table' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('table')}
        >
          Table
        </Button>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load rookie data. Showing mock data.
        </Alert>
      ) : null}

      {sortedRookies.length === 0 ? (
        <Alert severity="info">No rookies found for the selected sport.</Alert>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <Grid container spacing={3}>
              {sortedRookies.map((rookie) => (
                <Grid item xs={12} md={6} lg={4} key={rookie.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40, mr: 1.5 }}>
                          <SportIcon sport={rookie.sport} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {rookie.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rookie.team} • {rookie.position}
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Draft
                          </Typography>
                          <Typography variant="body2">
                            #{rookie.draft_pick} overall
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Age / Ht / Wt
                          </Typography>
                          <Typography variant="body2">
                            {rookie.age} / {rookie.height} / {rookie.weight}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Games
                          </Typography>
                          <Typography variant="body2">
                            {rookie.stats.games_played}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            College
                          </Typography>
                          <Typography variant="body2" noWrap>
                            {rookie.college || '—'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 1.5 }} />

                      {/* Sport-specific stats */}
                      <Typography variant="subtitle2" gutterBottom>
                        Season Stats
                      </Typography>
                      <Grid container spacing={1}>
                        {rookie.sport === 'NBA' && (
                          <>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                PTS
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {rookie.stats.points}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                REB
                              </Typography>
                              <Typography variant="body2">{rookie.stats.rebounds}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                AST
                              </Typography>
                              <Typography variant="body2">{rookie.stats.assists}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                BLK
                              </Typography>
                              <Typography variant="body2">{rookie.stats.blocks}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                STL
                              </Typography>
                              <Typography variant="body2">{rookie.stats.steals}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                FG%
                              </Typography>
                              <Typography variant="body2">{rookie.stats.fg_pct}%</Typography>
                            </Grid>
                          </>
                        )}
                        {rookie.sport === 'NFL' && (
                          <>
                            {rookie.position === 'QB' ? (
                              <>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Yards
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {rookie.stats.passing_yards}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    TD
                                  </Typography>
                                  <Typography variant="body2">{rookie.stats.passing_tds}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    INT
                                  </Typography>
                                  <Typography variant="body2">{rookie.stats.interceptions}</Typography>
                                </Grid>
                              </>
                            ) : (
                              <>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Rec
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {rookie.stats.receptions}
                                  </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    Yards
                                  </Typography>
                                  <Typography variant="body2">{rookie.stats.receiving_yards}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">
                                    TD
                                  </Typography>
                                  <Typography variant="body2">{rookie.stats.receiving_tds}</Typography>
                                </Grid>
                              </>
                            )}
                          </>
                        )}
                        {rookie.sport === 'MLB' && (
                          <>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                AVG
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {rookie.stats.avg}
                              </Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                HR
                              </Typography>
                              <Typography variant="body2">{rookie.stats.home_runs}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                RBI
                              </Typography>
                              <Typography variant="body2">{rookie.stats.rbi}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                OPS
                              </Typography>
                              <Typography variant="body2">{rookie.stats.ops}</Typography>
                            </Grid>
                          </>
                        )}
                        {rookie.sport === 'NHL' && (
                          <>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                Goals
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {rookie.stats.goals}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                Assists
                              </Typography>
                              <Typography variant="body2">{rookie.stats.assists}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">
                                Points
                              </Typography>
                              <Typography variant="body2">{rookie.stats.points}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>

                      <Divider sx={{ my: 1.5 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ROY Odds
                          </Typography>
                          <Chip
                            label={formatOdds(rookie.rookie_of_year_odds?.odds || 'N/A')}
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                            Trend
                          </Typography>
                          <TrendingIcon
                            fontSize="small"
                            color={
                              rookie.trending === 'up'
                                ? 'success'
                                : rookie.trending === 'down'
                                ? 'error'
                                : 'disabled'
                            }
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Sport</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Draft Pick</TableCell>
                    <TableCell>GP</TableCell>
                    <TableCell>Key Stats</TableCell>
                    <TableCell align="right">ROY Odds</TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRookies.map((rookie) => (
                    <TableRow key={rookie.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {rookie.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rookie.age} yrs
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.grey[200], mr: 1 }}>
                            <SportIcon sport={rookie.sport} />
                          </Avatar>
                          {rookie.sport}
                        </Box>
                      </TableCell>
                      <TableCell>{rookie.team}</TableCell>
                      <TableCell>{rookie.position}</TableCell>
                      <TableCell>#{rookie.draft_pick}</TableCell>
                      <TableCell>{rookie.stats.games_played}</TableCell>
                      <TableCell>
                        {rookie.sport === 'NBA' && `${rookie.stats.points} pts, ${rookie.stats.rebounds} reb`}
                        {rookie.sport === 'NFL' &&
                          (rookie.position === 'QB'
                            ? `${rookie.stats.passing_yards} yds, ${rookie.stats.passing_tds} TD`
                            : `${rookie.stats.receiving_yards} yds, ${rookie.stats.receiving_tds} TD`)}
                        {rookie.sport === 'MLB' && `${rookie.stats.avg} avg, ${rookie.stats.home_runs} HR`}
                        {rookie.sport === 'NHL' && `${rookie.stats.goals} G, ${rookie.stats.assists} A`}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatOdds(rookie.rookie_of_year_odds?.odds || '—')}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TrendingIcon
                          fontSize="small"
                          color={
                            rookie.trending === 'up'
                              ? 'success'
                              : rookie.trending === 'down'
                              ? 'error'
                              : 'disabled'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Rookie data and odds are for informational purposes only. Statistics are updated regularly.
        {!rookies.some((r) => r.last_updated) && ' Currently showing demo data.'}
      </Typography>
    </Container>
  );
};

export default RookieWatchScreen;
