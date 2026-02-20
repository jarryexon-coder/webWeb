// src/pages/Health.tsx
import React from 'react';

const Health = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1 style={{ color: '#10b981' }}>✅ Service Healthy</h1>
      <p>Server time: {new Date().toISOString()}</p>
      <p>Status: Operational</p>
    </div>
  );
};

export default Health;
