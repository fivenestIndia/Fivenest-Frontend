import { supabase } from './supabaseClient';

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const getApiBaseUrl = (): string => {
  const DEFAULT_API_URL = 'https://fivenest-backend.onrender.com';
  return (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) 
    ? import.meta.env.VITE_API_URL 
    : DEFAULT_API_URL;
};

export interface InitiateRazorpayParams {
  amount: number;
  currentUser: { email: string; name: string; balance: number; id?: string };
  onSuccess: (newBalance: number, paymentId: string) => void;
  onError: (errorMsg: string) => void;
  onDismiss?: () => void;
}

export const initiateRazorpayRecharge = async ({
  amount,
  currentUser,
  onSuccess,
  onError,
  onDismiss
}: InitiateRazorpayParams) => {
  if (!currentUser) {
    onError("Please sign in first.");
    return;
  }

  if (!amount || amount <= 0 || isNaN(amount)) {
    onError("Please enter a valid amount (minimum ₹1).");
    return;
  }

  if (amount > 50000) {
    onError("Maximum wallet recharge limit is ₹50,000/-.");
    return;
  }

  try {
    let targetUserId = (currentUser as any).id;
    let targetEmail = currentUser.email || '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        targetUserId = user.id;
        targetEmail = user.email || targetEmail;
      }
    } catch (e) {
      console.warn("Could not retrieve Supabase user session for payment, using local identity", e);
    }

    if (!targetUserId) {
      targetUserId = targetEmail || `user_${Date.now()}`;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded && !(window as any).Razorpay) {
      onError("Failed to load payment gateway. Please check your internet connection.");
      return;
    }

    const API_BASE_URL = getApiBaseUrl();

    // 1. Create order on backend
    const response = await fetch(`${API_BASE_URL}/api/payment/create-studio-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, userId: targetUserId, email: targetEmail })
    });

    const resText = await response.text();
    let orderData: any = {};
    try {
      orderData = resText ? JSON.parse(resText) : {};
    } catch (e) {
      throw new Error(`Payment server error (${response.status}). Please try again.`);
    }

    if (!response.ok || orderData.error) {
      throw new Error(orderData.error || 'Failed to create payment order');
    }

    const { orderId, currency, keyId } = orderData;
    const options = {
      key: keyId || 'rzp_test_placeholder',
      amount: amount * 100,
      currency: currency || 'INR',
      name: 'FiveNest Studio',
      description: `Recharge ₹${amount} INR credits`,
      order_id: orderId,
      handler: async (paymentResponse: any) => {
        try {
          const currentBal = currentUser?.balance ? Number(currentUser.balance) : 0;
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify-studio-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              userId: targetUserId,
              amount,
              currentBalance: currentBal
            })
          });

          const vText = await verifyRes.text();
          let verifyData: any = {};
          try {
            verifyData = vText ? JSON.parse(vText) : {};
          } catch (e) {}

          if (!verifyRes.ok || verifyData.error) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }

          const targetBalance = typeof verifyData.newBalance === 'number' 
            ? verifyData.newBalance 
            : Math.round((currentBal + amount) * 100) / 100;

          // Record transaction in Supabase
          try {
            await supabase.from('credit_transactions').insert({
              user_id: targetUserId,
              amount,
              transaction_type: 'topup',
              description: `Razorpay Online Recharge: ₹${amount} (Txn: ${paymentResponse.razorpay_payment_id})`
            });
          } catch (e) {}

          // Upsert wallet in Supabase
          try {
            await supabase.from('wallet').upsert({ user_id: targetUserId, balance: targetBalance }, { onConflict: 'user_id' });
          } catch (e) {}

          const updatedUser = { ...currentUser, id: targetUserId, balance: targetBalance };
          try {
            localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
          } catch (e) {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: updatedUser }));
          }

          onSuccess(targetBalance, paymentResponse.razorpay_payment_id);
        } catch (err: any) {
          console.error("Payment verification error:", err);
          onError(err.message || 'Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: currentUser.name || 'Designer',
        email: currentUser.email || ''
      },
      theme: { color: '#E4572E' },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (resp: any) => {
      onError(`Payment failed: ${resp.error?.description || 'Transaction was unsuccessful.'}`);
    });
    rzp.open();
  } catch (err: any) {
    onError(err.message || 'Could not initiate Razorpay payment.');
  }
};
