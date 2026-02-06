// src/hooks/useOddsAPI.ts - DEBUG VERSION
import { useState, useEffect, useCallback, useRef } from 'react';

let totalCalls = 0;
const callLog: Array<{timestamp: number, component: string}> = [];

export const useOddsAPI = (options: any = {}, componentName = 'Unknown') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const renderCountRef = useRef(0);
  
  // Track renders
  renderCountRef.current++;
  
  console.log(`🔄 [${componentName}] Render #${renderCountRef.current}`, {
    options,
    isMounted: isMountedRef.current,
    isFetching: isFetchingRef.current
  });

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log(`⏳ [${componentName}] Already fetching, skipping`);
      return;
    }
    
    isFetchingRef.current = true;
    totalCalls++;
    callLog.push({timestamp: Date.now(), component: componentName});
    
    console.log(`📡 [${componentName}] API Call #${totalCalls}`, {
      totalCalls,
      callLogLength: callLog.length,
      time: new Date().toISOString()
    });
    
    // Log excessive calls
    if (totalCalls > 10) {
      console.warn(`🚨 EXCESSIVE CALLS DETECTED: ${totalCalls} calls from ${componentName}`);
      console.warn('Last 10 calls:', callLog.slice(-10));
    }
    
    try {
      const response = await fetch(
        'https://pleasing-determination-production.up.railway.app/api/parlay/suggestions'
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
      }
      
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
      console.error(`❌ [${componentName}] Error:`, err.message);
    } finally {
      isFetchingRef.current = false;
    }
  }, [componentName]);

  useEffect(() => {
    // Only fetch once on mount
    console.log(`🎯 [${componentName}] useEffect mounted`);
    fetchData();
    
    return () => {
      console.log(`🧹 [${componentName}] useEffect cleanup`);
      isMountedRef.current = false;
    };
  }, [fetchData]); // Empty dependency array - fetch only once

  return { data, loading, error, refetch: fetchData };
};

// Add this to track component usage
export const logComponentUsage = () => {
  console.group('📊 Component Usage Report');
  console.log(`Total API calls: ${totalCalls}`);
  console.log('Component call distribution:');
  const distribution: Record<string, number> = {};
  callLog.forEach(log => {
    distribution[log.component] = (distribution[log.component] || 0) + 1;
  });
  console.table(distribution);
  console.groupEnd();
};
