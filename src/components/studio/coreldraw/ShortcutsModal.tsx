import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'V / F1', desc: 'Pick Tool (select & transform)' },
    { key: 'H', desc: 'Hand / Pan Tool' },
    { key: 'Z', desc: 'Zoom Tool (click & drag to zoom)' },
    { key: 'T', desc: 'Text Overlay Tool' },
    { key: 'L', desc: 'Logo / Image Placement Tool' },
    { key: 'I', desc: 'Eyedropper Color Picker' },
    { key: 'G / Ctrl+.', desc: 'Toggle Guidelines' },
    { key: 'R', desc: 'Toggle Rulers' },
    { key: 'Arrow Keys / Shift+Arrows', desc: 'Nudge active text layer position (1% / 5%)' },
    { key: 'C / E / P', desc: 'Align Center H (C), Center V (E), Center Page (P)' },
    { key: 'T / B / L / R', desc: 'Align Top (T), Bottom (B), Left (L), Right (R)' },
    { key: 'Z (hold & drag)', desc: 'Scrubby Drag Zoom In / Out (Photoshop style)' },
    { key: 'Space (hold)', desc: 'Pan workspace dynamically (Illustrator style)' },
    { key: 'Ctrl + I', desc: 'Import single panel graphic image' },
    { key: 'Ctrl + Shift + I / Ctrl + B', desc: 'Bulk Import ZIP containing all panels' },
    { key: 'Delete', desc: 'Clear current uploaded panel background' },
    { key: 'Left Click Swatch', desc: 'Set Text / Background Fill Color' },
    { key: 'Right Click Swatch', desc: 'Set Text / Background Stroke Color' }
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
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Keyboard size={20} style={{ color: '#0284c7' }} /> CorelDRAW Keyboard Shortcuts
        </h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
          Use these CorelDRAW-standard hotkeys to speed up your artwork preparation:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
          {shortcuts.map((s, idx) => (
            <div key={idx} style={{ background: '#1a1a24', padding: '8px 10px', borderRadius: '6px', border: '1px solid #2b2b36' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00f0ff', fontFamily: 'monospace' }}>{s.key}</div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '16px', padding: '10px',
            background: '#0284c7', color: '#fff', fontWeight: '700',
            borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px'
          }}
        >
          Got it! Back to Design
        </button>
      </div>
    </div>
  );
};
