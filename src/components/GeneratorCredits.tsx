import React from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, Button } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';

interface GeneratorCreditsProps {
  creditsUsed: number;
  creditsTotal: number;
  onPurchaseCredits: () => void;
}

const GeneratorCredits: React.FC<GeneratorCreditsProps> = ({ 
  creditsUsed, 
  creditsTotal, 
  onPurchaseCredits 
}) => {
  const percentage = (creditsUsed / creditsTotal) * 100;
  const remaining = creditsTotal - creditsUsed;

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: '#f59e0b', color: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltIcon />
          <Typography variant="h6">Generator Credits</Typography>
        </Box>
        <Chip 
          label={`${remaining} remaining`} 
          sx={{ bgcolor: 'white', color: '#f59e0b', fontWeight: 'bold' }}
        />
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 10, 
          borderRadius: 5,
          bgcolor: 'rgba(255,255,255,0.3)',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'white'
          }
        }} 
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
        <Typography variant="caption">{creditsUsed} used</Typography>
        <Typography variant="caption">{creditsTotal} total</Typography>
      </Box>
      
      <Button 
        variant="contained" 
        fullWidth
        onClick={onPurchaseCredits}
        sx={{ 
          bgcolor: 'white', 
          color: '#f59e0b',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
        }}
      >
        Buy More Credits
      </Button>
    </Paper>
  );
};

export default GeneratorCredits;
