// Reusable parlay display component
interface ParlayCardProps {
  parlay: Parlay;
  onAddToBetSlip: (parlay: Parlay) => void;
  onViewDetails: (parlay: Parlay) => void;
}

export const ParlayCard: React.FC<ParlayCardProps> = ({ parlay, onAddToBetSlip, onViewDetails }) => {
  // Display parlay with all legs
  // Show total odds and confidence
  // Correlation indicator
  // Add to bet slip button
}
