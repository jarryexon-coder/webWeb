// src/utils/dataHelpers.js
export const normalizeApiResponse = (response) => {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) return response;
  
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

// Use in your components
import { normalizeApiResponse } from '../utils/dataHelpers';

// In useEffect or data processing
const dataArray = normalizeApiResponse(apiResponse);
