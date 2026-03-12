import Fuse from 'fuse.js';

interface IntentPattern {
  phrase: string;
  intent: string;
}

const intentPatterns: IntentPattern[] = [
  { phrase: 'value props', intent: 'value' },
  { phrase: 'best props', intent: 'top' },
  { phrase: 'top props', intent: 'top' },
  { phrase: 'elite props', intent: 'top' },
  { phrase: 'tonight', intent: 'tonight' },
  { phrase: 'today', intent: 'tonight' },
  { phrase: 'slate', intent: 'slate' },
  { phrase: 'games', intent: 'slate' },
  { phrase: 'over', intent: 'over' },
  { phrase: 'under', intent: 'under' },
  { phrase: 'player props', intent: 'player' },
  { phrase: 'team props', intent: 'team' },
];

const fuse = new Fuse(intentPatterns, {
  keys: ['phrase'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 3,
});

const STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'with']);

export function parseQuery(query: string): { intents: string[]; player?: string } {
  const results = fuse.search(query);
  const matchedIntents = [...new Set(results.map(r => r.item.intent))];

  const words = query.split(/\s+/);
  const potentialPlayer = words.find(word => {
    const lower = word.toLowerCase();
    return /^[A-Z][a-z]+$/.test(word) && !STOP_WORDS.has(lower);
  });

  return {
    intents: matchedIntents,
    player: potentialPlayer,
  };
}
