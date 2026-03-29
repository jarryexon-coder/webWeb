// src/components/PlanGuard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

interface PlanGuardProps {
  requiredPlan: 'starter' | 'analytics' | 'generator' | string;
  currentPlan?: string;
  children: React.ReactNode;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ 
  requiredPlan, 
  currentPlan, 
  children 
}) => {
  const navigate = useNavigate();
  
  // Plan hierarchy - FIXED to include analytics
  const planHierarchy: Record<string, number> = {
    'free': 0,
    'starter': 1,
    'analytics': 2,
    'generator': 3
  };
  
  const userPlanLevel = planHierarchy[currentPlan?.toLowerCase() || 'free'] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan?.toLowerCase() || 'free'] || 0;
  
  console.log('🔒 PlanGuard Debug:', {
    requiredPlan,
    currentPlan,
    userPlanLevel,
    requiredPlanLevel,
    hasAccess: userPlanLevel >= requiredPlanLevel
  });
  
  const hasAccess = userPlanLevel >= requiredPlanLevel;
  
  if (!hasAccess) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', m: 3 }}>
        <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Premium Feature
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This feature requires the {requiredPlan} plan or higher.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your current plan: {currentPlan || 'free'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/subscription')}
          sx={{ mt: 2 }}
        >
          Upgrade Now
        </Button>
      </Paper>
    );
  }
  
  return <>{children}</>;
};

export default PlanGuard;
