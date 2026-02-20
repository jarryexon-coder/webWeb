// Parlay Architect API client
export const parlayApi = {
  // Get parlay recommendations
  getParlayRecommendations: async (sports: string[], maxLegs = 6) => {
    const url = `https://python-api-fresh-production.up.railway.app/api/parlay/architect?sports=${sports.join(',')}&max_legs=${maxLegs}`;
    const response = await fetch(url);
    return response.json();
  },

  // Build custom parlay
  buildParlay: async (legs: any[]) => {
    const url = `https://python-api-fresh-production.up.railway.app/api/parlay/build`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legs })
    });
    return response.json();
  }
};
