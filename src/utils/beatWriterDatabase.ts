// src/utils/beatWriterDatabase.ts
// Local cache of beat writers for offline/fallback use

export interface BeatWriter {
  name: string;
  twitter: string;
  outlet: string;
  national?: boolean;
  sports?: string[];
}

export const BEAT_WRITERS_DATABASE: Record<string, Record<string, BeatWriter[]>> = {
  NBA: {
    'Los Angeles Lakers': [
      { name: 'Jovan Buha', twitter: '@jovanbuha', outlet: 'The Athletic' },
      { name: 'Bill Oram', twitter: '@billoram', outlet: 'The Athletic' },
      { name: 'Dan Woike', twitter: '@DanWoikeSports', outlet: 'LA Times' },
      { name: 'Dave McMenamin', twitter: '@mcten', outlet: 'ESPN' }
    ],
    'Golden State Warriors': [
      { name: 'Anthony Slater', twitter: '@anthonyVslater', outlet: 'The Athletic' },
      { name: 'Marcus Thompson', twitter: '@ThompsonScribe', outlet: 'The Athletic' },
      { name: 'Connor Letourneau', twitter: '@Con_Chron', outlet: 'San Francisco Chronicle' }
    ],
    // Add all other teams...
  },
  NFL: {
    'Kansas City Chiefs': [
      { name: 'Nate Taylor', twitter: '@ByNateTaylor', outlet: 'The Athletic' },
      { name: 'Adam Teicher', twitter: '@adamteicher', outlet: 'ESPN' }
    ],
    // Add all NFL teams...
  }
};

export const NATIONAL_INSIDERS: BeatWriter[] = [
  { name: 'Shams Charania', twitter: '@ShamsCharania', outlet: 'The Athletic', national: true, sports: ['NBA'] },
  { name: 'Adrian Wojnarowski', twitter: '@wojespn', outlet: 'ESPN', national: true, sports: ['NBA'] },
  { name: 'Chris Haynes', twitter: '@ChrisBHaynes', outlet: 'Bleacher Report', national: true, sports: ['NBA'] },
  { name: 'Adam Schefter', twitter: '@AdamSchefter', outlet: 'ESPN', national: true, sports: ['NFL'] },
  { name: 'Ian Rapoport', twitter: '@RapSheet', outlet: 'NFL Network', national: true, sports: ['NFL'] }
];

export const getBeatWritersForTeam = (sport: string, team: string): BeatWriter[] => {
  return BEAT_WRITERS_DATABASE[sport]?.[team] || [];
};

export const getAllTeams = (sport: string): string[] => {
  return Object.keys(BEAT_WRITERS_DATABASE[sport] || {});
};

export const searchBeatWriters = (query: string, sport?: string): BeatWriter[] => {
  const results: BeatWriter[] = [];
  const lowerQuery = query.toLowerCase();
  
  // Search national insiders
  NATIONAL_INSIDERS.forEach(insider => {
    if (!sport || insider.sports?.includes(sport)) {
      if (insider.name.toLowerCase().includes(lowerQuery) || 
          insider.outlet.toLowerCase().includes(lowerQuery)) {
        results.push(insider);
      }
    }
  });
  
  // Search team beat writers
  const sports = sport ? [sport] : Object.keys(BEAT_WRITERS_DATABASE);
  sports.forEach(s => {
    Object.entries(BEAT_WRITERS_DATABASE[s] || {}).forEach(([team, writers]) => {
      writers.forEach(writer => {
        if (writer.name.toLowerCase().includes(lowerQuery) || 
            writer.outlet.toLowerCase().includes(lowerQuery) ||
            team.toLowerCase().includes(lowerQuery)) {
          results.push({ ...writer, team });
        }
      });
    });
  });
  
  return results;
};
