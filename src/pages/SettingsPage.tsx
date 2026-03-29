// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Switch,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
  Snackbar,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Import Auth Context - we'll handle the error gracefully
import { AuthContext } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authData, setAuthData] = useState<{ user: any; token: string | null }>({ user: null, token: null });

  // Try to get auth from context with error handling
  useEffect(() => {
    try {
      // Access auth context through a safe method
      const authContext = (window as any).__AUTH_CONTEXT__;
      if (authContext) {
        setAuthData({
          user: authContext.user,
          token: authContext.token
        });
      }
      setIsAuthReady(true);
    } catch (error) {
      console.error('Error accessing auth context:', error);
      setIsAuthReady(true);
    }
  }, []);

  // Profile Settings
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    gameUpdates: true,
    predictionAlerts: true,
    marketingEmails: false,
    weeklyDigest: true
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    themeMode: 'system' as 'light' | 'dark' | 'system',
    fontSize: 16,
    compactMode: false,
    animations: true
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    showEmail: true,
    showPhone: false
  });

  // Language Settings
  const [language, setLanguage] = useState('en');

  // Load user data from localStorage if auth context is not available
  useEffect(() => {
    if (!authData.user) {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAuthData({
            user: parsedUser,
            token: storedToken
          });
          
          setProfile({
            firstName: parsedUser.firstName || parsedUser.displayName?.split(' ')[0] || '',
            lastName: parsedUser.lastName || parsedUser.displayName?.split(' ')[1] || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            location: parsedUser.location || '',
            bio: parsedUser.bio || ''
          });
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    } else if (authData.user) {
      setProfile({
        firstName: authData.user.firstName || authData.user.displayName?.split(' ')[0] || '',
        lastName: authData.user.lastName || authData.user.displayName?.split(' ')[1] || '',
        email: authData.user.email || '',
        phone: authData.user.phone || '',
        location: authData.user.location || '',
        bio: authData.user.bio || ''
      });
    }
  }, [authData.user]);

  // Check if user is authenticated
  useEffect(() => {
    if (isAuthReady && !authData.user && !localStorage.getItem('authToken')) {
      // No user found, redirect to login
      navigate('/login');
    }
  }, [isAuthReady, authData.user, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = () => {
    console.log('Saving profile:', profile);
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handlePasswordChange = () => {
    setSnackbar({ open: true, message: 'Password change functionality coming soon', severity: 'info' });
  };

  const handleNotificationSave = () => {
    console.log('Saving notification settings:', notifications);
    setSnackbar({ open: true, message: 'Notification settings saved!', severity: 'success' });
  };

  const handleAppearanceSave = () => {
    console.log('Saving appearance settings:', appearance);
    setSnackbar({ open: true, message: 'Appearance settings saved!', severity: 'success' });
  };

  const handleSecuritySave = () => {
    console.log('Saving security settings:', security);
    setSnackbar({ open: true, message: 'Security settings saved!', severity: 'success' });
  };

  const handleLanguageSave = () => {
    console.log('Saving language:', language);
    setSnackbar({ open: true, message: 'Language preference saved!', severity: 'success' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show loading state while auth is being checked
  if (!isAuthReady) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // If no user after checking, return null (redirect will happen in useEffect)
  if (!authData.user && !localStorage.getItem('authToken')) {
    return null;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc',
      pb: 8
    }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)',
        color: 'white',
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 6 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12}>
              <Chip
                icon={<SettingsIcon />}
                label="ACCOUNT SETTINGS"
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
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.2,
                mb: 1
              }}>
                Settings
              </Typography>
              <Typography variant="h6" sx={{
                opacity: 0.9,
                maxWidth: 600
              }}>
                Manage your account preferences and customization options
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/home')} sx={{ cursor: 'pointer' }}>
            Home
          </Link>
          <Typography color="text.primary">Settings</Typography>
        </Breadcrumbs>

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: theme.palette.primary.main }}>
                  {profile.firstName ? profile.firstName[0].toUpperCase() : (authData.user?.displayName?.[0]?.toUpperCase() || 'U')}
                  {profile.lastName ? profile.lastName[0].toUpperCase() : ''}
                </Avatar>
                <Typography variant="h6">
                  {profile.firstName || authData.user?.displayName?.split(' ')[0] || 'User'} {profile.lastName || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email || authData.user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List component="nav" dense>
                {[
                  { label: 'Profile', icon: <SettingsIcon />, index: 0 },
                  { label: 'Notifications', icon: <NotificationsIcon />, index: 1 },
                  { label: 'Appearance', icon: <PaletteIcon />, index: 2 },
                  { label: 'Security', icon: <SecurityIcon />, index: 3 },
                  { label: 'Language', icon: <LanguageIcon />, index: 4 }
                ].map((item) => (
                  <ListItem
                    button
                    key={item.label}
                    selected={tabValue === item.index}
                    onClick={() => setTabValue(item.index)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Profile" />
                <Tab label="Notifications" />
                <Tab label="Appearance" />
                <Tab label="Security" />
                <Tab label="Language" />
              </Tabs>

              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled
                      helperText="Email cannot be changed. Contact support for assistance."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us a little about yourself..."
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Change Password</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth type="password" label="Current Password" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="password" label="New Password" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="password" label="Confirm New Password" />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={handlePasswordChange}>Change Password</Button>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleProfileSave}>
                    Save Changes
                  </Button>
                </Box>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                      />
                    }
                    label="Push Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.smsAlerts}
                        onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })}
                      />
                    }
                    label="SMS Alerts"
                  />
                </FormGroup>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>What to Notify</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.gameUpdates}
                        onChange={(e) => setNotifications({ ...notifications, gameUpdates: e.target.checked })}
                      />
                    }
                    label="Game Updates & Scores"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.predictionAlerts}
                        onChange={(e) => setNotifications({ ...notifications, predictionAlerts: e.target.checked })}
                      />
                    }
                    label="Prediction Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.marketingEmails}
                        onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                      />
                    }
                    label="Marketing & Promotions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.weeklyDigest}
                        onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                      />
                    }
                    label="Weekly Digest"
                  />
                </FormGroup>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleNotificationSave}>
                    Save Preferences
                  </Button>
                </Box>
              </TabPanel>

              {/* Appearance Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Theme</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: appearance.themeMode === 'light' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        bgcolor: appearance.themeMode === 'light' ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                      }}
                      onClick={() => setAppearance({ ...appearance, themeMode: 'light' })}
                    >
                      <LightModeIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>Light</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: appearance.themeMode === 'dark' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        bgcolor: appearance.themeMode === 'dark' ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                      }}
                      onClick={() => setAppearance({ ...appearance, themeMode: 'dark' })}
                    >
                      <DarkModeIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>Dark</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: appearance.themeMode === 'system' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        bgcolor: appearance.themeMode === 'system' ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                      }}
                      onClick={() => setAppearance({ ...appearance, themeMode: 'system' })}
                    >
                      <SettingsIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>System</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Font Size</Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    value={appearance.fontSize}
                    onChange={(_, value) => setAppearance({ ...appearance, fontSize: value as number })}
                    min={12}
                    max={24}
                    marks={[
                      { value: 12, label: 'Small' },
                      { value: 16, label: 'Medium' },
                      { value: 20, label: 'Large' },
                      { value: 24, label: 'X-Large' }
                    ]}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appearance.compactMode}
                        onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
                      />
                    }
                    label="Compact Mode (Show more content)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appearance.animations}
                        onChange={(e) => setAppearance({ ...appearance, animations: e.target.checked })}
                      />
                    }
                    label="Enable Animations"
                  />
                </FormGroup>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleAppearanceSave}>
                    Save Appearance
                  </Button>
                </Box>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>Security Settings</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={security.twoFactorAuth}
                        onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                      />
                    }
                    label="Two-Factor Authentication (2FA)"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                    Add an extra layer of security to your account
                  </Typography>
                </FormGroup>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Session Timeout (minutes)</InputLabel>
                  <Select
                    value={security.sessionTimeout}
                    label="Session Timeout (minutes)"
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value as number })}
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                    <MenuItem value={480}>8 hours</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Privacy</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={security.showEmail}
                        onChange={(e) => setSecurity({ ...security, showEmail: e.target.checked })}
                      />
                    }
                    label="Show email in profile"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={security.showPhone}
                        onChange={(e) => setSecurity({ ...security, showPhone: e.target.checked })}
                      />
                    }
                    label="Show phone number in profile"
                  />
                </FormGroup>

                <Divider sx={{ my: 3 }} />

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Deleting your account is permanent and cannot be undone. All your data will be removed.
                  </Typography>
                </Alert>
                <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                  Delete Account
                </Button>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSecuritySave}>
                    Save Security Settings
                  </Button>
                </Box>
              </TabPanel>

              {/* Language Tab */}
              <TabPanel value={tabValue} index={4}>
                <Typography variant="h6" gutterBottom>Language Preference</Typography>
                <FormControl fullWidth>
                  <InputLabel>Select Language</InputLabel>
                  <Select
                    value={language}
                    label="Select Language"
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <MenuItem value="en">English (US)</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="pt">Português</MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    More languages coming soon! We're working on adding support for additional languages.
                  </Typography>
                </Alert>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleLanguageSave}>
                    Save Language
                  </Button>
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
