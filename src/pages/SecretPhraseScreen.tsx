// src/pages/SecretPhraseScreen.tsx
import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Fade,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardActions,
  Stack,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Fab,
  Drawer,
  Menu,
  MenuItem,
  ListItemAvatar,
  Breadcrumbs,
  Link as MuiLink,
  Pagination,
  Rating,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';

// Timeline components from @mui/lab
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Diamond as DiamondIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  FlashOn as FlashIcon,
  Book as BookIcon,
  AutoAwesome as SparklesIcon,
  History as HistoryIcon,
  Key as KeyIcon,
  RocketLaunch as RocketIcon,
  CopyAll as CopyIcon,
  Lightbulb as LightbulbIcon,
  Security as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  Lock as LockIcon,
  PlayArrow as PlayIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  MonetizationOn as MoneyIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const SecretPhraseScreen: React.FC = () => {
  const [secretPhrase, setSecretPhrase] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const theme = useTheme();

  const handleGeneratePhrase = useCallback(() => {
    setIsLoading(true);
    // Generate secret phrase logic
    setTimeout(() => {
      const phrases = [
        'basketball-trophy-champion-2024-nba-winner',
        'secure-key-phrase-recovery-2024-sports',
        'champion-passphrase-victory-sports-nba'
      ];
      setSecretPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const steps = [
    'Generate Secret Phrase',
    'Backup Securely',
    'Verification',
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            🔐 Secret Phrase Management
          </Typography>
          <Box />
        </Box>

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 0 && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 100, 
                height: 100, 
                mb: 3,
                mx: 'auto'
              }}>
                <KeyIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                Generate Your Secret Recovery Phrase
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                This phrase is the master key to your account. Keep it safe and secure.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={handleGeneratePhrase}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={24} /> : <SparklesIcon />}
                sx={{ mt: 3, mb: 3 }}
              >
                {isLoading ? 'Generating...' : 'Generate Secret Phrase'}
              </Button>
              
              {secretPhrase && (
                <Fade in={!!secretPhrase}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50', mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Your Secret Phrase:
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.900', 
                        color: 'white',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                      }}
                    >
                      {secretPhrase}
                    </Paper>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        startIcon={<CopyIcon />}
                        onClick={() => navigator.clipboard.writeText(secretPhrase)}
                        variant="outlined"
                        size="small"
                      >
                        Copy
                      </Button>
                      <Button
                        startIcon={<ShieldIcon />}
                        onClick={handleNextStep}
                        variant="contained"
                        size="small"
                      >
                        I've Saved It Securely
                      </Button>
                    </Box>
                  </Paper>
                </Fade>
              )}
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom align="center">
                🔒 Backup Your Phrase Securely
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Do NOT
                        </Typography>
                      </Box>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CloseIcon color="error" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Take screenshots"
                            secondary="Can be hacked or lost"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CloseIcon color="error" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Store digitally"
                            secondary="Not in email, cloud, or notes"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CloseIcon color="error" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Share with anyone"
                            secondary="Never give out your phrase"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          DO
                        </Typography>
                      </Box>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <BookIcon color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Write it down"
                            secondary="Use pen and paper"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LockIcon color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Store physically"
                            secondary="Safe deposit box or fireproof safe"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CopyIcon color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Make multiple copies"
                            secondary="Store in different secure locations"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBackStep}
                  sx={{ mr: 2 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                >
                  I've Backed It Up Securely
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Avatar sx={{ 
                bgcolor: 'success.main', 
                width: 100, 
                height: 100, 
                mb: 3,
                mx: 'auto'
              }}>
                <CheckCircleIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                ✅ Verification Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Your secret phrase has been generated and should be stored securely.
              </Typography>
              
              <Alert severity="success" sx={{ mt: 3, mb: 3 }}>
                <Typography variant="body1">
                  Remember: Your secret phrase is the ONLY way to recover your account.
                  If you lose it, your account cannot be recovered.
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBackStep}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/"
                >
                  Return to Dashboard
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Timeline View */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom align="center">
            Recovery Process Timeline
          </Typography>
          <Timeline position="alternate">
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Step 1
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <KeyIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">Generate Phrase</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a unique secret recovery phrase
                </Typography>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Step 2
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <CopyIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">Backup Securely</Typography>
                <Typography variant="body2" color="text.secondary">
                  Write down and store in multiple secure locations
                </Typography>
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineOppositeContent color="text.secondary">
                Step 3
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <CheckCircleIcon />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">Verification</Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirm you've saved it correctly
                </Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </Paper>

        {/* Security Tips Grid */}
        <Typography variant="h5" gutterBottom>
          Security Best Practices
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'error.light', mr: 2 }}>
                    <ShieldIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Never Share
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Your secret phrase is like a password. Never share it with anyone, 
                  including customer support or "official" representatives.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                    <LockIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Offline Storage
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Store your phrase offline. Avoid digital storage like email, 
                  cloud services, or password managers that can be compromised.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                    <CopyIcon />
                  </Avatar>
                  <Typography variant="h6">
                    Multiple Copies
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Create multiple physical copies stored in different secure 
                  locations to protect against loss from fire, flood, or theft.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default SecretPhraseScreen;
