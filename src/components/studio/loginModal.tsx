import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Coins, LogOut, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { supabase, fetchUserWallet, supabaseUrl, supabaseAnonKey } from '../../lib/supabaseClient';

const SUPABASE_CONFIGURED = !!supabaseUrl && !!supabaseAnonKey;

interface LoginModalProps {
  onClose: () => void;
  onLoginStateChange: (user: { email: string; name: string; balance: number } | null) => void;
  currentUser: { email: string; name: string; balance: number } | null;
}

type Tab = 'login' | 'register' | 'wallet' | 'forgot';

// Map common Supabase auth error messages to friendly ones.
// NOTE: We intentionally do NOT swallow generic 'fetch/network' errors here
// because those are usually Supabase config issues, not real network problems.
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid_credentials'))
    return 'Incorrect email or password. Please try again.';
  if (m.includes('email not confirmed') || m.includes('confirm') || m.includes('verify'))
    return 'Your email is not confirmed. Check your inbox (and spam folder) for the confirmation link, then come back to Sign In.';
  if (m.includes('user already registered') || m.includes('already been registered') || m.includes('already registered'))
    return 'This email is already registered. Please click "Sign In" instead.';
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return 'Password must be at least 6 characters long.';
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('too many'))
    return 'Too many attempts. Please wait a minute before trying again.';
  // Return raw message for everything else — helps diagnose config issues
  return msg;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginStateChange, currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
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
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setErrorMessage(friendlyError(error.message));
        return;
      }

      if (data?.user) {
        const details = await fetchUserWallet(data.user.id);
        const loggedInUser = {
          email: data.user.email || email.trim(),
          name: details.name || data.user.user_metadata?.name || email.split('@')[0],
          balance: details.balance
        };
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        setSuccessMessage('Signed in successfully! Welcome back.');
        setTimeout(() => {
          clearMessages();
          onClose();
        }, 1200);
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() }
        }
      });

      if (error) {
        setErrorMessage(friendlyError(error.message));
        return;
      }

      if (data?.user) {
        if (data.session) {
          // Email confirmation disabled — user is immediately logged in
          const details = await fetchUserWallet(data.user.id);
          const loggedInUser = {
            email: data.user.email || email.trim(),
            name: name.trim(),
            balance: details.balance
          };
          localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
          onLoginStateChange(loggedInUser);
          setSuccessMessage('Account created! You are now signed in.');
          setTimeout(() => {
            clearMessages();
            onClose();
          }, 1500);
        } else {
          // Email confirmation enabled
          setSuccessMessage('');
          setActiveTab('login');
          setErrorMessage('');
          // Show a prominent confirmation notice instead of error
          setSuccessMessage(
            '✅ Account created! Check your email inbox for the confirmation link. Click it, then come back to sign in.'
          );
        }
      }
    } catch (err: any) {
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
    const demoPassword = 'password123';

    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (error) {
        // Try to register demo user if doesn't exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: { data: { name: demoName } }
        });
        if (signUpError) {
          setErrorMessage('Demo login unavailable: ' + friendlyError(signUpError.message));
          return;
        }
        data = signUpData;
      }

      if (data?.user) {
        const details = await fetchUserWallet(data.user.id);
        if (type === 'demo' && details.balance < 10) {
          await supabase.from('credit_transactions').insert({
            user_id: data.user.id,
            amount: 100,
            transaction_type: 'topup',
            description: 'Sandbox Demo Starting Credit'
          });
        }
        const finalDetails = await fetchUserWallet(data.user.id);
        const loggedInUser = {
          email: data.user.email || demoEmail,
          name: finalDetails.name || demoName,
          balance: finalDetails.balance
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
      setErrorMessage('Demo login failed. Check your Supabase environment configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fivenest_active_user');
    onLoginStateChange(null);
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
    setIsPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Session expired. Please sign out and sign in again.");
        setIsPaying(false);
        return;
      }
      const loaded = await loadRazorpayScript();
      if (!loaded) {
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
        body: JSON.stringify({ amount: rechargeAmount, userId: user.id, email: user.email })
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
          setSuccessMessage('Payment received! Verifying...');
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify-studio-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                userId: user.id,
                amount: rechargeAmount
              })
            });
            const vText = await verifyRes.text();
            let verifyData: any = {};
            try {
              verifyData = vText ? JSON.parse(vText) : {};
            } catch (e) {}
            if (!verifyRes.ok || verifyData.error) throw new Error(verifyData.error || 'Verification failed');
            const details = await fetchUserWallet(user.id);
            const updated = { ...currentUser, balance: details.balance };
            localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
            onLoginStateChange(updated);
            setIsPaying(false);
            setSuccessMessage(`✅ Successfully recharged ₹${rechargeAmount}!`);
            setTimeout(() => clearMessages(), 4000);
          } catch (err: any) {
            setErrorMessage(err.message || 'Verification failed. Contact support if amount was deducted.');
            setTimeout(async () => {
              const details = await fetchUserWallet(user.id);
              const updated = { ...currentUser, balance: details.balance };
              localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
              onLoginStateChange(updated);
              setIsPaying(false);
            }, 3000);
          }
        },
        prefill: { name: currentUser.name, email: currentUser.email },
        theme: { color: '#9b4dff' },
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
          border: '1px solid rgba(155, 77, 255, 0.3)',
          borderRadius: '16px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(155,77,255,0.08)'
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
                  background: activeTab === tab ? 'rgba(155, 77, 255, 0.9)' : 'transparent',
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
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(155,77,255,0.9)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
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
            ⚠️ {errorMessage}
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
                style={{ background: 'none', border: 'none', color: 'rgba(155,77,255,0.85)', fontSize: '11px', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
                background: loading ? 'rgba(155,77,255,0.4)' : 'rgba(155,77,255,1)',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(155,77,255,0.3)'
              }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>OR QUICK DEMO</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => handleDemoLogin('demo')} disabled={loading}
                style={{ flex: 1, padding: '9px 6px', borderRadius: '8px', border: '1px solid rgba(0,220,120,0.3)', background: 'rgba(0,220,120,0.08)', color: '#00e676', fontSize: '11px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                Demo (₹100 credits)
              </button>
              <button type="button" onClick={() => handleDemoLogin('empty')} disabled={loading}
                style={{ flex: 1, padding: '9px 6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                New Client (₹0)
              </button>
            </div>
          </form>
        )}

        {/* ── SIGN UP TAB ── */}
        {activeTab === 'register' && !currentUser && (
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
                background: loading ? 'rgba(155,77,255,0.4)' : 'rgba(155,77,255,1)',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(155,77,255,0.3)'
              }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
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
                background: loading ? 'rgba(155,77,255,0.4)' : 'rgba(155,77,255,1)',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(155,77,255,0.3)'
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
              background: 'rgba(155,77,255,0.07)', border: '1px solid rgba(155,77,255,0.2)',
              borderRadius: '12px', padding: '18px', textAlign: 'center'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(155,77,255,0.2)', border: '2px solid rgba(155,77,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                <User size={24} style={{ color: 'rgba(155,77,255,0.9)' }} />
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
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(155,77,255,0.9)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 Recharge Wallet
              </h4>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
                Add credits to unlock high-resolution sublimation exports.
              </p>
              <div style={{ display: 'flex', gap: '7px', marginBottom: '12px' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button key={amt} type="button" onClick={() => { setRechargeAmount(amt); setCustomInputVal(String(amt)); }}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px',
                      border: rechargeAmount === amt ? '1px solid rgba(155,77,255,0.8)' : '1px solid rgba(255,255,255,0.1)',
                      background: rechargeAmount === amt ? 'rgba(155,77,255,0.2)' : 'rgba(255,255,255,0.04)',
                      color: rechargeAmount === amt ? 'white' : 'rgba(255,255,255,0.5)',
                      fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                    }}>
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Custom amount entry */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(155,77,255,0.9)', fontWeight: '700', fontSize: '13px' }}>₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Custom amount"
                    value={customInputVal}
                    onChange={(e) => {
                      setCustomInputVal(e.target.value);
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v > 0) setRechargeAmount(v);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 10px 9px 26px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(155,77,255,0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
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
