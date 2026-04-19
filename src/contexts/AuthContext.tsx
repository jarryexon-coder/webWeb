// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getPlanFeatures, PlanFeatures, PlanType, hasAccessToFeature } from '../utils/subscription';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  plan: PlanType;
  subscription_status: string;
  subscription_id?: string;
  credits: number;
  current_period_end?: string;
  memberSince: string;
  winRate: number;
  lifetimeSpent: number;
  isInfluencerEligible?: boolean;   // NEW
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  planFeatures: PlanFeatures;
  hasFeature: (requiredPlan: PlanType) => boolean;
  isInfluencer: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures>(getPlanFeatures('free'));

  const isInfluencer = user?.plan === 'influencer';

  const hasFeature = useCallback((requiredPlan: PlanType): boolean => {
    if (isInfluencer) return true;
    const userPlan = user?.plan || 'free';
    return hasAccessToFeature(userPlan, requiredPlan);
  }, [user, isInfluencer]);

  const fetchProfile = async (idToken: string) => {
    if (!idToken) return null;
    try {
      const url = `${import.meta.env.VITE_API_BASE_PYTHON}/api/user/profile`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      } else {
        console.error('Profile fetch failed:', res.status);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user?.plan) {
      setPlanFeatures(getPlanFeatures(user.plan));
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        localStorage.setItem('authToken', idToken);
        await fetchProfile(idToken);
        setLoading(false);
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);
      setToken(idToken);
      localStorage.setItem('authToken', idToken);
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
    } catch (error) {
      console.error('Sign up failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, planFeatures, hasFeature, isInfluencer, login, signUp, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
