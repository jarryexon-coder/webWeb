// src/hooks/useTheme.ts
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export const useCustomTheme = () => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return {
    theme,
    isMobile,
    isTablet,
    isDesktop,
    colors: theme.palette,
    spacing: theme.spacing,
  };
};

export default useCustomTheme;
