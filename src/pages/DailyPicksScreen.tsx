// src/pages/DailyPicksScreen.tsx
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
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Alert,
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
  alpha
} from '@mui/material';
import {
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
  Shield,
  Bolt,
  Refresh,
  Close,
  Sparkles,
  EmojiEvents,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock Data
const MOCK_PICKS = [
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
  },
  {
    id: '4',
    player: 'Juan Soto',
    team: 'NYY',
    sport: 'MLB',
    pick: 'To Hit a Home Run',
    confidence: 73,
    odds: '+350',
    edge: '+11.3%',
    analysis: 'Soto batting .312 with 8 HR vs lefties. Pitcher allows 1.8 HR/9 to left-handed batters.',
    timestamp: 'Today, 7:05 PM ET',
    category: 'High Upside',
    probability: '34%',
    roi: '+45%',
    units: '1.5',
    requiresPremium: false,
  },
];

const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
};

const CATEGORY_COLORS = {
  'High Confidence': '#10b981',
  'Value Bet': '#3b82f6',
  'Lock Pick': '#f59e0b',
  'High Upside': '#8b5cf6',
  'AI Generated': '#ec4899'
};

const DailyPicksScreen = () => {
  const navigate = useNavigate();
  
  const [picks, setPicks] = useState(MOCK_PICKS);
  const [filteredPicks, setFilteredPicks] = useState(MOCK_PICKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [remainingGenerations, setRemainingGenerations] = useState(2);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  // Informative Text Box Component
  const InformativeTextBox = () => (
    <Card sx={{ 
      mb: 3,
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      color: 'white'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Info sx={{ mr: 1, fontSize: 24 }} />
          <Typography variant="h5" fontWeight="bold">
            Daily Picks Explained
          </Typography>
        </Box>
        
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 1, mt: 0.5 }} />
                <Typography variant="body2">
                  Daily picks are AI-curated selections with the highest probability of success
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <TrendingUp sx={{ color: '#3b82f6', mr: 1, mt: 0.5 }} />
                <Typography variant="body2">
                  Updated every 24 hours based on the latest odds and performance data
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Security sx={{ color: '#8b5cf6', mr: 1, mt: 0.5 }} />
                <Typography variant="body2">
                  Each pick includes detailed analysis, confidence scores, and expected value
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Bolt sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
                <Typography variant="body2">
                  Get 2 free daily picks - upgrade for unlimited access to all picks
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', textAlign: 'center' }}>
          Last updated: Today, 9:00 AM ET
        </Typography>
      </CardContent>
    </Card>
  );

  // Daily Pick Generator Component
  const DailyPickGenerator = () => {
    const [generatedToday, setGeneratedToday] = useState(false);
    const [generatedPicks, setGeneratedPicks] = useState([]);

    const generateSamplePicks = () => {
      return [
        {
          id: 1,
          type: 'High Confidence',
          sport: 'NBA',
          pick: 'Giannis Antetokounmpo Over 30.5 Points + 10.5 Rebounds',
          confidence: 94,
          odds: '+180',
          probability: '91%',
          expectedValue: '+12.4%',
          keyStat: '27.2% rebound rate vs opponent',
          trend: 'Double-double in 8 of last 10 games',
          timestamp: 'Today • 8:00 PM ET'
        },
        {
          id: 2,
          type: 'Value Play',
          sport: 'NFL',
          pick: 'Dak Prescott Over 275.5 Passing Yards',
          confidence: 86,
          odds: '-115',
          probability: '83%',
          expectedValue: '+8.7%',
          keyStat: 'Averaging 291.4 pass YPG at home',
          trend: 'Over 275 in 6 of last 7 home games',
          timestamp: 'Tonight • 8:20 PM ET'
        }
      ];
    };

    const handleGenerate = () => {
      const newPicks = generateSamplePicks();
      setGeneratedToday(true);
      setGeneratedPicks(newPicks);
      setGenerating(true);
      setShowGeneratingModal(true);
      
      setTimeout(() => {
        setGenerating(false);
      }, 2000);
    };

    return (
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#f59e0b20', mr: 2 }}>
                <CalendarToday sx={{ color: '#f59e0b' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">Daily Pick Generator</Typography>
                <Typography variant="body2" color="text.secondary">3 high-probability picks for today</Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              startIcon={generatedToday ? <CheckCircle /> : <AutoAwesome />}
              onClick={handleGenerate}
              disabled={generatedToday || generating}
              sx={{
                bgcolor: generatedToday ? '#6b7280' : '#f59e0b',
                '&:hover': {
                  bgcolor: generatedToday ? '#4b5563' : '#d97706'
                }
              }}
            >
              {generatedToday ? 'Generated Today' : 'Generate Daily Picks'}
            </Button>
          </Box>
          
          {generatedPicks.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {generatedPicks.map((pick) => (
                <Card key={pick.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={pick.type} 
                          size="small"
                          sx={{ 
                            bgcolor: `${CATEGORY_COLORS[pick.type] || '#6b7280'}20`,
                            color: CATEGORY_COLORS[pick.type] || '#6b7280',
                            fontWeight: 'bold'
                          }}
                        />
                        <Chip 
                          label={pick.sport} 
                          size="small"
                          sx={{ 
                            bgcolor: `${SPORT_COLORS[pick.sport]}20`,
                            color: SPORT_COLORS[pick.sport]
                          }}
                        />
                      </Box>
                      <Chip 
                        label={`${pick.confidence}%`}
                        size="small"
                        sx={{ 
                          bgcolor: pick.confidence >= 90 ? '#10b981' : pick.confidence >= 85 ? '#3b82f6' : '#f59e0b',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {pick.pick}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Win Probability</Typography>
                          <Typography variant="h6" fontWeight="bold">{pick.probability}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Odds</Typography>
                          <Typography variant="h6" fontWeight="bold">{pick.odds}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Expected Value</Typography>
                          <Typography variant="h6" fontWeight="bold" color="#10b981">
                            {pick.expectedValue}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {pick.keyStat}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip 
                        icon={<TrendingUp />}
                        label={pick.trend}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#059669' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {pick.timestamp}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No daily picks generated yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tap generate to create today's high-probability picks
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <CheckCircle sx={{ fontSize: 16, color: '#059669', mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              • Updated daily at 9 AM ET • AI-powered analysis • Different from prediction models
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRefreshing(false);
    } catch (error) {
      setRefreshing(false);
    }
  };

  const handleTrackPick = (pick) => {
    if (pick.requiresPremium && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Handle tracking logic here
    console.log('Tracking pick:', pick);
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
    
    setTimeout(() => {
      const newPick = {
        id: `gen-${Date.now()}`,
        player: 'AI Generated',
        team: 'AI',
        sport: 'Mixed',
        pick: 'Custom AI Daily Pick',
        confidence: 82,
        odds: '+180',
        edge: '+6.5%',
        analysis: `Generated by AI based on: "${customPrompt}". This pick focuses on daily value opportunities.`,
        timestamp: 'Just now',
        category: 'AI Generated',
        probability: '76%',
        roi: '+22%',
        units: '2.0',
        generatedFrom: customPrompt,
        requiresPremium: false,
      };
      
      setPicks([newPick, ...picks]);
      setCustomPrompt('');
      setGenerating(false);
      
      if (!hasPremiumAccess) {
        setRemainingGenerations(prev => Math.max(0, prev - 1));
      }
    }, 2000);
  };

  const renderPickCard = (pick) => {
    const isPremiumLocked = pick.requiresPremium && !hasPremiumAccess;
    
    return (
      <Card key={pick.id} sx={{ 
        mb: 3,
        borderLeft: 4,
        borderColor: CATEGORY_COLORS[pick.category] || '#6b7280'
      }}>
        <CardContent>
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
                    bgcolor: `${SPORT_COLORS[pick.sport]}20`,
                    color: SPORT_COLORS[pick.sport],
                    fontWeight: 'bold'
                  }}
                />
                {pick.category && (
                  <Chip 
                    label={pick.category}
                    size="small"
                    sx={{ 
                      bgcolor: `${CATEGORY_COLORS[pick.category]}20`,
                      color: CATEGORY_COLORS[pick.category],
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${pick.confidence}%`}
                sx={{ 
                  bgcolor: pick.confidence >= 90 ? '#10b981' : pick.confidence >= 80 ? '#3b82f6' : pick.confidence >= 70 ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
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
              onClick={() => handleTrackPick(pick)}
              size="small"
              sx={{
                bgcolor: '#f59e0b',
                '&:hover': {
                  bgcolor: '#d97706'
                }
              }}
            >
              Track
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 3, pt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              Daily Picks
            </Typography>
            <Typography variant="body1" color="text.secondary">
              High-probability selections for today
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Informative Text Box */}
      <InformativeTextBox />

      {/* Daily Pick Generator */}
      <DailyPickGenerator />

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search daily picks by player, team, or sport..."
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
              )
            }}
          />
        </Box>
        
        {/* Sport Filter */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['All', 'NBA', 'NFL', 'NHL', 'MLB'].map((sport) => (
            <Chip
              key={sport}
              label={sport}
              onClick={() => setSelectedSport(sport)}
              color={selectedSport === sport ? 'primary' : 'default'}
              variant={selectedSport === sport ? 'filled' : 'outlined'}
              sx={{ 
                bgcolor: selectedSport === sport && sport !== 'All' ? `${SPORT_COLORS[sport]}20` : undefined,
                borderColor: SPORT_COLORS[sport],
                color: selectedSport === sport && sport !== 'All' ? SPORT_COLORS[sport] : undefined
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Custom Prompt Generator */}
      <Paper sx={{ p: 2, mb: 3 }}>
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

      {/* Picks Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            🎯 Today's Top Picks
          </Typography>
          <Chip 
            label={`${filteredPicks.length} picks • ${remainingGenerations} free gens`}
            sx={{ bgcolor: 'grey.100' }}
          />
        </Box>
        
        {filteredPicks.length > 0 ? (
          filteredPicks.map(renderPickCard)
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchQuery ? 'No picks found' : 'No picks available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'Try a different search term' : 'Check back soon for new picks'}
            </Typography>
          </Paper>
        )}
      </Box>

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
