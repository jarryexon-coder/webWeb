// PromoterDashboard.tsx
const PromoterDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/promo/promoter-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch promoter stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  
  if (loading) return <CircularProgress />;
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Promoter Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              ${stats?.total_commissions_earned?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Commissions Earned
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {stats?.active_users || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Subscribers
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              ${stats?.projected_monthly_commissions?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projected Monthly
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary">
              {stats?.total_users_referred || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Referrals
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom>Your Promo Codes</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Uses</TableCell>
              <TableCell>Active Users</TableCell>
              <TableCell>Revenue Generated</TableCell>
              <TableCell>Commissions Earned</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.promo_codes?.map((code) => (
              <TableRow key={code.code}>
                <TableCell>
                  <Chip label={code.code} color="primary" size="small" />
                </TableCell>
                <TableCell>{code.usage_count}</TableCell>
                <TableCell>{code.active_referrals || 0}</TableCell>
                <TableCell>${code.total_revenue?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>${code.commissions_earned?.toFixed(2) || '0.00'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
