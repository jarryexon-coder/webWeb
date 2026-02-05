// utils/transformApiData.ts
export const transformApiData = (apiData: any[], screenType: string) => {
  switch (screenType) {
    case 'fantasy':
      return apiData.map((item, index) => ({
        id: item.id || `fantasy-${index + 1}`,
        name: item.name || `Team ${index + 1}`,
        owner: item.owner || 'Unknown',
        points: item.points || Math.floor(Math.random() * 2000) + 1000,
        rank: item.rank || index + 1,
        players: item.players || [],
        lastUpdated: item.lastUpdated || new Date().toISOString()
      }));
      
    case 'parlay':
      return apiData.map((item, index) => ({
        id: item.id || `parlay-${index + 1}`,
        name: item.name || `Parlay ${index + 1}`,
        legs: item.legs || [],
        odds: item.odds || '+500',
        confidence: item.confidence || Math.floor(Math.random() * 30) + 70,
        potentialPayout: item.potentialPayout || '$500',
        // ... other parlay fields
      }));
      
    case 'secret-phrases':
      return apiData.map((item, index) => ({
        id: item.id || `phrase-${index + 1}`,
        phrase: item.phrase || item.text || `Secret phrase ${index + 1}`,
        category: item.category || 'General',
        meaning: item.meaning || 'No meaning provided',
        example: item.example || '',
        // ... other phrase fields
      }));
      
    default:
      return apiData;
  }
};
