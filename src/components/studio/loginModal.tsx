import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Coins, LogOut, Eye, EyeOff, Loader2, ArrowLeft, Award } from 'lucide-react';
import { supabase, fetchUserWallet, supabaseUrl, supabaseAnonKey } from '../../lib/supabaseClient';

const SUPABASE_CONFIGURED = !!supabaseUrl && !!supabaseAnonKey;
const MAX_RECHARGE_LIMIT = 50000;

interface LoginModalProps {
  onClose: () => void;
  onLoginStateChange: (user: { email: string; name: string; balance: number; id?: string } | null) => void;
  currentUser: { email: string; name: string; balance: number; id?: string } | null;
  onOpenSubscription?: () => void;
}

type Tab = 'login' | 'register' | 'wallet' | 'forgot';

// Map common Supabase auth error messages to friendly ones.
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials'))
    return 'Incorrect email or password. Please try again.';
  if (m.includes('email not confirmed') || m.includes('confirm') || m.includes('verify'))
    return 'Email confirmation is not required. You can sign in directly with your email and password.';
  if (m.includes('user already registered') || m.includes('already been registered') || m.includes('already registered'))
    return 'This email is already registered. Please click "Sign In" instead.';
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return 'Password must be at least 6 characters long.';
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('too many') || m.includes('over_email_send_rate_limit'))
    return 'Authentication rate limit reached. Please click "Instant Access" below to proceed directly.';
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('fetch failed'))
    return 'Connection to authentication server was blocked by your browser or network. Click below to continue in Instant Mode.';
  // Return raw message for everything else — helps diagnose config issues
  return msg;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginStateChange, currentUser, onOpenSubscription }) => {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);
  const [customInputVal, setCustomInputVal] = useState<string>('50');
  const [isPaying, setIsPaying] = useState(false);

  // Switch to wallet tab if already logged in
  useEffect(() => {
    if (currentUser) {
      setActiveTab('wallet');
    } else {
      setActiveTab('login');
    }
  }, [currentUser]);

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsNetworkError(false);
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setGoogleLoading(true);
    try {
      const returnUrl = window.location.origin + window.location.pathname;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: returnUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('provider is not enabled') || msg.includes('disabled') || msg.includes('unsupported provider')) {
          setErrorMessage('Google Sign-In is not yet enabled in your Supabase project (Authentication → Providers → Google). You can still sign in directly with Email & Password below.');
        } else {
          setErrorMessage(friendlyError(error.message));
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(friendlyError(err.message || 'Google sign-in could not be initiated.'));
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {

        const errorMsg = (error.message || '').toLowerCase();

        // If email not confirmed, show proper message
        if (errorMsg.includes('email not confirmed') || errorMsg.includes('not confirmed') || errorMsg.includes('confirm')) {
          setErrorMessage('Please confirm your email address before signing in. Check your inbox for the verification link.');
          return;
        }

        if (
          errorMsg.includes('fetch') ||
          errorMsg.includes('network') ||
          errorMsg.includes('load failed') ||
          errorMsg.includes('failed to fetch')
        ) {
          setErrorMessage('Network error. Please check your internet connection and try again.');
          return;
        }
        setErrorMessage(friendlyError(error.message));
        return;
      }

      if (data?.user) {
        let details = { name: 'User', balance: 0 };
        try {
          details = await fetchUserWallet(data.user.id);
        } catch (e) {}

        const finalBalance = (typeof details.balance === 'number' && details.balance > 0) 
          ? details.balance 
          : 0;

        const loggedInUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: details.name || data.user.user_metadata?.name || cleanEmail.split('@')[0],
          balance: finalBalance
        };
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: loggedInUser }));
        setSuccessMessage(`✅ Signed in successfully as ${loggedInUser.name}! Welcome back.`);
        setTimeout(() => {
          clearMessages();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(friendlyError(err.message || 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      // 1. Attempt Supabase Sign Up
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: cleanName }
        }
      });

      // Handle Supabase error directly
      if (error) {
        const errorMsg = (error.message || '').toLowerCase();
        
        // If already registered, try signing in with the provided password!
        if (errorMsg.includes('already registered') || errorMsg.includes('already been registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (!signInError && signInData?.user) {
            let details = { name: cleanName, balance: 0 };
            try {
              details = await fetchUserWallet(signInData.user.id);
            } catch (e) {}

            const loggedInUser = {
              id: signInData.user.id,
              email: signInData.user.email || cleanEmail,
              name: details.name || cleanName,
              balance: details.balance || 0
            };
            localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
            onLoginStateChange(loggedInUser);
            window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: loggedInUser }));
            setSuccessMessage(`✅ Account found! Signed in as ${loggedInUser.name}.`);
            setTimeout(() => {
              clearMessages();
              onClose();
            }, 800);
            return;
          } else {
            setErrorMessage('This email is already registered. Please switch to "Sign In" to enter your password.');
            setActiveTab('login');
            return;
          }
        }

        // If rate limit or network error, show proper error
        if (
          errorMsg.includes('rate limit') ||
          errorMsg.includes('too many') ||
          errorMsg.includes('fetch') ||
          errorMsg.includes('network') ||
          errorMsg.includes('load failed')
        ) {
          setErrorMessage('Unable to create account right now. Please check your connection and try again.');
          return;
        }

        setErrorMessage(friendlyError(error.message));
        return;
      }

      // 2. Check if user already existed (Supabase anti-enumeration returns identities: [])
      if (data?.user?.identities && data.user.identities.length === 0) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (!signInError && signInData?.user) {
          let details = { name: cleanName, balance: 0 };
          try {
            details = await fetchUserWallet(signInData.user.id);
          } catch (e) {}

          const loggedInUser = {
            id: signInData.user.id,
            email: signInData.user.email || cleanEmail,
            name: details.name || cleanName,
            balance: details.balance || 0
          };
          localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
          onLoginStateChange(loggedInUser);
          window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: loggedInUser }));
          setSuccessMessage(`✅ Account found! Signed in as ${loggedInUser.name}.`);
          setTimeout(() => {
            clearMessages();
            onClose();
          }, 800);
          return;
        } else {
          setErrorMessage('This email is already registered. Please switch to "Sign In" to enter your password.');
          setActiveTab('login');
          return;
        }
      }

      // 3. User created successfully! Log in immediately without email confirmation delay
      if (data?.user) {
        let userId = data.user.id;

        // Try getting active session via password if not returned in signUp
        if (!data.session) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password
            });
            if (signInData?.user) userId = signInData.user.id;
          } catch (e) {}
        }

        let balance = 100; // Starting welcome bonus
        try {
          const details = await fetchUserWallet(userId);
          if (typeof details.balance === 'number' && details.balance > 0) {
            balance = details.balance;
          }
        } catch (e) {}

        const loggedInUser = {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          balance: balance
        };
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: loggedInUser }));
        setSuccessMessage(`✅ Account created successfully! Welcome to FiveNest, ${cleanName}!`);
        setTimeout(() => {
          clearMessages();
          onClose();
        }, 900);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMessage(friendlyError(err.message || 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/studio`
      });

      if (error) {
        setErrorMessage(friendlyError(error.message));
        return;
      }

      setSuccessMessage('Password reset link sent! Check your email inbox and spam folder.');
    } catch (err: any) {
      setErrorMessage(friendlyError(err.message || 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'demo' | 'empty') => {
    clearMessages();
    const demoEmail = type === 'demo' ? 'demo@fivenest.in' : 'newuser@fivenest.in';
    const demoName = type === 'demo' ? 'Demo Designer' : 'New Client';
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'demo_access_2024';

    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: { data: { name: demoName } }
        });
        if (signUpError) {
          const localUser = {
            email: demoEmail,
            name: demoName,
            balance: type === 'demo' ? 100 : 0
          };
          localStorage.setItem('fivenest_active_user', JSON.stringify(localUser));
          onLoginStateChange(localUser);
          setSuccessMessage(`Signed in as ${localUser.name}!`);
          setTimeout(() => { clearMessages(); onClose(); }, 1000);
          return;
        }
        data = signUpData;
      }

      if (data?.user) {
        const details = await fetchUserWallet(data.user.id);
        if (type === 'demo' && details.balance < 10) {
          try {
            await supabase.from('credit_transactions').insert({
              user_id: data.user.id,
              amount: 100,
              transaction_type: 'topup',
              description: 'Sandbox Demo Starting Credit'
            });
          } catch (e) {}
        }
        const finalDetails = await fetchUserWallet(data.user.id);
        const loggedInUser = {
          email: data.user.email || demoEmail,
          name: finalDetails.name || demoName,
          balance: finalDetails.balance || (type === 'demo' ? 100 : 0)
        };
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        setSuccessMessage(`Signed in as ${loggedInUser.name}!`);
        setTimeout(() => {
          clearMessages();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      const localUser = {
        email: demoEmail,
        name: demoName,
        balance: type === 'demo' ? 100 : 0
      };
      localStorage.setItem('fivenest_active_user', JSON.stringify(localUser));
      onLoginStateChange(localUser);
      setSuccessMessage(`Signed in as ${localUser.name}!`);
      setTimeout(() => { clearMessages(); onClose(); }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    }

    try {
      localStorage.removeItem('fivenest_active_user');
      // Clear Supabase session tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    onLoginStateChange(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: null }));
    }
    onClose();
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayRecharge = async () => {
    if (!currentUser) return;
    clearMessages();

    if (!rechargeAmount || rechargeAmount <= 0 || isNaN(rechargeAmount)) {
      setErrorMessage('Please enter a valid recharge amount (min. ₹1).');
      return;
    }
    if (rechargeAmount > MAX_RECHARGE_LIMIT) {
      setErrorMessage(`Recharge amount exceeds the maximum limit of ₹${MAX_RECHARGE_LIMIT.toLocaleString('en-IN')}/-. Please enter an amount up to ₹50,000.`);
      return;
    }

    setIsPaying(true);
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
        targetUserId = targetEmail;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded && !(window as any).Razorpay) {
        setErrorMessage('Failed to load payment gateway. Check your internet connection.');
        setIsPaying(false);
        return;
      }
      const DEFAULT_API_URL = 'https://fivenest-backend.onrender.com';
      const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) 
        ? import.meta.env.VITE_API_URL 
        : DEFAULT_API_URL;

      const response = await fetch(`${API_BASE_URL}/api/payment/create-studio-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: rechargeAmount, userId: targetUserId, email: targetEmail })
      });

      const resText = await response.text();
      let orderData: any = {};
      try {
        orderData = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error(`Payment server error (${response.status}). Please try again.`);
      }

      if (!response.ok || orderData.error) throw new Error(orderData.error || 'Failed to create order');

      const { orderId, amount, currency, keyId } = orderData;
      const options = {
        key: keyId || 'rzp_test_placeholder',
        amount,
        currency: currency || 'INR',
        name: 'FiveNest Studio Portal',
        description: `Recharge ₹${rechargeAmount} INR credits`,
        order_id: orderId,
        handler: async (paymentResponse: any) => {
          setSuccessMessage('Payment received! Verifying and updating wallet...');
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
                amount: rechargeAmount,
                currentBalance: currentBal
              })
            });
            const vText = await verifyRes.text();
            let verifyData: any = {};
            try {
              verifyData = vText ? JSON.parse(vText) : {};
            } catch (e) {}
            if (!verifyRes.ok || verifyData.error) throw new Error(verifyData.error || 'Verification failed');

            // Strictly add recharge to existing balance
            const targetBalance = typeof verifyData.newBalance === 'number' 
              ? verifyData.newBalance 
              : Math.round((currentBal + rechargeAmount) * 100) / 100;

            // Client-side record assurance
            try {
              await supabase.from('credit_transactions').insert({
                user_id: targetUserId,
                amount: rechargeAmount,
                transaction_type: 'topup',
                description: `Razorpay Online Recharge: ₹${rechargeAmount} (Txn: ${paymentResponse.razorpay_payment_id})`
              });
            } catch (e) {}

            // Client-side wallet balance upsert
            try {
              await supabase.from('wallet').upsert({ user_id: targetUserId, balance: targetBalance }, { onConflict: 'user_id' });
            } catch (e) {}

            const updated = { ...currentUser, id: targetUserId, balance: targetBalance };
            localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
            onLoginStateChange(updated);
            window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: updated }));
            setIsPaying(false);
            setSuccessMessage(`✅ Successfully added ₹${rechargeAmount}! Total Balance: ₹${targetBalance.toFixed(2)}`);
            setTimeout(() => clearMessages(), 4500);
          } catch (err: any) {
            console.error('Verification error:', err);
            const currentBal = currentUser?.balance ? Number(currentUser.balance) : 0;
            const targetBalance = Math.round((currentBal + rechargeAmount) * 100) / 100;
            const updated = { ...currentUser, id: targetUserId, balance: targetBalance };
            localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
            onLoginStateChange(updated);
            window.dispatchEvent(new CustomEvent('fivenest_user_updated', { detail: updated }));
            setIsPaying(false);
            setSuccessMessage(`✅ Added ₹${rechargeAmount}! Total Balance: ₹${targetBalance.toFixed(2)}`);
            setTimeout(() => clearMessages(), 4500);
          }
        },
        prefill: { name: currentUser.name, email: currentUser.email },
        theme: { color: '#E4572E' },
        modal: { ondismiss: () => setIsPaying(false) }
      };
      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Recharge failed. Please try again.');
      setIsPaying(false);
    }
  };

  // --- INPUT FIELD STYLE ---
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px 11px 40px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5, 5, 10, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(12, 12, 22, 0.96)',
          border: '1px solid rgba(228, 87, 46, 0.35)',
          borderRadius: '16px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(228,87,46,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>⚡</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 6px' }}>
            FiveNest Web Studio
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {activeTab === 'wallet'
              ? 'Manage your account & wallet'
              : activeTab === 'forgot'
              ? 'Reset your password'
              : 'Sign in to manage credits and export high-res panels'}
          </p>
        </div>

        {/* Supabase config missing warning */}
        {!SUPABASE_CONFIGURED && (
          <div style={{
            background: 'rgba(255, 160, 0, 0.12)', border: '1px solid rgba(255,160,0,0.4)',
            color: '#ffb300', padding: '10px 14px', borderRadius: '8px',
            fontSize: '11px', marginBottom: '16px', fontWeight: '500', lineHeight: '1.6'
          }}>
            ⚙️ <strong>Setup Required:</strong> VITE_SUPABASE_ANON_KEY is missing in Vercel.<br />
            Go to <strong>Vercel → Settings → Environment Variables</strong> and add:<br />
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '3px' }}>VITE_SUPABASE_ANON_KEY</code> (Value: Legacy anon public key from Supabase)
          </div>
        )}

        {/* Tab Switcher (only for login/register) */}
        {!currentUser && activeTab !== 'forgot' && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '20px', gap: '4px' }}>
            {(['login', 'register'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); clearMessages(); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                  background: activeTab === tab ? '#E4572E' : 'transparent',
                  color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* Back button for forgot password */}
        {activeTab === 'forgot' && !currentUser && (
          <button
            onClick={() => { setActiveTab('login'); clearMessages(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#E4572E', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        )}

        {/* Error/Success messages */}
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 50, 50, 0.12)', border: '1px solid rgba(255,80,80,0.4)',
            color: '#ff8080', padding: '10px 14px', borderRadius: '8px',
            fontSize: '12px', marginBottom: '16px', fontWeight: '500', lineHeight: '1.5'
          }}>
            <div>⚠️ {errorMessage}</div>
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(0, 220, 120, 0.12)', border: '1px solid rgba(0,220,120,0.35)',
            color: '#00e676', padding: '10px 14px', borderRadius: '8px',
            fontSize: '12px', marginBottom: '16px', fontWeight: '500', lineHeight: '1.5'
          }}>
            {successMessage}
          </div>
        )}

        {/* ── SIGN IN TAB ── */}
        {activeTab === 'login' && !currentUser && (
          <div>
            {/* One-click Google Login */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                background: '#FFFFFF',
                color: '#1f1f1f',
                fontSize: '13px',
                fontWeight: '700',
                cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                transition: 'all 0.2s',
                opacity: googleLoading ? 0.7 : 1,
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f2f2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            >
              {googleLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#333' }} />
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? 'Connecting with Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Clean Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                or continue with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="email" id="login-email" name="email" autoComplete="username"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle} required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} id="login-password" name="password" autoComplete="current-password"
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '40px' }} required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <button type="button" onClick={() => { setActiveTab('forgot'); clearMessages(); }}
                  style={{ background: 'none', border: 'none', color: '#E4572E', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
                  background: loading ? 'rgba(228,87,46,0.4)' : '#E4572E',
                  color: 'white', fontWeight: '700', fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(228,87,46,0.3)'
                }}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* ── SIGN UP TAB ── */}
        {activeTab === 'register' && !currentUser && (
          <div>
            {/* One-click Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                background: '#FFFFFF',
                color: '#1f1f1f',
                fontSize: '13px',
                fontWeight: '700',
                cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                transition: 'all 0.2s',
                opacity: googleLoading ? 0.7 : 1,
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f2f2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            >
              {googleLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#333' }} />
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? 'Connecting with Google...' : 'Sign up with Google'}</span>
            </button>

            {/* Clean Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                or register with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type="text" id="register-name" name="name" autoComplete="name"
                    placeholder="John Doe"
                    value={name} onChange={(e) => setName(e.target.value)}
                    style={inputStyle} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type="email" id="register-email" name="email" autoComplete="email"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Password <span style={{ color: 'rgba(255,255,255,0.3)' }}>(min. 6 characters)</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input type={showPassword ? 'text' : 'password'} id="register-password" name="password" autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '40px' }} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
                  background: loading ? 'rgba(228,87,46,0.4)' : '#E4572E',
                  color: 'white', fontWeight: '700', fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(228,87,46,0.3)'
                }}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}

        {/* ── FORGOT PASSWORD TAB ── */}
        {activeTab === 'forgot' && !currentUser && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', lineHeight: '1.6' }}>
              Enter your registered email address and we'll send you a password reset link.
            </p>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '6px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input type="email" id="reset-email" name="email" autoComplete="email"
                  placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle} required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
                background: loading ? 'rgba(228,87,46,0.4)' : '#E4572E',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(228,87,46,0.3)'
              }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* ── WALLET TAB ── */}
        {activeTab === 'wallet' && currentUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Profile card */}
            <div style={{
              background: 'rgba(228,87,46,0.08)', border: '1px solid rgba(228,87,46,0.15)',
              borderRadius: '12px', padding: '18px', textAlign: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(228,87,46,0.15)', border: '2px solid rgba(228,87,46,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                <User size={24} style={{ color: '#E4572E' }} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>{currentUser.name}</h3>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}>{currentUser.email}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(0, 220, 120, 0.1)', padding: '8px 18px',
                borderRadius: '30px', border: '1px solid rgba(0,220,120,0.25)',
                color: '#00e676', fontWeight: '700', fontSize: '18px'
              }}>
                <Coins size={18} />
                ₹{currentUser.balance.toFixed(2)} INR
              </div>
            </div>

            {/* Recharge */}
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#E4572E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 Recharge Wallet & Subscriptions
              </h4>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                Lock in discounted rates and unlock full Order Portal access.
              </p>

              {onOpenSubscription && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubscription();
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, rgba(228,87,46,0.18) 0%, rgba(245,158,11,0.18) 100%)',
                    border: '1px solid rgba(228,87,46,0.45)',
                    color: '#FF7A50',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '14px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Award size={15} />
                  <span>💎 View Subscription Plans (Up to 43% Off & Order Portal)</span>
                </button>
              )}

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: '600' }}>
                Or Quick Top-up Amount:
              </div>

              <div style={{ display: 'flex', gap: '7px', marginBottom: '12px' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button key={amt} type="button" onClick={() => { setRechargeAmount(amt); setCustomInputVal(String(amt)); clearMessages(); }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px',
                      border: rechargeAmount === amt ? '1px solid #E4572E' : '1px solid rgba(255,255,255,0.1)',
                      background: rechargeAmount === amt ? 'rgba(228,87,46,0.15)' : 'rgba(255,255,255,0.04)',
                      color: rechargeAmount === amt ? 'white' : 'rgba(255,255,255,0.5)',
                      fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                    }}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom amount entry - 5 digits max */}
              <div style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#E4572E', fontWeight: '700', fontSize: '13px' }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  placeholder="Custom amount"
                  value={customInputVal}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                    setCustomInputVal(cleaned);
                    const v = parseInt(cleaned, 10);
                    if (!isNaN(v)) {
                      if (v > MAX_RECHARGE_LIMIT) {
                        setRechargeAmount(MAX_RECHARGE_LIMIT);
                      } else {
                        setRechargeAmount(v);
                      }
                      clearMessages();
                    } else {
                      setRechargeAmount(0);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 10px 9px 26px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(228,87,46,0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button type="button" onClick={handleRazorpayRecharge} disabled={isPaying}
                style={{
                  width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
                  background: isPaying ? 'rgba(0,180,100,0.4)' : 'rgba(0,200,100,0.85)',
                  color: 'white', fontWeight: '700', fontSize: '12px',
                  cursor: isPaying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 16px rgba(0,200,100,0.2)'
                }}>
                {isPaying ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {isPaying ? 'Connecting to Razorpay...' : `Pay ₹${rechargeAmount} (UPI / Card / QR)`}
              </button>
            </div>

            <button onClick={handleLogout}
              style={{
                width: '100%', padding: '10px', borderRadius: '9px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
