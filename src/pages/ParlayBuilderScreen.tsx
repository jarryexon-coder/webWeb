import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Chip,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { parlayCalculators } from '../utils/parlayCalculators';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface ParlayLeg {
  id: number;
  description: string;
  odds: number;
  type: string;
}

interface CorrelatedParlayData {
  legs: string[];
}

interface LocationState {
  correlatedParlay?: CorrelatedParlayData;
  fromAnalytics?: boolean;
}

// ----------------------------------------------------------------------
// Helper: American odds to decimal and vice versa (inline if needed)
// ----------------------------------------------------------------------
const americanToDecimal = (odds: number): number => {
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
};

const decimalToAmerican = (decimal: number): number => {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
};

const calculateParlayOdds = (oddsArray: number[]): number => {
  if (oddsArray.length === 0) return 0;
  const decimalOdds = oddsArray.map(americanToDecimal);
  const totalDecimal = decimalOdds.reduce((acc, curr) => acc * curr, 1);
  return decimalToAmerican(totalDecimal);
};

const calculatePayout = (stake: number, odds: number): number => {
  if (odds > 0) return stake + stake * (odds / 100);
  return stake + stake * (100 / Math.abs(odds));
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const ParlayBuilderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [wager, setWager] = useState<string>('10');
  const [parlayType, setParlayType] = useState<string>('standard');

  // Load correlated parlay if provided
  useEffect(() => {
    if (state?.correlatedParlay) {
      const newLegs = state.correlatedParlay.legs.map((desc, index) => ({
        id: Date.now() + index,
        description: desc,
        odds: -110,
        type: 'spread',
      }));
      setLegs(newLegs);
    }
  }, [state]);

  const handleAddLeg = () => {
    // In a real app, this would open a bet selector modal/navigation
    // For now, simulate adding a mock leg
    const mockLeg: ParlayLeg = {
      id: Date.now(),
      description: 'Lakers -4.5',
      odds: -110,
      type: 'spread',
    };
    setLegs([...legs, mockLeg]);
  };

  const handleRemoveLeg = (id: number) => {
    setLegs(legs.filter((leg) => leg.id !== id));
  };

  const handleClearAll = () => {
    setLegs([]);
    setWager('10');
  };

  const handleParlayTypeChange = (event: SelectChangeEvent) => {
    setParlayType(event.target.value);
  };

  const handleWagerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow only numbers and decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWager(value);
    }
  };

  const totalOdds = calculateParlayOdds(legs.map((leg) => leg.odds));
  const stake = parseFloat(wager) || 0;
  const potentialPayout = stake > 0 ? calculatePayout(stake, totalOdds) : 0;

  const isPlaceDisabled = legs.length < 2;

  // Analytics insight (from correlated parlay)
  const renderAnalyticsInsight = () => {
    if (!state?.fromAnalytics || legs.length === 0) return null;

    const optimalLegs = parlayCalculators?.calculateOptimalLegCount?.(parlayType, 'nba') ?? 3;
    const isOptimal = legs.length === optimalLegs;

    return (
      <Alert
        severity={isOptimal ? 'success' : 'warning'}
        icon={isOptimal ? <CheckCircleIcon /> : <WarningIcon />}
        sx={{ mb: 3 }}
      >
        <Typography variant="subtitle2">
          {isOptimal ? 'Optimal Parlay Size' : 'Suboptimal Leg Count'}
        </Typography>
        <Typography variant="body2">
          {isOptimal
            ? `${legs.length} legs is the optimal size for ${parlayType} parlays`
            : `Recommended legs for ${parlayType}: ${optimalLegs}`}
        </Typography>
      </Alert>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Build Parlay
          </Typography>
        </Box>
        <Button
          variant="text"
          color="error"
          onClick={handleClearAll}
          disabled={legs.length === 0 && wager === '10'}
        >
          Clear
        </Button>
      </Box>

      {/* Parlay Type Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="parlay-type-label">Parlay Type</InputLabel>
          <Select
            labelId="parlay-type-label"
            value={parlayType}
            label="Parlay Type"
            onChange={handleParlayTypeChange}
          >
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="same_game">Same Game</MenuItem>
            <MenuItem value="teaser">Teaser</MenuItem>
            <MenuItem value="pleaser">Pleaser</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Analytics Insight (if any) */}
      {renderAnalyticsInsight()}

      {/* Legs Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Parlay Legs ({legs.length})</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddLeg}
            size="small"
          >
            Add Bet
          </Button>
        </Box>

        {legs.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary" variant="body1" gutterBottom>
              No legs added
            </Typography>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Add bets to build your parlay
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddLeg}
              sx={{ mt: 2 }}
            >
              Add First Leg
            </Button>
          </Box>
        ) : (
          <Box>
            {legs.map((leg) => (
              <Card
                key={leg.id}
                variant="outlined"
                sx={{ mb: 1, '&:last-child': { mb: 0 } }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {leg.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {leg.type} • {leg.odds > 0 ? '+' : ''}{leg.odds}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveLeg(leg.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Bet Slip (Wager & Payout) */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Wager Amount
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ mr: 1 }}>
              $
            </Typography>
            <TextField
              value={wager}
              onChange={handleWagerChange}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Total Odds
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {totalOdds > 0 ? '+' : ''}{totalOdds}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="body2" color="text.secondary">
            Potential Payout
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            ${potentialPayout.toFixed(2)}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isPlaceDisabled}
          sx={{ mt: 1 }}
        >
          Place Parlay
        </Button>

        {legs.length > 0 && legs.length < 2 && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            Minimum 2 legs required
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ParlayBuilderScreen;
