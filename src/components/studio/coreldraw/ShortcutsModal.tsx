import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Ctrl + Z', desc: 'Undo any move, drag, or edit action' },
    { key: 'Ctrl + Shift + Z / Ctrl + Y', desc: 'Redo move or edit action' },
    { key: 'Ctrl + R', desc: 'Toggle Show / Hide Rulers' },
    { key: 'Ctrl + G', desc: 'Toggle Show / Hide Guidelines' },
    { key: 'Double Click Text', desc: 'Open Editor Panel Popup for Edit Specification' },
    { key: 'Double Click Canvas', desc: 'Upload Artwork Graphic Image' },
    { key: 'Arrow Keys / Shift+Arrows', desc: 'Nudge active text layer position (1% / 5%)' },
    { key: 'C / E / P', desc: 'Align Center H (C), Center V (E), Center Page (P)' },
    { key: 'T / B / L / R', desc: 'Align Top (T), Bottom (B), Left (L), Right (R)' },
    { key: 'Space (hold & drag)', desc: 'Pan canvas dynamically' },
    { key: 'Ctrl + 0', desc: 'Fit Canvas View to Screen' },
    { key: 'Ctrl + U / Ctrl + I / U', desc: 'Upload / Import single panel graphic image' },
    { key: 'Ctrl + Shift + I / Ctrl + B / Ctrl + Shift + U', desc: 'Bulk Import ZIP containing panels (Front, Back, Sleeves, Collar)' },
    { key: 'Delete', desc: 'Clear current uploaded panel background' }
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '480px',
          background: '#121218',
          border: '1px solid #E2DED7',
          borderRadius: '12px',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Keyboard size={20} style={{ color: '#E4572E' }} /> Studio Keyboard Shortcuts
        </h3>
        <p style={{ fontSize: '12px', color: '#71717A', marginBottom: '16px' }}>
          Use these hotkeys to speed up your artwork preparation:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
          {shortcuts.map((s, idx) => (
            <div key={idx} style={{ background: '#1a1a24', padding: '8px 10px', borderRadius: '6px', border: '1px solid #2b2b36' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#E4572E', fontFamily: 'monospace' }}>{s.key}</div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '16px', padding: '10px',
            background: '#E4572E', color: '#fff', fontWeight: '700',
            borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px'
          }}
        >
          Got it! Back to Design
        </button>
      </div>
    </div>
  );
};
