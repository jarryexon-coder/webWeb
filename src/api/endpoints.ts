// src/api/endpoints.ts
export const ENDPOINTS = {
  SPORTS_WIRE: {
    BASE: '/api/sports-wire',
    ENHANCED: '/api/sports-wire/enhanced'
  },
  BEAT_WRITERS: {
    LIST: '/api/beat-writers',
    NEWS: '/api/beat-writer-news'
  },
  INJURIES: {
    LIST: '/api/injuries',
    DASHBOARD: '/api/injuries/dashboard'
  },
  TEAMS: {
    NEWS: '/api/team/news'
  },
  SEARCH: {
    ALL_TEAMS: '/api/search/all-teams'
  }
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
