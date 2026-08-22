import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, Save, Trash2, RotateCcw, ZoomIn, ZoomOut, Maximize2, 
  Eye, Grid, Keyboard, Layers, HardDrive, Check 
} from 'lucide-react';
import { exportAllLocalData } from '../localDataManager';

interface MenuBarProps {
  activeTab: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD';
  onSelectTab: (tab: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD') => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
  rulersEnabled: boolean;
  onToggleRulers: () => void;
  onOpenImport: () => void;
  onOpenBulkImport?: () => void;
  onClearPanel: () => void;
  onOpenShortcutsModal: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  activeTab,
  onSelectTab,
  zoom,
  onSetZoom,
  showGuidelines,
  onToggleGuidelines,
  rulersEnabled,
  onToggleRulers,
  onOpenImport,
  onOpenBulkImport,
  onClearPanel,
  onOpenShortcutsModal
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(prev => prev === menuName ? null : menuName);
  };

  const close = () => setOpenMenu(null);

  const panels: { id: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD'; label: string }[] = [
    { id: 'front', label: 'Front Panel' },
    { id: 'back', label: 'Back Panel' },
    { id: 'sleeveLeft', label: 'Left Sleeve' },
    { id: 'sleeveRight', label: 'Right Sleeve' },
    { id: 'a4Print', label: 'A4 Print' },
    { id: 'threeD', label: '3D Preview' },
  ];

  return (
    <div className="cd-menubar" ref={containerRef} style={{ background: 'rgba(5, 7, 18, 0.7)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
      {/* Brand Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '10px', color: '#00e5ff', fontWeight: '900', letterSpacing: '-0.02em' }}>
        <span style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.25) 0%, rgba(124,58,237,0.25) 100%)', border: '1px solid rgba(0,229,255,0.4)', color: '#00e5ff', padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: '800', boxShadow: '0 0 10px rgba(0,229,255,0.2)' }}>Corel</span>
        <span style={{ fontSize: '13px', color: '#ffffff' }}>Studio</span>
      </div>

      {/* FILE MENU */}
      <div className="cd-menu-item-wrapper" style={{ position: 'relative' }}>
        <div className={`cd-menu-item ${openMenu === 'file' ? 'active' : ''}`} onClick={() => toggleMenu('file')}>
          File
        </div>
        {openMenu === 'file' && (
          <div className="cd-menu-dropdown">
            <div className="cd-dropdown-action" onClick={() => { onOpenImport(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileUp size={13} /> Import Graphic</span>
              <span style={{ opacity: 0.5 }}>Ctrl+I</span>
            </div>
            {onOpenBulkImport && (
              <div className="cd-dropdown-action" onClick={() => { onOpenBulkImport(); close(); }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileUp size={13} /> Bulk Import ZIP</span>
                <span style={{ opacity: 0.5 }}>Ctrl+Shift+I</span>
              </div>
            )}
            <div className="cd-dropdown-action" onClick={() => { exportAllLocalData(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HardDrive size={13} /> Export Local Backup</span>
            </div>
            <div style={{ height: '1px', background: '#2d2d38', margin: '4px 0' }} />
            <div className="cd-dropdown-action" onClick={() => { onClearPanel(); close(); }} style={{ color: '#ef4444' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={13} /> Clear Active Panel</span>
              <span style={{ opacity: 0.5 }}>Del</span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MENU */}
      <div className="cd-menu-item-wrapper" style={{ position: 'relative' }}>
        <div className={`cd-menu-item ${openMenu === 'view' ? 'active' : ''}`} onClick={() => toggleMenu('view')}>
          View
        </div>
        {openMenu === 'view' && (
          <div className="cd-menu-dropdown">
            <div className="cd-dropdown-action" onClick={() => { onSetZoom(Math.min(3, zoom + 0.25)); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ZoomIn size={13} /> Zoom In</span>
              <span style={{ opacity: 0.5 }}>Ctrl++</span>
            </div>
            <div className="cd-dropdown-action" onClick={() => { onSetZoom(Math.max(0.5, zoom - 0.25)); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ZoomOut size={13} /> Zoom Out</span>
              <span style={{ opacity: 0.5 }}>Ctrl+-</span>
            </div>
            <div className="cd-dropdown-action" onClick={() => { onSetZoom(1); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RotateCcw size={13} /> Reset Zoom (100%)</span>
              <span style={{ opacity: 0.5 }}>Ctrl+0</span>
            </div>
            <div style={{ height: '1px', background: '#2d2d38', margin: '4px 0' }} />
            <div className="cd-dropdown-action" onClick={() => { onToggleGuidelines(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Grid size={13} /> Toggle Guidelines</span>
              {showGuidelines ? <Check size={13} style={{ color: '#38bdf8' }} /> : <span style={{ opacity: 0.5 }}>G</span>}
            </div>
            <div className="cd-dropdown-action" onClick={() => { onToggleRulers(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={13} /> Toggle Rulers</span>
              {rulersEnabled ? <Check size={13} style={{ color: '#38bdf8' }} /> : <span style={{ opacity: 0.5 }}>R</span>}
            </div>
          </div>
        )}
      </div>

      {/* LAYOUT / PANELS MENU */}
      <div className="cd-menu-item-wrapper" style={{ position: 'relative' }}>
        <div className={`cd-menu-item ${openMenu === 'panels' ? 'active' : ''}`} onClick={() => toggleMenu('panels')}>
          Panels
        </div>
        {openMenu === 'panels' && (
          <div className="cd-menu-dropdown">
            {panels.map(p => (
              <div 
                key={p.id} 
                className="cd-dropdown-action" 
                onClick={() => { onSelectTab(p.id); close(); }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={13} /> {p.label}</span>
                {activeTab === p.id && <Check size={13} style={{ color: '#38bdf8' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SHORTCUTS MENU */}
      <div className="cd-menu-item-wrapper" style={{ position: 'relative' }}>
        <div className={`cd-menu-item ${openMenu === 'help' ? 'active' : ''}`} onClick={() => toggleMenu('help')}>
          Shortcuts
        </div>
        {openMenu === 'help' && (
          <div className="cd-menu-dropdown">
            <div className="cd-dropdown-action" onClick={() => { onOpenShortcutsModal(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Keyboard size={13} /> Keyboard Shortcuts</span>
              <span style={{ opacity: 0.5 }}>F1</span>
            </div>
          </div>
        )}
      </div>

      {/* Active Panel Badge on Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--accent-cyan)', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(0, 229, 255, 0.3)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <span style={{ fontWeight: '700', letterSpacing: '0.05em' }}>ACTIVE:</span>
        <strong style={{ color: '#ffffff', textTransform: 'uppercase', fontWeight: '800' }}>{activeTab}</strong>
      </div>
    </div>
  );
};
