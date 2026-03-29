// src/pages/NCAABTeamsScreen.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Pagination,
  Stack,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  SportsBasketball as SportsBasketballIcon,
  ArrowForward as ArrowForwardIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIconNav,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTeams } from '../hooks/useNcaab';
import ProtectedRoute from '../components/ProtectedRoute';

// Team interface based on the API response
interface Team {
  id: string;
  full_name: string;
  name: string;
  abbreviation?: string;
  conference?: string;
  division?: string;
  city?: string;
  state?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  stadium?: string;
  capacity?: number;
  joined_ncaa?: number;
  head_coach?: string;
  championships?: number;
  final_four_appearances?: number;
  tournament_appearances?: number;
}

const NCAABTeamsContent: React.FC = () => {
  const theme = useTheme();
  const [perPage] = useState(25);
  const [cursor, setCursor] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conferenceFilter, setConferenceFilter] = useState<string>('all');
  
  const { data, isLoading, error, refetch } = useTeams({ 
    per_page: perPage, 
    cursor,
    search: searchQuery || undefined
  });

  const handleNextPage = () => {
    if (data?.meta.next_cursor) {
      setCursor(data.meta.next_cursor);
    }
  };

  const handlePreviousPage = () => {
    setCursor(undefined); // Go back to first page
  };

  const handleSearch = () => {
    setSearchQuery(searchTerm);
    setCursor(undefined); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setCursor(undefined);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getTeamPrimaryColor = (team: Team): string => {
    if (team.primary_color) return team.primary_color;
    
    // Fallback colors based on team name
    const colors: Record<string, string> = {
      'Duke': '#001A57',
      'North Carolina': '#7BAFD4',
      'Kansas': '#0051BA',
      'Kentucky': '#0033A0',
      'UCLA': '#2D68C4',
      'Gonzaga': '#C8102E',
      'Arizona': '#CC0033',
      'Villanova': '#00263B',
      'Michigan State': '#18453B',
      'Indiana': '#990000',
      'Louisville': '#AD0000',
      'Syracuse': '#F76900',
      'Connecticut': '#000E2F',
      'Florida': '#0021A5',
      'Michigan': '#FFCB05',
      'Ohio State': '#BB0000',
      'Wisconsin': '#C5050C',
      'Purdue': '#CEB888',
      'Illinois': '#E84A27',
      'Maryland': '#E03A3E',
      'Rutgers': '#CC0033',
      'Penn State': '#002654',
      'Iowa': '#000000',
      'Northwestern': '#4E2A84',
      'Nebraska': '#E41C38',
      'Minnesota': '#7A0019',
      'Alabama': '#9E1B32',
      'Auburn': '#03244D',
      'LSU': '#461D7C',
      'Florida State': '#782F40',
      'Miami': '#F47321',
      'Virginia': '#232D4B',
      'Virginia Tech': '#660000',
      'Clemson': '#F56600',
      'NC State': '#CC0000',
      'Wake Forest': '#9E7E5E',
      'Notre Dame': '#0C2340',
      'Duke': '#00539B',
      'Pittsburgh': '#003594',
      'Boston College': '#98002E',
    };
    
    // Try to find a matching team
    for (const [key, color] of Object.entries(colors)) {
      if (team.full_name.includes(key) || team.name.includes(key)) {
        return color;
      }
    }
    
    // Default gradient
    return theme.palette.primary.main;
  };

  if (isLoading && !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading NCAA Basketball Teams...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching team data from college basketball API
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Error loading teams: {error.message}
        </Alert>
      </Container>
    );
  }

  const teams = data?.data || [];
  const hasNextPage = !!data?.meta.next_cursor;
  const totalTeams = data?.meta.total_count || teams.length;
  const currentPage = data?.meta.current_page || 1;
  const totalPages = Math.ceil(totalTeams / perPage);

  // Get unique conferences for filter
  const conferences = [...new Set(teams.map(t => t.conference).filter(Boolean))];

  // Filter teams by conference
  const filteredTeams = conferenceFilter === 'all' 
    ? teams 
    : teams.filter(t => t.conference === conferenceFilter);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
          <SchoolIcon sx={{ fontSize: 200 }} />
        </Box>
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <SchoolIcon sx={{ fontSize: 40 }} />
            <Typography variant="h3" component="h1" fontWeight="bold">
              NCAA Basketball Teams
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
            Complete directory of {totalTeams}+ Division I college basketball programs
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Chip 
              icon={<GroupsIcon />} 
              label={`${filteredTeams.length} teams shown`} 
              sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', '& .MuiChip-icon': { color: 'white' } }} 
            />
            <Chip 
              icon={<SportsBasketballIcon />} 
              label="2025-26 Season" 
              sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', '& .MuiChip-icon': { color: 'white' } }} 
            />
            {data?.meta.cached && (
              <Chip 
                icon={<InfoIcon />} 
                label="Cached data" 
                size="small"
                sx={{ bgcolor: alpha('#fff', 0.1), color: 'white' }} 
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search teams by name, city, or conference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Conference</InputLabel>
              <Select
                value={conferenceFilter}
                label="Conference"
                onChange={(e) => setConferenceFilter(e.target.value)}
              >
                <MenuItem value="all">All Conferences</MenuItem>
                {conferences.map(conf => (
                  <MenuItem key={conf} value={conf}>{conf}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth
              variant="contained" 
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
        
        {searchQuery && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity="info" 
              action={
                <Button color="inherit" size="small" onClick={handleClearSearch}>
                  Clear
                </Button>
              }
            >
              Showing results for: "{searchQuery}"
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            No teams found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery 
              ? `No teams matching "${searchQuery}" in the selected conference`
              : 'There are no teams available for the selected filters.'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleClearSearch}
            startIcon={<RefreshIcon />}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredTeams.map((team, index) => {
              const primaryColor = getTeamPrimaryColor(team);
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={team.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        '& .team-logo': {
                          transform: 'scale(1.1)',
                        }
                      }
                    }}
                  >
                    <CardActionArea 
                      component={Link} 
                      to={`/ncaab/teams/${team.id}`}
                      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      {/* Team Header with Color Bar */}
                      <Box 
                        sx={{ 
                          height: 8, 
                          background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}88)`,
                        }} 
                      />
                      
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        {/* Team Logo/Icon */}
                        <Box 
                          className="team-logo"
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%',
                            bgcolor: alpha(primaryColor, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            transition: 'transform 0.2s',
                            border: `2px solid ${primaryColor}`,
                          }}
                        >
                          {team.logo ? (
                            <img 
                              src={team.logo} 
                              alt={team.full_name}
                              style={{ width: 60, height: 60, objectFit: 'contain' }}
                            />
                          ) : (
                            <SportsBasketballIcon sx={{ fontSize: 40, color: primaryColor }} />
                          )}
                        </Box>

                        {/* Team Info */}
                        <Typography 
                          variant="h6" 
                          component="div" 
                          align="center" 
                          gutterBottom
                          sx={{ fontWeight: 'bold' }}
                        >
                          {team.full_name}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          align="center"
                          sx={{ mb: 1 }}
                        >
                          {team.name}
                        </Typography>

                        {/* Conference and Location */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          {team.conference && (
                            <Chip 
                              size="small" 
                              label={team.conference}
                              sx={{ 
                                bgcolor: alpha(primaryColor, 0.1), 
                                color: primaryColor,
                                fontSize: '0.7rem',
                                mr: 0.5,
                                mb: 0.5
                              }}
                            />
                          )}
                          {team.city && team.state && (
                            <Chip 
                              size="small" 
                              label={`${team.city}, ${team.state}`}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>

                        {/* Quick Stats */}
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          {team.championships && team.championships > 0 && (
                            <Grid item xs={6}>
                              <Tooltip title="NCAA Championships">
                                <Box sx={{ textAlign: 'center' }}>
                                  <EmojiEventsIcon sx={{ fontSize: 20, color: '#FFD700' }} />
                                  <Typography variant="caption" display="block">
                                    {team.championships}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                          {team.final_four_appearances && team.final_four_appearances > 0 && (
                            <Grid item xs={6}>
                              <Tooltip title="Final Four Appearances">
                                <Box sx={{ textAlign: 'center' }}>
                                  <StarIcon sx={{ fontSize: 20, color: '#C0C0C0' }} />
                                  <Typography variant="caption" display="block">
                                    {team.final_four_appearances}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Grid>
                          )}
                        </Grid>

                        {/* View Details Button Indicator */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'primary.main',
                            mt: 2
                          }}
                        >
                          <Typography variant="body2" sx={{ mr: 0.5 }}>
                            View Details
                          </Typography>
                          <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination Section */}
          {totalPages > 1 && (
            <Paper sx={{ p: 3, mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePreviousPage}
                disabled={!cursor}
              >
                Previous
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Page {currentPage} of {totalPages}
                </Typography>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={(_, page) => {
                    // Simple pagination - map page number to cursor
                    setCursor((page - 1) * perPage);
                  }}
                  color="primary"
                  size="small"
                  showFirstButton 
                  showLastButton
                />
              </Box>

              <Button
                variant="outlined"
                endIcon={<ArrowForwardIconNav />}
                onClick={handleNextPage}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </Paper>
          )}

          {/* Results Summary */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredTeams.length} of {totalTeams} teams
            </Typography>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
              size="small"
            >
              Refresh
            </Button>
          </Box>
        </>
      )}

      {/* Footer Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Data provided by college basketball statistics API • Updated daily during season
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip 
            size="small" 
            label={`${totalTeams} total teams`} 
            variant="outlined" 
            sx={{ mr: 1 }} 
          />
          <Chip 
            size="small" 
            label="Division I" 
            variant="outlined" 
          />
          {data?.meta.source && (
            <Chip 
              size="small" 
              label={`Source: ${data.meta.source}`} 
              variant="outlined" 
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

const NCAABTeamsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="NCAABTeams">
      <NCAABTeamsContent />
    </ProtectedRoute>
  );
};

export default NCAABTeamsScreen;
