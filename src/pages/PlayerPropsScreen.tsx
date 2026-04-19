// src/pages/PlayerPropsScreen.tsx - Premium only (Analytics plan required)
import React, { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
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
  Pagination,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  ShowChart as ProjectionIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const API_BASE = 'https://prizepicks-production.up.railway.app';
const ITEMS_PER_PAGE = 50;

interface PlayerProp {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  over_odds: number;
  projection: number;
  edge?: number;
  sport: string;
  is_real_data: boolean;
  game?: string;
  source?: string;
}

// ========== SPORT-SPECIFIC TEAM NAME NORMALIZATION ==========
const normalizeTeamName = (name: string, sport: string): string => {
  if (!name) return '';
  const upper = name.toUpperCase().trim();
  
  // MLB MAPPING
  if (sport === 'MLB') {
    const mlbMap: Record<string, string> = {
      'ARI': 'Diamondbacks', 'ATL': 'Braves', 'BAL': 'Orioles', 'BOS': 'Red Sox',
      'CHC': 'Cubs', 'CIN': 'Reds', 'CLE': 'Guardians', 'COL': 'Rockies',
      'DET': 'Tigers', 'HOU': 'Astros', 'KC': 'Royals', 'LAA': 'Angels',
      'LAD': 'Dodgers', 'MIA': 'Marlins', 'MIL': 'Brewers', 'MIN': 'Twins',
      'NYM': 'Mets', 'NYY': 'Yankees', 'OAK': 'Athletics', 'PHI': 'Phillies',
      'PIT': 'Pirates', 'SD': 'Padres', 'SEA': 'Mariners', 'SF': 'Giants',
      'STL': 'Cardinals', 'TB': 'Rays', 'TEX': 'Rangers', 'TOR': 'Blue Jays',
      'WSH': 'Nationals',
    };
    return mlbMap[upper] || name;
  }
  
  // NBA MAPPING
  if (sport === 'NBA') {
    const nbaMap: Record<string, string> = {
      'ATL': 'Hawks', 'BOS': 'Celtics', 'BKN': 'Nets', 'CHA': 'Hornets', 'CHI': 'Bulls',
      'CLE': 'Cavaliers', 'DAL': 'Mavericks', 'DEN': 'Nuggets', 'DET': 'Pistons', 'GSW': 'Warriors',
      'HOU': 'Rockets', 'IND': 'Pacers', 'LAC': 'Clippers', 'LAL': 'Lakers', 'MEM': 'Grizzlies',
      'MIA': 'Heat', 'MIL': 'Bucks', 'MIN': 'Timberwolves', 'NOP': 'Pelicans', 'NYK': 'Knicks',
      'OKC': 'Thunder', 'ORL': 'Magic', 'PHI': '76ers', 'PHX': 'Suns', 'POR': 'Trail Blazers',
      'SAC': 'Kings', 'SAS': 'Spurs', 'TOR': 'Raptors', 'UTA': 'Jazz', 'WAS': 'Wizards',
    };
    return nbaMap[upper] || name;
  }
  
  // NHL MAPPING
  if (sport === 'NHL') {
    const nhlMap: Record<string, string> = {
      'ANA': 'Ducks', 'ARI': 'Coyotes', 'BOS': 'Bruins', 'BUF': 'Sabres', 'CGY': 'Flames',
      'CAR': 'Hurricanes', 'CHI': 'Blackhawks', 'COL': 'Avalanche', 'CBJ': 'Blue Jackets',
      'DAL': 'Stars', 'DET': 'Red Wings', 'EDM': 'Oilers', 'FLA': 'Panthers', 'LAK': 'Kings',
      'MIN': 'Wild', 'MTL': 'Canadiens', 'NSH': 'Predators', 'NJD': 'Devils', 'NYI': 'Islanders',
      'NYR': 'Rangers', 'OTT': 'Senators', 'PHI': 'Flyers', 'PIT': 'Penguins', 'SJS': 'Sharks',
      'SEA': 'Kraken', 'STL': 'Blues', 'TBL': 'Lightning', 'TOR': 'Maple Leafs', 'VAN': 'Canucks',
      'VGK': 'Golden Knights', 'WSH': 'Capitals', 'WPG': 'Jets',
    };
    return nhlMap[upper] || name;
  }
  
  return name;
};

const formatMarketName = (market: string): string => {
  const map: Record<string, string> = {
    'points': 'Points', 'assists': 'Assists', 'rebounds': 'Rebounds',
    'blocks': 'Blocks', 'steals': 'Steals', 'turnovers': 'Turnovers',
    'threes': '3PM', 'three-pointers-made': '3PM', 'points_rebounds_assists': 'PRA',
    'hits': 'Hits', 'home_runs': 'HR', 'rbi': 'RBI', 'strikeouts': 'K',
    'goals': 'Goals', 'assists_hockey': 'Assists', 'saves': 'Saves', 'shots': 'Shots',
  };
  return map[market.toLowerCase()] || market;
};

const fetchPrizePicksProps = async (sport: string): Promise<{ props: PlayerProp[], source: string }> => {
  try {
    const url = `${API_BASE}/api/prizepicks/selections?sport=${sport}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    const selections: any[] = data.selections || [];
    const source = data.source || 'unknown';
    const sportUpper = sport.toUpperCase();
    
    const props: PlayerProp[] = selections.map((item: any, idx: number) => {
      const player = item.player || 'Unknown';
      const rawTeam = item.team || '';
      const team = normalizeTeamName(rawTeam, sportUpper);
      const market = formatMarketName(item.stat || 'points');
      const line = parseFloat(item.line) || 0;
      const odds = parseFloat(item.odds) || 0;
      const projection = parseFloat(item.projection) || 0;
      
      return {
        id: item.id || `prop-${sport}-${idx}`,
        player,
        team,
        market,
        line,
        over_odds: odds,
        projection,
        sport: sportUpper,
        is_real_data: source !== 'realistic-fallback',
        source,
        game: `${team} vs Opponent`,
      };
    }).filter(p => p.line > 0);
    
    console.log(`✅ ${props.length} valid props for ${sportUpper} (source: ${source})`);
    return { props, source };
  } catch (err) {
    console.error(`Error fetching ${sport} props:`, err);
    return { props: [], source: 'error' };
  }
};

// UI Components
const OddsDisplay = ({ odds }: { odds?: number }) => {
  if (!odds) return <Chip label="N/A" size="small" sx={{ bgcolor: '#444', color: '#ccc' }} />;
  const formatted = odds > 0 ? `+${odds}` : `${odds}`;
  const isFavorite = odds < 0;
  return (
    <Chip label={formatted} size="small"
      sx={{
        bgcolor: isFavorite ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
        color: isFavorite ? '#4caf50' : '#f44336',
        fontWeight: 'bold',
        border: `1px solid ${isFavorite ? '#4caf50' : '#f44336'}`,
      }}
    />
  );
};

const SportIcon = ({ sport }: { sport?: string }) => {
  switch (sport?.toUpperCase()) {
    case 'NBA': return <BasketballIcon sx={{ color: '#ef4444' }} />;
    case 'NFL': return <FootballIcon sx={{ color: '#3b82f6' }} />;
    case 'MLB': return <BaseballIcon sx={{ color: '#10b981' }} />;
    case 'NHL': return <HockeyIcon sx={{ color: '#1e40af' }} />;
    default: return null;
  }
};

const PlayerPropsContent: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth(); // Only for potential future use, not for access control
  
  const [selectedSport, setSelectedSport] = useState('nba');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('line');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['playerProps', selectedSport],
    queryFn: () => fetchPrizePicksProps(selectedSport),
    staleTime: 1000 * 60 * 5,
  });

  const props = data?.props || [];
  const source = data?.source || 'unknown';

  const filteredProps = useMemo(() => {
    let filtered = [...props];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.player.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      let aVal = 0, bVal = 0;
      if (sortBy === 'line') { aVal = a.line; bVal = b.line; }
      else if (sortBy === 'projection') { aVal = a.projection; bVal = b.projection; }
      else if (sortBy === 'over_odds') { aVal = Math.abs(a.over_odds); bVal = Math.abs(b.over_odds); }
      return bVal - aVal;
    });
    return filtered;
  }, [props, searchQuery, sortBy]);

  const paginatedProps = filteredProps.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredProps.length / ITEMS_PER_PAGE);

  const analytics = useMemo(() => {
    if (!filteredProps.length) return null;
    const marketCounts = filteredProps.reduce((acc, p) => {
      acc[p.market] = (acc[p.market] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total: filteredProps.length, marketCounts };
  }, [filteredProps]);

  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorView onRetry={refetch} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>
            Player Props
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#fff' }}>Sport</InputLabel>
            <Select value={selectedSport} label="Sport" onChange={e => setSelectedSport(e.target.value)} sx={{ color: '#fff' }}>
              <MenuItem value="nba">🏀 NBA</MenuItem>
              <MenuItem value="nhl">🏒 NHL</MenuItem>
              <MenuItem value="mlb">⚾ MLB</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => refetch()} sx={{ color: '#fff' }} disabled={isFetching}>
            {isFetching ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: '#1e1e1e' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }}>Total Props</Typography>
                <Typography variant="h4" sx={{ color: '#fff' }}>{analytics.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: '#1e1e1e' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }}>Top Market</Typography>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {Object.entries(analytics.marketCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: '#1e1e1e' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }}>Data Source</Typography>
                <Typography variant="h6" sx={{ color: '#fff' }}>{source}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1e1e1e' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" placeholder="Search player, team, market..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#aaa' }} /></InputAdornment>, sx: { color: '#fff' } }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#fff' }}>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={e => setSortBy(e.target.value)} sx={{ color: '#fff' }}>
                <MenuItem value="line">Line (Highest)</MenuItem>
                <MenuItem value="projection">Projection (Highest)</MenuItem>
                <MenuItem value="over_odds">Over Multiplier (Highest)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Props Table with Projection Column */}
      {filteredProps.length === 0 ? (
        <Alert severity="info">No props found for {selectedSport.toUpperCase()} today.</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ bgcolor: '#1e1e1e', overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold', minWidth: 180 }}>Player</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }} align="center">Team</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }} align="center">Market</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }} align="center">Line</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }} align="center">Projection</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }} align="center">Over Multiplier</TableCell>
                  <TableCell sx={{ bgcolor: '#0d0d0d', color: '#fff', fontWeight: 'bold' }}>Game</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProps.map(prop => (
                  <TableRow key={prop.id} hover onClick={() => navigate(`/player/${encodeURIComponent(prop.player)}`, { 
                    state: { playerName: prop.player, sport: prop.sport, team: prop.team } 
                  })} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#2a2a2a' } }}>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SportIcon sport={prop.sport} />
                        <Typography variant="body2" fontWeight="medium">{prop.player}</Typography>
                        {prop.is_real_data && <Chip label="LIVE" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#2e7d32', color: '#fff' }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{prop.team}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #333' }}>
                      <Chip label={prop.market} size="small" variant="outlined" sx={{ color: '#fff', borderColor: '#666' }} />
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                      <Typography fontWeight="bold" sx={{ color: '#ff9800' }}>{prop.line.toFixed(1)}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <ProjectionIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
                        <Typography fontWeight="bold" sx={{ color: '#8b5cf6' }}>{prop.projection.toFixed(1)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: '1px solid #333' }}><OddsDisplay odds={prop.over_odds} /></TableCell>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>{prop.game}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="large" />
              <Typography variant="body2" sx={{ color: '#aaa' }}>Showing {Math.min(filteredProps.length, (page-1)*ITEMS_PER_PAGE+1)}-{Math.min(page*ITEMS_PER_PAGE, filteredProps.length)} of {filteredProps.length}</Typography>
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212' }}>
    <Typography variant="h4" sx={{ color: '#fff' }}>Player Props</Typography>
    <Grid container spacing={3} mt={2}>
      {[1,2,3,4,5,6].map(i => <Grid item xs={12} md={6} lg={4} key={i}><Skeleton variant="rounded" height={160} sx={{ bgcolor: '#333' }} /></Grid>)}
    </Grid>
  </Container>
);

const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212' }}>
    <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
      Failed to load player props.
    </Alert>
  </Container>
);

const PlayerPropsScreen: React.FC = () => (
  <ProtectedRoute screenName="PlayerProps">
    <PlayerPropsContent />
  </ProtectedRoute>
);

export default PlayerPropsScreen;
