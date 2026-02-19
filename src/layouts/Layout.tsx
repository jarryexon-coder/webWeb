// src/layouts/Layout.tsx
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
} from '@mui/material';
import { navigationGroups } from '../config/navigation';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);

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

  // Find which tab might be active based on current path (optional highlighting)
  // For simplicity we don't highlight the tab itself.

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            Sports App
          </Typography>
          <Tabs value={false} textColor="inherit">
            {navigationGroups.map((group, index) => (
              <Tab
                key={group.title}
                label={group.title}
                onClick={(e) => handleTabClick(e, index)}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* Dropdown menu for the selected group */}
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
