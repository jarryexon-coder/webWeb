declare module '../contexts/SearchContext' {
  export interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchHistory: string[];
    addToSearchHistory: (query: string) => void;
    clearSearchHistory: () => void;
  }
  
  export const useSearch: () => SearchContextType;
}
