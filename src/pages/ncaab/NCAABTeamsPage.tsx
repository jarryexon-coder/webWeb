import React, { useMemo } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, CircularProgress, Alert } from '@mui/material';
import { useTeams, useConferences } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

const NCAABTeamsPage: React.FC = () => {
  const { data: teamsData, isLoading: teamsLoading, error: teamsError } = useTeams({ per_page: 50 });
  const { data: conferencesData, isLoading: conferencesLoading, error: conferencesError } = useConferences();

  // Safely extract teams array
  const teams = useMemo(() => {
    if (Array.isArray(teamsData)) return teamsData;
    return teamsData?.data ?? [];
  }, [teamsData]);

  // Safely extract conferences array and build a lookup map
  const conferenceMap = useMemo(() => {
    const confs = Array.isArray(conferencesData) ? conferencesData : (conferencesData?.data ?? []);
    const map = new Map<number, string>();
    confs.forEach(conf => {
      if (conf.id && conf.name) {
        map.set(conf.id, conf.name);
      }
    });
    return map;
  }, [conferencesData]);

  if (teamsLoading || conferencesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading teams...</Typography>
      </Container>
    );
  }

  if (teamsError || conferencesError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Error loading data: {teamsError?.message || conferencesError?.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NCAA Basketball Teams</Typography>
      <Grid container spacing={2}>
        {teams.map((team) => {
          const conferenceName = conferenceMap.get(team.conference_id) || `Conference ${team.conference_id}`;
          return (
            <Grid item xs={12} sm={6} md={4} key={team.id}>
              <Card component={Link} to={`/ncaab/teams/${team.id}`} sx={{ textDecoration: 'none' }}>
                <CardContent>
                  <Typography variant="h6">{team.full_name || team.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.nickname || ''}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      Conference: {conferenceName}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default NCAABTeamsPage;
