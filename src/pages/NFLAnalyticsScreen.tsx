import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert
} from '@mui/material';

const NFLAnalyticsScreen: React.FC = () => {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('NFLAnalyticsScreen useEffect running');
    
    const fetchNFLStandings = async () => {
      try {
        const apiUrl = process.env.VITE_API_URL || 'https://pleasing-determination-production.up.railway.app';
        console.log('Fetching from:', `${apiUrl}/api/nfl/standings`);
        
        const response = await fetch(`${apiUrl}/api/nfl/standings`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('NFL Standings response:', data);
        
        if (data.success && data.standings) {
          let standingsData: any[] = [];
          
          // Handle both array and object formats
          if (Array.isArray(data.standings)) {
            standingsData = data.standings;
          } else if (typeof data.standings === 'object') {
            // Extract from nested structure
            if (data.standings.afc && Array.isArray(data.standings.afc)) {
              data.standings.afc.forEach((division: any) => {
                if (division.teams && Array.isArray(division.teams)) {
                  standingsData.push(...division.teams.map((team: any) => ({
                    ...team,
                    conference: 'AFC',
                    division: division.division
                  })));
                }
              });
            }
            
            if (data.standings.nfc && Array.isArray(data.standings.nfc)) {
              data.standings.nfc.forEach((division: any) => {
                if (division.teams && Array.isArray(division.teams)) {
                  standingsData.push(...division.teams.map((team: any) => ({
                    ...team,
                    conference: 'NFC',
                    division: division.division
                  })));
                }
              });
            }
          }
          
          console.log(`Extracted ${standingsData.length} NFL teams`);
          setStandings(standingsData);
        } else {
          throw new Error(data.message || 'Invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching NFL standings:', err);
        setError(err.message || 'Failed to load standings');
      } finally {
        setLoading(false);
      }
    };

    fetchNFLStandings();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography ml={2}>Loading NFL standings...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        NFL Analytics
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Real-time NFL standings and analytics
      </Typography>

      {standings.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No standings data available
        </Alert>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Loaded {standings.length} teams
          </Typography>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, fontSize: '12px' }}>
              {JSON.stringify(standings.slice(0, 5), null, 2)}
            </pre>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default NFLAnalyticsScreen;
