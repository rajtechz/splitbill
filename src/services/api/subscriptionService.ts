import { apiClient } from './client';
import { User } from '../../types';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: 'annual' | 'monthly';
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export interface VerifyPaymentPayload {
  orderId: string;
  paymentId: string;
  signature: string;
  plan: 'annual' | 'monthly';
}

export interface SubscriptionStatusResponse {
  isPro: boolean;
  tier: 'free' | 'pro';
  expiresAt?: string;
  features: string[];
}

export const subscriptionService = {
  /**
   * Create an official Razorpay Order for Pro subscription
   */
  async createRazorpayOrder(plan: 'annual' | 'monthly' = 'annual'): Promise<RazorpayOrderResponse> {
    const res = await apiClient.post('/subscriptions/razorpay/create-order', { plan });
    return res.data?.data;
  },

  /**
   * Cryptographically verify payment signature and activate Pro in backend MongoDB
   */
  async verifyRazorpayPayment(payload: VerifyPaymentPayload): Promise<{ success: boolean; message: string; user: User }> {
    const res = await apiClient.post('/subscriptions/razorpay/verify-payment', payload);
    return res.data?.data;
  },

  /**
   * Cancel Pro subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string; user: User }> {
    const res = await apiClient.post('/subscriptions/cancel');
    return res.data?.data;
  },

  /**
   * Fetch current subscription status
   */
  async getStatus(): Promise<SubscriptionStatusResponse> {
    const res = await apiClient.get('/subscriptions/status');
    return res.data?.data;
  },
};

