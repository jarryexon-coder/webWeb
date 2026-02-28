// src/utils/relevanceScorer.ts
import { SecretPhrase } from '../pages/SecretPhrasesScreen';
import { QueryIntent } from './queryProcessor';

export interface ScoredPhrase extends SecretPhrase {
  relevanceScore: number;
}

export function rankPhrasesByRelevance(
  phrases: SecretPhrase[],
  intent: QueryIntent
): ScoredPhrase[] {
  return phrases
    .map(phrase => {
      let score = 0;

      // Exact sport match (strong weight)
      if (intent.sport && phrase.sport === intent.sport) score += 10;

      // Player match
      if (intent.player && phrase.player?.toLowerCase().includes(intent.player)) score += 8;

      // Team match
      if (intent.team && phrase.team?.toLowerCase().includes(intent.team)) score += 7;

      // Category match (if intent keywords map to category)
      const categoryMatch = phrase.category?.toLowerCase()
        .includes(intent.keywords.join(' ') || '');
      if (categoryMatch) score += 5;

      // Tag matches
      if (phrase.tags) {
        const tagMatches = phrase.tags.filter(tag =>
          intent.keywords.some(k => tag.toLowerCase().includes(k))
        ).length;
        score += tagMatches * 3;
      }

      // Confidence bonus
      score += phrase.confidence / 10;  // e.g., 85% adds 8.5

      return { ...phrase, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
