import React from 'react';

const SecretPhraseScreenTest: React.FC = () => {
  console.log('🟢 TEST COMPONENT LOADED');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: 'red' }}>🛠️ SECRET PHRASE SCREEN TEST 🛠️</h1>
      <p>If you see this, the component is loading correctly.</p>
      <button onClick={() => alert('Test button clicked!')}>
        Test Button
      </button>
    </div>
  );
};

export default SecretPhraseScreenTest;
