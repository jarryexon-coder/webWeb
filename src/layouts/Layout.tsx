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
} from '@mui/material';
import { navigationGroups } from '../config/navigation';
import { useAuth } from '../context/AuthContext'; // <-- import auth hook

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
                <Avatar alt={user.displayName || 'User'} src={user.photoURL || ''}>
                  {!user.photoURL && getUserInitials()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user.displayName || user.email}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
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
