// src/pages/SubscriptionScreen.tsx
import React, { useState, useEffect } from 'react';
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
  CardActions,
  Stack,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Breadcrumbs,
  Link as MuiLink,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Diamond as DiamondIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as SparklesIcon,
  Key as KeyIcon,
  RocketLaunch as RocketIcon,
  Refresh as RefreshIcon,
  Security as ShieldIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  Tv as TvIcon,
  GridView as CubeIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Lock as LockIcon,
  ExpandMore as ExpandMoreIcon,
  CompareArrows as CompareIcon,
  Group as GroupIcon,
  EmojiEvents as TrophyIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Styled Components
const GradientPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius * 2,
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const PopularBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: -10,
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
  fontWeight: 'bold',
  fontSize: '0.75rem',
}));

const FeatureRow = ({ feature }: { feature: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16, mr: 1 }} />
    <Typography variant="body2" color="text.secondary">
      {feature}
    </Typography>
  </Box>
);

// Mock subscription data
const subscriptionData = {
  user: {
    hasActiveSubscription: false,
    activeEntitlements: [],
  },
  stats: [
    { label: 'Prediction Accuracy', value: '84.7%', icon: <TrendingUpIcon /> },
    { label: 'User Success Rate', value: '76%', icon: <TrophyIcon /> },
    { label: 'Active Subscribers', value: '8,459+', icon: <GroupIcon /> },
    { label: 'Average ROI', value: '+189%', icon: <MoneyIcon /> },
  ],
};

// Free Access Package
const allAccessScreens = [
  'Live Games Screen',
  'NFL Analytics',
  'News Desk Screen',
  'Up-to-date App Updates',
  'Contest Information',
];

// Super Stats Packages
const superStatsPackages = [
  {
    id: 'superstats-weekly',
    name: 'Super Stats',
    period: 'Weekly',
    price: '$4.99',
    duration: 'per week',
    popular: false,
    icon: <AnalyticsIcon />,
    color: '#3b82f6',
    screens: [
      'Fantasy Screen AI',
      'Player Stats AI',
      'Sports News Hub',
      'NHL Analytics',
      'Game Details',
    ],
    features: [
      '5 supercharged AI stats screens',
      'Advanced handicapping tools',
      'Real-time betting insights',
      'Player performance analytics',
      'Game prediction models',
    ],
  },
  {
    id: 'superstats-monthly',
    name: 'Super Stats',
    period: 'Monthly',
    price: '$16.99',
    duration: 'per month',
    popular: true,
    discount: 'Save 15%',
    icon: <AnalyticsIcon />,
    color: '#3b82f6',
    screens: [
      'Fantasy Screen AI',
      'Player Stats AI',
      'Sports News Hub',
      'NHL Analytics',
      'Game Details',
    ],
    features: [
      '5 supercharged AI stats screens',
      'Advanced handicapping tools',
      'Real-time betting insights',
      'Player performance analytics',
      'Game prediction models',
      'Priority updates',
    ],
  },
  {
    id: 'superstats-yearly',
    name: 'Super Stats',
    period: 'Yearly',
    price: '$159.99',
    duration: 'per year',
    popular: false,
    discount: 'Save 20%',
    icon: <AnalyticsIcon />,
    color: '#3b82f6',
    screens: [
      'Fantasy Screen AI',
      'Player Stats AI',
      'Sports News Hub',
      'NHL Analytics',
      'Game Details',
    ],
    features: [
      '5 supercharged AI stats screens',
      'Advanced handicapping tools',
      'Real-time betting insights',
      'Player performance analytics',
      'Game prediction models',
      'Priority updates',
      'Early access to new features',
    ],
  },
];

// AI Generators Packages
const aiGeneratorsPackages = [
  {
    id: 'aigenerators-weekly',
    name: 'AI Generators',
    period: 'Weekly',
    price: '$29.99',
    duration: 'per week',
    popular: false,
    icon: <SparklesIcon />,
    color: '#8b5cf6',
    dailyGenerators: [
      '2 Parlay Builders',
      '2 Expert Daily Picks',
      '2 Game/Prop Predictions',
      '2 Randomized Predictions',
    ],
    includes: 'All Super Stats screens included',
    features: [
      '8 daily AI-generated predictions',
      'Parlay builder tools',
      'Expert pick analysis',
      'Game & prop predictions',
      'Randomized prediction engine',
      'Includes ALL Super Stats screens',
    ],
  },
  {
    id: 'aigenerators-monthly',
    name: 'AI Generators',
    period: 'Monthly',
    price: '$79.99',
    duration: 'per month',
    popular: true,
    discount: 'Save 11%',
    icon: <SparklesIcon />,
    color: '#8b5cf6',
    dailyGenerators: [
      '2 Parlay Builders',
      '2 Expert Daily Picks',
      '2 Game/Prop Predictions',
      '2 Randomized Predictions',
    ],
    includes: 'All Super Stats screens included',
    features: [
      '8 daily AI-generated predictions',
      'Parlay builder tools',
      'Expert pick analysis',
      'Game & prop predictions',
      'Randomized prediction engine',
      'Includes ALL Super Stats screens',
      'Priority generator access',
    ],
  },
  {
    id: 'aigenerators-yearly',
    name: 'AI Generators',
    period: 'Yearly',
    price: '$699.99',
    duration: 'per year',
    popular: false,
    discount: 'Save 27%',
    icon: <SparklesIcon />,
    color: '#8b5cf6',
    dailyGenerators: [
      '2 Parlay Builders',
      '2 Expert Daily Picks',
      '2 Game/Prop Predictions',
      '2 Randomized Predictions',
    ],
    includes: 'All Super Stats screens included',
    features: [
      '8 daily AI-generated predictions',
      'Parlay builder tools',
      'Expert pick analysis',
      'Game & prop predictions',
      'Randomized prediction engine',
      'Includes ALL Super Stats screens',
      'Priority generator access',
      'Custom generator requests',
      'Early AI model access',
    ],
  },
];

// Elite Tools - Kalshi Predictions
const kalshiPackages = [
  {
    id: 'kalshi-weekly',
    name: 'Kalshi Predictions',
    period: 'Weekly',
    price: '$4.99',
    duration: '1 week access',
    popular: false,
    icon: <TrendingUpIcon />,
    color: '#f59e0b',
    features: [
      'High-powered prediction models',
      'Real-time market analysis',
      'Probability calculations',
      'Risk assessment tools',
      'Weekly prediction reports',
    ],
  },
  {
    id: 'kalshi-monthly',
    name: 'Kalshi Predictions',
    period: 'Monthly',
    price: '$15.99',
    duration: '1 month access',
    popular: true,
    discount: 'Save 20%',
    icon: <TrendingUpIcon />,
    color: '#f59e0b',
    features: [
      'High-powered prediction models',
      'Real-time market analysis',
      'Probability calculations',
      'Risk assessment tools',
      'Weekly prediction reports',
      'Advanced analytics dashboard',
    ],
  },
];

// Elite Tools - Secret Phrases
const secretPhrasesPackages = [
  {
    id: 'secret-phrases-3',
    name: 'Secret Phrases',
    period: 'Weekly',
    price: '$9.99',
    duration: '3 phrases per week',
    popular: false,
    icon: <KeyIcon />,
    color: '#ef4444',
    features: [
      '3 secret phrases weekly',
      'Exclusive insider insights',
      'Hidden pattern detection',
      'Priority phrase generation',
      'Weekly insights report',
    ],
  },
  {
    id: 'secret-phrases-10',
    name: 'Secret Phrases',
    period: 'Weekly',
    price: '$19.99',
    duration: '10 phrases per week',
    popular: true,
    discount: 'Best Value',
    icon: <KeyIcon />,
    color: '#ef4444',
    features: [
      '10 secret phrases weekly',
      'Exclusive insider insights',
      'Hidden pattern detection',
      'Priority phrase generation',
      'Weekly insights report',
      'Advanced phrase analytics',
    ],
  },
];

// Comparison Table Data
const comparisonData = [
  { feature: 'Live Games Screen', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
  { feature: 'NFL Analytics', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
  { feature: 'News Desk', allAccess: '✓', superStats: '✓', aiGenerators: '✓' },
  { feature: 'Fantasy Screen AI', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
  { feature: 'Player Stats AI', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
  { feature: 'Sports News Hub', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
  { feature: 'NHL Analytics', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
  { feature: 'Game Details', allAccess: '×', superStats: '✓', aiGenerators: '✓' },
  { feature: 'Parlay Builders', allAccess: '×', superStats: '×', aiGenerators: '✓' },
  { feature: 'Expert Daily Picks', allAccess: '×', superStats: '×', aiGenerators: '✓' },
  { feature: 'Game/Prop Predictions', allAccess: '×', superStats: '×', aiGenerators: '✓' },
];

// Main Component
const SubscriptionScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('superstats-monthly');
  const [selectedEliteTool, setSelectedEliteTool] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isExpoGo, setIsExpoGo] = useState(false);

  const handleSubscription = async (planId: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSelectedPackage(planId);
    setShowSuccessModal(true);
    setLoading(false);
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRestoring(false);
    // Show restore success message
  };

  const handleContinueToPremium = () => {
    setShowSuccessModal(false);
    // Navigate to premium content based on selected package
    navigate('/premium-dashboard');
  };

  const renderPackageCard = (pkg: any, isElite = false) => {
    const isSelected = isElite ? selectedEliteTool === pkg.id : selectedPackage === pkg.id;
    const isPopular = pkg.popular;

    return (
      <StyledCard
        sx={{
          border: isSelected ? `2px solid ${pkg.color}` : '1px solid',
          borderColor: isSelected ? pkg.color : 'divider',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isPopular && (
          <PopularBadge
            label={pkg.discount}
            size="small"
          />
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: `${pkg.color}20`, color: pkg.color, mr: 2 }}>
              {pkg.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {pkg.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {pkg.period}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" fontWeight="bold" color="primary">
              {pkg.price}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pkg.duration}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            {pkg.features?.map((feature: string, index: number) => (
              <FeatureRow key={index} feature={feature} />
            ))}
            
            {pkg.dailyGenerators && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="bold">
                    Daily Generators
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {pkg.dailyGenerators.map((generator: string, index: number) => (
                    <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      • {generator}
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {pkg.screens && (
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="bold">
                    Included Screens
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {pkg.screens.map((screen: string, index: number) => (
                    <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <TvIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {screen}
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant={isSelected ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleSubscription(pkg.id)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {isSelected ? 'SELECTED' : 'SELECT'}
          </Button>
        </CardActions>
      </StyledCard>
    );
  };

  const renderToolPackage = (pkg: any) => {
    const isSelected = selectedEliteTool === pkg.id;
    
    return (
      <Paper
        sx={{
          p: 2,
          border: isSelected ? `2px solid ${pkg.color}` : '1px solid',
          borderColor: isSelected ? pkg.color : 'divider',
          borderRadius: 2,
          position: 'relative',
          height: '100%',
        }}
      >
        {pkg.popular && (
          <Chip
            label={pkg.discount}
            size="small"
            color="warning"
            sx={{ position: 'absolute', top: -10, right: 10 }}
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${pkg.color}20`, color: pkg.color, mr: 1, width: 32, height: 32 }}>
            {pkg.icon}
          </Avatar>
          <Typography variant="subtitle1" fontWeight="bold">
            {pkg.name}
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
          {pkg.price}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {pkg.duration}
        </Typography>

        <Box sx={{ mb: 2 }}>
          {pkg.features.slice(0, 3).map((feature: string, index: number) => (
            <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              • {feature}
            </Typography>
          ))}
        </Box>

        <Button
          fullWidth
          variant={isSelected ? "contained" : "outlined"}
          size="small"
          onClick={() => setSelectedEliteTool(pkg.id)}
          sx={{ mt: 1 }}
        >
          {isSelected ? 'SELECTED' : 'SELECT'}
        </Button>
      </Paper>
    );
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              startIcon={restoring ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRestorePurchases}
              disabled={restoring}
              variant="outlined"
            >
              Restore Purchases
            </Button>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Premium Packages
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose the perfect package for your betting success
          </Typography>
        </Box>
      </Box>

      {/* Active Subscription Banner */}
      {subscriptionData.user.hasActiveSubscription && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          action={
            <Button color="inherit" size="small">
              Manage
            </Button>
          }
          sx={{ mb: 3 }}
        >
          You have an active subscription! 🎉
        </Alert>
      )}

      {/* Free All Access Section */}
      <GradientPaper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Chip
          label="FREE FOR ALL USERS"
          color="success"
          sx={{ mb: 2 }}
        />
        
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
          All Access Package
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
          Available to everyone at no cost
        </Typography>

        <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
          {allAccessScreens.map((screen, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                <CheckCircleIcon sx={{ color: 'success.light', mr: 1 }} />
                {screen}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
          All users get free access to live games, NFL analytics, and news updates
        </Typography>
      </GradientPaper>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {subscriptionData.stats.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Super Stats Packages */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 2 }}>
            <AnalyticsIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Super Stats
            </Typography>
            <Typography variant="body1" color="text.secondary">
              5 AI-powered screens for advanced handicapping
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {superStatsPackages.map((pkg) => (
            <Grid item xs={12} md={4} key={pkg.id}>
              {renderPackageCard(pkg)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* AI Generators Packages */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main', mr: 2 }}>
            <SparklesIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              AI Generators
            </Typography>
            <Typography variant="body1" color="text.secondary">
              High-powered daily generators + All Super Stats
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {aiGeneratorsPackages.map((pkg) => (
            <Grid item xs={12} md={4} key={pkg.id}>
              {renderPackageCard(pkg)}
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Elite Tools Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Elite Tools
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          High-powered specialized tools for serious bettors
        </Typography>

        {/* Kalshi Predictions */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUpIcon sx={{ color: '#f59e0b', mr: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              Kalshi Predictions
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {kalshiPackages.map((pkg) => (
              <Grid item xs={12} sm={6} key={pkg.id}>
                {renderToolPackage(pkg)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Secret Phrases */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <KeyIcon sx={{ color: '#ef4444', mr: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              Secret Phrases
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {secretPhrasesPackages.map((pkg) => (
              <Grid item xs={12} sm={6} key={pkg.id}>
                {renderToolPackage(pkg)}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Package Comparison */}
      <Paper sx={{ p: 3, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CompareIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Package Comparison
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography fontWeight="bold">Feature</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight="bold">All Access</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight="bold">Super Stats</Typography></TableCell>
                <TableCell align="center"><Typography fontWeight="bold">AI Generators</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.feature}</TableCell>
                  <TableCell align="center">
                    <Typography color={row.allAccess === '✓' ? 'success.main' : 'error.main'} fontWeight="bold">
                      {row.allAccess}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color={row.superStats === '✓' ? 'success.main' : 'error.main'} fontWeight="bold">
                      {row.superStats}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography color={row.aiGenerators === '✓' ? 'success.main' : 'error.main'} fontWeight="bold">
                      {row.aiGenerators}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Final CTA */}
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Ready to Level Up Your Betting Game?
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Join thousands of successful bettors using our AI-powered tools
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => handleSubscription(selectedPackage)}
          disabled={loading}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': { bgcolor: 'grey.100' },
            mb: 3,
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <ShieldIcon />}
        >
          GET STARTED
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Cancel anytime</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">Instant access</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">7-day support</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Purchase Successful!
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 80, height: 80, mb: 3, mx: 'auto' }}>
              <RocketIcon fontSize="large" />
            </Avatar>
            
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Welcome to Premium!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              You now have access to {selectedPackage.replace(/-/g, ' ')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Your premium features are now active. You can access them immediately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowSuccessModal(false)}>
            Continue Shopping
          </Button>
          <Button variant="contained" onClick={handleContinueToPremium}>
            Access Premium Content
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionScreen;
