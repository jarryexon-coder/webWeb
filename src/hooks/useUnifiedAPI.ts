
export const getApiPerformance = () => {
  return {
    averageResponseTime: performanceTracker.getAverageDuration(),
    successRate: performanceTracker.getSuccessRate(),
    totalRequests: performanceTracker.metrics.length,
    cacheSize: apiCache.size
  };
};
