// src/pages/TutorialsScreen.tsx - With Only Real Video
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
  { id: 'combo-tools', label: '🎲 Combo & Analytics', icon: <MergeIcon /> },
  { id: 'analytics', label: '📊 Analytics', icon: <BarChartIcon /> },
  { id: 'sports', label: '🏆 Sports', icon: <SportsBasketballIcon /> },
  { id: 'ai-features', label: '🤖 AI Features', icon: <AutoAwesomeIcon /> },
  { id: 'subscription', label: '💎 Subscription', icon: <LockIcon /> },
];

// Tutorial data - only the real video, all other categories empty
const tutorials = {
  'getting-started': [
    {
      title: 'Sports Analytics GPT Tutorial: How to Find +EV Props in Minutes',
      description: 'Learn how to find positive expected value (+EV) player props in minutes using Sports Analytics GPT. Master the app\'s core features for profitable analytics.',
      videoUrl: 'https://youtu.be/p0vAMekRq8Q',
      videoThumbnail: 'https://img.youtube.com/vi/p0vAMekRq8Q/maxresdefault.jpg',
      duration: '5:00',
      steps: [
        { title: 'Introduction', description: 'Overview of what you\'ll learn: finding +EV props efficiently.' },
        { title: 'First Topic / Setup', description: 'Setting up the app and navigating to the props tool.' },
        { title: 'Core Tutorial Content', description: 'Step-by-step demonstration of finding +EV props.' },
        { title: 'Advanced Tips or Pro Strategies', description: 'Advanced techniques to maximize advantage and simulated gain.' },
        { title: 'Next Steps & Resources', description: 'Further learning and how to leverage the app\'s full potential.' }
      ],
      tips: [
        'Match Analytics: Use matchup data to identify favorable player props.',
        'Player Props: Focus on props with positive advantage percentages (5%+).',
        'PrizePicks Integration: Cross-reference PrizePicks lines with our projections.',
        'Pro Tip: Always check the confidence score and advantage % before making selections.',
        'Use code TUTORIAL20 for 20% off your first month at https://SportsAnalyticsGPT.com',
        'Subscribe for more tutorials: https://youtube.com/@SportsAnalyticsGPT'
      ]
    }
  ],
  'parlay-tools': [],
  'analytics': [],
  'sports': [],
  'ai-features': [],
  'subscription': []
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
            <Typography variant="h4" color="primary">6</Typography>
            <Typography variant="body2" color="text.secondary">Step-by-Step Guides</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">6</Typography>
            <Typography variant="body2" color="text.secondary">Pro Tips</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">5</Typography>
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
        {currentTutorials.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No tutorials available in this category yet. Check back soon!
              </Typography>
            </Paper>
          </Grid>
        )}
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
            <Button component={Link} to="/combo-architect" fullWidth variant="outlined" startIcon={<MergeIcon />}>
              Combo Architect
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Button component={Link} to="/same-game-combo" fullWidth variant="outlined" startIcon={<AddTaskIcon />}>
              Same-Game Combo
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
