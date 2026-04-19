// src/components/PlanFeaturesDisplay.tsx
import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Lock } from '@mui/icons-material';
import { PlanType, getPlanFeatures } from '../utils/subscription';

interface PlanFeaturesDisplayProps {
  currentPlan: PlanType;
  compact?: boolean;
}

export const PlanFeaturesDisplay: React.FC<PlanFeaturesDisplayProps> = ({ currentPlan, compact = false }) => {
  const features = getPlanFeatures(currentPlan);
  
  const featureList = [
    { name: 'Tournament Schedules & Results', enabled: features.hasTournamentAccess, plan: 'starter' },
    { name: 'Player Stats & Rankings', enabled: features.hasPlayerStats, plan: 'starter' },
    { name: 'Advanced Analytics', enabled: features.hasAdvancedAnalytics, plan: 'analytics' },
    { name: 'AI-Powered Recommendations', enabled: features.hasAIRecommendations, plan: 'analytics' },
    { name: 'Live Data & Real-time Updates', enabled: features.hasLiveData, plan: 'analytics' },
    { name: 'Advantage Insights & Advantage Analysis', enabled: features.hasBettingInsights, plan: 'analytics' },
    { name: 'AI Pick Generator', enabled: features.hasGeneratorCredits, plan: 'generator' },
    { name: 'Unlimited Generations', enabled: features.unlimitedGenerations, plan: 'generator' },
  ];

  // Filter to only show enabled features for compact view
  const displayedFeatures = compact 
    ? featureList.filter(f => f.enabled)
    : featureList;

  if (compact) {
    return (
      <Box>
        {displayedFeatures.map((feature) => (
          <Box key={feature.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
            <Typography variant="caption" color="text.secondary">
              {feature.name}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Your Plan Includes:
      </Typography>
      {featureList.map((feature) => (
        <Box key={feature.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {feature.enabled ? (
            <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
          ) : (
            <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
          )}
          <Typography variant="body2" color={feature.enabled ? 'text.primary' : 'text.secondary'}>
            {feature.name}
          </Typography>
          {!feature.enabled && (
            <Chip 
              label={`${feature.plan.charAt(0).toUpperCase() + feature.plan.slice(1)}+`} 
              size="small" 
              variant="outlined"
              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default PlanFeaturesDisplay;
