// src/pages/NHLTrendsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ListItemButton,  
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge
} from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  SportsHockey as SportsHockeyIcon,
  People as PeopleIcon,
  EmojiEvents as EmojiEventsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Mock data - In a real app, these would come from API/services
const mockStandings = [
  { id: 1, team: 'Boston Bruins', wins: 32, losses: 12, points: 64, conference: 'Eastern', logoColor: '#FFB81C' },
  { id: 2, team: 'Toronto Maple Leafs', wins: 30, losses: 14, points: 60, conference: 'Eastern', logoColor: '#003E7E' },
  { id: 3, team: 'Tampa Bay Lightning', wins: 28, losses: 16, points: 56, conference: 'Eastern', logoColor: '#002868' },
  { id: 4, team: 'Florida Panthers', wins: 27, losses: 17, points: 54, conference: 'Eastern', logoColor: '#C8102E' },
  { id: 5, team: 'Detroit Red Wings', wins: 25, losses: 19, points: 50, conference: 'Eastern', logoColor: '#CE1126' },
  { id: 6, team: 'Colorado Avalanche', wins: 31, losses: 13, points: 62, conference: 'Western', logoColor: '#6F263D' },
  { id: 7, team: 'Dallas Stars', wins: 29, losses: 15, points: 58, conference: 'Western', logoColor: '#006847' },
  { id: 8, team: 'Edmonton Oilers', wins: 28, losses: 16, points: 56, conference: 'Western', logoColor: '#041E42' },
];

const mockGames = [
  { id: 1, home: 'Boston Bruins', away: 'Toronto Maple Leafs', score: '3-2', status: 'Final', date: '2024-01-02', homeColor: '#FFB81C', awayColor: '#003E7E' },
  { id: 2, home: 'Tampa Bay Lightning', away: 'Florida Panthers', score: '4-3', status: 'OT', date: '2024-01-02', homeColor: '#002868', awayColor: '#C8102E' },
  { id: 3, home: 'New York Rangers', away: 'Carolina Hurricanes', score: '2-1', status: 'Final', date: '2024-01-01', homeColor: '#0038A8', awayColor: '#CC0000' },
  { id: 4, home: 'Colorado Avalanche', away: 'Dallas Stars', score: '5-2', status: 'Final', date: '2024-01-01', homeColor: '#6F263D', awayColor: '#006847' },
  { id: 5, home: 'Edmonton Oilers', away: 'Vegas Golden Knights', score: '3-4', status: 'Final', date: '2023-12-31', homeColor: '#041E42', awayColor: '#B9975B' },
];

const mockPlayers = [
  { id: 1, name: 'Connor McDavid', team: 'EDM', goals: 32, assists: 45, points: 77, position: 'C', teamColor: '#041E42' },
  { id: 2, name: 'Nathan MacKinnon', team: 'COL', goals: 28, assists: 42, points: 70, position: 'C', teamColor: '#6F263D' },
  { id: 3, name: 'Nikita Kucherov', team: 'TB', goals: 25, assists: 40, points: 65, position: 'RW', teamColor: '#002868' },
  { id: 4, name: 'David Pastrnak', team: 'BOS', goals: 30, assists: 30, points: 60, position: 'RW', teamColor: '#FFB81C' },
  { id: 5, name: 'Auston Matthews', team: 'TOR', goals: 35, assists: 22, points: 57, position: 'C', teamColor: '#003E7E' },
  { id: 6, name: 'Leon Draisaitl', team: 'EDM', goals: 22, assists: 34, points: 56, position: 'C', teamColor: '#041E42' },
];

const NHLTeams = [
  { id: 'all', name: 'All Teams', color: '#64748b' },
  { id: 'BOS', name: 'Bruins', color: '#FFB81C' },
  { id: 'TOR', name: 'Maple Leafs', color: '#003E7E' },
  { id: 'TB', name: 'Lightning', color: '#002868' },
  { id: 'FLA', name: 'Panthers', color: '#C8102E' },
  { id: 'DET', name: 'Red Wings', color: '#CE1126' },
  { id: 'COL', name: 'Avalanche', color: '#6F263D' },
  { id: 'DAL', name: 'Stars', color: '#006847' },
  { id: 'EDM', name: 'Oilers', color: '#041E42' },
];

const NHLTrendsScreen = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchCategory, setSearchCategory] = useState('all');
  
  // Mock search history - in real app, would come from context/provider
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Simulate initial data load
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      const query = searchInput.trim();
      setSearchQuery(query);
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory([query, ...searchHistory.slice(0, 4)]);
      }
      
      // Perform search
      handleSearch(query);
    }
  };

  const handleSearch = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Search across all data
    const standingsResults = mockStandings.filter(item =>
      item.team.toLowerCase().includes(lowerQuery) ||
      item.conference.toLowerCase().includes(lowerQuery)
    );
    
    const gamesResults = mockGames.filter(item =>
      item.home.toLowerCase().includes(lowerQuery) ||
      item.away.toLowerCase().includes(lowerQuery)
    );
    
    const playersResults = mockPlayers.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.team.toLowerCase().includes(lowerQuery) ||
      item.position.toLowerCase().includes(lowerQuery)
    );
    
    const allResults = [
      ...standingsResults.map(item => ({ ...item, type: 'standings' as const })),
      ...gamesResults.map(item => ({ ...item, type: 'games' as const })),
      ...playersResults.map(item => ({ ...item, type: 'players' as const }))
    ];
    
    const categorizedResults = {
      all: allResults,
      standings: standingsResults.map(item => ({ ...item, type: 'standings' as const })),
      games: gamesResults.map(item => ({ ...item, type: 'games' as const })),
      players: playersResults.map(item => ({ ...item, type: 'players' as const }))
    };
    
    setSearchResults(categorizedResults);
  }, []);

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSearchResults(null);
    setSearchCategory('all');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredStandings = selectedTeam === 'all' 
    ? mockStandings 
    : mockStandings.filter(team => team.team.includes(NHLTeams.find(t => t.id === selectedTeam)?.name || ''));

  const filteredPlayers = selectedTeam === 'all'
    ? mockPlayers
    : mockPlayers.filter(player => player.team === selectedTeam);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderStandingsTable = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            NHL Standings
          </Typography>
          <Chip label="Updated Today" color="primary" size="small" />
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">#</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Team</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">W</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">L</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">PTS</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">Conf</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStandings.map((team, index) => (
                <TableRow 
                  key={team.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    } 
                  }}
                  onClick={() => navigate('/daily-picks', { state: { team: team.team } })}
                >
                  <TableCell>
                    <Typography fontWeight="bold">{index + 1}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%',
                          backgroundColor: team.logoColor 
                        }} 
                      />
                      <Typography fontWeight="medium">{team.team}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color="success.main" fontWeight="bold">
                      {team.wins}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color="error.main" fontWeight="bold">
                      {team.losses}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color="primary.main" fontWeight="bold">
                      {team.points}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={team.conference} 
                      size="small" 
                      sx={{ 
                        backgroundColor: alpha('#1976d2', 0.1),
                        color: 'primary.main',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderGames = () => (
    <Grid container spacing={2}>
      {mockGames.map((game) => (
        <Grid item xs={12} key={game.id}>
          <Card 
            sx={{ 
              transition: 'transform 0.2s',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: 6,
                cursor: 'pointer'
              }
            }}
            onClick={() => navigate('/daily-picks')}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  {new Date(game.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Badge 
                  color={
                    game.status === 'Final' ? 'error' :
                    game.status === 'OT' ? 'secondary' : 'primary'
                  }
                  badgeContent={game.status}
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" flex={1}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 32, 
                      backgroundColor: game.awayColor,
                      borderRadius: '4px 0 0 4px',
                      mr: 1
                    }} 
                  />
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {game.away}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Away
                    </Typography>
                  </Box>
                </Box>
                
                <Box textAlign="center" mx={2}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    @
                  </Typography>
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    {game.score}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" flex={1} flexDirection="row-reverse">
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 32, 
                      backgroundColor: game.homeColor,
                      borderRadius: '0 4px 4px 0',
                      ml: 1
                    }} 
                  />
                  <Box textAlign="right" flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {game.home}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Home
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderPlayers = () => (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          Top Scorers - 2023-2024 Season
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">#</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Player</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">G</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">A</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">PTS</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">Position</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers.map((player, index) => (
                <TableRow 
                  key={player.id}
                  hover
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    } 
                  }}
                  onClick={() => navigate('/player-stats', { state: { player: player.name } })}
                >
                  <TableCell>
                    <Typography fontWeight="bold" color="text.secondary">
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: player.teamColor,
                          width: 36,
                          height: 36
                        }}
                      >
                        {player.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="bold">
                          {player.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {player.team}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">
                      {player.goals}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold">
                      {player.assists}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="error.main">
                      {player.points}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={player.position} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderSearchResults = () => {
    if (!searchResults) return null;

    const results = searchResults[searchCategory as keyof typeof searchResults] || [];

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Search Results ({searchResults.all.length})
          </Typography>
          <Button startIcon={<CloseIcon />} onClick={clearSearch}>
            Clear
          </Button>
        </Box>

        {/* Search Categories */}
        <Box display="flex" gap={1} mb={3} flexWrap="wrap">
          {['all', 'standings', 'games', 'players'].map((category) => (
            <Chip
              key={category}
              label={`${
                category === 'all' ? 'All' :
                category === 'standings' ? '🏆 Standings' :
                category === 'games' ? '🏒 Games' : '👤 Players'
              } ${searchResults[category as keyof typeof searchResults]?.length || 0}`}
              color={searchCategory === category ? 'primary' : 'default'}
              onClick={() => setSearchCategory(category)}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>

        {results.length > 0 ? (
          <List>
            {results.slice(0, 10).map((item: any, index: number) => (
              <ListItemButton component="div" divider 
                key={index}
                onClick={() => {
                  if (item.type === 'players') {
                    navigate('/player-stats');
                  } else if (item.type === 'games') {
                    navigate('/daily-picks');
                  } else {
                    navigate('/daily-picks');
                  }
                }}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: 
                      item.type === 'standings' ? '#FFB81C' :
                      item.type === 'games' ? '#1976d2' : '#10b981'
                  }}>
                    {item.type === 'standings' ? '🏆' : 
                     item.type === 'games' ? '🏒' : '👤'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    item.type === 'standings' ? item.team :
                    item.type === 'games' ? `${item.away} @ ${item.home}` :
                    item.name
                  }
                  secondary={
                    item.type === 'standings' ? `Points: ${item.points} • ${item.wins}W-${item.losses}L • ${item.conference}` :
                    item.type === 'games' ? `Score: ${item.score} • ${item.status} • ${item.date}` :
                    `Goals: ${item.goals} • Assists: ${item.assists} • Position: ${item.position}`
                  }
                />
                <ListItemSecondaryAction>
                  <Typography variant="caption" color="text.secondary">
                    {item.type}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {searchCategory} results for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching for teams, players, or games
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, pt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              NHL Center
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Stats, Standings & Updates
            </Typography>
          </Box>
          <IconButton color="primary" size="large">
            <TrendingUpIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search teams, players, games..."
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
                  <IconButton size="small" onClick={() => setSearchInput('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearchSubmit}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
        </Box>

        {/* Search History */}
        {searchHistory.length > 0 && !searchQuery && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Recent Searches:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {searchHistory.map((term, index) => (
                <Chip
                  key={index}
                  label={term}
                  size="small"
                  onClick={() => {
                    setSearchInput(term);
                    handleSearchSubmit();
                  }}
                  onDelete={() => {
                    setSearchHistory(searchHistory.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Team Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Filter by Team
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {NHLTeams.map((team) => (
            <Chip
              key={team.id}
              label={team.name}
              onClick={() => setSelectedTeam(team.id)}
              color={selectedTeam === team.id ? 'primary' : 'default'}
              variant={selectedTeam === team.id ? 'filled' : 'outlined'}
              sx={{ 
                borderColor: team.color,
                ...(selectedTeam === team.id && {
                  bgcolor: alpha(team.color, 0.1),
                  color: team.color
                })
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Loading State */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Search Results or Main Content */}
      {searchResults ? (
        renderSearchResults()
      ) : (
        <>
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  fontWeight: 'medium'
                }
              }}
            >
              <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Standings" />
              <Tab icon={<SportsHockeyIcon />} iconPosition="start" label="Games" />
              <Tab icon={<PeopleIcon />} iconPosition="start" label="Players" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && renderStandingsTable()}
              {activeTab === 1 && renderGames()}
              {activeTab === 2 && renderPlayers()}
            </Box>
          </Paper>

          {/* Refresh Button */}
          <Box display="flex" justifyContent="center" mb={4}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outlined"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </Box>

          {/* Stats Summary */}
          <Paper sx={{ 
            p: 3, 
            mb: 4,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white'
          }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              NHL Season Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold">
                    32
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Teams
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold">
                    1,312
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Games Played
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold">
                    7,890
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Total Goals
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" fontWeight="bold">
                    94.2%
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Prediction Accuracy
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Typography variant="caption" sx={{ opacity: 0.7, mt: 2, display: 'block' }}>
              Data updated in real-time • Last updated: {new Date().toLocaleString()}
            </Typography>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default NHLTrendsScreen;
