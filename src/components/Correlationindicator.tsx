// Show correlation between parlay legs
interface CorrelationIndicatorProps {
  score: number;
  legs: any[];
}

export const CorrelationIndicator: React.FC<CorrelationIndicatorProps> = ({ score, legs }) => {
  // Visual indicator of correlation strength
  // Warning for negative correlation
  // Explanation tooltip
}
