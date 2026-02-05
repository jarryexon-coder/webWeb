import { Chip as MuiChip } from '@mui/material';
import React from 'react';

interface FixedChipProps {
  size?: 'small' | 'medium';
  [key: string]: any;
}

const FixedChip: React.FC<FixedChipProps> = ({ size = 'small', ...props }) => {
  return <MuiChip size={size} {...props} />;
};

export default FixedChip;
