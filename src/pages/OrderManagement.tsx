import { useState, useEffect } from 'react';
import { 
  Building2, Package, Users as UsersIcon, Receipt, TrendingUp, Wallet, 
  ArrowLeft, Sun, Moon, Menu, X, Award, Palette, ExternalLink, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, fetchUserWallet } from '../lib/supabaseClient';
import { FactoryDashboard } from '../components/studio/factoryDashboard';
import { FactoryOrders } from '../components/studio/factoryOrders';
import { FactoryCustomers } from '../components/studio/factoryCustomers';
import { FactoryReports } from '../components/studio/factoryReports';
import { BillingSystem } from '../components/studio/billingSystem';
import { LoginModal } from '../components/studio/loginModal';
import { LocalDataManager } from '../components/studio/localDataManager';
import type { PlayerRecord, OrderMetadata } from '../components/studio/orderEntry';

export default function OrderManagement() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fivenest_studio_theme');
    return (saved === 'light') ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fivenest_studio_theme', themeMode);
  }, [themeMode]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'billing' | 'reports'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; balance: number } | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Sample order metadata for billing sync
  const [records, setRecords] = useState<PlayerRecord[]>([]);
  const [metadata, setMetadata] = useState<OrderMetadata>({
    customerName: "ABC Sports Manufacturers",
    orderNum: "5412",
    blankKit: false,
    a4BackPrint: false,
    raglanStyle: false,
    halfSleeveMerge: false,
    manualMode: false
  });
  // Central user-scoped orders state for live Dashboard sync
  const ordersStorageKey = currentUser?.email ? `fivenest_factory_orders_${currentUser.email}` : 'fivenest_factory_orders_default';

  const [orders, setOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem(ordersStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    const saved = localStorage.getItem(ordersStorageKey);
    if (saved) {
      try { setOrders(JSON.parse(saved)); } catch (e) { setOrders([]); }
    } else {
      setOrders([]);
    }
  }, [ordersStorageKey]);

  const handleOrdersChange = (newOrders: any[]) => {
    setOrders(newOrders);
    localStorage.setItem(ordersStorageKey, JSON.stringify(newOrders));
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const details = await fetchUserWallet(session.user.id);
        setCurrentUser({
          email: session.user.email || '',
          name: details.name,
          balance: details.balance
        });
      } else {
        setCurrentUser(null);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const details = await fetchUserWallet(session.user.id);
        setCurrentUser({
          email: session.user.email || '',
          name: details.name,
          balance: details.balance
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const orderModules = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: Building2 },
    { id: 'orders', label: 'Order Management', icon: Package },
    { id: 'billing', label: 'Invoices & Billing', icon: Receipt },
    { id: 'customers', label: 'Customer Memory CRM', icon: UsersIcon },
    { id: 'reports', label: 'Factory Analytics', icon: TrendingUp },
  ];

  return (
    <div className={`app-layout ${themeMode}`}>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-black/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="FiveNest Logo" className="w-6 h-6 object-contain" />
          <span className="font-extrabold text-white text-base">FiveNest Orders</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="md:hidden flex items-center gap-2 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar scroll-smooth sticky top-[53px] z-30">
        {orderModules.map((m) => {
          const Icon = m.icon;
          const isActive = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-slate-300 border border-white/5'
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Sidebar Navigation Drawer */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', cursor: 'pointer', padding: 0 }}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.svg" alt="FiveNest" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '18px', fontWeight: '800' }}>FiveNest</span>
                </div>
                <span className="sidebar-version text-cyan-400 font-bold" style={{ fontSize: '10px' }}>Order & Billing Portal</span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-white/5 text-white"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="sidebar-menu">
            {orderModules.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <div
                  key={m.id}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(m.id as any);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon size={18} />
                  {m.label}
                </div>
              );
            })}

            {/* Direct Switch to Production Studio */}
            <Link 
              to="/studio" 
              className="menu-item"
              style={{ 
                marginTop: '16px', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '16px',
                color: 'var(--color-secondary)',
                fontWeight: '700'
              }}
            >
              <Palette size={18} />
              Open Production Studio
            </Link>

            <Link 
              to="/" 
              className="menu-item"
              style={{ 
                color: 'var(--text-muted)',
                fontWeight: '500'
              }}
            >
              <ArrowLeft size={18} />
              Return to Main Website
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Save / Restore Local Data */}
          <LocalDataManager />

          <div className="glass-card" style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.04)', borderColor: 'var(--border-active)', textAlign: 'left', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>ORDER & BILLING PORTAL</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Customer CRM & Invoicing Active.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'dashboard' && "📊 Factory Dashboard Overview"}
            {activeTab === 'orders' && "📋 Order Management Hub"}
            {activeTab === 'billing' && "🧾 Multi-User Invoices & Billing System"}
            {activeTab === 'customers' && "👥 Customer Memory CRM"}
            {activeTab === 'reports' && "📈 Factory Analytics & Revenue Reports"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Shortcut Button to Open Production Studio */}
            <Link to="/studio">
              <button 
                className="btn btn-primary"
                style={{ padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Palette size={14} /> Open Production Studio
              </button>
            </Link>

            {/* Save / Restore local data compact button */}
            <LocalDataManager compact />

            {currentUser ? (
              <div 
                className="user-wallet-pill"
                onClick={() => setLoginModalOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(0, 229, 255, 0.08)', 
                  border: '1px solid var(--border-active)', 
                  padding: '6px 12px', 
                  borderRadius: '30px', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                <span style={{ color: 'white' }}>{currentUser.name.split(' ')[0]}</span>
                <span style={{ color: 'var(--color-status-success)', fontWeight: 'bold' }}>₹{currentUser.balance.toFixed(2)}</span>
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={() => setLoginModalOpen(true)}
                style={{ padding: '6px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: 'bold' }}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <section className="content-body">
          {activeTab === 'dashboard' && (
            <FactoryDashboard 
              orders={orders}
              currentUser={currentUser}
              onNavigateTab={(tab) => {
                if (tab === 'templates' || tab === 'printQueue') {
                  window.location.href = '/studio';
                } else {
                  setActiveTab(tab as any);
                }
              }}
              walletBalance={currentUser ? currentUser.balance : 2450}
            />
          )}

          {activeTab === 'orders' && (
            <FactoryOrders 
              currentUserEmail={currentUser?.email}
              orders={orders}
              onOrdersChange={handleOrdersChange}
              onNavigateTab={(tab) => {
                if (tab === 'printQueue') {
                  window.location.href = '/studio';
                } else {
                  setActiveTab(tab as any);
                }
              }}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSystem 
              records={records}
              metadata={metadata}
              currentUser={currentUser}
              orders={orders}
            />
          )}

          {activeTab === 'customers' && (
            <FactoryCustomers currentUserEmail={currentUser?.email} />
          )}

          {activeTab === 'reports' && (
            <FactoryReports orders={orders} />
          )}
        </section>
      </main>

      {/* Login Modal */}
      {loginModalOpen && (
        <LoginModal 
          onClose={() => setLoginModalOpen(false)} 
          onLoginStateChange={setCurrentUser}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
