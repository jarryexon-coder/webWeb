import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip as MuiChip,
  Button,
  AlertTitle,
  IconButton,
  Snackbar,
  LinearProgress,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper
} from '@mui/material';
import { Refresh as RefreshIcon, SportsBasketball, SportsFootball, SportsBaseball } from '@mui/icons-material';

// Fix for Chip size prop
const Chip = (props: any) => <MuiChip size="small" {...props} />;

// Define the PlayerProp interface from File 1
interface PlayerProp {
  player_name: string;
  prop_type: string;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  game: string;
  sport: string;
  last_update: string;
  id?: string;
  player?: string;
  projection?: number;
  actual?: number;
  status?: string;
  confidence?: string;
  type?: string;
  team?: string;
  timestamp?: string;
  odds?: number;
  units?: number;
}

const PrizePicksScreen: React.FC = () => {
  // State management from File 1
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState<'nba' | 'nfl' | 'mlb'>('nba');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [filteredProps, setFilteredProps] = useState<PlayerProp[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'warning' | 'error' });
  
  // Original states from File 2
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  // API configuration
  const API_BASE_URL = process.env.VITE_API_URL || 'https://pleasing-determination-production.up.railway.app';

  // Fetch PrizePicks data using unified API endpoint
  const fetchPrizePicksData = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/prizepicks/selections?sport=${sport}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPlayerProps(data.data || data.selections || []);
        setActiveEndpoint(`/api/prizepicks/selections?sport=${sport}`);
        setError(null);
        
        console.log(`✅ Loaded ${data.count || data.data?.length || 0} player props for ${sport.toUpperCase()}`);
        setSnackbar({
          open: true,
          message: `Successfully loaded ${data.count || data.data?.length || 0} ${sport.toUpperCase()} player props`,
          severity: 'success'
        });
      } else {
        throw new Error(data.message || 'Failed to load data');
      }
    } catch (error: any) {
      console.error('❌ Error fetching PrizePicks data:', error);
      
      // Fallback to alternative endpoints (from File 2)
      await tryAlternativeEndpoints();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Alternative endpoints fallback (from File 2)
  const tryAlternativeEndpoints = async () => {
    console.log('🔍 Trying alternative endpoints...');
    const endpointsToTry = [
      { path: '/api/prizepicks/picks', name: 'Picks' },
      { path: '/api/picks/prizepicks', name: 'Picks (alt)' },
      { path: '/api/prize-picks', name: 'Prize-Picks' },
      { path: '/api/prizepicks', name: 'Root' },
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🎯 Trying: ${endpoint.name} (${endpoint.path})`);
        const response = await fetch(`${API_BASE_URL}${endpoint.path}?sport=${sport}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Response from ${endpoint.name}:`, data);
          
          // Extract data from various possible structures
          let extractedData: any[] = [];
          const possibleProperties = ['data', 'picks', 'selections', 'items', 'results'];
          
          for (const prop of possibleProperties) {
            if (Array.isArray(data[prop]) && data[prop].length > 0) {
              extractedData = data[prop];
              break;
            }
          }
          
          if (extractedData.length === 0 && Array.isArray(data)) {
            extractedData = data;
          }
          
          if (extractedData.length > 0) {
            // Transform to PlayerProp format
            const transformedData = extractedData.map((item: any) => ({
              player_name: item.player_name || item.player || item.name || 'Unknown Player',
              prop_type: item.prop_type || item.type || 'points',
              line: item.line || item.projection || 0,
              over_price: item.over_price || item.overOdds || null,
              under_price: item.under_price || item.underOdds || null,
              bookmaker: item.bookmaker || 'Unknown',
              game: item.game || item.matchup || 'Unknown Game',
              sport: item.sport || sport,
              last_update: item.last_update || item.timestamp || new Date().toISOString(),
              id: item.id || `pick-${Date.now()}-${Math.random()}`,
            }));
            
            setPlayerProps(transformedData);
            setActiveEndpoint(endpoint.path);
            setError(null);
            
            setSnackbar({
              open: true,
              message: `Loaded ${transformedData.length} picks from ${endpoint.name}`,
              severity: 'success'
            });
            
            return; // Stop trying endpoints
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} failed:`, error);
      }
    }
    
    // If all endpoints fail, use mock data
    console.log('⚠️ All endpoints failed, using mock data');
    setSnackbar({
      open: true,
      message: 'Using sample data - API endpoints unavailable',
      severity: 'warning'
    });
    setActiveEndpoint('mock');
  };

  // Filter props based on search and league (from File 1)
  useEffect(() => {
    if (Array.isArray(playerProps)) {
      let filtered = [...playerProps];
      
      // Filter by league
      if (selectedLeague !== 'All') {
        filtered = filtered.filter(prop => 
          prop.sport.toLowerCase() === selectedLeague.toLowerCase()
        );
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(prop =>
          prop.player_name.toLowerCase().includes(lowerQuery) ||
          prop.game.toLowerCase().includes(lowerQuery) ||
          prop.prop_type.toLowerCase().includes(lowerQuery) ||
          prop.bookmaker.toLowerCase().includes(lowerQuery)
        );
      }
      
      setFilteredProps(filtered);
    }
  }, [playerProps, selectedLeague, searchQuery]);

  // Fetch analytics data (from File 2)
  const fetchPrizePicksAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prizepicks/analytics`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📈 PrizePicks Analytics response:', data);
      
      if (data.success && data.analytics) {
        let analyticsData: any[] = [];
        
        if (Array.isArray(data.analytics)) {
          analyticsData = data.analytics;
        } else if (typeof data.analytics === 'object') {
          if (data.analytics.bySport && Array.isArray(data.analytics.bySport)) {
            analyticsData.push(...data.analytics.bySport);
          }
          if (data.analytics.topPerformers && Array.isArray(data.analytics.topPerformers)) {
            analyticsData.push(...data.analytics.topPerformers);
          }
          if (data.analytics.byPickType && Array.isArray(data.analytics.byPickType)) {
            analyticsData.push(...data.analytics.byPickType);
          }
        }
        
        console.log(`✅ Extracted ${analyticsData.length} analytics items`);
        setAnalytics(analyticsData);
      }
    } catch (err: any) {
      console.error('❌ Error fetching PrizePicks analytics:', err);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🚀 PrizePicksScreen mounted, fetching data...');
    const loadData = async () => {
      await fetchPrizePicksData();
      await fetchPrizePicksAnalytics();
    };
    loadData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchPrizePicksData, 120000);
    return () => clearInterval(interval);
  }, [sport]);

  // Handle sport change (from File 1)
  const handleSportChange = (newSport: 'nba' | 'nfl' | 'mlb') => {
    setSport(newSport);
    setSnackbar({
      open: true,
      message: `Loading ${newSport.toUpperCase()} player props...`,
      severity: 'info'
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    setSnackbar({
      open: true,
      message: 'Refreshing data...',
      severity: 'info'
    });
    
    await fetchPrizePicksData();
    await fetchPrizePicksAnalytics();
    
    setSnackbar({
      open: true,
      message: 'Data refreshed successfully',
      severity: 'success'
    });
  };

  // Helper functions from File 1
  const formatPropType = (type: string) => {
    const typeMap: Record<string, string> = {
      'player_points': 'Points',
      'player_rebounds': 'Rebounds',
      'player_assists': 'Assists',
      'player_threes': '3-Pointers',
      'points': 'Points',
      'rebounds': 'Rebounds',
      'assists': 'Assists',
      'passing_yards': 'Passing Yards',
      'rushing_yards': 'Rushing Yards',
      'receiving_yards': 'Receiving Yards',
      'strikeouts': 'Strikeouts',
      'hits': 'Hits',
      'home_runs': 'Home Runs'
    };
    return typeMap[type] || type.replace('player_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSportColor = (sportType: string) => {
    switch(sportType.toLowerCase()) {
      case 'nba': return '#ef4444';
      case 'nfl': return '#3b82f6';
      case 'mlb': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const getBookmakerColor = (bookmaker: string) => {
    const bookmakerColors: Record<string, string> = {
      'draftkings': '#8b5cf6',
      'fanduel': '#3b82f6',
      'betmgm': '#ef4444',
      'pointsbet': '#10b981',
      'caesars': '#f59e0b',
      'barstool': '#ec4899',
      'bet365': '#059669',
      'sugarhouse': '#8b5cf6',
      'twinspires': '#3b82f6',
      'wynnbet': '#ef4444',
    };
    
    return bookmakerColors[bookmaker.toLowerCase()] || '#64748b';
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A';
    if (price > 0) return `+${price}`;
    return price.toString();
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading prize picks...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading {sport.toUpperCase()} player props...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            PrizePicks Player Props
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Live player props from various bookmakers
            {activeEndpoint && (
              <Chip 
                label={`Source: ${activeEndpoint === 'mock' ? 'Sample Data' : activeEndpoint}`}
                size="small"
                color={activeEndpoint === 'mock' ? 'warning' : 'success'}
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleRefresh} 
          disabled={refreshing}
          startIcon={<RefreshIcon />}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Sport selector (from File 1) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={sport === 'nba' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('nba')}
          startIcon={<SportsBasketball />}
          sx={{
            bgcolor: sport === 'nba' ? getSportColor('nba') : 'transparent',
            borderColor: getSportColor('nba'),
            '&:hover': {
              bgcolor: sport === 'nba' ? getSportColor('nba') : `${getSportColor('nba')}20`,
            }
          }}
        >
          NBA
        </Button>
        <Button
          variant={sport === 'nfl' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('nfl')}
          startIcon={<SportsFootball />}
          sx={{
            bgcolor: sport === 'nfl' ? getSportColor('nfl') : 'transparent',
            borderColor: getSportColor('nfl'),
            '&:hover': {
              bgcolor: sport === 'nfl' ? getSportColor('nfl') : `${getSportColor('nfl')}20`,
            }
          }}
        >
          NFL
        </Button>
        <Button
          variant={sport === 'mlb' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('mlb')}
          startIcon={<SportsBaseball />}
          sx={{
            bgcolor: sport === 'mlb' ? getSportColor('mlb') : 'transparent',
            borderColor: getSportColor('mlb'),
            '&:hover': {
              bgcolor: sport === 'mlb' ? getSportColor('mlb') : `${getSportColor('mlb')}20`,
            }
          }}
        >
          MLB
        </Button>
      </Box>

      {/* Search and Filter Controls (from File 1) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search players, games, or props..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>League</InputLabel>
          <Select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            label="League"
          >
            <MenuItem value="All">All Leagues</MenuItem>
            <MenuItem value="NBA">NBA</MenuItem>
            <MenuItem value="NFL">NFL</MenuItem>
            <MenuItem value="MLB">MLB</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Player Props Grid (from File 1) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#3a0ca3', mb: 3 }}>
          🎯 Player Props ({filteredProps.length})
        </Typography>
        
        {filteredProps.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body1">
              {searchQuery.trim() 
                ? `No props found matching "${searchQuery}"`
                : `No player props available for ${sport.toUpperCase()} right now. Try refreshing or check back closer to game time.`
              }
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredProps.slice(0, 50).map((prop, index) => (
              <Grid item xs={12} sm={6} md={4} key={prop.id || index}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}>
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', flex: 1 }}>
                        {prop.player_name}
                      </Typography>
                      <Chip 
                        label={prop.bookmaker}
                        size="small"
                        sx={{ 
                          bgcolor: getBookmakerColor(prop.bookmaker),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {prop.game}
                    </Typography>
                    
                    {/* Prop Type */}
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={formatPropType(prop.prop_type)}
                        size="small"
                        sx={{ 
                          bgcolor: getSportColor(prop.sport) + '20',
                          color: getSportColor(prop.sport),
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    {/* Line Display */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Line:
                      </Typography>
                      <Typography variant="h4" sx={{ color: getSportColor(prop.sport), fontWeight: 'bold' }}>
                        {prop.line}
                      </Typography>
                    </Box>
                    
                    {/* Odds Display */}
                    <Box sx={{ 
                      display: 'flex',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 2
                    }}>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        p: 1,
                        bgcolor: '#10b981',
                        color: 'white'
                      }}>
                        <Typography variant="caption" display="block">
                          Over
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPrice(prop.over_price)}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        p: 1,
                        bgcolor: '#ef4444',
                        color: 'white'
                      }}>
                        <Typography variant="caption" display="block">
                          Under
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatPrice(prop.under_price)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip 
                        label={prop.sport.toUpperCase()}
                        size="small"
                        sx={{ 
                          bgcolor: getSportColor(prop.sport) + '20',
                          color: getSportColor(prop.sport),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(prop.last_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Analytics Section (from File 2) */}
      {analytics.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#3a0ca3', mb: 3 }}>
            📊 Analytics ({analytics.length} items)
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {analytics.slice(0, 6).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {item.sport || item.player || item.type || 'Analytics Item'}
                    </Typography>
                    
                    {item.winRate && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={parseFloat(item.winRate) || 0} 
                            sx={{ flex: 1, mr: 1, height: 6 }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {item.winRate}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {item.accuracy && (
                      <Typography variant="body2" color="text.secondary">
                        Accuracy: <strong>{(item.accuracy * 100).toFixed(1)}%</strong>
                      </Typography>
                    )}
                    
                    {item.picks && (
                      <Typography variant="body2" color="text.secondary">
                        Total Picks: <strong>{item.picks}</strong>
                      </Typography>
                    )}
                    
                    {item.roi && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                        ROI: <strong>{item.roi}</strong>
                      </Typography>
                    )}
                    
                    {item.category && (
                      <Chip 
                        label={item.category}
                        size="small"
                        sx={{ mt: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Stats Footer (combined from File 1 and 2) */}
      {filteredProps.length > 0 && (
        <Paper sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Sport
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  bgcolor: getSportColor(sport),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {sport === 'nba' ? '🏀' : sport === 'nfl' ? '🏈' : '⚾'}
                </Box>
                <Typography variant="body1" fontWeight="bold">
                  {sport.toUpperCase()}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Displayed Props
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {filteredProps.length}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Bookmakers
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {Array.from(new Set(filteredProps.map(p => p.bookmaker))).length}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Typography>
            </Box>
          </Stack>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {activeEndpoint === 'mock' 
                ? 'Note: Using sample data. Real picks will load when API endpoints return data.'
                : `Data loaded from ${activeEndpoint}. Auto-refreshes every 2 minutes.`}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PrizePicksScreen;
