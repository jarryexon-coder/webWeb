// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import PlanGuard from './PlanGuard';
import { SCREEN_REQUIREMENTS, PLAN_REQUIREMENTS } from '../config/planRequirements';

interface ProtectedRouteProps {
  children: React.ReactNode;
  screenName: string; // The name of the screen/component
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, screenName }) => {
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('ProtectedRoute: No token found');
          setUserPlan(null);
          setLoading(false);
          return;
        }

        console.log('ProtectedRoute: Fetching user profile...');
        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ProtectedRoute: Profile data:', data);
        console.log('ProtectedRoute: Plan from API:', data.plan);
        
        if (data.plan) {
          const plan = data.plan.toLowerCase();
          setUserPlan(plan);
          localStorage.setItem('userPlan', plan);
        } else {
          setUserPlan('free');
        }
      } catch (error) {
        console.error('ProtectedRoute: Error fetching user plan:', error);
        const cachedPlan = localStorage.getItem('userPlan');
        setUserPlan(cachedPlan || 'free');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if user is logged in
  if (!userPlan) {
    console.log('ProtectedRoute: No user plan, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get the required feature and then the actual plan
  const requiredFeature = SCREEN_REQUIREMENTS[screenName];
  const requiredPlan = requiredFeature ? PLAN_REQUIREMENTS[requiredFeature as keyof typeof PLAN_REQUIREMENTS] : 'free';
  
  console.log(`ProtectedRoute: Screen=${screenName}, Feature=${requiredFeature}, RequiredPlan=${requiredPlan}, UserPlan=${userPlan}`);

  // If no plan requirement, just show children
  if (!requiredPlan) {
    return <>{children}</>;
  }

  return (
    <PlanGuard requiredPlan={requiredPlan} currentPlan={userPlan}>
      {children}
    </PlanGuard>
  );
};

export default ProtectedRoute;
