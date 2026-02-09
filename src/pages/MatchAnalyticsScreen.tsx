// src/pages/MatchAnalyticsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Avatar,
  Container,
  Badge,
  Tooltip,
  CircularProgress,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  SportsFootball,
  SportsBasketball,
  SportsHockey,
  CalendarToday,
  AccessTime,
  LocationOn,
  Tv,
  TrendingUp,
  BarChart,
  AttachMoney,
  Cloud,
  CompareArrows,
  Analytics,
  Scoreboard,
  Groups,
  EmojiEvents,
  Info,
  Lightbulb,
  ChevronRight,
  CheckCircle,
  RadioButtonChecked,
  Schedule,
  MoreHoriz,
  Close,
  Whatshot,
  Bolt,
  Psychology,
  TrendingUp as TrendingUpIcon,
  Newspaper as NewspaperIcon,
  Error as ErrorIcon,
  Update as UpdateIcon,
  People
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

// Import React Query hook
import { useOddsGames } from '../hooks/useUnifiedAPI';

// Mock Data
const MOCK_DATA = {
  nfl: {
    games: [
      {
        id: 1,
        homeTeam: { name: 'Chiefs', logo: 'KC', color: '#E31837' },
        awayTeam: { name: 'Ravens', logo: 'BAL', color: '#241773' },
        homeScore: 24,
        awayScore: 21,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 15, 2024',
        time: '3:00 PM EST',
        venue: 'Arrowhead Stadium',
        weather: 'Clear, 42°F',
        odds: { spread: '-3.5', total: '48.5' },
        broadcast: 'CBS',
        attendance: '78,000',
        quarter: 'Final'
      },
      {
        id: 2,
        homeTeam: { name: '49ers', logo: 'SF', color: '#AA0000' },
        awayTeam: { name: 'Packers', logo: 'GB', color: '#203731' },
        homeScore: 31,
        awayScore: 28,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 20, 2024',
        time: '6:30 PM EST',
        venue: 'Levi\'s Stadium',
        weather: 'Partly Cloudy, 48°F',
        odds: { spread: '-6.5', total: '51.5' },
        broadcast: 'FOX',
        attendance: '68,500',
        quarter: 'Final'
      },
      {
        id: 3,
        homeTeam: { name: 'Bills', logo: 'BUF', color: '#00338D' },
        awayTeam: { name: 'Bengals', logo: 'CIN', color: '#FB4F14' },
        homeScore: 27,
        awayScore: 24,
        status: 'Live',
        sport: 'NFL',
        date: 'Today',
        time: '4:25 PM EST',
        venue: 'Highmark Stadium',
        weather: 'Snow, 28°F',
        odds: { spread: '-2.5', total: '47.5' },
        broadcast: 'NBC',
        attendance: '71,000',
        quarter: 'Q3 8:45'
      }
    ]
  },
  nba: {
    games: [
      {
        id: 4,
        homeTeam: { name: 'Lakers', logo: 'LAL', color: '#552583' },
        awayTeam: { name: 'Warriors', logo: 'GSW', color: '#1D428A' },
        homeScore: 115,
        awayScore: 112,
        status: 'Final',
        sport: 'NBA',
        date: 'Jan 18, 2024',
        time: '10:00 PM EST',
        venue: 'Crypto.com Arena',
        weather: 'Indoor',
        odds: { spread: '+3.5', total: '228.5' },
        broadcast: 'TNT',
        attendance: '18,997',
        quarter: 'Final'
      },
      {
        id: 5,
        homeTeam: { name: 'Celtics', logo: 'BOS', color: '#007A33' },
        awayTeam: { name: 'Heat', logo: 'MIA', color: '#98002E' },
        homeScore: 108,
        awayScore: 104,
        status: 'Final',
        sport: 'NBA',
        date: 'Jan 19, 2024',
        time: '7:30 PM EST',
        venue: 'TD Garden',
        weather: 'Indoor',
        odds: { spread: '-5.5', total: '222.5' },
        broadcast: 'ESPN',
        attendance: '19,156',
        quarter: 'Final'
      },
      {
        id: 6,
        homeTeam: { name: 'Bucks', logo: 'MIL', color: '#00471B' },
        awayTeam: { name: 'Suns', logo: 'PHX', color: '#1D1160' },
        homeScore: 122,
        awayScore: 118,
        status: 'Live',
        sport: 'NBA',
        date: 'Today',
        time: '8:00 PM EST',
        venue: 'Fiserv Forum',
        weather: 'Indoor',
        odds: { spread: '-3.5', total: '235.5' },
        broadcast: 'TNT',
        attendance: '17,341',
        quarter: 'Q4 3:15'
      }
    ]
  }
};

const PROMPT_SUGGESTIONS = [
  { text: "Live NFL games", icon: <Bolt />, color: '#ef4444' },
  { text: "NBA scores today", icon: <SportsBasketball />, color: '#f59e0b' },
  { text: "Upcoming matches", icon: <CalendarToday />, color: '#10b981' },
  { text: "Team stats comparison", icon: <BarChart />, color: '#3b82f6' },
];

const TABS = [
  { id: 'conditions', label: 'Conditions', icon: <Cloud /> },
  { id: 'h2h', label: 'H2H Stats', icon: <CompareArrows /> },
  { id: 'matchup', label: 'Matchup', icon: <Analytics /> },
  { id: 'boxscore', label: 'Box Score', icon: <Scoreboard /> },
  { id: 'teamstats', label: 'Team Stats', icon: <BarChart /> },
  { id: 'plays', label: 'Key Plays', icon: <Whatshot /> },
];

const PROMPTS = [
  { id: 'weather', icon: <Cloud />, title: 'Weather Impact', color: '#3b82f6', description: 'How weather affects gameplay' },
  { id: 'homeAway', icon: <LocationOn />, title: 'Home/Away Trends', color: '#10b981', description: 'Venue performance analysis' },
  { id: 'playerMatchup', icon: <Groups />, title: 'Player Matchup', color: '#ef4444', description: 'Key player comparisons' },
  { id: 'recentForm', icon: <TrendingUpIcon />, title: 'Recent Form', color: '#f59e0b', description: 'Team performance trends' },
  { id: 'injury', icon: <EmojiEvents />, title: 'Injury Report', color: '#8b5cf6', description: 'Injury impact assessment' },
  { id: 'predictive', icon: <Psychology />, title: 'Predictive Stats', color: '#ec4899', description: 'Win probability & projections' },
];

const STATS_DATA = [
  { label: 'Total Yards', home: 385, away: 320, icon: <CompareArrows /> },
  { label: 'Passing Yards', home: 265, away: 210, icon: <TrendingUp /> },
  { label: 'Rushing Yards', home: 120, away: 110, icon: <TrendingUp /> },
  { label: 'Turnovers', home: 1, away: 2, icon: <BarChart /> },
  { label: 'Time of Possession', home: '32:15', away: '27:45', icon: <AccessTime /> },
  { label: 'First Downs', home: 22, away: 18, icon: <BarChart /> },
  { label: 'Third Down %', home: '45%', away: '38%', icon: <TrendingUp /> },
  { label: 'Red Zone %', home: '75%', away: '60%', icon: <LocationOn /> },
];

// Helper functions
const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const getTeamColor = (teamName: string): string => {
  if (!teamName) return '#3b82f6';
  
  const teamColors: Record<string, string> = {
    // NBA Teams
    'LAL': '#552583', 'GSW': '#1D428A', 'BOS': '#007A33', 'MIA': '#98002E',
    'MIL': '#00471B', 'PHX': '#1D1160', 'DEN': '#0E2240', 'PHI': '#006BB6',
    'BKN': '#000000', 'NYK': '#006BB6', 'CHI': '#CE1141', 'LAC': '#C8102E',
    'DAL': '#00538C', 'ATL': '#C8102E', 'CLE': '#860038', 'MEM': '#5D76A9',
    'MIN': '#0C2340', 'NOP': '#0C2340', 'OKC': '#007AC1', 'ORL': '#0077C0',
    'POR': '#E03A3E', 'SAC': '#5A2D81', 'SAS': '#C4CED4', 'TOR': '#CE1141',
    'UTA': '#002B5C', 'WAS': '#002B5C', 'HOU': '#CE1141', 'CHA': '#1D1160',
    'DET': '#C8102E', 'IND': '#002D62',
    // NFL Teams (only those not already in NBA)
    'KC': '#E31837', 'BAL': '#241773', 'SF': '#AA0000', 'GB': '#203731',
    'BUF': '#00338D', 'CIN': '#FB4F14', 'TEN': '#4B92DB', 'JAX': '#006778',
    'LV': '#000000', 'SEA': '#002244', 'ARI': '#97233F', 'LAR': '#003594',
    'CAR': '#0085CA', 'NO': '#D3BC8D', 'TB': '#D50A0A', 'NYJ': '#125740',
    'PIT': '#FFB612', 'NE': '#002244'
  };
  
  // Try to match by abbreviation (first 2-3 characters)
  const abbr = teamName.substring(0, 3).toUpperCase();
  const abbr2 = teamName.substring(0, 2).toUpperCase();
  
  return teamColors[abbr] || teamColors[abbr2] || '#3b82f6'; // Default blue
};

const getGameStatus = (status: string): string => {
  if (!status) return 'Scheduled';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('live') || statusLower.includes('in') || statusLower === 'live') return 'Live';
  if (statusLower.includes('final') || statusLower.includes('complete') || statusLower === 'final') return 'Final';
  return 'Scheduled';
};

const getQuarter = (status: string): string => {
  if (!status) return 'Scheduled';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('live') || statusLower === 'live') {
    const quarters = ['Q1 10:00', 'Q2 5:30', 'Q3 8:45', 'Q4 3:15'];
    return randomChoice(quarters);
  }
  if (statusLower.includes('final') || statusLower === 'final') return 'Final';
  return 'Scheduled';
};

const extractTeamName = (teamStr: string): string => {
  if (!teamStr) return 'Unknown';
  
  // Remove common prefixes/suffixes
  const cleanStr = teamStr
    .replace(/^[A-Z]{2,3}\s+/, '') // Remove team abbreviations at start
    .replace(/\s+\([A-Z]{2,3}\)$/, '') // Remove abbreviations in parentheses at end
    .trim();
  
  return cleanStr || teamStr;
};

const extractTeamAbbreviation = (teamStr: string): string => {
  if (!teamStr) return '???';
  
  // Common NBA team abbreviations
  const teamAbbreviations: Record<string, string> = {
    'lakers': 'LAL', 'warriors': 'GSW', 'celtics': 'BOS', 'heat': 'MIA',
    'bucks': 'MIL', 'suns': 'PHX', 'nuggets': 'DEN', '76ers': 'PHI',
    'nets': 'BKN', 'knicks': 'NYK', 'bulls': 'CHI', 'clippers': 'LAC',
    'mavericks': 'DAL', 'hawks': 'ATL', 'cavaliers': 'CLE', 'grizzlies': 'MEM',
    'timberwolves': 'MIN', 'pelicans': 'NOP', 'thunder': 'OKC', 'magic': 'ORL',
    'trail blazers': 'POR', 'kings': 'SAC', 'spurs': 'SAS', 'raptors': 'TOR',
    'jazz': 'UTA', 'wizards': 'WAS', 'rockets': 'HOU', 'hornets': 'CHA',
    'pistons': 'DET', 'pacers': 'IND'
  };
  
  const teamLower = teamStr.toLowerCase();
  
  // Check for exact matches
  for (const [key, value] of Object.entries(teamAbbreviations)) {
    if (teamLower.includes(key)) {
      return value;
    }
  }
  
  // Fallback: use first 3 letters
  return teamStr.substring(0, 3).toUpperCase();
};

const MatchAnalyticsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the prize picks hook instead of analytics
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb'>('nba');
  
  const { 
    data: prizePicksData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = usePrizePicksSelections(selectedSport);
  
  // Extract selections and convert them to "games"
  const selectionsFromApi = prizePicksData?.selections || [];
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('conditions');
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  
  // Transform prize picks selections into game data
  const games = React.useMemo(() => {
    if (selectionsFromApi && selectionsFromApi.length > 0) {
      console.log(`✅ Using REAL data from prize picks: ${selectionsFromApi.length} selections`);
      
      // Create a map of games from player selections
      const gameMap = new Map();
      
      selectionsFromApi.forEach((selection: any, index: number) => {
        try {
          // Extract team and opponent - handle different field names
          const playerTeamRaw = selection.team || selection.teamAbbrev || selection.team_full || 'Unknown';
          const playerTeam = extractTeamName(playerTeamRaw);
          
          // Extract opponent from game field - handle different formats
          let opponent = 'Opponent';
          const gameField = selection.game || selection.opponent || '';
          if (gameField) {
            if (gameField.includes(' vs ')) {
              const parts = gameField.split(' vs ');
              opponent = extractTeamName(parts[1] || parts[0] || 'Opponent');
            } else if (gameField.includes(' @ ')) {
              const parts = gameField.split(' @ ');
              opponent = extractTeamName(parts[1] || parts[0] || 'Opponent');
            } else if (gameField.includes(' at ')) {
              const parts = gameField.split(' at ');
              opponent = extractTeamName(parts[1] || parts[0] || 'Opponent');
            } else {
              opponent = extractTeamName(gameField);
            }
          }
          
          // Get team abbreviations
          const homeAbbr = extractTeamAbbreviation(playerTeam);
          const awayAbbr = extractTeamAbbreviation(opponent);
          
          const gameKey = `${homeAbbr} vs ${awayAbbr}`;
          
          if (!gameMap.has(gameKey)) {
            // Create a game from selection data
            gameMap.set(gameKey, {
              id: `game-${homeAbbr}-${awayAbbr}-${index}`,
              homeTeam: { 
                name: playerTeam, 
                logo: homeAbbr, 
                color: getTeamColor(playerTeam)
              },
              awayTeam: { 
                name: opponent, 
                logo: awayAbbr, 
                color: getTeamColor(opponent)
              },
              homeScore: Math.floor(Math.random() * 30) + 80,
              awayScore: Math.floor(Math.random() * 30) + 80,
              status: getGameStatus(selection.status),
              sport: selection.sport || selectedSport.toUpperCase(),
              date: format(new Date(), 'MMM dd, yyyy'),
              time: `${Math.floor(Math.random() * 12) + 1}:${randomChoice(['00', '30'])} PM EST`,
              venue: `${playerTeam} Arena`,
              weather: randomChoice(['Clear, 72°F', 'Partly Cloudy, 68°F', 'Indoor']),
              odds: { 
                spread: `${randomChoice(['+', '-'])}${Math.floor(Math.random() * 7) + 1}.5`,
                total: `${Math.floor(Math.random() * 30) + 210}`
              },
              broadcast: randomChoice(['TNT', 'ESPN', 'ABC', 'NBA TV']),
              attendance: `${Math.floor(Math.random() * 5000) + 15000}`,
              quarter: getQuarter(selection.status),
              players: [selection.player],
              // Store selection data for reference
              selectionData: [selection],
              // Store raw data for debugging
              rawGameData: selection.game
            });
          } else {
            // Add player to existing game
            const existingGame = gameMap.get(gameKey);
            if (!existingGame.players.includes(selection.player)) {
              existingGame.players.push(selection.player);
              existingGame.selectionData.push(selection);
            }
          }
        } catch (err) {
          console.warn('Error processing selection:', err, selection);
        }
      });
      
      // Convert map to array
      const gamesFromSelections = Array.from(gameMap.values());
      
      // If we have real games, use them
      if (gamesFromSelections.length > 0) {
        console.log(`🎮 Created ${gamesFromSelections.length} games from selections`);
        return gamesFromSelections;
      }
    }
    
    // Fallback to mock data
    console.log('⚠️ Using mock analytics data');
    return MOCK_DATA[selectedSport as keyof typeof MOCK_DATA]?.games || MOCK_DATA.nfl.games;
    
  }, [selectionsFromApi, selectedSport]);

  // Set initial selected game
  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0]);
    }
  }, [games]);

  // Filter games based on search
  useEffect(() => {
    if (searchInput.trim()) {
      const results = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredGames(results);
    } else {
      setFilteredGames([]);
    }
  }, [searchInput, games]);

  const handleSearchSubmit = (query: string | null = null) => {
    const searchText = query || searchInput.trim();
    if (searchText) {
      setSearchQuery(searchText);
      const results = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(searchText.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchText.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredGames(results);
    }
  };

  const handleSearch = (query: string) => {
    setSearchInput(query);
    if (!query.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
    // Update selected sport based on the selected game
    const sport = game.sport.toLowerCase();
    if (sport === 'nba' || sport === 'nfl' || sport === 'mlb') {
      setSelectedSport(sport);
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId as 'nba' | 'nfl' | 'mlb');
    // Reset selected game when sport changes
    setSelectedGame(null);
  };

  const generateAIAnalysis = async (promptType: string) => {
    setLoadingAI(true);
    setShowAIModal(true);
    
    // Get selection data for the selected game
    const selectionData = selectedGame?.selectionData || [];
    
    setTimeout(() => {
      let analysis = '';
      
      switch(promptType) {
        case 'weather':
          analysis = `**Weather Impact Analysis**\n\n**Game:** ${selectedGame?.homeTeam?.name || 'Home'} vs ${selectedGame?.awayTeam?.name || 'Away'}\n**Weather:** ${selectedGame?.weather || 'Clear'}\n\n**Impact Analysis:**\n• Temperature: 72°F - Optimal for basketball\n• Indoor arena - No weather impact\n• Home court advantage: +3.5 points`;
          break;
          
        case 'playerMatchup':
          if (selectionData.length > 0) {
            const topPlayers = selectionData.slice(0, 3).map((sel: any) => {
              const playerName = sel.player || 'Unknown Player';
              const teamName = sel.team || 'Unknown Team';
              const statType = sel.stat_type || sel.stat || 'stat';
              const line = sel.line || 'N/A';
              const projection = sel.projection || 'N/A';
              const edge = sel.edge ? `${sel.edge}%` : 'N/A';
              
              return `${playerName} (${teamName}): ${statType} ${line} (Projection: ${projection}, Edge: ${edge})`;
            }).join('\n• ');
            
            analysis = `**Player Matchup Analysis**\n\n**Key Players in this game:**\n• ${topPlayers}\n\n**Analysis:** These players have the highest projection edges based on recent performance.`;
          } else {
            analysis = `**Player Matchup Analysis**\n\nNo specific player data available for this matchup.`;
          }
          break;
          
        case 'predictive':
          if (selectionData.length > 0) {
            const edges = selectionData.map((sel: any) => {
              if (sel.edge && typeof sel.edge === 'number') return sel.edge;
              if (sel.projection_edge && typeof sel.projection_edge === 'number') return sel.projection_edge * 100;
              return 0;
            });
            
            const avgEdge = edges.length > 0 
              ? edges.reduce((sum: number, edge: number) => sum + edge, 0) / edges.length 
              : 0;
            
            const winProb = Math.min(70 + avgEdge, 85).toFixed(1);
            
            analysis = `**Predictive Statistics**\n\n**Based on ${selectionData.length} player selections:**\n• Average Edge: ${avgEdge.toFixed(1)}%\n• Home Win Probability: ${winProb}%\n• Expected Total Points: ${selectedGame?.odds?.total || '225.5'}\n\n**Key Insight:** ${avgEdge > 5 ? 'Positive value detected in player projections' : 'Market appears efficient'}`;
          } else {
            analysis = `**Predictive Statistics**\n\n**Win Probability:**\n• Home: 62%\n• Away: 38%\n\n**Expected Score:**\n• Home: 112.3 points\n• Away: 108.1 points`;
          }
          break;
          
        case 'recentForm':
          analysis = `**Recent Form Analysis**\n\n**${selectedGame?.homeTeam?.name || 'Home'} (Last 10):**\n• Record: 7-3\n• Avg Points: 118.4\n• Defensive Rating: 110.2\n\n**${selectedGame?.awayTeam?.name || 'Away'} (Last 10):**\n• Record: 6-4\n• Avg Points: 115.8\n• Defensive Rating: 112.7`;
          break;
          
        case 'injury':
          analysis = `**Injury Impact Assessment**\n\n**${selectedGame?.homeTeam?.name || 'Home'} Injuries:**\n• Starting SF (questionable)\n• Backup PG (out)\n\n**${selectedGame?.awayTeam?.name || 'Away'} Injuries:**\n• Starting C (probable)\n• 6th Man (out)\n\n**Overall Impact:** Moderate - favors home team`;
          break;
          
        case 'homeAway':
          analysis = `**Home/Away Trends**\n\n**${selectedGame?.homeTeam?.name || 'Home'} at Home:**\n• Win Rate: 75%\n• Points/Game: 116.8\n• Defensive Rank: 5th\n\n**${selectedGame?.awayTeam?.name || 'Away'} on Road:**\n• Win Rate: 45%\n• Points/Game: 112.3\n• Defensive Rank: 12th`;
          break;
          
        default:
          analysis = `**${PROMPTS.find(p => p.id === promptType)?.title || 'Analysis'}**\n\nDetailed analysis for ${selectedGame?.homeTeam?.name || 'Home'} vs ${selectedGame?.awayTeam?.name || 'Away'}\n\nBased on real player data and projections.`;
      }
      
      setAiResponse(analysis);
      setLoadingAI(false);
    }, 1500);
  };

  const renderTabContent = () => {
    if (!selectedGame) return null;
    
    switch(activeTab) {
      case 'conditions':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Cloud sx={{ color: '#3b82f6', mr: 1 }} />
                    <Typography variant="h6">Weather Conditions</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedGame.weather}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Optimal playing conditions expected
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ color: '#10b981', mr: 1 }} />
                    <Typography variant="h6">Venue Details</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedGame.venue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {selectedGame.attendance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Surface: Hardwood
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 'h2h':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Head-to-Head Stats</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">3</Typography>
                  <Typography variant="body2" color="text.secondary">Home Wins</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.secondary">VS</Typography>
                  <Typography variant="body2" color="text.secondary">Last 5 meetings</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">2</Typography>
                  <Typography variant="body2" color="text.secondary">Away Wins</Typography>
                </Box>
              </Box>
              <Alert severity="info">
                Home team has won 4 of the last 5 meetings
              </Alert>
            </CardContent>
          </Card>
        );
      case 'matchup':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Key Matchup Analysis</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedGame.homeTeam?.name || 'Home'} Advantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li><Typography variant="body2">Three-point shooting</Typography></li>
                      <li><Typography variant="body2">Fast break points</Typography></li>
                      <li><Typography variant="body2">Rebounding</Typography></li>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedGame.awayTeam?.name || 'Away'} Advantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li><Typography variant="body2">Defensive efficiency</Typography></li>
                      <li><Typography variant="body2">Turnover creation</Typography></li>
                      <li><Typography variant="body2">Free throw percentage</Typography></li>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Detailed Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  In-depth {activeTab} analysis is available with premium access
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/subscription')}
                >
                  View Premium Analysis
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'Live':
        return (
          <Chip
            icon={<RadioButtonChecked />}
            label="LIVE"
            size="small"
            sx={{ 
              bgcolor: '#ef4444', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
      case 'Final':
        return (
          <Chip
            icon={<CheckCircle />}
            label="FINAL"
            size="small"
            sx={{ 
              bgcolor: '#10b981', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
      default:
        return (
          <Chip
            icon={<Schedule />}
            label={status}
            size="small"
            sx={{ 
              bgcolor: '#f59e0b', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
    }
  };

  const GameCard = ({ game, isSelected = false, onSelect }: { game: any; isSelected?: boolean; onSelect: (game: any) => void }) => {
    const homeTeam = game.homeTeam || { name: 'Home', logo: 'H', color: '#3b82f6' };
    const awayTeam = game.awayTeam || { name: 'Away', logo: 'A', color: '#ef4444' };
    
    return (
      <Card 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
        onClick={() => onSelect(game)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ 
                bgcolor: homeTeam.color,
                width: 32,
                height: 32,
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                {homeTeam.logo}
              </Avatar>
              <Typography variant="body2" fontWeight="medium">
                {homeTeam.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">vs</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {awayTeam.name}
              </Typography>
              <Avatar sx={{ 
                bgcolor: awayTeam.color,
                width: 32,
                height: 32,
                fontSize: 14,
                fontWeight: 'bold'
              }}>
                {awayTeam.logo}
              </Avatar>
            </Box>
          </Box>
          
          {/* Show player count if available */}
          {game.players && game.players.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
              <People sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {game.players.length} player{game.players.length !== 1 ? 's' : ''}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {game.date || 'Today'}
              </Typography>
            </Box>
            {renderStatusBadge(game.status || 'Scheduled')}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading game analytics...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pt: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            Game Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live scores, stats, and in-depth analysis
            {selectionsFromApi.length > 0 && (
              <Chip 
                label={`${selectionsFromApi.length} real player selections`} 
                size="small" 
                color="success" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        {/* Sport Selector */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sport</InputLabel>
          <Select
            value={selectedSport}
            label="Sport"
            onChange={(e) => handleSportChange(e.target.value)}
          >
            <MenuItem value="nba">NBA</MenuItem>
            <MenuItem value="nfl">NFL</MenuItem>
            <MenuItem value="mlb">MLB</MenuItem>
          </Select>
        </FormControl>
        
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Failed to load game analytics
          </Typography>
          <Typography variant="body2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefresh}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Loading/Refreshing Indicator */}
      {(isLoading || isRefetching) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search games, teams, or leagues..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearch('')}>
                  <Close />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {searchInput && !searchQuery && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Try searching for:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <Chip
                  key={index}
                  icon={suggestion.icon}
                  label={suggestion.text}
                  onClick={() => handleSearchSubmit(suggestion.text)}
                  sx={{ 
                    bgcolor: `${suggestion.color}10`,
                    borderColor: suggestion.color,
                    color: suggestion.color,
                    '&:hover': {
                      bgcolor: `${suggestion.color}20`
                    }
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {filteredGames.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Found {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
            </Typography>
            {filteredGames.slice(0, 3).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={selectedGame?.id === game.id}
                onSelect={() => handleSelectGame(game)}
              />
            ))}
          </Box>
        )}
      </Paper>

      {!searchQuery && selectedGame && (
        <>
          {/* Selected Game Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      bgcolor: selectedGame.homeTeam?.color || '#3b82f6',
                      width: 80,
                      height: 80,
                      fontSize: 32,
                      fontWeight: 'bold',
                      mb: 2
                    }}>
                      {selectedGame.homeTeam?.logo || 'H'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.homeTeam?.name || 'Home'}
                    </Typography>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {selectedGame.homeScore}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      {renderStatusBadge(selectedGame.status)}
                      {selectedGame.quarter && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedGame.quarter}
                        </Typography>
                      )}
                    </Box>
                    
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {selectedGame.date} • {selectedGame.time}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        icon={<LocationOn />}
                        label={selectedGame.venue}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Tv />}
                        label={selectedGame.broadcast}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {selectedGame.sport} • {selectedGame.attendance} attendance
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      bgcolor: selectedGame.awayTeam?.color || '#ef4444',
                      width: 80,
                      height: 80,
                      fontSize: 32,
                      fontWeight: 'bold',
                      mb: 2
                    }}>
                      {selectedGame.awayTeam?.logo || 'A'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.awayTeam?.name || 'Away'}
                    </Typography>
                    <Typography variant="h3" color="secondary" fontWeight="bold">
                      {selectedGame.awayScore}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Odds Bar */}
              <Paper sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'background.default',
                display: 'flex',
                justifyContent: 'space-around'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Spread</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedGame.odds?.spread || '-3.5'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <BarChart sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedGame.odds?.total || '48.5'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Moneyline</Typography>
                  <Typography variant="h6" fontWeight="bold">-150/+130</Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
            <Box sx={{ p: 3 }}>
              {renderTabContent()}
            </Box>
          </Paper>

          {/* Stats Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart /> Game Statistics
            </Typography>
            <Grid container spacing={2}>
              {STATS_DATA.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {stat.icon}
                        <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" color="primary">
                          {stat.home}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs
                        </Typography>
                        <Typography variant="h6" color="secondary">
                          {stat.away}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* AI Analysis Prompts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb sx={{ color: '#fbbf24' }} /> AI Analysis Prompts
              </Typography>
              <IconButton onClick={() => setShowPrompts(!showPrompts)}>
                <ChevronRight sx={{ 
                  transform: showPrompts ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} />
              </IconButton>
            </Box>
            
            {showPrompts && (
              <Grid container spacing={2}>
                {PROMPTS.map((prompt) => (
                  <Grid item xs={12} sm={6} md={4} key={prompt.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                          borderLeft: `4px solid ${prompt.color}`
                        },
                        borderLeft: `4px solid ${prompt.color}`
                      }}
                      onClick={() => generateAIAnalysis(prompt.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: prompt.color,
                            width: 40,
                            height: 40,
                            mr: 2
                          }}>
                            {prompt.icon}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold">
                            {prompt.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {prompt.description}
                        </Typography>
                        <Chip
                          label="Free AI Analysis"
                          size="small"
                          sx={{ 
                            bgcolor: `${prompt.color}10`,
                            color: prompt.color,
                            fontSize: '0.75rem'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* More Games */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoreHoriz /> More Games
            </Typography>
            <Grid container spacing={2}>
              {games
                .filter(game => game.id !== selectedGame?.id)
                .slice(0, 3)
                .map((game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <GameCard
                      game={game}
                      onSelect={() => handleSelectGame(game)}
                    />
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </>
      )}

      {/* Empty State */}
      {!searchQuery && games.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NewspaperIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No games available for {selectedSport.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try refreshing or selecting a different sport
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<UpdateIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Refresh Games
          </Button>
        </Box>
      )}

      {/* AI Analysis Modal */}
      <Dialog 
        open={showAIModal} 
        onClose={() => setShowAIModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ color: '#fbbf24' }} />
          AI Analysis
          {selectedGame && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {selectedGame.homeTeam?.name || 'Home'} vs {selectedGame.awayTeam?.name || 'Away'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingAI ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Generating AI analysis...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyzing game data and trends
              </Typography>
            </Box>
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {aiResponse}
                </Typography>
              </Paper>
              
              <Typography variant="h6" gutterBottom>
                Try another analysis:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {PROMPTS
                  .filter(p => p.id !== activeTab)
                  .slice(0, 3)
                  .map((prompt) => (
                    <Chip
                      key={prompt.id}
                      icon={prompt.icon}
                      label={prompt.title}
                      onClick={() => {
                        setShowAIModal(false);
                        setTimeout(() => generateAIAnalysis(prompt.id), 300);
                      }}
                      sx={{ 
                        bgcolor: `${prompt.color}10`,
                        borderColor: prompt.color,
                        color: prompt.color,
                        '&:hover': {
                          bgcolor: `${prompt.color}20`
                        }
                      }}
                      variant="outlined"
                    />
                  ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MatchAnalyticsScreen;
