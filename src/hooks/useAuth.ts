// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in (mock)
    const checkAuth = async () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Mock user data - replace with actual auth check
        const mockUser = localStorage.getItem('user');
        if (mockUser) {
          setUser(JSON.parse(mockUser));
          setIsAuthenticated(true);
        }
        setLoading(false);
      }, 500);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock login - replace with actual API
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email,
        isPremium: true
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // Mock registration - replace with actual API
      const mockUser: User = {
        id: '1',
        name,
        email,
        isPremium: false
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    isPremium: user?.isPremium || false,
  };
};

export default useAuth;
