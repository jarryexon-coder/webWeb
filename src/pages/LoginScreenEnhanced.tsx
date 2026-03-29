import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  Link,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

type AuthMode = 'login' | 'signup';

const LoginScreenEnhanced: React.FC = () => {
  const { user, login, signUp, signInWithGoogle, error, loading, clearError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Navigate as soon as user becomes available (and loading is done)
  useEffect(() => {
    if (user && !loading) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log('🔥 handleSubmit called, mode:', mode, 'email:', email);
  try {
    if (mode === 'login') {
      await login(email, password);
    } else {
      await signUp(email, password, displayName);
    }
    console.log('✅ signIn/signUp succeeded, navigating...');
    navigate('/home', { replace: true });
  } catch (err) {
    console.error('❌ Login failed:', err);
  }
};

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // No navigate here – the useEffect will handle it
    } catch (err) {
      // Error handled by context
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setDisplayName('');
    clearError();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {mode === 'login' ? 'Login' : 'Create Account'}
        </Typography>
        {error && <Alert severity="error" onClose={clearError}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {mode === 'signup' && (
            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              margin="normal"
              required
            />
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </Button>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={toggleMode}
            sx={{ cursor: 'pointer' }}
          >
            {mode === 'login'
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </Link>
        </Box>
        <Divider sx={{ my: 2 }}>OR</Divider>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Continue with Google
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginScreenEnhanced;
