import requests
import json

print("🧪 Testing Frontend Integration...")

API_URL = "http://localhost:5001"

def test_endpoint(endpoint, name):
    try:
        response = requests.get(f"{API_URL}{endpoint}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: HTTP {response.status_code}")
            print(f"   Success: {data.get('success', True)}")
            if 'count' in data:
                print(f"   Count: {data['count']}")
            return data
        else:
            print(f"❌ {name}: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return None

print("\n1. Testing API Endpoints...")
health_data = test_endpoint("/api/health", "Health Check")
players_data = test_endpoint("/api/players", "Players API")
teams_data = test_endpoint("/api/fantasy/teams", "Fantasy Teams API")

print("\n2. Verifying Data Quality...")
if players_data and players_data.get('players'):
    players = players_data['players']
    print(f"   Players loaded: {len(players)}")
    
    # Check sample player
    sample = players[0]
    required_fields = ['name', 'team', 'position', 'salary', 'fantasyScore', 'projection']
    missing = [f for f in required_fields if not sample.get(f)]
    
    if missing:
        print(f"   ⚠️ Sample player missing fields: {missing}")
    else:
        print(f"   ✅ Sample player valid: {sample['name']}")
        print(f"      Team: {sample['team']}, Position: {sample['position']}")
        print(f"      Salary: ${sample['salary']}, Fantasy: {sample.get('fantasyScore', 'N/A')}")

if teams_data and teams_data.get('teams'):
    teams = teams_data['teams']
    print(f"   Teams loaded: {len(teams)}")
    
    sample_team = teams[0]
    print(f"   ✅ Sample team: {sample_team.get('name', 'Unknown')}")
    print(f"      Players: {len(sample_team.get('players', []))}")

print("\n3. Testing Frontend Compatibility...")
print("   Expected React app URL: http://localhost:5173")
print("   Expected API URL: http://localhost:5001")
print("\n   Steps to test:")
print("   1. Open browser to http://localhost:5173")
print("   2. Navigate to Fantasy Hub")
print("   3. Check if real data appears (398 players, 20 teams)")
print("   4. Verify no '0' values or 'Unknown' for key stats")

print("\n🎉 Integration test complete!")
print("\n📋 Next steps:")
print("   - Update FantasyHubScreen.tsx to use real API data")
print("   - Remove mock data generation code")
print("   - Update interfaces to match API response")
print("   - Use dataHelpers.ts for utility functions")
