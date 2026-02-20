// src/components/layout/Layout.tsx
import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import NotificationSnackbar from '../common/NotificationSnackbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 },
          pb: { xs: 7, sm: 4 },
          px: { xs: 2, sm: 3 },
          width: '100%',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          {children}
        </Container>
      </Box>
      
      {isMobile && <MobileNav />}
      <NotificationSnackbar />
    </Box>
  );
};

export default Layout;
