// src/utils/queryProcessor.ts
export interface QueryIntent {
  sport?: string;           // 'nba', 'nfl', etc.
  player?: string;
  team?: string;
  keywords: string[];       // remaining meaningful words
  action?: 'generate' | 'explain' | 'compare';
}

export function preprocessQuery(rawQuery: string): QueryIntent {
  const lower = rawQuery.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(w => w.length > 2);

  // Detect sport from known keywords
  const sportMap: Record<string, string> = {
    basketball: 'nba', nba: 'nba', nfl: 'nfl', football: 'nfl',
    hockey: 'nhl', nhl: 'nhl', baseball: 'mlb', mlb: 'mlb',
    soccer: 'soccer',
  };
  const detectedSport = words.find(w => sportMap[w]) 
    ? sportMap[words.find(w => sportMap[w])!] 
    : undefined;

  // Simple player/team detection (can be expanded with a dictionary)
  const playerKeywords = ['jokic', 'lebron', 'mahomes', 'judge'];
  const detectedPlayer = words.find(w => playerKeywords.includes(w));
  const teamKeywords = ['lakers', 'chiefs', 'yankees', 'bruins'];
  const detectedTeam = words.find(w => teamKeywords.includes(w));

  // Remove detected entities from keywords
  const keywords = words.filter(w => 
    !sportMap[w] && !playerKeywords.includes(w) && !teamKeywords.includes(w)
  );

  return {
    sport: detectedSport,
    player: detectedPlayer,
    team: detectedTeam,
    keywords,
    action: lower.includes('explain') ? 'explain' : 'generate',
  };
}
