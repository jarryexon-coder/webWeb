import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const secretphrasesScreen: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            secretphrases
          </Typography>
          <Typography variant="body1">
            This screen is under development. Coming soon!
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Route: /secret-phrases
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default secretphrasesScreen;
