// src/firebase/config.ts - UPDATED VERSION
// Remove static imports at top, use dynamic imports inside functions

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: any = null;
let auth: any = null;
let firestore: any = null;

export const getFirebaseApp = async () => {
  if (!app) {
    const { initializeApp } = await import('firebase/app');
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getAuth = async () => {
  if (!auth) {
    const { getAuth } = await import('firebase/auth');
    auth = getAuth(await getFirebaseApp());
  }
  return auth;
};

export const getFirestore = async () => {
  if (!firestore) {
    const { getFirestore } = await import('firebase/firestore');
    firestore = getFirestore(await getFirebaseApp());
  }
  return firestore;
};

// Optional: Only import what you need
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const authInstance = await getAuth();
  return signInWithEmailAndPassword(authInstance, email, password);
};
