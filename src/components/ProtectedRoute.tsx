// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import PlanGuard from './PlanGuard';
import { SCREEN_REQUIREMENTS, PLAN_REQUIREMENTS } from '../config/planRequirements';

const GENERATOR_ACCESS_SCREENS = new Set([
  'KalshiPredictions',
  'SameGameParlay',
  'ParlayArchitect',
]);

interface ProtectedRouteProps {
  children: React.ReactNode;
  screenName: string;
  requiredFeature?: string;  // ← NEW: optional override
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, screenName, requiredFeature: propRequiredFeature }) => {
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUserPlan(null);
          setLoading(false);
          return;
        }

        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('ProtectedRoute: Profile data:', data);
        
        const plan = data.plan ? data.plan.toLowerCase() : 'free';
        setUserPlan(plan);
        setCredits(data.credits ?? 0);
        localStorage.setItem('userPlan', plan);
      } catch (error) {
        console.error('ProtectedRoute: Error fetching user plan:', error);
        const cachedPlan = localStorage.getItem('userPlan');
        setUserPlan(cachedPlan || 'free');
        setCredits(0);
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

  if (!userPlan) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use propRequiredFeature if provided, otherwise use screen mapping
  const requiredFeature = propRequiredFeature || SCREEN_REQUIREMENTS[screenName];
  let requiredPlan = requiredFeature ? PLAN_REQUIREMENTS[requiredFeature as keyof typeof PLAN_REQUIREMENTS] : 'free';
  const needsGeneratorAccess = GENERATOR_ACCESS_SCREENS.has(screenName);
  
  console.log(`ProtectedRoute: Screen=${screenName}, RequiredFeature=${requiredFeature}, RequiredPlan=${requiredPlan}, UserPlan=${userPlan}, Credits=${credits}, NeedsGeneratorAccess=${needsGeneratorAccess}`);

  if (!requiredPlan && !needsGeneratorAccess) {
    return <>{children}</>;
  }

  if (needsGeneratorAccess) {
    return (
      <PlanGuard 
        requireGeneratorAccess={true}
        currentPlanProp={userPlan}
        creditsProp={credits}
      >
        {children}
      </PlanGuard>
    );
  }

  return (
    <PlanGuard requiredPlan={requiredPlan} currentPlanProp={userPlan} creditsProp={credits}>
      {children}
    </PlanGuard>
  );
};

export default ProtectedRoute;
