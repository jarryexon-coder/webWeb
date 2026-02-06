// src/pages/PredictionsOutcomeScreen.tsx
import React, { useState } from 'react';
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
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  AttachMoney as MoneyIcon,
  Update as UpdateIcon,
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format } from 'date-fns';

// Import scraper hook
import { usePredictionOutcomes } from '../hooks/useSportsQueries';

// Mock data for fallback (updated to match scraper format)
const MOCK_PREDICTIONS_HISTORY = Array.from({ length: 8 }, (_, i) => {
  const types = ['Game Outcome', 'Player Prop', 'Team Total', 'Over/Under'];
  const leagues = ['NBA', 'NFL', 'MLB'];
  const outcomes = ['correct', 'incorrect', 'pending'];
  const randomType = types[i % types.length];
  const randomLeague = leagues[i % leagues.length].toLowerCase();
  const randomOutcome = outcomes[i % outcomes.length];
  
  return {
    id: `prediction-${i + 1}`,
    type: randomType,
    league: randomLeague,
    sport: randomLeague,
    game: `${randomLeague.toUpperCase()} Game ${i + 1}`,
    prediction: `Team A ${i % 2 === 0 ? 'wins' : 'covers'} by ${Math.floor(Math.random() * 10) + 1} points`,
    confidence_pre_game: Math.floor(Math.random() * 30) + 70,
    confidence: Math.floor(Math.random() * 30) + 70,
    odds: i % 3 === 0 ? '-150' : i % 3 === 1 ? '+120' : '-110',
    outcome: randomOutcome,
    actual_result: randomOutcome === 'correct' ? 'Win' : randomOutcome === 'incorrect' ? 'Loss' : 'Pending',
    result: randomOutcome === 'correct' ? 'Correct' : randomOutcome === 'incorrect' ? 'Incorrect' : 'Pending',
    units: randomOutcome === 'correct' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : 
            randomOutcome === 'incorrect' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0',
    accuracy: Math.floor(Math.random() * 30) + 70,
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    scraped_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    analysis: `${randomLeague.toUpperCase()} analysis based on statistical models and historical data`,
    modelAccuracy: `${Math.floor(Math.random() * 20) + 75}%`,
    key_factors: [
      'Statistical trends',
      'Player injuries',
      'Weather conditions'
    ],
    ai_analysis: 'AI analysis indicates favorable conditions for this prediction',
    source: 'espn'
  };
});

const leagueData = [
  { id: 'all', name: 'All Leagues', icon: <AnalyticsIcon />, color: '#059669' },
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'nfl', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' }
];

const PredictionsOutcomeScreen = () => {
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState('nba');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  // Use scraper hook
  const {
    data: outcomesData,
    isLoading,
    error,
    refetch,
    isRefetching
  } = usePredictionOutcomes(selectedSport);

  const outcomes = outcomesData?.outcomes || MOCK_PREDICTIONS_HISTORY;

  // Filter outcomes
  const filteredByOutcome = filterOutcome === 'all'
    ? outcomes
    : outcomes.filter((item: any) => item.outcome === filterOutcome);

  // Filter by search
  const filteredOutcomes = searchQuery
    ? filteredByOutcome.filter((item: any) =>
        item.game?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.prediction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByOutcome;

  // Calculate stats
  const totalPredictions = filteredOutcomes.length;
  const correctPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'correct').length;
  const incorrectPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'incorrect').length;
  const pendingPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'pending').length;
  
  const winRate = correctPredictions + incorrectPredictions > 0 
    ? Math.round((correctPredictions / (correctPredictions + incorrectPredictions)) * 100)
    : 0;
  
  const avgConfidence = filteredOutcomes.length > 0
    ? Math.round(filteredOutcomes.reduce((acc: number, item: any) => acc + (item.confidence_pre_game || item.confidence || 70), 0) / filteredOutcomes.length)
    : 0;

  const handleRefresh = () => {
    refetch();
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'nba': return <BasketballIcon />;
      case 'nfl': return <FootballIcon />;
      case 'mlb': return <BaseballIcon />;
      default: return <BasketballIcon />;
    }
  };

  const getLeagueColor = (league: string) => {
    const leagueObj = leagueData.find(l => l.id === league);
    return leagueObj ? leagueObj.color : '#64748b';
  };

  const getOutcomeColor = (outcome: string) => {
    switch(outcome) {
      case 'correct': return '#10b981';
      case 'incorrect': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch(outcome) {
      case 'correct': return '✓';
      case 'incorrect': return '✗';
      case 'pending': return '⏱';
      default: return '?';
    }
  };

  const AnalyticsDashboard = () => {
    const totalUnits = filteredOutcomes.reduce((sum: number, pred: any) => {
      if (pred.outcome === 'correct') {
        return sum + (parseFloat(pred.units?.replace('+', '') || '0') || 1.0);
      } else if (pred.outcome === 'incorrect') {
        return sum - (parseFloat(pred.units?.replace('-', '') || '0') || 1.0);
      }
      return sum;
    }, 0);
    
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
                          {correctPredictions}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Correct
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
                          {incorrectPredictions}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Incorrect
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
                          {pendingPredictions}
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
                {filteredOutcomes.slice(0, 5).map((prediction: any, index: number) => (
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
                      primary={prediction.game || prediction.title || 'Prediction'}
                      secondary={`${prediction.sport?.toUpperCase() || 'NBA'} • ${prediction.timestamp ? format(new Date(prediction.timestamp), 'MMM d') : 'Unknown date'}`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption" fontWeight="bold" color={getOutcomeColor(prediction.outcome)}>
                        {prediction.units || '0'}
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

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>
            {outcomesData?.scraped === false ? 'Loading historical data...' : 'Scraping latest outcomes...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Prediction Outcomes</AlertTitle>
          {error instanceof Error ? error.message : 'Failed to load prediction outcomes'}
          <Button onClick={handleRefresh} sx={{ mt: 1 }}>Retry</Button>
        </Alert>
      </Container>
    );
  }

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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<BarChartIcon />}
              onClick={() => setShowAnalyticsModal(true)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              variant="outlined"
            >
              Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<UpdateIcon />}
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              {isRefetching ? 'Scraping...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <AssessmentIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Prediction Outcomes ({filteredOutcomes.length} predictions)
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Track prediction accuracy with scraped results
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Status Alert */}
      {outcomesData && (
        <Alert 
          severity={outcomesData.scraped ? "success" : "info"}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            {outcomesData.scraped 
              ? `✅ Live outcomes scraped for ${selectedSport.toUpperCase()}`
              : '⚠️ Using historical data (live scraping unavailable)'}
            {outcomesData.timestamp && ` • Updated ${format(new Date(outcomesData.timestamp), 'PPpp')}`}
          </Typography>
        </Alert>
      )}

      {/* Progress for Refetching */}
      {isRefetching && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Updating outcomes...
          </Typography>
        </Box>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                label="Sport"
                onChange={(e) => setSelectedSport(e.target.value)}
                startAdornment={getSportIcon(selectedSport)}
              >
                {leagueData.filter(l => l.id !== 'all').map((league) => (
                  <MenuItem key={league.id} value={league.id}>
                    {league.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter Outcome</InputLabel>
              <Select
                value={filterOutcome}
                label="Filter Outcome"
                onChange={(e) => setFilterOutcome(e.target.value as any)}
              >
                <MenuItem value="all">All Outcomes</MenuItem>
                <MenuItem value="correct">Correct Only</MenuItem>
                <MenuItem value="incorrect">Incorrect Only</MenuItem>
                <MenuItem value="pending">Pending Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{ width: '100%', justifyContent: 'center' }}
            >
              <ToggleButton value="table">
                <FilterListIcon />
              </ToggleButton>
              <ToggleButton value="cards">
                <BarChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                {totalPredictions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Predictions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="#10b981" gutterBottom>
                {correctPredictions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Correct
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="#ef4444" gutterBottom>
                {incorrectPredictions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Incorrect
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color={winRate >= 60 ? '#10b981' : '#f59e0b'} gutterBottom>
                {winRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Win Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content */}
      {viewMode === 'table' ? (
        /* Table View */
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Game</strong></TableCell>
                <TableCell><strong>Prediction</strong></TableCell>
                <TableCell><strong>Result</strong></TableCell>
                <TableCell><strong>Accuracy</strong></TableCell>
                <TableCell><strong>Confidence</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Details</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOutcomes.map((outcome: any) => (
                <TableRow key={outcome.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {outcome.game || outcome.title || 'Unknown Game'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {outcome.prediction}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={outcome.outcome === 'correct' ? <CheckCircleIcon /> : 
                              outcome.outcome === 'incorrect' ? <CancelIcon /> : <TrendingUpIcon />}
                        label={outcome.outcome === 'correct' ? 'Correct' : 
                               outcome.outcome === 'incorrect' ? 'Incorrect' : 'Pending'}
                        color={outcome.outcome === 'correct' ? 'success' : 
                               outcome.outcome === 'incorrect' ? 'error' : 'warning'}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {outcome.actual_result || outcome.result || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {outcome.accuracy || 'N/A'}%
                      </Typography>
                      {outcome.accuracy && (
                        <Box
                          sx={{
                            width: 60,
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${outcome.accuracy}%`,
                              height: '100%',
                              backgroundColor: outcome.accuracy >= 70 ? '#4caf50' :
                                             outcome.accuracy >= 50 ? '#ff9800' : '#f44336'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${outcome.confidence_pre_game || outcome.confidence || 70}%`}
                      size="small"
                      variant="outlined"
                      color={outcome.confidence_pre_game >= 80 ? 'success' : 
                             outcome.confidence_pre_game >= 60 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    {outcome.timestamp && format(new Date(outcome.timestamp), 'MMM d')}
                  </TableCell>
                  <TableCell>
                    {outcome.key_factors && outcome.key_factors.length > 0 && (
                      <Tooltip title={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">Key Factors:</Typography>
                          {outcome.key_factors.map((factor: string, i: number) => (
                            <Typography key={i} variant="body2">• {factor}</Typography>
                          ))}
                        </Box>
                      }>
                        <IconButton size="small">
                          <ExpandMoreIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* Card View */
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredOutcomes.map((outcome: any) => {
            const leagueColor = getLeagueColor(outcome.sport || outcome.league || 'nba');
            const outcomeColor = getOutcomeColor(outcome.outcome);
            
            return (
              <Grid item xs={12} md={6} key={outcome.id}>
                <Card>
                  <CardContent>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {outcome.game || outcome.title || 'Prediction'}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={outcome.type || 'Game Outcome'}
                            size="small"
                            sx={{ 
                              bgcolor: alpha('#8b5cf6', 0.1),
                              color: '#8b5cf6'
                            }}
                          />
                          <Chip
                            label={(outcome.sport || outcome.league || 'nba').toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(leagueColor, 0.1),
                              color: leagueColor
                            }}
                          />
                        </Box>
                      </Box>
                      <Chip
                        label={outcome.outcome?.toUpperCase() || 'PENDING'}
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
                      {outcome.prediction}
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
                            value={outcome.confidence_pre_game || outcome.confidence || 70} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              mt: 0.5,
                              bgcolor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: outcome.confidence_pre_game >= 80 ? '#10b981' : 
                                        outcome.confidence_pre_game >= 70 ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {outcome.confidence_pre_game || outcome.confidence || 70}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Accuracy
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {outcome.accuracy || 'N/A'}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Result
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color={outcomeColor}>
                            {outcome.actual_result || outcome.result || 'Pending'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Key Factors */}
                    {outcome.key_factors && outcome.key_factors.length > 0 && (
                      <Accordion sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">Key Factors</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {outcome.key_factors.map((factor: string, i: number) => (
                              <li key={i}>
                                <Typography variant="body2">{factor}</Typography>
                              </li>
                            ))}
                          </ul>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {/* Analysis */}
                    {outcome.ai_analysis && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">AI Analysis</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" color="text.secondary">
                            {outcome.ai_analysis}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    )}
                    
                    {/* Footer */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {outcome.timestamp ? format(new Date(outcome.timestamp), 'PPpp') : 'Unknown date'}
                        {outcome.source && ` • Source: ${outcome.source}`}
                      </Typography>
                      <Chip
                        icon={<SparklesIcon />}
                        label={`Model: ${outcome.modelAccuracy || '75%'}`}
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

      {/* Empty State */}
      {!isLoading && !error && filteredOutcomes.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          {searchQuery || filterOutcome !== 'all' ? (
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
                No predictions available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try refreshing or selecting a different sport
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* Tips Section */}
      {filteredOutcomes.length > 0 && (
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
                      Monitor win rates and accuracy across different sports and prediction types
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
                      Analyze which sports and prediction types perform best for you
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
                      Use historical data to refine your prediction strategy based on accuracy trends
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
