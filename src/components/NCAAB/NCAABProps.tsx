import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Player } from '../../types/ncaab.types';

interface NCAABPropsProps {
  onAddToLineup?: (player: Player) => void; // optional, if you have fantasy lineup integration
  allPlayers?: Player[];
}

interface PropSelection {
  id: string;
  player: string;
  team: string;
  position: string;
  stat_type: string;
  line: number;
  projection: number;
  edge?: number;
  bookmaker: string;
  away_team_abbr: string;
  home_team_abbr: string;
}

const NCAABProps: React.FC<NCAABPropsProps> = ({ onAddToLineup, allPlayers = [] }) => {
  const [props, setProps] = useState<PropSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = 'https://python-api-fresh-production.up.railway.app'; // adjust if needed
        const url = `${apiBase}/api/ncaab/odds`; // there is no props endpoint, but odds might be closest
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Transform odds data into props if needed, or simply display odds.
        // For now, assume the endpoint returns an array of odds objects.
        setProps(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load props');
        console.error('[NCAABProps] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  const getEdge = (prop: PropSelection): number => {
    if (prop.edge !== undefined) return parseFloat(prop.edge as any);
    if (prop.projection && prop.line) {
      return ((prop.projection - prop.line) / prop.line) * 100;
    }
    return 0;
  };

  const handleAdd = (prop: PropSelection) => {
    if (onAddToLineup) {
      const fullPlayer = allPlayers.find(p => p.full_name === prop.player);
      if (fullPlayer) {
        onAddToLineup(fullPlayer);
      } else {
        // Create a minimal player object
        onAddToLineup({
          id: parseInt(prop.id) || 0,
          first_name: prop.player.split(' ')[0],
          last_name: prop.player.split(' ').slice(1).join(' '),
          full_name: prop.player,
          team_id: 0,
          position: prop.position,
        } as Player);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (props.length === 0) {
    return <Alert severity="info">No NCAAB props available at this time.</Alert>;
  }

  // Group by player for display
  const grouped = props.reduce((acc, prop) => {
    if (!acc[prop.player]) acc[prop.player] = [];
    acc[prop.player].push(prop);
    return acc;
  }, {} as Record<string, PropSelection[]>);

  return (
    <Box>
      {Object.entries(grouped).map(([playerName, playerProps]) => (
        <Card key={playerName} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">{playerName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {playerProps[0].team} • {playerProps[0].position}
                </Typography>
              </Box>
              <Chip label="Live" size="small" color="success" />
            </Box>

            <Grid container spacing={2}>
              {playerProps.map((prop, idx) => {
                const edge = getEdge(prop);
                const edgeColor = edge > 5 ? 'success' : edge < -5 ? 'error' : 'default';
                return (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2">{prop.stat_type}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Line: {prop.line}</Typography>
                        <Typography variant="body2">Proj: {prop.projection?.toFixed(1)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, alignItems: 'center' }}>
                        <Chip label={prop.bookmaker} size="small" variant="outlined" />
                        <Chip label={`${edge.toFixed(1)}%`} size="small" color={edgeColor} variant="outlined" />
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {onAddToLineup && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" size="small" onClick={() => handleAdd(playerProps[0])}>
                  Add to Lineup
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default NCAABProps;
