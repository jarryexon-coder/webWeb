// Fantasy Hub API client
export const fantasyApi = {
  // Get fantasy projections
  getProjections: async (sport: string, date: string) => {
    const url = `https://python-api-fresh-production.up.railway.app/api/fantasy/player-projections?sport=${sport}&date=${date}`;
    const response = await fetch(url);
    return response.json();
  }
};
