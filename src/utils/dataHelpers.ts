// src/utils/dataHelpers.ts - UPDATED VERSION
// Utility functions for processing sports data

// Calculate player value based on fantasy score and salary
export const calculatePlayerValue = (player: any): number => {
  if (!player || !player.salary || player.salary === 0) return 0;
  const score = player.fantasyScore || player.fp || player.projection || 0;
  return Number((score / (player.salary / 1000)).toFixed(2));
};

// Format salary for display
export const formatSalary = (salary: number): string => {
  if (!salary && salary !== 0) return 'N/A';
  return `$${salary.toLocaleString()}`;
};

// Get position color
export const getPositionColor = (position: string): string => {
  switch (position) {
    case 'PG': return '#3b82f6';
    case 'SG': return '#8b5cf6';
    case 'SF': return '#10b981';
    case 'PF': return '#f59e0b';
    case 'C': return '#ef4444';
    default: return '#6b7280';
  }
};

// Get injury status color
export const getInjuryColor = (status: string = 'healthy'): string => {
  switch (status.toLowerCase()) {
    case 'healthy': return '#10b981';
    case 'probable': return '#22c55e';
    case 'questionable': return '#f59e0b';
    case 'doubtful': return '#f97316';
    case 'out': return '#ef4444';
    default: return '#6b7280';
  }
};

// Filter players by position
export const filterPlayersByPosition = (players: any[], position: string): any[] => {
  if (!position || position === 'All') return players;
  return players.filter(player => 
    player.position === position || player.pos === position
  );
};

// Sort players by field
export const sortPlayers = (players: any[], field: string, direction: 'asc' | 'desc' = 'desc'): any[] => {
  const sorted = [...players];
  
  sorted.sort((a, b) => {
    let aValue = a[field] || 0;
    let bValue = b[field] || 0;
    
    // Handle string comparison for names
    if (field === 'name' || field === 'team' || field === 'playerName') {
      aValue = a[field] || a.playerName || '';
      bValue = b[field] || b.playerName || '';
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Numeric comparison
    const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue) || 0;
    const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue) || 0;
    
    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  });
  
  return sorted;
};

// Calculate team totals
export const calculateTeamTotals = (team: any) => {
  const players = team.players || [];
  return {
    totalSalary: players.reduce((sum: number, p: any) => sum + (p.salary || 0), 0),
    totalFantasy: players.reduce((sum: number, p: any) => sum + (p.fantasyScore || 0), 0),
    totalProjection: players.reduce((sum: number, p: any) => sum + (p.projection || 0), 0),
    playerCount: players.length
  };
};

// Format player stats for display
export const formatPlayerStats = (player: any): string => {
  const stats = [];
  if (player.points || player.pts) stats.push(`${player.points || player.pts || 0} PTS`);
  if (player.rebounds || player.reb) stats.push(`${player.rebounds || player.reb || 0} REB`);
  if (player.assists || player.ast) stats.push(`${player.assists || player.ast || 0} AST`);
  return stats.join(' | ');
};

// Calculate fantasy score from raw stats
export const calculateFantasyScore = (player: any): number => {
  const pts = player.points || player.pts || 0;
  const reb = player.rebounds || player.reb || 0;
  const ast = player.assists || player.ast || 0;
  const stl = player.steals || player.stl || 0;
  const blk = player.blocks || player.blk || 0;
  const threes = player.threePointers || player.threes || 0;
  
  // Standard fantasy formula: PTS + 1.2*REB + 1.5*AST + 3*STL + 3*BLK + 3*3PM
  return Number((pts + (1.2 * reb) + (1.5 * ast) + (3 * stl) + (3 * blk) + (3 * threes)).toFixed(1));
};

// Normalize API response
export const normalizeApiResponse = (response: any): any[] => {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) return response;
  
  // If response has success flag (your API structure)
  if (response.success !== undefined) {
    const arrayProps = ['players', 'teams', 'selections', 'analytics', 'picks', 'suggestions', 'history', 'trends', 'predictions', 'data'];
    
    for (const prop of arrayProps) {
      if (response[prop] && Array.isArray(response[prop])) {
        return response[prop];
      }
    }
  }
  
  // If response is an object with common array properties
  if (typeof response === 'object') {
    const arrayProps = ['data', 'results', 'items', 'analytics', 'players', 'teams', 'games'];
    
    for (const prop of arrayProps) {
      if (response[prop] && Array.isArray(response[prop])) {
        return response[prop];
      }
    }
    
    // If it's a single object, wrap it in array
    return [response];
  }
  
  // Fallback to empty array
  return [];
};

// Format confidence level
export const formatConfidence = (confidence: string | undefined): string => {
  if (!confidence) return 'Unknown';
  
  const confidenceMap: Record<string, string> = {
    'arbitrage': '💰 Arbitrage',
    'good-value': '✅ Good Value',
    'fair': '⚖️ Fair',
    'slight-juice': '⚠️ Slight Juice',
    'bad-value': '❌ Bad Value',
    'invalid': '❓ Invalid',
    'error': '🚨 Error',
    'very-high': '🎯 Very High',
    'high': '✅ High',
    'medium': '⚠️ Medium',
    'low': '📉 Low',
    'no-edge': '⚖️ No Edge'
  };
  
  return confidenceMap[confidence] || confidence.replace('-', ' ');
};

// Get confidence color
export const getConfidenceColor = (confidence: string | undefined) => {
  switch(confidence) {
    case 'arbitrage': return '#7c3aed';
    case 'good-value': return '#059669';
    case 'fair': return '#3b82f6';
    case 'slight-juice': return '#f59e0b';
    case 'bad-value': return '#ef4444';
    case 'invalid': return '#6b7280';
    case 'error': return '#6b7280';
    case 'very-high': return '#059669';
    case 'high': return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'low': return '#ef4444';
    case 'no-edge': return '#6b7280';
    default: return '#64748b';
  }
};
