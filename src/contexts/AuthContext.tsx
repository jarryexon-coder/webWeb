import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

// Rich user profile interface from backend
interface UserProfile {
  displayName: string;
  email: string;
  memberSince: string;
  plan: string;
  credits: number;
  winRate: number;
  lifetimeSpent: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
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

  // Fetch full user profile from backend using the current token
  const fetchProfile = async (idToken: string) => {
    console.log('🔄 fetchProfile called with token:', idToken.substring(0, 20) + '...');
    if (!idToken) return null;
    try {
      const url = `${import.meta.env.VITE_API_BASE_PYTHON}/api/user/profile`;
      console.log('🌐 Fetching profile from:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      console.log('📡 Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Profile data:', data);
        setUser(data);
        return data;
      } else {
        console.error('Profile fetch failed:', res.status, await res.text());
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  };

  // Main auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 onAuthStateChanged, user:', firebaseUser?.email);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true);
        console.log('✅ Token obtained:', idToken.substring(0, 20) + '...');
        setToken(idToken);
        localStorage.setItem('authToken', idToken);
        await fetchProfile(idToken);
        setLoading(false);
      } else {
        console.log('❌ No user, clearing state');
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Test listener to confirm Firebase is initialized (runs once on mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 onAuthStateChanged test:', user?.email);
    });
    return unsubscribe;
  }, []);

  // Fetch profile whenever token changes (ensures profile is up‑to‑date)
  useEffect(() => {
    if (token) {
      fetchProfile(token);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);
      localStorage.setItem('authToken', idToken);
      // Profile will be fetched by the onAuthStateChanged listener
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
      throw error;
    }
  };

  // Sign up function integrated from file 1
  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName });
      // The onAuthStateChanged listener will automatically set the token and fetch profile
      // No need to manually set token here, the listener will handle it
    } catch (error) {
      console.error('Sign up failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    // State will be cleared by onAuthStateChanged
  };

  const refreshProfile = async () => {
    if (!token) return;
    await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, logout, refreshProfile }}>
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
