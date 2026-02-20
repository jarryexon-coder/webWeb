export const dateUtils = {
  getCurrentSeason: (): string => {
    return '2025-26';
  },

  getAsOfDate: (): string => {
    return 'February 11, 2026';
  },

  formatGameDate: (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  isPlayoffPush: (): boolean => {
    const now = new Date();
    const feb2026 = new Date('2026-02-11');
    return now >= feb2026 && now <= new Date('2026-04-15');
  },

  isAllStarWeekend: (): boolean => {
    const now = new Date();
    const asgDate = new Date('2026-02-15');
    const diff = Math.abs(now.getTime() - asgDate.getTime());
    const daysDiff = diff / (1000 * 3600 * 24);
    return daysDiff <= 7; // Within 7 days of All-Star
  },

  daysUntilEvent: (eventDate: string): number => {
    const event = new Date(eventDate);
    const now = new Date();
    const diff = event.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }
};
