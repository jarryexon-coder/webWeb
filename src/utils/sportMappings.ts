// Sport and league mappings across APIs
export const sportToOddsApi: Record<string, string> = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
  ufc: 'mma_mixed_martial_arts',
  soccer: 'soccer_uefa_champs_league'
}

export const sportToKalshiSeries: Record<string, string> = {
  nfl: 'SPORTS-NFL',
  nba: 'SPORTS-NBA',
  mlb: 'SPORTS-MLB'
}
