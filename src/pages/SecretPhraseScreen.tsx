// src/pages/SecretPhraseScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  CardActions,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  CopyAll as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  ContentCopy as ContentCopyIcon,
  Error as ErrorIcon,
  SportsSoccer as SoccerIcon,
  Casino as CasinoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

// Define types for our data
interface SecretPhrase {
  id: string;
  text: string;
  source: string;
  category: string;
  confidence: number;
  scraped_at?: string;
  url?: string;
}

interface SecretPhrasesResponse {
  success: boolean;
  phrases: SecretPhrase[];
  count: number;
  timestamp: string;
  sources: string[];
  scraped: boolean;
  message?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://pleasing-determination-production.up.railway.app';

const SecretPhraseScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [phrasesData, setPhrasesData] = useState<SecretPhrasesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecretPhrases = async (isRefetch = false) => {
    if (isRefetch) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/secret-phrases`);
      setPhrasesData(response.data);
    } catch (err: any) {
      console.error('Error fetching secret phrases:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load insights');
      // Set mock data as fallback
      setPhrasesData({
        success: true,
        phrases: generateMockPhrases(),
        count: 10,
        timestamp: new Date().toISOString(),
        sources: ['mock'],
        scraped: false,
        message: 'Using demo data due to API error'
      });
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    fetchSecretPhrases();
  }, []);

  const phrases = phrasesData?.phrases || [];
  const sources = phrasesData?.sources || ['mock'];

  // Filter and search logic
  const filteredByCategory = selectedCategory === 'all'
    ? phrases
    : phrases.filter((phrase) => phrase.category === selectedCategory);

  const filteredPhrases = searchQuery
    ? filteredByCategory.filter((phrase) =>
        phrase.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phrase.source.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredByCategory;

  const handleRefresh = () => {
    fetchSecretPhrases(true);
  };

  const handleCopyPhrase = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'insider_tip': return <VisibilityIcon />;
      case 'expert_prediction': return <TrendingUpIcon />;
      case 'ai_insight': return <LockIcon />;
      case 'trend': return <CasinoIcon />;
      case 'player_trend': return <SoccerIcon />;
      default: return <LightbulbIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'insider_tip': return 'primary';
      case 'expert_prediction': return 'success';
      case 'ai_insight': return 'warning';
      case 'trend': return 'info';
      case 'player_trend': return 'secondary';
      default: return 'default';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'success';
    if (confidence >= 70) return 'warning';
    return 'error';
  };

  const getCategories = () => {
    const categories = new Set(phrases.map((p) => p.category));
    return ['all', ...Array.from(categories)];
  };

  // Generate mock phrases for fallback
  const generateMockPhrases = (): SecretPhrase[] => {
    return [
      {
        id: 'mock-1',
        text: 'Home teams have covered 62% of spreads in division games this season',
        source: 'Statistical Analysis',
        category: 'trend',
        confidence: 78,
        scraped_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        text: 'Player X averages 28% more fantasy points in primetime games',
        source: 'Player Analytics',
        category: 'player_trend',
        confidence: 82,
        scraped_at: new Date().toISOString()
      },
      {
        id: 'mock-3',
        text: 'Over has hit in 8 of last 10 meetings between these teams',
        source: 'Historical Data',
        category: 'trend',
        confidence: 80,
        scraped_at: new Date().toISOString()
      },
      {
        id: 'mock-4',
        text: 'Unders are 7-1 when these teams play in temperatures below 40°F',
        source: 'Weather Analysis',
        category: 'insider_tip',
        confidence: 85,
        scraped_at: new Date().toISOString()
      },
      {
        id: 'mock-5',
        text: 'Teams coming off back-to-back road games are 3-12 ATS this month',
        source: 'Schedule Analysis',
        category: 'expert_prediction',
        confidence: 88,
        scraped_at: new Date().toISOString()
      }
    ];
  };

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>
            {phrasesData?.scraped === false ? 'Loading demo data...' : 'Loading insights...'}
          </Typography>
        </Box>
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
              Secret Phrases & Insights
            </Typography>
          </Box>
          <Box />
        </Box>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Insider tips, expert predictions, and AI-powered insights for sports betting
        </Typography>

        {/* Status Alert */}
        {phrasesData && (
          <Alert 
            severity={phrasesData.scraped ? "success" : "info"}
            sx={{ mb: 3 }}
          >
            <AlertTitle>
              {phrasesData.scraped ? '✅ Live Insights' : '⚠️ Demo Data'}
            </AlertTitle>
            <Typography variant="body2">
              {phrasesData.scraped 
                ? `Scraped from ${sources.join(', ')}`
                : 'Using sample data (scraping unavailable)'}
              {phrasesData.timestamp && ` • Updated ${format(new Date(phrasesData.timestamp), 'PPpp')}`}
              {phrasesData.message && ` • ${phrasesData.message}`}
            </Typography>
          </Alert>
        )}

        {error && !phrasesData?.success && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>API Error</AlertTitle>
            {error}
            <Button onClick={handleRefresh} sx={{ mt: 1 }}>Retry</Button>
          </Alert>
        )}

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search insights or sources..."
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
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {getCategories().map((category) => (
                    <MenuItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.replace(/_/g, ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
              >
                {isRefetching ? 'Refreshing...' : 'Refresh Insights'}
              </Button>
            </Grid>
          </Grid>
          
          {/* Source Badges */}
          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sources.includes('espn') && (
              <Chip
                icon={<BasketballIcon />}
                label="ESPN"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {sources.includes('sportsline') && (
              <Chip
                icon={<FootballIcon />}
                label="SportsLine"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            {sources.includes('ai') && (
              <Chip
                icon={<LockIcon />}
                label="AI Analysis"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {sources.includes('mock') && (
              <Chip
                label="Demo Data"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Box>
        </Paper>

        {/* Progress for Refetching */}
        {isRefetching && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Updating insights...
            </Typography>
          </Box>
        )}

        {/* Insights Grid */}
        {filteredPhrases.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <PsychologyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            {searchQuery || selectedCategory !== 'all' ? (
              <>
                <Typography variant="h6" gutterBottom>
                  No insights found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search or category filter
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  No insights available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try refreshing to load new insights
                </Typography>
              </>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredPhrases.map((phrase) => (
              <Grid item xs={12} sm={6} md={4} key={phrase.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Phrase Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Chip
                          icon={getCategoryIcon(phrase.category)}
                          label={phrase.category.replace(/_/g, ' ').toUpperCase()}
                          color={getCategoryColor(phrase.category) as any}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {phrase.source}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${phrase.confidence}%`}
                          color={getConfidenceColor(phrase.confidence) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Confidence
                        </Typography>
                      </Box>
                    </Box>

                    {/* Phrase Text */}
                    <Typography variant="body1" sx={{ 
                      fontStyle: 'italic',
                      p: 2,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      "{phrase.text}"
                    </Typography>

                    {/* Metadata */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {phrase.scraped_at && format(new Date(phrase.scraped_at), 'MMM d, h:mm a')}
                      </Typography>
                      
                      <Tooltip title={copiedId === phrase.id ? "Copied!" : "Copy insight"}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyPhrase(phrase.text, phrase.id)}
                        >
                          {copiedId === phrase.id ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>

                  {/* URL Link if Available */}
                  {phrase.url && (
                    <>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          href={phrase.url.startsWith('http') ? phrase.url : `https://${phrase.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<VisibilityIcon />}
                        >
                          View Source
                        </Button>
                      </CardActions>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Stats Footer */}
        {phrases.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4, mt: 4 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {phrases.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Insights
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="success" gutterBottom>
                    {Math.round(phrases.reduce((acc, p) => acc + p.confidence, 0) / phrases.length)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning" gutterBottom>
                    {new Set(phrases.map((p) => p.source)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sources
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info" gutterBottom>
                    {new Set(phrases.map((p) => p.category)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categories
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
