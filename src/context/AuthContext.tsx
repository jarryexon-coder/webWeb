// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken, // ✅ Add this import
} from 'firebase/auth';
import { auth } from '../firebase';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  token: string | null; // ✅ Add token to context
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getFirebaseToken: () => Promise<string | null>; // ✅ Add method to get token
}

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------
// Provider Component
// ------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // ✅ Add token state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get and set Firebase token
  const getFirebaseToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const firebaseToken = await getIdToken(user);
      setToken(firebaseToken);
      
      // ✅ Also store in localStorage for debugging/backward compatibility
      localStorage.setItem('authToken', firebaseToken);
      
      return firebaseToken;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Get token when user logs in
        const firebaseToken = await getIdToken(user);
        setToken(firebaseToken);
        localStorage.setItem('authToken', firebaseToken); // Store for backward compatibility
        console.log('✅ Firebase token stored');
      } else {
        setToken(null);
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Helper to clear errors
  const clearError = () => setError(null);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        
        // Get token after signup
        const firebaseToken = await getIdToken(userCredential.user);
        setToken(firebaseToken);
        localStorage.setItem('authToken', firebaseToken);
      }
      
      console.log('✅ User signed up successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    }
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get token after signin
      const firebaseToken = await getIdToken(userCredential.user);
      setToken(firebaseToken);
      localStorage.setItem('authToken', firebaseToken);
      
      console.log('✅ User signed in successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get token after Google signin
      const firebaseToken = await getIdToken(result.user);
      setToken(firebaseToken);
      localStorage.setItem('authToken', firebaseToken);
      
      console.log('✅ Google sign in successful');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setToken(null);
      localStorage.removeItem('authToken');
      console.log('✅ User logged out');
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
      throw err;
    }
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
      throw err;
    }
  };

  const value = {
    user,
    token, // ✅ Now exposed in context
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    clearError,
    getFirebaseToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
