// src/components/FantasyHub/FantasyLineupBuilder.tsx
import React from 'react';
import { Box, Paper, Typography, Chip, IconButton, Button, Divider } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { FantasyLineup } from '../../types/fantasy.types';

interface FantasyLineupBuilderProps {
  lineup: FantasyLineup;
  onRemovePlayer: (playerId: string) => void;
  onClearLineup: () => void;
}

const FantasyLineupBuilder: React.FC<FantasyLineupBuilderProps> = ({
  lineup,
  onRemovePlayer,
  onClearLineup
}) => {
  const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
  const totalSalary = lineup.slots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
  const totalProjection = lineup.slots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

  return (
    <Box>
      {/* Lineup slots */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {lineup.slots.map((slot, index) => (
          <Paper
            key={`${slot.position}-${index}`}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: slot.player ? 'primary.50' : 'grey.50',
              borderColor: slot.player ? 'primary.200' : 'grey.300',
              borderStyle: slot.player ? 'solid' : 'dashed',
            }}
          >
            {slot.player ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={slot.position} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2" fontWeight="500">
                    {slot.player.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({slot.player.team})
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                    Proj: {slot.player.fantasy_projection?.toFixed(1)} FP
                  </Typography>
                  <Typography variant="caption" fontWeight="500">
                    ${slot.player.salary?.toLocaleString()}
                  </Typography>
                  {slot.player.value && (
                    <Chip
                      label={`Value: ${slot.player.value.toFixed(2)}`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                    />
                  )}
                </Box>
                <IconButton size="small" onClick={() => onRemovePlayer(slot.player!.id)}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                {slot.position} • Empty Slot
              </Typography>
            )}
          </Paper>
        ))}
      </Box>

      {/* Summary stats */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Total Salary Used:</Typography>
          <Typography variant="body2" fontWeight="bold">${totalSalary.toLocaleString()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Remaining Cap:</Typography>
          <Typography variant="body2" fontWeight="bold" color={lineup.remaining_cap < 0 ? 'error' : 'success.main'}>
            ${lineup.remaining_cap.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Projected FP:</Typography>
          <Typography variant="body2" fontWeight="bold" color="primary.main">
            {totalProjection.toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Players:</Typography>
          <Typography variant="body2" fontWeight="bold">{filledSlots}/9</Typography>
        </Box>
      </Box>

      {/* Clear button (optional, since parent also has one) */}
      {filledSlots > 0 && (
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={onClearLineup}
          sx={{ mt: 2 }}
        >
          Clear Lineup
        </Button>
      )}
    </Box>
  );
};

export default FantasyLineupBuilder;
