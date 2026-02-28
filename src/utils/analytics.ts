// src/utils/analytics.ts

export const logScreenView = (screenName: string) => {
  console.log(`Screen viewed: ${screenName}`);
  // Add your analytics implementation here (Google Analytics, Mixpanel, etc.)
};

export const logEvent = (eventName: string, eventParams?: any) => {
  console.log(`Event: ${eventName}`, eventParams);
  // Add your analytics implementation here
};

/**
 * Log performance of prompt generation
 * @param query - The user input query
 * @param resultCount - Number of results generated
 * @param avgConfidence - Average confidence of results (0-100)
 * @param source - Source of the generation (secret, fallback, api, generator)
 */
export const logPromptPerformance = (
  query: string,
  resultCount: number,
  avgConfidence: number,
  source: 'secret' | 'fallback' | 'api' | 'generator'
) => {
  console.log('[Analytics]', {
    query,
    resultCount,
    avgConfidence,
    source,
    timestamp: new Date().toISOString(),
  });
  // Optionally send to your analytics service
};
