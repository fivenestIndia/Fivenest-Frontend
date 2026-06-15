import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, X, Coins, LogOut } from 'lucide-react';

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    // Load registered users from localStorage
    const savedUsersStr = localStorage.getItem('fivenest_mock_users') || '[]';
    const users = JSON.parse(savedUsersStr);
    
    // Find matching user
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password !== password) {
      setErrorMessage('Invalid email or password.');
      return;
    }

    // Set logged in user state
    const loggedInUser = {
      email: user.email,
      name: user.name,
      balance: user.balance || 0
    };
    
    localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
    onLoginStateChange(loggedInUser);
    setSuccessMessage('Logged in successfully!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const savedUsersStr = localStorage.getItem('fivenest_mock_users') || '[]';
    const users = JSON.parse(savedUsersStr);
    
    // Check if user already exists
    if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      setErrorMessage('User with this email already exists.');
      return;
    }

    const newUser = {
      name,
      email,
      password, // Plain text for demo purposes
      balance: 10 // Start with ₹10 free credit
    };

    users.push(newUser);
    localStorage.setItem('fivenest_mock_users', JSON.stringify(users));
    
    // Auto-login new user
    const loggedInUser = {
      email: newUser.email,
      name: newUser.name,
      balance: newUser.balance
    };
    
    localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
    onLoginStateChange(loggedInUser);
    setSuccessMessage('Registered & logged in successfully! Added ₹10 free credits.');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1500);
  };

  const handleDemoLogin = (type: 'demo' | 'empty') => {
    // Register demo user in database if it doesn't exist
    const savedUsersStr = localStorage.getItem('fivenest_mock_users') || '[]';
    const users = JSON.parse(savedUsersStr);
    
    const demoEmail = type === 'demo' ? 'demo@fivenest.in' : 'newuser@fivenest.in';
    const demoName = type === 'demo' ? 'Demo Designer' : 'New Client';
    const demoBalance = type === 'demo' ? 100 : 0;
    
    let userIndex = users.findIndex((u: any) => u.email.toLowerCase() === demoEmail.toLowerCase());
    
    if (userIndex === -1) {
      const newUser = {
        name: demoName,
        email: demoEmail,
        password: 'password123',
        balance: demoBalance
      };
      users.push(newUser);
      localStorage.setItem('fivenest_mock_users', JSON.stringify(users));
    } else if (type === 'demo' && users[userIndex].balance < 10) {
      // Top up demo user balance if it ran out
      users[userIndex].balance = 100;
      localStorage.setItem('fivenest_mock_users', JSON.stringify(users));
    }

    const loggedInUser = {
      email: demoEmail,
      name: demoName,
      balance: userIndex === -1 ? demoBalance : users[userIndex].balance
    };
    
    localStorage.setItem('fivenest_active_user', JSON.stringify(loggedInUser));
    onLoginStateChange(loggedInUser);
    setSuccessMessage(`Logged in as ${demoName}!`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('fivenest_active_user');
    onLoginStateChange(null);
    onClose();
  };

  const handleRecharge = () => {
    if (!currentUser) return;
    
    const savedUsersStr = localStorage.getItem('fivenest_mock_users') || '[]';
    const users = JSON.parse(savedUsersStr);
    
    const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === currentUser.email.toLowerCase());
    
    if (userIndex !== -1) {
      users[userIndex].balance = (users[userIndex].balance || 0) + rechargeAmount;
      localStorage.setItem('fivenest_mock_users', JSON.stringify(users));
      
      const updatedUser = {
        ...currentUser,
        balance: users[userIndex].balance
      };
      localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
      onLoginStateChange(updatedUser);
      
      setSuccessMessage(`Successfully added ₹${rechargeAmount} INR credits to your account!`);
      setTimeout(() => setSuccessMessage(''), 2500);
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
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#white', marginBottom: '8px' }}>
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
              <label className="form-label" style={{ fontSize: '11px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
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
              <label className="form-label" style={{ fontSize: '11px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
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

            {/* Simulated Credits Recharge Section */}
            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 Sandbox Wallet Top Up
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Add play credits to simulate transactions. No real payment required.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[10, 50, 100, 500].map(amt => (
                  <button 
                    key={amt}
                    className={`btn ${rechargeAmount === amt ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRechargeAmount(amt)}
                    style={{ flex: 1, padding: '6px', fontSize: '11px' }}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <button 
                className="btn btn-success" 
                onClick={handleRecharge}
                style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}
              >
                Recharge Wallet Balance
              </button>
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
