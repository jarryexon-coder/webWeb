// src/hooks/useBeatWriters.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BeatWriter, NewsArticle } from '../types/sports-wire.types';
import { BeatWritersResponse, BeatWriterNewsResponse } from '../types/api.types';

export const useBeatWriters = (sport: string, team?: string) => {
  const [writers, setWriters] = useState<BeatWriter[]>([]);
  const [nationalInsiders, setNationalInsiders] = useState<BeatWriter[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBeatWriters = async () => {
      try {
        setLoading(true);
        
        // Fetch beat writers list
        const writersData = await apiClient.getBeatWriters(sport, team);
        if (writersData.success) {
          if (team) {
            setWriters(writersData.beat_writers || []);
          } else {
            // Flatten all team writers
            const allWriters: BeatWriter[] = [];
            Object.values(writersData.beat_writers || {}).forEach((teamWriters: any) => {
              allWriters.push(...teamWriters);
            });
            setWriters(allWriters);
          }
          setNationalInsiders(writersData.national_insiders || []);
        }

        // Fetch beat writer news
        const newsData = await apiClient.getBeatWriterNews(sport, team);
        if (newsData.success) {
          setNews(newsData.news || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch beat writers');
      } finally {
        setLoading(false);
      }
    };

    fetchBeatWriters();
  }, [sport, team]);

  return { writers, nationalInsiders, news, loading, error };
};
