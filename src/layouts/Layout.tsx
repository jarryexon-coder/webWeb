import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Box,
  Container,
  IconButton,
  Avatar,
  Divider,
  Badge,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  Subscriptions as SubscriptionIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { navigationGroups } from '../config/navigation';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleTabClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setAnchorEl(event.currentTarget);
    setActiveGroupIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveGroupIndex(null);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    handleMenuClose();
    setMobileMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleUserMenuClose();
  };

  const getUserInitials = () => {
    if (!user?.displayName) return '?';
    const names = user.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <>
      <AppBar position="static" elevation={3}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 3 } }}>
          <Typography
            variant="h5"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              letterSpacing: 1
            }}
            onClick={() => navigate('/home')}
          >
            Sports App
          </Typography>

          {user && !isMobile && (
            <Tabs 
              value={false} 
              textColor="inherit" 
              sx={{ 
                mr: 2,
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  minWidth: 120,
                  padding: '12px 20px',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease'
                  }
                }
              }}
            >
              {navigationGroups.map((group, index) => (
                <Tab
                  key={group.title}
                  label={group.title}
                  onClick={(e) => handleTabClick(e, index)}
                  sx={{ textTransform: 'none' }}
                />
              ))}
            </Tabs>
          )}

          {user && isMobile && (
            <IconButton 
              color="inherit" 
              onClick={handleMobileMenuOpen}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {user && (
            <Box>
              <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                <Badge 
                  color="success" 
                  variant="dot" 
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Avatar 
                    alt={user.displayName || 'User'} 
                    src={user.photoURL || ''}
                    sx={{ width: 40, height: 40 }}
                  >
                    {!user.photoURL && getUserInitials()}
                  </Avatar>
                </Badge>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: { width: 280, maxWidth: '100%', mt: 1 }
                }}
              >
                <MenuItem disabled sx={{ opacity: 1, py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user.displayName || 'User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/dashboard'); }}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/pricing'); }}>
                  <ListItemIcon><SubscriptionIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Subscription" />
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/billing'); }}>
                  <ListItemIcon><PaymentIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Billing" />
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Desktop Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              fontSize: '0.95rem'
            }
          }
        }}
      >
        {activeGroupIndex !== null &&
          navigationGroups[activeGroupIndex].items.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => handleMenuItemClick(item.path)}
              selected={location.pathname === item.path}
            >
              {item.label}
            </MenuItem>
          ))}
      </Menu>

      {/* Mobile Navigation Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: { width: 280, maxWidth: '100%', mt: 1 }
        }}
      >
        {navigationGroups.map((group) => (
          <Box key={group.title}>
            <MenuItem disabled sx={{ opacity: 0.7, fontWeight: 'bold' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {group.title}
              </Typography>
            </MenuItem>
            {group.items.map((item) => (
              <MenuItem
                key={item.path}
                onClick={() => handleMenuItemClick(item.path)}
                selected={location.pathname === item.path}
                sx={{ pl: 4 }}
              >
                {item.label}
              </MenuItem>
            ))}
            <Divider sx={{ my: 1 }} />
          </Box>
        ))}
      </Menu>

      {/* Page content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, md: 3 } }}>
        <Outlet />
      </Container>

      {/* Disclaimer Footer */}
      <Box
        component="footer"
        sx={{
          fontSize: { xs: '11px', md: '12px' },
          textAlign: 'center',
          marginTop: '20px',
          padding: { xs: '12px', md: '16px' },
          color: '#666',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
        }}
      >
        For entertainment and informational purposes only. No real‑money gambling is offered or facilitated.
        All statistics and projections are simulated.
      </Box>
    </>
  );
};

export default Layout;
