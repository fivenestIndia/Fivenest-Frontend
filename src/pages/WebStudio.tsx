import { useState, useEffect } from 'react';
import { Palette, Users, Ruler, Sliders, HelpCircle, ArrowLeft, Sun, Moon, Menu, X, Award, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, fetchUserWallet } from '../lib/supabaseClient';
import { Designer, defaultDesignConfig } from '../components/studio/designer';
import type { ArtDesignConfig } from '../components/studio/designer';
import { OrderEntry } from '../components/studio/orderEntry';
import type { PlayerRecord, OrderMetadata } from '../components/studio/orderEntry';
import { SizesDb, defaultSizes } from '../components/studio/sizesDb';
import type { SizeDatabase } from '../components/studio/sizesDb';
import { NestingView } from '../components/studio/nestingView';
import { HelpCenter } from '../components/studio/helpCenter';
import { LoginModal } from '../components/studio/loginModal';
import { LocalDataManager } from '../components/studio/localDataManager';

export default function WebStudio() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fivenest_studio_theme');
    return (saved === 'light') ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fivenest_studio_theme', themeMode);
  }, [themeMode]);

  // Production Studio tabs for designers & printers ONLY
  const [activeTab, setActiveTab] = useState<'designer' | 'order' | 'sizes' | 'nesting' | 'help'>('designer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Roster records state
  const [records, setRecords] = useState<PlayerRecord[]>([]);

  // Job metadata details
  const [metadata, setMetadata] = useState<OrderMetadata>({
    customerName: "",
    orderNum: "01",
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

  const handleSizeDatabaseChange = (newDb: SizeDatabase) => {
    setSizeDB(newDb);
  };

  const handleRosterImport = (imported: PlayerRecord[]) => {
    setRecords(imported);
    setActiveTab('order');
  };

  const handleTestModeChange = (val: boolean) => {
    setTestMode(val);
    localStorage.setItem('fivenest_test_mode', JSON.stringify(val));
    window.dispatchEvent(new Event('storage-preference-changed'));
  };

  const productionTabs = [
    { id: 'designer', label: 'Artwork Setup', icon: Palette },
    { id: 'order', label: 'Roster & Details', icon: Users },
    { id: 'sizes', label: 'Grading Sizes', icon: Ruler },
    { id: 'nesting', label: 'Nesting & Export', icon: Sliders },
    { id: 'help', label: 'Help & AI Refine', icon: HelpCircle },
  ];

  return (
    <div className={`app-layout ${themeMode}`}>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-black/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="FiveNest Logo" className="w-6 h-6 object-contain" />
          <span className="font-extrabold text-white text-base">FiveNest Production</span>
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
        {productionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 text-slate-300 border border-white/5'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sidebar Navigation Panel (Responsive Drawer) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', cursor: 'pointer', padding: 0 }}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.svg" alt="FiveNest" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '18px', fontWeight: '800' }}>FiveNest Studio</span>
                </div>
                <span className="sidebar-version text-cyan-400 font-bold" style={{ fontSize: '10px' }}>Production Engine</span>
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
            {productionTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <div
                  key={t.id}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(t.id as any);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon size={18} />
                  {t.label}
                </div>
              );
            })}

            {/* Direct Switch to Order Management Portal */}
            <Link 
              to="/orders" 
              className="menu-item"
              style={{ 
                marginTop: '16px', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '16px',
                color: 'var(--color-secondary)',
                fontWeight: '700'
              }}
            >
              <Package size={18} />
              Order & Billing Portal
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
              Return to Website
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Theme:</span>
            <button 
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-light)',
                borderRadius: '20px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              {themeMode === 'dark' ? (
                <>
                  <Moon size={12} style={{ color: 'var(--color-primary)' }} />
                  Dark
                </>
              ) : (
                <>
                  <Sun size={12} style={{ color: 'var(--color-secondary)' }} />
                  Light
                </>
              )}
            </button>
          </div>

          {/* Save / Restore Local Data */}
          <LocalDataManager />

          <div className="glass-card" style={{ padding: '12px', background: 'rgba(155, 77, 255, 0.04)', borderColor: 'var(--border-active)', textAlign: 'left', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>PRODUCTION STUDIO</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sublimation Plotter RIP Active.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--text-primary)' }}>
              <span>Total Panels Qty:</span>
              <span style={{ fontWeight: 'bold' }}>{totalQty}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'designer' && "🎨 Step 1: Sublimation Artwork & Overlays"}
            {activeTab === 'order' && "📋 Step 2: Order Details & Player Roster"}
            {activeTab === 'sizes' && "📐 Step 3: Size grading dimensions database"}
            {activeTab === 'nesting' && "⚙️ Step 4: Nesting Engine & Panel Export"}
            {activeTab === 'help' && "🤖 Help Center & AI Smart Roster Refiner"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Direct Switch to Order Management Portal */}
            <Link to="/orders">
              <button 
                className="btn btn-secondary"
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '30px', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderColor: 'rgba(0, 229, 255, 0.4)',
                  color: 'var(--color-secondary)'
                }}
              >
                <Package size={14} /> Order Management (/orders)
              </button>
            </Link>

            {/* Test Mode Toggle */}
            <label className="test-mode-toggle" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer', 
              fontSize: '11px', 
              background: testMode ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255,255,255,0.03)', 
              padding: '6px 12px', 
              borderRadius: '30px', 
              border: testMode ? '1px solid var(--color-secondary)' : '1px solid var(--border-light)',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}>
              <input 
                type="checkbox" 
                checked={testMode} 
                onChange={(e) => handleTestModeChange(e.target.checked)} 
                style={{ display: 'none' }} 
              />
              <span style={{ color: testMode ? 'var(--color-secondary)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                {testMode ? "🧪 Test Mode" : "⚡ Production Mode"}
              </span>
            </label>

            {/* Profile / Wallet Control Button */}
            {currentUser ? (
              <div 
                className="user-wallet-pill"
                onClick={() => setLoginModalOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(155, 77, 255, 0.08)', 
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

        <section className="content-body" style={activeTab === 'designer' ? { padding: 0, height: 'calc(100vh - 53px)', overflow: 'hidden' } : undefined}>
          {activeTab === 'designer' && (
            <Designer 
              designConfig={designConfig} 
              onDesignConfigChange={setDesignConfig} 
              metadata={metadata}
            />
          )}

          {activeTab === 'order' && (
            <OrderEntry 
              records={records} 
              onRecordsChange={setRecords}
              metadata={metadata}
              onMetadataChange={setMetadata}
              availableSizes={Object.keys(sizeDB)}
            />
          )}

          {activeTab === 'sizes' && (
            <SizesDb 
              onDatabaseChange={handleSizeDatabaseChange} 
            />
          )}

          {activeTab === 'nesting' && (
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

          {activeTab === 'help' && (
            <HelpCenter 
              onImportRecords={handleRosterImport}
            />
          )}
        </section>
      </main>

      {/* Login Modal Overlay */}
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
