import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, CircularProgress, Alert,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Grid, Chip, Divider, IconButton, Card, CardContent, Switch,
  FormControlLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import { useBracket } from '../../hooks/useNcaab';
import { useTeams } from '../../hooks/useNcaab';
import {
  AutoAwesome as AutoAwesomeIcon,
  ExpandMore, ExpandLess,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

// ------------------------------
// Types and Interfaces
// ------------------------------

interface Team {
  id?: number;
  name: string;
  seed: number;
  region: string;
  eliminated?: boolean;
  eliminatedInRound?: number;
}

interface ApiTeam {
  id: string;
  full_name: string;
  name: string;
  seed?: number;
  conference?: string;
}

interface BracketGame {
  round: number;
  region?: string;
  gameNumber: number;
  team1: Team;
  team2: Team;
  winner?: Team;
  loser?: Team;
  confidence?: number;
  upset?: boolean;
}

interface GeneratedBracket {
  id: string;
  strategy: string;
  query: string;
  games: BracketGame[];
  finalFour: Team[];
  champion: Team;
  timestamp: number;
}

// ------------------------------
// Actual 2025 Tournament Teams (for the generator)
// ------------------------------
const TEAMS_BY_REGION: Record<string, { name: string; seed: number }[]> = {
  'East': [
    { name: 'Duke', seed: 1 },
    { name: 'Mount St. Mary\'s/American', seed: 16 },
    { name: 'Mississippi St', seed: 8 },
    { name: 'Baylor', seed: 9 },
    { name: 'Oregon', seed: 5 },
    { name: 'Liberty', seed: 12 },
    { name: 'Arizona', seed: 4 },
    { name: 'Akron', seed: 13 },
    { name: 'BYU', seed: 6 },
    { name: 'VCU', seed: 11 },
    { name: 'Wisconsin', seed: 3 },
    { name: 'Montana', seed: 14 },
    { name: 'Saint Mary\'s', seed: 7 },
    { name: 'Vanderbilt', seed: 10 },
    { name: 'Alabama', seed: 2 },
    { name: 'Robert Morris', seed: 15 }
  ],
  'West': [
    { name: 'Florida', seed: 1 },
    { name: 'Norfolk St', seed: 16 },
    { name: 'UConn', seed: 8 },
    { name: 'Oklahoma', seed: 9 },
    { name: 'Memphis', seed: 5 },
    { name: 'Colorado St', seed: 12 },
    { name: 'Maryland', seed: 4 },
    { name: 'Grand Canyon', seed: 13 },
    { name: 'Missouri', seed: 6 },
    { name: 'Drake', seed: 11 },
    { name: 'Texas Tech', seed: 3 },
    { name: 'UNC Wilmington', seed: 14 },
    { name: 'Kansas', seed: 7 },
    { name: 'Arkansas', seed: 10 },
    { name: 'St. John\'s', seed: 2 },
    { name: 'Omaha', seed: 15 }
  ],
  'South': [
    { name: 'Auburn', seed: 1 },
    { name: 'Alabama St', seed: 16 },
    { name: 'Louisville', seed: 8 },
    { name: 'Creighton', seed: 9 },
    { name: 'Michigan', seed: 5 },
    { name: 'UC San Diego', seed: 12 },
    { name: 'Texas A&M', seed: 4 },
    { name: 'Yale', seed: 13 },
    { name: 'Ole Miss', seed: 6 },
    { name: 'San Diego St', seed: 11 },
    { name: 'Iowa St', seed: 3 },
    { name: 'Lipscomb', seed: 14 },
    { name: 'Marquette', seed: 7 },
    { name: 'New Mexico', seed: 10 },
    { name: 'Michigan St', seed: 2 },
    { name: 'Bryant', seed: 15 }
  ],
  'Midwest': [
    { name: 'Houston', seed: 1 },
    { name: 'SIU Edwardsville', seed: 16 },
    { name: 'Gonzaga', seed: 8 },
    { name: 'Georgia', seed: 9 },
    { name: 'Clemson', seed: 5 },
    { name: 'McNeese', seed: 12 },
    { name: 'Purdue', seed: 4 },
    { name: 'High Point', seed: 13 },
    { name: 'Illinois', seed: 6 },
    { name: 'Xavier/Texas', seed: 11 },
    { name: 'Kentucky', seed: 3 },
    { name: 'Troy', seed: 14 },
    { name: 'UCLA', seed: 7 },
    { name: 'Utah St', seed: 10 },
    { name: 'Tennessee', seed: 2 },
    { name: 'Wofford', seed: 15 }
  ]
};

const BLUE_BLOODS = new Set([
  'Duke', 'North Carolina', 'Kansas', 'Kentucky', 'UCLA', 'Indiana', 'Michigan St', 'Louisville'
]);

// ------------------------------
// Helper: Simulate a game (for the generator)
// ------------------------------
const playGame = (team1: Team, team2: Team, strategy: string, query: string): { winner: Team; loser: Team; confidence: number; upset: boolean } => {
  const seedDiff = team2.seed - team1.seed;
  const baseProb = 1 / (1 + Math.exp(-seedDiff / 2));
  let prob = baseProb;

  switch (strategy) {
    case 'chalk': prob = Math.min(0.95, baseProb + 0.15); break;
    case 'heavy_chalk': prob = Math.min(0.98, baseProb + 0.3); break;
    case 'upsets': prob = Math.max(0.05, baseProb - 0.15); break;
    case 'even_more_upsets': prob = Math.max(0.02, baseProb - 0.3); break;
    case 'balanced': break;
    case 'random': prob = 0.5; break;
    case 'cinderella':
      if (team1.seed >= 11 && team2.seed < 11) prob = Math.min(0.7, baseProb + 0.25);
      else if (team2.seed >= 11 && team1.seed < 11) prob = Math.max(0.3, baseProb - 0.25);
      break;
    case 'blue_bloods':
      if (BLUE_BLOODS.has(team1.name) && !BLUE_BLOODS.has(team2.name)) prob = Math.min(0.95, baseProb + 0.2);
      else if (!BLUE_BLOODS.has(team1.name) && BLUE_BLOODS.has(team2.name)) prob = Math.max(0.05, baseProb - 0.2);
      break;
    case 'top_heavy':
      if (team1.seed <= 4 && team2.seed > 4) prob = Math.min(0.95, baseProb + 0.2);
      else if (team2.seed <= 4 && team1.seed > 4) prob = Math.max(0.05, baseProb - 0.2);
      break;
    case 'underdog':
      if (team1.seed > team2.seed) prob = Math.min(0.7, baseProb + 0.15);
      else if (team2.seed > team1.seed) prob = Math.max(0.3, baseProb - 0.15);
      break;
    default: break;
  }

  const queryLower = query.toLowerCase();
  if (queryLower.includes(team1.name.toLowerCase())) prob = Math.min(0.95, prob + 0.2);
  if (queryLower.includes(team2.name.toLowerCase())) prob = Math.max(0.05, prob - 0.2);

  const rand = Math.random();
  const winner = rand < prob ? team1 : team2;
  const loser = winner === team1 ? team2 : team1;
  const upset = (winner.seed > loser.seed);
  const confidence = Math.round(100 * (winner === team1 ? prob : 1 - prob));

  return { winner, loser, confidence, upset };
};

// ------------------------------
// Main Component
// ------------------------------
const NCAABBracketPage: React.FC = () => {
  const { data, isLoading, error } = useBracket({ season: 2025 });
  const { data: teamsData, isLoading: teamsLoading } = useTeams({ per_page: 500 });

  // Build lookup map from team ID to team object (optional, may not be needed)
  const teamsById = useMemo(() => {
    if (!teamsData?.data) return {} as Record<string, ApiTeam>;
    return teamsData.data.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {} as Record<string, ApiTeam>);
  }, [teamsData]);

  // Seed map from the generator's team data (fallback if backend doesn't provide seeds)
  const seedMap = useMemo(() => {
    const map = new Map<string, number>();
    const regions = ['East', 'West', 'South', 'Midwest'];
    regions.forEach(reg => {
      TEAMS_BY_REGION[reg].forEach(t => {
        const lowerRaw = t.name.toLowerCase();
        map.set(lowerRaw, t.seed);
        map.set(lowerRaw.replace(/['.-]/g, ''), t.seed);
        const withoutSuffix = lowerRaw.replace(/\s+(state|st|university|college)$/i, '');
        if (withoutSuffix !== lowerRaw) map.set(withoutSuffix, t.seed);
        const firstWord = lowerRaw.split(/\s+/)[0];
        if (firstWord && firstWord !== lowerRaw) map.set(firstWord, t.seed);
      });
    });
    return map;
  }, []);

  // Helper to get seed from a team object (fallback)
  const getTeamSeed = (team: ApiTeam | undefined): number | undefined => {
    if (!team) return undefined;
    if (team.seed) return team.seed;
    // Try to match by name
    const full = team.full_name.toLowerCase();
    const name = team.name.toLowerCase();
    if (seedMap.has(full)) return seedMap.get(full);
    if (seedMap.has(name)) return seedMap.get(name);
    return undefined;
  };

  // ----- DIAGNOSTIC LOGS (optional) -----
  useEffect(() => {
    console.log('=== NCAABBracketPage Debug ===');
    console.log('Bracket API data:', data);
    console.log('Teams API data (first 5):', teamsData?.data?.slice(0, 5));
    console.log('Teams lookup map (sample):', Object.keys(teamsById).slice(0, 5).map(id => ({ id, team: teamsById[id] })));
  }, [data, teamsData, teamsById]);

  // ===== GENERATOR STATE =====
  const [genStrategy, setGenStrategy] = useState<string>('balanced');
  const [genQuery, setGenQuery] = useState('');
  const [ignoreExisting, setIgnoreExisting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBrackets, setGeneratedBrackets] = useState<GeneratedBracket[]>([]);
  const [currentBracketIndex, setCurrentBracketIndex] = useState(0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const generateBracket = useCallback(async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const newBracket: GeneratedBracket = {
      id: `bracket-${Date.now()}`,
      strategy: genStrategy,
      query: genQuery,
      games: [],
      finalFour: [],
      champion: {} as Team,
      timestamp: Date.now(),
    };

    const regions = ['East', 'West', 'South', 'Midwest'];
    const regionTeams: Record<string, Team[]> = {};
    regions.forEach(reg => {
      regionTeams[reg] = TEAMS_BY_REGION[reg].map(t => ({ ...t, region: reg }));
    });

    const allGames: BracketGame[] = [];

    regions.forEach(region => {
      let roundTeams = [...regionTeams[region]];
      for (let round = 1; round <= 4; round++) {
        const winners: Team[] = [];
        for (let i = 0; i < roundTeams.length; i += 2) {
          if (i + 1 < roundTeams.length) {
            const game = {
              round,
              region,
              gameNumber: allGames.length + 1,
              team1: roundTeams[i],
              team2: roundTeams[i + 1],
            };
            const { winner, loser, confidence, upset } = playGame(game.team1, game.team2, genStrategy, genQuery);
            allGames.push({ ...game, winner, loser, confidence, upset });
            winners.push(winner);
          } else {
            winners.push(roundTeams[i]);
          }
        }
        roundTeams = winners;
      }
      regionTeams[region] = roundTeams;
    });

    const finalFourTeams = [
      regionTeams['East'][0],
      regionTeams['West'][0],
      regionTeams['South'][0],
      regionTeams['Midwest'][0]
    ];
    newBracket.finalFour = finalFourTeams;

    const semi1 = { team1: finalFourTeams[0], team2: finalFourTeams[1] };
    const semi2 = { team1: finalFourTeams[2], team2: finalFourTeams[3] };
    const semiResult1 = playGame(semi1.team1, semi1.team2, genStrategy, genQuery);
    const semiResult2 = playGame(semi2.team1, semi2.team2, genStrategy, genQuery);
    allGames.push({
      round: 5,
      gameNumber: allGames.length + 1,
      team1: semi1.team1,
      team2: semi1.team2,
      winner: semiResult1.winner,
      loser: semiResult1.loser,
      confidence: semiResult1.confidence,
      upset: semiResult1.upset
    });
    allGames.push({
      round: 5,
      gameNumber: allGames.length + 1,
      team1: semi2.team1,
      team2: semi2.team2,
      winner: semiResult2.winner,
      loser: semiResult2.loser,
      confidence: semiResult2.confidence,
      upset: semiResult2.upset
    });

    const final = playGame(semiResult1.winner, semiResult2.winner, genStrategy, genQuery);
    allGames.push({
      round: 6,
      gameNumber: allGames.length + 1,
      team1: semiResult1.winner,
      team2: semiResult2.winner,
      winner: final.winner,
      loser: final.loser,
      confidence: final.confidence,
      upset: final.upset
    });

    newBracket.games = allGames;
    newBracket.champion = final.winner;

    setGeneratedBrackets(prev => [...prev, newBracket]);
    setCurrentBracketIndex(prev => prev + 1);
    setIsGenerating(false);
  }, [genStrategy, genQuery, ignoreExisting]);

  const handlePrevBracket = () => setCurrentBracketIndex(prev => prev - 1);
  const handleNextBracket = () => setCurrentBracketIndex(prev => prev + 1);
  const clearGenerated = () => {
    setGeneratedBrackets([]);
    setCurrentBracketIndex(0);
  };

  const currentBracket = generatedBrackets[currentBracketIndex - 1];

  // Heuristic to check if the data is for 2025 (based on team names)
  const isDataFor2025 = useMemo(() => {
    if (!data) return false;
    const games = Array.isArray(data) ? data : data.data || [];
    // Check for a team name that we know is in 2025
    return games.some((g: any) => {
      const team1Name = g.team1_name || '';
      const team2Name = g.team2_name || '';
      return team1Name.includes('Duke') || team2Name.includes('Duke') ||
             team1Name.includes('UConn') || team2Name.includes('UConn') ||
             team1Name.includes('Florida') || team2Name.includes('Florida') ||
             team1Name.includes('Houston') || team2Name.includes('Houston');
    });
  }, [data]);

  if (isLoading || teamsLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading bracket...</Typography>
      </Container>
    );
  }

  if (error) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {is404
            ? 'Bracket endpoint not available. Using mock generator only.'
            : `Error: ${error.message}`}
        </Alert>
      </Container>
    );
  }

  const bracketGames = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1504450751680-6c23e7a5c2e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: 'white'
      }}
    >
      <Typography variant="h4" gutterBottom>NCAA Tournament Bracket</Typography>

      {/* Generator Panel */}
      <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesomeIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6">Bracket Generator</Typography>
          <IconButton onClick={() => setShowGenerator(!showGenerator)} sx={{ ml: 'auto' }}>
            {showGenerator ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        {showGenerator && (
          <>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Strategy</InputLabel>
                  <Select
                    value={genStrategy}
                    label="Strategy"
                    onChange={(e) => setGenStrategy(e.target.value)}
                  >
                    <MenuItem value="chalk">Chalk (Favorites)</MenuItem>
                    <MenuItem value="heavy_chalk">Heavy Chalk</MenuItem>
                    <MenuItem value="upsets">Upset Heavy</MenuItem>
                    <MenuItem value="even_more_upsets">Even More Upsets</MenuItem>
                    <MenuItem value="balanced">Balanced</MenuItem>
                    <MenuItem value="random">Random</MenuItem>
                    <MenuItem value="cinderella">Cinderella (Boost 11+ seeds)</MenuItem>
                    <MenuItem value="blue_bloods">Blue Bloods</MenuItem>
                    <MenuItem value="top_heavy">Top Heavy (Boost top 4 seeds)</MenuItem>
                    <MenuItem value="underdog">Underdog</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Custom prompt (e.g., 'UConn wins')"
                  value={genQuery}
                  onChange={(e) => setGenQuery(e.target.value)}
                  placeholder="Influence picks"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Switch size="small" checked={ignoreExisting} onChange={(e) => setIgnoreExisting(e.target.checked)} />}
                  label="Ignore API"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={generateBracket}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </Grid>
            </Grid>

            {generatedBrackets.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={handlePrevBracket} disabled={currentBracketIndex <= 1}>
                    <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                  </IconButton>
                  <Typography variant="body2" sx={{ mx: 1 }}>
                    {currentBracketIndex} / {generatedBrackets.length}
                  </Typography>
                  <IconButton onClick={handleNextBracket} disabled={currentBracketIndex >= generatedBrackets.length}>
                    <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
                  </IconButton>
                  <Chip label={`Strategy: ${currentBracket?.strategy}`} size="small" sx={{ ml: 2 }} />
                  {currentBracket?.query && <Chip label={`Query: ${currentBracket.query}`} size="small" sx={{ ml: 1 }} />}
                </Box>
                <Button size="small" onClick={clearGenerated}>Clear</Button>
              </Box>
            )}

            {currentBracket && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Generated Bracket</Typography>
                    <Button size="small" onClick={() => setShowDetails(!showDetails)}>
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Final Four</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        {currentBracket.finalFour.map((team, i) => (
                          <Chip key={i} label={`${team.seed}. ${team.name}`} color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Champion</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <TrophyIcon sx={{ color: 'gold', mr: 1 }} />
                        <Typography variant="h6" color="success.main">
                          {currentBracket.champion.name} ({currentBracket.champion.seed})
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2">Summary</Typography>
                      <Typography variant="body2">
                        Total games: {currentBracket.games.length}<br />
                        Upsets: {currentBracket.games.filter(g => g.upset).length}<br />
                        Average confidence: {Math.round(currentBracket.games.reduce((acc, g) => acc + (g.confidence || 0), 0) / currentBracket.games.length)}%
                      </Typography>
                    </Grid>
                  </Grid>

                  {showDetails && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>Game Results by Round</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Round</TableCell>
                              <TableCell>Region</TableCell>
                              <TableCell>Matchup</TableCell>
                              <TableCell>Winner (Seed)</TableCell>
                              <TableCell align="right">Confidence</TableCell>
                              <TableCell align="center">Upset</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentBracket.games.map((game, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{game.round}</TableCell>
                                <TableCell>{game.region || 'National'}</TableCell>
                                <TableCell>
                                  {game.team1.seed}. {game.team1.name} vs {game.team2.seed}. {game.team2.name}
                                </TableCell>
                                <TableCell>
                                  {game.winner?.seed}. {game.winner?.name}
                                </TableCell>
                                <TableCell align="right">{game.confidence}%</TableCell>
                                <TableCell align="center">{game.upset ? '✅' : ''}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Paper>

      {/* Official bracket display from API */}
      {bracketGames.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 3, color: 'white' }}>Official Bracket (API)</Typography>
          {!isDataFor2025 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The data below appears to be from a different season. Seeds may not display correctly.
            </Alert>
          )}
          {bracketGames.map((game: any) => {
            // Primary source: use the game's own team_name and team_seed fields
            const team1Name = game.team1_name || 'TBD';
            const team2Name = game.team2_name || 'TBD';
            const team1Seed = game.team1_seed;
            const team2Seed = game.team2_seed;
            const winnerName = game.winner_name;

            return (
              <Paper key={game.game_id} sx={{ p: 2, mb: 2, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <Typography variant="subtitle1">
                  Round {game.round} {game.region && `- ${game.region}`}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>
                    {team1Seed ? `${team1Seed}. ` : ''}{team1Name}
                  </Typography>
                  <Typography>vs</Typography>
                  <Typography>
                    {team2Seed ? `${team2Seed}. ` : ''}{team2Name}
                  </Typography>
                </Box>
                {winnerName && (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    Winner: {winnerName}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </>
      )}

      {bracketGames.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No official bracket data available. Use the generator above to create your own!
        </Alert>
      )}
    </Container>
  );
};

export default NCAABBracketPage;
