// components/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { getApiPerformance, debugApiState } from '../hooks/useUnifiedAPI';

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(getApiPerformance());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      setMetrics(getApiPerformance());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>API Performance</strong>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{ marginLeft: '10px', fontSize: '10px' }}
        >
          {showDetails ? '▲' : '▼'}
        </button>
      </div>
      
      <div style={{ marginTop: '5px' }}>
        <div>Avg Response: {metrics.averageResponseTime.toFixed(0)}ms</div>
        <div>Total Requests: {metrics.totalRequests}</div>
        <div>Cache Size: {metrics.cacheSize}</div>
      </div>
      
      {showDetails && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px' }}>
          <button 
            onClick={debugApiState}
            style={{ fontSize: '10px', marginRight: '5px' }}
          >
            Debug State
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ fontSize: '10px' }}
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
};

// Add to your main App.tsx
// import { PerformanceDashboard } from './components/PerformanceDashboard';
// In App.tsx: {import.meta.env.DEV && <PerformanceDashboard />}
