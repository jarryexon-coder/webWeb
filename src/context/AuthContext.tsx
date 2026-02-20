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
} from 'firebase/auth';
import { auth } from '../firebase'; // You'll need to create this file

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    }
  };

  // Email/Password Sign In
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
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
      await signInWithPopup(auth, provider);
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
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    clearError,
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
