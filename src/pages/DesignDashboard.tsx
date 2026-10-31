import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ShieldCheck, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  RefreshCw, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Lock, 
  LogOut, 
  Sparkles,
  Layers,
  FileSpreadsheet,
  Coins,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';

// Authorized admin accounts list
export const AUTHORIZED_ADMIN_EMAILS = [
  'fivenest.india@gmail.com',
  'vilesh332.1@gmail.com',
  'wavredeepika9@gmail.com'
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
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

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return AUTHORIZED_ADMIN_EMAILS.some(admin => admin.toLowerCase().trim() === clean);
};

interface RazorpayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  orderId: string;
  description: string;
  fee: number;
  tax: number;
  createdAt: string;
}

interface UserAccount {
  id: string;
  email: string;
  name: string;
  balance: number;
  createdAt?: string;
}

interface CreditTransaction {
  id?: string;
  user_id: string;
  email?: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function DesignDashboard() {
  const [sessionUser, setSessionUser] = useState<{ email: string; id?: string; name?: string } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'users' | 'exports'>('payments');

  // Login form state (if not authenticated as admin)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Financial & Data states
  const [payments, setPayments] = useState<RazorpayPayment[]>([]);
  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [netRevenue, setNetRevenue] = useState<number>(0);
  const [isLiveKey, setIsLiveKey] = useState<boolean>(false);
  const [keyIdPreview, setKeyIdPreview] = useState<string>('');
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Users & Wallets state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Wallet Edit Modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fivenest-backend.onrender.com';

  // 1. Check active Supabase session on load
  useEffect(() => {
    const initAuth = async () => {
      setLoadingAuth(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.email) {
          const userEmail = session.user.email.toLowerCase().trim();
          if (isAuthorizedAdmin(userEmail)) {
            setSessionUser({
              email: userEmail,
              id: session.user.id,
              name: session.user.user_metadata?.name || userEmail.split('@')[0]
            });
          } else {
            setSessionUser({ email: userEmail, id: session.user.id });
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        setLoadingAuth(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user?.email) {
        setSessionUser({
          email: session.user.email.toLowerCase().trim(),
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        });
      } else {
        setSessionUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Razorpay live payments from backend
  const fetchLivePayments = async () => {
    if (!sessionUser || !isAuthorizedAdmin(sessionUser.email)) return;
    setLoadingPayments(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/live-payments?adminEmail=${encodeURIComponent(sessionUser.email)}`, {
        headers: {
          'x-admin-email': sessionUser.email
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setTotalCollected(data.totalCollected || 0);
        setNetRevenue(data.netRevenue || 0);
        setIsLiveKey(data.isLiveKey || false);
        setKeyIdPreview(data.keyIdPreview || '');
      } else {
        console.warn("Failed to fetch Razorpay payments:", await res.text());
      }
    } catch (e) {
      console.error("Error fetching live payments:", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  // 3. Fetch User Accounts & Wallets via Backend Supabase Admin (bypasses browser RLS)
  const fetchUsersAndWallets = async () => {
    if (!sessionUser || !isAuthorizedAdmin(sessionUser.email)) return;
    setLoadingUsers(true);
    try {
      // 1. Try secure backend endpoint first
      const res = await fetch(`${API_BASE_URL}/api/admin/users-wallets?adminEmail=${encodeURIComponent(sessionUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          return;
        }
      }

      // 2. Client-side fallback if backend endpoint unreachable
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, created_at');

      const { data: wallets, error: wErr } = await supabase
        .from('wallet')
        .select('user_id, balance, updated_at');

      if (!pErr && profiles) {
        const walletMap = new Map((wallets || []).map(w => [w.user_id, parseFloat(w.balance) || 0]));
        
        const accounts: UserAccount[] = profiles.map(p => ({
          id: p.id,
          name: p.name || 'Client',
          email: p.id === sessionUser.id ? sessionUser.email : `${(p.name || 'user').toLowerCase().replace(/\s+/g, '')}@fivenest.in`,
          balance: walletMap.get(p.id) || 0.00,
          createdAt: p.created_at
        }));

        setUsers(accounts);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 4. Fetch Credit & Export Transactions via Backend Supabase Admin
  const fetchTransactions = async () => {
    if (!sessionUser || !isAuthorizedAdmin(sessionUser.email)) return;
    setLoadingTransactions(true);
    try {
      // 1. Try backend endpoint first
      const res = await fetch(`${API_BASE_URL}/api/admin/ledger?adminEmail=${encodeURIComponent(sessionUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          return;
        }
      }

      // 2. Client-side fallback
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (e) {
      console.error("Error fetching transactions:", e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (sessionUser && isAuthorizedAdmin(sessionUser.email)) {
      fetchLivePayments();
      fetchUsersAndWallets();
      fetchTransactions();
    }
  }, [sessionUser]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);

    const cleanEmail = loginEmail.toLowerCase().trim();
    if (!isAuthorizedAdmin(cleanEmail)) {
      setAuthError('Access restricted: Only authorized FiveNest owners have access.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword
      });

      if (error) {
        setAuthError(error.message);
      } else if (data?.user) {
        setSessionUser({
          email: cleanEmail,
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || cleanEmail.split('@')[0]
        });
        toast.success(`Welcome back, ${cleanEmail}`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Google Admin Login
  const handleGoogleAdminLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const returnUrl = window.location.origin + '/admin';
      const { error } = await supabase.auth.signInWithOAuth({
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
          setAuthError('Google Sign-In is not yet enabled in Supabase (Authentication → Providers → Google). Please use email & password or enable the provider.');
        } else {
          setAuthError(error.message);
        }
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to start Google sign-in');
      setIsLoggingIn(false);
    }
  };

  // Handle Wallet Update via Backend (bypasses browser RLS restrictions)
  const handleSaveWalletAdjustment = async () => {
    if (!editingUser || !sessionUser) return;
    const newBal = parseFloat(editBalanceValue);
    if (isNaN(newBal) || newBal < 0) {
      toast.error('Please enter a valid positive balance.');
      return;
    }

    setIsSavingWallet(true);
    try {
      // 1. Call Backend Admin Endpoint with service-role permissions
      const res = await fetch(`${API_BASE_URL}/api/admin/adjust-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: sessionUser.email,
          targetUserId: editingUser.id,
          targetEmail: editingUser.email,
          newBalance: newBal,
          note: editNote.trim() || `Manual adjustment by ${sessionUser.email} (Set to ₹${newBal.toFixed(2)})`
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Server failed to update wallet in database.');
      }

      // 2. Also attempt direct client log if permitted
      try {
        await supabase.from('credit_transactions').insert({
          user_id: editingUser.id,
          amount: Math.abs(newBal - editingUser.balance),
          transaction_type: newBal >= editingUser.balance ? 'admin_credit' : 'admin_debit',
          description: editNote.trim() || `Manual wallet adjustment by ${sessionUser.email} (Set to ₹${newBal.toFixed(2)})`
        });
      } catch {}

      toast.success(`Updated ${editingUser.name}'s wallet to ₹${newBal.toFixed(2)}`);
      setEditingUser(null);
      await fetchUsersAndWallets();
      await fetchTransactions();
    } catch (err: any) {
      console.error("Wallet adjustment failed:", err);
      toast.error(err.message || 'Failed to update wallet balance');
    } finally {
      setIsSavingWallet(false);
    }
  };

  // Wipe Test Wallets (Main Account Exclusive)
  const handleWipeTestWallets = async () => {
    if (!sessionUser || sessionUser.email !== 'fivenest.india@gmail.com') {
      toast.error('Only the main owner account (fivenest.india@gmail.com) can wipe test balances.');
      return;
    }

    if (!confirm("Are you sure you want to reset all test accounts' wallet balances to ₹0.00?\n\nYour main account fivenest.india@gmail.com will be completely preserved.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/wipe-test-wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: sessionUser.email })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('All non-admin test balances reset to ₹0.00!');
      } else {
        toast.error(data.error || 'Failed to wipe balances.');
      }
      await fetchUsersAndWallets();
      await fetchTransactions();
    } catch (e) {
      toast.error('Error executing test wipe.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('fivenest_active_user');
    setSessionUser(null);
    toast.info('Signed out of admin dashboard');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Total active wallet liability
  const totalWalletCredits = users.reduce((acc, u) => acc + (u.balance || 0), 0);

  // If loading session
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-[#E4572E]" />
          <span className="text-sm font-bold text-gray-400">Authenticating FiveNest Command Center...</span>
        </div>
      </div>
    );
  }

  // If not logged in OR not an authorized admin
  if (!sessionUser || !isAuthorizedAdmin(sessionUser.email)) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#E4572E]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#0F1422] border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E4572E]/15 border border-[#E4572E]/30 text-[#E4572E] mx-auto mb-5 shadow-lg shadow-[#E4572E]/10">
            <ShieldCheck size={30} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
              Design & Financial Dashboard
            </h1>
            <p className="text-xs text-gray-400">
              Restricted Access • Authorized FiveNest Owners Only
            </p>
          </div>

          {sessionUser && !isAuthorizedAdmin(sessionUser.email) ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center mb-6">
              <p className="text-sm text-red-400 font-semibold mb-2">
                Access Denied for <span className="font-mono text-white">{sessionUser.email}</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                This account does not have permission to view live transactions or control user wallets.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition-all"
              >
                Sign In With Different Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* One-click Google Admin Login */}
              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? <RefreshCw size={15} className="animate-spin text-gray-700" /> : <GoogleIcon />}
                <span>Sign in with Google (Authorized Owners)</span>
              </button>

              <div className="flex items-center my-3 gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">or email & password</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">
                    {authError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="fivenest.india@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#E4572E] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#E4572E] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white font-extrabold rounded-xl shadow-lg shadow-[#E4572E]/25 hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                  {isLoggingIn ? 'Verifying Credentials...' : 'Authenticate & Open Dashboard'}
                </button>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-gray-500">
                    Whitelisted accounts: fivenest.india@gmail.com, vilesh332.1@gmail.com, wavredeepika9@gmail.com
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isMainOwner = sessionUser.email === 'fivenest.india@gmail.com';

  return (
    <div className="min-h-screen bg-[#070A12] text-white font-sans antialiased">
      {/* ── TOP HEADER / IDENTITY ── */}
      <header className="border-b border-white/10 bg-[#0B0F1A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E4572E] to-[#EA580C] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#E4572E]/30">
              FN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">FiveNest Command</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E4572E]/20 text-[#E4572E] border border-[#E4572E]/30 tracking-wider">
                  Live Master
                </span>
              </div>
              <span className="text-[11px] text-gray-400">Design Studio & Payment Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Key Status Pill */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
              isLiveKey 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLiveKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isLiveKey ? 'Razorpay Live' : 'Razorpay Test'}</span>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#E4572E] flex items-center justify-center text-[11px] font-black text-white">
                {sessionUser.email[0].toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-gray-200 leading-none">
                  {sessionUser.email}
                </div>
                <div className="text-[10px] font-semibold text-[#E4572E] mt-0.5">
                  {isMainOwner ? '⭐ Primary Owner' : 'Authorized Admin'}
                </div>
              </div>
            </div>

            {/* Link to Studio */}
            <a
              href="/production"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Studio</span>
            </a>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── TOP KPI METRIC CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Live Net Revenue */}
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Live Net Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              ₹{netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span className="text-emerald-400 font-bold">{payments.filter(p => p.status === 'captured').length} captured</span>
              <span>via Razorpay</span>
            </div>
          </div>

          {/* Card 2: Active Client Wallet Pool */}
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Client Wallets Total</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Wallet size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              ₹{totalWalletCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>Circulating studio credit balance</span>
            </div>
          </div>

          {/* Card 3: Registered Clients */}
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Client Accounts</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {users.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>Full control over every balance</span>
            </div>
          </div>

          {/* Card 4: Exports & Ledger Jobs */}
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ledger Activity</span>
              <div className="w-8 h-8 rounded-lg bg-[#E4572E]/10 text-[#E4572E] flex items-center justify-center">
                <Receipt size={18} />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {transactions.length}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>Topups & export deductions</span>
            </div>
          </div>
        </div>

        {/* ── TABS NAVIGATION BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div className="flex bg-[#0F1422] p-1 rounded-xl border border-white/10 gap-1">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'payments' 
                  ? 'bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard size={15} />
              Live Razorpay Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={15} />
              User Wallets & Accounts ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('exports')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'exports' 
                  ? 'bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Receipt size={15} />
              Studio Ledger ({transactions.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isMainOwner && (
              <button
                onClick={handleWipeTestWallets}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Wipe all non-admin test balances to ₹0.00"
              >
                <Trash2 size={14} />
                <span>Wipe Test Credits</span>
              </button>
            )}

            <button
              onClick={() => {
                fetchLivePayments();
                fetchUsersAndWallets();
                fetchTransactions();
                toast.info("Refreshed live transaction and account data");
              }}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={loadingPayments || loadingUsers ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: LIVE RAZORPAY PAYMENTS ── */}
        {activeTab === 'payments' && (
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-[#E4572E]" />
                  Real-Time Razorpay Collections
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Connected directly to your Live Razorpay Key ({keyIdPreview})
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Total Captured:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {loadingPayments ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#E4572E]" />
                        Fetching live Razorpay payments...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No payments found yet on your configured Razorpay account.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {p.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-semibold">{p.email}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{p.description}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-mono">
                          {p.contact}
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-white text-sm">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'captured' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : p.status === 'failed' 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-400 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: USER ACCOUNTS & WALLET CONTROL ── */}
        {activeTab === 'users' && (
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users size={20} className="text-[#E4572E]" />
                  User Logins & Wallet Control
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Direct management: Edit, add, deduct, or reset any user's balance whenever you want
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E4572E] transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">User UUID</th>
                    <th className="py-3 px-4 text-right">Current Balance</th>
                    <th className="py-3 px-4 text-center">Account Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#E4572E]" />
                        Loading user accounts...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        No accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOwner = u.id === sessionUser.id || u.email === 'fivenest.india@gmail.com';
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center font-bold text-white text-xs">
                                {u.name[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">{u.name}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                            {u.id}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-extrabold text-base text-emerald-400">
                              ₹{u.balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isOwner ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E4572E]/15 text-[#E4572E] border border-[#E4572E]/30">
                                Primary Owner
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10">
                                Client
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditBalanceValue(u.balance.toString());
                                setEditNote('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#E4572E]/15 hover:bg-[#E4572E]/25 text-[#E4572E] border border-[#E4572E]/30 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Edit3 size={13} />
                              <span>Edit Wallet</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: STUDIO EXPORT & TRANSACTION LEDGER ── */}
        {activeTab === 'exports' && (
          <div className="bg-[#0F1422] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Receipt size={20} className="text-[#E4572E]" />
                  Production Export & Credit Ledger
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Complete audit history of wallet charges, topups, and sublimation print jobs
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/30 border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#E4572E]" />
                        Loading ledger activity...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400">
                        No ledger transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => {
                      const isCredit = t.transaction_type === 'topup' || t.transaction_type === 'admin_credit';
                      return (
                        <tr key={t.id || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCredit 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}>
                              {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                              {t.transaction_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                            {t.user_id}
                          </td>
                          <td className="py-3.5 px-4 text-white font-medium">
                            {t.description}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-extrabold text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {isCredit ? '+' : '-'}₹{t.amount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-400 whitespace-nowrap">
                            {new Date(t.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── WALLET EDIT MODAL ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1422] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Coins size={18} className="text-[#E4572E]" />
                Modify Client Wallet Balance
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Target Client:</div>
                <div className="text-sm font-bold text-white">{editingUser.name}</div>
                <div className="text-[11px] font-mono text-gray-400">{editingUser.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Current Balance:</div>
                <div className="text-base font-extrabold text-emerald-400">₹{editingUser.balance.toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Set Exact New Balance (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editBalanceValue}
                    onChange={(e) => setEditBalanceValue(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-[#E4572E] transition-all"
                  />
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditBalanceValue('0')}
                  className="flex-1 py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold"
                >
                  Reset to ₹0
                </button>
                <button
                  type="button"
                  onClick={() => setEditBalanceValue((editingUser.balance + 100).toString())}
                  className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold"
                >
                  +₹100
                </button>
                <button
                  type="button"
                  onClick={() => setEditBalanceValue((editingUser.balance + 500).toString())}
                  className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold"
                >
                  +₹500
                </button>
                <button
                  type="button"
                  onClick={() => setEditBalanceValue((editingUser.balance + 1000).toString())}
                  className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold"
                >
                  +₹1000
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Audit Reason / Ledger Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer promo credit, Refund, Manual calibration"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#E4572E] transition-all"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingWallet}
                  onClick={handleSaveWalletAdjustment}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#E4572E] to-[#EA580C] text-white font-extrabold rounded-xl text-xs shadow-lg shadow-[#E4572E]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingWallet ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Balance</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
