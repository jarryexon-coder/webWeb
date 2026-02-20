import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { withTheme } from '@mui/material/styles';

interface Props {
  children: ReactNode;
  theme?: any; // WithTheme will inject theme
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h3" color="error" gutterBottom>
              ⚠️ Something went wrong
            </Typography>
            <Typography variant="body1" paragraph>
              We're sorry for the inconvenience. Please try refreshing the page.
            </Typography>
            {this.state.error && (
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="error">
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" component="pre" sx={{ mt: 1, overflow: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default withTheme(ErrorBoundary);
