import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface GolfLeaderboardEntry {
  id: string;
  position: number | string;      // e.g., 1, T2, CUT
  player_name: string;
  country_code: string;
  to_par: number;                  // relative to par (negative = under)
  round_1?: number;
  round_2?: number;
  round_3?: number;
  round_4?: number;
  total: number;                   // total strokes
  status?: 'amateur' | 'cut' | 'wd' | 'dq';
  today?: number;                  // strokes today (if live)
}

interface GolfLeaderboardTableProps {
  entries: GolfLeaderboardEntry[];
  isLoading?: boolean;
  error?: Error | null;
  tournamentName?: string;
  showRoundColumns?: boolean;      // whether to show individual round columns
}

// ----------------------------------------------------------------------
// Styled Components
// ----------------------------------------------------------------------

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 600,
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 'bold',
  },
}));

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

const formatToPar = (toPar: number): string => {
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
};

const getScoreColor = (toPar: number): string => {
  if (toPar < 0) return '#d32f2f'; // red for under par
  if (toPar > 0) return '#1976d2'; // blue for over par
  return 'inherit';                 // black for even
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

const GolfLeaderboardTable: React.FC<GolfLeaderboardTableProps> = ({
  entries,
  isLoading = false,
  error = null,
  tournamentName,
  showRoundColumns = true,
}) => {
  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error loading leaderboard: {error.message}</Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={40} sx={{ my: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  if (!entries.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No leaderboard data available.</Typography>
      </Paper>
    );
  }

  return (
    <StyledTableContainer component={Paper} variant="outlined">
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Pos</TableCell>
            <TableCell>Player</TableCell>
            <TableCell align="center">To Par</TableCell>
            {showRoundColumns && (
              <>
                <TableCell align="center">R1</TableCell>
                <TableCell align="center">R2</TableCell>
                <TableCell align="center">R3</TableCell>
                <TableCell align="center">R4</TableCell>
              </>
            )}
            <TableCell align="center">Total</TableCell>
            <TableCell align="center">Today</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} hover>
              {/* Position */}
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {entry.status ? (
                    <Chip
                      label={entry.status.toUpperCase()}
                      size="small"
                      color={
                        entry.status === 'cut'
                          ? 'warning'
                          : entry.status === 'amateur'
                          ? 'info'
                          : 'default'
                      }
                    />
                  ) : (
                    <Typography fontWeight="medium">{entry.position}</Typography>
                  )}
                </Box>
              </TableCell>

              {/* Player */}
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {entry.player_name}
                  </Typography>
                  <Chip
                    label={entry.country_code}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
              </TableCell>

              {/* To Par */}
              <TableCell align="center">
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: getScoreColor(entry.to_par) }}
                >
                  {formatToPar(entry.to_par)}
                </Typography>
              </TableCell>

              {/* Rounds */}
              {showRoundColumns && (
                <>
                  <TableCell align="center">{entry.round_1 ?? '-'}</TableCell>
                  <TableCell align="center">{entry.round_2 ?? '-'}</TableCell>
                  <TableCell align="center">{entry.round_3 ?? '-'}</TableCell>
                  <TableCell align="center">{entry.round_4 ?? '-'}</TableCell>
                </>
              )}

              {/* Total */}
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {entry.total}
                </Typography>
              </TableCell>

              {/* Today (if available) */}
              <TableCell align="center">
                {entry.today !== undefined ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: entry.today < 0 ? '#d32f2f' : entry.today > 0 ? '#1976d2' : 'inherit',
                    }}
                  >
                    {entry.today > 0 ? `+${entry.today}` : entry.today}
                  </Typography>
                ) : (
                  '-'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

export default GolfLeaderboardTable;
