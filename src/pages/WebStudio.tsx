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
    <div className={`app-layout ${themeMode}`}>

      <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-[#E2DED7] sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="FiveNest Logo" className="w-6 h-6 object-contain" />
          <span className="font-extrabold text-[#171717] text-base">FiveNest Production</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-[#E2DED7] text-[#171717]"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="md:hidden flex items-center gap-2 p-2 bg-white border-b border-[#E2DED7] overflow-x-auto no-scrollbar scroll-smooth sticky top-[53px] z-30">
        {productionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#E4572E] text-white'
                  : 'bg-[#F5F3EF] text-[#686661] border border-[#D8D5CF]'
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
        style={{ background: '#FFFFFF', borderRight: '1px solid #E2DED7', position: 'relative', zIndex: 10 }}
      >
        <div>
          <div className="flex items-center justify-between p-4 border-b border-[#E8E4DE]">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', cursor: 'pointer', padding: 0 }}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.svg" alt="FiveNest" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#171717' }}>FiveNest Studio</span>
                </div>
                <span className="sidebar-version" style={{ color: '#E4572E', fontSize: '10px', fontWeight: '600' }}>Production Engine</span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-black/5 text-[#171717]"
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
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 'normal',
                    color: isActive ? '#171717' : '#686661',
                    background: isActive ? '#F1EFEB' : 'transparent',
                    border: 'none',
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
                        background: '#E4572E'
                      }}
                    />
                  )}
                  <Icon 
                    size={18} 
                    style={{ 
                      color: isActive ? '#E4572E' : '#92908A',
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
                padding: '9px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#FFF3EF',
                border: '1px solid #F5C4B2',
                color: '#C94725',
                fontWeight: '600',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Package size={18} style={{ color: '#C94725' }} />
              Order & Billing Portal
            </Link>

            <Link 
              to="/" 
              className="menu-item"
              style={{ 
                padding: '9px 12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: '1px solid rgba(23,23,23,0.08)',
                color: '#92908A',
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
          <div style={{ padding: '12px', background: '#F5F3EF', border: '1px solid #E8E4DE', borderRadius: '10px', textAlign: 'left', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={14} style={{ color: '#E4572E' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#E4572E' }}>PRODUCTION STUDIO</span>
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
          style={{ background: '#FFFFFF', borderBottom: '1px solid #E2DED7' }}
        >
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'designer' && "Artwork & Overlays"}
            {activeTab === 'order' && "Job Details"}
            {activeTab === 'sizes' && "Size Grading"}
            {activeTab === 'nesting' && "Nesting & Export"}
            {activeTab === 'help' && "AI Data Refiner"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Direct Switch to Order Management Portal */}
            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <button 
                className="btn btn-secondary"
                style={{ padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', border: '1px solid #D0CCC5', color: '#242321' }}
              >
                <Package size={13} /> Orders
              </button>
            </Link>

            {/* Test Mode Toggle */}
            <label className="test-mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', background: testMode ? '#FBF2DC' : '#F5F3EF', padding: '5px 11px', borderRadius: '7px', border: testMode ? '1px solid #D4B76A' : '1px solid #D8D5CF', userSelect: 'none', transition: 'all 0.15s ease' }}>
              <input 
                type="checkbox" 
                checked={testMode} 
                onChange={(e) => handleTestModeChange(e.target.checked)} 
                style={{ display: 'none' }} 
              />
              <span style={{ color: testMode ? '#A87519' : '#686661', fontWeight: '800' }}>
                {testMode ? "🧪 Test" : "⚡ Live"}
              </span>
            </label>

            {/* Profile / Wallet Control Button */}
            {currentUser ? (
              <div 
                className="user-wallet-pill"
                onClick={() => setLoginModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #D0CCC5', padding: '5px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
              >
                <span style={{ color: '#171717' }}>{currentUser.name.split(' ')[0]}</span>
                <span style={{ color: '#2F7D5C', fontWeight: '800' }}>₹{currentUser.balance.toFixed(2)}</span>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setLoginModalOpen(true)}
                style={{ padding: '5px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: '700', background: '#E4572E', color: '#FFFFFF', border: '1px solid #E4572E', cursor: 'pointer' }}
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
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(23,23,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSizeEditorOpen(false); }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #DDD9D2', borderRadius: '12px', width: '100%', maxWidth: '920px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E8E4DE', background: '#F5F3EF' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#171717' }}>Size Grading Editor</span>
              <button onClick={() => setSizeEditorOpen(false)} style={{ background: '#FFFFFF', border: '1px solid #D0CCC5', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', color: '#242321', fontSize: '14px', fontWeight: '700' }}>✕</button>
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
