import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Player } from '../../types/fantasy.types';

interface PlayerTrendsProps {
  sport: string;
  onSelectPlayer: (player: Player) => void;
  allPlayers: Player[]; // full player list from parent
}

interface TrendData {
  player_id: number;
  player_name: string;
  team: string;
  position: string;
  trend: 'hot' | 'cold' | 'neutral';
  difference: number;
  last_5_avg: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    min: number;
  };
  season_avg: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    min: number;
    fg_pct: number;
    fg3_pct: number;
    ft_pct: number;
  };
}

const PlayerTrends: React.FC<PlayerTrendsProps> = ({ sport, onSelectPlayer, allPlayers }) => {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = 'https://python-api-fresh-production.up.railway.app';
        const url = `${apiBase}/api/players/trends?sport=${sport}&limit=10`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && data.data?.trends) {
          setTrends(data.data.trends);
        } else {
          setTrends([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trends');
        console.error('[PlayerTrends] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [sport]);

  // Find the full player object from allPlayers by name (best effort)
  const getFullPlayer = (trend: TrendData): Player | undefined => {
    return allPlayers.find(p => p.name === trend.player_name);
  };

  const handleAdd = (trend: TrendData) => {
    const full = getFullPlayer(trend);
    if (full) {
      onSelectPlayer(full);
    } else {
      // Fallback: create a minimal player object using trend data
      // Use season avg points as projection, default salary 5000
      onSelectPlayer({
        id: `trend-${trend.player_id}-${Date.now()}`,
        name: trend.player_name,
        team: trend.team,
        position: trend.position,
        salary: 5000,
        fantasy_projection: trend.season_avg?.pts || 15,
        // add other optional fields if needed
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={30} />
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

  if (trends.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No trending players available.
      </Alert>
    );
  }

  return (
    <Box>
      {trends.map((trend, index) => {
        // Create a truly unique key by combining multiple identifiers
        const uniqueKey = `trend-${trend.player_id}-${trend.player_name}-${index}`;
        
        return (
          <Card key={uniqueKey} sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">
                  {trend.player_name}
                  {trend.trend === 'hot' && ' 🔥'}
                  {trend.trend === 'cold' && ' ❄️'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {trend.team} • {trend.position} • {trend.difference > 0 ? '+' : ''}{trend.difference} vs season
                </Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={() => handleAdd(trend)}>
                Add
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default PlayerTrends;
