import { useState, useEffect } from 'react';
import { 
  Building2, Package, Users as UsersIcon, Palette, Sliders, Printer, Receipt, 
  TrendingUp, Wallet, Settings, ArrowLeft, Sun, Moon, Menu, X, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, fetchUserWallet } from '../lib/supabaseClient';
import { FactoryDashboard } from '../components/studio/factoryDashboard';
import { FactoryOrders } from '../components/studio/factoryOrders';
import { FactoryCustomers } from '../components/studio/factoryCustomers';
import { FactoryProduction } from '../components/studio/factoryProduction';
import { FactoryPrintQueue } from '../components/studio/factoryPrintQueue';
import { FactoryReports } from '../components/studio/factoryReports';
import { FactorySettings } from '../components/studio/factorySettings';
import { Designer, defaultDesignConfig } from '../components/studio/designer';
import type { ArtDesignConfig } from '../components/studio/designer';
import { OrderEntry } from '../components/studio/orderEntry';
import type { PlayerRecord, OrderMetadata } from '../components/studio/orderEntry';
import { SizesDb, defaultSizes } from '../components/studio/sizesDb';
import type { SizeDatabase } from '../components/studio/sizesDb';
import { NestingView } from '../components/studio/nestingView';
import { HelpCenter } from '../components/studio/helpCenter';
import { LoginModal } from '../components/studio/loginModal';
import { BillingSystem, syncOrderToBillingRecords } from '../components/studio/billingSystem';

export default function WebStudio() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fivenest_studio_theme');
    return (saved === 'light') ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fivenest_studio_theme', themeMode);
  }, [themeMode]);

  // Default home tab is now "dashboard" (Today's Factory)
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'customers' | 'templates' | 'production' | 'printQueue' | 'billing' | 'reports' | 'wallet' | 'settings'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Roster records state
  const [records, setRecords] = useState<PlayerRecord[]>([]);

  // Job metadata details
  const [metadata, setMetadata] = useState<OrderMetadata>({
    customerName: "ABC Sports Manufacturers",
    orderNum: "5412",
    blankKit: false,
    a4BackPrint: false,
    raglanStyle: false,
    halfSleeveMerge: false,
    manualMode: false
  });

  const [sizeDB, setSizeDB] = useState<SizeDatabase>(defaultSizes);

  // Authentication & billing states
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; balance: number } | null>(null);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Auto-sync active roster order into user-scoped Billing System
  useEffect(() => {
    if (records && records.length > 0) {
      syncOrderToBillingRecords(records, metadata, currentUser?.email);
    }
  }, [records, metadata, currentUser]);

  useEffect(() => {
    const saved = localStorage.getItem('teedex_size_database');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSizeDB(parsed);
      } catch (e) {
        console.error("Failed to parse saved size database", e);
      }
    }

    const savedTestMode = localStorage.getItem('fivenest_test_mode');
    if (savedTestMode) {
      try {
        setTestMode(JSON.parse(savedTestMode));
      } catch (e) {}
    }

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

    // Client-side anti-piracy protections
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'CANVAS' || target.closest('.canvas-container'))) {
        e.preventDefault();
      }
    };

    const handleKeyDownGuard = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))
      ) {
        if (import.meta.env.PROD) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDownGuard);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDownGuard);
    };
  }, []);

  const [designConfig, setDesignConfig] = useState<ArtDesignConfig>(defaultDesignConfig);
  const totalQty = records.reduce((acc, r) => acc + r.qty, 0);

  const factoryModules = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'customers', label: 'Customers', icon: UsersIcon },
    { id: 'templates', label: 'Templates & Artwork', icon: Palette },
    { id: 'production', label: 'Production', icon: Sliders },
    { id: 'printQueue', label: 'Print Queue', icon: Printer },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`app-layout ${themeMode}`}>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-black/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="FiveNest Logo" className="w-6 h-6 object-contain" />
          <span className="font-extrabold text-white text-base">FiveNest Factory OS</span>
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

      {/* Mobile Horizontal Scrollable Module Bar */}
      <div className="md:hidden flex items-center gap-2 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar scroll-smooth sticky top-[53px] z-30">
        {factoryModules.map((m) => {
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
                <span className="sidebar-version text-cyan-400 font-bold" style={{ fontSize: '10px' }}>Factory OS</span>
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
            {factoryModules.map((m) => {
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

            <Link 
              to="/" 
              className="menu-item"
              style={{ 
                marginTop: '16px', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '16px',
                color: 'var(--color-primary)',
                fontWeight: '600'
              }}
            >
              <ArrowLeft size={18} />
              Return to Website
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="glass-card" style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.04)', borderColor: 'var(--border-active)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>FACTORY OPERATING SYSTEM</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Pay-As-You-Go Active.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'dashboard' && "📊 Today's Factory Dashboard"}
            {activeTab === 'orders' && "📋 Factory Orders Hub"}
            {activeTab === 'customers' && "👥 Customer Memory CRM"}
            {activeTab === 'templates' && "📐 Sublimation Templates & Artwork Setup"}
            {activeTab === 'production' && "⚙️ Production Floor Bottleneck Tracker"}
            {activeTab === 'printQueue' && "🖨️ Live 300 DPI Print Queue"}
            {activeTab === 'billing' && "🧾 Multi-User Invoices & Billing"}
            {activeTab === 'reports' && "📈 Factory Analytics & Revenue Reports"}
            {activeTab === 'wallet' && "💳 Pay-As-You-Go Wallet Balance"}
            {activeTab === 'settings' && "⚙️ Factory OS Configuration & Bleeds"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              onNavigateTab={(tab) => setActiveTab(tab as any)}
              walletBalance={currentUser ? currentUser.balance : 2450}
            />
          )}

          {activeTab === 'orders' && (
            <FactoryOrders 
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {activeTab === 'customers' && (
            <FactoryCustomers />
          )}

          {activeTab === 'templates' && (
            <Designer 
              designConfig={designConfig} 
              onDesignConfigChange={setDesignConfig} 
              metadata={metadata}
            />
          )}

          {activeTab === 'production' && (
            <FactoryProduction />
          )}

          {activeTab === 'printQueue' && (
            <FactoryPrintQueue />
          )}

          {activeTab === 'billing' && (
            <BillingSystem 
              records={records}
              metadata={metadata}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'reports' && (
            <FactoryReports />
          )}

          {activeTab === 'wallet' && (
            <NestingView 
              records={records}
              metadata={metadata}
              sizeDB={sizeDB}
              designConfig={designConfig}
              currentUser={currentUser}
              testMode={testMode}
              onUserChange={setCurrentUser}
              onOpenLogin={() => setLoginModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <FactorySettings />
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
