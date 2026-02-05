// src/pages/SecretPhraseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Avatar,
  CardActions,
  alpha,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  CopyAll as CopyIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Book as BookIcon,
  Lock as LockIcon
} from '@mui/icons-material';

// Mock data for fallback
const MOCK_PHRASES = [
  {
    id: '1',
    category: 'Betting Terminology',
    phrases: [
      { term: 'Sharp Money', definition: 'Money from professional bettors', example: 'When sharp money comes in on the underdog, the line often moves' },
      { term: 'Square', definition: 'Recreational or casual bettor', example: 'Squares often bet on favorites and popular teams' },
      { term: 'Juice/Vig', definition: 'Commission charged by the sportsbook', example: '-110 means you bet $110 to win $100' },
      { term: 'Steam Move', definition: 'Rapid line movement from heavy betting', example: 'The line moved from -3 to -5 due to steam' },
      { term: 'Middle', definition: 'Betting both sides to win regardless', example: 'Betting +3.5 and -2.5 creates a middle opportunity' }
    ]
  },
  {
    id: '2',
    category: 'NBA Analytics',
    phrases: [
      { term: 'PACE', definition: 'Possessions per 48 minutes', example: 'Teams with high PACE tend to score more points' },
      { term: 'TS%', definition: 'True Shooting Percentage', example: 'Accounts for 2PT, 3PT, and FT efficiency' },
      { term: 'PER', definition: 'Player Efficiency Rating', example: 'Single-number measure of player productivity' },
      { term: 'VORP', definition: 'Value Over Replacement Player', example: 'Measures total contribution vs replacement-level player' },
      { term: 'BPM', definition: 'Box Plus/Minus', example: 'Box score estimate of points contributed per 100 possessions' }
    ]
  },
  {
    id: '3',
    category: 'Bankroll Management',
    phrases: [
      { term: 'Unit', definition: 'Standard betting amount', example: '1 unit = 1% of total bankroll' },
      { term: 'Kelly Criterion', definition: 'Optimal bet sizing formula', example: 'Calculates bet size based on edge and odds' },
      { term: 'Risk of Ruin', definition: 'Probability of losing entire bankroll', example: 'Proper bet sizing reduces risk of ruin' },
      { term: 'Stop Loss', definition: 'Maximum daily/weekly loss limit', example: 'Set a 5-unit stop loss to prevent chasing' },
      { term: 'Win Rate', definition: 'Percentage of bets won', example: '55% win rate with -110 odds is profitable' }
    ]
  }
];

const SecretPhraseScreen = () => {
  const theme = useTheme();
  const [phrases, setPhrases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPhrases, setFilteredPhrases] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fetchSecretPhrases = async () => {
    console.log('🔍 Fetching secret phrases...');
    setLoading(true);
    setError(null);
    
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';
      const response = await fetch(`${apiBase}/api/secret/phrases`);
      const data = await response.json();
      
      console.log('✅ Secret phrases response:', data);
      
      if (data.success && data.phrases) {
        console.log(`✅ Using REAL secret phrases: ${data.phrases.length} categories`);
        
        // The API returns categories with nested phrases
        const transformed = data.phrases.map((category: any) => ({
          id: category.id,
          category: category.category,
          phrases: category.phrases || []
        }));
        
        setPhrases(transformed);
        setFilteredPhrases(transformed);
        
        window._secretPhrasesDebug = {
          rawApiResponse: data,
          transformedPhrases: transformed,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'Failed to load secret phrases');
      }
    } catch (error: any) {
      console.error('❌ Secret phrases error:', error);
      setError(error.message);
      // Fallback to mock data
      setPhrases(MOCK_PHRASES);
      setFilteredPhrases(MOCK_PHRASES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretPhrases();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPhrases(phrases);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = phrases.map(category => {
      const filteredPhrases = category.phrases.filter((phrase: any) => 
        phrase.term.toLowerCase().includes(lowerQuery) ||
        phrase.definition.toLowerCase().includes(lowerQuery)
      );
      
      if (filteredPhrases.length > 0) {
        return {
          ...category,
          phrases: filteredPhrases
        };
      }
      return null;
    }).filter(Boolean);

    setFilteredPhrases(filtered);
  };

  const getCategories = () => {
    const categories = ['All', ...phrases.map(cat => cat.category)];
    return Array.from(new Set(categories));
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      setFilteredPhrases(phrases);
    } else {
      const filtered = phrases.filter(cat => cat.category === category);
      setFilteredPhrases(filtered);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading secret phrases...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Secret Phrases</AlertTitle>
          {error}
          <Button onClick={fetchSecretPhrases} sx={{ mt: 1 }}>Retry</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PsychologyIcon fontSize="large" />
            <Typography variant="h4" fontWeight="bold">
              Secret Phrases & Terminology
            </Typography>
          </Box>
          <Box />
        </Box>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Insider terminology used by professional bettors and analysts
        </Typography>

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search terms or definitions..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
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
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSecretPhrases}
              >
                Refresh Terms
              </Button>
            </Grid>
          </Grid>
          
          {/* Category Filters */}
          {phrases.length > 0 && (
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getCategories().map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => handleCategorySelect(category)}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Secret Phrases Content */}
        {filteredPhrases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            {searchQuery ? (
              <>
                <Typography variant="h6" gutterBottom>
                  No terms found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search or filter
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  No secret phrases available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back for new terminology updates
                </Typography>
              </>
            )}
          </Paper>
        ) : (
          <Box>
            {filteredPhrases.map((category) => (
              <Accordion key={category.id} sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {category.category}
                    </Typography>
                    <Chip 
                      label={`${category.phrases.length} terms`}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {category.phrases.map((phrase: any, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6', mr: 2 }}>
                                <LightbulbIcon />
                              </Avatar>
                              <Typography variant="h6" fontWeight="bold">
                                {phrase.term}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {phrase.definition}
                            </Typography>
                            
                            {phrase.example && (
                              <>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Example: {phrase.example}
                                </Typography>
                              </>
                            )}
                          </CardContent>
                          <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                              size="small"
                              startIcon={<CopyIcon />}
                              onClick={() => navigator.clipboard.writeText(phrase.term)}
                            >
                              Copy Term
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Stats Card */}
        {phrases.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4, mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {phrases.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="secondary" gutterBottom>
                    {phrases.reduce((total, cat) => total + cat.phrases.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Terms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success.main" gutterBottom>
                    📚
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expert Knowledge
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default SecretPhraseScreen;
