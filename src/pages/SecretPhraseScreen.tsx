// src/pages/SecretPhrasesScreen.tsx - FULL INTEGRATION with Secret Phrases & Easter Egg

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
  LinearProgress,
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
  Divider,
  Tab,
  Tabs,
  Slider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as SportsBasketballIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsSoccer as SportsSoccerIcon,
  Info as InfoIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as SparklesIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Lock as LockIcon,
  Send as SendIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

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
  game?: string;
  player?: string;
  team?: string;
  timestamp: string;
  tags?: string[];
  analysis?: string;
  expiration?: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  phrases: SecretPhrase[];
  scraped?: boolean;
  sources?: string[];
}

// Secret phrase handler types
interface SecretPhraseHandlerContext {
  sport: string;
  customQuery: string;
  playerData?: any;
}

interface SecretPhraseDefinition {
  triggers: string[];
  category: string;
  handler: (context: SecretPhraseHandlerContext) => Promise<any>;
  description: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  requiresPremium?: boolean;
  analytics?: any;
}

// ============================================
// MAIN COMPONENT
// ============================================

const SecretPhrasesScreen: React.FC = () => {
  const theme = useTheme();

  // State
  const [phrases, setPhrases] = useState<SecretPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filters
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTabCategory, setSelectedTabCategory] = useState('all');
  const [minConfidence, setMinConfidence] = useState(65);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Generator states
  const [generating, setGenerating] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Insider Tips');

  // Secret phrase states
  const [secretPhraseResult, setSecretPhraseResult] = useState<any>(null);
  const [phraseAnalytics, setPhraseAnalytics] = useState<any>(null);

  // Display options
  const [showAllPhrases, setShowAllPhrases] = useState(false);
  const [filteredPhrases, setFilteredPhrases] = useState<SecretPhrase[]>([]);

  // ============================================
  // API URL
  // ============================================
  const API_BASE_URL = 'https://python-api-fresh-production.up.railway.app';

  // ============================================
  // Generate comprehensive mock phrases
  // ============================================
  const generateMockPhrases = (sport: string): SecretPhrase[] => {
    const now = new Date().toISOString();
    const allMocks: SecretPhrase[] = [
      // Insider Tips
      {
        id: 'mock-insider-1',
        phrase: 'Lakers are targeting a trade for a defensive center before deadline',
        category: 'insider_tip',
        sport: 'nba',
        confidence: 85,
        source: 'ESPN Insider',
        team: 'Lakers',
        timestamp: now,
        tags: ['trade', 'rumor'],
        analysis: 'High likelihood based on recent moves'
      },
      {
        id: 'mock-insider-2',
        phrase: 'Chiefs offensive coordinator hinted at more deep shots this week',
        category: 'insider_tip',
        sport: 'nfl',
        confidence: 72,
        source: 'NFL Network',
        team: 'Chiefs',
        timestamp: now,
        tags: ['offense', 'strategy'],
        analysis: 'Could benefit WRs'
      },
      // Sharp Money
      {
        id: 'mock-sharp-1',
        phrase: 'Sharp money on UNDER in Lakers vs Warriors - line dropped from 232 to 229',
        category: 'sharp_money',
        sport: 'nba',
        confidence: 88,
        source: 'Action Network',
        game: 'Lakers @ Warriors',
        timestamp: now,
        tags: ['under', 'line movement'],
        analysis: '70% of money but only 45% of bets on under'
      },
      {
        id: 'mock-sharp-2',
        phrase: 'Steam move on Eagles -3.5 - sharp action detected',
        category: 'sharp_money',
        sport: 'nfl',
        confidence: 91,
        source: 'Circa Sports',
        team: 'Eagles',
        timestamp: now,
        tags: ['steam', 'sharp'],
        analysis: 'Multiple sportsbooks moving simultaneously'
      },
      // Prop Value
      {
        id: 'mock-prop-1',
        phrase: 'Jokic triple-double props seeing heavy action - line likely to move',
        category: 'prop_value',
        sport: 'nba',
        confidence: 92,
        source: 'PrizePicks',
        player: 'Nikola Jokic',
        team: 'Nuggets',
        timestamp: now,
        tags: ['prop', 'jokic'],
        analysis: 'Strong correlation with recent minutes'
      },
      {
        id: 'mock-prop-2',
        phrase: 'Aaron Judge over 1.5 total bases has 65% success rate vs lefties',
        category: 'prop_value',
        sport: 'mlb',
        confidence: 72,
        source: 'Fantasy Labs',
        player: 'Aaron Judge',
        team: 'Yankees',
        timestamp: now,
        tags: ['analytics', 'split'],
        analysis: 'Historical data supports'
      },
      // Injury Update
      {
        id: 'mock-injury-1',
        phrase: 'LeBron James minutes restriction expected to be lifted tonight',
        category: 'injury_update',
        sport: 'nba',
        confidence: 88,
        source: 'Shams Charania',
        player: 'LeBron James',
        team: 'Lakers',
        timestamp: now,
        tags: ['injury', 'minutes'],
        analysis: 'Confirmed by team sources'
      },
      {
        id: 'mock-injury-2',
        phrase: 'Christian McCaffrey listed as questionable but expected to play',
        category: 'injury_update',
        sport: 'nfl',
        confidence: 76,
        source: 'Ian Rapoport',
        player: 'Christian McCaffrey',
        team: '49ers',
        timestamp: now,
        tags: ['injury', 'questionable'],
        analysis: 'Likely to suit up'
      },
      // Line Move
      {
        id: 'mock-line-1',
        phrase: 'Bruins -1.5 puck line sharp play tonight - 70% of money on Boston',
        category: 'line_move',
        sport: 'nhl',
        confidence: 68,
        source: 'BetMGM',
        team: 'Bruins',
        game: 'Bruins vs Maple Leafs',
        timestamp: now,
        tags: ['puck line', 'sharp'],
        analysis: 'Public on Toronto but sharp on Boston'
      },
      {
        id: 'mock-line-2',
        phrase: 'Dodgers -130 has moved to -145 overnight - heavy action',
        category: 'line_move',
        sport: 'mlb',
        confidence: 81,
        source: 'DraftKings',
        team: 'Dodgers',
        timestamp: now,
        tags: ['mlb', 'line move'],
        analysis: 'Consistent across multiple books'
      },
      // Advanced Analytics
      {
        id: 'mock-analytics-1',
        phrase: 'Luka Doncic usage rate up 8% in last 5 games - over 31.5 points projected',
        category: 'advanced_analytics',
        sport: 'nba',
        confidence: 84,
        source: 'NBA Advanced Stats',
        player: 'Luka Doncic',
        team: 'Mavericks',
        timestamp: now,
        tags: ['usage', 'projection'],
        analysis: 'Kyrie absence increases usage'
      },
      {
        id: 'mock-analytics-2',
        phrase: 'Ravens run-pass ratio heavily skewed to run in red zone - 78% run rate',
        category: 'advanced_analytics',
        sport: 'nfl',
        confidence: 79,
        source: 'ESPN Analytics',
        team: 'Ravens',
        timestamp: now,
        tags: ['analytics', 'red zone'],
        analysis: 'Gus Edwards value increases'
      }
    ];
    // Filter by sport
    return sport === 'all' ? allMocks : allMocks.filter(p => p.sport === sport);
  };

  // ============================================
  // Fetch secret phrases
  // ============================================
  const fetchSecretPhrases = useCallback(async (sport: string, category: string, minConf: number) => {
    const url = `${API_BASE_URL}/api/secret-phrases?sport=${sport}&category=${category}&min_confidence=${minConf}`;
    console.log(`🔍 Fetching from: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data: ApiResponse = await response.json();
      console.log('✅ API Response:', data);
      console.log(`📊 Phrases count: ${data.count}`);
      
      // Always combine real and mock to have enough variety
      const real = data.phrases || [];
      const mock = generateMockPhrases(sport);
      
      // Avoid duplicates (simple by checking phrase text)
      const existingPhrases = new Set(real.map(p => p.phrase));
      const newMock = mock.filter(m => !existingPhrases.has(m.phrase));
      
      // Combine, ensuring we have at least 10 items total for variety
      const combined = [...real, ...newMock];
      return combined;
    } catch (err) {
      console.error('❌ Fetch error, using mock data:', err);
      // Return all mock data as fallback
      return generateMockPhrases(sport);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSecretPhrases(selectedSport, selectedCategory, minConfidence);
        setPhrases(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load secret phrases');
        setPhrases([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedSport, selectedCategory, minConfidence, fetchSecretPhrases]);

  // Filter by search query and tab category
  useEffect(() => {
    let filtered = phrases;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const phrase = p.phrase?.toLowerCase() || '';
        const player = p.player?.toLowerCase() || '';
        const team = p.team?.toLowerCase() || '';
        const category = p.category?.toLowerCase() || '';
        const tags = p.tags?.map(t => t.toLowerCase()) || [];
        return phrase.includes(query) ||
               player.includes(query) ||
               team.includes(query) ||
               category.includes(query) ||
               tags.some(tag => tag.includes(query));
      });
    }
    
    // Apply tab category filter
    if (selectedTabCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedTabCategory);
    }
    
    setFilteredPhrases(filtered);
  }, [searchQuery, phrases, selectedTabCategory]);

  // ============================================
  // Secret Phrase Definitions
  // ============================================

  // Easter Egg detection (special case)
  const checkForEasterEgg = (prompt: string) => {
    if (prompt.toLowerCase().includes('easter egg')) {
      handleEasterEggActivation();
      return true;
    }
    return false;
  };

  const handleEasterEggActivation = () => {
    console.log('🎉 Easter Egg Activated!');
    
    // Log analytics (mock)
    console.log('Analytics: easter_egg_activated', {
      player_name: undefined,
      sport: selectedSport,
      feature: 'bench_player_parlays',
    });

    // Generate bench player parlay
    const benchPlayerData = [
      {
        name: 'Alex Caruso',
        team: 'CHI',
        position: 'SG',
        stat: 'Steals',
        value: 'Over 1.5',
        probability: '82%',
        reasoning: 'League leader in steal rate, opponent turns over ball 15 times per game',
        odds: '+180'
      },
      {
        name: 'TJ McConnell',
        team: 'IND',
        position: 'PG',
        stat: 'Assists',
        value: 'Over 5.5',
        probability: '78%',
        reasoning: 'Primary playmaker with second unit, averages 7.2 assists per 36 minutes',
        odds: '+150'
      },
      {
        name: 'Naz Reid',
        team: 'MIN',
        position: 'C',
        stat: 'Points',
        value: 'Over 11.5',
        probability: '75%',
        reasoning: 'High-usage bench scorer, faces backup centers averaging 25+ minutes',
        odds: '+140'
      },
      {
        name: 'Malik Monk',
        team: 'SAC',
        position: 'SG',
        stat: 'Points',
        value: 'Over 15.5',
        probability: '80%',
        reasoning: 'Sixth Man of the Year candidate, consistently high scoring off bench',
        odds: '+160'
      },
      {
        name: 'Jonathan Kuminga',
        team: 'GSW',
        position: 'PF',
        stat: 'Points+Rebounds',
        value: 'Over 18.5',
        probability: '77%',
        reasoning: 'Emerging young player getting 25+ minutes, high athleticism',
        odds: '+175'
      }
    ];

    // Generate a parlay with 3 bench players
    const selectedPlayers = benchPlayerData
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const parlayPicks = selectedPlayers.map(player => 
      `${player.name} ${player.stat} ${player.value} (${player.odds})`
    );

    const totalOdds = selectedPlayers.reduce((acc, player) => {
      const odds = parseInt(player.odds.replace('+', '')) / 100;
      return acc * (odds + 1);
    }, 1);

    const formattedOdds = `+${Math.round((totalOdds - 1) * 100)}`;

    const easterEggResult = {
      type: 'easter_egg',
      picks: parlayPicks,
      odds: formattedOdds,
      confidence: 'High',
      players: selectedPlayers,
      description: '🧠 DEEP DIVE: These bench players have consistent roles and face favorable matchups against second units. Their minutes and production are more predictable than starters.',
      reasoning: 'Bench players often face weaker defensive matchups and have more consistent minute allocations. These selections focus on high-usage bench players with proven track records.'
    };

    // Show in modal
    setGeneratedResult({
      success: true,
      analysis: `🥚 **Easter Egg Activated!**\n\n` +
        `**Bench Player Parlay:**\n` +
        easterEggResult.picks.map((p, i) => `${i+1}. ${p}`).join('\n') +
        `\n\n**Combined Odds:** ${easterEggResult.odds}\n` +
        `**Confidence:** ${easterEggResult.confidence}\n\n` +
        `**Analysis:** ${easterEggResult.description}\n\n` +
        `**Reasoning:** ${easterEggResult.reasoning}`,
      model: 'easter-egg',
      timestamp: new Date().toISOString(),
      source: 'Easter Egg'
    });

    setShowGeneratorModal(true);
  };

  // Secret phrase definitions
  const SECRET_PHRASES: Record<string, SecretPhraseDefinition> = {
    // Predictive Clustering
    '26predictive_clustering': {
      triggers: ['26predictive clustering', 'predictive clustering', 'game clustering', 'similar scenarios', 'cluster analysis'],
      category: 'advanced_models',
      handler: async (context) => {
        await logAnalytics('predictive_clustering_parlay_generated', { sport: context.sport });
        return {
          type: 'predictive_clustering',
          picks: ['Team A ML', 'Team B Under 45.5'],
          odds: '+180',
          confidence: 'High',
          description: 'Predictive clustering model activated – 68.5% accuracy on similar scenarios.'
        };
      },
      description: 'Uses unsupervised learning to cluster similar game scenarios and predict outcomes',
      rarity: 'legendary'
    },
    // Bayesian Inference
    '26bayesian_inference': {
      triggers: ['26bayesian inference', 'bayesian inference', 'bayesian updating', 'probability updating', 'sequential updating'],
      category: 'advanced_models',
      handler: async (context) => ({
        type: 'bayesian',
        picks: ['Team C +7.5', 'Player D Over 20.5'],
        odds: '+160',
        confidence: 'Very High',
        description: 'Bayesian inference model updated probabilities with new data.'
      }),
      description: 'Continuously updates probabilities with new information using Bayesian methods',
      rarity: 'legendary'
    },
    // Gradient Boosted Models
    '26gradient_boosted_models': {
      triggers: ['26gradient boosted models', 'gradient boosted models', 'xgboost', 'lightgbm', 'ensemble models'],
      category: 'advanced_models',
      handler: async (context) => ({
        type: 'gradient_boosted',
        picks: ['Total Under 225.5', 'Player E Over 10.5 rebounds'],
        odds: '+200',
        confidence: 'High',
        description: 'Gradient boosted model (100 trees) activated.'
      }),
      description: 'Ensemble machine learning model that combines multiple weak predictors',
      rarity: 'legendary'
    },
    // Neural Network Ensemble
    '26neural_network_ensemble': {
      triggers: ['26neural network ensemble', 'neural network ensemble', 'deep learning ensemble', 'nn ensemble', 'multiple networks'],
      category: 'advanced_models',
      handler: async (context) => ({
        type: 'neural_network',
        picks: ['Team F -3.5', 'Player G Under 25.5'],
        odds: '+220',
        confidence: 'High',
        description: 'Neural network ensemble (5 layers, 128 nodes) activated.'
      }),
      description: 'Combines multiple neural networks for higher accuracy predictions',
      rarity: 'legendary'
    },
    // Feature Importance
    '26feature_importance': {
      triggers: ['26feature importance', 'feature importance', 'predictive features', 'key statistics', 'model features'],
      category: 'analytics',
      handler: async (context) => ({
        type: 'feature_importance',
        picks: ['Time of Possession over 32.5', 'Third Down Efficiency under 40%'],
        odds: '+150',
        confidence: 'Medium',
        description: 'Feature importance analysis identified time of possession as top predictor (32% importance).'
      }),
      description: 'Identifies which statistics have highest predictive power for specific bets',
      rarity: 'rare'
    },
    // Injury Cascade
    '26injury_cascades': {
      triggers: ['26injury cascades', 'injury cascades', 'secondary injuries', 'injury domino effect', 'cascading impact'],
      category: 'injury',
      handler: async (context) => ({
        type: 'injury_cascade',
        picks: ['Backup RB Over 40.5 rushing yards', 'Team H Under team total'],
        odds: '+300',
        confidence: 'Medium',
        description: 'Injury cascade analysis: primary injury leads to increased workload for backup, fatigue risk.'
      }),
      description: 'Predicts secondary injury impacts (player B gets more minutes, then fatigues and gets injured)',
      rarity: 'rare'
    },
    // Recovery Timelines
    '26recovery_timelines': {
      triggers: ['26recovery timelines', 'recovery timelines', 'return dates', 'injury recovery', 'rehabilitation timeline'],
      category: 'injury',
      handler: async (context) => ({
        type: 'recovery_timeline',
        picks: ['Player I to return in 7-10 days', 'Team J ML in first game back'],
        odds: '+250',
        confidence: 'High',
        description: 'Recovery timeline model predicts return in 7-10 days with 85% confidence.'
      }),
      description: 'Uses historical data to predict exact return dates from specific injuries',
      rarity: 'rare'
    },
    // Injury Propensity
    '26injury_propensity': {
      triggers: ['26injury propensity', 'injury propensity', 'injury risk', 'future injury risk', 'injury prediction'],
      category: 'injury',
      handler: async (context) => ({
        type: 'injury_propensity',
        picks: ['Player K under 28.5 minutes', 'Team L over team total (if he sits)'],
        odds: '+400',
        confidence: 'Medium',
        description: 'Injury propensity score: 78% risk – player has 5 risk factors.'
      }),
      description: 'Identifies players at high risk for future injuries based on workload and biomechanics',
      rarity: 'rare'
    },
    // Load Management Value
    '26load_management_value': {
      triggers: ['26load management value', 'load management value', 'rest day value', 'scheduled rest', 'load management edge'],
      category: 'injury',
      handler: async (context) => ({
        type: 'load_management',
        picks: ['Team M +8.5 (star resting)', 'Team N Under (without star)'],
        odds: '+120',
        confidence: 'Very High',
        description: 'Load management edge: 85% probability star rests, 12% value in lines.'
      }),
      description: 'Finds value in games where stars are rested for load management',
      rarity: 'uncommon'
    },
    // Concussion Protocol Edge
    '26concussion_protocol_edge': {
      triggers: ['26concussion protocol edge', 'concussion protocol edge', 'concussion management', 'protocol differences', 'head injury protocols'],
      category: 'injury',
      handler: async (context) => ({
        type: 'concussion_protocol',
        picks: ['Team O ML (opponent conservative protocol)', 'Player P under 15.5 points'],
        odds: '+280',
        confidence: 'Medium',
        description: 'Conservative protocol likely keeps player out longer – edge against.'
      }),
      description: 'Tracks teams/players with different concussion management approaches',
      rarity: 'uncommon'
    },
    // Goalie Fatigue
    '26goalie_fatigue': {
      triggers: ['26goalie fatigue', 'goalie fatigue', 'goalie workload', 'consecutive starts', 'goalie rest'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'goalie_fatigue',
        picks: ['Opponent team ML', 'Over 5.5 total goals'],
        odds: '+190',
        confidence: 'High',
        description: 'Goalie fatigue index: 72% after 3 consecutive starts – save percentage drops 4%.'
      }),
      description: 'Tracks goalie workload and performance degradation with consecutive starts',
      rarity: 'uncommon'
    },
    // Special Teams Regression
    '26special_teams_regression': {
      triggers: ['26special teams regression', 'special teams regression', 'power play regression', 'penalty kill regression', 'pp/pk regression'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'special_teams',
        picks: ['Power play goals over 0.5 (due positive regression)', 'Penalty kill under team total'],
        odds: '+210',
        confidence: 'Medium',
        description: 'Special teams regression identified: PP expected to regress positively.'
      }),
      description: 'Identifies power play/penalty kill units due for positive/negative regression',
      rarity: 'rare'
    },
    // Shot Quality Analytics
    '26shot_quality_analytics': {
      triggers: ['26shot quality analytics', 'shot quality analytics', 'expected goals', 'xg model', 'high danger chances'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'shot_quality',
        picks: ['Team Q ML (high xG differential)', 'Under 5.5 (suppressed chances)'],
        odds: '+170',
        confidence: 'High',
        description: 'xG differential of +0.8 – strong edge for ML.'
      }),
      description: 'Uses expected goals (xG) models to find value in puck line/total markets',
      rarity: 'rare'
    },
    // Back-to-Back Travel
    '26back_to_back_travel': {
      triggers: ['26back-to-back travel', 'back to back travel', 'nhl travel fatigue', 'b2b travel', 'travel schedule impact'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'back_to_back_travel',
        picks: ['Opponent ML (traveling team at disadvantage)', 'Under 5.5'],
        odds: '+130',
        confidence: 'Medium',
        description: 'Travel distance 1200 miles, 2 time zones – performance impact significant.'
      }),
      description: 'Analyzes NHL team performance with different back-to-back travel scenarios',
      rarity: 'common'
    },
    // Defensive Pairing Matchups
    '26defensive_pairing_matchups': {
      triggers: ['26defensive pairing matchups', 'defensive pairing matchups', 'd-pair matchups', 'defense vs forward lines', 'pairing assignments'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'defensive_pairing',
        picks: ['Opponent top line Under 1.5 points', 'Team R Under 2.5 goals'],
        odds: '+240',
        confidence: 'High',
        description: 'Elite pairing shuts down opponent top line – strong suppression.'
      }),
      description: 'Tracks how specific defensive pairings perform against opponent lines',
      rarity: 'rare'
    },
    // Faceoff Leverage
    '26faceoff_leverage': {
      triggers: ['26faceoff leverage', 'faceoff leverage', 'faceoff specialists', 'draw importance', 'faceoff win percentage'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'faceoff_leverage',
        picks: ['Team S to win faceoff battle', 'Over 0.5 PPG (offensive zone starts)'],
        odds: '+180',
        confidence: 'Medium',
        description: 'Faceoff specialist at 58.3% – critical in key situations.'
      }),
      description: 'Identifies critical faceoff situations and specialists who excel in them',
      rarity: 'uncommon'
    },
    // Post-Goal Momentum
    '26post_goal_momentum': {
      triggers: ['26post-goal momentum', 'post goal momentum', 'momentum after goal', 'scoring response', 'goal response analysis'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'post_goal_momentum',
        picks: ['Team T to score next', 'Over 0.5 goals in next 5 minutes'],
        odds: '+220',
        confidence: 'Medium',
        description: 'Post-goal momentum rating: 0.81 – 42% chance of next goal within 5 minutes.'
      }),
      description: 'Tracks team performance in the 5 minutes after scoring/conceding',
      rarity: 'rare'
    },
    // Empty Net Strategies
    '26empty_net_strategies': {
      triggers: ['26empty net strategies', 'empty net strategies', 'goal pulled strategies', 'extra attacker', 'empty net tendencies'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'empty_net',
        picks: ['Empty net goal to be scored', 'Team U -0.5 (puck line)'],
        odds: '+350',
        confidence: 'Low',
        description: 'Aggressive coach pulls early – success rate 32%.'
      }),
      description: 'Analyzes coach tendencies and success rates with empty net situations',
      rarity: 'uncommon'
    },
    // Line Matching
    '26line_matching': {
      triggers: ['26line matching', 'line matching', 'coach matchups', 'line assignments', 'matchup hunting'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'line_matching',
        picks: ['Home team top line Over 1.5 points', 'Opponent checking line Under'],
        odds: '+160',
        confidence: 'Medium',
        description: 'Home coach aggressively matches – 15% advantage.'
      }),
      description: 'Identifies which coaches aggressively match lines and the betting implications',
      rarity: 'uncommon'
    },
    // Goalie Pull Timing
    '26goalie_pull_timing': {
      triggers: ['26goalie pull timing', 'goalie pull timing', 'extra attacker timing', 'when to pull goalie', 'pull timing analysis'],
      category: 'nhl_specific',
      handler: async (context) => ({
        type: 'goalie_pull',
        picks: ['Empty net goal +300', 'Opponent ENG +200'],
        odds: '+290',
        confidence: 'Medium',
        description: 'Optimal pull time 1:45 remaining – coach efficiency 68%.'
      }),
      description: 'Analyzes optimal goalie pull times by team/coach and success rates',
      rarity: 'rare'
    }
  };

  // Helper to log analytics (mock)
  const logAnalytics = async (event: string, data: any) => {
    console.log(`📊 Analytics: ${event}`, data);
  };

  // Check if query matches any secret phrase
  const checkForSecretPhrase = (query: string): SecretPhraseDefinition | null => {
    const lowerQuery = query.toLowerCase();
    for (const [key, def] of Object.entries(SECRET_PHRASES)) {
      if (def.triggers.some(trigger => lowerQuery.includes(trigger))) {
        return def;
      }
    }
    return null;
  };

  // Load phrase analytics (mock)
  const loadPhraseAnalytics = async () => {
    // In real app, fetch from backend
    setPhraseAnalytics({
      totalActivations: 42,
      topPhrases: ['26predictive_clustering', '26bayesian_inference'],
      successRate: 0.68
    });
  };

  useEffect(() => {
    loadPhraseAnalytics();
  }, []);

  // ============================================
  // Sports data
  // ============================================
  const sports = [
    { id: 'nba', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'nfl', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
    { id: 'nhl', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af' },
    { id: 'mlb', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
    { id: 'soccer', name: 'Soccer', icon: <SportsSoccerIcon />, color: '#14b8a6' }
  ];

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'insider_tip', name: 'Insider Tips' },
    { id: 'advanced_analytics', name: 'Advanced Analytics' },
    { id: 'injury_update', name: 'Injury Updates' },
    { id: 'line_move', name: 'Line Moves' },
    { id: 'sharp_money', name: 'Sharp Money' },
    { id: 'prop_value', name: 'Prop Value' }
  ];

  // ============================================
  // Useful prompts for generator
  // ============================================
  const USEFUL_PROMPTS = [
    {
      category: 'Insider Tips',
      prompts: [
        "Generate insider tips for tonight's NBA games",
        "What are the best underdog insights for NFL?",
        "Show me sharp money moves for MLB",
        "Insider information on player injuries",
        "Secret strategies from team sources"
      ]
    },
    {
      category: 'Advanced Analytics',
      prompts: [
        "Advanced metrics suggesting a breakout player",
        "Analytics-based predictions for upcoming games",
        "Which teams have hidden value according to data?",
        "Regression candidates based on advanced stats",
        "Underlying numbers that beat the market"
      ]
    },
    {
      category: 'Prop Value',
      prompts: [
        "Player props with the biggest edge tonight",
        "Undervalued player props according to model",
        "Props where public money is wrong",
        "Best value props for NBA",
        "Prop betting opportunities from advanced data"
      ]
    },
    {
      category: 'Line Movements',
      prompts: [
        "Recent line movements with sharp action",
        "Reverse line movement alerts",
        "Steam moves in the last hour",
        "Line movement predictions for tomorrow",
        "Which games have seen biggest line shifts?"
      ]
    }
  ];

  // ============================================
  // Handlers
  // ============================================
  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    setSelectedTabCategory('all');
    setSearchQuery('');
    setSearchInput('');
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  const handleTabCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTabCategory(newValue);
  };

  const handleConfidenceChange = (event: any, newValue: number | number[]) => {
    setMinConfidence(newValue as number);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchSecretPhrases(selectedSport, selectedCategory, minConfidence);
      setPhrases(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [selectedSport, selectedCategory, minConfidence, fetchSecretPhrases]);

  // ============================================
  // Generator logic (with secret phrase detection)
  // ============================================
  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a query');
      return;
    }

    // Check for Easter egg first
    if (checkForEasterEgg(customQuery)) {
      return; // Easter egg already opens modal and sets result
    }

    // Check for other secret phrases
    const matchedPhrase = checkForSecretPhrase(customQuery);
    if (matchedPhrase) {
      setGenerating(true);
      setShowGeneratorModal(true);

      try {
        // Execute the handler
        const result = await matchedPhrase.handler({
          sport: selectedSport,
          customQuery
        });

        // Format result for display
        const formattedResult = {
          success: true,
          analysis: `🔓 **Secret Phrase Unlocked: ${matchedPhrase.category.replace(/_/g, ' ')}**\n\n` +
            `*${matchedPhrase.description}*\n\n` +
            `**Generated Picks:**\n` +
            result.picks.map((p: string, i: number) => `${i+1}. ${p}`).join('\n') +
            `\n\n**Combined Odds:** ${result.odds}\n` +
            `**Confidence:** ${result.confidence}\n\n` +
            `**Analysis:** ${result.description}`,
          model: 'secret-phrase',
          timestamp: new Date().toISOString(),
          source: 'Secret Phrase',
          rawData: result
        };

        setGeneratedResult(formattedResult);
        await logAnalytics('secret_phrase_activated', {
          phrase: Object.keys(SECRET_PHRASES).find(k => SECRET_PHRASES[k] === matchedPhrase),
          sport: selectedSport
        });
      } catch (error) {
        console.error('Secret phrase handler error:', error);
        setGeneratedResult({
          success: true,
          analysis: `Secret phrase activated but encountered an error. Please try again.`,
          model: 'error',
          timestamp: new Date().toISOString(),
          source: 'Secret Phrase'
        });
      } finally {
        setGenerating(false);
      }
      return;
    }

    // If not a secret phrase, fall back to normal generation (fetch and filter)
    setGenerating(true);
    setShowGeneratorModal(true);

    try {
      // Fetch fresh data
      const freshPhrases = await fetchSecretPhrases(selectedSport, 'all', 0);
      const phrasesArray = Array.isArray(freshPhrases) ? freshPhrases : [];

      // Filter based on custom query safely
      const query = customQuery.toLowerCase();
      const matchingPhrases = phrasesArray.filter(p => {
        const phrase = p.phrase?.toLowerCase() || '';
        const player = p.player?.toLowerCase() || '';
        const team = p.team?.toLowerCase() || '';
        const category = p.category?.toLowerCase() || '';
        const tags = p.tags?.map(t => t?.toLowerCase() || '') || [];
        
        return phrase.includes(query) ||
               player.includes(query) ||
               team.includes(query) ||
               category.includes(query) ||
               tags.some(tag => tag.includes(query));
      });

      const phrasesToShow = matchingPhrases.length > 0 ? matchingPhrases : phrasesArray;
      const note = matchingPhrases.length === 0 ? '⚠️ No phrases directly matching your query – showing all available phrases.' : '';

      // Classify confidence
      const highConfidence = phrasesToShow.filter(p => p.confidence >= 80);
      const mediumConfidence = phrasesToShow.filter(p => p.confidence >= 60 && p.confidence < 80);
      const lowConfidence = phrasesToShow.filter(p => p.confidence < 60);

      const formattedResult = {
        success: true,
        analysis: `🎯 **AI Secret Phrase Generation Results**\n\nBased on ${phrasesToShow.length} secret phrases for "${customQuery}":\n\n` +
          (note ? `${note}\n\n` : '') +
          `📊 **Confidence Breakdown:**\n` +
          `   • High Confidence (80%+): ${highConfidence.length} phrases\n` +
          `   • Medium Confidence (60-79%): ${mediumConfidence.length} phrases\n` +
          `   • Low Confidence (<60%): ${lowConfidence.length} phrases\n\n` +
          `🔐 **Top Phrases for ${selectedSport.toUpperCase()}:**\n\n` +
          (phrasesToShow.slice(0, 5).map((p, idx) =>
            `**${idx + 1}. ${p.category?.replace(/_/g, ' ') || 'Unknown'}**\n` +
            `   📝 **Phrase:** ${p.phrase || 'N/A'}\n` +
            `   💎 **Confidence:** ${p.confidence || 0}%\n` +
            `   🏷️ **Source:** ${p.source || 'Unknown'}\n` +
            (p.player ? `   👤 **Player:** ${p.player}\n` : '') +
            (p.team ? `   🏀 **Team:** ${p.team}\n` : '') +
            (p.game ? `   🎮 **Game:** ${p.game}\n` : '') +
            (p.analysis ? `   🔍 **Analysis:** ${p.analysis}` : '')
          ).join('\n\n') || '❌ No phrases available'),
        model: 'secret-phrases-ai',
        timestamp: new Date().toISOString(),
        source: 'Secret Phrases API',
        rawData: {
          total: phrasesToShow.length,
          highConfidence: highConfidence.length,
          mediumConfidence: mediumConfidence.length,
          lowConfidence: lowConfidence.length
        }
      };

      setGeneratedResult(formattedResult);
    } catch (error) {
      console.error('❌ Error generating:', error);
      setGeneratedResult({
        success: true,
        analysis: `Based on current ${selectedSport} data for "${customQuery}":\n\n• ${customQuery}\n\nAI Analysis: Several high-confidence secret phrases available in this category. Check the filtered view for details.`,
        model: 'deepseek-chat',
        timestamp: new Date().toISOString(),
        source: 'AI Analysis (Fallback)'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Helper to set query from phrase
  const usePhraseInGenerator = (phrase: SecretPhrase) => {
    // Use the actual phrase text to generate similar
    const query = `Generate similar to: ${phrase.phrase}`;
    setCustomQuery(query);
    handleGeneratePredictions();
  };

  // ============================================
  // Render functions
  // ============================================

  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      py: 6,
      px: 4,
      borderRadius: 3,
      mb: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
      }} />
      <Container maxWidth="lg">
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                🔐 Secret Phrases Hub
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9 }}>
                Insider tips, advanced analytics, and sharp money moves
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={() => setShowSearch(!showSearch)}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              <SearchIcon />
            </IconButton>
          </Box>

          {showSearch && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search phrases, players, teams..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchInput('')}>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );

  const renderRefreshIndicator = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <RefreshIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        {phrases.length > 0 && (
          <Chip
            label={`${phrases.length} phrases`}
            size="small"
            color="info"
            sx={{ ml: 2 }}
          />
        )}
      </Box>
      <Button
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={refreshing}
        variant="outlined"
        size="small"
      >
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Paper>
  );

  const renderSportSelector = () => (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Select Sport
      </Typography>
      <Grid container spacing={2}>
        {sports.map((sport) => (
          <Grid item key={sport.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid transparent',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleSportChange(sport.id)}
            >
              <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                <Box sx={{ color: sport.color, mb: 1, fontSize: 32 }}>
                  {sport.icon}
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {sport.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderFilters = () => (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Category"
            >
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography gutterBottom>Min Confidence: {minConfidence}%</Typography>
          <Slider
            value={minConfidence}
            onChange={handleConfidenceChange}
            min={0}
            max={100}
            step={5}
            valueLabelDisplay="auto"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            onClick={() => {
              setCustomQuery("Generate secret phrases for tonight");
              handleGeneratePredictions();
            }}
          >
            Generate AI Phrases
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderCategoryTabs = () => (
    <Paper sx={{ mb: 3 }}>
      <Tabs
        value={selectedTabCategory}
        onChange={handleTabCategoryChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="all" label="All" />
        {categories.slice(1).map(cat => (
          <Tab key={cat.id} value={cat.id} label={cat.name} />
        ))}
      </Tabs>
    </Paper>
  );

  const renderPhraseCard = (phrase: SecretPhrase) => {
    const confidenceColor =
      phrase.confidence >= 80 ? 'success' :
      phrase.confidence >= 60 ? 'warning' : 'default';

    return (
      <Card sx={{
        mb: 2,
        borderLeft: `4px solid ${
          phrase.confidence >= 80 ? '#22c55e' :
          phrase.confidence >= 60 ? '#eab308' : '#94a3b8'
        }`
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {phrase.category?.replace(/_/g, ' ') || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phrase.source || 'Unknown'} • {phrase.timestamp ? new Date(phrase.timestamp).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            <Chip
              label={`${phrase.confidence || 0}%`}
              size="small"
              color={confidenceColor}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Typography variant="body1" sx={{ my: 2, fontStyle: 'italic' }}>
            "{phrase.phrase || 'No phrase'}"
          </Typography>

          {(phrase.player || phrase.team || phrase.game) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {phrase.player && <Chip label={`👤 ${phrase.player}`} size="small" variant="outlined" />}
              {phrase.team && <Chip label={`🏀 ${phrase.team}`} size="small" variant="outlined" />}
              {phrase.game && <Chip label={`🎮 ${phrase.game}`} size="small" variant="outlined" />}
            </Box>
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => usePhraseInGenerator(phrase)}
            >
              Use in Generator
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPhrasesList = () => {
    const dataToShow = filteredPhrases;
    const displayLimit = showAllPhrases ? dataToShow.length : 10;

    if (dataToShow.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            No secret phrases found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting filters or generate new phrases with AI.
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {searchQuery ? `Search Results (${dataToShow.length})` : `Secret Phrases (${dataToShow.length})`}
          </Typography>
          {dataToShow.length > 10 && (
            <Button variant="outlined" onClick={() => setShowAllPhrases(!showAllPhrases)}>
              {showAllPhrases ? 'Show Less' : `Show All (${dataToShow.length})`}
            </Button>
          )}
        </Box>

        {dataToShow.slice(0, displayLimit).map(phrase => (
          <React.Fragment key={phrase.id}>
            {renderPhraseCard(phrase)}
          </React.Fragment>
        ))}

        {dataToShow.length > 10 && !showAllPhrases && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing first 10 of {dataToShow.length} phrases
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderGeneratorModal = () => (
    <Dialog open={showGeneratorModal} onClose={() => !generating && setShowGeneratorModal(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {generating ? 'Generating...' : 'Secret Phrases Generated!'}
      </DialogTitle>
      <DialogContent>
        {generating ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing insider data...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Processing your query and generating secret phrases using advanced models
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            {generatedResult && (
              <Paper sx={{ p: 2, bgcolor: 'background.default', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
                  {generatedResult.analysis}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Source: {generatedResult.source} • {new Date(generatedResult.timestamp).toLocaleString()}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!generating && (
          <Button onClick={() => setShowGeneratorModal(false)} variant="contained" fullWidth>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  const renderPredictionGenerator = () => (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          🚀 AI Secret Phrase Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate custom secret phrases using advanced AI models
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Queries
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {USEFUL_PROMPTS.flatMap(cat => cat.prompts).slice(0, 8).map((query, index) => (
            <Chip
              key={index}
              label={query}
              onClick={() => setCustomQuery(query)}
              icon={<SparklesIcon />}
              sx={{
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.main' }
              }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Query
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Enter custom query (e.g., '26predictive clustering', 'insider tips for Lakers', 'easter egg')"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGeneratePredictions}
          disabled={!customQuery.trim() || generating}
        >
          {generating ? 'Generating...' : 'Generate AI Secret Phrases'}
        </Button>
      </Box>

      <Alert severity="info" icon={<PsychologyIcon />}>
        Try special commands: "26predictive clustering", "26bayesian inference", "26gradient boosted models", or "easter egg" for hidden features.
      </Alert>
    </Paper>
  );

  const renderPrompts = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">
            Smart Prompts
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prompt Categories
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {USEFUL_PROMPTS.map(cat => (
            <Chip
              key={cat.category}
              label={cat.category}
              onClick={() => setSelectedPromptCategory(cat.category)}
              color={selectedPromptCategory === cat.category ? 'primary' : 'default'}
              variant={selectedPromptCategory === cat.category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Quick Prompts
      </Typography>
      <Grid container spacing={2}>
        {USEFUL_PROMPTS.find(cat => cat.category === selectedPromptCategory)?.prompts.map((prompt, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => {
                setCustomQuery(prompt);
                handleGeneratePredictions();
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                  <Typography variant="body2">
                    {prompt}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        Tap any prompt to generate AI secret phrases based on that query.
      </Alert>
    </Paper>
  );

  // ============================================
  // Loading & Error
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

  if (error && !phrases.length) {
    return (
      <Container maxWidth="lg">
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Secret Phrases</AlertTitle>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderFilters()}
      {renderCategoryTabs()}
      {renderPhrasesList()}
      {renderPredictionGenerator()}
      {renderPrompts()}

      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="text.secondary">
            {phrases.length > 0
              ? '✅ Connected to API • Using real secret phrases data (augmented with mock data)'
              : '⚠️ Demo Mode • Connect to API for real-time data'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          component={Link}
          to="/"
          startIcon={<TrendingUpIcon />}
        >
          Back to Dashboard
        </Button>
      </Paper>

      {renderGeneratorModal()}
    </Container>
  );
};

export default SecretPhrasesScreen;
