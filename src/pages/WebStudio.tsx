import { useState, useEffect } from 'react';
import { Palette, Users, Ruler, Sliders, Sparkles, ArrowLeft, Sun, Moon, Menu, X, Award, ExternalLink, Package } from 'lucide-react';
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


export default function WebStudio() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fivenest_studio_theme');
    return (saved === 'light') ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fivenest_studio_theme', themeMode);
  }, [themeMode]);

  // Production Studio tabs for designers & printers ONLY
  const [activeTab, setActiveTab] = useState<'designer' | 'order' | 'nesting' | 'help'>('designer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sizeEditorOpen, setSizeEditorOpen] = useState<boolean>(false);

  // Roster records state
  const [records, setRecords] = useState<PlayerRecord[]>([]);

  // Job metadata details
  const [metadata, setMetadata] = useState<OrderMetadata>({
    customerName: "",
    orderNum: "01",
    blankKit: false,
    a4BackPrint: false,
    raglanStyle: false,
    halfSleeveMerge: true,
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
    { id: 'designer', label: 'Artwork', icon: Palette },
    { id: 'order', label: 'Job Details', icon: Users },
    { id: 'nesting', label: 'Export', icon: Sliders },
    { id: 'help', label: 'AI Refiner', icon: Sparkles },
  ];

  return (
    <div className={`app-layout ${themeMode}`} style={{ background: '#060813', position: 'relative' }}>
      {/* Fixed full-screen ambient gradient background — gives glassmorphism panels something to blur through */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 8% 15%, rgba(0, 229, 255, 0.22) 0%, transparent 55%), radial-gradient(ellipse 55% 50% at 92% 85%, rgba(124, 58, 237, 0.28) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), radial-gradient(ellipse 30% 25% at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 55%)',
      }} />

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
      <aside 
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(6, 9, 20, 0.45)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '1px solid rgba(0, 229, 255, 0.15)',
          boxShadow: '4px 0 40px rgba(0, 0, 0, 0.6), inset -1px 0 0 rgba(0, 229, 255, 0.15)'
        }}
      >
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

          <nav className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 12px' }}>
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
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: isActive ? '800' : '600',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: isActive ? '1px solid rgba(0, 229, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive ? '0 6px 24px rgba(0, 229, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none'
                  }}
                >
                  {isActive && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        bottom: '15%',
                        width: '4px',
                        borderRadius: '0 4px 4px 0',
                        background: 'linear-gradient(180deg, #00e5ff 0%, #7c3aed 100%)',
                        boxShadow: '0 0 12px #00e5ff, 0 0 20px rgba(0, 229, 255, 0.6)'
                      }}
                    />
                  )}
                  <Icon 
                    size={18} 
                    style={{ 
                      color: isActive ? '#00e5ff' : '#64748b',
                      filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))' : 'none',
                      transition: 'all 0.2s ease'
                    }} 
                  />
                  <span>{t.label}</span>
                </div>
              );
            })}

            {/* Direct Switch to Order Management Portal */}
            <Link 
              to="/orders" 
              className="menu-item"
              style={{ 
                marginTop: '12px', 
                padding: '11px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#facc15',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <Package size={18} style={{ color: '#facc15', filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }} />
              Order & Billing Portal
            </Link>

            <Link 
              to="/" 
              className="menu-item"
              style={{ 
                padding: '10px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#64748b',
                fontWeight: '600',
                fontSize: '12px',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={16} />
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
      <main className="main-content" style={{ position: 'relative', zIndex: 10, background: 'transparent' }}>
        <header 
          className="top-navbar"
          style={{
            background: 'rgba(6, 9, 20, 0.45)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderBottom: '1px solid rgba(0, 229, 255, 0.18)',
            boxShadow: '0 1px 0 rgba(0, 229, 255, 0.12), 0 4px 24px rgba(0,0,0,0.5)'
          }}
        >
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'designer' && "🎨 Artwork & Overlays"}
            {activeTab === 'order' && "📋 Job Details"}
            {activeTab === 'sizes' && "📐 Size Grading"}
            {activeTab === 'nesting' && "⚙️ Nesting & Export"}
            {activeTab === 'help' && "✨ AI Data Refiner"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Direct Switch to Order Management Portal */}
            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <button 
                className="btn btn-secondary"
                style={{ 
                  padding: '5px 12px', 
                  borderRadius: '9999px', 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(0, 229, 255, 0.25)',
                  color: 'var(--accent-cyan)'
                }}
              >
                <Package size={13} /> Orders
              </button>
            </Link>

            {/* Test Mode Toggle */}
            <label className="test-mode-toggle" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              cursor: 'pointer', 
              fontSize: '11px', 
              background: testMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.04)', 
              padding: '5px 12px', 
              borderRadius: '9999px', 
              border: testMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.08)',
              userSelect: 'none',
              transition: 'all 0.2s ease'
            }}>
              <input 
                type="checkbox" 
                checked={testMode} 
                onChange={(e) => handleTestModeChange(e.target.checked)} 
                style={{ display: 'none' }} 
              />
              <span style={{ color: testMode ? '#f59e0b' : 'var(--text-muted)', fontWeight: '800' }}>
                {testMode ? "🧪 Test" : "⚡ Live"}
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
                  background: 'rgba(15, 23, 42, 0.65)', 
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 229, 255, 0.3)', 
                  padding: '5px 14px', 
                  borderRadius: '9999px', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                <span style={{ color: '#ffffff' }}>{currentUser.name.split(' ')[0]}</span>
                <span style={{ color: '#4ade80', fontWeight: '800' }}>₹{currentUser.balance.toFixed(2)}</span>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setLoginModalOpen(true)}
                style={{ padding: '5px 14px', borderRadius: '9999px', fontSize: '11px', fontWeight: '800' }}
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
              onOpenSizeEditor={() => setSizeEditorOpen(true)}
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

      {/* Size Editor Popup Modal */}
      {sizeEditorOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSizeEditorOpen(false); }}
        >
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: '12px', width: '100%', maxWidth: '920px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,229,255,0.04)' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>📐 Size Grading Editor</span>
              <button onClick={() => setSizeEditorOpen(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '700' }}>✕</button>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <SizesDb onDatabaseChange={handleSizeDatabaseChange} />
            </div>
          </div>
        </div>
      )}

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
