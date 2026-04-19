// src/pages/AboutPage.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Button,
  alpha,
  useTheme,
  Breadcrumbs,
  Link,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Info as InfoIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const team = [
    {
      name: 'Michael Chen',
      role: 'Founder & CEO',
      bio: 'Former data scientist with 10+ years in sports analytics. Passionate about using AI to democratize betting insights.',
      image: 'https://via.placeholder.com/200',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of AI/ML',
      bio: 'PhD in Machine Learning from Stanford. Specializes in predictive modeling and sports data analysis.',
      image: 'https://via.placeholder.com/200',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'David Rodriguez',
      role: 'Sports Data Lead',
      bio: 'Former sports analyst with expertise in NBA, NFL, and MLB statistics and betting trends.',
      image: 'https://via.placeholder.com/200',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'Emily Watson',
      role: 'Product Manager',
      bio: 'Product leader focused on creating intuitive, powerful tools for bettors of all levels.',
      image: 'https://via.placeholder.com/200',
      social: { linkedin: '#', twitter: '#', github: '#' }
    }
  ];

  const milestones = [
    { year: '2023', title: 'Company Founded', description: 'Started with a mission to revolutionize sports betting analytics' },
    { year: '2024', title: 'Beta Launch', description: 'Released first version to 500 beta testers' },
    { year: '2024', title: 'Public Launch', description: 'Officially launched platform with 3 subscription tiers' },
    { year: '2025', title: '10K Users', description: 'Reached 10,000 active users milestone' },
    { year: '2026', title: 'New Features', description: 'Launched AI Combo Architect and Secret Phrases Hub' }
  ];

  const values = [
    {
      icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
      title: 'Accuracy First',
      description: 'We prioritize prediction accuracy above all else, constantly refining our models.'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      title: 'User-Centric',
      description: 'Building tools that bettors actually need and love to use.'
    },
    {
      icon: <TrendingIcon sx={{ fontSize: 32 }} />,
      title: 'Continuous Innovation',
      description: 'Always pushing boundaries with new features and technologies.'
    },
    {
      icon: <CodeIcon sx={{ fontSize: 32 }} />,
      title: 'Transparency',
      description: 'Open about our methodologies and prediction accuracy rates.'
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc',
      pb: 8
    }}>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)',
        color: 'white',
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip
                icon={<InfoIcon />}
                label="OUR STORY"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  mb: 3,
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Typography variant="h2" sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2
              }}>
                Democratizing Sports<br />Analytics for Everyone
              </Typography>
              <Typography variant="h6" sx={{
                opacity: 0.9,
                maxWidth: 600,
                mb: 4
              }}>
                We're on a mission to make professional-grade sports analytics accessible to all bettors, using AI to level the playing field.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper sx={{
                p: 3,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <TrophyIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">10,000+</Typography>
                <Typography variant="body2">Active Users</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/home')} sx={{ cursor: 'pointer' }}>
            Home
          </Link>
          <Typography color="text.primary">About</Typography>
        </Breadcrumbs>

        {/* Mission Section */}
        <Paper sx={{ p: 4, mb: 6, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
            To empower bettors with AI-driven insights that transform intuition into informed decisions.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={3}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>{value.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Our Journey Section */}
        <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 4 }}>
          Our Journey
        </Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {milestones.map((milestone, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {milestone.year}
                </Typography>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {milestone.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {milestone.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Team Section */}
        <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 4 }}>
          Meet the Team
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
          Passionate experts dedicated to your success
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {team.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={member.image}
                  alt={member.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {member.name}
                  </Typography>
                  <Chip
                    label={member.role}
                    size="small"
                    sx={{ mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                  />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {member.bio}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" href={member.social.linkedin} target="_blank">
                      <LinkedInIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" href={member.social.twitter} target="_blank">
                      <TwitterIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" href={member.social.github} target="_blank">
                      <GitHubIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Technology Section */}
        <Paper sx={{ p: 4, mb: 8, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Powered by Cutting-Edge AI
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Our platform leverages state-of-the-art machine learning algorithms, processing millions of data points daily to deliver the most accurate predictions in the industry.
              </Typography>
              <List>
                {[
                  'Neural networks trained on 10+ years of sports data',
                  'Real-time model updates during live games',
                  'Proprietary correlation analysis engine',
                  'Continuous learning from user feedback'
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#10b981' }} />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <PsychologyIcon sx={{ fontSize: 120, color: alpha(theme.palette.primary.main, 0.3) }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Join Us Section */}
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)',
          color: 'white',
          borderRadius: 3
        }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Join Our Community
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Be part of the future of sports analytics. Start winning with AI-powered insights today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: '#1E3C72',
              px: 4,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
            }}
            endIcon={<ArrowIcon />}
            onClick={() => navigate('/pricing')}
          >
            Get Started Free
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;
