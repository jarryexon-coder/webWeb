// src/pages/ParlayArchitectScreen.tsx - COMPLETE FIX
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Avatar,
  Divider,
  useTheme,
  Badge,
  Modal,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as CashIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  Merge as MergeIcon,
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Layers as LayersIcon,
  Speed as SpeedometerIcon,
  Wallet as WalletIcon,
  Sync as SyncIcon,
  Search as SearchIcon,
  Whatshot as FlameIcon,
  Timeline as TimelineIcon,
  DarkMode as DarkModeIcon,
  Gamepad as GamepadIcon,
  Shield as ShieldIcon,
  FilterList as FilterListIcon,
  Shuffle as ShuffleIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// At the top of the file, add:
import { useParlaySuggestions } from '../hooks/useSportsData';

// Mock data for fallback
const MOCK_PARLAY_SUGGESTIONS = Array.from({ length: 6 }, (_, i) => {
  const sports = ['Mixed', 'NBA', 'NFL', 'MLB', 'NHL'];
  const types = ['Cross-Sport Value', 'Multi-Sport Smash', 'Spread Mix', 'Player Props', 'Moneyline Mix'];
  
  return {
    id: `parlay-${i + 1}`,
    name: `${types[i % types.length]} Parlay ${i + 1}`,
    sport: sports[i % sports.length],
    legs: Array.from({ length: 3 }, (_, legIndex) => ({
      id: `leg-${i}-${legIndex}`,
      sport: ['NBA', 'NFL', 'MLB', 'NHL'][legIndex % 4],
      pick: `Over ${Math.floor(Math.random() * 10) + 25}.5 Points`,
      odds: ['-150', '-110', '+120', '+180'][Math.floor(Math.random() * 4)],
      confidence: Math.floor(Math.random() * 20) + 70,
      edge: `+${(3 + Math.random() * 7).toFixed(1)}%`,
      analysis: 'Strong value play with positive expected value',
      type: ['Points', 'Assists', 'Rebounds', 'Yards'][Math.floor(Math.random() * 4)],
      keyStat: 'Player averaging strong performance vs opponent',
      matchup: 'Featured matchup tonight'
    })),
    totalOdds: '+425',
    stake: '$10',
    potentialWin: '$42.50',
    confidence: Math.floor(Math.random() * 30) + 70,
    analysis: 'Diversified across sports with low correlation risk. Optimal balance of risk/reward.',
    timestamp: 'Just generated',
    expert: 'AI Parlay Architect'
  };
});

// Inside your component, replace fetch logic with:
const ParlayArchitectScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { data: suggestions, loading, error } = useParlaySuggestions();
  
  const [selectedParlays, setSelectedParlays] = useState<any[]>([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedParlayToBuild, setSelectedParlayToBuild] = useState<any>(null);
  const [analyticsMetrics] = useState({
    totalParlays: 128,
    winRate: '68.4%',
    avgLegs: '2.7',
    avgOdds: '+425',
    bestParlay: '+1250',
    multiSport: '42%'
  });

  const sportsData = [
    { id: 'All', name: 'All Sports', icon: <TimelineIcon />, color: '#f59e0b' },
    { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
    { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' },
  ];

  const handleBuildParlay = (parlay: any) => {
    setSelectedParlayToBuild(parlay);
    setShowBuildModal(true);
  };

  const getSportIcon = (sport: string) => {
    switch(sport) {
      case 'NBA': return <BasketballIcon />;
      case 'NFL': return <FootballIcon />;
      case 'NHL': return <HockeyIcon />;
      case 'MLB': return <BaseballIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getSportColor = (sport: string) => {
    switch(sport) {
      case 'NBA': return '#ef4444';
      case 'NFL': return '#3b82f6';
      case 'NHL': return '#1e40af';
      case 'MLB': return '#10b981';
      default: return '#f59e0b';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const AnalyticsDashboard = () => (
    <Dialog 
      open={showAnalyticsModal} 
      onClose={() => setShowAnalyticsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        Parlay Performance Analytics
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Parlay Performance Metrics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.winRate}
              </Typography>
              <Typography variant="caption" color="text.secondary">Win Rate</Typography>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(analyticsMetrics.winRate)} 
                sx={{ mt: 1, bgcolor: '#10b98120', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.avgLegs}
              </Typography>
              <Typography variant="caption" color="text.secondary">Avg Legs</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(parseFloat(analyticsMetrics.avgLegs) / 5) * 100} 
                sx={{ mt: 1, bgcolor: '#3b82f620', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.avgOdds}
              </Typography>
              <Typography variant="caption" color="text.secondary">Avg Odds</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.bestParlay}
              </Typography>
              <Typography variant="caption" color="text.secondary">Best Parlay</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          🎯 Multi-Sport Performance
        </Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" color="#f59e0b">
              {analyticsMetrics.multiSport}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              of winning parlays
            </Typography>
          </Box>
          <Typography variant="body2">
            Multi-sport parlays have shown higher success rates due to reduced correlation risk.
          </Typography>
        </Paper>
        
        <Typography variant="h6" gutterBottom>
          💡 Parlay Building Tips
        </Typography>
        <List>
          <ListItem>
            <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
            <ListItemText primary="2-3 legs have highest success rate" />
          </ListItem>
          <ListItem>
            <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
            <ListItemText primary="Combine sports for better value" />
          </ListItem>
          <ListItem>
            <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
            <ListItemText primary="Balance high-probability with value picks" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalyticsModal(false)}>Close Dashboard</Button>
      </DialogActions>
    </Dialog>
  );

  const BuildParlayModal = () => (
    <Dialog 
      open={showBuildModal} 
      onClose={() => setShowBuildModal(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Build Parlay: {selectedParlayToBuild?.name}
      </DialogTitle>
      <DialogContent>
        {selectedParlayToBuild && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Parlay Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Sport</Typography>
                  <Typography variant="body2">{selectedParlayToBuild.sport}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Total Odds</Typography>
                  <Typography variant="body2" fontWeight="bold">{selectedParlayToBuild.totalOdds}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <Typography variant="body2" color={getConfidenceColor(selectedParlayToBuild.confidence)}>
                    {selectedParlayToBuild.confidence}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Potential Win</Typography>
                  <Typography variant="body2" color="success.main">{selectedParlayToBuild.potentialWin}</Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Parlay Legs ({selectedParlayToBuild.legs?.length || 0})
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sport</TableCell>
                    <TableCell>Pick</TableCell>
                    <TableCell>Odds</TableCell>
                    <TableCell>Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedParlayToBuild.legs?.map((leg: any, index: number) => (
                    <TableRow key={leg.id || index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getSportIcon(leg.sport)}
                          <Typography variant="caption">{leg.sport}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{leg.pick}</TableCell>
                      <TableCell>
                        <Chip 
                          label={leg.odds}
                          size="small"
                          sx={{ 
                            bgcolor: leg.odds.startsWith('+') ? '#10b98120' : '#ef444420',
                            color: leg.odds.startsWith('+') ? '#10b981' : '#ef4444'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <LinearProgress 
                          variant="determinate" 
                          value={leg.confidence} 
                          sx={{ 
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getConfidenceColor(leg.confidence)
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          {leg.confidence}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {selectedParlayToBuild.analysis && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Analysis
                </Typography>
                <Typography variant="body2">
                  {selectedParlayToBuild.analysis}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowBuildModal(false)}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            alert('Parlay added to your bet slip!');
            setShowBuildModal(false);
          }}
        >
          Add to Bet Slip
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading parlay suggestions...</Typography>
      </Box>
    </Container>
  );

  if (error) return (
    <Container>
      <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
        <AlertTitle>Error Loading Parlay Suggestions</AlertTitle>
        {error}
      </Alert>
    </Container>
  );

  const displaySuggestions = suggestions && suggestions.length > 0 ? suggestions : MOCK_PARLAY_SUGGESTIONS;

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: 3,
        mb: 4,
        mt: 2,
        p: 3,
        color: 'white'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              startIcon={<AnalyticsIcon />}
              onClick={() => setShowAnalyticsModal(true)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              variant="outlined"
              size="small"
            >
              Analytics
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <MergeIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Parlay Architect ({displaySuggestions.length} suggestions)
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              AI-powered parlay suggestions with risk management
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Total Suggestions</Typography>
              <Typography variant="h5" fontWeight="bold">{displaySuggestions.length}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Avg Confidence</Typography>
              <Typography variant="h5" fontWeight="bold" color="#10b981">
                {Math.round(displaySuggestions.reduce((acc: number, s: any) => acc + (s.confidence || 0), 0) / displaySuggestions.length)}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Avg Legs</Typography>
              <Typography variant="h5" fontWeight="bold">
                {displaySuggestions[0]?.legs?.length || 3}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="caption" color="text.secondary">Best Value</Typography>
              <Typography variant="h5" fontWeight="bold" color="#f59e0b">
                +{Math.floor(Math.random() * 500) + 300}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Parlay Suggestions */}
      <Grid container spacing={3}>
        {displaySuggestions.map((parlay: any) => (
          <Grid item xs={12} md={6} key={parlay.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">{parlay.name}</Typography>
                  <Chip 
                    label={`${parlay.confidence}%`}
                    color={parlay.confidence >= 80 ? 'success' : parlay.confidence >= 70 ? 'warning' : 'error'}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip 
                    icon={getSportIcon(parlay.sport)}
                    label={parlay.sport}
                    size="small"
                    sx={{ 
                      bgcolor: alpha(getSportColor(parlay.sport), 0.1),
                      color: getSportColor(parlay.sport)
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {parlay.legs?.length || 0} legs
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CashIcon fontSize="small" />
                    <Typography>Odds: {parlay.totalOdds}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon fontSize="small" />
                    <Typography>Win: {parlay.potentialWin}</Typography>
                  </Box>
                </Box>
                
                {parlay.analysis && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {parlay.analysis}
                  </Typography>
                )}
                
                {/* Legs Preview */}
                {parlay.legs && parlay.legs.length > 0 && (
                  <Paper sx={{ p: 1, mb: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" fontWeight="bold" gutterBottom>
                      Legs Preview:
                    </Typography>
                    {parlay.legs.slice(0, 2).map((leg: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {leg.sport}:
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {leg.pick}
                        </Typography>
                        <Chip 
                          label={leg.odds}
                          size="small"
                          sx={{ 
                            height: 18,
                            fontSize: '0.6rem',
                            bgcolor: leg.odds.startsWith('+') ? '#10b98120' : '#ef444420',
                            color: leg.odds.startsWith('+') ? '#10b981' : '#ef4444'
                          }}
                        />
                      </Box>
                    ))}
                    {parlay.legs.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{parlay.legs.length - 2} more legs
                      </Typography>
                    )}
                  </Paper>
                )}
                
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<BuildIcon />}
                  onClick={() => handleBuildParlay(parlay)}
                  sx={{ 
                    bgcolor: '#f59e0b',
                    '&:hover': { bgcolor: '#d97706' }
                  }}
                >
                  Build This Parlay
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {displaySuggestions.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MergeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No parlay suggestions available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for new parlay suggestions
          </Typography>
        </Paper>
      )}

      {/* Footer Tips */}
      <Card sx={{ mt: 4, mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            💡 Smart Parlay Building Tips
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Optimal Leg Count</Typography>
                  <Typography variant="body2" color="text.secondary">
                    2-3 legs have the highest success rate for parlay bets
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Multi-Sport Advantage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Combine different sports to eliminate correlation risk
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Risk Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mix high-probability picks with value bets for optimal EV
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <AnalyticsDashboard />
      <BuildParlayModal />
    </Container>
  );
};

export default ParlayArchitectScreen;
