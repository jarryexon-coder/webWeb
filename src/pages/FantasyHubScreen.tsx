// FantasyHubScreen.js - WITH FILTERING SYSTEM
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  Switch
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SortIcon from '@mui/icons-material/Sort';
import ClearIcon from '@mui/icons-material/Clear';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import TuneIcon from '@mui/icons-material/Tune';

const FantasyHubScreen = () => {
  // State for players and loading
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value'); // 'value', 'projection', 'salary', 'points', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [minSalary, setMinSalary] = useState(3000);
  const [maxSalary, setMaxSalary] = useState(15000);
  const [minProjection, setMinProjection] = useState(0);
  const [maxProjection, setMaxProjection] = useState(100);
  const [selectedPositions, setSelectedPositions] = useState(['PG', 'SG', 'SF', 'PF', 'C']);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch players
  const fetchPlayers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/players?sport=nba&limit=100');
      const data = await response.json();
      
      if (data.success && data.players) {
        // Clean and enhance player data
        const enhancedPlayers = data.players.map(player => ({
          ...player,
          id: player.id || `player-${Math.random()}`,
          name: player.name || 'Unknown Player',
          team: player.team || 'N/A',
          position: player.position || 'N/A',
          salary: player.salary || player.fanduel_salary || 5000,
          projection: player.projection || player.projected_points || 0,
          points: player.points || 0,
          rebounds: player.rebounds || 0,
          assists: player.assists || 0,
          value: player.value || player.valueScore || 0,
          injury_status: player.injury_status || 'Healthy'
        }));
        
        setPlayers(enhancedPlayers);
        setFilteredPlayers(enhancedPlayers);
        
        // Extract unique teams for filter
        const uniqueTeams = [...new Set(enhancedPlayers.map(p => p.team).filter(Boolean))];
        setSelectedTeams(uniqueTeams);
      } else {
        throw new Error(data.message || 'Failed to load players');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching players:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPlayers();
  }, []);
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    if (players.length === 0) return;
    
    let filtered = [...players];
    
    // 1. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query)
      );
    }
    
    // 2. Salary range filter
    filtered = filtered.filter(player =>
      player.salary >= minSalary && player.salary <= maxSalary
    );
    
    // 3. Projection range filter
    filtered = filtered.filter(player =>
      player.projection >= minProjection && player.projection <= maxProjection
    );
    
    // 4. Position filter
    filtered = filtered.filter(player =>
      selectedPositions.includes(player.position)
    );
    
    // 5. Team filter
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(player =>
        selectedTeams.includes(player.team)
      );
    }
    
    // 6. Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'value':
          aValue = a.value || 0;
          bValue = b.value || 0;
          break;
        case 'projection':
          aValue = a.projection || 0;
          bValue = b.projection || 0;
          break;
        case 'salary':
          aValue = a.salary || 0;
          bValue = b.salary || 0;
          break;
        case 'points':
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        default:
          aValue = a.value || 0;
          bValue = b.value || 0;
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    setFilteredPlayers(filtered);
  }, [
    players,
    searchQuery,
    sortBy,
    sortOrder,
    minSalary,
    maxSalary,
    minProjection,
    maxProjection,
    selectedPositions,
    selectedTeams
  ]);
  
  // Get unique positions from players
  const allPositions = useMemo(() => {
    return [...new Set(players.map(p => p.position).filter(Boolean))].sort();
  }, [players]);
  
  // Get unique teams from players
  const allTeams = useMemo(() => {
    return [...new Set(players.map(p => p.team).filter(Boolean))].sort();
  }, [players]);
  
  // Get salary range from players
  const salaryRange = useMemo(() => {
    if (players.length === 0) return [0, 15000];
    const salaries = players.map(p => p.salary).filter(Boolean);
    return [Math.min(...salaries), Math.max(...salaries)];
  }, [players]);
  
  // Get projection range from players
  const projectionRange = useMemo(() => {
    if (players.length === 0) return [0, 100];
    const projections = players.map(p => p.projection).filter(Boolean);
    return [Math.min(...projections), Math.max(...projections)];
  }, [players]);
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('value');
    setSortOrder('desc');
    setMinSalary(salaryRange[0]);
    setMaxSalary(salaryRange[1]);
    setMinProjection(projectionRange[0]);
    setMaxProjection(projectionRange[1]);
    setSelectedPositions(['PG', 'SG', 'SF', 'PF', 'C']);
    setSelectedTeams(allTeams);
  };
  
  // Toggle position selection
  const togglePosition = (position) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter(p => p !== position));
    } else {
      setSelectedPositions([...selectedPositions, position]);
    }
  };
  
  // Toggle team selection
  const toggleTeam = (team) => {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter(t => t !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading players...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchPlayers}>
              Retry
            </Button>
          }
        >
          Error loading players: {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SportsBasketballIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              🏀 NBA Fantasy Players
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {players.length} players • Advanced filtering • Real-time data
            </Typography>
          </Box>
        </Box>
        
        {/* Stats Bar */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          mb: 3,
          alignItems: 'center'
        }}>
          <Chip 
            label={`${filteredPlayers.length} of ${players.length} players`}
            color={filteredPlayers.length < players.length ? "warning" : "success"}
            variant="outlined"
          />
          
          <Chip 
            label="Python API Connected"
            color="primary"
            variant="outlined"
          />
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchPlayers}
          >
            Refresh
          </Button>
          
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color="secondary"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
      </Box>
      
      {/* FILTER PANEL */}
      {showFilters && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TuneIcon /> Advanced Filters
            </Typography>
            <Button
              startIcon={<ClearIcon />}
              onClick={resetFilters}
              size="small"
            >
              Reset All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Players"
                placeholder="Search by name, team, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Sort Controls */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="value">Value Score</MenuItem>
                    <MenuItem value="projection">Projection</MenuItem>
                    <MenuItem value="salary">Salary</MenuItem>
                    <MenuItem value="points">Points</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                </Button>
              </Box>
            </Grid>
            
            {/* Salary Range */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Salary Range: ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}
              </Typography>
              <Slider
                value={[minSalary, maxSalary]}
                onChange={(e, newValue) => {
                  setMinSalary(newValue[0]);
                  setMaxSalary(newValue[1]);
                }}
                valueLabelDisplay="auto"
                min={salaryRange[0]}
                max={salaryRange[1]}
                step={100}
                sx={{ mt: 2 }}
              />
            </Grid>
            
            {/* Projection Range */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Projection Range: {minProjection.toFixed(1)} - {maxProjection.toFixed(1)}
              </Typography>
              <Slider
                value={[minProjection, maxProjection]}
                onChange={(e, newValue) => {
                  setMinProjection(newValue[0]);
                  setMaxProjection(newValue[1]);
                }}
                valueLabelDisplay="auto"
                min={projectionRange[0]}
                max={projectionRange[1]}
                step={1}
                sx={{ mt: 2 }}
              />
            </Grid>
            
            {/* Position Filters */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Positions</Typography>
              <FormGroup row>
                {allPositions.map((position) => (
                  <FormControlLabel
                    key={position}
                    control={
                      <Checkbox
                        checked={selectedPositions.includes(position)}
                        onChange={() => togglePosition(position)}
                        size="small"
                      />
                    }
                    label={position}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            {/* Team Filters */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Teams</Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <FormGroup>
                  {allTeams.map((team) => (
                    <FormControlLabel
                      key={team}
                      control={
                        <Checkbox
                          checked={selectedTeams.includes(team)}
                          onChange={() => toggleTeam(team)}
                          size="small"
                        />
                      }
                      label={team}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Player Grid */}
      <Grid container spacing={3}>
        {filteredPlayers.map((player) => (
          <Grid item key={player.id} xs={12} sm={6} md={4} lg={3}>
            <PlayerCard player={player} />
          </Grid>
        ))}
      </Grid>
      
      {/* No results */}
      {filteredPlayers.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No players found matching your filters. Try adjusting your criteria.
        </Alert>
      )}
    </Container>
  );
};

// PlayerCard Component
const PlayerCard = ({ player }) => (
  <Card sx={{ 
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 6
    }
  }}>
    <CardContent sx={{ flexGrow: 1 }}>
      {/* Player Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 2 
      }}>
        <Box>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            {player.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {player.team} • {player.position}
          </Typography>
        </Box>
        <Chip
          label={`$${player.salary.toLocaleString()}`}
          color="primary"
          size="small"
        />
      </Box>
      
      {/* Projection & Value */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Projection
          </Typography>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
            {player.projection.toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">
            Value
          </Typography>
          <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
            {player.value.toFixed(2)}
          </Typography>
        </Box>
      </Box>
      
      {/* Stats */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Points
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {player.points.toFixed(1)}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Rebounds
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {player.rebounds.toFixed(1)}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="caption" color="text.secondary">
            Assists
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {player.assists.toFixed(1)}
          </Typography>
        </Grid>
      </Grid>
      
      {/* Status */}
      <Box sx={{ 
        mt: 'auto', 
        pt: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Chip
          label={player.injury_status}
          size="small"
          color={player.injury_status === 'Healthy' ? 'success' : 'error'}
          variant="outlined"
        />
        <Button 
          size="small" 
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        >
          Add to Team
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default FantasyHubScreen;
