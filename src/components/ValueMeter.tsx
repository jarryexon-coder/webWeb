// Visual representation of bet value
interface ValueMeterProps {
  valueScore: number;
  confidence: number;
  edge: number;
}

export const ValueMeter: React.FC<ValueMeterProps> = ({ valueScore, confidence, edge }) => {
  // Animated gauge showing value score
  // Color-coded confidence level
  // Edge percentage display
}
