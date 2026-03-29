import { loadStripe } from '@stripe/stripe-js';

// Load your Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('❌ Stripe publishable key is missing! Check your .env file');
}

// Create and export the Stripe promise
export const stripePromise = loadStripe(stripePublishableKey);
