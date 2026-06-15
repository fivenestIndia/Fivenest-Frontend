import { useState, useEffect } from 'react';
import { Palette, Users, Ruler, Sliders, HelpCircle, Award, ArrowLeft, Sun, Moon } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'designer' | 'order' | 'sizes' | 'nesting' | 'help'>('designer');
  
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

  // Load saved size database & authentication on mount
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

    // Connect Supabase Auth Session
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

    // Listen to changes in auth state
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

  // Artwork layers positioning configuration state
  const [designConfig, setDesignConfig] = useState<ArtDesignConfig>(defaultDesignConfig);

  // Quick stats computed on the fly
  const totalQty = records.reduce((acc, r) => acc + r.qty, 0);

  // Sync size database changes
  const handleSizeDatabaseChange = (newDb: SizeDatabase) => {
    setSizeDB(newDb);
  };

  // Sync roster record imports from the unstructured text cleaner
  const handleRosterImport = (imported: PlayerRecord[]) => {
    setRecords(imported);
    setActiveTab('order'); // switch user to order table automatically
  };

  const handleTestModeChange = (val: boolean) => {
    setTestMode(val);
    localStorage.setItem('fivenest_test_mode', JSON.stringify(val));
    // Trigger event so other components know (like NestingView)
    window.dispatchEvent(new Event('storage-preference-changed'));
  };

  return (
    <div className={`app-layout ${themeMode}`}>
      {/* Sidebar Navigation Panel */}
      <aside className="sidebar">
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src="/logo.svg" 
                  alt="FiveNest Logo" 
                  style={{ width: '26px', height: '26px', objectFit: 'contain' }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span style={{ fontSize: '18px', fontWeight: '800' }}>FiveNest Web</span>
              </div>
              <span className="sidebar-version">Web Studio</span>
            </div>
          </Link>

          <nav className="sidebar-menu">
            <div 
              className={`menu-item ${activeTab === 'designer' ? 'active' : ''}`}
              onClick={() => setActiveTab('designer')}
            >
              <Palette size={18} />
              Artwork Setup
            </div>
            <div 
              className={`menu-item ${activeTab === 'order' ? 'active' : ''}`}
              onClick={() => setActiveTab('order')}
            >
              <Users size={18} />
              Roster & Details
            </div>
            <div 
              className={`menu-item ${activeTab === 'sizes' ? 'active' : ''}`}
              onClick={() => setActiveTab('sizes')}
            >
              <Ruler size={18} />
              Grading Sizes
            </div>
            <div 
              className={`menu-item ${activeTab === 'nesting' ? 'active' : ''}`}
              onClick={() => setActiveTab('nesting')}
            >
              <Sliders size={18} />
              Nesting & Export
            </div>
            <div 
              className={`menu-item ${activeTab === 'help' ? 'active' : ''}`}
              onClick={() => setActiveTab('help')}
            >
              <HelpCircle size={18} />
              Help & AI Refine
            </div>

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

        {/* Sidebar Footer info */}
        <div className="sidebar-footer">
          {/* Theme Mode Toggle Button */}
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

          <div className="glass-card" style={{ padding: '12px', background: 'rgba(155, 77, 255, 0.04)', borderColor: 'var(--border-active)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={14} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>ENTERPRISE LICENSED</span>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Unlimited Local exports.</p>
            <div style={{ display: 'flex', justifySelf: 'space-between', marginTop: '10px', fontSize: '10px', color: 'var(--text-primary)' }}>
              <span>Total Panels Qty:</span>
              <span style={{ fontWeight: 'bold' }}>{totalQty}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <h1 className="navbar-title">
            {activeTab === 'designer' && "🎨 Step 1: Sublimation Artwork & Overlays"}
            {activeTab === 'order' && "📋 Step 2: Order Details & Player Roster"}
            {activeTab === 'sizes' && "📐 Step 3: Size grading dimensions database"}
            {activeTab === 'nesting' && "⚙️ Step 4: Nesting Engine & Panel Export"}
            {activeTab === 'help' && "🤖 Help Center & AI Smart Roster Refiner"}
          </h1>
          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Test Mode Toggle */}
            <label className="test-mode-toggle" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer', 
              fontSize: '11px', 
              background: testMode ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255,255,255,0.03)', 
              padding: '6px 14px', 
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
                {testMode ? "🧪 Test Mode (72 DPI Free)" : "⚡ Production Mode (High DPI)"}
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
                  padding: '6px 14px', 
                  borderRadius: '30px', 
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                <span style={{ color: 'white' }}>{currentUser.name.split(' ')[0]}</span>
                <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>₹{currentUser.balance.toFixed(2)}</span>
              </div>
            ) : (
              <button 
                className="btn btn-secondary" 
                onClick={() => setLoginModalOpen(true)}
                style={{ padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: 'bold' }}
              >
                Sign In
              </button>
            )}

            {/* Visual step tracker */}
            <div className="wizard-steps" style={{ margin: 0, gap: '20px' }}>
              <div className={`wizard-step ${activeTab === 'designer' ? 'active' : records.length > 0 ? 'completed' : ''}`} style={{ padding: 0 }}>
                <span className="step-circle" style={{ width: '24px', height: '24px', fontSize: '11px' }}>1</span>
              </div>
              <div className={`wizard-step ${activeTab === 'order' ? 'active' : records.length > 0 ? 'completed' : ''}`} style={{ padding: 0 }}>
                <span className="step-circle" style={{ width: '24px', height: '24px', fontSize: '11px' }}>2</span>
              </div>
              <div className={`wizard-step ${activeTab === 'sizes' ? 'active' : 'completed'}`} style={{ padding: 0 }}>
                <span className="step-circle" style={{ width: '24px', height: '24px', fontSize: '11px' }}>3</span>
              </div>
              <div className={`wizard-step ${activeTab === 'nesting' ? 'active' : ''}`} style={{ padding: 0 }}>
                <span className="step-circle" style={{ width: '24px', height: '24px', fontSize: '11px' }}>4</span>
              </div>
            </div>
          </div>
        </header>

        <section className="content-body">
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
