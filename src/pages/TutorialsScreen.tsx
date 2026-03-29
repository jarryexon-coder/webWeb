// src/pages/TutorialsScreen.tsx - With Video Support
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Paper,
  Tabs,
  Tab,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Modal,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  School as SchoolIcon,
  MenuBook as BookIcon,
  SportsBasketball as SportsBasketballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsTennis as SportsTennisIcon,
  SportsGolf as SportsGolfIcon,
  SportsSoccer as SportsSoccerIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingUp as TrendingUpIcon,
  Merge as MergeIcon,
  AddTask as AddTaskIcon,
  Newspaper as NewspaperIcon,
  BarChart as BarChartIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Lock as LockIcon,
  YouTube as YouTubeIcon,
  Close as CloseIcon,
  PlayCircleOutline as PlayCircleIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Video Modal Component
const VideoModal: React.FC<{
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}> = ({ open, onClose, videoUrl, title }) => {
  // Extract YouTube video ID from various URL formats
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'relative',
          width: '90%',
          maxWidth: '1000px',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          outline: 'none',
        }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
            <Typography variant="h6">{title}</Typography>
          </Box>
          <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
            <iframe
              src={embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// Tutorial Card Component with Video
const TutorialCard: React.FC<{
  tutorial: any;
  onStart: () => void;
  onWatchVideo: () => void;
}> = ({ tutorial, onStart, onWatchVideo }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
      {tutorial.videoThumbnail && (
        <CardMedia
          component="img"
          height="140"
          image={tutorial.videoThumbnail}
          alt={tutorial.title}
          sx={{ cursor: 'pointer' }}
          onClick={onWatchVideo}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <SchoolIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">{tutorial.title}</Typography>
          </Box>
          {tutorial.videoUrl && (
            <Chip
              icon={<YouTubeIcon />}
              label="Video"
              size="small"
              color="error"
              onClick={onWatchVideo}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {tutorial.description}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
          <Chip label={`${tutorial.steps.length} steps`} size="small" icon={<CheckCircleIcon />} />
          {tutorial.tips && <Chip label={`${tutorial.tips.length} tips`} size="small" icon={<StarIcon />} />}
          {tutorial.duration && <Chip label={tutorial.duration} size="small" icon={<PlayIcon />} />}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          ⏱️ ~{Math.max(2, tutorial.steps.length * 1.5)} min read
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button variant="contained" startIcon={<PlayIcon />} onClick={onStart} sx={{ flex: 1 }}>
          Step-by-Step
        </Button>
        {tutorial.videoUrl && (
          <Button variant="outlined" startIcon={<YouTubeIcon />} onClick={onWatchVideo} sx={{ flex: 1 }}>
            Watch Video
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// Tutorial categories
const categories = [
  { id: 'getting-started', label: '🚀 Getting Started', icon: <SchoolIcon /> },
  { id: 'parlay-tools', label: '🎲 Parlay & Betting', icon: <MergeIcon /> },
  { id: 'analytics', label: '📊 Analytics', icon: <BarChartIcon /> },
  { id: 'sports', label: '🏆 Sports', icon: <SportsBasketballIcon /> },
  { id: 'ai-features', label: '🤖 AI Features', icon: <AutoAwesomeIcon /> },
  { id: 'subscription', label: '💎 Subscription', icon: <LockIcon /> },
];

// Tutorial data with video URLs
const tutorials = {
  'getting-started': [
    {
      title: 'Welcome to Sports Analytics GPT',
      description: 'Your complete guide to navigating the platform',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '8:32',
      steps: [
        { title: 'Create an Account', description: 'Sign up for free to access basic features and track your activity.' },
        { title: 'Explore the Home Screen', description: 'Browse featured tools, sports dashboards, and quick access cards.' },
        { title: 'Choose Your Path', description: 'Select from Parlay Tools, Sports Analytics, News, or Special Events.' },
        { title: 'Start with Free Features', description: 'Access live games, basic stats, and one daily AI generation for free.' },
        { title: 'Upgrade for Full Access', description: 'Subscribe to Analytics, Generator, or Premium tiers for unlimited features.' }
      ],
      tips: ['Bookmark your favorite screens', 'Use the search bar to find players', 'Check the stats bar for data freshness']
    },
    {
      title: 'Understanding Plan Tiers',
      description: 'What you get at each subscription level',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '5:15',
      steps: [
        { title: 'Starter (Free)', description: 'Live games, basic stats, one daily AI generation, one featured parlay per sport.' },
        { title: 'Analytics ($9.99/mo)', description: 'Everything in Starter + advanced metrics, standings, injury reports, player analysis.' },
        { title: 'Generator ($19.99/mo)', description: 'Everything in Analytics + unlimited AI generations, value bets, top prospects, premium predictions.' },
        { title: 'Premium ($49.99/mo)', description: 'Everything in Generator + API access, priority support, early feature access.' }
      ],
      tips: ['Start with Starter to explore features', 'Upgrade when you need unlimited generations', 'Annual plans save 20%']
    }
  ],
  'parlay-tools': [
    {
      title: 'Parlay Architect',
      description: 'Build data-driven parlays with confidence',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '10:45',
      steps: [
        { title: 'Select Your Sport', description: 'Choose NBA, NHL, or MLB from the sport selector.' },
        { title: 'Add Legs', description: 'Click "Add Leg" to browse real player props with projections and edge percentages.' },
        { title: 'Filter Props', description: 'Use filters to sort by confidence, edge, or stat type.' },
        { title: 'Build Your Parlay', description: 'Select overs/unders for each player. Watch odds calculate in real-time.' },
        { title: 'Review & Place', description: 'Check total odds, implied probability, and potential payout before adding to bet slip.' }
      ],
      tips: ['Look for legs with 80%+ confidence', 'Mix correlated legs for better odds', 'Use the AI generator for instant suggestions']
    },
    {
      title: 'Same-Game Parlay Generator',
      description: 'One game, multiple bets, maximum payout',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '7:20',
      steps: [
        { title: 'Select a Sport', description: 'Choose NBA, NHL, or MLB to see the featured parlay.' },
        { title: 'View Featured Parlay', description: 'Each sport shows one free, high-confidence parlay with 2-3 legs.' },
        { title: 'Generate More', description: 'Click "Generate More" to see all parlay options for that game.' },
        { title: 'Use AI Generator', description: 'Select a preset prompt or enter custom text to create new parlays instantly.' },
        { title: 'Filter by Market', description: 'Use tabs to filter Player Props, Moneyline, Totals, or Mixed parlays.' }
      ],
      tips: ['Moneyline parlays are lowest risk', 'Mixed parlays combine props with totals', 'Generated parlays appear in the "Generated" tab']
    },
    {
      title: 'PrizePicks Player Props',
      description: 'Track real-time props with Kelly Criterion bet sizing',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '9:15',
      steps: [
        { title: 'Browse Props', description: 'View player props across NBA, NFL, MLB, and NHL with live odds.' },
        { title: 'Filter by Edge', description: 'Use the edge slider to find +EV opportunities (positive edge %).' },
        { title: 'Check Projections', description: 'Compare market lines against AI-driven player projections.' },
        { title: 'Calculate Bet Size', description: 'Kelly Criterion automatically suggests optimal wager based on edge and bankroll.' },
        { title: 'AI Prop Generator', description: 'Type prompts like "NBA points high edge" to get personalized recommendations.' }
      ],
      tips: ['Focus on props with 5%+ edge', 'Sort by projection difference', 'Refresh data every 3 minutes for latest odds']
    }
  ],
  'analytics': [
    {
      title: 'Analytics Dashboard',
      description: 'Unified sports analytics hub',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '6:30',
      steps: [
        { title: 'View KPIs', description: 'See total players, injury counts, and value bets found at a glance.' },
        { title: 'Player Analysis', description: 'Browse player stats with paginated tables and advanced metrics.' },
        { title: 'Injury Report', description: 'Track player injuries with status (Out/Questionable) and return dates.' },
        { title: 'Value Bets', description: 'Find +EV betting opportunities with edge percentages and confidence levels.' },
        { title: 'Visual Analytics', description: 'Explore position distribution charts and edge analysis bar charts.' }
      ],
      tips: ['Use the tabs to switch between views', 'Data freshness timestamps show last update', 'Plan tier determines available features']
    },
    {
      title: 'Advanced Analytics',
      description: 'AI-powered sports intelligence',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '8:45',
      steps: [
        { title: 'Smart Prompts Library', description: 'Choose from 20+ analytics-focused prompts like "Players with highest positive regression".' },
        { title: 'Value Picks Engine', description: 'Automatically identifies +EV opportunities with edge filtering.' },
        { title: 'Parlay Analytics', description: 'Find correlated parlay opportunities with correlation factors and true probability.' },
        { title: 'Player Trend Tracking', description: 'Monitor rising players, hot streaks, and regression candidates.' },
        { title: 'Custom Queries', description: 'Enter your own analytics questions for instant insights.' }
      ],
      tips: ['Try "Best value across NBA, NHL, MLB tonight"', 'Use "Sharp money moves last 24 hours" for insider trends', 'Correlation scores above 0.7 indicate strong connections']
    }
  ],
  'sports': [
    {
      title: 'NBA Dashboard',
      description: 'Fantasy basketball command center',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '7:50',
      steps: [
        { title: 'View Top 10 Chart', description: 'See highest fantasy scorers with interactive tooltips.' },
        { title: 'Value Picks Table', description: 'Find best value players sorted by value score vs salary.' },
        { title: 'Today\'s Games', description: 'Check live game schedule with scores, status, and matchups.' },
        { title: 'Player Projections', description: 'View fantasy points, points, rebounds, assists, and value metrics.' },
        { title: 'Summary Cards', description: 'Quick stats include total players, average fantasy points, and top scorer.' }
      ],
      tips: ['Value score = fantasy points ÷ salary × 1000', 'Look for players with high value scores under salary cap', 'Check injury status before locking lineups']
    },
    {
      title: 'NHL Dashboard',
      description: 'Hockey analytics & standings tracker',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '6:15',
      steps: [
        { title: 'Live Games', description: 'View today\'s matchups with scores, venues, and broadcast info.' },
        { title: 'Standings Tab', description: 'Full conference standings with wins, losses, points, and streaks.' },
        { title: 'Players Tab', description: 'Skater stats (goals, assists, points) and goalie stats (GAA, save %).' },
        { title: 'Filter by Conference', description: 'Switch between Eastern and Western Conference views.' },
        { title: 'Fantasy Points', description: 'Each player includes fantasy point calculations for your leagues.' }
      ],
      tips: ['Points percentage bars show team performance', 'Streak chips indicate recent form', 'Goalie save % above .915 is elite']
    },
    {
      title: 'MLB Spring Training',
      description: 'Spring training hub (Feb–Mar)',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '5:45',
      steps: [
        { title: 'Spring Games', description: 'Track Grapefruit and Cactus League games with scores and weather.' },
        { title: 'Standings', description: 'View spring training records with wins, losses, and win percentage.' },
        { title: 'Hitting Leaders', description: 'Top hitters with AVG, HR, RBI, OPS, and prospect indicators.' },
        { title: 'Pitching Leaders', description: 'Pitching stats including ERA, WHIP, strikeouts, and innings pitched.' },
        { title: 'Top Prospects', description: 'Featured prospects with hitting/pitching stats and team affiliation.' }
      ],
      tips: ['Weather cards show temperature and conditions', 'Prospect indicators highlight future stars', 'Toggle between current and next year\'s data']
    },
    {
      title: 'World Cup 2026',
      description: 'Your complete FIFA World Cup guide',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '8:00',
      steps: [
        { title: 'Group Standings', description: 'Track group stage progress with points, wins, and goal differential.' },
        { title: 'Match Schedule', description: 'View all matches across USA, Canada, and Mexico venues.' },
        { title: 'AI Predictions', description: 'Get AI-powered odds and predictions for each match.' },
        { title: 'Team Schedules', description: 'Follow the United States team schedule and results.' },
        { title: 'Tournament News', description: 'Stay informed with the latest World Cup updates and analysis.' }
      ],
      tips: ['Check venue locations for travel planning', 'AI predictions update daily', 'Follow your favorite team\'s path to the final']
    }
  ],
  'ai-features': [
    {
      title: 'AI Prediction Generator',
      description: 'Natural language predictions for props and outcomes',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '9:30',
      steps: [
        { title: 'Enter Your Prompt', description: 'Type natural language like "LeBron James points over 25.5 tonight".' },
        { title: 'Smart Detection', description: 'AI detects sport, player, stat type, and bet side automatically.' },
        { title: 'View Results', description: 'See prediction with confidence score, projection, and edge percentage.' },
        { title: 'Track Outcomes', description: 'Monitor correct/incorrect status in the Predictions Outcome screen.' },
        { title: 'Refine Queries', description: 'Add team names or specific games for more accurate predictions.' }
      ],
      tips: ['Be specific: "Lakers vs Warriors points over"', 'Use "NBA", "NHL", or "MLB" for sport detection', 'Check edge % to find +EV opportunities']
    },
    {
      title: 'Secret Phrases Hub',
      description: 'Unlock insider betting intelligence',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '7:15',
      steps: [
        { title: 'Browse Prompts', description: 'Select from 30+ specialized prompts like "sharp money moves".' },
        { title: 'Enter Custom Queries', description: 'Type your own questions for personalized insights.' },
        { title: 'Discover Hidden Features', description: 'Try "predictive clustering", "bayesian inference", or "easter egg".' },
        { title: 'Analyze Results', description: 'View player projections, confidence scores, and edge percentages.' },
        { title: 'Apply Insights', description: 'Use intelligence to inform your betting decisions.' }
      ],
      tips: ['"Sharp money moves" shows where professionals are betting', '"Prop value" finds best +EV opportunities', 'Try "easter egg" for exclusive content']
    },
    {
      title: 'Daily Picks',
      description: 'AI-curated daily betting recommendations',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '6:45',
      steps: [
        { title: 'View Picks', description: 'See AI-generated picks updated every 60 seconds.' },
        { title: 'Filter by Sport', description: 'Focus on NBA, NFL, MLB, or NHL.' },
        { title: 'Sort by Edge', description: 'Find highest value opportunities first.' },
        { title: 'Check Confidence', description: 'Each pick shows confidence level and key factors.' },
        { title: 'Build Parlays', description: 'Combine multiple picks into optimized parlays.' }
      ],
      tips: ['Refresh for latest picks', 'Focus on picks with 80%+ confidence', 'Edge % above 5% indicates strong value']
    }
  ],
  'subscription': [
    {
      title: 'Subscription Management',
      description: 'Manage your plan and credits',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual video URL
      videoThumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: '4:30',
      steps: [
        { title: 'View Current Plan', description: 'See your active subscription tier and feature access.' },
        { title: 'Check Credits', description: 'Generator tier users see remaining AI generation credits.' },
        { title: 'Upgrade Plan', description: 'Choose Analytics, Generator, or Premium for more features.' },
        { title: 'Annual Savings', description: 'Select annual billing to save 20% on any plan.' },
        { title: 'Manage Billing', description: 'Update payment methods and view invoices.' }
      ],
      tips: ['Starter tier includes one free daily AI generation', 'Generator tier unlocks unlimited generations', 'Premium includes API access and priority support']
    }
  ]
};

// Tutorial Detail Modal Component (Text-based)
const TutorialDetailModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tutorial: any;
}> = ({ open, onClose, tutorial }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, tutorial.steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  if (!tutorial) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">{tutorial.title}</Typography>
          </Box>
          {tutorial.videoUrl && (
            <Chip
              icon={<YouTubeIcon />}
              label="Watch Video"
              size="small"
              color="error"
              onClick={() => {
                onClose();
                // Open video modal - you'd need to pass this function up
              }}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          {tutorial.description}
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
          {tutorial.steps.map((step: any, index: number) => (
            <Step key={index}>
              <StepLabel StepIconProps={{ icon: index + 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">{step.title}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={index === tutorial.steps.length - 1}
                  >
                    Next
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={index === 0}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {tutorial.tips && tutorial.tips.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
              <StarIcon fontSize="small" color="warning" />
              Pro Tips
            </Typography>
            <List dense>
              {tutorial.tips.map((tip: string, idx: number) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary={tip} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Need help?</AlertTitle>
          Contact support at <strong>support@sportsanalyticsgpt.com</strong> or use the live chat feature.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {activeStep === tutorial.steps.length - 1 && (
          <Button variant="contained" onClick={handleReset}>Restart</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Main Component
const TutorialsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null);

  const currentTutorials = tutorials[selectedCategory as keyof typeof tutorials] || [];

  const handleStartTutorial = (tutorial: any) => {
    setSelectedTutorial(tutorial);
    setModalOpen(true);
  };

  const handleWatchVideo = (tutorial: any) => {
    if (tutorial.videoUrl) {
      setCurrentVideo({ url: tutorial.videoUrl, title: tutorial.title });
      setVideoModalOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <SchoolIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Tutorials & Guides
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Learn how to maximize your experience with step-by-step guides and video tutorials
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{Object.values(tutorials).flat().length}</Typography>
            <Typography variant="body2" color="text.secondary">Interactive Tutorials</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">30+</Typography>
            <Typography variant="body2" color="text.secondary">Step-by-Step Guides</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">50+</Typography>
            <Typography variant="body2" color="text.secondary">Pro Tips</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">5-10</Typography>
            <Typography variant="body2" color="text.secondary">Minutes per Tutorial</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Category Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, v) => setSelectedCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((cat) => (
            <Tab
              key={cat.id}
              value={cat.id}
              icon={cat.icon}
              label={cat.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tutorial Grid */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        {categories.find(c => c.id === selectedCategory)?.label} Tutorials
      </Typography>
      <Grid container spacing={3}>
        {currentTutorials.map((tutorial, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <TutorialCard
              tutorial={tutorial}
              onStart={() => handleStartTutorial(tutorial)}
              onWatchVideo={() => handleWatchVideo(tutorial)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Quick Navigation Section */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <SchoolIcon color="primary" />
          Quick Navigation
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/live-games" fullWidth variant="outlined" startIcon={<SportsBasketballIcon />}>
              Live Games
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/parlay-architect" fullWidth variant="outlined" startIcon={<MergeIcon />}>
              Parlay Architect
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/same-game-parlay" fullWidth variant="outlined" startIcon={<AddTaskIcon />}>
              Same-Game Parlay
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/daily-picks" fullWidth variant="outlined" startIcon={<AutoAwesomeIcon />}>
              Daily Picks
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/analytics-dashboard" fullWidth variant="outlined" startIcon={<AnalyticsIcon />}>
              Analytics
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/nba-dashboard" fullWidth variant="outlined" startIcon={<SportsBasketballIcon />}>
              NBA Dashboard
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/nhl-dashboard" fullWidth variant="outlined" startIcon={<SportsHockeyIcon />}>
              NHL Dashboard
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/world-cup-2026" fullWidth variant="outlined" startIcon={<SportsSoccerIcon />}>
              World Cup 2026
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tutorial Detail Modal (Text-based) */}
      <TutorialDetailModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTutorial(null);
        }}
        tutorial={selectedTutorial}
      />

      {/* Video Modal */}
      <VideoModal
        open={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false);
          setCurrentVideo(null);
        }}
        videoUrl={currentVideo?.url || ''}
        title={currentVideo?.title || ''}
      />
    </Container>
  );
};

export default TutorialsScreen;
