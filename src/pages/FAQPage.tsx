// src/pages/FAQPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  Button,
  alpha,
  useTheme,
  Divider,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Payment as PaymentIcon,
  AccountCircle as AccountIcon,
  Security as SecurityIcon,
  SportsBasketball as SportsIcon,
  AutoAwesome as AIIcon,
  ContactSupport as SupportIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  ThumbUp as ThumbUpIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FAQPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // FAQ Categories
  const categories = [
    { id: 'general', name: 'General', icon: <HelpIcon />, count: 8 },
    { id: 'account', name: 'Account & Billing', icon: <AccountIcon />, count: 12 },
    { id: 'subscription', name: 'Subscriptions', icon: <PaymentIcon />, count: 10 },
    { id: 'features', name: 'Features', icon: <SportsIcon />, count: 15 },
    { id: 'ai', name: 'AI & Analytics', icon: <AIIcon />, count: 7 },
    { id: 'security', name: 'Security', icon: <SecurityIcon />, count: 5 }
  ];

  // FAQ Data
  const faqs = [
    // General
    {
      id: 'gen1',
      category: 'general',
      question: 'What is Sports Analytics Pro?',
      answer: 'Sports Analytics Pro is an AI-powered sports analytics platform that provides real-time player statistics, prop projections, combo builders, and predictive analytics to help bettors make informed decisions. We cover NBA, NFL, MLB, NHL, NCAA Basketball, and more.'
    },
    {
      id: 'gen2',
      category: 'general',
      question: 'How accurate are your predictions?',
      answer: 'Our AI models achieve 70-85% accuracy depending on the sport and type of prediction. We use machine learning algorithms trained on historical data, player performance metrics, and real-time game conditions. While we strive for high accuracy, sports outcomes are never guaranteed.'
    },
    {
      id: 'gen3',
      category: 'general',
      question: 'What sports do you cover?',
      answer: 'Currently we cover NBA, NFL, MLB, NHL, NCAA Basketball (NCAAB), World Cup Soccer, Tennis (ATP/WTA), and PGA Golf. We\'re constantly adding new sports and leagues based on user demand.'
    },
    {
      id: 'gen4',
      category: 'general',
      question: 'Is there a mobile app?',
      answer: 'Yes! Our platform is fully responsive and works great on mobile browsers. We also have native iOS and Android apps available for download from the App Store and Google Play Store.'
    },
    // Account & Billing
    {
      id: 'acct1',
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button on our homepage. You can sign up with email and password, or use Google/Apple authentication. It takes less than a minute to get started.'
    },
    {
      id: 'acct2',
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a password reset link. Follow the instructions to create a new password.'
    },
    {
      id: 'acct3',
      category: 'account',
      question: 'Can I change my email address?',
      answer: 'Yes! Go to Settings > Account Settings, click "Edit Profile", and update your email address. You\'ll need to verify the new email address before the change takes effect.'
    },
    {
      id: 'acct4',
      category: 'account',
      question: 'How do I delete my account?',
      answer: 'You can delete your account from Settings > Account Management. Please note this action is permanent and will remove all your data, including saved picks and preferences. Contact support if you need assistance.'
    },
    // Subscriptions
    {
      id: 'sub1',
      category: 'subscription',
      question: 'What subscription plans do you offer?',
      answer: 'We offer three plans: Starter ($5.99/mo), Analytics ($19.99/mo), and Generators ($39.99/mo). Annual billing saves you 15% on all plans. Each plan comes with a 7-day free trial.'
    },
    {
      id: 'sub2',
      category: 'subscription',
      question: 'Can I switch between plans?',
      answer: 'Absolutely! You can upgrade or downgrade at any time from your Subscription Dashboard. Changes will be prorated and reflected in your next billing cycle.'
    },
    {
      id: 'sub3',
      category: 'subscription',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel anytime from your Account Dashboard > Subscription Settings. No contracts, no hidden fees. Your access continues until the end of your current billing period.'
    },
    {
      id: 'sub4',
      category: 'subscription',
      question: 'What happens after my free trial?',
      answer: 'If you don\'t cancel before the trial ends, your subscription will automatically start and you\'ll be charged the monthly or annual rate. You can cancel anytime during the trial with no charges.'
    },
    // Features
    {
      id: 'feat1',
      category: 'features',
      question: 'What are generator picks?',
      answer: 'Generator picks are AI-powered prop predictions and betting recommendations. Each pick includes detailed analysis, confidence scores, and expected value calculations. Unlimited picks available with the Generators Package.'
    },
    {
      id: 'feat2',
      category: 'features',
      question: 'How does the Combo Architect work?',
      answer: 'The Combo Architect analyzes correlated outcomes across games to build optimized combo combinations with higher win probabilities. It considers factors like player performance, team matchups, and situational trends.'
    },
    {
      id: 'feat3',
      category: 'features',
      question: 'What is the Secret Phrases Hub?',
      answer: 'The Secret Phrases Hub gives you access to exclusive insider information, advanced metrics, and unique data points not available elsewhere. It\'s our premium feature for serious bettors.'
    },
    {
      id: 'feat4',
      category: 'features',
      question: 'Can I see historical data?',
      answer: 'Yes! Data history varies by plan: Starter (7 days), Analytics (30 days), Generators (full season). You can view past games, player performances, and prediction accuracy metrics.'
    },
    // AI & Analytics
    {
      id: 'ai1',
      category: 'ai',
      question: 'How does your AI work?',
      answer: 'Our AI models use machine learning algorithms trained on millions of data points including player statistics, team dynamics, injury reports, weather conditions, and historical outcomes. Models are retrained daily to adapt to current trends.'
    },
    {
      id: 'ai2',
      category: 'ai',
      question: 'What\'s the difference between analytics and predictions?',
      answer: 'Analytics provides data visualization, trends, and historical insights. Predictions use our AI to forecast future outcomes and generate betting recommendations with confidence scores.'
    },
    {
      id: 'ai3',
      category: 'ai',
      question: 'Do you offer live updates?',
      answer: 'Yes! Real-time updates for scores, player stats, and injury reports. Live game tracking with minute-by-minute analytics available during active games.'
    },
    // Security
    {
      id: 'sec1',
      category: 'security',
      question: 'Is my payment information secure?',
      answer: 'Absolutely. We use Stripe for payment processing with bank-level encryption (256-bit SSL). We never store your full payment details on our servers. All transactions are PCI compliant.'
    },
    {
      id: 'sec2',
      category: 'security',
      question: 'How is my data protected?',
      answer: 'We use industry-standard security practices including encryption at rest and in transit, regular security audits, and strict access controls. Your personal information is never sold to third parties.'
    }
  ];

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group FAQs by category for category view
  const groupedFaqs = categories.reduce((acc, category) => {
    acc[category.id] = faqs.filter(faq => faq.category === category.id);
    return acc;
  }, {} as Record<string, typeof faqs>);

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || <HelpIcon />;
  };

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
                icon={<HelpIcon />}
                label="FREQUENTLY ASKED QUESTIONS"
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
                How Can We<br />Help You?
              </Typography>
              <Typography variant="h6" sx={{
                opacity: 0.9,
                maxWidth: 600,
                mb: 4
              }}>
                Find answers to common questions about our platform, subscriptions, and features.
              </Typography>
              
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  maxWidth: 500,
                  bgcolor: 'white',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { border: 'none' }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper sx={{
                p: 3,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h6" gutterBottom>
                  💡 Quick Tips
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2">• Use search to find specific topics</Typography>
                  <Typography variant="body2">• Click on categories to browse questions</Typography>
                  <Typography variant="body2">• Can't find what you need? Contact support</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/home')} sx={{ cursor: 'pointer' }}>
            Home
          </Link>
          <Typography color="text.primary">FAQ</Typography>
        </Breadcrumbs>

        {/* Categories */}
        {!searchTerm && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Browse by Category
            </Typography>
            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={6} sm={4} md={2} key={category.id}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => {
                      const element = document.getElementById(`category-${category.id}`);
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        width: 48,
                        height: 48,
                        mx: 'auto',
                        mb: 1
                      }}
                    >
                      {category.icon}
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.count} questions
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Search Results */}
        {searchTerm && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Search Results ({filteredFaqs.length})
            </Typography>
            {filteredFaqs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <HelpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6">No results found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different keywords or browse categories below
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </Paper>
            ) : (
              filteredFaqs.map((faq) => (
                <Accordion
                  key={faq.id}
                  expanded={expanded === faq.id}
                  onChange={handleChange(faq.id)}
                  sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="500">
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        )}

        {/* FAQ by Category */}
        {!searchTerm && categories.map((category) => (
          <Box key={category.id} id={`category-${category.id}`} sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                {category.icon}
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                {category.name}
              </Typography>
              <Chip label={`${groupedFaqs[category.id]?.length || 0} questions`} size="small" />
            </Box>
            
            <Grid container spacing={2}>
              {groupedFaqs[category.id]?.map((faq) => (
                <Grid item xs={12} key={faq.id}>
                  <Accordion
                    expanded={expanded === faq.id}
                    onChange={handleChange(faq.id)}
                    sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="500">
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* Still Need Help Section */}
        <Paper
          sx={{
            mt: 6,
            p: 4,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderRadius: 3
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Still Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            Can't find what you're looking for? Our support team is here to help.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => window.location.href = 'mailto:support@sportsanalyticspro.com'}
              >
                Email Support
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                onClick={() => navigate('/contact')}
              >
                Live Chat
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<ForumIcon />}
                onClick={() => navigate('/community')}
              >
                Community Forum
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default FAQPage;
