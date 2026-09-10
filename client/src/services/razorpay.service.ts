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

export interface PrefetchedOrder {
  planId: string;
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
}

export class RazorpayService {
  private static prefetchedOrders: Map<string, { order: PrefetchedOrder; timestamp: number }> = new Map();
  private static inFlightOrderPromises: Map<string, Promise<PrefetchedOrder | null>> = new Map();

  /**
   * Detects if the current user agent is inside an in-app browser WebView
   * (e.g. Instagram, Facebook, LinkedIn, Twitter, TikTok, WhatsApp)
   * where mobile OS blocks UPI intent redirects (upi://, phonepe://, etc.).
   */
  public static isMobileWebView(): boolean {
    if (typeof window === 'undefined' || !window.navigator) return false;
    const ua = window.navigator.userAgent || window.navigator.vendor || '';
    return /FBAN|FBAV|Instagram|LinkedInApp|Twitter|musical_ly|BytedanceWebview|Snapchat|WhatsApp/i.test(ua);
  }

  /**
   * Synchronously checks whether the Razorpay SDK is already available in the global window object.
   */
  public static isRazorpayLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.Razorpay === 'function';
  }

  /**
   * Dynamically loads Razorpay Standard Checkout script if not already present.
   * Returns immediately if already available.
   */
  public static loadRazorpayScript(): Promise<boolean> {
    if (this.isRazorpayLoaded()) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
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

  public static lastPrefetchError: string | null = null;

  /**
   * Pre-fetches order details in the background so that rzp.open() can be called
   * IMMEDIATELY and SYNCHRONOUSLY within the user's click gesture on mobile browsers.
   */
  public static async prefetchSubscriptionOrder(
    plan: SubscriptionPlanOption = SUBSCRIPTION_PLANS[0]
  ): Promise<PrefetchedOrder | null> {
    const cached = this.getCachedOrder(plan.id);
    if (cached) return cached;

    if (this.inFlightOrderPromises.has(plan.id)) {
      return this.inFlightOrderPromises.get(plan.id)!;
    }

    const promise = (async () => {
      try {
        RazorpayService.lastPrefetchError = null;
        const amountInPaise = plan.priceInr * 100;
        const payload = {
          planId: plan.id,
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${plan.id.toLowerCase()}_${Date.now().toString().slice(-8)}`,
        };

        let orderRes: any;
        try {
          orderRes = await apiClient.post('/create-order', payload);
        } catch (firstErr: any) {
          console.warn('[RAZORPAY PREFETCH] /create-order failed, trying /subscription/create-order', firstErr?.message);
          try {
            orderRes = await apiClient.post('/subscription/create-order', payload);
          } catch (secondErr: any) {
            throw firstErr;
          }
        }

        const orderData = orderRes.data?.data || orderRes.data || {};
        const orderId = orderData.order_id || orderData.orderId || orderData.id;
        const activeKey =
          orderData.key_id ||
          orderData.keyId ||
          (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
          'rzp_live_TaDSoq9X70XrEX';

        if (!orderId) {
          RazorpayService.lastPrefetchError = orderRes.data?.error || 'No order ID returned by server';
          return null;
        }

        const prefetched: PrefetchedOrder = {
          planId: plan.id,
          orderId,
          keyId: activeKey,
          amount: amountInPaise,
          currency: 'INR',
        };

        this.prefetchedOrders.set(plan.id, {
          order: prefetched,
          timestamp: Date.now(),
        });
        return prefetched;
      } catch (e: any) {
        const errorMsg =
          e.response?.data?.error ||
          e.response?.data?.message ||
          e.message ||
          'Failed to communicate with payment backend';
        console.error(`[RAZORPAY PREFETCH ERROR] Plan: ${plan.id}`, errorMsg, e);
        RazorpayService.lastPrefetchError = errorMsg;
        return null;
      } finally {
        this.inFlightOrderPromises.delete(plan.id);
      }
    })();

    this.inFlightOrderPromises.set(plan.id, promise);
    return promise;
  }

  /**
   * Retrieves a cached order if it is still valid (less than 10 minutes old).
   */
  public static getCachedOrder(planId: string): PrefetchedOrder | null {
    const entry = this.prefetchedOrders.get(planId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > 10 * 60 * 1000) {
      this.prefetchedOrders.delete(planId);
      return null;
    }
    return entry.order;
  }

  public static clearCachedOrder(planId: string): void {
    this.prefetchedOrders.delete(planId);
  }

  /**
   * Core Razorpay launcher: creates options and calls rzp.open().
   * When invoked synchronously inside the user's tap event, this ensures
   * mobile Safari and Chrome preserve User Activation and allow checkout/UPI redirects.
   */
  private static launchCheckoutInstance(
    order: PrefetchedOrder,
    plan: SubscriptionPlanOption,
    resolve: (result: RazorpayCheckoutResult) => void
  ): void {
    const user = useAuthStore.getState().user;

    const rzpOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'SpeakWise AI',
      description: `SpeakWise Pro — ${plan.name} (${plan.validityText})`,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      order_id: order.orderId,
      handler: async function (response: any) {
        try {
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
            RazorpayService.clearCachedOrder(plan.id);
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
        backdrop_color: 'rgba(15, 23, 42, 0.75)',
      },
      modal: {
        confirm_close: true,
        backdropclose: false,
        escape: false,
        handleback: true,
        ondismiss: function () {
          // Clear consumed order and prefetch fresh one
          RazorpayService.clearCachedOrder(plan.id);
          RazorpayService.prefetchSubscriptionOrder(plan);
          resolve({
            success: false,
            error: 'Payment was cancelled by user.',
          });
        },
      },
      retry: {
        enabled: true,
        max_count: 3,
      },
      send_sms_hash: true,
    };

    const rzp = new window.Razorpay(rzpOptions);

    rzp.on('payment.failed', function (response: any) {
      RazorpayService.clearCachedOrder(plan.id);
      RazorpayService.prefetchSubscriptionOrder(plan);
      const failReason =
        response.error?.description ||
        response.error?.reason ||
        'Payment attempt failed.';
      resolve({
        success: false,
        error: failReason,
      });
    });

    // OPEN SYNCHRONOUSLY IN USER GESTURE
    rzp.open();
  }

  /**
   * Process Pro Subscription Recharge with Plan Upgrade.
   * If pre-fetched order is already ready (normal case on mobile), this calls rzp.open()
   * SYNCHRONOUSLY with ZERO async delay before .open().
   */
  public static processSubscriptionPayment(
    plan: SubscriptionPlanOption = SUBSCRIPTION_PLANS[0]
  ): Promise<RazorpayCheckoutResult> {
    // 1. FAST SYNCHRONOUS PATH (order pre-fetched and SDK loaded)
    const cachedOrder = this.getCachedOrder(plan.id);
    if (cachedOrder && this.isRazorpayLoaded()) {
      return new Promise<RazorpayCheckoutResult>((resolve) => {
        this.launchCheckoutInstance(cachedOrder, plan, resolve);
      });
    }

    // 2. ASYNC FALLBACK (if user taps before prefetch finishes or on cold start)
    return (async () => {
      const isScriptLoaded = await this.loadRazorpayScript();
      if (!isScriptLoaded) {
        return {
          success: false,
          error: 'Unable to load Razorpay SDK. Please check your network connection.',
        };
      }

      let order = this.getCachedOrder(plan.id);
      if (!order) {
        order = await this.prefetchSubscriptionOrder(plan);
      }

      if (!order) {
        return {
          success: false,
          error:
            this.lastPrefetchError
              ? `Payment server error: ${this.lastPrefetchError}`
              : 'Failed to obtain an order ID from the payment server. Please check your network connection.',
        };
      }

      return new Promise<RazorpayCheckoutResult>((resolve) => {
        this.launchCheckoutInstance(order!, plan, resolve);
      });
    })();
  }

  /**
   * Generic Razorpay Standard Web Checkout
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
            backdrop_color: 'rgba(15, 23, 42, 0.75)',
          },
          modal: {
            confirm_close: true,
            backdropclose: false,
            escape: false,
            handleback: true,
            ondismiss: function () {
              resolve({
                success: false,
                error: 'Payment cancelled by user.',
              });
            },
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
          send_sms_hash: true,
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
}
