// src/components/GlobalErrorBoundary.jsx
import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔥 GLOBAL REACT ERROR:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Log to backend if available
    if (window.fetch) {
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ReactError',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // Silently fail
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1>⚠️ Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
            Check browser console for details
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
