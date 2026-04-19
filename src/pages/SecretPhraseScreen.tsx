// src/pages/SecretPhraseScreen.tsx – Updated with fixed credit-based generation

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress,
  Tab,
  Tabs,
  Slider,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as SportsBasketballIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsBaseball as SportsBaseballIcon,
  Info as InfoIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as SparklesIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Lock as LockIcon,
  History as HistoryIcon,
  Whatshot as WhatshotIcon,
  CreditCard as CreditCardIcon,
  Shuffle as ShuffleIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// CONSTANTS
// ============================================
const MAX_VISIBLE_PHRASES = 3;
const MAX_GENERATED_PICKS = 5;
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ============================================
// TYPES
// ============================================

interface SecretPhrase {
  id: string;
  phrase: string;
  category: string;
  sport: string;
  confidence: number;
  source: string;
  player?: string;
  team?: string;
  opponent?: string;
  stat?: string;
  line?: number;
  projection?: number;
  edge?: string;
  edge_percentage?: number;
  odds?: string;
  bookmaker?: string;
  type?: 'Over' | 'Under';
  timestamp: string;
  tags?: string[];
  analysis?: string;
  is_mock?: boolean;
  generated_variation?: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  phrases: SecretPhrase[];
  sources?: string[];
  cache_age?: number;
  cached?: boolean;
  timestamp?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const SecretPhraseScreen: React.FC = () => {
  // Use centralized auth – token is the Firebase ID token
  const { user, token } = useAuth();

  // Core data state
  const [allPhrases, setAllPhrases] = useState<SecretPhrase[]>([]);
  const [displayPhrases, setDisplayPhrases] = useState<SecretPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiSource, setApiSource] = useState<string>('API');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Credits
  const [generatorCredits, setGeneratorCredits] = useState(0);

  // Filters
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedTabCategory, setSelectedTabCategory] = useState('all');
  const [minConfidence, setMinConfidence] = useState(65);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Modals & UI
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning',
  });
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');

  // ============================================
  // Fetch user credits (FIXED: using correct endpoint)
  // ============================================
  const refreshCredits = useCallback(async () => {
    const userId = user?.uid || user?.id;
    
    if (!userId || !token) {
      console.log('❌ No user ID or token available, cannot fetch credits');
      return;
    }
    
    console.log(`🔄 Fetching credits for user: ${userId}`);
    
    try {
      // FIXED: Use the correct endpoint with user_id
      const response = await fetch(`${PYTHON_API_BASE}/api/user/generations/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`📡 Credits API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`💰 Remaining credits: ${data.remaining}`);
        setGeneratorCredits(data.remaining);
      } else {
        console.error('❌ Failed to fetch credits:', response.status);
        setGeneratorCredits(0);
      }
    } catch (error) {
      console.error('❌ Error fetching credits:', error);
      setGeneratorCredits(0);
    }
  }, [user, token]);

  // Fetch credits on mount and when user changes
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // ============================================
  // Helper functions
  // ============================================
  const getTopByConfidence = (phrases: SecretPhrase[], limit: number): SecretPhrase[] => {
    return [...phrases].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, limit);
  };

  const applyFilters = (phrases: SecretPhrase[]): SecretPhrase[] => {
    let filtered = [...phrases];
    filtered = filtered.filter(p => p.sport === selectedSport);
    if (selectedTabCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedTabCategory);
    }
    filtered = filtered.filter(p => (p.confidence || 0) >= minConfidence);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.phrase.toLowerCase().includes(query) ||
        (p.player && p.player.toLowerCase().includes(query))
      );
    }
    return filtered;
  };

  // ============================================
  // Mock data (fallback)
  // ============================================
  const generateMockPhrases = (sport: string): SecretPhrase[] => {
    const now = new Date().toISOString();
    const today = new Date().toLocaleDateString();

    const mockData: SecretPhrase[] = [
      {
        id: `mock-1-${Date.now()}`,
        phrase: `LeBron James over 25.5 points - strong matchup vs Bulls (${today})`,
        category: 'prop_value',
        sport: 'nba',
        confidence: 82,
        source: 'NBA Advanced Stats',
        player: 'LeBron James',
        team: 'Lakers',
        opponent: 'Bulls',
        stat: 'points',
        line: 25.5,
        projection: 27.8,
        edge: '+9%',
        edge_percentage: 9,
        odds: '-110',
        bookmaker: 'DraftKings',
        type: 'Over',
        timestamp: now,
        tags: ['points', 'lebron', 'value'],
        analysis: 'LeBron averages 28.2 vs Bulls in last 5 meetings',
      },
      {
        id: `mock-2-${Date.now()}`,
        phrase: `Stephen Curry over 4.5 three-pointers - hot from deep (${today})`,
        category: 'prop_value',
        sport: 'nba',
        confidence: 78,
        source: 'ESPN Stats',
        player: 'Stephen Curry',
        team: 'Warriors',
        opponent: 'Kings',
        stat: 'three_pointers',
        line: 4.5,
        projection: 5.2,
        edge: '+15%',
        edge_percentage: 15,
        odds: '+120',
        bookmaker: 'FanDuel',
        type: 'Over',
        timestamp: now,
        tags: ['threes', 'curry', 'value'],
        analysis: 'Curry averaging 5.8 3PM at home this season',
      },
      {
        id: `mock-3-${Date.now()}`,
        phrase: `Giannis Antetokounmpo double-double - top pick of the night (${today})`,
        category: 'insider_tip',
        sport: 'nba',
        confidence: 88,
        source: 'Team Insider',
        player: 'Giannis Antetokounmpo',
        team: 'Bucks',
        opponent: 'Heat',
        stat: 'double_double',
        line: 1,
        projection: 0.85,
        edge: '+85%',
        edge_percentage: 85,
        odds: '-250',
        bookmaker: 'BetMGM',
        type: 'Over',
        timestamp: now,
        tags: ['giannis', 'top pick', 'double-double'],
        analysis: 'Giannis has double-double in 12 of last 15 games',
      },
      {
        id: `mock-4-${Date.now()}`,
        phrase: `Jokic triple-double props - sharp money coming in (${today})`,
        category: 'sharp_money',
        sport: 'nba',
        confidence: 85,
        source: 'Action Network',
        player: 'Nikola Jokic',
        team: 'Nuggets',
        opponent: 'Spurs',
        stat: 'triple_double',
        line: 1,
        projection: 0.65,
        edge: '+65%',
        edge_percentage: 65,
        odds: '+180',
        bookmaker: 'Caesars',
        type: 'Over',
        timestamp: now,
        tags: ['jokic', 'sharp', 'triple-double'],
        analysis: '70% of money on Jokic triple-double, only 45% of bets',
      },
      {
        id: `mock-5-${Date.now()}`,
        phrase: `Luka Doncic under 8.5 assists - line movement detected (${today})`,
        category: 'line_move',
        sport: 'nba',
        confidence: 72,
        source: 'Circa Sports',
        player: 'Luka Doncic',
        team: 'Mavericks',
        opponent: 'Thunder',
        stat: 'assists',
        line: 8.5,
        projection: 7.8,
        edge: '-8%',
        edge_percentage: -8,
        odds: '-105',
        bookmaker: 'BetRivers',
        type: 'Under',
        timestamp: now,
        tags: ['doncic', 'line-move', 'assists'],
        analysis: 'Line moved from 8 to 8.5, sharp action on under',
      },
    ];

    if (sport === 'all') return mockData;
    return mockData.filter(p => p.sport === sport);
  };

  // ============================================
  // API fetch
  // ============================================
  const fetchPhrases = useCallback(async (sport: string) => {
    const url = `${PYTHON_API_BASE}/api/secret-phrases?sport=${sport}&category=all&min_confidence=0&_t=${Date.now()}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data: ApiResponse = await response.json();
      const real = data.phrases || [];
      if (real.length > 0) {
        setApiSource(`Real API Data (${data.sources?.join(', ') || 'Unknown'})`);
        return real;
      } else {
        setApiSource('Mock Data');
        return generateMockPhrases(sport);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setApiSource('Mock Data (Fallback)');
      return generateMockPhrases(sport);
    }
  }, []);

  // ============================================
  // Load data
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPhrases(selectedSport);
      setAllPhrases(data);
      const filtered = applyFilters(data);
      const top3 = getTopByConfidence(filtered, MAX_VISIBLE_PHRASES);
      setDisplayPhrases(top3);
      setGeneratedCount(0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [selectedSport, fetchPhrases]);

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update display when filters change
  useEffect(() => {
    if (allPhrases.length > 0) {
      const filtered = applyFilters(allPhrases);
      const top3 = getTopByConfidence(filtered, MAX_VISIBLE_PHRASES);
      setDisplayPhrases(top3);
      setGeneratedCount(0);
    }
  }, [selectedTabCategory, minConfidence, searchQuery, allPhrases]);

  // ============================================
  // Handlers
  // ============================================
  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    setSelectedTabCategory('all');
    setSearchQuery('');
    setSearchInput('');
    loadData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await refreshCredits(); // Also refresh credits
    setRefreshing(false);
  };

  // ===== FIXED: CREDIT-BASED GENERATION with correct endpoint =====
  const handleGenerateMore = async () => {
    // First refresh credits to ensure we have latest
    await refreshCredits();
    
    // Check credits
    if (generatorCredits <= 0) {
      setShowCreditsModal(true);
      return;
    }

    setGenerating(true);
    try {
      const userId = user?.uid || user?.id;
      
      if (!userId || !token) {
        throw new Error('User not logged in');
      }

      // FIXED: Use the correct decrement endpoint with user_id
      const useResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          pickType: 'secret_phrase',
          pickData: { 
            sport: selectedSport,
            category: selectedTabCategory,
            minConfidence: minConfidence
          },
        }),
      });

      if (!useResponse.ok) {
        const errorData = await useResponse.json();
        throw new Error(errorData.error || 'Failed to use credit');
      }

      const data = await useResponse.json();
      console.log(`✅ Credit used successfully! Remaining: ${data.remaining}`);
      
      // Update local credit count
      setGeneratorCredits(data.remaining);

      // Now generate picks
      const filtered = applyFilters(allPhrases);
      const existingIds = new Set(displayPhrases.map(p => p.id));
      const available = filtered.filter(p => !existingIds.has(p.id));

      if (available.length === 0) {
        setSnackbar({ open: true, message: 'No new picks available', severity: 'warning' });
        setGenerating(false);
        return;
      }

      const newPicks = getTopByConfidence(available, MAX_GENERATED_PICKS);
      const newVariation = generatedCount + 1;
      const picksWithVariation = newPicks.map(p => ({ ...p, generated_variation: newVariation }));

      setDisplayPhrases(prev => [...prev, ...picksWithVariation]);
      setGeneratedCount(newVariation);

      setSnackbar({
        open: true,
        message: `Generated ${newPicks.length} new picks! (1 credit used)`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Generation error:', err);
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to generate picks', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleResetToTop = () => {
    const filtered = applyFilters(allPhrases);
    const top3 = getTopByConfidence(filtered, MAX_VISIBLE_PHRASES);
    setDisplayPhrases(top3);
    setGeneratedCount(0);
    setSnackbar({ open: true, message: 'Reset to top 3 picks', severity: 'info' });
  };

  // ===== CREDITS CHECKOUT (same as DailyPicks) =====
  const handleCreditsCheckout = async (credits: number) => {
    if (!user || !token) {
      setSnackbar({ open: true, message: 'Please log in first', severity: 'error' });
      return;
    }
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/generator/credits/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Credits checkout error:', error);
      setSnackbar({ open: true, message: 'Failed to start checkout', severity: 'error' });
    }
  };

  // ============================================
  // Formatting
  // ============================================
  const formatStatDisplay = (stat?: string, type?: string, line?: number): string => {
    if (!stat) return '';
    let formatted = stat.charAt(0).toUpperCase() + stat.slice(1);
    if (type && line) {
      return `${formatted} ${type} ${Math.round(line * 10) / 10}`;
    }
    return formatted;
  };

  // ============================================
  // Render helpers
  // ============================================
  const renderPhraseCard = (phrase: SecretPhrase) => {
    const borderColor =
      phrase.confidence >= 80 ? '#22c55e' : phrase.confidence >= 70 ? '#eab308' : '#94a3b8';
    const confidenceColor =
      phrase.confidence >= 80 ? 'success' : phrase.confidence >= 70 ? 'warning' : 'default';
    const statDisplay = formatStatDisplay(phrase.stat, phrase.type, phrase.line);
    const edgeDisplay = phrase.edge_percentage
      ? phrase.edge_percentage > 0
        ? `+${phrase.edge_percentage}%`
        : `${phrase.edge_percentage}%`
      : phrase.edge;

    return (
      <Card key={phrase.id} sx={{ mb: 2, borderLeft: `4px solid ${borderColor}` }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {phrase.category?.replace(/_/g, ' ') || 'Player Prop'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" component="span">
                  {phrase.source || 'Unknown'} • {new Date(phrase.timestamp).toLocaleString()}
                </Typography>
                {phrase.generated_variation && (
                  <Chip label={`Var ${phrase.generated_variation}`} size="small" variant="outlined" />
                )}
              </Box>
            </Box>
            <Chip label={`${phrase.confidence}%`} size="small" color={confidenceColor} />
          </Box>

          <Typography variant="body1" sx={{ my: 2, fontStyle: 'italic' }}>
            "{phrase.phrase}"
          </Typography>

          {(phrase.player || phrase.team || statDisplay) && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Grid container spacing={2}>
                {phrase.player && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Player</Typography>
                    <Typography variant="body2" fontWeight="bold">{phrase.player}</Typography>
                  </Grid>
                )}
                {phrase.team && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Team</Typography>
                    <Typography variant="body2">{phrase.team} {phrase.opponent ? `vs ${phrase.opponent}` : ''}</Typography>
                  </Grid>
                )}
                {statDisplay && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Prop</Typography>
                    <Typography variant="body2">{statDisplay}</Typography>
                  </Grid>
                )}
                {edgeDisplay && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Advantage</Typography>
                    <Typography variant="body2" color={phrase.edge_percentage && phrase.edge_percentage > 0 ? 'green' : 'red'}>
                      {edgeDisplay}
                    </Typography>
                  </Grid>
                )}
                {phrase.odds && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Multiplier</Typography>
                    <Typography variant="body2">{phrase.odds}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {phrase.analysis && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">{phrase.analysis}</Typography>
            </Alert>
          )}

          {phrase.tags && phrase.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {phrase.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Main render
  // ============================================
  if (loading && !refreshing) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading secret phrases...</Typography>
        </Box>
      </Container>
    );
  }

  if (error && !allPhrases.length) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" action={<Button color="inherit" onClick={handleRefresh}>Retry</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  const totalAvailable = applyFilters(allPhrases).length;
  const remainingCount = totalAvailable - MAX_VISIBLE_PHRASES;

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', py: 6, px: 4, borderRadius: 3, mb: 4 }}>
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>🔐 Secret Phrases Hub</Typography>
              <Typography variant="h5">Insider tips, sharp money moves, and player prop insights</Typography>
            </Box>
            <IconButton color="inherit" onClick={() => setShowSearch(!showSearch)} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <SearchIcon />
            </IconButton>
          </Box>
          {showSearch && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search phrases, players..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setSearchQuery(searchInput.trim())}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: searchInput && <IconButton onClick={() => setSearchInput('')}><CloseIcon /></IconButton>
                }}
              />
            </Paper>
          )}
        </Container>
      </Box>

      {/* Credits Alert */}
      <Alert severity={generatorCredits > 0 ? "info" : "warning"} sx={{ mb: 3 }}>
        <AlertTitle>
          {generatorCredits > 0 ? `✨ You have ${generatorCredits} generator credits remaining` : "⚠️ No generator credits left"}
        </AlertTitle>
        Each generation uses 1 credit. {generatorCredits === 0 && "Purchase more credits to generate more picks."}
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => setShowCreditsModal(true)} variant="outlined" startIcon={<CreditCardIcon />}>
            Buy Credits
          </Button>
          <Button size="small" onClick={refreshCredits} variant="text" startIcon={<RefreshIcon />}>
            Refresh ({generatorCredits})
          </Button>
        </Box>
      </Alert>

      {/* Refresh Indicator */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <RefreshIcon sx={{ color: 'primary.main' }} />
          <Typography variant="body2">Last updated: {lastUpdated.toLocaleTimeString()}</Typography>
          <Chip label={`${allPhrases.length} total`} size="small" color="info" />
          <Chip label={apiSource} size="small" color={apiSource.includes('Real') ? 'success' : 'warning'} />
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={refreshing} size="small">
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Paper>

      {/* Sport Selector */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Select Sport</Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[
            { id: 'nba', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
            { id: 'nfl', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
            { id: 'mlb', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
          ].map(sport => (
            <Grid item key={sport.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid transparent',
                  '&:hover': { transform: 'translateY(-2px)' }
                }}
                onClick={() => handleSportChange(sport.id)}
              >
                <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                  <Box sx={{ color: sport.color, fontSize: 32 }}>{sport.icon}</Box>
                  <Typography>{sport.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedTabCategory}
                onChange={(e) => setSelectedTabCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="prop_value">Prop Value</MenuItem>
                <MenuItem value="insider_tip">Insider Tips</MenuItem>
                <MenuItem value="sharp_money">Sharp Money</MenuItem>
                <MenuItem value="line_move">Line Moves</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Min Confidence: {minConfidence}%</Typography>
            <Slider
              value={minConfidence}
              onChange={(_, v) => setMinConfidence(v as number)}
              min={0}
              max={100}
              step={5}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* AI Generator Section */}
      <Paper sx={{ p: 4, mb: 4, bgcolor: '#f8fafc' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4">🚀 AI Secret Phrase Generator</Typography>
          <Typography variant="body1" color="text.secondary">Generate custom secret phrases using real player prop data</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 300, flex: 1 }}>
            <Select
              value={selectedPrompt}
              onChange={(e) => { setSelectedPrompt(e.target.value); setCustomQuery(e.target.value); }}
              displayEmpty
            >
              <MenuItem value=""><em>Select a prompt...</em></MenuItem>
              <MenuItem value="Generate insider tips for tonight's NBA games">Insider Tips</MenuItem>
              <MenuItem value="Sharp money moves detected in last hour">Sharp Money</MenuItem>
              <MenuItem value="Players due for regression based on analytics">Regression Candidates</MenuItem>
              <MenuItem value="Most undervalued player props tonight">Undervalued Props</MenuItem>
            </Select>
          </FormControl>
          <TextField
            sx={{ flex: 2, minWidth: 300 }}
            placeholder="Or type your own query..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={() => setShowGeneratorModal(true)} disabled={!customQuery.trim()}>
            Generate
          </Button>
        </Box>
        <Alert severity="info" icon={<PsychologyIcon />}>
          Try: "easter egg" for a hidden surprise!
        </Alert>
      </Paper>

      {/* Phrases List */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5">Secret Phrases</Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {displayPhrases.length} picks • {totalAvailable} total available
              {generatedCount > 0 && ` • ${generatedCount} variations generated`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {generatedCount > 0 && (
              <Button variant="outlined" onClick={handleResetToTop} size="small" startIcon={<FilterAltIcon />}>
                Reset to Top {MAX_VISIBLE_PHRASES}
              </Button>
            )}
            {remainingCount > 0 && (
              <Button
                variant="contained"
                onClick={handleGenerateMore}
                disabled={generating || generatorCredits <= 0}
                size="small"
                startIcon={generating ? <CircularProgress size={20} /> : <ShuffleIcon />}
              >
                {generating ? 'Generating...' : `Generate ${Math.min(remainingCount, MAX_GENERATED_PICKS)} More`}
              </Button>
            )}
          </Box>
        </Box>

        {displayPhrases.map(renderPhraseCard)}

        {remainingCount > 0 && generatedCount === 0 && !loading && generatorCredits > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="text" onClick={handleGenerateMore} disabled={generating}>
              + {remainingCount} more picks available. Click to generate (uses 1 credit).
            </Button>
          </Box>
        )}
        {remainingCount > 0 && generatorCredits <= 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="text" onClick={() => setShowCreditsModal(true)} startIcon={<CreditCardIcon />}>
              No credits left. Buy credits to generate more picks.
            </Button>
          </Box>
        )}
      </Paper>

      {/* Footer */}
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Button component={Link} to="/" startIcon={<TrendingUpIcon />}>Back to Dashboard</Button>
      </Paper>

      {/* Credits Modal */}
      <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6">Buy Generator Credits</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Generator credits allow you to create additional secret phrases. Each generation uses 1 credit.
          </Typography>
          <Box sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current credits: <strong>{generatorCredits}</strong>
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(1)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">1 Credit</Typography>
                  <Typography variant="h5" color="#f59e0b" fontWeight="bold">$1.99</Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 2 }}>Buy Now</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(10)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">10 Credits</Typography>
                  <Typography variant="h5" color="#10b981" fontWeight="bold">$14.90</Typography>
                  <Typography variant="caption" color="text.secondary">$1.49/credit</Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#10b981' }}>Best Value</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(20)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">20 Credits</Typography>
                  <Typography variant="h5" color="#10b981" fontWeight="bold">$25.80</Typography>
                  <Typography variant="caption" color="text.secondary">$1.29/credit</Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#10b981' }}>Buy Now</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(50)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">50 Credits</Typography>
                  <Typography variant="h5" color="#10b981" fontWeight="bold">$44.50</Typography>
                  <Typography variant="caption" color="text.secondary">$0.89/credit</Typography>
                  <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#10b981' }}>Best Deal</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreditsModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* AI Generator Modal (placeholder) */}
      <Dialog open={showGeneratorModal} onClose={() => setShowGeneratorModal(false)}>
        <DialogTitle>AI Generator</DialogTitle>
        <DialogContent>
          <Typography>Query: "{customQuery}"</Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This feature will be available soon. Use the "Generate More" button above to get additional picks!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGeneratorModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default SecretPhraseScreen;
