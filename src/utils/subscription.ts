// src/utils/subscription.ts

export type PlanType = 'free' | 'starter' | 'analytics' | 'generator';

export interface PlanFeatures {
  hasTournamentAccess: boolean;      // Starter+
  hasPlayerStats: boolean;           // Starter+
  hasAdvancedAnalytics: boolean;     // Analytics+
  hasAIRecommendations: boolean;     // Analytics+
  hasGeneratorCredits: boolean;      // Generator only
  unlimitedGenerations: boolean;     // Generator only
  hasLiveData: boolean;              // Analytics+
  hasBettingInsights: boolean;       // Analytics+
  maxPredictionsPerDay: number;      // Daily prediction limits
}

// Plan hierarchy (higher plans include all lower plan features)
const PLAN_HIERARCHY: PlanType[] = ['free', 'starter', 'analytics', 'generator'];

export const getPlanFeatures = (plan: PlanType): PlanFeatures => {
  const planIndex = PLAN_HIERARCHY.indexOf(plan);
  const hasStarter = planIndex >= PLAN_HIERARCHY.indexOf('starter');
  const hasAnalytics = planIndex >= PLAN_HIERARCHY.indexOf('analytics');
  const hasGenerator = planIndex >= PLAN_HIERARCHY.indexOf('generator');

  return {
    // Starter features (base tier)
    hasTournamentAccess: hasStarter,
    hasPlayerStats: hasStarter,
    
    // Analytics features (includes all Starter features)
    hasAdvancedAnalytics: hasAnalytics,
    hasAIRecommendations: hasAnalytics,
    hasLiveData: hasAnalytics,
    hasBettingInsights: hasAnalytics,
    
    // Generator features (includes all Analytics + Starter features)
    hasGeneratorCredits: hasGenerator,
    unlimitedGenerations: hasGenerator,
    
    // Limits based on plan
    maxPredictionsPerDay: 
      plan === 'free' ? 3 :
      plan === 'starter' ? 10 :
      plan === 'analytics' ? 50 :
      100, // generator unlimited (practically)
  };
};

export const hasAccessToFeature = (userPlan: PlanType, requiredPlan: PlanType): boolean => {
  const userPlanIndex = PLAN_HIERARCHY.indexOf(userPlan);
  const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  return userPlanIndex >= requiredPlanIndex;
};
