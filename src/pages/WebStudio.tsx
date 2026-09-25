import React, { useState, useEffect, useRef } from 'react';
import { Palette, Users, Ruler, Sliders, Sparkles, Sun, Moon, Menu, X, Award, ExternalLink, Package, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, fetchUserWallet } from '../lib/supabaseClient';
import { Designer, defaultDesignConfig } from '../components/studio/designer';
import type { ArtDesignConfig } from '../components/studio/designer';
import { OrderEntry } from '../components/studio/orderEntry';
import type { PlayerRecord, OrderMetadata } from '../components/studio/orderEntry';
import { SizesDb, defaultSizes } from '../components/studio/sizesDb';
import type { SizeDatabase } from '../components/studio/sizesDb';
import { NestingView, type NestingViewHandle } from '../components/studio/nestingView';
import { MobileStudioView } from '../components/studio/MobileStudioView';
import { HelpCenter } from '../components/studio/helpCenter';
import { BillingSystem } from '../components/studio/billingSystem';
import { LoginModal } from '../components/studio/loginModal';


export default function WebStudio() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fivenest_studio_theme');
    return (saved === 'dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('fivenest_studio_theme', themeMode);
  }, [themeMode]);

  // Production Studio tabs for designers & printers ONLY
  const [activeTab, setActiveTab] = useState<'designer' | 'order' | 'sizes' | 'nesting' | 'help' | 'billing'>('designer');
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
    manualMode: false,
    whatsapp: "",
    fileName: ""
  });

  const [sizeDB, setSizeDB] = useState<SizeDatabase>(defaultSizes);

  // Authentication & billing states
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; balance: number; id?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('fivenest_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const details = await fetchUserWallet(session.user.id);
          const updated = {
            id: session.user.id,
            email: session.user.email || '',
            name: details.name || session.user.user_metadata?.name || (session.user.email ? session.user.email.split('@')[0] : 'User'),
            balance: details.balance
          };
          setCurrentUser(updated);
          localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn("Session check fallback to cached user", e);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const details = await fetchUserWallet(session.user.id);
          const updated = {
            id: session.user.id,
            email: session.user.email || '',
            name: details.name || session.user.user_metadata?.name || (session.user.email ? session.user.email.split('@')[0] : 'User'),
            balance: details.balance
          };
          setCurrentUser(updated);
          localStorage.setItem('fivenest_active_user', JSON.stringify(updated));
        } catch (e) {}
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('fivenest_active_user');
      }
    });

    const handleUserUpdated = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('fivenest_user_updated', handleUserUpdated);

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
      window.removeEventListener('fivenest_user_updated', handleUserUpdated);
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
    { id: 'designer', step: 1, label: 'Step 1: Artwork', icon: Palette },
    { id: 'order', step: 2, label: 'Step 2: Job Details', icon: Users },
    { id: 'nesting', step: 3, label: 'Step 3: Export', icon: Sliders },
    { id: 'help', step: null, label: 'AI Data Refiner', icon: Sparkles },
    { id: 'billing', step: null, label: 'Invoice & Bill', icon: ReceiptText },
  ];

  const mobileNestingRef = useRef<NestingViewHandle>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <>
        <MobileStudioView
          records={records}
          onRecordsChange={setRecords}
          metadata={metadata}
          onMetadataChange={setMetadata}
          designConfig={designConfig}
          onDesignConfigChange={setDesignConfig}
          sizeDB={sizeDB}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          testMode={testMode}
          onTestModeChange={handleTestModeChange}
          onOpenLogin={() => setLoginModalOpen(true)}
          nestingRef={mobileNestingRef}
        />
        {/* Hidden NestingView instance to provide full high-res PDF/ZIP rendering and billing execution */}
        <div style={{ display: 'none' }} aria-hidden="true">
          <NestingView
            ref={mobileNestingRef}
            records={records}
            metadata={metadata}
            sizeDB={sizeDB}
            designConfig={designConfig}
            currentUser={currentUser}
            testMode={testMode}
            onUserChange={setCurrentUser}
            onOpenLogin={() => setLoginModalOpen(true)}
            onGoToArtwork={() => {}}
          />
        </div>
        {loginModalOpen && (
          <LoginModal 
            onClose={() => setLoginModalOpen(false)} 
            onLoginStateChange={setCurrentUser}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

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
                  ? 'bg-[#E4572E] text-white shadow-sm'
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
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '15px',
                    boxShadow: '0 2px 8px rgba(228,87,46,0.25)',
                    flexShrink: 0
                  }}>
                    F
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#171717', letterSpacing: '-0.02em' }}>FiveNest Studio</span>
                </div>
                <span className="sidebar-version" style={{ color: '#E4572E', fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Production Engine</span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-black/5 text-[#171717]"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 12px' }}>
            {productionTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const isStep = t.step !== null;

              return (
                <div
                  key={t.id}
                  className={`menu-item ${isActive ? (isStep ? 'active step-shimmer-active' : 'active') : ''}`}
                  onClick={() => {
                    setActiveTab(t.id as any);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#171717' : '#686661',
                    background: isActive ? (isStep ? '#FFF0EB' : '#F1EFEB') : 'transparent',
                    border: isActive && isStep ? '1px solid #FCD7C8' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none'
                  }}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeSidebarIndicator"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        bottom: '15%',
                        width: '4px',
                        borderRadius: '0 4px 4px 0',
                        background: '#E4572E',
                        boxShadow: isStep ? '0 0 8px rgba(228,87,46,0.45)' : 'none'
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon 
                    size={18} 
                    style={{ 
                      color: isActive ? '#E4572E' : '#92908A',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }} 
                  />
                  <span>{t.label}</span>
                </div>
              );
            })}
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
            {activeTab === 'billing' && "Invoice & Bill"}
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
              onGoToArtwork={() => setActiveTab('designer')}
            />
          )}

          {activeTab === 'help' && (
            <HelpCenter 
              onImportRecords={handleRosterImport}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSystem 
              records={records}
              metadata={metadata}
              currentUser={currentUser}
            />
          )}
        </section>
      </main>

      {/* Size Editor Popup Modal */}
      {sizeEditorOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(23,23,23,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSizeEditorOpen(false); }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #DDD9D2', borderRadius: '14px', width: '100%', maxWidth: '980px', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E8E4DE', background: '#F5F3EF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#171717' }}>📐 Size Grading & Sizing Presets</span>
                <span style={{ fontSize: '10px', background: '#FFF0EB', color: '#C2410C', border: '1px solid #FCD7C8', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Master 18–60
                </span>
              </div>
              <button 
                onClick={() => setSizeEditorOpen(false)} 
                style={{ background: '#FFFFFF', border: '1px solid #D0CCC5', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#242321', fontSize: '14px', fontWeight: '700', transition: 'all 0.15s ease' }}
                title="Close Size Grading Editor"
              >
                ✕
              </button>
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: '20px' }}>
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
