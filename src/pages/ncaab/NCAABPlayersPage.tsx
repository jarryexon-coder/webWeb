import React, { useState, useEffect, useMemo } from 'react';
import { Container, Typography, TextField, List, ListItem, ListItemText, Paper, Chip, CircularProgress, Button, Box } from '@mui/material';
import { usePlayers, useConferences } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

// Complete Division I conference names (including all found in the API)
const DIVISION_I_CONFERENCE_NAMES = new Set([
  // Major conferences (various name forms)
  'ACC',
  'Big Ten',
  'Big 12',
  'SEC',
  'Pac-12',
  'Ivy League',
  'Big East',
  'Atlantic 10',
  'America East Conference',
  'American Athletic Conference',
  'ASUN Conference',
  'Big Sky Conference',
  'Big South Conference',
  'Big West Conference',
  'Coastal Athletic Association',
  'Conference USA',
  'Horizon League',
  'Metro Atlantic Athletic Conference',
  'Mid-American Conference',
  'Mid-Eastern Athletic Conference',
  'Missouri Valley Conference',
  'Mountain West Conference',
  'Northeast Conference',
  'Ohio Valley Conference',
  'Patriot League',
  'Southern Conference',
  'Southland Conference',
  'Southwestern Athletic Conference',
  'Summit League',
  'Sun Belt Conference',
  'West Coast Conference',
  'Western Athletic Conference',
  // Additional full names (from missing conferences)
  'American Conference',
  'Atlantic 10 Conference',
  'Atlantic Coast Conference',
  'Big 12 Conference',
  'Big Ten Conference',
]);

const NCAABPlayersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [divisionOnly, setDivisionOnly] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const { data: playersData, isLoading: playersLoading, error: playersError } = usePlayers({ search, per_page: 100 });
  const { data: conferencesData, isLoading: conferencesLoading, error: conferencesError } = useConferences();

  // Safely extract conferences array
  const conferences = useMemo(() => {
    if (Array.isArray(conferencesData)) return conferencesData;
    return conferencesData?.data ?? [];
  }, [conferencesData]);

  // Build a Set of conference IDs that are Division I based on name
  const divisionIConferenceIds = useMemo(() => {
    const ids = conferences
      .filter(conf => DIVISION_I_CONFERENCE_NAMES.has(conf.name))
      .map(conf => conf.id);
    console.log('🏷️ Division I conference IDs (by name):', ids);
    return new Set(ids);
  }, [conferences]);

  // Safely extract players array
  const allPlayers = useMemo(() => {
    if (Array.isArray(playersData)) return playersData;
    return playersData?.data ?? [];
  }, [playersData]);

  // Debug logging (can be removed later)
  useEffect(() => {
    if (allPlayers.length === 0) return;

    const playersWithConfId = allPlayers.filter(p => p.team?.conference_id != null);
    console.log('📊 Players with conference_id:', playersWithConfId.length, 'out of', allPlayers.length);

    if (playersWithConfId.length > 0) {
      const sampleWithConf = playersWithConfId[0];
      console.log('🔍 Sample player with conference_id:', sampleWithConf);
      console.log('🔍 conference_id:', sampleWithConf.team?.conference_id);
      console.log('🔍 Is in Division I set?', divisionIConferenceIds.has(sampleWithConf.team?.conference_id));

      const confIds = [...new Set(playersWithConfId.map(p => p.team.conference_id))];
      console.log('🔍 Unique conference IDs among players:', confIds);
    }

    const playersWithoutConfId = allPlayers.filter(p => p.team?.conference_id == null);
    if (playersWithoutConfId.length > 0) {
      const sampleWithout = playersWithoutConfId[0];
      console.log('🔍 Sample player without conference_id:', sampleWithout);
      console.log('🔍 Sample player team:', sampleWithout.team);
    }
  }, [allPlayers, divisionIConferenceIds]);

  // Filter players to Division I only, or show all based on toggle
  const filteredPlayers = useMemo(() => {
    if (!divisionOnly || showAll) {
      console.log('⚠️ returning all players (showAll mode)');
      return allPlayers;
    }

    const start = performance.now();
    const filtered = allPlayers.filter(player => {
      const confId = player.team?.conference_id;
      const keep = confId && divisionIConferenceIds.has(confId);
      return keep;
    });
    console.log(`⏱️ filter took ${performance.now() - start}ms, kept ${filtered.length} of ${allPlayers.length} players`);

    if (filtered.length > 0) {
      const keptConfIds = filtered.map(p => p.team?.conference_id);
      console.log('✅ Kept conference IDs:', [...new Set(keptConfIds)]);
    }

    return filtered;
  }, [allPlayers, divisionIConferenceIds, divisionOnly, showAll]);

  const getTeamName = (player: any): string | null => {
    const team = player.team;
    if (!team) return null;
    return team.full_name || team.name || team.school || team.market || team.nickname || team.abbreviation || null;
  };

  if (playersLoading || conferencesLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading players...</Typography>
      </Container>
    );
  }

  if (playersError || conferencesError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="error">
          Error loading data: {playersError?.message || conferencesError?.message}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NCAA Basketball Players</Typography>
      <TextField
        fullWidth
        label="Search players"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2">
          Total players: {allPlayers.length} | Division I (by name): {filteredPlayers.length}
        </Typography>
        <Button variant="outlined" size="small" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show Division I Only' : 'Show All Players'}
        </Button>
      </Box>
      {filteredPlayers.length === 0 && !showAll && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          No Division I players found. Try "Show All Players" to see all.
        </Typography>
      )}
      <Paper>
        <List>
          {filteredPlayers.map((player) => {
            const teamName = getTeamName(player);
            const fullName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || `Player ${player.id}`;
            const position = player.position || '';
            const playerClass = player.class || player.year || '';

            return (
              <ListItem key={player.id} component={Link} to={`/ncaab/players/${player.id}`} button>
                <ListItemText
                  primary={fullName}
                  secondary={
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {teamName && <Chip label={teamName} size="small" variant="outlined" component="span" />}
                      {position && <Chip label={position} size="small" variant="outlined" component="span" />}
                      {playerClass && <Chip label={playerClass} size="small" variant="outlined" component="span" />}
                    </span>
                  }
                  secondaryTypographyProps={{ component: 'span' }}
                />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Container>
  );
};

export default NCAABPlayersPage;
