// Reusable parlay display component
interface ComboCardProps {
  parlay: Combo;
  onAddToBetSlip: (parlay: Combo) => void;
  onViewDetails: (parlay: Combo) => void;
}

export const ComboCard: React.FC<ComboCardProps> = ({ parlay, onAddToBetSlip, onViewDetails }) => {
  // Display parlay with all legs
  // Show total odds and confidence
  // Correlation indicator
  // Add to bet slip button
}
