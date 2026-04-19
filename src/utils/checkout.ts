import { useAuth } from '../contexts/AuthContext';

const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

export const useCheckout = () => {
  const { token } = useAuth();  // ✅ use the existing token

  const handleSubscriptionCheckout = async (planId: string, interval: string = 'month') => {
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Failed to create checkout session');
    } catch (error) {
      console.error('Subscription checkout error:', error);
      throw error;
    }
  };

  const handleCreditsCheckout = async (credits: number) => {
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/generator/credits/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Failed to create checkout session');
    } catch (error) {
      console.error('Credits checkout error:', error);
      throw error;
    }
  };

  return { handleSubscriptionCheckout, handleCreditsCheckout };
};
