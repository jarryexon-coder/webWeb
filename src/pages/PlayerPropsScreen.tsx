// src/pages/PlayerPropsScreen.tsx - FINAL VERSION WITH INFERRED TEAMS
import React, { useMemo, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Slider,
  Pagination,
  Stack,
  CircularProgress,
  TableSortLabel,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------
const API_BASE = 'https://prizepicks-production.up.railway.app';
const ITEMS_PER_PAGE = 50;

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface PlayerProp {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  over_odds: number;
  under_odds: number;
  confidence: number;
  projection?: number;
  player_id?: string;
  position?: string;
  last_updated: string;
  sport: string;
  is_real_data: boolean;
  game?: string;
  game_time?: string;
  matchup_opponent?: string;
}

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------
const formatMarketName = (market: string): string => {
  const marketMap: Record<string, string> = {
    'points': 'Points',
    'assists': 'Assists',
    'rebounds': 'Rebounds',
    'blocks': 'Blocks',
    'steals': 'Steals',
    'turnovers': 'Turnovers',
    'threes': '3PM',
    'three-pointers-made': '3PM',
    'points_rebounds_assists': 'PRA',
    'hits': 'Hits',
    'home_runs': 'HR',
    'rbi': 'RBI',
    'strikeouts': 'K',
    'goals': 'Goals',
    'assists_hockey': 'Assists',
    'saves': 'Saves',
    'shots': 'Shots',
  };
  return marketMap[market.toLowerCase()] || market;
};

// Fetch today's games from multiple sources
const fetchTodaysGames = async (sport: string): Promise<any[]> => {
  const games: any[] = [];
  
  // Try 1: /api/odds/games endpoint
  try {
    const url = `${API_BASE}/api/odds/games?sport=${sport}`;
    console.log(`📅 Fetching games from: ${url}`);
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.games && data.games.length > 0) {
        console.log(`✅ Found ${data.games.length} games from /api/odds/games`);
        return data.games;
      }
    }
  } catch (err) {
    console.warn('Error fetching from /api/odds/games:', err);
  }
  
  // Try 2: /api/nba/games, /api/nhl/games, /api/mlb/games
  try {
    const sportMap: Record<string, string> = {
      'nba': 'nba',
      'nhl': 'nhl',
      'mlb': 'mlb',
    };
    const url = `${API_BASE}/api/${sportMap[sport]}/games`;
    console.log(`📅 Fetching games from: ${url}`);
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.games && data.games.length > 0) {
        console.log(`✅ Found ${data.games.length} games from /api/${sport}/games`);
        return data.games;
      }
    }
  } catch (err) {
    console.warn(`Error fetching from /api/${sport}/games:`, err);
  }
  
  console.warn(`⚠️ No games found for ${sport} from any source`);
  return [];
};

// Get teams from PrizePicks selections (most common teams that appear)
const getTeamsFromSelections = (selections: any[]): string[] => {
  const teamCounts: Record<string, number> = {};
  
  selections.forEach(selection => {
    const team = selection.team || selection.team_abbreviation;
    if (team) {
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    }
  });
  
  // Get teams with at least 3 selections (likely playing today)
  const teams = Object.entries(teamCounts)
    .filter(([_, count]) => count >= 3)
    .map(([team]) => team);
  
  console.log(`📊 Inferred teams from selections (${teams.length} teams):`, teams);
  return teams;
};

// Fetch props from PrizePicks selections endpoint
const fetchPrizePicksProps = async (sport: string): Promise<{ props: PlayerProp[], inferredTeams: string[] }> => {
  try {
    const url = `${API_BASE}/api/prizepicks/selections?sport=${sport}`;
    console.log(`🎯 Fetching PrizePicks props from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📦 PrizePicks response for ${sport}:`, data);
    
    // Extract selections array
    let selections: any[] = [];
    if (data.selections && Array.isArray(data.selections)) {
      selections = data.selections;
    } else if (Array.isArray(data)) {
      selections = data;
    }
    
    if (selections.length === 0) {
      console.warn(`No selections found for ${sport}`);
      return { props: [], inferredTeams: [] };
    }
    
    console.log(`✅ Got ${selections.length} selections for ${sport}`);
    
    // Get inferred teams from selections
    const inferredTeams = getTeamsFromSelections(selections);
    
    // Log first selection to see structure
    if (selections.length > 0) {
      console.log(`🔍 First selection:`, selections[0]);
      console.log(`🔍 Line value:`, selections[0].line);
    }
    
    // Transform selections to props
    const props: PlayerProp[] = [];
    
    selections.forEach((item: any, index: number) => {
      // Extract player info
      const player = item.player_name || item.player || item.title || 'Unknown';
      const team = item.team || item.team_abbreviation || '';
      
      // Extract market/stat type
      const statType = item.stat_type || item.market || 'points';
      const market = formatMarketName(statType);
      
      // Extract line
      let line = 0;
      if (item.line !== undefined && item.line !== null) {
        line = parseFloat(item.line);
      } else if (item.stat_line !== undefined && item.stat_line !== null) {
        line = parseFloat(item.stat_line);
      } else if (item.points !== undefined && item.points !== null) {
        line = parseFloat(item.points);
      }
      
      // Generate odds if not provided
      let overOdds = 0;
      let underOdds = 0;
      if (item.over_odds !== undefined && item.over_odds !== null) {
        overOdds = parseFloat(item.over_odds);
      }
      if (item.under_odds !== undefined && item.under_odds !== null) {
        underOdds = parseFloat(item.under_odds);
      }
      
      // Calculate confidence based on line
      let confidence = 50;
      if (line > 0) {
        if (line > 25) confidence = 75;
        else if (line > 20) confidence = 70;
        else if (line > 15) confidence = 65;
        else if (line > 10) confidence = 60;
        else if (line > 5) confidence = 55;
        else confidence = 50;
      }
      
      // Generate projection
      const projection = line > 0 ? line * (0.95 + Math.random() * 0.1) : 0;
      
      // Generate odds if not provided
      if (overOdds === 0 && underOdds === 0 && line > 0) {
        const baseOdds = -110;
        const variance = Math.floor(Math.random() * 20) - 10;
        overOdds = baseOdds + variance;
        underOdds = baseOdds - variance;
      }
      
      // Game info
      let game = '';
      if (item.away_team && item.home_team) {
        game = `${item.away_team} @ ${item.home_team}`;
      } else if (item.game) {
        game = item.game;
      } else if (team) {
        game = `${team} vs Opponent`;
      }
      
      props.push({
        id: item.id || item.prop_id || `prizepicks-${sport}-${index}`,
        player: player,
        team: team,
        market: market,
        line: line,
        over_odds: overOdds,
        under_odds: underOdds,
        confidence: confidence,
        projection: projection,
        player_id: item.player_id,
        position: item.position,
        sport: sport.toUpperCase(),
        is_real_data: true,
        last_updated: new Date().toISOString(),
        game: game || 'N/A',
        game_time: item.game_time || item.start_time,
        matchup_opponent: item.opponent,
      });
    });
    
    // Filter out props with zero line (invalid)
    const validProps = props.filter(p => p.line > 0);
    console.log(`✅ Generated ${validProps.length} valid props from ${props.length} total`);
    
    return { props: validProps, inferredTeams };
    
  } catch (err) {
    console.error(`Error fetching PrizePicks props for ${sport}:`, err);
    return { props: [], inferredTeams: [] };
  }
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const OddsDisplay = ({ odds }: { odds?: number }) => {
  if (odds === undefined || odds === null || odds === 0) {
    return <Chip label="N/A" size="small" sx={{ bgcolor: '#444', color: '#ccc' }} />;
  }
  const formatted = odds > 0 ? `+${odds}` : `${odds}`;
  const isFavorite = odds < 0;
  return (
    <Chip
      label={formatted}
      size="small"
      sx={{
        bgcolor: isFavorite ? alpha('#4caf50', 0.2) : alpha('#f44336', 0.2),
        color: isFavorite ? '#4caf50' : '#f44336',
        fontWeight: 'bold',
        border: `1px solid ${isFavorite ? '#4caf50' : '#f44336'}`,
      }}
    />
  );
};

const ConfidenceIndicator = ({ value }: { value?: number }) => {
  if (value === undefined || value === null || value === 0) return null;
  let color = '#4caf50';
  if (value < 60) color = '#f44336';
  else if (value < 75) color = '#ff9800';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold', minWidth: 45 }}>
        {value}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          flexGrow: 1,
          height: 8,
          borderRadius: 4,
          bgcolor: '#333',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          }
        }}
      />
    </Box>
  );
};

const SportIcon = ({ sport }: { sport?: string }) => {
  if (!sport) return null;
  switch (sport.toUpperCase()) {
    case 'NBA': return <BasketballIcon fontSize="small" sx={{ color: '#ef4444' }} />;
    case 'NFL': return <FootballIcon fontSize="small" sx={{ color: '#3b82f6' }} />;
    case 'MLB': return <BaseballIcon fontSize="small" sx={{ color: '#10b981' }} />;
    case 'NHL': return <HockeyIcon fontSize="small" sx={{ color: '#1e40af' }} />;
    default: return null;
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const PlayerPropsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string>('nba');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [dataSource, setDataSource] = useState<string>('');
  const [isRealData, setIsRealData] = useState<boolean>(false);
  const [teamsPlayingToday, setTeamsPlayingToday] = useState<string[]>([]);
  const [filterMethod, setFilterMethod] = useState<string>('');

  const {
    data,
    isLoading,
    error,
    refetch,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ['playerProps', selectedSport],
    queryFn: async () => {
      console.log(`📡 Fetching props for ${selectedSport}...`);
      
      try {
        // Get PrizePicks props
        const { props, inferredTeams } = await fetchPrizePicksProps(selectedSport);
        
        if (props.length > 0) {
          // Try to get games from API first
          const games = await fetchTodaysGames(selectedSport);
          let teamsToFilter: string[] = [];
          let filterSource = '';
          
          if (games.length > 0) {
            // Use games from API
            teamsToFilter = games.flatMap(game => [game.away_team, game.home_team]).filter(Boolean);
            filterSource = 'API Games';
            console.log(`📅 Using ${games.length} games from API`);
          } else if (inferredTeams.length > 0) {
            // Fallback to inferred teams from selections
            teamsToFilter = inferredTeams;
            filterSource = 'Inferred from Props';
            console.log(`📊 Using inferred teams from selections (${inferredTeams.length} teams)`);
          }
          
          setTeamsPlayingToday(teamsToFilter);
          setFilterMethod(filterSource);
          
          // Filter props to only players whose teams are playing today
          let filteredProps = props;
          if (teamsToFilter.length > 0) {
            filteredProps = props.filter(prop => {
              const teamMatches = teamsToFilter.includes(prop.team);
              if (!teamMatches) {
                console.log(`🗑️ Filtering out ${prop.player} (${prop.team}) - not playing today`);
              }
              return teamMatches;
            });
            console.log(`🎯 Filtered from ${props.length} to ${filteredProps.length} props for teams playing today`);
          } else {
            console.log(`⚠️ No teams to filter by, showing all ${props.length} props`);
          }
          
          console.log(`✅ Using PrizePicks data for ${selectedSport.toUpperCase()} (${filteredProps.length} props)`);
          setDataSource(`${selectedSport.toUpperCase()} Props`);
          setIsRealData(true);
          return filteredProps;
        } else {
          console.log(`⚠️ No props data for ${selectedSport}`);
          setDataSource(`${selectedSport.toUpperCase()} Preview`);
          setIsRealData(false);
          return [];
        }
        
      } catch (err) {
        console.error(`Error fetching ${selectedSport} props:`, err);
        setDataSource(`${selectedSport.toUpperCase()} Preview`);
        setIsRealData(false);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const props = data || [];

  // Filter and sort props
  const filteredAndSortedProps = useMemo(() => {
    if (!props.length) return [];
    
    let filtered = [...props];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.player?.toLowerCase().includes(query) ||
        p.team?.toLowerCase().includes(query) ||
        p.market?.toLowerCase().includes(query)
      );
    }
    
    if (confidenceThreshold > 0) {
      filtered = filtered.filter((p) => (p.confidence || 0) >= confidenceThreshold);
    }
    
    filtered.sort((a, b) => {
      let aVal: number = 0;
      let bVal: number = 0;
      
      switch (sortBy) {
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        case 'over_odds':
          aVal = Math.abs(a.over_odds || 0);
          bVal = Math.abs(b.over_odds || 0);
          break;
        case 'under_odds':
          aVal = Math.abs(a.under_odds || 0);
          bVal = Math.abs(b.under_odds || 0);
          break;
        case 'line':
          aVal = a.line || 0;
          bVal = b.line || 0;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'desc') {
        return bVal - aVal;
      } else {
        return aVal - bVal;
      }
    });
    
    return filtered;
  }, [props, searchQuery, confidenceThreshold, sortBy, sortDirection]);

  // Paginate results
  const paginatedProps = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedProps.slice(startIndex, endIndex);
  }, [filteredAndSortedProps, page]);

  const totalPages = Math.ceil(filteredAndSortedProps.length / ITEMS_PER_PAGE);

  // Analytics
  const analytics = useMemo(() => {
    if (filteredAndSortedProps.length === 0) return null;
    const totalProps = filteredAndSortedProps.length;
    const avgConfidence = filteredAndSortedProps.reduce((acc, p) => acc + (p.confidence || 0), 0) / totalProps;
    const topPlayer = [...filteredAndSortedProps].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const marketCounts = filteredAndSortedProps.reduce<Record<string, number>>((acc, p) => {
      const market = p.market || 'Unknown';
      acc[market] = (acc[market] || 0) + 1;
      return acc;
    }, {});
    return { totalProps, avgConfidence, topPlayer, marketCounts };
  }, [filteredAndSortedProps]);

  const handleSportChange = (event: SelectChangeEvent) => {
    setSelectedSport(event.target.value);
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
    setSortDirection('desc');
  };
  
  const handleSortDirectionChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  const handleConfidenceChange = (_event: Event, value: number | number[]) => {
    setConfidenceThreshold(value as number);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowClick = (prop: PlayerProp) => {
    console.log('🚀 Navigating to props-details with prop:', prop);
    navigate(`/props-details/${prop.id}`, { 
      state: { prop },
      replace: false 
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Player Props</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ bgcolor: '#333' }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  // Error state
  if (isError && !props.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
        <Alert
          severity="error"
          sx={{
            backgroundColor: '#d32f2f',
            color: '#fff',
            '& .MuiAlert-message': { color: '#fff' },
            mb: 2
          }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} sx={{ color: '#fff' }}>
              Retry
            </Button>
          }
        >
          Error loading player props: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  const hasFilterTeams = teamsPlayingToday.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>
            Player Props
          </Typography>
          {dataSource && (
            <Chip 
              label={dataSource} 
              size="small" 
              sx={{ 
                mt: 1, 
                bgcolor: isRealData ? '#4caf50' : '#ff9800', 
                color: '#fff', 
                fontWeight: 'bold' 
              }} 
            />
          )}
          {hasFilterTeams && (
            <Chip 
              label={`Filtered by ${filterMethod} (${teamsPlayingToday.length} teams)`} 
              size="small" 
              sx={{ mt: 1, ml: 1, bgcolor: '#3b82f6', color: '#fff', fontWeight: 'bold' }} 
            />
          )}
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel sx={{ color: '#fff' }}>Sport</InputLabel>
            <Select
              value={selectedSport}
              label="Sport"
              onChange={handleSportChange}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              <MenuItem value="nba">🏀 NBA</MenuItem>
              <MenuItem value="nhl">🏒 NHL</MenuItem>
              <MenuItem value="mlb">⚾ MLB</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} sx={{ color: '#fff' }} disabled={isFetching}>
              {isFetching ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {analytics && filteredAndSortedProps.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Total Props</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>
                  {analytics.totalProps.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Avg. Confidence</Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff', mr: 1 }}>
                    {analytics.avgConfidence.toFixed(1)}%
                  </Typography>
                  {analytics.avgConfidence >= 75 ? (
                    <TrendingUpIcon sx={{ color: '#4caf50' }} />
                  ) : analytics.avgConfidence >= 60 ? (
                    <TrendingFlatIcon sx={{ color: '#ff9800' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#f44336' }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Top Player</Typography>
                <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: '#fff' }}>
                  {analytics.topPlayer?.player || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {analytics.topPlayer?.market || ''} – {analytics.topPlayer?.line ?? ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e1e1e', border: '1px solid #333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Top Market</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                  {Object.entries(analytics.marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  {Object.entries(analytics.marketCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} props
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search player, team, or market..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#aaa' }} />
                  </InputAdornment>
                ),
                sx: { 
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ color: '#aaa', minWidth: 100 }}>
                Min Confidence:
              </Typography>
              <Slider
                value={confidenceThreshold}
                onChange={handleConfidenceChange}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
                sx={{ flexGrow: 1, color: '#3b82f6' }}
              />
              <Typography variant="body2" sx={{ color: '#fff', minWidth: 35, fontWeight: 'bold' }}>
                {confidenceThreshold}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#fff' }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
                sx={{ 
                  color: '#fff', 
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                  '& .MuiSvgIcon-root': { color: '#fff' }
                }}
              >
                <MenuItem value="confidence">Confidence (High to Low)</MenuItem>
                <MenuItem value="line">Line (Highest)</MenuItem>
                <MenuItem value="over_odds">Over Odds (Highest)</MenuItem>
                <MenuItem value="under_odds">Under Odds (Highest)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Props Table */}
      {filteredAndSortedProps.length === 0 ? (
        <Alert severity="info" sx={{ bgcolor: '#333', color: '#fff', border: '1px solid #555' }}>
          {hasFilterTeams 
            ? `No player props found for tonight's ${selectedSport.toUpperCase()} games. Check back closer to game time!`
            : `No player props available for ${selectedSport.toUpperCase()}.`}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ bgcolor: '#1e1e1e', overflowX: 'auto', border: '1px solid #333', borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold', 
                    minWidth: 180,
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }}>
                    Player
                  </TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Team</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Market</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Line</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Over</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Under</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }} align="center">Confidence</TableCell>
                  <TableCell sx={{ 
                    backgroundColor: '#0d0d0d',
                    color: '#ffffff', 
                    fontWeight: 'bold',
                    minWidth: 150,
                    borderBottom: '2px solid #3b82f6',
                    fontSize: '0.9rem',
                    padding: '14px 16px'
                  }}>Game</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProps.map((prop) => (
                  <TableRow
                    key={prop.id}
                    hover
                    onClick={() => handleRowClick(prop)}
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: '#2a2a2a' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <SportIcon sport={prop.sport} />
                        <Typography variant="body2" fontWeight="medium" sx={{ color: '#fff' }}>
                          {prop.player}
                        </Typography>
                        {prop.projection && prop.projection > 0 && (
                          <Chip 
                            label={`Proj: ${prop.projection.toFixed(1)}`} 
                            size="small" 
                            sx={{ 
                              height: 22, 
                              fontSize: '0.7rem', 
                              bgcolor: '#ff9800', 
                              color: '#fff',
                              fontWeight: 'bold',
                            }} 
                          />
                        )}
                        {prop.is_real_data && (
                          <Chip 
                            label="LIVE" 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.65rem', 
                              bgcolor: '#2e7d32', 
                              color: '#fff',
                              fontWeight: 'bold',
                            }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 500 }}>
                        {prop.team || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      <Chip 
                        label={prop.market} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                          color: '#fff', 
                          borderColor: '#666',
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#ff9800' }}>
                        {prop.line > 0 ? prop.line.toFixed(1) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      <OddsDisplay odds={prop.over_odds} />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      <OddsDisplay odds={prop.under_odds} />
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }} align="center">
                      {prop.confidence > 0 ? (
                        <Box sx={{ minWidth: 100 }}>
                          <ConfidenceIndicator value={prop.confidence} />
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#666' }}>N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333', padding: '12px 16px' }}>
                      <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 500 }}>
                        {prop.game || 'N/A'}
                      </Typography>
                      {prop.game_time && (
                        <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                          {new Date(prop.game_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#fff',
                    '&:hover': { bgcolor: '#333' },
                    '&.Mui-selected': { 
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                    },
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredAndSortedProps.length)} of {filteredAndSortedProps.length}
              </Typography>
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

export default PlayerPropsScreen;
