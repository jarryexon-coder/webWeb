#!/bin/bash
# manual-api-add.sh

echo "🔧 Manually adding API calls..."

# 1. Add to NFLAnalyticsScreen.tsx
cat >> src/pages/NFLAnalyticsScreen.tsx << 'EOF'

// ===== ADDED: NFL Standings API Call =====
useEffect(() => {
  const fetchNFLStandings = async () => {
    try {
      const response = await fetch(`${process.env.VITE_API_URL}/api/nfl/standings`);
      if (response.ok) {
        const data = await response.json();
        console.log("📊 NFL Standings response:", data);
        
        // Handle both array and object formats
        let standingsData = [];
        if (data.standings) {
          if (Array.isArray(data.standings)) {
            standingsData = data.standings;
          } else if (data.standings.afc || data.standings.nfc) {
            // Extract from nested structure
            if (data.standings.afc && Array.isArray(data.standings.afc)) {
              data.standings.afc.forEach(division => {
                if (division.teams && Array.isArray(division.teams)) {
                  standingsData.push(...division.teams.map(team => ({
                    ...team,
                    conference: 'AFC',
                    division: division.division
                  })));
                }
              });
            }
            if (data.standings.nfc && Array.isArray(data.standings.nfc)) {
              data.standings.nfc.forEach(division => {
                if (division.teams && Array.isArray(division.teams)) {
                  standingsData.push(...division.teams.map(team => ({
                    ...team,
                    conference: 'NFC',
                    division: division.division
                  })));
                }
              });
            }
          }
        }
        
        console.log(`✅ Extracted ${standingsData.length} NFL teams`);
        // You'll need to update your state variable name here
        // setStandings(standingsData); // Uncomment and adjust
      }
    } catch (error) {
      console.error("Error fetching NFL standings:", error);
    }
  };
  
  fetchNFLStandings();
}, []);
EOF

# 2. Add to PrizePicksScreen.tsx
cat >> src/pages/PrizePicksScreen.tsx << 'EOF'

// ===== ADDED: PrizePicks Analytics API Call =====
useEffect(() => {
  const fetchPrizePicksAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.VITE_API_URL}/api/prizepicks/analytics`);
      if (response.ok) {
        const data = await response.json();
        console.log("📈 PrizePicks Analytics response:", data);
        
        // Handle both array and object formats
        let analyticsData = [];
        if (data.analytics) {
          if (Array.isArray(data.analytics)) {
            analyticsData = data.analytics;
          } else if (typeof data.analytics === 'object') {
            // Extract from nested structure
            if (data.analytics.bySport && Array.isArray(data.analytics.bySport)) {
              analyticsData.push(...data.analytics.bySport);
            }
            if (data.analytics.topPerformers && Array.isArray(data.analytics.topPerformers)) {
              analyticsData.push(...data.analytics.topPerformers);
            }
            if (data.analytics.byPickType && Array.isArray(data.analytics.byPickType)) {
              analyticsData.push(...data.analytics.byPickType);
            }
          }
        }
        
        console.log(`✅ Extracted ${analyticsData.length} analytics items`);
        // You'll need to update your state variable name here
        // setAnalytics(analyticsData); // Uncomment and adjust
      }
    } catch (error) {
      console.error("Error fetching PrizePicks analytics:", error);
    }
  };
  
  fetchPrizePicksAnalytics();
}, []);
EOF

echo "✅ Manual API calls added!"
echo ""
echo "⚠️  IMPORTANT: You need to:"
echo "   1. Add the state variables if not already there:"
echo "      const [standings, setStandings] = useState([]); // For NFL"
echo "      const [analytics, setAnalytics] = useState([]); // For PrizePicks"
echo "   2. Uncomment the setStandings() and setAnalytics() lines"
echo "   3. Make sure useEffect and useState are imported"
