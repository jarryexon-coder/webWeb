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
  ListItemText
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Payment as PaymentIcon,
  Subscriptions as SubscriptionIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { navigationGroups } from '../config/navigation';
import { useAuth } from '../contexts/AuthContext'; // <-- import auth hook

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // <-- get user and logout

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

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
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // redirect to intro page after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleUserMenuClose();
  };

  // Get user initials for avatar
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
      <AppBar position="static">
        <Toolbar>
          {/* Logo / App Title */}
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/home')}
          >
            Sports App
          </Typography>

          {/* Navigation Tabs (only shown if user is logged in) */}
          {user && (
            <Tabs value={false} textColor="inherit" sx={{ mr: 2 }}>
              {navigationGroups.map((group, index) => (
                <Tab
                  key={group.title}
                  label={group.title}
                  onClick={(e) => handleTabClick(e, index)}
                />
              ))}
            </Tabs>
          )}

          {/* User Menu */}
          {user && (
            <Box>
              <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                <Badge 
                  color="success" 
                  variant="dot" 
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Avatar alt={user.displayName || 'User'} src={user.photoURL || ''}>
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
                  sx: { width: 240, maxWidth: '100%' }
                }}
              >
                <MenuItem disabled sx={{ opacity: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {user.displayName || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                
                {/* 👇 NEW DASHBOARD & ACCOUNT MENU ITEMS 👇 */}
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/dashboard'); }}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Dashboard</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/pricing'); }}>
                  <ListItemIcon>
                    <SubscriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Subscription</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/billing'); }}>
                  <ListItemIcon>
                    <PaymentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Billing</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                
                <Divider />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Dropdown menu for the selected navigation group */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
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

      {/* Page content */}
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Outlet />
      </Container>
    </>
  );
};

export default Layout;
