// src/utils/analytics.ts
export const logScreenView = (screenName: string) => {
  console.log(`Screen viewed: ${screenName}`);
  // Add your analytics implementation here (Google Analytics, Mixpanel, etc.)
  // Example:
  // if (typeof window !== 'undefined' && (window as any).gtag) {
  //   (window as any).gtag('event', 'screen_view', {
  //     screen_name: screenName,
  //   });
  // }
};

export const logEvent = (eventName: string, eventParams?: any) => {
  console.log(`Event: ${eventName}`, eventParams);
  // Add your analytics implementation here
};
