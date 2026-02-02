declare global {
  interface CategoryColors {
    'High Confidence': string;
    'Value Bet': string;
    'Lock Pick': string;
    'High Upside': string;
    'AI Generated': string;
    [key: string]: string; // Index signature
  }

  interface SportColors {
    NBA: string;
    NFL: string;
    NHL: string;
    MLB: string;
    [key: string]: string; // Index signature
  }

  interface StoryCategoryColors {
    'analytics': string;
    'injuries': string;
    'trades': string;
    'rosters': string;
    'draft': string;
    'free-agency': string;
    'advanced-stats': string;
    'beat-writers': string;
    [key: string]: string; // Index signature
  }
}

export {};
