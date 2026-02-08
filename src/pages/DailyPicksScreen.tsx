// src/pages/DailyPicksScreen.tsx - UPDATED WITH HOOK INTEGRATION
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  alpha,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Shield as ShieldIcon,
  ArrowBack,
  Search,
  CalendarToday,
  SportsBasketball,
  SportsFootball,
  SportsHockey,
  SportsBaseball,
  TrendingUp,
  AttachMoney,
  Analytics,
  BarChart,
  CheckCircle,
  Lock,
  BookmarkBorder,
  Info,
  Bolt,
  Refresh,
  Close,
  AutoAwesome,
  EmojiEvents,
  Schedule,
  ExpandMore,
  BugReport,
  Today,
  SportsSoccer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDailyPicks } from '../hooks/useBackendAPI'; // Updated import

// Types
interface DailyPick {
  id: string;
  player: string;
  team: string;
  sport: string;
  pick: string;
  confidence: number;
  odds: string;
  edge: string;
  analysis: string;
  timestamp: string;
  category: string;
  probability: string;
  roi: string;
  units: string;
  requiresPremium: boolean;
  generatedFrom?: string;
  isToday?: boolean;
}

const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981',
  SOCCER: '#8b5cf6'
};

const CATEGORY_COLORS = {
  'High Confidence': '#10b981',
  'Value Bet': '#3b82f6',
  'Lock Pick': '#f59e0b',
  'High Upside': '#8b5cf6',
  'AI Generated': '#ec4899',
  'Premium Pick': '#f59e0b'
};

const DailyPicksScreen = () => {
  const navigate = useNavigate();
  
  // Use the custom hook for data fetching
  const { 
    data: picksData, 
    isLoading, 
    error: apiError, 
    refetch 
  } = useDailyPicks();
  
  // Local state for UI
  const [picks, setPicks] = useState<DailyPick[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<DailyPick[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [remainingGenerations, setRemainingGenerations] = useState(2);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [selectedPick, setSelectedPick] = useState<DailyPick | null>(null);
  const [showPickDetail, setShowPickDetail] = useState(false);
  
  // Transform API data when it changes
  useEffect(() => {
    if (picksData && picksData.picks && Array.isArray(picksData.picks)) {
      const transformedPicks = picksData.picks.map((apiPick: any, index: number) => ({
        id: apiPick.id || `pick-${Date.now()}-${index}`,
        player: apiPick.player || apiPick.name || `Player ${index + 1}`,
        team: apiPick.team || 'TBD',
        sport: apiPick.sport || 'NBA',
        pick: apiPick.pick || apiPick.prediction || apiPick.selection || `Pick ${index + 1}`,
        confidence: apiPick.confidence || Math.floor(Math.random() * 30) + 70,
        odds: apiPick.odds || '+150',
        edge: apiPick.edge || apiPick.expectedValue || `+${Math.floor(Math.random() * 15) + 5}%`,
        analysis: apiPick.analysis || apiPick.reason || apiPick.justification || 'Based on advanced analytics and matchup data.',
        timestamp: apiPick.timestamp || new Date().toLocaleString(),
        category: apiPick.category || (apiPick.confidence >= 90 ? 'High Confidence' : 
                  apiPick.confidence >= 85 ? 'Value Bet' : 
                  apiPick.confidence >= 80 ? 'Lock Pick' : 'High Upside'),
        probability: apiPick.probability || `${Math.floor(Math.random() * 30) + 70}%`,
        roi: apiPick.roi || `+${Math.floor(Math.random() * 40) + 10}%`,
        units: apiPick.units || (Math.random() * 2 + 1).toFixed(1),
        requiresPremium: apiPick.requiresPremium || false,
        isToday: true
      }));
      
      setPicks(transformedPicks);
      setFilteredPicks(transformedPicks);
      setLastRefresh(new Date());
    } else if (picksData && picksData.picks === undefined) {
      // Use fallback data if API returns empty or invalid data
      const fallbackPicks: DailyPick[] = [
        {
          id: '1',
          player: 'Nikola Jokic',
          team: 'DEN',
          sport: 'NBA',
          pick: 'Triple-Double (Pts/Reb/Ast)',
          confidence: 91,
          odds: '+220',
          edge: '+15.8%',
          analysis: 'Jokic averaging 24.5/12.1/9.8 vs this opponent. Defense ranks 27th in defending centers.',
          timestamp: 'Today, 8:30 PM ET',
          category: 'High Confidence',
          probability: '88%',
          roi: '+32%',
          units: '3.0',
          requiresPremium: false,
          isToday: true
        },
        {
          id: '2',
          player: 'Cooper Kupp',
          team: 'LAR',
          sport: 'NFL',
          pick: 'Over 85.5 Receiving Yards',
          confidence: 87,
          odds: '-125',
          edge: '+9.2%',
          analysis: 'Kupp has averaged 98.2 YPG against NFC West opponents. Defense allows 7.9 YPA to slot receivers.',
          timestamp: 'Tonight, 8:15 PM ET',
          category: 'Value Bet',
          probability: '82%',
          roi: '+24%',
          units: '2.5',
          requiresPremium: true,
          isToday: true
        },
        {
          id: '3',
          player: 'Connor McDavid',
          team: 'EDM',
          sport: 'NHL',
          pick: 'Over 1.5 Points (G+A)',
          confidence: 85,
          odds: '-140',
          edge: '+7.4%',
          analysis: 'McDavid has 24 points in last 12 games. Opponent allows 3.8 goals per game on the road.',
          timestamp: 'Tomorrow, 7:00 PM ET',
          category: 'Lock Pick',
          probability: '79%',
          roi: '+18%',
          units: '2.0',
          requiresPremium: false,
          isToday: true
        }
      ];
      
      setPicks(fallbackPicks);
      setFilteredPicks(fallbackPicks);
      setLastRefresh(new Date());
    }
  }, [picksData]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPicks(picks);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = picks.filter(pick =>
      (pick.player || '').toLowerCase().includes(lowerQuery) ||
      (pick.team || '').toLowerCase().includes(lowerQuery) ||
      (pick.sport || '').toLowerCase().includes(lowerQuery) ||
      (pick.pick || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPicks(filtered);
  }, [searchQuery, picks]);

  // Handle sport filter
  useEffect(() => {
    if (selectedSport === 'All') {
      setFilteredPicks(picks);
    } else {
      const filtered = picks.filter(pick => pick.sport === selectedSport);
      setFilteredPicks(filtered);
    }
  }, [selectedSport, picks]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    setLastRefresh(new Date());
  }, [refetch]);

  const handleTrackPick = (pick: DailyPick) => {
    if (pick.requiresPremium && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedPick(pick);
    setShowPickDetail(true);
  };

  const handleGenerateCustomPicks = () => {
    if (!customPrompt.trim()) {
      alert('Please enter a prompt to generate picks');
      return;
    }

    if (remainingGenerations === 0 && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    setShowGeneratingModal(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPick: DailyPick = {
        id: `gen-${Date.now()}`,
        player: 'AI Generated',
        team: 'AI',
        sport: 'Mixed',
        pick: `Custom AI Pick: ${customPrompt.substring(0, 50)}...`,
        confidence: 82,
        odds: '+180',
        edge: '+6.5%',
        analysis: `Generated by AI based on: "${customPrompt}". This pick focuses on daily value opportunities.`,
        timestamp: 'Just now',
        category: 'AI Generated',
        probability: '76%',
        roi: '+22%',
        units: '2.0',
        requiresPremium: false,
        generatedFrom: customPrompt,
        isToday: true
      };
      
      setPicks([newPick, ...picks]);
      setCustomPrompt('');
      setGenerating(false);
      
      if (!hasPremiumAccess) {
        setRemainingGenerations(prev => Math.max(0, prev - 1));
      }
    }, 2000);
  };

  // Debug Panel Component (same as ParlayArchitectScreen)
  const DebugPanel = () => {
    return (
      <Collapse in={showDebugPanel}>
        <Paper sx={{ 
          p: 2, 
          mb: 4, 
          bgcolor: '#1e293b',
          color: 'white',
          borderRadius: 2
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <BugReport fontSize="small" />
              <Typography variant="h6">Debug Panel</Typography>
            </Box>
            <Chip 
              label="Dev Mode" 
              size="small" 
              sx={{ bgcolor: '#ef4444', color: 'white' }}
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
                Component Stats
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Daily Picks: {picks.length}
                </Typography>
                <Typography variant="body2">
                  • Filtered: {filteredPicks.length}
                </Typography>
                <Typography variant="body2">
                  • Last Refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
                </Typography>
                <Typography variant="body2">
                  • Loading: {isLoading ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
                API Status
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Daily Picks API: {apiError ? '❌ Error' : '✅ Connected'}
                </Typography>
                <Typography variant="body2">
                  • Data Source: {picksData?.source || 'unknown'}
                </Typography>
                <Typography variant="body2">
                  • Last Check: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
              
              <Box mt={2}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: '#64748b', mr: 1 }}
                  onClick={() => {
                    console.log('🔄 Manual debug refresh triggered');
                    handleRefresh();
                  }}
                >
                  Force Refresh
                </Button>
                
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: '#64748b' }}
                  onClick={() => {
                    console.log('🔍 Debug: Full state dump:', {
                      picksData,
                      picks,
                      filteredPicks,
                      apiError
                    });
                  }}
                >
                  Log State
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {apiError && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: '#7f1d1d' }}>
              <AlertTitle>API Error</AlertTitle>
              {String(apiError)}
            </Alert>
          )}
        </Paper>
      </Collapse>
    );
  };

  // Confidence Meter Component (same as ParlayArchitectScreen)
  const ConfidenceMeter = ({ score, level }: { score: number; level: string }) => {
    const getLevelColor = (levelStr: string) => {
      const colors = {
        'very-high': '#10b981',
        'high': '#3b82f6',
        'medium': '#f59e0b',
        'low': '#ef4444',
        'very-low': '#dc2626'
      };
      
      return colors[levelStr as keyof typeof colors] || '#64748b';
    };
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 80, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${Math.min(score, 100)}%`,
              height: 8,
              bgcolor: getLevelColor(level)
            }}
          />
        </Box>
        <Typography variant="caption" fontWeight="bold" color={getLevelColor(level)}>
          {score}%
        </Typography>
      </Box>
    );
  };

  // Today's Picks Component
  const TodaysPicksPanel = () => (
    <Paper sx={{ mb: 4 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Today color="primary" />
            <Typography variant="h6">Today's AI Picks</Typography>
            <Chip 
              label={`${picks.length} picks`} 
              size="small" 
              color={isLoading ? "default" : apiError ? "error" : "success"}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Loading daily picks...</Typography>
            </Box>
          ) : apiError ? (
            <Alert severity="warning">
              <AlertTitle>Using Fallback Data</AlertTitle>
              {String(apiError)}
            </Alert>
          ) : picks.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>No Picks Today</AlertTitle>
              Check back later for today's selections.
            </Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI-generated daily picks based on the latest data and matchups.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );

  const renderPickCard = (pick: DailyPick) => {
    const isPremiumLocked = pick.requiresPremium && !hasPremiumAccess;
    
    return (
      <Card key={pick.id} sx={{ 
        mb: 3,
        borderLeft: 4,
        borderColor: (CATEGORY_COLORS as any)[pick.category] || '#6b7280',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s'
        }
      }}>
        <CardContent onClick={() => handleTrackPick(pick)}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {pick.player}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {pick.team}
                </Typography>
                <Chip 
                  label={pick.sport}
                  size="small"
                  sx={{ 
                    bgcolor: `${(SPORT_COLORS as any)[pick.sport]}20`,
                    color: (SPORT_COLORS as any)[pick.sport],
                    fontWeight: 'bold'
                  }}
                />
                {pick.category && (
                  <Chip 
                    label={pick.category}
                    size="small"
                    sx={{ 
                      bgcolor: `${(CATEGORY_COLORS as any)[pick.category]}20`,
                      color: (CATEGORY_COLORS as any)[pick.category],
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfidenceMeter score={pick.confidence} level={
                pick.confidence >= 90 ? 'very-high' :
                pick.confidence >= 85 ? 'high' :
                pick.confidence >= 80 ? 'medium' : 'low'
              } />
              {isPremiumLocked && (
                <Lock sx={{ color: 'text.secondary' }} />
              )}
            </Box>
          </Box>
          
          {/* Pick Details */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isPremiumLocked ? 'text.secondary' : '#f59e0b' }}>
            {pick.pick}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Odds:</Typography>
                <Typography variant="body1" fontWeight="bold">{pick.odds}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ color: '#10b981', fontSize: 16 }} />
                <Typography variant="body1" fontWeight="bold" color="#10b981">
                  {pick.edge} edge
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Metrics */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <BarChart sx={{ color: '#8b5cf6', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">Win Chance</Typography>
                  <Typography variant="body1" fontWeight="bold">{pick.probability}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ color: '#10b981', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">Projected ROI</Typography>
                  <Typography variant="body1" fontWeight="bold">{pick.roi}</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <EmojiEvents sx={{ color: '#f59e0b', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">Units</Typography>
                  <Typography variant="body1" fontWeight="bold">{pick.units}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Analysis */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Analytics sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : pick.analysis}
            </Typography>
          </Box>
          
          {/* Generated Info */}
          {pick.generatedFrom && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Generated from: "{pick.generatedFrom.substring(0, 50)}..."
              </Typography>
            </Alert>
          )}
          
          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {pick.timestamp}
            </Typography>
            <Button
              variant="contained"
              startIcon={<BookmarkBorder />}
              size="small"
              sx={{
                bgcolor: '#f59e0b',
                '&:hover': {
                  bgcolor: '#d97706'
                }
              }}
            >
              Track Pick
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Pick Detail Modal
  const PickDetailModal = () => (
    <Dialog open={showPickDetail} onClose={() => setShowPickDetail(false)} maxWidth="md" fullWidth>
      {selectedPick && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: (SPORT_COLORS as any)[selectedPick.sport] }}>
                {selectedPick.player.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedPick.player}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPick.team} • {selectedPick.sport}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h5" color="#f59e0b" fontWeight="bold">
                      {selectedPick.pick}
                    </Typography>
                    <Box mt={2}>
                      <ConfidenceMeter 
                        score={selectedPick.confidence} 
                        level={
                          selectedPick.confidence >= 90 ? 'very-high' :
                          selectedPick.confidence >= 85 ? 'high' :
                          selectedPick.confidence >= 80 ? 'medium' : 'low'
                        } 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Pick Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Odds</Typography>
                        <Typography variant="h6">{selectedPick.odds}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Edge</Typography>
                        <Typography variant="h6" color="#10b981">{selectedPick.edge}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Probability</Typography>
                        <Typography variant="h6">{selectedPick.probability}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">ROI</Typography>
                        <Typography variant="h6">{selectedPick.roi}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Analysis</Typography>
                    <Typography variant="body2">
                      {selectedPick.analysis}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPickDetail(false)}>Close</Button>
            <Button variant="contained">Add to Bet Slip</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  return (
    <Container maxWidth="lg">
      {/* Header - Similar to ParlayArchitectScreen */}
      <Paper sx={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        mb: 4,
        p: 3,
        color: 'white'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            
            {/* Debug toggle button */}
            <Button
              startIcon={<BugReport />}
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: showDebugPanel ? 'rgba(0,0,0,0.3)' : 'transparent'
              }}
              variant="outlined"
              size="small"
            >
              {showDebugPanel ? 'Hide Debug' : 'Debug'}
            </Button>
          </Box>
          
          {/* Last refresh indicator */}
          {lastRefresh && (
            <Chip 
              label={`Last updated: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <CalendarToday sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Daily Picks
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              AI-curated selections with highest probability of success
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Debug Panel */}
      <DebugPanel />

      {/* Action Bar - Similar pattern to ParlayArchitectScreen */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AutoAwesome />}
              onClick={handleGenerateCustomPicks}
              disabled={generating || (!hasPremiumAccess && remainingGenerations === 0)}
            >
              {generating ? 'Generating...' : 'Generate Custom Picks'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Sport filter' }}
              >
                {['All', 'NBA', 'NFL', 'NHL', 'MLB'].map((sport) => (
                  <MenuItem key={sport} value={sport}>
                    {sport}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <IconButton 
                onClick={handleRefresh} 
                disabled={isLoading}
                title="Refresh picks"
              >
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Today's Picks Panel */}
      <TodaysPicksPanel />

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search picks by player, team, or pick type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchQuery('')} size="small">
                  <Close />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Display picks */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading daily picks...</Typography>
        </Box>
      ) : apiError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Picks</AlertTitle>
          {String(apiError)}
          <Button size="small" sx={{ ml: 2 }} onClick={handleRefresh}>
            Retry
          </Button>
        </Alert>
      ) : filteredPicks.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Today's Picks ({filteredPicks.length})
          </Typography>
          {filteredPicks.map((pick) => renderPickCard(pick))}
        </Box>
      ) : (
        <Alert severity="info">
          <AlertTitle>No Picks Found</AlertTitle>
          Try changing your search or filters.
        </Alert>
      )}

      {/* Custom Prompt Generator */}
      <Paper sx={{ p: 2, mb: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generate Custom Picks
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter a prompt to generate custom picks..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleGenerateCustomPicks}
            disabled={!customPrompt.trim() || generating}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': {
                bgcolor: '#7c3aed'
              }
            }}
          >
            Generate
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {hasPremiumAccess ? (
              <>Premium: Unlimited generations available</>
            ) : (
              <>Free generations remaining: {remainingGenerations}/2</>
            )}
          </Typography>
          {remainingGenerations === 0 && !hasPremiumAccess && (
            <Button 
              size="small" 
              onClick={() => setShowUpgradeModal(true)}
              sx={{ ml: 'auto' }}
            >
              Upgrade
            </Button>
          )}
        </Box>
      </Paper>

      {/* Pick Detail Modal */}
      <PickDetailModal />

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock sx={{ color: '#f59e0b' }} />
            Daily Limit Reached
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You've used all 2 free generations today.
          </Typography>
          
          <Box sx={{ my: 3 }}>
            {['Unlimited daily generations', 'Premium picks & analysis', 'Advanced AI models', 'No daily limits'].map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#10b981">Generation Pack</Typography>
                  <Typography variant="h4" fontWeight="bold">$3.99</Typography>
                  <Typography variant="caption" color="text.secondary">10 extra generations</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#f59e0b">Full Access</Typography>
                  <Typography variant="h4" fontWeight="bold">$14.99/mo</Typography>
                  <Typography variant="caption" color="text.secondary">Unlimited everything</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
          <Button 
            variant="contained" 
            onClick={() => navigate('/subscription')}
            sx={{ bgcolor: '#f59e0b' }}
          >
            Upgrade Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generating Modal */}
      <Dialog open={showGeneratingModal} onClose={() => !generating && setShowGeneratingModal(false)}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {generating ? (
            <>
              <CircularProgress sx={{ color: '#f59e0b', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Generating AI Picks...</Typography>
              <Typography variant="body2" color="text.secondary">
                Analyzing data and finding high probability picks
              </Typography>
            </>
          ) : (
            <>
              <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Picks Generated!</Typography>
              <Typography variant="body2" color="text.secondary">
                {hasPremiumAccess 
                  ? 'Premium: Unlimited generations available' 
                  : `${remainingGenerations} free generations left today`
                }
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowGeneratingModal(false)}
                sx={{ mt: 2, bgcolor: '#f59e0b' }}
              >
                View Results
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DailyPicksScreen;
