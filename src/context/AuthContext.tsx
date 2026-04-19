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
  getIdToken,
} from 'firebase/auth';
import { auth } from '../firebase';

// ------------------------------------------------------------
// Types (match backend response)
// ------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  plan: string;
  subscription_id?: string | null;
  subscription_status?: string;
  credits: number;
  lifetimeSpent?: number;
  memberSince?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  isInfluencerEligible?: boolean;
}

export interface PlanFeatures {
  hasPlayerStats: boolean;
  hasAdvancedAnalytics: boolean;
  hasAIRecommendations: boolean;
  hasLiveData: boolean;
  hasBettingInsights: boolean;
  hasGeneratorCredits: boolean;
  unlimitedGenerations: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
  planFeatures: PlanFeatures;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getFirebaseToken: () => Promise<string | null>;
}

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

const getPlanFeatures = (plan: string): PlanFeatures => {
  const hierarchy: Record<string, number> = {
    free: 0,
    starter: 1,
    analytics: 2,
    generator: 3,
    influencer: 4,
  };
  const level = hierarchy[plan?.toLowerCase()] ?? 0;
  return {
    hasPlayerStats: level >= 1,
    hasAdvancedAnalytics: level >= 2,
    hasAIRecommendations: level >= 2,
    hasLiveData: level >= 1,
    hasBettingInsights: level >= 2,
    hasGeneratorCredits: level >= 3,
    unlimitedGenerations: plan === 'influencer',
  };
};

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------
// Provider Component
// ------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------
  // Fetch user profile from backend using Firebase token
  // ------------------------------------------------------------
  const fetchUserProfile = async (idToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        // Try to parse error JSON, but fallback to text
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // Map backend fields to our UserProfile interface
      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        plan: data.plan || 'free',
        subscription_id: data.subscription_id,
        subscription_status: data.subscription_status,
        credits: data.credits ?? 0,
        lifetimeSpent: data.lifetimeSpent,
        memberSince: data.memberSince,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        isInfluencerEligible: data.isInfluencerEligible || false,
      };
      setProfile(userProfile);
      localStorage.setItem('userPlan', userProfile.plan);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback to cached plan or minimal profile
      const cachedPlan = localStorage.getItem('userPlan');
      if (cachedPlan && !profile) {
        setProfile({
          id: user?.uid || '',
          email: user?.email || '',
          plan: cachedPlan,
          credits: 0,
        });
      } else if (!profile) {
        setProfile({
          id: user?.uid || '',
          email: user?.email || '',
          plan: 'free',
          credits: 0,
        });
      }
    }
  };

  // ------------------------------------------------------------
  // Refresh profile manually (e.g., after subscription update)
  // ------------------------------------------------------------
  const refreshProfile = async () => {
    if (token) {
      await fetchUserProfile(token);
    } else if (user) {
      const idToken = await getIdToken(user);
      setToken(idToken);
      await fetchUserProfile(idToken);
    }
  };

  // ------------------------------------------------------------
  // Get Firebase token (used by components)
  // ------------------------------------------------------------
  const getFirebaseToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const idToken = await getIdToken(user);
      setToken(idToken);
      localStorage.setItem('authToken', idToken);
      return idToken;
    } catch (err) {
      console.error('Error getting Firebase token:', err);
      return null;
    }
  };

  // ------------------------------------------------------------
  // Listen to auth state changes (Firebase)
  // ------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await getIdToken(firebaseUser);
          setToken(idToken);
          localStorage.setItem('authToken', idToken);
          await fetchUserProfile(idToken);
        } catch (err) {
          console.error('Error during auth state change:', err);
          setProfile(null);
        }
      } else {
        setToken(null);
        setProfile(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userPlan');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ------------------------------------------------------------
  // Helper to clear errors
  // ------------------------------------------------------------
  const clearError = () => setError(null);

  // ------------------------------------------------------------
  // Email/Password Sign Up
  // ------------------------------------------------------------
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName });
        const idToken = await getIdToken(firebaseUser);
        setToken(idToken);
        localStorage.setItem('authToken', idToken);
        await fetchUserProfile(idToken);
      }
      console.log('✅ User signed up successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    }
  };

  // ------------------------------------------------------------
  // Email/Password Sign In
  // ------------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await getIdToken(firebaseUser);
      setToken(idToken);
      localStorage.setItem('authToken', idToken);
      await fetchUserProfile(idToken);
      console.log('✅ User signed in successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  // ------------------------------------------------------------
  // Google Sign In
  // ------------------------------------------------------------
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await getIdToken(firebaseUser);
      setToken(idToken);
      localStorage.setItem('authToken', idToken);
      await fetchUserProfile(idToken);
      console.log('✅ Google sign in successful');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  // ------------------------------------------------------------
  // Sign Out
  // ------------------------------------------------------------
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setToken(null);
      setProfile(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userPlan');
      console.log('✅ User logged out');
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
      throw err;
    }
  };

  // ------------------------------------------------------------
  // Password Reset
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // Derived plan features based on profile plan
  // ------------------------------------------------------------
  const planFeatures = profile ? getPlanFeatures(profile.plan) : getPlanFeatures('free');

  // ------------------------------------------------------------
  // Context value
  // ------------------------------------------------------------
  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    profile,
    planFeatures,
    refreshProfile,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    clearError,
    getFirebaseToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ------------------------------------------------------------
// Hook to use the auth context
// ------------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
