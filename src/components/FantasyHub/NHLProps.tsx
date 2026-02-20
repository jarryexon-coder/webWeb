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
import { Player } from '../../types/fantasy.types';

interface NHLPropsProps {
  onAddToLineup: (player: Player) => void;
  allPlayers: Player[];
}

interface PropItem {
  stat: string;
  line: number;
  over_odds: number;
  under_odds: number;
  projected: number;
}

interface PlayerProps {
  id: string;
  player: string;
  team: string;
  position: string;
  props: PropItem[];
  last_updated: string;
  is_mock: boolean;
  source: string;
}

const NHLProps: React.FC<NHLPropsProps> = ({ onAddToLineup, allPlayers }) => {
  const [propsData, setPropsData] = useState<PlayerProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = 'https://python-api-fresh-production.up.railway.app';
        const url = `${apiBase}/api/fantasy/props?sport=nhl&limit=20`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.props)) {
          setPropsData(data.props);
        } else {
          setPropsData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load props');
        console.error('[NHLProps] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  const getFullPlayer = (playerName: string): Player | undefined => {
    if (!allPlayers) return undefined;
    return allPlayers.find(p => p.name === playerName);
  };

  const handleAdd = (propPlayer: PlayerProps) => {
    const full = getFullPlayer(propPlayer.player);
    if (full) {
      onAddToLineup(full);
    } else {
      // Improved fallback: estimate salary based on projection
      const firstProp = propPlayer.props[0];
      const estimatedProjection = firstProp?.projected || firstProp?.line || 15;
      const estimatedSalary = Math.min(15000, Math.max(3000, Math.round(estimatedProjection * 250 + 2000)));
      onAddToLineup({
        id: propPlayer.id,
        name: propPlayer.player,
        team: propPlayer.team,
        position: propPlayer.position,
        salary: estimatedSalary,
        fantasy_projection: estimatedProjection,
      });
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
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Filter out players with no valid props (line > 0)
  const validProps = propsData.filter(p => p.props.some(prop => prop.line > 0));
  if (validProps.length === 0) {
    return (
      <Alert severity="info">No real-time player props available at this time.</Alert>
    );
  }

  return (
    <Box>
      {validProps.map(playerProps => (
        <Card key={playerProps.id} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">{playerProps.player}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {playerProps.team} • {playerProps.position}
                </Typography>
              </Box>
              <Chip
                label={playerProps.is_mock ? 'Simulated' : 'Live'}
                size="small"
                color={playerProps.is_mock ? 'warning' : 'success'}
              />
            </Box>

            <Grid container spacing={2}>
              {playerProps.props.map((prop, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{prop.stat}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2">Line: {prop.line}</Typography>
                      <Typography variant="body2">Proj: {prop.projected?.toFixed(1)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Chip label={`O ${prop.over_odds}`} size="small" variant="outlined" />
                      <Chip label={`U ${prop.under_odds}`} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" size="small" onClick={() => handleAdd(playerProps)}>
                Add to Lineup
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default NHLProps;
