// src/pages/CheckoutSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversionSent, setConversionSent] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 CheckoutSuccess page loaded');
    console.log('📍 Current pathname:', location.pathname);
    console.log('🔗 Search params:', location.search);
    console.log('📋 All URL params:', Object.fromEntries(new URLSearchParams(location.search)));
  }, [location]);

  const queryParams = new URLSearchParams(location.search);
  const plan = queryParams.get('plan');
  const type = queryParams.get('type');
  const credits = queryParams.get('credits');
  const value = parseFloat(queryParams.get('value') || '0');
  const label = queryParams.get('label');
  const sessionId = queryParams.get('session_id');

  console.log('📊 Parsed params:', { plan, type, credits, value, label, sessionId });

  // Send conversions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!conversionSent && typeof window.gtag === 'function') {
        if (type === 'credits') {
          window.gtag('event', 'purchase', {
            'transaction_id': sessionId || Date.now().toString(),
            'value': value,
            'currency': 'USD',
            'items': [{
              'item_name': `${credits} Generator Credits`,
              'price': value,
              'quantity': 1
            }]
          });
          console.log(`✅ GA4 purchase event sent for ${credits} credits, value: ${value}`);
          setConversionSent(true);
        } else if (plan && plan !== 'influencer') {
          window.gtag('event', 'purchase', {
            'transaction_id': Date.now().toString(),
            'value': value,
            'currency': 'USD',
            'items': [{
              'item_name': `${plan} Subscription`,
              'price': value,
              'quantity': 1
            }]
          });
          console.log(`✅ GA4 purchase event sent for ${plan}, value: ${value}`);
          setConversionSent(true);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [plan, type, credits, value, label, sessionId, conversionSent]);

  let title = 'Success!';
  let message = '';

  if (type === 'credits') {
    title = 'Generator Credits Added!';
    message = `You have successfully purchased ${credits || 'generator'} credits. These credits have been added to your account and can be used for AI predictions and generator features.`;
  } else if (plan === 'influencer') {
    title = 'Influencer Access Activated!';
    message = 'Your influencer access has been activated. You now have full access to all features.';
  } else if (plan && plan !== 'free') {
    title = 'Subscription Successful!';
    message = `Your ${plan} plan is now active. Thank you for your purchase!`;
  } else {
    message = 'Your purchase has been processed. Your account will be updated shortly.';
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>{title}</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          {type === 'credits' && (
            <Button variant="outlined" onClick={() => navigate('/generator')}>
              Go to Generator
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CheckoutSuccess;
