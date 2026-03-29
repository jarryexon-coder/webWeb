// src/pages/MatchAnalyticsScreen.tsx – FINAL VERSION WITH DEDUPLICATION
import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  SportsBasketball,
  SportsFootball,
  SportsHockey,
  SportsBaseball,
  CalendarToday,
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
  Update as UpdateIcon,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// =============================================
// CONSTANTS
// =============================================
const API_BASE = 'https://prizepicks-production.up.railway.app';

// =============================================
// TEAM NAME → ABBREVIATION MAPPINGS
// =============================================
const NBA_TEAM_MAP: Record<string, string> = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS'
};

// Reverse mapping for looking up full names from abbreviations
const NBA_ABBR_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(NBA_TEAM_MAP).map(([name, abbr]) => [abbr, name])
);

const MLB_TEAM_MAP: Record<string, string> = {
  'Arizona Diamondbacks': 'ARI',
  'Atlanta Braves': 'ATL',
  'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS',
  'Chicago Cubs': 'CHC',
  'Chicago White Sox': 'CWS',
  'Cincinnati Reds': 'CIN',
  'Cleveland Guardians': 'CLE',
  'Colorado Rockies': 'COL',
  'Detroit Tigers': 'DET',
  'Houston Astros': 'HOU',
  'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA',
  'Los Angeles Dodgers': 'LAD',
  'Miami Marlins': 'MIA',
  'Milwaukee Brewers': 'MIL',
  'Minnesota Twins': 'MIN',
  'New York Mets': 'NYM',
  'New York Yankees': 'NYY',
  'Oakland Athletics': 'OAK',
  'Philadelphia Phillies': 'PHI',
  'Pittsburgh Pirates': 'PIT',
  'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF',
  'Seattle Mariners': 'SEA',
  'St. Louis Cardinals': 'STL',
  'Tampa Bay Rays': 'TB',
  'Texas Rangers': 'TEX',
  'Toronto Blue Jays': 'TOR',
  'Washington Nationals': 'WSH'
};

const MLB_ABBR_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(MLB_TEAM_MAP).map(([name, abbr]) => [abbr, name])
);

const NHL_TEAM_MAP: Record<string, string> = {
  'Anaheim Ducks': 'ANA',
  'Arizona Coyotes': 'ARI',
  'Boston Bruins': 'BOS',
  'Buffalo Sabres': 'BUF',
  'Calgary Flames': 'CGY',
  'Carolina Hurricanes': 'CAR',
  'Chicago Blackhawks': 'CHI',
  'Colorado Avalanche': 'COL',
  'Columbus Blue Jackets': 'CBJ',
  'Dallas Stars': 'DAL',
  'Detroit Red Wings': 'DET',
  'Edmonton Oilers': 'EDM',
  'Florida Panthers': 'FLA',
  'Los Angeles Kings': 'LAK',
  'Minnesota Wild': 'MIN',
  'Montreal Canadiens': 'MTL',
  'Nashville Predators': 'NSH',
  'New Jersey Devils': 'NJD',
  'New York Islanders': 'NYI',
  'New York Rangers': 'NYR',
  'Ottawa Senators': 'OTT',
  'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT',
  'San Jose Sharks': 'SJS',
  'Seattle Kraken': 'SEA',
  'St. Louis Blues': 'STL',
  'Tampa Bay Lightning': 'TBL',
  'Toronto Maple Leafs': 'TOR',
  'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK',
  'Washington Capitals': 'WSH',
  'Winnipeg Jets': 'WPG'
};

const NHL_ABBR_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(NHL_TEAM_MAP).map(([name, abbr]) => [abbr, name])
);

// Common NBA matchups for fallback (based on typical scheduling)
const COMMON_NBA_MATCHUPS: Record<string, string[]> = {
  'LAL': ['GSW', 'LAC', 'SAC', 'PHX', 'DEN'],
  'GSW': ['LAL', 'SAC', 'PHX', 'DEN', 'LAC'],
  'BOS': ['NYK', 'PHI', 'BKN', 'MIA', 'TOR'],
  'MIL': ['PHI', 'NYK', 'BOS', 'CLE', 'CHI'],
  'PHX': ['LAL', 'GSW', 'DEN', 'SAC', 'LAC'],
  'DEN': ['LAL', 'PHX', 'GSW', 'SAC', 'OKC'],
  'OKC': ['DEN', 'MIN', 'DAL', 'MEM', 'SAS'],
  'NYK': ['BOS', 'PHI', 'BKN', 'MIL', 'CLE'],
  'ATL': ['BOS', 'MIA', 'ORL', 'CHA', 'NYK'],
  'CHI': ['MIL', 'CLE', 'IND', 'DET', 'TOR'],
  'PHI': ['BOS', 'NYK', 'MIL', 'CLE', 'MIA'],
  'SAS': ['OKC', 'DAL', 'HOU', 'MEM', 'NOP'],
  'DET': ['CHI', 'CLE', 'IND', 'TOR', 'MIL'],
};

// Common NHL matchups
const COMMON_NHL_MATCHUPS: Record<string, string[]> = {
  'COL': ['VGK', 'DAL', 'MIN', 'WPG', 'STL'],
  'EDM': ['CGY', 'VAN', 'LAK', 'VGK', 'SEA'],
  'BOS': ['TOR', 'MTL', 'NYR', 'FLA', 'TBL'],
  'TOR': ['BOS', 'MTL', 'OTT', 'TBL', 'FLA'],
  'TBL': ['FLA', 'BOS', 'TOR', 'CAR', 'NYR'],
  'BUF': ['DET', 'OTT', 'MTL', 'TOR', 'BOS'],
  'NJD': ['NYR', 'NYI', 'PHI', 'PIT', 'WSH'],
  'VGK': ['COL', 'LAK', 'EDM', 'DAL', 'SJS'],
  'DAL': ['COL', 'VGK', 'MIN', 'STL', 'NSH'],
};

// Common MLB matchups
const COMMON_MLB_MATCHUPS: Record<string, string[]> = {
  'NYY': ['BOS', 'BAL', 'TOR', 'TB', 'HOU'],
  'LAD': ['SF', 'SD', 'ARI', 'COL', 'ATL'],
  'ATL': ['PHI', 'NYM', 'MIA', 'WSH', 'LAD'],
  'BOS': ['NYY', 'BAL', 'TOR', 'TB', 'HOU'],
  'PHI': ['ATL', 'NYM', 'WSH', 'MIA', 'LAD'],
  'HOU': ['TEX', 'SEA', 'LAA', 'OAK', 'NYY'],
  'NYM': ['PHI', 'ATL', 'WSH', 'MIA', 'LAD'],
  'SF': ['LAD', 'SD', 'ARI', 'COL', 'ATL'],
  'SD': ['LAD', 'SF', 'ARI', 'COL', 'ATL'],
  'CHC': ['MIL', 'STL', 'CIN', 'PIT', 'ATL'],
};

// =============================================
// API FUNCTIONS
// =============================================

const fetchPrizePicksSelections = async (sport: string = 'nba') => {
  try {
    const url = `${API_BASE}/api/prizepicks/selections?sport=${sport}`;
    console.log(`🎯 Fetching PrizePicks selections from: ${url}`);
    
    const response = await axios.get(url, { timeout: 15000 });
    
    if (response.data && response.data.selections) {
      console.log(`✅ Got ${response.data.selections.length} selections for ${sport}`);
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Got ${response.data.length} selections (array format)`);
      return { selections: response.data };
    }
    
    return { selections: [] };
  } catch (error) {
    console.error(`❌ Error fetching PrizePicks selections for ${sport}:`, error);
    return { selections: [] };
  }
};

// ================= Team name to abbreviation conversion =================
const getTeamAbbreviation = (teamName: string, sport: string): string => {
  if (!teamName) return '';
  
  // If it's already an abbreviation (2-4 uppercase letters), return it
  if (/^[A-Z]{2,4}$/.test(teamName)) {
    return teamName;
  }
  
  // Use the sport-specific maps
  if (sport === 'nba' && NBA_TEAM_MAP[teamName]) {
    return NBA_TEAM_MAP[teamName];
  } else if (sport === 'nhl' && NHL_TEAM_MAP[teamName]) {
    return NHL_TEAM_MAP[teamName];
  } else if (sport === 'mlb' && MLB_TEAM_MAP[teamName]) {
    return MLB_TEAM_MAP[teamName];
  }
  
  // Try to extract from common patterns
  const words = teamName.split(' ');
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  
  return teamName.substring(0, 3).toUpperCase();
};

const getTeamFullName = (abbr: string, sport: string): string => {
  if (sport === 'nba' && NBA_ABBR_TO_NAME[abbr]) return NBA_ABBR_TO_NAME[abbr];
  if (sport === 'nhl' && NHL_ABBR_TO_NAME[abbr]) return NHL_ABBR_TO_NAME[abbr];
  if (sport === 'mlb' && MLB_ABBR_TO_NAME[abbr]) return MLB_ABBR_TO_NAME[abbr];
  return abbr;
};

// Infer opponent based on common matchups and team groupings
const inferOpponent = (teamAbbr: string, allTeams: string[], sport: string): { name: string; abbr: string } => {
  // Get common matchups for this sport
  const commonMatchups = sport === 'nba' ? COMMON_NBA_MATCHUPS :
                          sport === 'nhl' ? COMMON_NHL_MATCHUPS :
                          COMMON_MLB_MATCHUPS;
  
  // First, try to find a common opponent that also appears in the selections
  const commonOpponents = commonMatchups[teamAbbr] || [];
  
  for (const opponent of commonOpponents) {
    if (allTeams.includes(opponent)) {
      const fullName = getTeamFullName(opponent, sport);
      return { name: fullName || opponent, abbr: opponent };
    }
  }
  
  // If no common opponent found, pick another team from the list (not itself)
  const otherTeams = allTeams.filter(t => t !== teamAbbr);
  if (otherTeams.length > 0) {
    const opponent = otherTeams[0];
    const fullName = getTeamFullName(opponent, sport);
    return { name: fullName || opponent, abbr: opponent };
  }
  
  // Final fallback
  return { name: 'Opponent', abbr: 'OPP' };
};

// ================= Main Component =================
const MatchAnalyticsScreen = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'nhl' | 'mlb'>('nba');

  const { 
    data: prizePicksData, 
    isLoading: selectionsLoading, 
    error: selectionsError,
    refetch: refetchSelections,
    isRefetching: selectionsRefetching
  } = useQuery({
    queryKey: ['prizepicksSelections', selectedSport],
    queryFn: () => fetchPrizePicksSelections(selectedSport),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [filteredGames, setFilteredGames] = useState<any[]>([]);

  const selectionsFromApi = prizePicksData?.selections || [];

  // ========== Transform selections into games with inferred opponents and deduplication ==========
  const games = useMemo(() => {
    if (!selectionsFromApi.length) return [];

    console.log(`🎯 Processing ${selectionsFromApi.length} selections for ${selectedSport}`);

    // First, collect all unique teams from selections
    const uniqueTeams = new Set<string>();
    selectionsFromApi.forEach((selection: any) => {
      const team = selection.team || selection.team_abbreviation;
      if (team) {
        const teamAbbr = getTeamAbbreviation(team, selectedSport);
        uniqueTeams.add(teamAbbr);
      }
    });
    
    const allTeams = Array.from(uniqueTeams);
    console.log(`📊 Teams in selections: ${allTeams.join(', ')}`);

    // Group selections by team
    const selectionsByTeam = new Map<string, any[]>();
    selectionsFromApi.forEach((selection: any) => {
      const team = selection.team || selection.team_abbreviation;
      if (team) {
        const teamAbbr = getTeamAbbreviation(team, selectedSport);
        if (!selectionsByTeam.has(teamAbbr)) {
          selectionsByTeam.set(teamAbbr, []);
        }
        selectionsByTeam.get(teamAbbr)!.push(selection);
      }
    });

    // Create games by matching teams with inferred opponents
    const gameMap = new Map<string, any>();
    const processedTeams = new Set<string>();

    selectionsByTeam.forEach((selections, teamAbbr) => {
      if (processedTeams.has(teamAbbr)) return;
      
      // Infer opponent for this team
      const opponent = inferOpponent(teamAbbr, allTeams, selectedSport);
      const opponentAbbr = opponent.abbr;
      
      // Create game key (alphabetically sorted to ensure uniqueness)
      const gameKey = [teamAbbr, opponentAbbr].sort().join('-');
      
      if (!gameMap.has(gameKey)) {
        const teamFullName = getTeamFullName(teamAbbr, selectedSport);
        const opponentFullName = opponent.name;
        
        gameMap.set(gameKey, {
          id: gameKey,
          homeTeam: {
            name: teamFullName || teamAbbr,
            abbreviation: teamAbbr,
            logo: teamAbbr,
            color: teamAbbr === 'LAL' ? '#552583' : 
                   teamAbbr === 'BOS' ? '#008348' : 
                   teamAbbr === 'GSW' ? '#1D428A' : 
                   teamAbbr === 'NYY' ? '#003087' :
                   teamAbbr === 'LAD' ? '#005A9C' :
                   teamAbbr === 'COL' ? '#6F263D' :
                   teamAbbr === 'EDM' ? '#FF4C00' : '#3b82f6'
          },
          awayTeam: {
            name: opponentFullName,
            abbreviation: opponentAbbr,
            logo: opponentAbbr,
            color: opponentAbbr === 'LAL' ? '#552583' : 
                   opponentAbbr === 'BOS' ? '#008348' : 
                   opponentAbbr === 'GSW' ? '#1D428A' : 
                   opponentAbbr === 'NYY' ? '#003087' :
                   opponentAbbr === 'LAD' ? '#005A9C' :
                   opponentAbbr === 'COL' ? '#6F263D' :
                   opponentAbbr === 'EDM' ? '#FF4C00' : '#ef4444'
          },
          sport: selectedSport.toUpperCase(),
          date: new Date().toLocaleDateString(),
          time: 'TBD',
          venue: `${teamFullName || teamAbbr} ${selectedSport === 'mlb' ? 'Ballpark' : 'Arena'}`,
          players: selections.map(s => s.player_name || s.player || 'Unknown'),
          selectionData: selections,
        });
        
        console.log(`🏀 Created game: ${teamFullName || teamAbbr} vs ${opponentFullName}`);
        processedTeams.add(teamAbbr);
        processedTeams.add(opponentAbbr);
      } else {
        // Add players to existing game
        const existing = gameMap.get(gameKey);
        selections.forEach((s: any) => {
          const playerName = s.player_name || s.player;
          if (!existing.players.includes(playerName)) {
            existing.players.push(playerName);
            existing.selectionData.push(s);
          }
        });
      }
    });

    const gameArray = Array.from(gameMap.values());
    console.log(`📊 Created ${gameArray.length} games before deduplication`);

    // ========== DEDUPLICATION: Each team should only appear once ==========
    const teamToBestGameMap = new Map<string, any>();
    
    gameArray.forEach(game => {
      const homeTeam = game.homeTeam.abbreviation;
      const awayTeam = game.awayTeam.abbreviation;
      
      // Check home team
      if (teamToBestGameMap.has(homeTeam)) {
        const existingGame = teamToBestGameMap.get(homeTeam);
        // Keep the game with more players (more likely to be the correct matchup)
        if (game.players.length > existingGame.players.length) {
          teamToBestGameMap.set(homeTeam, game);
        }
      } else {
        teamToBestGameMap.set(homeTeam, game);
      }
      
      // Check away team
      if (teamToBestGameMap.has(awayTeam)) {
        const existingGame = teamToBestGameMap.get(awayTeam);
        if (game.players.length > existingGame.players.length) {
          teamToBestGameMap.set(awayTeam, game);
        }
      } else {
        teamToBestGameMap.set(awayTeam, game);
      }
    });
    
    // Convert back to array, removing duplicates
    const deduplicatedGames = Array.from(new Set(teamToBestGameMap.values()));
    
    console.log(`✅ Deduplicated from ${gameArray.length} to ${deduplicatedGames.length} unique games`);
    
    // Log final games with player counts
    deduplicatedGames.forEach(g => {
      console.log(`   ${g.homeTeam.name} vs ${g.awayTeam.name} - ${g.players.length} players`);
    });
    
    return deduplicatedGames;
  }, [selectionsFromApi, selectedSport]);

  // ========== Set initial selected game ==========
  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0]);
    }
  }, [games, selectedGame]);

  const handleSportChange = (sportId: string) => {
    console.log(`🔄 Changing sport from ${selectedSport} to ${sportId}`);
    setSelectedSport(sportId as 'nba' | 'nfl' | 'nhl' | 'mlb');
    setSelectedGame(null);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
  };

  const handleSearch = (q: string) => {
    setSearchInput(q);
    if (!q.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
    } else {
      setSearchQuery(q);
      const results = games.filter(
        g =>
          g.homeTeam.name.toLowerCase().includes(q.toLowerCase()) ||
          g.awayTeam.name.toLowerCase().includes(q.toLowerCase())
      );
      setFilteredGames(results);
    }
  };

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
  };

  const handleRefresh = () => {
    refetchSelections();
  };

  // ========== GameCard component ==========
  const GameCard = ({ game, isSelected = false, onSelect }: { game: any; isSelected?: boolean; onSelect: (game: any) => void }) => {
    return (
      <Card
        sx={{
          cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #333',
          bgcolor: '#1e1e1e',
          transition: 'all 0.2s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, bgcolor: '#2a2a2a' },
        }}
        onClick={() => onSelect(game)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip 
              label={game.sport} 
              size="small" 
              sx={{ bgcolor: game.sport === 'NBA' ? '#ef4444' : game.sport === 'NHL' ? '#1e40af' : '#10b981', color: '#fff' }} 
            />
            <Chip
              label="Scheduled"
              size="small"
              sx={{ bgcolor: '#f59e0b', color: '#fff' }}
            />
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: game.homeTeam.color, width: 32, height: 32 }}>
                  {game.homeTeam.abbreviation?.charAt(0) || 'H'}
                </Avatar>
                <Typography noWrap sx={{ color: '#fff' }}>{game.homeTeam.name}</Typography>
              </Box>
            </Grid>
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>vs</Typography>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Typography noWrap sx={{ color: '#fff' }}>{game.awayTeam.name}</Typography>
                <Avatar sx={{ bgcolor: game.awayTeam.color, width: 32, height: 32 }}>
                  {game.awayTeam.abbreviation?.charAt(0) || 'A'}
                </Avatar>
              </Box>
            </Grid>
          </Grid>

          {game.players?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                <People sx={{ fontSize: 12, mr: 0.5 }} />
                {game.players.length} player{game.players.length !== 1 ? 's' : ''} with props
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // ========== Selected Game Details Component ==========
  const SelectedGameDetails = ({ game }: { game: any }) => {
    if (!game) return null;
    
    return (
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Scoreboard /> Game Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0d0d0d', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: game.homeTeam.color }}>{game.homeTeam.abbreviation}</Typography>
              <Typography variant="body1" sx={{ color: '#fff' }}>{game.homeTeam.name}</Typography>
              <Typography variant="h2" sx={{ color: '#ff9800', fontWeight: 'bold', mt: 2 }}>VS</Typography>
              <Typography variant="h4" sx={{ color: game.awayTeam.color, mt: 2 }}>{game.awayTeam.abbreviation}</Typography>
              <Typography variant="body1" sx={{ color: '#fff' }}>{game.awayTeam.name}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: '#0d0d0d', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
                <Schedule sx={{ fontSize: 16, mr: 1 }} /> Game Info
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 14, mr: 1 }} /> Date: {game.date}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                <LocationOn sx={{ fontSize: 14, mr: 1 }} /> Venue: {game.venue}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                <Groups sx={{ fontSize: 14, mr: 1 }} /> Players with Props: {game.players?.length || 0}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {game.players?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
              <People /> Players with Props
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {game.players.slice(0, 20).map((player: string, idx: number) => (
                <Chip 
                  key={idx} 
                  label={player} 
                  size="small" 
                  sx={{ bgcolor: '#333', color: '#fff' }} 
                />
              ))}
              {game.players.length > 20 && (
                <Chip label={`+${game.players.length - 20} more`} size="small" sx={{ bgcolor: '#333', color: '#aaa' }} />
              )}
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  const isLoading = selectionsLoading;
  const isRefetching = selectionsRefetching;
  const hasError = selectionsError;

  if (isLoading && !games.length) {
    return (
      <Container maxWidth="lg" sx={{ bgcolor: '#121212', minHeight: '100vh', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, color: '#fff' }}>Loading game analytics...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ bgcolor: '#121212', minHeight: '100vh', py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>Game Analytics</Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            {selectionsFromApi.length} player selections • {games.length} games
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: '#fff' }}>Sport</InputLabel>
          <Select 
            value={selectedSport} 
            label="Sport" 
            onChange={e => handleSportChange(e.target.value)}
            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
          >
            <MenuItem value="nba">🏀 NBA</MenuItem>
            <MenuItem value="nhl">🏒 NHL</MenuItem>
            <MenuItem value="mlb">⚾ MLB</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={isRefetching} sx={{ color: '#fff' }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {hasError && (
        <Alert severity="warning" sx={{ mb: 3, bgcolor: '#333', color: '#ff9800' }}>
          Some data may be unavailable. Showing available data.
        </Alert>
      )}

      {isRefetching && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search teams..."
          value={searchInput}
          onChange={e => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#aaa' }} /></InputAdornment>,
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearch('')}><Close sx={{ color: '#aaa' }} /></IconButton>
              </InputAdornment>
            ),
            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }
          }}
        />
        {filteredGames.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#aaa' }} gutterBottom>
              Found {filteredGames.length} games
            </Typography>
            <Grid container spacing={2}>
              {filteredGames.slice(0, 3).map(game => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <GameCard game={game} isSelected={selectedGame?.id === game.id} onSelect={handleSelectGame} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* No games state */}
      {games.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NewspaperIcon sx={{ fontSize: 60, color: '#555', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#aaa' }}>
            No games available for {selectedSport.toUpperCase()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }} paragraph>
            No PrizePicks selections found for this sport
          </Typography>
          <Button variant="outlined" startIcon={<UpdateIcon />} onClick={handleRefresh} sx={{ color: '#fff', borderColor: '#555' }}>
            Refresh
          </Button>
        </Box>
      )}

      {/* Games List */}
      {games.length > 0 && (
        <Paper sx={{ p: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoreHoriz /> {selectedGame ? 'All Games' : 'Select a Game'}
          </Typography>
          <Grid container spacing={2}>
            {games.map(game => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <GameCard 
                  game={game} 
                  isSelected={selectedGame?.id === game.id} 
                  onSelect={handleSelectGame} 
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Selected Game Details */}
          {selectedGame && <SelectedGameDetails game={selectedGame} />}
        </Paper>
      )}
    </Container>
  );
};

export default MatchAnalyticsScreen;
