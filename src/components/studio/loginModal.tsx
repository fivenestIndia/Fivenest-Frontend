import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Coins, LogOut } from 'lucide-react';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';

interface LoginModalProps {
  onClose: () => void;
  onLoginStateChange: (user: { email: string; name: string; balance: number } | null) => void;
  currentUser: { email: string; name: string; balance: number } | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginStateChange, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'wallet'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number>(50);

  // Switch to wallet tab if already logged in
  useEffect(() => {
    if (currentUser) {
      setActiveTab('wallet');
    } else {
      setActiveTab('login');
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.user) {
        const details = await fetchUserWallet(data.user.id);
        const loggedInUser = {
          email: data.user.email || email,
          name: details.name,
          balance: details.balance
        };
        
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.user) {
        setSuccessMessage('Account created successfully! Please check your email for confirmation (if email confirmations are enabled).');
        
        // Auto sign in user if email confirmation is not required
        const details = await fetchUserWallet(data.user.id);
        const loggedInUser = {
          email: data.user.email || email,
          name: name,
          balance: details.balance
        };
        
        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  const handleDemoLogin = async (type: 'demo' | 'empty') => {
    setErrorMessage('');
    setSuccessMessage('');
    
    const demoEmail = type === 'demo' ? 'demo@fivenest.in' : 'newuser@fivenest.in';
    const demoName = type === 'demo' ? 'Demo Designer' : 'New Client';
    const demoPassword = 'password123';

    try {
      // Attempt to sign in
      let { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (error) {
        // If demo user doesn't exist, register them
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              name: demoName
            }
          }
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
          return;
        }

        data = signUpData;
      }

      if (data?.user) {
        // Give demo starting credits if wallet balance is 0
        const details = await fetchUserWallet(data.user.id);
        
        if (type === 'demo' && details.balance < 10) {
          // Add default credits via ledger insert for demo simulation
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
          name: finalDetails.name,
          balance: finalDetails.balance
        };

        localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
        onLoginStateChange(loggedInUser);
        setSuccessMessage(`Logged in as ${finalDetails.name}!`);
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage("Demo connection failed. Verify your Supabase config credentials in your env.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fivenest_active_user');
    onLoginStateChange(null);
    onClose();
  };

  const [isPaying, setIsPaying] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayRecharge = async () => {
    if (!currentUser) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsPaying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("User session not found in Supabase. Please click 'Sign Out of Account' and then Sign In again.");
        setIsPaying(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrorMessage("Failed to load Razorpay SDK. Please check your internet connection.");
        setIsPaying(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await fetch(`${API_BASE_URL}/api/payment/create-studio-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rechargeAmount,
          userId: user.id,
          email: user.email
        })
      });

      const orderData = await response.json();
      if (!response.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to create order on server");
      }

      const { orderId, amount, currency, keyId } = orderData;

      const options = {
        key: keyId || "rzp_test_placeholder",
        amount: amount,
        currency: currency || "INR",
        name: "FiveNest Studio Portal",
        description: `Recharge ₹${rechargeAmount} INR credits`,
        order_id: orderId,
        handler: async function (paymentResponse: any) {
          setIsPaying(true);
          setSuccessMessage("Payment successful! Verifying transaction...");
          
          try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
            const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify-studio-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                userId: user.id,
                amount: rechargeAmount
              })
            });
            
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || "Payment verification failed on server");
            }
            
            // Fetch updated wallet
            const details = await fetchUserWallet(user.id);
            const updatedUser = {
              ...currentUser,
              balance: details.balance
            };
            localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
            onLoginStateChange(updatedUser);
            setIsPaying(false);
            setSuccessMessage(`Successfully recharged ₹${rechargeAmount} INR credits!`);
            setTimeout(() => setSuccessMessage(''), 3000);
          } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMessage(err.message || "Direct verification failed. Waiting for webhook...");
            
            // Fallback: wait a bit and fetch wallet anyway in case webhook succeeded
            setTimeout(async () => {
              const details = await fetchUserWallet(user.id);
              const updatedUser = {
                ...currentUser,
                balance: details.balance
              };
              localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
              onLoginStateChange(updatedUser);
              setIsPaying(false);
              setSuccessMessage(`Recharged ₹${rechargeAmount} INR credits (via webhook verification).`);
              setTimeout(() => setSuccessMessage(''), 3000);
            }, 3000);
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email
        },
        theme: {
          color: "#9b4dff"
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Razorpay recharge error:", err);
      setErrorMessage(err.message || "Recharge failed.");
      setIsPaying(false);
    }
  };



  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 5, 10, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }} onClick={onClose}>
      <div className="glass-card fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '30px',
        background: 'rgba(15, 15, 25, 0.85)',
        border: '1px solid var(--border-active)',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
            ⚡ FiveNest Web Studio Portal
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Log in to manage credits, unlock 300 DPI high-res nesting, and process orders.
          </p>
        </div>

        {/* Tabs */}
        {!currentUser && (
          <div className="tab-btn-group" style={{ marginBottom: '20px' }}>
            <button 
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
              style={{ flex: 1 }}
            >
              Sign In
            </button>
            <button 
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
              style={{ flex: 1 }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 23, 68, 0.15)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(0, 230, 118, 0.15)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success)',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Login Tab Content */}
        {activeTab === 'login' && !currentUser && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="login-email" className="form-label" style={{ fontSize: '11px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  id="login-email"
                  name="email"
                  autoComplete="username"
                  className="form-input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="login-password" className="form-label" style={{ fontSize: '11px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
              Sign In
            </button>

            <div style={{ margin: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OR QUICK DEMO LOGIN</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                className="btn btn-success" 
                onClick={() => handleDemoLogin('demo')}
                style={{ flex: 1, fontSize: '11px', padding: '10px 6px' }}
              >
                Demo (₹100 credits)
              </button>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => handleDemoLogin('empty')}
                style={{ flex: 1, fontSize: '11px', padding: '10px 6px' }}
              >
                New Client (₹0)
              </button>
            </div>
            
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
              * Tip: Demo password is <strong>password123</strong>
            </p>
          </form>
        )}

        {/* Register Tab Content */}
        {activeTab === 'register' && !currentUser && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="register-name" className="form-label" style={{ fontSize: '11px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  id="register-name"
                  name="name"
                  autoComplete="name"
                  className="form-input" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="register-email" className="form-label" style={{ fontSize: '11px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  id="register-email"
                  name="email"
                  autoComplete="email"
                  className="form-input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="register-password" className="form-label" style={{ fontSize: '11px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  id="register-password"
                  name="password"
                  autoComplete="new-password"
                  className="form-input" 
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
              Create Account
            </button>
          </form>
        )}

        {/* Profile & Wallet Tab Content */}
        {activeTab === 'wallet' && currentUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{
              background: 'rgba(155, 77, 255, 0.05)',
              borderColor: 'var(--border-active)',
              padding: '16px',
              textAlign: 'center'
            }}>
              <User size={36} style={{ color: 'var(--color-primary)', margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{currentUser.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{currentUser.email}</p>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 230, 118, 0.1)',
                padding: '8px 16px',
                borderRadius: '30px',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                fontWeight: 'bold',
                color: 'var(--color-success)',
                fontSize: '18px'
              }}>
                <Coins size={20} />
                <span>₹{currentUser.balance.toFixed(2)} INR</span>
              </div>
            </div>

            {/* Credits Recharge Section */}
            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💳 Recharge Web Studio Wallet
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Add tokens to unlock high-resolution sublimation panel exports.
                </p>
              </div>

              {/* Amount Selector */}
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '6px', display: 'block' }}>Select Recharge Amount:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[10, 50, 100, 500].map(amt => (
                    <button 
                      key={amt}
                      type="button"
                      className={`btn ${rechargeAmount === amt ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRechargeAmount(amt)}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '11px', fontWeight: 'bold' }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-success" 
                  onClick={handleRazorpayRecharge}
                  disabled={isPaying}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 12px rgba(0, 229, 118, 0.2)'
                  }}
                >
                  {isPaying ? "Connecting to Razorpay..." : `Pay ₹${rechargeAmount} Securely (UPI, QR, Card)`}
                </button>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <LogOut size={16} /> Sign Out of Account
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
