import React, { useMemo, useState } from 'react';
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
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import { playerPropsApi } from '../services/playerProps';

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
  player_id?: string;
  position?: string;
  last_updated: string;
  sport: string;
  is_real_data: boolean;
  game?: string;
  game_time?: string;
}

// ----------------------------------------------------------------------
// Helper Components (with defensive checks)
// ----------------------------------------------------------------------
const OddsDisplay = ({ odds }: { odds?: number }) => {
  if (odds === undefined || odds === null) return <Chip label="N/A" size="small" variant="outlined" sx={{ color: '#aaa', borderColor: '#555' }} />;
  const formatted = odds > 0 ? `+${odds}` : `${odds}`;
  const isFavorite = odds < 0;
  return (
    <Chip
      label={formatted}
      size="small"
      color={isFavorite ? 'success' : 'error'}
      variant="outlined"
      sx={{ color: '#fff', borderColor: isFavorite ? '#4caf50' : '#f44336' }}
    />
  );
};

const ConfidenceIndicator = ({ value }: { value?: number }) => {
  if (value === undefined || value === null) return null;
  let color: 'success' | 'warning' | 'error' = 'success';
  if (value < 60) color = 'error';
  else if (value < 75) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" sx={{ color: '#fff' }}>
        {value}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          flexGrow: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: '#333',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color === 'success' ? '#4caf50' : color === 'warning' ? '#ff9800' : '#f44336'
          }
        }}
        color={color}
      />
    </Box>
  );
};

const SportIcon = ({ sport }: { sport?: string }) => {
  if (!sport) return null;
  switch (sport.toUpperCase()) {
    case 'NBA': return <BasketballIcon fontSize="small" sx={{ color: '#fff' }} />;
    case 'NFL': return <FootballIcon fontSize="small" sx={{ color: '#fff' }} />;
    case 'MLB': return <BaseballIcon fontSize="small" sx={{ color: '#fff' }} />;
    case 'NHL': return <HockeyIcon fontSize="small" sx={{ color: '#fff' }} />;
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

  const {
    data,
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['playerProps', selectedSport],
    queryFn: () => playerPropsApi.getProps(selectedSport),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // FIX: data is the array itself, not an object with a props property
  const props = data || [];

  // Debug logs (you can remove these later)
  console.log('🔍 props array:', props);
  console.log('🔍 props length:', props.length);

  const filteredProps = useMemo(() => {
    let filtered = [...props];
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.player?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (confidenceThreshold > 0) {
      filtered = filtered.filter((p) => (p.confidence || 0) >= confidenceThreshold);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return (b.confidence || 0) - (a.confidence || 0);
        case 'over_odds': return (b.over_odds || 0) - (a.over_odds || 0);
        case 'line': return (b.line || 0) - (a.line || 0);
        default: return 0;
      }
    });
    return filtered;
  }, [props, searchQuery, confidenceThreshold, sortBy]);

  const analytics = useMemo(() => {
    if (props.length === 0) return null;
    const totalProps = props.length;
    const avgConfidence = props.reduce((acc, p) => acc + (p.confidence || 0), 0) / totalProps;
    const topPlayer = [...props].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const marketCounts = props.reduce<Record<string, number>>((acc, p) => {
      const market = p.market || 'Unknown';
      acc[market] = (acc[market] || 0) + 1;
      return acc;
    }, {});
    return { totalProps, avgConfidence, topPlayer, marketCounts };
  }, [props]);

  const handleSportChange = (event: SelectChangeEvent) => setSelectedSport(event.target.value);
  const handleSortChange = (event: SelectChangeEvent) => setSortBy(event.target.value);
  const handleConfidenceChange = (_event: Event, value: number | number[]) =>
    setConfidenceThreshold(value as number);

  // ===== FIXED: handleRowClick now receives the whole prop and passes it in state =====
  const handleRowClick = (prop: PlayerProp) => {
    console.log('🚀 Navigating to props-details with prop:', prop);
    console.log('   prop.id =', prop.id);
    navigate(`/props-details/${prop.id}`, { state: { prop } });
  };
  // ===============================================================================

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

  if (isError) {
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
            <Button color="inherit" size="small" onClick={() => refetch()} sx={{ color: '#fff' }}>
              Retry
            </Button>
          }
        >
          Error loading player props: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
      {/* Header with Sport Select */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>Player Props</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="sport-filter-label" sx={{ color: '#fff' }}>Sport</InputLabel>
            <Select
              labelId="sport-filter-label"
              value={selectedSport}
              label="Sport"
              onChange={handleSportChange}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                '& .MuiSvgIcon-root': { color: '#fff' }
              }}
            >
              <MenuItem value="nba">NBA</MenuItem>
              <MenuItem value="nfl">NFL</MenuItem>
              <MenuItem value="mlb">MLB</MenuItem>
              <MenuItem value="nhl">NHL</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} sx={{ color: '#fff' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: '#1e1e1e', borderColor: '#333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Total Props</Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>{analytics.totalProps}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: '#1e1e1e', borderColor: '#333' }}>
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
            <Card variant="outlined" sx={{ bgcolor: '#1e1e1e', borderColor: '#333' }}>
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
            <Card variant="outlined" sx={{ bgcolor: '#1e1e1e', borderColor: '#333' }}>
              <CardContent>
                <Typography sx={{ color: '#aaa' }} gutterBottom>Most Popular Market</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                  {Object.entries(analytics.marketCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#1e1e1e' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#fff' }} />
                  </InputAdornment>
                ),
                sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ color: '#aaa', minWidth: 80 }}>
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
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-label" sx={{ color: '#fff' }}>Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
                sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
              >
                <MenuItem value="confidence">Confidence (High to Low)</MenuItem>
                <MenuItem value="over_odds">Over Odds (Highest)</MenuItem>
                <MenuItem value="line">Line (Highest)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Confidence Distribution Chart */}
      {filteredProps.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: '#1e1e1e' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Confidence Distribution</Typography>
          <Box sx={{ height: 200, width: '100%' }}>
            <BarChart
              dataset={filteredProps.slice(0, 15).map((p) => ({
                label: p.player && p.player.length > 15 ? p.player.substring(0, 12) + '…' : p.player || 'Unknown',
                confidence: p.confidence || 0,
              }))}
              xAxis={[{ scaleType: 'band', dataKey: 'label', tickLabelStyle: { fill: '#fff' } }]}
              series={[{ dataKey: 'confidence', label: 'Confidence (%)', color: '#3b82f6' }]}
              yAxis={[{ max: 100, tickLabelStyle: { fill: '#fff' } }]}
              tooltip={{ trigger: 'item' }}
            />
          </Box>
        </Paper>
      )}

      {/* Props Table */}
      {filteredProps.length === 0 ? (
        <Alert severity="info" sx={{ bgcolor: '#333', color: '#fff' }}>
          No player props found for the selected filters.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#1e1e1e' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#2d2d2d' }}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Player</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Team / Pos</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Market</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Line</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Over</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Under</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Confidence</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Game Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProps.map((prop) => (
                <TableRow
                  key={prop.id}
                  hover
                  // ===== FIXED: pass the whole prop object to handleRowClick =====
                  onClick={() => handleRowClick(prop)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#333' } }}
                >
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SportIcon sport={prop.sport} />
                      <Typography variant="body2" fontWeight="medium" sx={{ color: '#fff' }}>
                        {prop.player || 'Unknown'}
                      </Typography>
                      {prop.is_real_data && (
                        <Tooltip title="Live odds">
                          <Chip label="LIVE" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#2e7d32', color: '#fff' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {prop.team || '—'} {prop.position && `• ${prop.position}`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <Chip label={prop.market || '—'} size="small" variant="outlined" sx={{ color: '#fff', borderColor: '#555' }} />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>{prop.line ?? '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <OddsDisplay odds={prop.over_odds} />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <OddsDisplay odds={prop.under_odds} />
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }} align="center">
                    <Box sx={{ minWidth: 100 }}>
                      <ConfidenceIndicator value={prop.confidence} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#fff', borderBottom: '1px solid #333' }}>
                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>
                      {prop.game || 'N/A'}
                    </Typography>
                    {prop.game_time && (
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {new Date(prop.game_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default PlayerPropsScreen;
