import { useState, useEffect } from 'react';
import { Palette, Users, Ruler, Sliders, HelpCircle, ArrowLeft, Sun, Moon, Menu, X, Award, ExternalLink, Package, Cpu, Sparkles, FolderCheck, HardDrive } from 'lucide-react';
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

  // Production Studio tabs for designers & printers
  const [activeTab, setActiveTab] = useState<'designer' | 'order' | 'sizes' | 'nesting' | 'help'>('designer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Detect OS for Client Database Storage Notification
  const [detectedOs, setDetectedOs] = useState<string>('macOS');
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const platform = navigator.platform || navigator.userAgent || '';
      if (platform.toLowerCase().includes('win')) {
        setDetectedOs('Windows (Documents/FiveNest Database)');
      } else {
        setDetectedOs('macOS (Documents/FiveNest Database)');
      }
    }
  }, []);

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

  // Auto-save Client Database to Local Storage per User Email / OS
  useEffect(() => {
    const clientDbKey = currentUser?.email ? `fivenest_database_${currentUser.email}` : 'fivenest_database_local';
    const dbData = {
      records,
      metadata,
      sizeDB,
      lastSaved: new Date().toISOString(),
      osPath: detectedOs
    };
    localStorage.setItem(clientDbKey, JSON.stringify(dbData));
  }, [records, metadata, sizeDB, currentUser, detectedOs]);

  useEffect(() => {
    const saved = localStorage.getItem('teedex_size_database');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSizeDB(parsed);
      } catch (e) {}
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
    { id: 'order', label: 'Job Details & Excel Data', icon: Users },
    { id: 'nesting', label: 'Nesting & Export', icon: Sliders },
    { id: 'help', label: 'Help & AI Refine', icon: HelpCircle },
  ];

  return (
    <div className={`app-layout ${themeMode}`}>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-3 bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/30 flex-shrink-0">
            <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-white text-sm leading-tight">FiveNest Studio</span>
            <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest">PRODUCTION OS</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold shadow-lg shadow-cyan-500/20 scale-105'
                  : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sidebar Navigation Panel */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
            <Link to="/" className="flex items-center gap-3 group text-left">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-400/50 transition-all duration-300 flex-shrink-0">
                <div className="w-full h-full rounded-[14.5px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-80" />
                  <svg className="w-5 h-5 relative z-10 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-black text-white text-lg tracking-tight leading-none">
                    FiveNest
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
                </div>
                <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-[0.2em] leading-tight mt-0.5">
                  PRODUCTION STUDIO
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
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
                  className={`menu-item transition-all duration-200 ${isActive ? 'active scale-[1.02]' : ''}`}
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

            {/* Direct Link to Design Hub */}
            <a 
              href="https://designs.fivenest.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="menu-item"
              style={{ 
                marginTop: '16px', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '16px',
                color: 'var(--color-primary)',
                fontWeight: '700'
              }}
            >
              <Palette size={18} />
              <span>Design Hub (Step 1)</span>
              <ExternalLink size={12} className="ml-auto" />
            </a>

            {/* Direct Link to Order Portal */}
            <Link 
              to="/orders" 
              className="menu-item"
              style={{ 
                color: 'var(--color-secondary)',
                fontWeight: '700'
              }}
            >
              <Package size={18} />
              <span>Order Portal (Step 2)</span>
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

        {/* Sidebar Footer info with OS Client Database Persistence Status */}
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

          {/* Auto OS Client Database Save Status Pill */}
          <div className="glass-card" style={{ padding: '12px', background: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.3)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <FolderCheck size={14} className="text-cyan-400" />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)' }}>AUTO CLIENT DATABASE</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
              Auto-saved for OS: <strong className="text-white">{detectedOs}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-primary)' }}>
              <span>Job Total Qty:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalQty} pcs</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <h1 className="navbar-title text-sm md:text-base font-black">
            {activeTab === 'designer' && "🎨 Step 1: Sublimation Artwork & Overlays"}
            {activeTab === 'order' && "📋 Step 2: Job Details & Excel Data"}
            {activeTab === 'sizes' && "📐 Step 3: Size grading dimensions database"}
            {activeTab === 'nesting' && "⚙️ Step 4: Nesting Engine & Panel Export"}
            {activeTab === 'help' && "🤖 Help Center & AI Smart Roster Refiner"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Quick Link to Design Hub */}
            <a 
              href="https://designs.fivenest.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
            >
              <Palette size={13} />
              <span>Design Hub</span>
              <ExternalLink size={11} />
            </a>

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
                <Package size={14} /> Order Portal (/orders)
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
