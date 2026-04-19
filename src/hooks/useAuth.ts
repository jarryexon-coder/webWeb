// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

interface UserProfile {
  id: string;
  email: string;
  plan: string;
  subscription_id?: string;
  stripe_customer_id?: string;
  credits?: number;
  firstName?: string;
  lastName?: string;
}

const getPlanFeatures = (plan: string) => {
  const hierarchy = { free: 0, starter: 1, analytics: 2, generator: 3, influencer: 4 };
  const hasAccess = (minPlan: string) => (hierarchy[plan as keyof typeof hierarchy] || 0) >= (hierarchy[minPlan as keyof typeof hierarchy] || 0);
  return {
    hasPlayerStats: hasAccess('starter'),
    hasAdvancedAnalytics: hasAccess('analytics'),
    hasAIRecommendations: hasAccess('analytics'),
    hasLiveData: hasAccess('starter'),
    hasBettingInsights: hasAccess('analytics'),
    hasGeneratorCredits: hasAccess('generator'),
    unlimitedGenerations: plan === 'influencer',
  };
};

export const useAuth = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const fetchUserProfile = async (idToken: string) => {
    try {
      // ✅ Use full backend URL
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.id || data.email) {
        setProfile(data);
        localStorage.setItem('userPlan', data.plan || 'free');
      } else {
        console.error('Invalid profile data:', data);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Try to use cached plan
      const cachedPlan = localStorage.getItem('userPlan');
      if (cachedPlan && !profile) {
        setProfile({ id: '', email: '', plan: cachedPlan });
      } else {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        await fetchUserProfile(idToken);
      } else {
        setProfile(null);
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (token) await fetchUserProfile(token);
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      await fetchUserProfile(idToken);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      // Optionally call backend to store name
      await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName })
      });
      await fetchUserProfile(idToken);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('userPlan');
  };

  const planFeatures = profile ? getPlanFeatures(profile.plan) : getPlanFeatures('free');

  return {
    profile,
    planFeatures,
    loading,
    token,
    isAuthenticated: !!profile,
    login,
    logout,
    register,
    refreshProfile,
  };
};

export default useAuth;
