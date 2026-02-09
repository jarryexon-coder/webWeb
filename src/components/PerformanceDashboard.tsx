import React from 'react';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import { getApiPerformance, clearApiCache, debugApiState } from '../hooks/useUnifiedAPI';

const PerformanceDashboard: React.FC = () => {
  const [performance, setPerformance] = React.useState(getApiPerformance());

  const refresh = () => {
    setPerformance(getApiPerformance());
  };

  const handleClearCache = () => {
    clearApiCache();
    refresh();
  };

  const handleDebug = () => {
    debugApiState();
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 70,
        right: 16,
        zIndex: 9999,
        p: 2,
        maxWidth: 300,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #ddd',
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        🚀 Performance Dashboard
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Avg Response:</Typography>
          <Chip 
            label={`\${performance.averageResponseTime?.toFixed(0) || 0}ms`}
            size="small"
            color={performance.averageResponseTime > 1000 ? 'error' : 'success'}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Success Rate:</Typography>
          <Chip 
            label={`\${(performance.successRate * 100)?.toFixed(0) || 0}%`}
            size="small"
            color={performance.successRate > 0.9 ? 'success' : performance.successRate > 0.7 ? 'warning' : 'error'}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Total Requests:</Typography>
          <Chip label={performance.totalRequests?.toString() || '0'} size="small" />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">Cache Size:</Typography>
          <Chip label={performance.cacheSize?.toString() || '0'} size="small" />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button size="small" variant="outlined" onClick={refresh}>
            Refresh
          </Button>
          <Button size="small" variant="outlined" onClick={handleClearCache}>
            Clear Cache
          </Button>
          <Button size="small" variant="outlined" onClick={handleDebug}>
            Debug
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PerformanceDashboard;
