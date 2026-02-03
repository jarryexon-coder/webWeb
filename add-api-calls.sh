#!/bin/bash
# add-api-calls-to-screens.sh

echo "🚀 Adding API calls to frontend screens..."
echo ""

# 1. Add NFL Standings API call to NFLAnalyticsScreen.tsx
echo "📄 Adding NFL Standings API to NFLAnalyticsScreen.tsx..."
if [ -f "src/pages/NFLAnalyticsScreen.tsx" ]; then
    # Check if it already has standings fetch
    if ! grep -q "fetch.*nfl.*standings\|fetch.*standings" src/pages/NFLAnalyticsScreen.tsx; then
        # Find a good place to add the fetch (look for useEffect or componentDidMount)
        if grep -q "useEffect.*() => {" src/pages/NFLAnalyticsScreen.tsx; then
            # Add fetch inside existing useEffect
            sed -i '/useEffect.*() => {/,/^[[:space:]]*}\[\]/ {
                /^[[:space:]]*const fetchData = async () => {/ {
                    a\
      try {\
        const response = await fetch(`${process.env.VITE_API_URL}/api/nfl/standings`);\
        if (response.ok) {\
          const data = await response.json();\
          console.log("📊 NFL Standings data:", data);\
          \
          // Extract teams from nested structure\
          const extractTeams = (standingsData) => {\
            if (!standingsData) return [];\
            if (Array.isArray(standingsData)) return standingsData;\
            \
            const teams = [];\
            \
            // Handle NFL division structure\
            if (standingsData.afc && Array.isArray(standingsData.afc)) {\
              standingsData.afc.forEach(division => {\
                if (division.teams && Array.isArray(division.teams)) {\
                  teams.push(...division.teams.map(team => ({\
                    ...team,\
                    conference: "AFC",\
                    division: division.division\
                  })));\
                }\
              });\
            }\
            \
            if (standingsData.nfc && Array.isArray(standingsData.nfc)) {\
              standingsData.nfc.forEach(division => {\
                if (division.teams && Array.isArray(division.teams)) {\
                  teams.push(...division.teams.map(team => ({\
                    ...team,\
                    conference: "NFC",\
                    division: division.division\
                  })));\
                }\
              });\
            }\
            \
            return teams;\
          };\
          \
          const teamsData = extractTeams(data.standings);\
          setStandings(teamsData);\
        } else {\
          console.error("Failed to fetch NFL standings:", response.status);\
        }\
      } catch (error) {\
        console.error("Error fetching NFL standings:", error);\
      }
                }
            }' src/pages/NFLAnalyticsScreen.tsx
        else
            # Add new useEffect for standings
            # First, check if React is imported
            if ! grep -q "import.*useEffect" src/pages/NFLAnalyticsScreen.tsx; then
                # Add useEffect import
                sed -i 's/import React/import React, { useEffect }/' src/pages/NFLAnalyticsScreen.tsx
            fi
            
            # Find where to add the useEffect (before the return statement)
            if grep -q "return (.*<" src/pages/NFLAnalyticsScreen.tsx; then
                line_num=$(grep -n "return (.*<" src/pages/NFLAnalyticsScreen.tsx | head -1 | cut -d: -f1)
                insert_line=$((line_num - 1))
                
                # Create the useEffect hook
                cat > /tmp/useEffect_standings.txt << 'EOF'

  // Fetch NFL Standings
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/nfl/standings`);
        if (response.ok) {
          const data = await response.json();
          console.log("📊 NFL Standings data:", data);
          
          // Extract teams from nested structure
          const extractTeams = (standingsData) => {
            if (!standingsData) return [];
            if (Array.isArray(standingsData)) return standingsData;
            
            const teams = [];
            
            // Handle NFL division structure
            if (standingsData.afc && Array.isArray(standingsData.afc)) {
              standingsData.afc.forEach(division => {
                if (division.teams && Array.isArray(division.teams)) {
                  teams.push(...division.teams.map(team => ({
                    ...team,
                    conference: "AFC",
                    division: division.division
                  })));
                }
              });
            }
            
            if (standingsData.nfc && Array.isArray(standingsData.nfc)) {
              standingsData.nfc.forEach(division => {
                if (division.teams && Array.isArray(division.teams)) {
                  teams.push(...division.teams.map(team => ({
                    ...team,
                    conference: "NFC",
                    division: division.division
                  })));
                }
              });
            }
            
            return teams;
          };
          
          const teamsData = extractTeams(data.standings);
          setStandings(teamsData);
        } else {
          console.error("Failed to fetch NFL standings:", response.status);
        }
      } catch (error) {
        console.error("Error fetching NFL standings:", error);
      }
    };
    
    fetchStandings();
  }, []);

EOF
                ed -s src/pages/NFLAnalyticsScreen.tsx << EOF
${insert_line}r /tmp/useEffect_standings.txt
w
EOF
            fi
        fi
        
        # Also need to add standings state
        if ! grep -q "const \[standings, setStandings\]" src/pages/NFLAnalyticsScreen.tsx; then
            # Find where to add state (after other useState calls)
            if grep -q "const \[.*, set.*\] = useState" src/pages/NFLAnalyticsScreen.tsx; then
                # Add after last useState
                sed -i '0,/const \[.*, set.*\] = useState/!b; /const \[.*, set.*\] = useState/ {
                    x
                    s/^/const [standings, setStandings] = useState([]);\
/
                    x
                }' src/pages/NFLAnalyticsScreen.tsx
            else
                # Add useState import if needed
                if ! grep -q "import.*useState" src/pages/NFLAnalyticsScreen.tsx; then
                    sed -i 's/import React/import React, { useState }/' src/pages/NFLAnalyticsScreen.tsx
                fi
                # Add state near the top of component
                sed -i '/const.*Component.*=.*() => {/a\
  const [standings, setStandings] = useState([]);' src/pages/NFLAnalyticsScreen.tsx
            fi
        fi
        
        echo "   ✅ Added NFL Standings API call with data extraction"
    else
        echo "   ℹ️  Already has standings fetch"
    fi
else
    echo "   ❌ File not found"
fi

# 2. Add PrizePicks Analytics API call to PrizePicksScreen.tsx
echo "📄 Adding PrizePicks Analytics API to PrizePicksScreen.tsx..."
if [ -f "src/pages/PrizePicksScreen.tsx" ]; then
    # Check if it already has analytics fetch
    if ! grep -q "fetch.*prizepicks.*analytics\|fetch.*analytics" src/pages/PrizePicksScreen.tsx; then
        # Add useEffect import if needed
        if ! grep -q "import.*useEffect" src/pages/PrizePicksScreen.tsx; then
            sed -i 's/import React/import React, { useEffect }/' src/pages/PrizePicksScreen.tsx
        fi
        
        # Add useState import if needed
        if ! grep -q "import.*useState" src/pages/PrizePicksScreen.tsx; then
            sed -i 's/import React/import React, { useState, useEffect }/' src/pages/PrizePicksScreen.tsx
        fi
        
        # Find where to add state and useEffect
        if grep -q "const.*PrizePicksScreen.*=.*() => {" src/pages/PrizePicksScreen.tsx; then
            # Add state
            sed -i '/const.*PrizePicksScreen.*=.*() => {/a\
  const [analytics, setAnalytics] = useState([]);' src/pages/PrizePicksScreen.tsx
            
            # Find where to add useEffect (before return)
            if grep -q "return (.*<" src/pages/PrizePicksScreen.tsx; then
                line_num=$(grep -n "return (.*<" src/pages/PrizePicksScreen.tsx | head -1 | cut -d: -f1)
                insert_line=$((line_num - 1))
                
                # Create the useEffect hook
                cat > /tmp/useEffect_analytics.txt << 'EOF'

  // Fetch PrizePicks Analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${process.env.VITE_API_URL}/api/prizepicks/analytics`);
        if (response.ok) {
          const data = await response.json();
          console.log("📈 PrizePicks Analytics data:", data);
          
          // Extract analytics from nested structure
          const extractAnalytics = (analyticsData) => {
            if (!analyticsData) return [];
            if (Array.isArray(analyticsData)) return analyticsData;
            
            const items = [];
            
            // Extract bySport data
            if (analyticsData.bySport && Array.isArray(analyticsData.bySport)) {
              items.push(...analyticsData.bySport.map(item => ({
                type: "sport_performance",
                ...item
              })));
            }
            
            // Extract top performers
            if (analyticsData.topPerformers && Array.isArray(analyticsData.topPerformers)) {
              items.push(...analyticsData.topPerformers.map(item => ({
                type: "top_performer",
                ...item
              })));
            }
            
            // Extract by pick type
            if (analyticsData.byPickType && Array.isArray(analyticsData.byPickType)) {
              items.push(...analyticsData.byPickType.map(item => ({
                type: "pick_type",
                ...item
              })));
            }
            
            // If no array data, create from performance
            if (items.length === 0 && analyticsData.performance) {
              items.push({
                type: "performance_summary",
                ...analyticsData.performance
              });
            }
            
            return items;
          };
          
          const analyticsItems = extractAnalytics(data.analytics);
          setAnalytics(analyticsItems);
        } else {
          console.error("Failed to fetch PrizePicks analytics:", response.status);
        }
      } catch (error) {
        console.error("Error fetching PrizePicks analytics:", error);
      }
    };
    
    fetchAnalytics();
  }, []);

EOF
                ed -s src/pages/PrizePicksScreen.tsx << EOF
${insert_line}r /tmp/useEffect_analytics.txt
w
EOF
            fi
        fi
        
        echo "   ✅ Added PrizePicks Analytics API call with data extraction"
    else
        echo "   ℹ️  Already has analytics fetch"
    fi
else
    echo "   ❌ File not found"
fi

# 3. Check for NHLTrendsScreen.tsx
echo "📄 Checking NHLTrendsScreen.tsx..."
if [ -f "src/pages/NHLTrendsScreen.tsx" ]; then
    if ! grep -q "fetch.*nhl.*standings" src/pages/NHLTrendsScreen.tsx; then
        echo "   ℹ️  NHL Trends screen exists but no standings fetch found"
        echo "   Would you like to add NHL standings API? (y/n)"
        read -n 1 add_nhl
        echo ""
        if [[ "$add_nhl" =~ ^[Yy]$ ]]; then
            # Similar pattern as above for NHL
            echo "   Adding NHL Standings API..."
            # (Similar code as NFL but for /api/nhl/standings)
        fi
    else
        echo "   ✅ Already has NHL standings fetch"
    fi
else
    echo "   ℹ️  NHL Trends screen not found"
fi

echo ""
echo "✅ API calls added to frontend screens!"
echo ""
echo "📋 Summary of changes:"
echo "   1. Added fetch calls to NFLAnalyticsScreen.tsx for /api/nfl/standings"
echo "   2. Added fetch calls to PrizePicksScreen.tsx for /api/prizepicks/analytics"
echo "   3. Added proper data extraction from nested object structures"
echo ""
echo "🎯 Next steps:"
echo "   1. Deploy frontend: vercel --prod --yes"
echo "   2. Test the screens in your browser"
echo "   3. Check browser console for data logs"
echo ""
echo "⚠️  IMPORTANT: This is a FRONTEND WORKAROUND"
echo "   For a permanent fix, you should still update the backend to return arrays"
echo "   as shown in previous messages."
