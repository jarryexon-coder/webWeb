// Firebase Web SDK Stub - Prevents 'firebase' web library from loading in React Native
// This stops the IndexedDB and cookie errors immediately.
console.warn('[STUB] Firebase web SDK access blocked. Use @react-native-firebase/app instead.');

// Export stubs for Firebase web SDK exports (excluding analytics)
export const initializeApp = () => { 
  console.warn('Firebase.initializeApp() is disabled. Use the native SDK.'); 
  return { name: '[Firebase Stub]' };
};
export const isSupported = () => Promise.resolve(false);

// Export a default empty object (without getAnalytics)
export default { initializeApp, isSupported };
