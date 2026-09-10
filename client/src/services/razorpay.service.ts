import { apiClient } from './api';
import { useSubscriptionStore, SUBSCRIPTION_PLANS } from '../stores/useSubscriptionStore';
import { useAuthStore } from '../stores/useAuthStore';
import { SubscriptionPlanOption } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  amount: number; // in paise (minimum 100 paise)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  themeColor?: string;
}

export interface RazorpayCheckoutResult {
  success: boolean;
  order_id?: string;
  payment_id?: string;
  signature?: string;
  error?: string;
  data?: any;
}

export class RazorpayService {
  /**
   * Dynamically loads Razorpay Standard Checkout script if not already present
   */
  public static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Generic Razorpay Standard Web Checkout
   * 1. Calls POST /api/create-order
   * 2. Opens Razorpay modal with order_id
   * 3. On success, calls POST /api/verify-payment with razorpay_payment_id, razorpay_order_id, razorpay_signature
   */
  public static async openStandardCheckout(
    options: RazorpayCheckoutOptions
  ): Promise<RazorpayCheckoutResult> {
    const isScriptLoaded = await this.loadRazorpayScript();
    if (!isScriptLoaded) {
      return {
        success: false,
        error: 'Unable to load Razorpay checkout script. Please check your internet connection.',
      };
    }

    try {
      // Step 1: Create Order via Backend API
      const orderRes = await apiClient.post('/create-order', {
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
      });

      const orderData = orderRes.data?.data || orderRes.data || {};
      const orderId = orderData.order_id || orderData.orderId || orderData.id;
      const keyId =
        orderData.key_id ||
        orderData.keyId ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_live_TaDSoq9X70XrEX';

      if (!orderId) {
        return {
          success: false,
          error: 'Backend failed to return a valid Razorpay order ID.',
        };
      }

      // Step 2: Open Razorpay Checkout Modal
      return new Promise<RazorpayCheckoutResult>((resolve) => {
        const rzpOptions = {
          key: keyId,
          amount: options.amount,
          currency: options.currency || 'INR',
          name: options.name || 'SpeakWise AI',
          description: options.description || 'SpeakWise Standard Checkout',
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // Step 3: Verify Payment Signature via Backend
              const verifyRes = await apiClient.post('/verify-payment', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.data?.success) {
                resolve({
                  success: true,
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  data: verifyRes.data?.data,
                });
              } else {
                resolve({
                  success: false,
                  error: verifyRes.data?.error || 'Payment signature verification failed.',
                });
              }
            } catch (err: any) {
              const errMsg =
                err.response?.data?.error ||
                err.message ||
                'Error communicating with payment verification server.';
              resolve({
                success: false,
                error: errMsg,
              });
            }
          },
          prefill: {
            name: options.prefill?.name || '',
            email: options.prefill?.email || '',
            contact: options.prefill?.contact || '',
          },
          theme: {
            color: options.themeColor || '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              resolve({
                success: false,
                error: 'Payment cancelled by user.',
              });
            },
          },
        };

        const rzp = new window.Razorpay(rzpOptions);

        rzp.on('payment.failed', function (response: any) {
          const failReason =
            response.error?.description ||
            response.error?.reason ||
            'Payment transaction failed.';
          resolve({
            success: false,
            error: failReason,
          });
        });

        rzp.open();
      });
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Unable to initialize payment order with server.';
      return {
        success: false,
        error: errMsg,
      };
    }
  }

  /**
   * Process Pro Subscription Recharge with Plan Upgrade
   */
  public static async processSubscriptionPayment(
    plan: SubscriptionPlanOption = SUBSCRIPTION_PLANS[0]
  ): Promise<RazorpayCheckoutResult> {
    const isScriptLoaded = await this.loadRazorpayScript();
    const user = useAuthStore.getState().user;
    const amountInPaise = plan.priceInr * 100;

    if (!isScriptLoaded) {
      return {
        success: false,
        error: 'Unable to load Razorpay SDK. Please check your network connection.',
      };
    }

    try {
      // 1. Create order on backend
      const orderRes = await apiClient.post('/create-order', {
        planId: plan.id,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${plan.id.toLowerCase()}_${Date.now().toString().slice(-8)}`,
      });

      const orderData = orderRes.data?.data || orderRes.data || {};
      const orderId = orderData.order_id || orderData.orderId || orderData.id;
      const activeKey =
        orderData.key_id ||
        orderData.keyId ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_live_TaDSoq9X70XrEX';

      if (!orderId) {
        return {
          success: false,
          error: 'Failed to obtain an order ID from the payment server.',
        };
      }

      return new Promise<RazorpayCheckoutResult>((resolve) => {
        const options = {
          key: activeKey,
          amount: amountInPaise,
          currency: 'INR',
          name: 'SpeakWise AI',
          description: `SpeakWise Pro — ${plan.name} (${plan.validityText})`,
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // 2. Verify signature & record in database
              const currentExpiresAt = useSubscriptionStore.getState().planExpiresAt;
              const verifyRes = await apiClient.post('/verify-payment', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
                userEmail: user?.email,
                userName: user?.fullName,
                paymentMethod: 'RAZORPAY_CHECKOUT',
                currentExpiresAt,
              });

              if (verifyRes.data?.success) {
                const expiresAt = verifyRes.data?.data?.expiresAt;
                useSubscriptionStore.getState().upgradeToPro(plan.id, plan.durationHours, expiresAt);
                if (user) {
                  useAuthStore.getState().updateUser({
                    role: 'PRO_USER',
                    subscriptionPlan: plan.id,
                    subscriptionExpiresAt: expiresAt,
                  });
                }
                resolve({
                  success: true,
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  data: verifyRes.data?.data,
                });
              } else {
                resolve({
                  success: false,
                  error: verifyRes.data?.error || 'Payment signature verification failed.',
                });
              }
            } catch (err: any) {
              const errMsg =
                err.response?.data?.error ||
                err.message ||
                'Payment verification failed on the server.';
              resolve({
                success: false,
                error: errMsg,
              });
            }
          },
          prefill: {
            name: user?.fullName || '',
            email: user?.email || '',
            contact: '',
          },
          theme: {
            color: '#4f46e5',
          },
          modal: {
            ondismiss: function () {
              resolve({
                success: false,
                error: 'Payment was cancelled by user.',
              });
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', function (response: any) {
          const failReason =
            response.error?.description ||
            response.error?.reason ||
            'Payment attempt failed.';
          resolve({
            success: false,
            error: failReason,
          });
        });

        rzp.open();
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error ||
        error.message ||
        'Unable to initialize order with server.';
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
