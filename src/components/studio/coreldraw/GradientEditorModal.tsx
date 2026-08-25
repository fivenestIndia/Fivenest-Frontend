import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ArrowLeftRight, Check } from 'lucide-react';

export interface GradientStop {
  id: string;
  color: string;
  offset: number; // 0 to 100 (%)
}

export const DEFAULT_PRESET_GRADIENTS: { name: string; stops: string[]; css: string }[] = [
  {
    name: 'Metallic Gold',
    stops: ['#BF953F', '#FCF6BA', '#B38728', '#FBF5B7', '#AA771C'],
    css: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)'
  },
  {
    name: 'Silver Chrome',
    stops: ['#E0E0E0', '#F5F5F5', '#9E9E9E', '#757575'],
    css: 'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 35%, #9E9E9E 70%, #757575 100%)'
  },
  {
    name: 'Copper Bronze',
    stops: ['#804A00', '#F7BA70', '#A06000', '#FCD9A5', '#603000'],
    css: 'linear-gradient(135deg, #804A00 0%, #F7BA70 25%, #A06000 50%, #FCD9A5 75%, #603000 100%)'
  },
  {
    name: 'Electric Cyan',
    stops: ['#00F2FE', '#4FACFE', '#00C6FF'],
    css: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #00C6FF 100%)'
  },
  {
    name: 'Sunset Fire',
    stops: ['#FF0844', '#FFB199', '#F12711', '#F5AF19'],
    css: 'linear-gradient(135deg, #FF0844 0%, #FFB199 30%, #F12711 70%, #F5AF19 100%)'
  },
  {
    name: 'Neon Cyberpunk',
    stops: ['#00F2FE', '#7F00FF', '#E100FF'],
    css: 'linear-gradient(135deg, #00F2FE 0%, #7F00FF 50%, #E100FF 100%)'
  },
  {
    name: 'Emerald Ice',
    stops: ['#0BA360', '#3CBA92', '#30DD8A', '#12D8FA'],
    css: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 35%, #30DD8A 70%, #12D8FA 100%)'
  },
  {
    name: 'Deep Violet',
    stops: ['#4A00E0', '#8E2DE2', '#F000FF'],
    css: 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 50%, #F000FF 100%)'
  },
  {
    name: 'Carbon Steel',
    stops: ['#141E30', '#243B55', '#4B6CB7'],
    css: 'linear-gradient(135deg, #141E30 0%, #243B55 50%, #4B6CB7 100%)'
  }
];

interface GradientEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStops?: string[];
  initialDirection?: 'vertical' | 'horizontal' | 'diagonal' | 'radial';
  onApply: (stops: string[], direction: 'vertical' | 'horizontal' | 'diagonal' | 'radial') => void;
  onSaveToPalette?: (stops: string[], name: string) => void;
  title?: string;
}

export const GradientEditorModal: React.FC<GradientEditorModalProps> = ({
  isOpen,
  onClose,
  initialStops = ['#00e5ff', '#7c3aed'],
  initialDirection = 'vertical',
  onApply,
  onSaveToPalette,
  title = 'Photoshop Gradient Editor'
}) => {
  const [stops, setStops] = useState<GradientStop[]>(() => {
    return initialStops.map((color, idx) => ({
      id: `stop-${idx}-${Date.now()}`,
      color,
      offset: Math.round((idx / Math.max(1, initialStops.length - 1)) * 100)
    }));
  });

  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [direction, setDirection] = useState<'vertical' | 'horizontal' | 'diagonal' | 'radial'>(initialDirection);
  const [hexInput, setHexInput] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<{ name: string; stops: string[]; css: string }[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fivenest_custom_gradient_presets');
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom gradients', e);
    }
  }, []);

  // Sync initial stops when modal opens
  useEffect(() => {
    if (isOpen && initialStops.length >= 2) {
      const formatted = initialStops.map((color, idx) => ({
        id: `stop-${idx}-${Date.now()}`,
        color,
        offset: Math.round((idx / Math.max(1, initialStops.length - 1)) * 100)
      }));
      setStops(formatted);
      setSelectedStopId(formatted[0].id);
      setHexInput(formatted[0].color);
      setDirection(initialDirection);
    }
  }, [isOpen]);

  const selectedStop = stops.find(s => s.id === selectedStopId) || stops[0];

  useEffect(() => {
    if (selectedStop) {
      setHexInput(selectedStop.color);
    }
  }, [selectedStopId]);

  if (!isOpen) return null;

  // Sort stops by offset for CSS and rendering
  const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
  const stopsColorStrings = sortedStops.map(s => s.color);

  // Compute CSS background string for preview bar
  const cssColorStops = sortedStops.map(s => `${s.color} ${s.offset}%`).join(', ');
  const gradAngle = direction === 'horizontal' ? '90deg' : direction === 'diagonal' ? '135deg' : direction === 'radial' ? 'circle' : '180deg';
  const previewBg = direction === 'radial'
    ? `radial-gradient(circle at 50% 50%, ${cssColorStops})`
    : `linear-gradient(${gradAngle}, ${cssColorStops})`;

  const horizontalTrackBg = `linear-gradient(90deg, ${cssColorStops})`;

  // Handle clicking on track to add a stop
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const offset = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));

    // Generate interpolated or nearby color
    const newColor = selectedStop ? selectedStop.color : '#00e5ff';
    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: newColor,
      offset
    };

    setStops(prev => [...prev, newStop]);
    setSelectedStopId(newStop.id);
    setHexInput(newColor);
  };

  // Handle color change from color picker
  const handleColorChange = (newColor: string) => {
    if (!selectedStop) return;
    setHexInput(newColor);
    setStops(prev => prev.map(s => s.id === selectedStop.id ? { ...s, color: newColor } : s));
  };

  // Handle Hex Input with strict Enter key prevention (no form submission / no page refresh)
  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    let formatted = val.trim();
    if (formatted && !formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    // If valid hex (3 or 6 chars)
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(formatted)) {
      setStops(prev => prev.map(s => s.id === selectedStop.id ? { ...s, color: formatted } : s));
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      let formatted = hexInput.trim();
      if (formatted && !formatted.startsWith('#')) {
        formatted = '#' + formatted;
      }
      if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(formatted)) {
        setStops(prev => prev.map(s => s.id === selectedStop.id ? { ...s, color: formatted } : s));
        setHexInput(formatted);
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  // Handle Stop Location Change
  const handleLocationChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newOffset)));
    setStops(prev => prev.map(s => s.id === selectedStop.id ? { ...s, offset: clamped } : s));
  };

  // Delete current stop
  const handleDeleteStop = () => {
    if (stops.length <= 2) {
      alert('A gradient must have at least 2 color stops.');
      return;
    }
    const remaining = stops.filter(s => s.id !== selectedStop.id);
    setStops(remaining);
    setSelectedStopId(remaining[0].id);
    setHexInput(remaining[0].color);
  };

  // Reverse Gradient
  const handleReverse = () => {
    setStops(prev => prev.map(s => ({
      ...s,
      offset: 100 - s.offset
    })));
  };

  // Load a preset
  const handleLoadPreset = (presetStops: string[]) => {
    const formatted = presetStops.map((color, idx) => ({
      id: `stop-${idx}-${Date.now()}`,
      color,
      offset: Math.round((idx / Math.max(1, presetStops.length - 1)) * 100)
    }));
    setStops(formatted);
    setSelectedStopId(formatted[0].id);
    setHexInput(formatted[0].color);
  };

  // Save custom preset
  const handleSaveCustomPreset = () => {
    const name = (presetNameInput.trim() || `Gradient ${customPresets.length + 1}`);
    const newPreset = {
      name,
      stops: stopsColorStrings,
      css: `linear-gradient(135deg, ${cssColorStops})`
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('fivenest_custom_gradient_presets', JSON.stringify(updated));
    setPresetNameInput('');
    setIsSavingPreset(false);

    if (onSaveToPalette) {
      onSaveToPalette(stopsColorStrings, name);
    }
  };

  const handleDeleteCustomPreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((_, idx) => idx !== index);
    setCustomPresets(updated);
    localStorage.setItem('fivenest_custom_gradient_presets', JSON.stringify(updated));
  };

  const handleApply = () => {
    onApply(stopsColorStrings, direction);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 6, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(11, 15, 30, 0.96)',
          border: '1px solid rgba(0, 229, 255, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 229, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎨</span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '78vh' }}>
          
          {/* Preset Swatches Strip */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preset Library ({DEFAULT_PRESET_GRADIENTS.length + customPresets.length})
              </span>
              <button
                type="button"
                onClick={() => setIsSavingPreset(!isSavingPreset)}
                style={{
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  color: '#00e5ff',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={12} /> Save to Presets
              </button>
            </div>

            {/* Save Preset Input Bar */}
            {isSavingPreset && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,229,255,0.3)' }}>
                <input
                  type="text"
                  placeholder="Gradient Name (e.g. Chrome Gold)"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveCustomPreset();
                    }
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(0, 229, 255, 0.35)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveCustomPreset}
                  style={{
                    background: '#00e5ff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#000000',
                    fontWeight: '800',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {/* Preset Thumbnails */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))', gap: '8px' }}>
              {DEFAULT_PRESET_GRADIENTS.map((p, idx) => (
                <div
                  key={`default-${idx}`}
                  style={{
                    height: '32px',
                    borderRadius: '6px',
                    background: p.css,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    transition: 'transform 0.15s ease, border-color 0.15s ease'
                  }}
                  onClick={() => handleLoadPreset(p.stops)}
                  title={p.name}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                />
              ))}

              {customPresets.map((p, idx) => (
                <div
                  key={`custom-${idx}`}
                  style={{
                    position: 'relative',
                    height: '32px',
                    borderRadius: '6px',
                    background: p.css,
                    border: '2px solid #00e5ff',
                    cursor: 'pointer',
                    boxShadow: '0 0 10px rgba(0,229,255,0.3)',
                    transition: 'transform 0.15s ease'
                  }}
                  onClick={() => handleLoadPreset(p.stops)}
                  title={`${p.name} (Custom)`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomPreset(idx, e)}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      zIndex: 5
                    }}
                    title="Delete Preset"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Photoshop-Style Gradient Track */}
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                Gradient Spectrum Bar (Click bar to add stop)
              </span>
              <span style={{ fontSize: '10px', color: '#00e5ff', fontWeight: '700' }}>
                {stops.length} Stops
              </span>
            </div>

            {/* Gradient Visual Strip */}
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              style={{
                position: 'relative',
                height: '36px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                background: horizontalTrackBg,
                cursor: 'crosshair',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)',
                marginBottom: '26px'
              }}
              title="Click anywhere on the bar to add a new color stop"
            >
              {/* Stop Markers beneath the bar */}
              {stops.map((stop) => {
                const isSelected = stop.id === selectedStop.id;
                return (
                  <div
                    key={stop.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStopId(stop.id);
                      setHexInput(stop.color);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${stop.offset}%`,
                      bottom: '-22px',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'grab',
                      zIndex: isSelected ? 20 : 10
                    }}
                  >
                    {/* Photoshop-style triangle arrow */}
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: isSelected ? '6px solid #00e5ff' : '6px solid #ffffff'
                      }}
                    />
                    {/* Color Chip Box */}
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        background: stop.color,
                        border: isSelected ? '2px solid #00e5ff' : '1.5px solid #ffffff',
                        boxShadow: isSelected ? '0 0 10px #00e5ff, 0 2px 6px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.5)'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Selected Stop Controller Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                marginTop: '10px'
              }}
            >
              {/* Color Picker Swatch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Color:</span>
                <input
                  type="color"
                  value={selectedStop?.color || '#00e5ff'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    background: 'none',
                    padding: 0
                  }}
                />
              </div>

              {/* Hex Code Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Hex:</span>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  onKeyDown={handleHexKeyDown}
                  placeholder="#00E5FF"
                  style={{
                    width: '100px',
                    background: 'rgba(10, 16, 32, 0.95)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    color: '#00e5ff',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Location Percentage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Location:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedStop?.offset ?? 0}
                  onChange={(e) => handleLocationChange(parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as any).blur();
                    }
                  }}
                  style={{
                    width: '56px',
                    background: 'rgba(10, 16, 32, 0.95)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#ffffff',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>%</span>
              </div>

              {/* Delete Stop Button */}
              {stops.length > 2 && (
                <button
                  type="button"
                  onClick={handleDeleteStop}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Delete Color Stop"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Direction & Live Preview Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Direction Selectors */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>Direction / Angle</span>
                <button
                  type="button"
                  onClick={handleReverse}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeftRight size={10} /> Invert
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'vertical', label: '↕ Vertical' },
                  { id: 'horizontal', label: '↔ Horizontal' },
                  { id: 'diagonal', label: '⤡ Diagonal' },
                  { id: 'radial', label: '◎ Radial' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDirection(d.id as any)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: '6px',
                      border: direction === d.id ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                      background: direction === d.id ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: direction === d.id ? '#00e5ff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Text Preview Box */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                Live Text Preview
              </span>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  fontFamily: 'Impact, sans-serif',
                  letterSpacing: '1px',
                  background: previewBg,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                FIVENEST 23
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#94a3b8',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                background: 'linear-gradient(135deg, #00e5ff 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0, 229, 255, 0.3)'
              }}
            >
              <Check size={15} /> Apply Gradient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
