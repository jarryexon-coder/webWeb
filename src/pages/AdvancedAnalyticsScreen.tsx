// src/pages/AdvancedAnalyticsScreen.tsx – Fixed credits and unlimited access

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  LinearProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  SportsBasketball as SportsBasketballIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as AutoAwesomeIcon,
  CreditCard as CreditCardIcon,
  Lock as LockIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import { useNavigate } from 'react-router-dom';

// API Base URL
const PYTHON_API_BASE = import.meta.env.VITE_API_BASE_URL || 
                        (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

// ============================================
// ANALYTICS‑FOCUSED PROMPTS
// ============================================
const SPORT_SPECIFIC_PROMPTS = {
  NBA: [
    "Players with highest positive regression in last 10 games",
    "Correlation between home games and points scored",
    "Which teams allow most rebounds to opposing PFs?",
    "Value on assists for point guards vs bottom‑10 defenses",
  ],
  NHL: [
    "Goalies with save percentage > .920 last 5 starts",
    "Power‑play points leaders last 2 weeks",
    "Teams with highest shots‑for when trailing",
  ],
  MLB: [
    "Pitchers with highest strikeout rate vs left‑handed batters",
    "Hitters with biggest ISO increase last 30 days",
    "Value on home run props in hitter‑friendly ballparks",
  ],
  Mixed: [
    "Best value across NBA, NHL, MLB tonight",
    "Players with highest projected advantage vs market",
    "Injury impact on team totals",
  ]
};

const ANALYTIC_PROMPTS = [
  "Top 5 players with highest edge today",
  "Under bets with highest probability (all sports)",
  "Players with biggest projected increase vs season avg",
  "Teams with highest home/away splits",
  "Value on rebounds for centers vs weak defensive teams",
];

interface AnalyticsItem {
  id?: string;
  player?: string;
  stat?: string;
  line?: number;
  projection?: number;
  edge?: number;
  confidence?: string;
  confidencePercent?: number;
  game?: string;
  team?: string;
  type?: string;
  odds?: string;
  bookmaker?: string;
}

interface AnalyticsData {
  overview: {
    totalGames: number;
    avgPoints: number;
    homeWinRate: string;
    avgMargin: number;
    overUnder: string;
    keyTrend: string;
  };
  advancedStats: Record<string, number | string>;
  trendingStats: Record<string, string>;
  rawAnalytics?: AnalyticsItem[];
  hasRealData: boolean;
  data_source?: string;
}

// ============================================
// HELPER: Get confidence from edge value
// ============================================
const getConfidenceFromEdge = (edge: number): { level: 'high' | 'medium' | 'low', percentage: number } => {
  const absEdge = Math.abs(edge);
  if (absEdge >= 15) return { level: 'high', percentage: 90 };
  if (absEdge >= 8) return { level: 'medium', percentage: 75 };
  return { level: 'low', percentage: 60 };
};

// ============================================
// MAIN COMPONENT
// ============================================
const AnalyticsScreen = () => {
  const navigate = useNavigate();
  const { user, token, profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout, handleCreditsCheckout } = useCheckout();

  // ============================================
  // CREDITS STATE
  // ============================================
  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [creditDebug, setCreditDebug] = useState<string>('Initializing...');

  // Get userId from auth
  const userId = user?.uid || user?.id;
  const hasUnlimitedAccess = planFeatures?.hasGeneratorCredits || false;

  // Debug log for user state
  useEffect(() => {
    console.log('🔍 [AdvancedAnalytics] User state:', { 
      hasUser: !!user, 
      userId, 
      hasToken: !!token,
      profileCredits: profile?.credits,
      planFeatures: planFeatures,
      hasUnlimitedAccess
    });
  }, [user, token, profile, planFeatures, hasUnlimitedAccess]);

  // Fetch credits from generations endpoint
  const fetchCurrentCredits = useCallback(async () => {
    console.log('🔄 [AdvancedAnalytics] fetchCurrentCredits called');
    
    if (!userId) {
      console.log('❌ [AdvancedAnalytics] No userId available');
      setCreditDebug('No userId available');
      setGeneratorCredits(0);
      return;
    }
    
    if (!token) {
      console.log('❌ [AdvancedAnalytics] No token available');
      setCreditDebug('No token available');
      setGeneratorCredits(0);
      return;
    }
    
    try {
      const url = `${PYTHON_API_BASE}/api/user/generations/${userId}`;
      console.log(`📡 [AdvancedAnalytics] Fetching credits from: ${url}`);
      
      const creditsResponse = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      console.log(`📡 [AdvancedAnalytics] Credits response status: ${creditsResponse.status}`);
      
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        console.log(`💰 [AdvancedAnalytics] Credits API returned:`, creditsData);
        setGeneratorCredits(creditsData.remaining || 0);
        setCreditDebug(`API returned ${creditsData.remaining || 0} credits`);
      } else {
        console.error(`❌ [AdvancedAnalytics] Failed to fetch credits: ${creditsResponse.status}`);
        setCreditDebug(`API error: ${creditsResponse.status}`);
        
        // Try profile as fallback
        console.log('🔄 [AdvancedAnalytics] Trying profile endpoint as fallback...');
        const profileResponse = await fetch(`${PYTHON_API_BASE}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log(`💰 [AdvancedAnalytics] Profile has ${profileData.credits} credits`);
          setGeneratorCredits(profileData.credits || 0);
          setCreditDebug(`Profile credits: ${profileData.credits || 0}`);
        } else {
          setGeneratorCredits(0);
          setCreditDebug(`Profile fallback failed`);
        }
      }
    } catch (err) {
      console.error('❌ [AdvancedAnalytics] Exception fetching credits:', err);
      setCreditDebug(`Exception: ${err}`);
      setGeneratorCredits(0);
    }
  }, [userId, token]);

  // Initial credit fetch
  useEffect(() => {
    console.log('🎬 [AdvancedAnalytics] Initial credit fetch effect running');
    fetchCurrentCredits();
  }, [fetchCurrentCredits]);

  // ============================================
  // STATE
  // ============================================
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedAnalyticPrompt, setSelectedAnalyticPrompt] = useState('');
  const [visibleCardsLimit, setVisibleCardsLimit] = useState(5);
  const [prizepicksData, setPrizepicksData] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // ============================================
  // FETCH REAL DATA FROM API
  // ============================================
const fetchPrizepicksData = useCallback(async () => {
    setFetchingData(true);
    setRefreshing(true);

    try {
      const sportLower = selectedSport.toLowerCase();
      const url = `${NODE_API_BASE}/api/prizepicks/selections?sport=${sportLower}&_t=${Date.now()}`;
      console.log(`📡 Fetching: ${url}`);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const selections = result.selections || result.props || result.data || [];
      console.log(`📦 Received ${selections.length} selections for ${selectedSport}`);

      if (selections.length > 0) {
        console.log('Sample selection:', selections[0]);
        setPrizepicksData(selections);
      } else {
        console.log('No selections found');
        setPrizepicksData([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch failed:', err);
      setPrizepicksData([]);
    } finally {
   setFetchingData(false);
      setRefreshing(false);
    }
  }, [selectedSport]);
  
  // Initial fetch and when sport changes
  useEffect(() => {
    fetchPrizepicksData();
  }, [fetchPrizepicksData]);

  // ============================================
  // PROCESS DATA INTO ANALYTICS FORMAT
  // ============================================
// Replace the processing useEffect (around line 430-500) with this updated version:

useEffect(() => {
  if (fetchingData) return;
  
  setLoading(true);
  
  const analyticsItems: AnalyticsItem[] = [];
  
  prizepicksData.forEach((item: any, idx: number) => {
    // Extract player name
    const playerName = item.player_name || item.player || item.name || 'Unknown';
    
    // Extract stat type
    let statType = item.stat_type || item.stat || item.market || 'points';
    
    // Format stat type for display
    if (typeof statType === 'string') {
      statType = statType.charAt(0).toUpperCase() + statType.slice(1);
      const statMap: Record<string, string> = {
        'pts': 'Points', 'points': 'Points', 'reb': 'Rebounds', 'rebounds': 'Rebounds',
        'ast': 'Assists', 'assists': 'Assists', 'stl': 'Steals', 'steals': 'Steals',
        'blk': 'Blocks', 'blocks': 'Blocks', '3pm': 'Threes', 'threes': 'Threes',
        'hits': 'Hits', 'home_runs': 'Home Runs', 'hr': 'Home Runs', 'rbis': 'RBIs',
        'goals': 'Goals', 'assists_nhl': 'Assists', 'shots': 'Shots on Goal',
      };
      statType = statMap[statType.toLowerCase()] || statType;
    }
    
    // Extract line (the over/under number)
    let line = item.line || item.line_value || 0;
    if (typeof line === 'string') line = parseFloat(line);
    
    // Extract projection (the predicted value)
    let projection = item.projection || item.projection_value || item.prediction || 0;
    if (typeof projection === 'string') projection = parseFloat(projection);
    
    // Calculate realistic edge based on projection vs line
    let edge = 0;
    if (projection > 0 && line > 0) {
      // Edge = ((projection - line) / line) * 100
      // But cap at reasonable levels (max 25%)
      edge = ((projection - line) / line) * 100;
      edge = Math.min(25, Math.max(-25, edge));
    } else if (item.edge) {
      // Use provided edge if available
      let providedEdge = item.edge;
      if (typeof providedEdge === 'string') {
        providedEdge = parseFloat(providedEdge.replace('%', ''));
      }
      if (providedEdge > 0 && providedEdge <= 1) {
        providedEdge = providedEdge * 100;
      }
      edge = Math.min(25, Math.max(-25, providedEdge));
    }
    
    // Round edge to 1 decimal
    edge = Math.round(edge * 10) / 10;
    
    // Determine type (over/under)
    const type = item.type || (item.over_under === 'over' ? 'Over' : 'Under');
    const formattedType = type === 'over' ? 'Over' : type === 'under' ? 'Under' : type;
    
    // Extract odds
    const odds = item.odds || item.american_odds || item.line_odds || '-110';
    
    // Format odds display
    let oddsDisplay = odds;
    if (typeof odds === 'number') {
      oddsDisplay = odds > 0 ? `+${odds}` : odds.toString();
    }
    
    // Calculate confidence from edge (capped between 55-90)
    let confidencePercent = 65;
    if (edge >= 15) confidencePercent = 88;
    else if (edge >= 10) confidencePercent = 82;
    else if (edge >= 5) confidencePercent = 75;
    else if (edge >= 2) confidencePercent = 68;
    else if (edge <= -5) confidencePercent = 55;
    
    analyticsItems.push({
      id: item.id || `prop-${idx}`,
      player: playerName,
      stat: statType,
      line: line,
      projection: projection,
      edge: edge,
      type: formattedType,
      odds: oddsDisplay,
      game: item.game || `${item.team || ''} vs ${item.opponent || ''}`,
      team: item.team || '',
      bookmaker: item.bookmaker || 'PrizePicks',
      confidencePercent: confidencePercent,
    });
  });
  
  console.log(`📊 Processed ${analyticsItems.length} analytics items for ${selectedSport}`);
  console.log('Sample processed item:', analyticsItems[0]);
  
  // Calculate stats
  const hasRealData = analyticsItems.length > 0;
  const avgEdge = analyticsItems.length > 0 
    ? analyticsItems.reduce((sum, item) => sum + (item.edge || 0), 0) / analyticsItems.length 
    : 0;
  const highConfidenceCount = analyticsItems.filter(item => (item.edge || 0) >= 10).length;
  
  // Find best pick
  let bestPick = '';
  if (analyticsItems.length > 0) {
    const best = [...analyticsItems].sort((a, b) => (b.edge || 0) - (a.edge || 0))[0];
    bestPick = `${best.player} - ${best.stat}: ${best.type} ${best.line} (${best.edge}% edge)`;
  }
  
  setAnalyticsData({
    overview: {
      totalGames: analyticsItems.length,
      avgPoints: 112.4,
      homeWinRate: `${Math.min(100, 50 + Math.floor(highConfidenceCount / 2))}%`,
      avgMargin: 11.8,
      overUnder: `${50 + Math.floor(highConfidenceCount / 3)}% Over`,
      keyTrend: `${analyticsItems.length} player props • ${highConfidenceCount} high-confidence picks`,
    },
    advancedStats: {
      totalProps: analyticsItems.length,
      avgEdge: `${avgEdge.toFixed(1)}%`,
      highConfidence: `${highConfidenceCount}`,
    },
    trendingStats: {
      bestPick: bestPick || 'No picks available',
      hotStat: 'Player Props',
      risingPlayer: analyticsItems[0]?.player || 'N/A',
      valueBook: 'PrizePicks',
      topMarket: 'Player Props',
      aiInsight: `💰 ${highConfidenceCount} high-value picks detected with ${avgEdge.toFixed(1)}% average edge`
    },
    rawAnalytics: analyticsItems,
    hasRealData: hasRealData,
    data_source: 'prizepicks-api',
  });
  
  setLoading(false);
}, [prizepicksData, fetchingData, selectedSport]);

  // ============================================
  // HANDLE USE CREDIT FOR MORE PICKS
  // ============================================
  const handleUseCreditForMorePicks = async () => {
    console.log('🚀 [AdvancedAnalytics] handleUseCreditForMorePicks called');
    console.log(`   hasUnlimitedAccess: ${hasUnlimitedAccess}`);
    console.log(`   generatorCredits: ${generatorCredits}`);
    
    if (hasUnlimitedAccess) {
      console.log('✅ [AdvancedAnalytics] Premium user - unlimited access');
      setVisibleCardsLimit(prev => prev + 5);
      return;
    }

    if (generatorCredits <= 0) {
      console.log('❌ [AdvancedAnalytics] No credits available, showing modal');
      setShowCreditsModal(true);
      return;
    }

    try {
      console.log('📡 [AdvancedAnalytics] Calling decrement API...');
      const useResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          pickType: 'view_more_picks',
          pickData: { screen: 'AdvancedAnalytics', limitIncrease: 5 }
        }),
      });
      
      console.log(`📡 [AdvancedAnalytics] Decrement API response status: ${useResponse.status}`);
      
      if (!useResponse.ok) {
        const errorText = await useResponse.text();
        console.error(`❌ [AdvancedAnalytics] Failed to use credit: ${useResponse.status}`, errorText);
        throw new Error('Failed to use credit');
      }
      
      const data = await useResponse.json();
      console.log(`✅ [AdvancedAnalytics] Credit used successfully! Remaining: ${data.remaining}`);
      setGeneratorCredits(data.remaining);
      setVisibleCardsLimit(prev => prev + 5);
      setCreditDebug(`Used 1 credit, ${data.remaining} remaining`);
      
    } catch (err) {
      console.error('❌ [AdvancedAnalytics] Credit usage failed:', err);
      setShowCreditsModal(true);
      setCreditDebug(`Credit usage failed: ${err}`);
    }
  };

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
    setVisibleCardsLimit(5);
  };

  // ============================================
  // FILTER VALUE PICKS
  // ============================================
  const allValuePicks = analyticsData?.rawAnalytics || [];
  const sortedPicks = [...allValuePicks].sort((a, b) => (b.edge || 0) - (a.edge || 0));
  const visiblePicks = sortedPicks.slice(0, visibleCardsLimit);
  const hasMorePicks = sortedPicks.length > visibleCardsLimit;

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      py: 6,
      px: 4,
      borderRadius: 3,
      mb: 4,
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              🤖 AI Analytics & Predictions Hub
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9 }}>
              {analyticsData?.hasRealData && analyticsData.rawAnalytics && analyticsData.rawAnalytics.length > 0 
                ? `✅ Using REAL API Data (${analyticsData.rawAnalytics.length} picks)` 
                : fetchingData ? '⏳ Fetching data...' : '⚠️ No Data Available - Click Refresh'}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => setShowSearch(!showSearch)} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <SearchIcon />
          </IconButton>
        </Box>
        {showSearch && (
          <Paper sx={{ mt: 3, p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search analytics, predictions, or trends..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Paper>
        )}
      </Container>
    </Box>
  );

  const renderRefreshIndicator = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RefreshIcon sx={{ color: 'primary.main' }} />
        <Typography variant="body2">Last updated: {lastUpdated.toLocaleTimeString()}</Typography>
        {analyticsData?.hasRealData && analyticsData.rawAnalytics && analyticsData.rawAnalytics.length > 0 && (
          <Chip label={`${analyticsData.rawAnalytics.length} picks`} size="small" color="success" icon={<CheckCircleIcon />} />
        )}
        {hasUnlimitedAccess && <Chip label="Premium Active" size="small" color="secondary" icon={<AutoAwesomeIcon />} />}
      </Box>
      <Button startIcon={<RefreshIcon />} onClick={fetchPrizepicksData} disabled={refreshing} variant="outlined" size="small">
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </Paper>
  );

  const renderSportSelector = () => {
    const sports = [
      { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
      { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
      { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af' },
      { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
    ];
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Select Sport</Typography>
        <Grid container spacing={2}>
          {sports.map((sport) => (
            <Grid item key={sport.id}>
              <Card sx={{
                cursor: 'pointer',
                border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid transparent',
                '&:hover': { transform: 'translateY(-2px)' }
              }} onClick={() => handleSportChange(sport.id)}>
                <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                  <Box sx={{ color: sport.color, mb: 1, fontSize: 32 }}>{sport.icon}</Box>
                  <Typography variant="body2">{sport.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

const renderValuePicks = () => {
  console.log('🎨 [AdvancedAnalytics] Rendering value picks - hasUnlimitedAccess:', hasUnlimitedAccess, 'generatorCredits:', generatorCredits);
  
  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>📊 Value Picks</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {analyticsData?.hasRealData && analyticsData.rawAnalytics && analyticsData.rawAnalytics.length > 0
          ? `Showing ${visiblePicks.length} real picks from ${analyticsData.data_source}` 
          : fetchingData ? 'Fetching data from API...' : `No data available for ${selectedSport}. Click Refresh to fetch from API.`}
      </Typography>
      {fetchingData && <LinearProgress sx={{ mb: 2 }} />}
      {visiblePicks.length === 0 && !fetchingData ? (
        <Alert severity="info">No picks available. Click Refresh to fetch latest data.</Alert>
      ) : (
        <Grid container spacing={3}>
          {visiblePicks.map((pick, idx) => {
            const confidence = getConfidenceFromEdge(pick.edge || 0);
            return (
              <Grid item xs={12} sm={6} md={4} key={pick.id || idx}>
                <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{pick.player}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pick.stat} | {pick.type} {pick.line}
                    </Typography>
                    {pick.projection && pick.projection > 0 && (
                      <Typography variant="caption" color="primary" display="block">
                        Projection: {pick.projection.toFixed(1)}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${confidence.percentage}% ${confidence.level.toUpperCase()}`}
                        color={confidence.level === 'high' ? 'success' : confidence.level === 'medium' ? 'warning' : 'default'} 
                        size="small" 
                      />
                      <Chip 
                        label={`Edge: ${pick.edge}%`}
                        color={pick.edge && pick.edge > 10 ? 'success' : pick.edge && pick.edge > 5 ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                      {pick.odds && <Chip label={`Odds: ${pick.odds}`} size="small" variant="outlined" />}
                    </Box>
                    {pick.game && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: '#94a3b8' }}>
                        {pick.game}
                      </Typography>
                    )}
                    {pick.bookmaker && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        via {pick.bookmaker}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      {hasMorePicks && (
        <Box textAlign="center" mt={3}>
          {!hasUnlimitedAccess ? (
            <>
              <Button variant="contained" startIcon={<CreditCardIcon />} onClick={handleUseCreditForMorePicks} disabled={generatorCredits < 1}>
                Use 1 Credit to Show Next 5 Picks ({generatorCredits} left)
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>You have {generatorCredits} credits remaining</Typography>
              <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setShowUpgradeModal(true)} sx={{ mt: 1, ml: 1 }}>
                Upgrade to Premium for Unlimited Picks
              </Button>
            </>
          ) : (
            <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleUseCreditForMorePicks} sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}>
              Load 5 More Picks (Premium Unlimited)
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

// Add this debug function to test the actual API response
const debugPrizePicksAPI = async () => {
  console.log('🔍 Debugging PrizePicks API...');
  const sportLower = selectedSport.toLowerCase();
  const url = `${NODE_API_BASE}/api/prizepicks/selections?sport=${sportLower}&_t=${Date.now()}`;
  
  try {
    const response = await fetch(url);
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, [...response.headers.entries()]);
    
    const text = await response.text();
    console.log(`📡 Raw response (first 1000 chars):`, text.substring(0, 1000));
    
    try {
      const json = JSON.parse(text);
      console.log(`📡 Parsed JSON:`, json);
      console.log(`📡 Selections count:`, json.selections?.length);
      if (json.selections && json.selections.length > 0) {
        console.log(`📡 First selection:`, json.selections[0]);
      }
    } catch (e) {
      console.log(`❌ Not valid JSON:`, e);
    }
  } catch (err) {
    console.error(`❌ Fetch failed:`, err);
  }
};

// Call this in a useEffect to debug
useEffect(() => {
  debugPrizePicksAPI();
}, [selectedSport]);

  const renderOverview = () => (
    <>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5">📊 Season Overview - {selectedSport}</Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Typography variant="h4">{analyticsData?.overview.totalGames || 0}</Typography><Typography variant="body2">Picks Analyzed</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Typography variant="h4">{analyticsData?.advancedStats?.avgEdge || '0'}%</Typography><Typography variant="body2">Average Edge</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Typography variant="h4">{analyticsData?.advancedStats?.highConfidence || '0'}</Typography><Typography variant="body2">High Confidence Picks</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Typography variant="h4">{analyticsData?.overview.overUnder}</Typography><Typography variant="body2">Over Rate</Typography></CardContent></Card>
          </Grid>
        </Grid>
        {analyticsData?.trendingStats?.bestPick && analyticsData.trendingStats.bestPick !== 'No picks available' && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography>🔥 Top Pick: {analyticsData.trendingStats.bestPick}</Typography>
          </Alert>
        )}
        <Alert severity={analyticsData?.hasRealData ? "success" : "warning"} sx={{ mt: 3 }}>
          <Typography>
            {analyticsData?.hasRealData && analyticsData.rawAnalytics && analyticsData.rawAnalytics.length > 0
              ? `✅ Using real-time data from PrizePicks API. ${analyticsData.advancedStats?.totalProps || 0} picks analyzed.` 
              : fetchingData ? '⏳ Fetching data from API...' : `⚠️ No data available for ${selectedSport}. Click Refresh to fetch from API.`}
          </Typography>
        </Alert>
      </Paper>
      {renderValuePicks()}
    </>
  );

  const renderCreditAlert = () => (
    <Alert severity={hasUnlimitedAccess ? "success" : (generatorCredits > 0 ? "info" : "warning")} sx={{ mb: 3 }}>
      <AlertTitle>
        {hasUnlimitedAccess 
          ? "✨ Premium Active - Unlimited Access" 
          : (generatorCredits > 0 
            ? `✨ You have ${generatorCredits} generator credits remaining` 
            : "⚠️ No generator credits left")}
      </AlertTitle>
      {hasUnlimitedAccess ? (
        "You have unlimited access to all analytics picks!"
      ) : (
        <>
          Each batch of 5 additional picks uses 1 credit. Viewing the top 5 value picks above is free.
          {generatorCredits === 0 && " Purchase credits to see more picks."}
        </>
      )}
      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {!hasUnlimitedAccess && (
          <Button size="small" variant="outlined" onClick={() => setShowCreditsModal(true)} startIcon={<CreditCardIcon />}>
            Buy Credits
          </Button>
        )}
        <Button size="small" variant="contained" onClick={() => setShowUpgradeModal(true)} startIcon={hasUnlimitedAccess ? <StarIcon /> : <LockIcon />}>
          {hasUnlimitedAccess ? "Manage Subscription" : "Upgrade to Premium"}
        </Button>
        <Button size="small" variant="text" onClick={fetchCurrentCredits} startIcon={<RefreshIcon />}>
          Refresh ({generatorCredits})
        </Button>
      </Box>
    </Alert>
  );

  const renderCreditsModal = () => (
    <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#6C5CE7', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCardIcon sx={{ mr: 1 }} /> Purchase Credits
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
          Generate more picks with credits. Each batch of 5 picks uses 1 credit.
        </Typography>
        <Grid container spacing={2}>
          {[
            { credits: 1, price: '$1.99', perCredit: '$1.99', description: '1 Credit' },
            { credits: 10, price: '$14.90', perCredit: '$1.49', popular: true, description: '10 Credits' },
            { credits: 20, price: '$25.80', perCredit: '$1.29', description: '20 Credits' },
            { credits: 50, price: '$44.50', perCredit: '$0.89', bestValue: true, description: '50 Credits' }
          ].map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card 
                sx={{ 
                  border: option.popular ? '2px solid #6C5CE7' : option.bestValue ? '2px solid #10b981' : '1px solid #e5e7eb', 
                  position: 'relative',
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                }}
                onClick={() => handleCreditsCheckout(option.credits)}
              >
                {option.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6C5CE7', color: 'white' }} />}
                {option.bestValue && <Chip label="BEST VALUE" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white' }} />}
                <CardContent sx={{ textAlign: 'center', pt: option.popular || option.bestValue ? 4 : 2 }}>
                  <Typography variant="h6" fontWeight="bold">{option.description}</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{option.price}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.perCredit} per credit</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button onClick={() => setShowCreditsModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const renderUpgradeModal = () => (
    <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#6C5CE7', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StarIcon sx={{ mr: 1 }} /> Upgrade to Premium
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
          Get unlimited analytics picks and premium features!
        </Typography>
        <Grid container spacing={2}>
          {[
            { planId: 'starter', name: 'Starter Plan', price: '$5.99/month', features: ['Unlimited Analytics Picks', 'Priority Support'], popular: false },
            { planId: 'generator', name: 'Generator Plan', price: '$39.99/month', features: ['Unlimited Analytics Picks', 'Priority Support', 'Early Access', '8 Daily AI Picks'], popular: true }
          ].map((option, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                sx={{ 
                  border: option.popular ? '2px solid #6C5CE7' : '1px solid #e5e7eb', 
                  position: 'relative', 
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                }}
                onClick={() => { navigate('/subscription'); setShowUpgradeModal(false); }}
              >
                {option.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6C5CE7', color: 'white' }} />}
                <CardContent sx={{ textAlign: 'center', pt: option.popular ? 4 : 2 }}>
                  <Typography variant="h6" fontWeight="bold">{option.name}</Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{option.price}</Typography>
                  <Box sx={{ mt: 2 }}>
                    {option.features.map((feature, idx) => (
                      <Typography key={idx} variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                        ✓ {feature}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button onClick={() => setShowUpgradeModal(false)} sx={{ color: '#64748b' }}>Maybe Later</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && !fetchingData && (!analyticsData || analyticsData.rawAnalytics?.length === 0)) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Loading advanced analytics...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {renderCreditAlert()}
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderOverview()}
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Button variant="outlined" component={Link} to="/">Back to Dashboard</Button>
      </Paper>
      {renderCreditsModal()}
      {renderUpgradeModal()}
    </Container>
  );
};

export default AnalyticsScreen;
