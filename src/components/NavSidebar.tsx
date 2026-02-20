import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  SportsEsports as LiveIcon,
  Article as NewsIcon,
  EmojiEvents as DailyPicksIcon,
  Login as LoginIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Casino as CasinoIcon,
  AutoAwesome as AIIcon,
  Psychology as PsychologyIcon,
  SportsScore as PropsIcon,
  Timeline as PredictionIcon,
  Dashboard as DashboardIcon,
  SportsTennis as TennisIcon,
  SportsGolf as GolfIcon,
  MoreHoriz as MoreIcon,
} from '@mui/icons-material';

interface NavItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  category?: string;
}

// Group all routes by category
const navItems: NavItem[] = [
  // Core
  { text: 'Home', path: '/', icon: <HomeIcon />, category: 'Core' },
  { text: 'Live Games', path: '/live-games', icon: <LiveIcon />, category: 'Core' },
  { text: 'Daily Picks', path: '/daily-picks', icon: <DailyPicksIcon />, category: 'Core' },
  { text: 'News Desk', path: '/news-desk', icon: <NewsIcon />, category: 'Core' },
  { text: 'NFL Analytics', path: '/nfl-analytics', icon: <TrendingUpIcon />, category: 'Core' },
  { text: 'NHL Trends', path: '/nhl-trends', icon: <TrendingUpIcon />, category: 'Core' },
  { text: 'Login', path: '/login', icon: <LoginIcon />, category: 'Core' },

  // 2026 Season
  { text: '2026 Hub', path: '/2026', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'World Cup 2026', path: '/world-cup-2026', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'All-Star 2026', path: '/all-star-2026', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'Futures 2026', path: '/futures-2026', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'Alt Lines', path: '/alt-lines', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'Season Stats', path: '/season-stats', icon: <DailyPicksIcon />, category: '2026 Season' },
  { text: 'Rookie Watch', path: '/rookie-watch', icon: <DailyPicksIcon />, category: '2026 Season' },

  // Analytics
  { text: 'Trend Analysis', path: '/trend-analysis', icon: <AnalyticsIcon />, category: 'Analytics' },
  { text: 'Historical Analytics', path: '/historical-analytics', icon: <AnalyticsIcon />, category: 'Analytics' },
  { text: 'Analytics Dashboard', path: '/analytics-dashboard', icon: <AnalyticsIcon />, category: 'Analytics' },
  { text: 'Sports Analytics', path: '/sports-analytics/nba', icon: <AnalyticsIcon />, category: 'Analytics' },

  // Parlay & Betting
  { text: 'Parlay Builder', path: '/parlay-builder', icon: <CasinoIcon />, category: 'Parlay' },
  { text: 'Same Game Parlay', path: '/same-game-parlay', icon: <CasinoIcon />, category: 'Parlay' },
  { text: 'Teaser Calculator', path: '/teaser-calculator', icon: <CasinoIcon />, category: 'Parlay' },
  { text: 'Round Robin', path: '/round-robin', icon: <CasinoIcon />, category: 'Parlay' },
  { text: 'Parlay Boosts', path: '/parlay-boosts', icon: <CasinoIcon />, category: 'Parlay' },
  { text: 'Parlay History', path: '/parlay-history', icon: <CasinoIcon />, category: 'Parlay' },

  // AI & Correlation
  { text: 'AI Suggestions', path: '/ai-suggestions', icon: <AIIcon />, category: 'AI' },
  { text: 'Parlay Analytics', path: '/parlay-analytics', icon: <PsychologyIcon />, category: 'AI' },
  { text: 'Correlation Explorer', path: '/correlation-explorer', icon: <PsychologyIcon />, category: 'AI' },

  // Props
  { text: 'Player Props', path: '/player-props', icon: <PropsIcon />, category: 'Props' },
  { text: 'Props Details', path: '/props-details/1', icon: <PropsIcon />, category: 'Props' },

  // Prediction Markets
  { text: 'Prediction Markets', path: '/prediction-markets', icon: <PredictionIcon />, category: 'Predictions' },
  { text: 'Prediction Detail', path: '/prediction/1', icon: <PredictionIcon />, category: 'Predictions' },

  // Sports Dashboards
  { text: 'NBA Dashboard', path: '/nba-dashboard', icon: <DashboardIcon />, category: 'Dashboards' },
  { text: 'NHL Dashboard', path: '/nhl-dashboard', icon: <DashboardIcon />, category: 'Dashboards' },
  { text: 'NFL Dashboard', path: '/nfl-dashboard', icon: <DashboardIcon />, category: 'Dashboards' },
  { text: 'MLB Spring Training', path: '/mlb-spring-training', icon: <DashboardIcon />, category: 'Dashboards' },

  // Tennis
  { text: 'Tennis Players', path: '/tennis/players', icon: <TennisIcon />, category: 'Tennis' },
  { text: 'Tennis Tournaments', path: '/tennis/tournaments', icon: <TennisIcon />, category: 'Tennis' },
  { text: 'Tennis Matches', path: '/tennis/matches', icon: <TennisIcon />, category: 'Tennis' },

  // Golf
  { text: 'Golf Players', path: '/golf/players', icon: <GolfIcon />, category: 'Golf' },
  { text: 'Golf Tournaments', path: '/golf/tournaments', icon: <GolfIcon />, category: 'Golf' },
  { text: 'Golf Leaderboard', path: '/golf/leaderboard', icon: <GolfIcon />, category: 'Golf' },

  // More (lazy loaded)
  { text: 'Fantasy Hub', path: '/fantasy-hub', icon: <MoreIcon />, category: 'More' },
  { text: 'Player Stats', path: '/player-stats', icon: <MoreIcon />, category: 'More' },
  { text: 'Sports Wire', path: '/sports-wire', icon: <MoreIcon />, category: 'More' },
  { text: 'Advanced Analytics', path: '/advanced-analytics', icon: <MoreIcon />, category: 'More' },
  { text: 'Kalshi Predictions', path: '/kalshi-predictions', icon: <MoreIcon />, category: 'More' },
  { text: 'PrizePicks', path: '/prize-picks', icon: <MoreIcon />, category: 'More' },
  { text: 'Subscription', path: '/subscription', icon: <MoreIcon />, category: 'More' },
];

// Group by category
const grouped = navItems.reduce((acc, item) => {
  if (!acc[item.category!]) acc[item.category!] = [];
  acc[item.category!].push(item);
  return acc;
}, {} as Record<string, NavItem[]>);

interface NavSidebarProps {
  open: boolean;        // not used directly, but kept for consistency
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

const NavSidebar: React.FC<NavSidebarProps> = ({ onClose, variant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ overflow: 'auto' }}>
      {Object.entries(grouped).map(([category, items]) => (
        <React.Fragment key={category}>
          {category !== 'Core' && <Divider sx={{ my: 1 }} />}
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            {category}
          </Typography>
          <List>
            {items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (variant === 'temporary') onClose();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </React.Fragment>
      ))}
    </Box>
  );
};

export default NavSidebar;
