// src/components/layout/Sidebar.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Newspaper as NewsIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  ShowChart as PropsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Twitter as TwitterIcon,
  LocalHospital as InjuryIcon,
  Groups as TeamIcon,
  ExpandLess,
  ExpandMore,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useSports } from '../../context/SportsContext';

const drawerWidth = 260;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSport, setSelectedSport } = useSports();
  const [sportsOpen, setSportsOpen] = useState(true);
  const [newsOpen, setNewsOpen] = useState(true);

  const sports = [
    { id: 'nba', label: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
    { id: 'nfl', label: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
    { id: 'mlb', label: 'MLB', icon: <BaseballIcon />, color: '#10b981' },
    { id: 'nhl', label: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  ];

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Fantasy Hub', icon: <StarIcon />, path: '/fantasy-hub' },
    { text: 'Player Props', icon: <PropsIcon />, path: '/player-props' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  ];

  const newsItems = [
    { text: 'All News', icon: <NewsIcon />, path: '/sports-wire' },
    { text: 'Beat Writers', icon: <TwitterIcon />, path: '/beat-writers', color: '#8b5cf6' },
    { text: 'Injuries', icon: <InjuryIcon />, path: '/injuries', color: '#ef4444' },
    { text: 'Teams', icon: <TeamIcon />, path: `/team/${selectedSport}`, color: '#3b82f6' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 900) {
      onClose();
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    // Update team path when sport changes
    if (location.pathname.includes('/team/')) {
      navigate(`/team/${sportId}`);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          borderRight: '1px solid rgba(255,255,255,0.12)',
        },
      }}
      open={open}
      onClose={onClose}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        {/* Sports Selection */}
        <List>
          <ListItemButton onClick={() => setSportsOpen(!sportsOpen)}>
            <ListItemIcon>
              <BasketballIcon />
            </ListItemIcon>
            <ListItemText primary="Sports" />
            {sportsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={sportsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {sports.map((sport) => (
                <ListItemButton
                  key={sport.id}
                  sx={{ pl: 4 }}
                  selected={selectedSport === sport.id}
                  onClick={() => handleSportChange(sport.id)}
                >
                  <ListItemIcon sx={{ color: sport.color }}>
                    {sport.icon}
                  </ListItemIcon>
                  <ListItemText primary={sport.label} />
                  {selectedSport === sport.id && (
                    <Chip
                      size="small"
                      label="Active"
                      sx={{ 
                        bgcolor: sport.color,
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Main Menu */}
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* News & Updates */}
        <List>
          <ListItemButton onClick={() => setNewsOpen(!newsOpen)}>
            <ListItemIcon>
              <NewsIcon />
            </ListItemIcon>
            <ListItemText primary="News & Updates" />
            {newsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={newsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {newsItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path || 
                           (item.path.includes('/team/') && location.pathname.includes('/team/'))}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon sx={{ color: item.color || 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      sx: { color: item.color || 'inherit' }
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Settings */}
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => handleNavigation('/settings')}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>

        {/* API Status */}
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            🚀 Python Backend
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" align="center">
            {process.env.REACT_APP_API_URL || 'api.fantasy.com'}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

// Need to import Toolbar
import Toolbar from '@mui/material/Toolbar';

export default Sidebar;
