// src/components/PlanGuard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';  // ← change from '../hooks/useAuth'

interface PlanGuardProps {
  requiredPlan?: 'starter' | 'analytics' | 'generator' | 'influencer' | string;
  requireGeneratorAccess?: boolean;
  currentPlanProp?: string;  // from parent (more reliable)
  creditsProp?: number;       // from parent
  children: React.ReactNode;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ 
  requiredPlan, 
  requireGeneratorAccess = false,
  currentPlanProp,
  creditsProp,
  children 
}) => {
  const navigate = useNavigate();
  const { profile, planFeatures } = useAuth();
  
  // Use props if provided (from ProtectedRoute), otherwise fallback to useAuth
  const currentPlan = (currentPlanProp || profile?.plan || 'free').toLowerCase();
  const credits = creditsProp !== undefined ? creditsProp : (profile?.credits ?? 0);
  const hasUnlimitedCredits = planFeatures?.hasGeneratorCredits;
  
  // Plan hierarchy: influencer is highest (full access)
  const planHierarchy: Record<string, number> = {
    'free': 0,
    'starter': 1,
    'analytics': 2,
    'generator': 3,
    'influencer': 4   // influencer has highest privileges
  };
  
  const userPlanLevel = planHierarchy[currentPlan] ?? 0;
  const requiredPlanLevel = requiredPlan ? (planHierarchy[requiredPlan.toLowerCase()] ?? 0) : 0;
  
  let hasAccess = true;
  let accessReason = '';
  
  // Check for influencer override: influencer automatically gets generator access
  const isInfluencer = currentPlan === 'influencer';
  
  if (requireGeneratorAccess) {
    // Generator access: influencer always has access, otherwise need generator plan OR unlimited credits OR positive credits
    const hasGeneratorPlan = userPlanLevel >= 3; // 'generator' level
    const hasCredits = credits > 0;
    hasAccess = isInfluencer || hasGeneratorPlan || hasUnlimitedCredits || hasCredits;
    accessReason = `isInfluencer=${isInfluencer}, hasGeneratorPlan=${hasGeneratorPlan}, hasUnlimitedCredits=${hasUnlimitedCredits}, hasCredits=${hasCredits}, credits=${credits}`;
  } else if (requiredPlan) {
    hasAccess = userPlanLevel >= requiredPlanLevel;
    accessReason = `plan level: ${userPlanLevel} >= ${requiredPlanLevel}`;
  }
  
  console.log('🔒 PlanGuard Debug:', {
    requiredPlan,
    currentPlan,
    requireGeneratorAccess,
    hasAccess,
    accessReason,
    userPlanLevel,
    hasUnlimitedCredits,
    credits,
    isInfluencer
  });
  
  if (!hasAccess) {
    const missingCredits = !hasUnlimitedCredits && credits === 0;
    const isGeneratorPlan = userPlanLevel >= 3;
    
    return (
      <Paper sx={{ p: 6, textAlign: 'center', m: 3 }}>
        <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>Premium Feature</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {requireGeneratorAccess && missingCredits && !isGeneratorPlan ? (
            <>
              This feature requires <strong>generator credits</strong> or the <strong>Generator plan</strong> (or higher).
              <br />
              Your current plan: <strong>{currentPlan}</strong>
              {currentPlan === 'analytics' && ' (includes credits)'}
            </>
          ) : requiredPlan ? (
            `This feature requires the ${requiredPlan} plan or higher.`
          ) : (
            'This feature requires an upgraded plan.'
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {missingCredits && currentPlan === 'analytics' && !isGeneratorPlan ? (
            'Your Analytics plan includes generator credits. Purchase more credits or upgrade to Generator plan for unlimited access.'
          ) : (
            `Your current plan: ${currentPlan}`
          )}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/subscription')} sx={{ mt: 2 }}>
          Upgrade Now
        </Button>
      </Paper>
    );
  }
  
  return <>{children}</>;
};

export default PlanGuard;
