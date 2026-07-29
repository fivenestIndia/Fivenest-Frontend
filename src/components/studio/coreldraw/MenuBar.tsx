import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, Save, Trash2, RotateCcw, ZoomIn, ZoomOut, Maximize2, 
  Eye, Grid, HelpCircle, Layers, HardDrive, Check 
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
    <div className="cd-menubar" ref={containerRef}>
      {/* Brand Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', color: '#00f0ff', fontWeight: '800' }}>
        <span style={{ background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>Corel</span>
        <span>Studio</span>
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

      {/* HELP MENU */}
      <div className="cd-menu-item-wrapper" style={{ position: 'relative' }}>
        <div className={`cd-menu-item ${openMenu === 'help' ? 'active' : ''}`} onClick={() => toggleMenu('help')}>
          Help
        </div>
        {openMenu === 'help' && (
          <div className="cd-menu-dropdown">
            <div className="cd-dropdown-action" onClick={() => { onOpenShortcutsModal(); close(); }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={13} /> CorelDRAW Shortcuts</span>
              <span style={{ opacity: 0.5 }}>F1</span>
            </div>
          </div>
        )}
      </div>

      {/* Active Panel Badge on Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#38bdf8', background: '#0f172a', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e293b' }}>
        <span>ACTIVE:</span>
        <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{activeTab}</strong>
      </div>
    </div>
  );
};
