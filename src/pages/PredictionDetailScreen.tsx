import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Alert,
  IconButton,
  LinearProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SportsIcon from '@mui/icons-material/Sports';
import { format } from 'date-fns';
import { usePredictions } from '../context/PredictionsContext';
import { useParlay, BetSlipLeg } from '../context/ParlayContext';

// ------------------------------------------------------------
// Styled Components
// ------------------------------------------------------------
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const OddsButton = styled(Button)(({ theme }) => ({
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontWeight: 600,
}));

const ConfidenceChip = styled(Chip)(({ theme, confidence }: { confidence?: number }) => {
  let color = theme.palette.grey[500];
  if (confidence && confidence >= 80) color = theme.palette.success.main;
  else if (confidence && confidence >= 60) color = theme.palette.info.main;
  else if (confidence && confidence >= 40) color = theme.palette.warning.main;
  else color = theme.palette.error.main;
  return {
    backgroundColor: color,
    color: '#fff',
    fontWeight: 'bold',
  };
});

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
const PredictionDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPredictionById, isLoading, error } = usePredictions();
  const { addLeg, currentSlip } = useParlay();
  const [shareTooltip, setShareTooltip] = useState('Copy link');

  const prediction = id ? getPredictionById(id) : undefined;

  // Handle share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareTooltip('Copied!');
    setTimeout(() => setShareTooltip('Copy link'), 2000);
  };

  // Add to bet slip
  const handleAddToSlip = (side: 'yes' | 'no') => {
    if (!prediction) return;

    const leg: BetSlipLeg = {
      id: `${prediction.id}-${side}-${Date.now()}`,
      description: `${prediction.question} - ${side.toUpperCase()}`,
      odds: side === 'yes' ? prediction.yesPrice.toString() : prediction.noPrice.toString(),
      confidence: prediction.confidence,
      sport: prediction.sport || prediction.category,
      market: prediction.marketType || 'binary',
      player_name: prediction.player,
      line: prediction.yesPrice,
      value_side: side,
    };
    addLeg(leg);
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width="60%" height={60} />
          <Skeleton variant="text" width="30%" height={30} />
        </Box>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error or not found
  if (error || !prediction) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/predictions')}>
              Back to Markets
            </Button>
          }
        >
          {error ? `Error loading prediction: ${error.message}` : 'Prediction not found'}
        </Alert>
      </Container>
    );
  }

  // Helper: format odds with + sign for positive
  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // Helper: implied probability
  const impliedProbability = (americanOdds: number): number => {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    }
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  };

  const yesProb = impliedProbability(prediction.yesPrice);
  const noProb = impliedProbability(prediction.noPrice);
  const totalProb = yesProb + noProb;
  // Normalize to remove overround
  const yesNorm = (yesProb / totalProb * 100).toFixed(1);
  const noNorm = (noProb / totalProb * 100).toFixed(1);

  // Determine confidence level color
  const confidenceColor = 
    prediction.confidence >= 80 ? 'success' :
    prediction.confidence >= 60 ? 'info' :
    prediction.confidence >= 40 ? 'warning' : 'error';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with back button and share */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {prediction.platform === 'kalshi' ? '📈' : '🎲'} Prediction Market
        </Typography>
        <Tooltip title={shareTooltip}>
          <IconButton onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={4}>
        {/* Main content */}
        <Grid item xs={12} md={8}>
          <StyledCard>
            <CardContent sx={{ p: 4 }}>
              {/* Question */}
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {prediction.question}
              </Typography>

              {/* Category & Sport chips */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  label={prediction.category}
                  color="primary"
                  size="small"
                  icon={prediction.category === 'Sports' ? <SportsIcon /> : undefined}
                />
                {prediction.sport && (
                  <Chip label={prediction.sport} variant="outlined" size="small" />
                )}
                {prediction.player && (
                  <Chip label={prediction.player} variant="outlined" size="small" />
                )}
                {prediction.team && (
                  <Chip label={prediction.team} variant="outlined" size="small" />
                )}
                <ConfidenceChip
                  label={`${prediction.confidence}% Confidence`}
                  confidence={prediction.confidence}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Market odds display */}
              <Typography variant="h6" gutterBottom>
                Market Odds
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      YES
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {formatOdds(prediction.yesPrice)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Implied: {yesNorm}%
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleAddToSlip('yes')}
                    >
                      Bet YES
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      NO
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {formatOdds(prediction.noPrice)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Implied: {noNorm}%
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => handleAddToSlip('no')}
                    >
                      Bet NO
                    </Button>
                  </Paper>
                </Grid>
              </Grid>

              {/* Analysis */}
              {prediction.analysis && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Analysis
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                    {prediction.analysis}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              {/* Additional details */}
              <Typography variant="h6" gutterBottom>
                Market Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Platform
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {prediction.platform === 'kalshi' ? 'Kalshi' : 'Custom'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Market Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {prediction.marketType === 'binary' ? 'Binary' : 'Multiple'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {prediction.expires ? format(new Date(prediction.expires), 'MMM d, yyyy') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Volume
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {prediction.volume}
                  </Typography>
                </Grid>
              </Grid>

              {/* Edge if present */}
              {prediction.edge && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Market Edge
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color={prediction.edge.startsWith('+') ? 'success.main' : 'error.main'}>
                    {prediction.edge}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1 }} /> Your Bet Slip
              </Typography>
              {!currentSlip || currentSlip.legs.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Your bet slip is empty. Click YES or NO to add this market.
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {currentSlip.legs.length} leg{currentSlip.legs.length !== 1 && 's'}
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    {currentSlip.legs.slice(0, 3).map((leg) => (
                      <Box key={leg.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                          {leg.description}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {leg.odds}
                        </Typography>
                      </Box>
                    ))}
                    {currentSlip.legs.length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        +{currentSlip.legs.length - 3} more
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Total Odds</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {currentSlip.totalOdds}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Stake</Typography>
                    <Typography variant="body1">${currentSlip.totalStake.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" fontWeight="bold">Payout</Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ${currentSlip.potentialPayout.toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/bet-slip')}
                  >
                    View Full Slip
                  </Button>
                </>
              )}

              {/* Similar predictions could go here */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" gutterBottom>
                Market Confidence
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={prediction.confidence}
                    color={confidenceColor}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {prediction.confidence}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Confidence score based on projection models and historical accuracy.
              </Typography>

              {/* Data source badge */}
              <Box sx={{ mt: 3 }}>
                <Chip
                  label={prediction.is_real_data ? 'Live Data' : 'Simulated Data'}
                  color={prediction.is_real_data ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PredictionDetailScreen;
