// src/pages/PredictionsOutcomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Paper,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Modal,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  EmojiEvents as TrophyIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Lightbulb as LightbulbIcon,
  BarChart as BarChartIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// At the top of the file, add:
import { usePredictionsHistory } from '../hooks/useSportsData';

// Mock data for fallback
const MOCK_PREDICTIONS_HISTORY = Array.from({ length: 8 }, (_, i) => {
  const types = ['Game Outcome', 'Player Prop', 'Team Total', 'Over/Under'];
  const leagues = ['NBA', 'NFL', 'MLB', 'NHL'];
  const outcomes = ['win', 'loss', 'pending'];
  const randomType = types[i % types.length];
  const randomLeague = leagues[i % leagues.length];
  const randomOutcome = outcomes[i % outcomes.length];
  
  return {
    id: `prediction-${i + 1}`,
    type: randomType,
    league: randomLeague,
    title: `${randomType} Prediction ${i + 1}`,
    prediction: `Team A ${i % 2 === 0 ? 'wins' : 'covers'} by ${Math.floor(Math.random() * 10) + 1} points`,
    confidence: Math.floor(Math.random() * 30) + 70,
    odds: i % 3 === 0 ? '-150' : i % 3 === 1 ? '+120' : '-110',
    outcome: randomOutcome,
    result: randomOutcome === 'win' ? 'Correct' : randomOutcome === 'loss' ? 'Incorrect' : 'Pending',
    units: randomOutcome === 'win' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : 
            randomOutcome === 'loss' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0',
    timestamp: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Dec 2024`,
    analysis: `${randomLeague} analysis based on statistical models and historical data`,
    modelAccuracy: `${Math.floor(Math.random() * 20) + 75}%`
  };
});

const leagueData = [
  { id: 'All', name: 'All Leagues', icon: <AnalyticsIcon />, color: '#059669' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' }
];

// Inside your component, replace fetch logic with:
const PredictionsOutcomeScreen = () => {
  const navigate = useNavigate();
  
  const { data: history, loading, error } = usePredictionsHistory();
  
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const displayHistory = history && history.length > 0 ? history : MOCK_PREDICTIONS_HISTORY;

  useEffect(() => {
    let filtered = [...displayHistory];
    
    // Filter by league
    if (selectedLeague !== 'All') {
      filtered = filtered.filter(pred => pred.league === selectedLeague);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pred => 
        pred.title.toLowerCase().includes(query) ||
        pred.prediction.toLowerCase().includes(query) ||
        pred.type.toLowerCase().includes(query)
      );
    }
    
    setFilteredHistory(filtered);
  }, [selectedLeague, searchQuery, displayHistory]);

  const getLeagueColor = (league: string) => {
    const leagueObj = leagueData.find(l => l.id === league);
    return leagueObj ? leagueObj.color : '#64748b';
  };

  const getOutcomeColor = (outcome: string) => {
    switch(outcome) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch(outcome) {
      case 'win': return '✓';
      case 'loss': return '✗';
      case 'pending': return '⏱';
      default: return '?';
    }
  };

  const AnalyticsDashboard = () => {
    const totalPredictions = displayHistory.length;
    const wins = displayHistory.filter(p => p.outcome === 'win').length;
    const losses = displayHistory.filter(p => p.outcome === 'loss').length;
    const pending = displayHistory.filter(p => p.outcome === 'pending').length;
    const winRate = totalPredictions > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';
    
    const totalUnits = displayHistory.reduce((sum, pred) => {
      if (pred.outcome === 'win') {
        return sum + parseFloat(pred.units.replace('+', ''));
      } else if (pred.outcome === 'loss') {
        return sum - parseFloat(pred.units.replace('-', ''));
      }
      return sum;
    }, 0);
    
    const avgConfidence = displayHistory.length > 0 
      ? (displayHistory.reduce((sum, pred) => sum + pred.confidence, 0) / displayHistory.length).toFixed(1)
      : '0';

    return (
      <Modal
        open={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        closeAfterTransition
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2 
        }}
      >
        <Fade in={showAnalyticsModal}>
          <Paper sx={{ 
            width: { xs: '95%', md: 500 },
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}>
            <CardContent>
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrophyIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    Prediction Analytics
                  </Typography>
                </Box>
                <IconButton onClick={() => setShowAnalyticsModal(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Stats Grid */}
              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Total Predictions', value: totalPredictions, color: '#059669' },
                  { label: 'Win Rate', value: `${winRate}%`, color: '#10b981' },
                  { label: 'Avg Confidence', value: `${avgConfidence}%`, color: '#3b82f6' },
                  { label: 'Total Units', value: totalUnits > 0 ? `+${totalUnits.toFixed(1)}` : totalUnits.toFixed(1), color: totalUnits >= 0 ? '#10b981' : '#ef4444' }
                ].map((stat, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: alpha(stat.color, 0.1), borderRadius: 2 }}>
                      <Typography variant="h4" fontWeight="bold" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Outcome Breakdown */}
              <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="medium" mb={2}>
                    Outcome Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {wins}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Wins
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#ef4444', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {losses}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Losses
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#f59e0b', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {pending}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Pending
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Recent Predictions */}
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Recent Predictions
              </Typography>
              
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {displayHistory.slice(0, 5).map((prediction, index) => (
                  <ListItem key={index} sx={{ 
                    mb: 1, 
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: getOutcomeColor(prediction.outcome),
                        width: 32,
                        height: 32
                      }}>
                        {getOutcomeIcon(prediction.outcome)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={prediction.title}
                      secondary={`${prediction.league} • ${prediction.timestamp}`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption" fontWeight="bold" color={getOutcomeColor(prediction.outcome)}>
                        {prediction.units}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Paper>
        </Fade>
      </Modal>
    );
  };

  if (loading) return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading prediction history...</Typography>
      </Box>
    </Container>
  );

  if (error) return (
    <Container>
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Error Loading Prediction History</AlertTitle>
        {error}
      </Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
          >
            Back
          </Button>
          <Button
            startIcon={<BarChartIcon />}
            onClick={() => setShowAnalyticsModal(true)}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            variant="outlined"
          >
            Analytics
          </Button>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <AnalyticsIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Prediction Outcomes ({displayHistory.length} predictions)
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Track your prediction history and outcomes
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search predictions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={() => setShowAnalyticsModal(true)}
            >
              View Analytics
            </Button>
          </Grid>
        </Grid>
        
        {/* League Filters */}
        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {leagueData.map((league) => (
            <Chip
              key={league.id}
              icon={league.icon}
              label={league.name}
              onClick={() => setSelectedLeague(league.id)}
              color={selectedLeague === league.id ? 'primary' : 'default'}
              variant={selectedLeague === league.id ? 'filled' : 'outlined'}
              sx={{
                ...(selectedLeague === league.id && {
                  bgcolor: league.color,
                  color: 'white',
                  '&:hover': { bgcolor: league.color }
                })
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Stats Summary */}
      {displayHistory.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" gutterBottom>
                  {displayHistory.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Predictions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="#10b981" gutterBottom>
                  {displayHistory.filter(p => p.outcome === 'win').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wins
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="#ef4444" gutterBottom>
                  {displayHistory.filter(p => p.outcome === 'loss').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Losses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="#f59e0b" gutterBottom>
                  {displayHistory.filter(p => p.outcome === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Prediction History */}
      {filteredHistory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          {searchQuery ? (
            <>
              <Typography variant="h6" gutterBottom>
                No predictions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try a different search or filter
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                No prediction history available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back for new prediction outcomes
              </Typography>
            </>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredHistory.map((prediction) => {
            const leagueColor = getLeagueColor(prediction.league);
            const outcomeColor = getOutcomeColor(prediction.outcome);
            
            return (
              <Grid item xs={12} md={6} key={prediction.id}>
                <Card>
                  <CardContent>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {prediction.title}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={prediction.type}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#8b5cf6', 0.1),
                              color: '#8b5cf6'
                            }}
                          />
                          <Chip
                            label={prediction.league}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(leagueColor, 0.1),
                              color: leagueColor
                            }}
                          />
                        </Box>
                      </Box>
                      <Chip
                        label={prediction.outcome.toUpperCase()}
                        size="small"
                        sx={{ 
                          bgcolor: outcomeColor,
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    {/* Prediction */}
                    <Typography variant="body1" fontWeight="medium" color="primary" mb={2}>
                      {prediction.prediction}
                    </Typography>
                    
                    {/* Stats */}
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Confidence
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={prediction.confidence} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              mt: 0.5,
                              bgcolor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: prediction.confidence >= 80 ? '#10b981' : 
                                        prediction.confidence >= 70 ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {prediction.confidence}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Odds
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {prediction.odds}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Units
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color={prediction.outcome === 'win' ? '#10b981' : '#ef4444'}>
                            {prediction.units}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Analysis */}
                    <Box display="flex" p={2} bgcolor={alpha('#8b5cf6', 0.1)} borderRadius={2} mb={2}>
                      <LightbulbIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {prediction.analysis}
                      </Typography>
                    </Box>
                    
                    {/* Footer */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {prediction.timestamp}
                      </Typography>
                      <Chip
                        icon={<SparklesIcon />}
                        label={`Model: ${prediction.modelAccuracy}`}
                        size="small"
                        sx={{ 
                          bgcolor: alpha('#3b82f6', 0.1),
                          color: '#3b82f6'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Tips Section */}
      {displayHistory.length > 0 && (
        <Card sx={{ mt: 4, mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📈 Prediction Tracking Tips
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Track Performance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monitor win rates and unit profit across different prediction types
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Identify Patterns</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyze which leagues and prediction types perform best for you
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <CheckCircleIcon sx={{ color: '#10b981', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Adjust Strategy</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use historical data to refine your prediction strategy and bankroll management
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <AnalyticsDashboard />
    </Container>
  );
};

export default PredictionsOutcomeScreen;
