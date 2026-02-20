// utils/scraper.ts
import * as cheerio from 'cheerio';

export const scrapeWithRetry = async (
  url: string, 
  retries: number = 3
): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000
      });
      
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.log(`Scrape attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to scrape ${url} after ${retries} attempts`);
};

export const extractNumbers = (text: string): number[] => {
  const matches = text.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
};

export const extractPercentages = (text: string): number[] => {
  const matches = text.match(/\d+(\.\d+)?%/g);
  return matches ? matches.map(m => parseFloat(m.replace('%', ''))) : [];
};
