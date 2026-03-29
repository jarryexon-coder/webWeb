// src/pages/SubscriptionCancel.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  const handleGoToSubscription = () => {
    navigate('/subscription');
  };

  const handleTryAgain = () => {
    navigate('/subscription');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <CancelIcon sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
        
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Purchase Canceled
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Your purchase was canceled. No charges were made.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          You can return to the subscription page to choose a plan whenever you're ready.
        </Alert>
        
        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoToSubscription}
            size="large"
          >
            Back to Subscription
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={handleTryAgain}
            size="large"
          >
            Try Again
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SubscriptionCancel;
