import React from 'react';
import { X, Type, AlignLeft, AlignCenter, AlignRight, RotateCcw, Check, Sparkles } from 'lucide-react';
import type { TextConfig } from '../designer';

interface TextSpecificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLayer: 'name' | 'number';
  panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print';
  config: TextConfig;
  onUpdate: (fields: Partial<TextConfig>) => void;
  onOpenGradientEditor?: () => void;
  customFonts?: Array<{ name: string; url: string }>;
  onUndo?: () => void;
}

const QUICK_COLORS = [
  '#FFFFFF', '#000000', '#E4572E', '#FACC15', '#22C55E', 
  '#3B82F6', '#8B5CF6', '#EC4899', '#00E5FF', '#FF1744'
];

export const TextSpecificationModal: React.FC<TextSpecificationModalProps> = ({
  isOpen,
  onClose,
  targetLayer,
  panelKey,
  config,
  onUpdate,
  onOpenGradientEditor,
  customFonts = [],
  onUndo
}) => {
  if (!isOpen) return null;

  const isName = targetLayer === 'name';
  const label = isName ? 'Player Name' : 'Player Number';
  const panelDisplayName = 
    panelKey === 'front' ? 'Front Panel' :
    panelKey === 'back' ? 'Back Panel' :
    panelKey === 'sleeveLeft' ? 'Left Sleeve' :
    panelKey === 'sleeveRight' ? 'Right Sleeve' : 'A4 Back Print';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2100,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '88vh',
          backgroundColor: '#18181B',
          color: '#F4F4F5',
          borderRadius: '16px',
          border: '1px solid #3F3F46',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(228, 87, 46, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #27272A',
            background: 'linear-gradient(180deg, #27272A 0%, #18181B 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(228, 87, 46, 0.15)',
                border: '1px solid rgba(228, 87, 46, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E4572E'
              }}
            >
              <Type size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Edit Specification: {label}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(228, 87, 46, 0.15)',
                    color: '#F97316',
                    border: '1px solid rgba(228, 87, 46, 0.3)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  {panelDisplayName}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#A1A1AA', margin: '2px 0 0 0' }}>
                Double-click text editor specification popup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Visibility & Sample Text */}
          <div
            style={{
              backgroundColor: '#27272A',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #3F3F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="modal-text-enabled"
                checked={config.enabled}
                onChange={(e) => onUpdate({ enabled: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#E4572E', cursor: 'pointer' }}
              />
              <label htmlFor="modal-text-enabled" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Enable / Show {label}
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Sample Preview:</span>
              <input
                type="text"
                value={config.text || ''}
                placeholder={isName ? 'RONALDO' : '10'}
                onChange={(e) => onUpdate({ text: e.target.value })}
                style={{
                  backgroundColor: '#18181B',
                  border: '1px solid #3F3F46',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  width: '110px'
                }}
              />
            </div>
          </div>

          {/* 2. Typography & Font Style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Typography & Font Style
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px', fontWeight: '600' }}>
                  Font Family:
                </label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '12px'
                  }}
                >
                  <option value="OldSport02AthleticNcv-E0gj">Old Sport Athletic (Default)</option>
                  <option value="Impact">Impact (Bold Athletic)</option>
                  <option value="Arial">Arial Black</option>
                  <option value="Trebuchet MS">Trebuchet (Modern Sans)</option>
                  <option value="Times New Roman">Times (Classic Serif)</option>
                  {customFonts.map((f) => (
                    <option key={f.name} value={f.name}>{f.name} (Custom)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px', fontWeight: '600' }}>
                  Text Effect:
                </label>
                <select
                  value={config.effect || 'none'}
                  onChange={(e) => onUpdate({ effect: e.target.value as any })}
                  style={{
                    width: '100%',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    fontSize: '12px'
                  }}
                >
                  <option value="none">Flat (Normal)</option>
                  <option value="arch">Arched Curve</option>
                  <option value="shadow">Drop Shadow</option>
                </select>
              </div>
            </div>

            {/* Font Size & Max Width */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                  <span>Font Size:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{config.fontSize}&quot;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="range"
                    min={0.5}
                    max={isName ? 5.0 : 14.0}
                    step={0.1}
                    value={config.fontSize}
                    onChange={(e) => onUpdate({ fontSize: parseFloat(e.target.value) })}
                    style={{ flex: 1, accentColor: '#E4572E' }}
                  />
                  <input
                    type="number"
                    min={0.5}
                    max={14.0}
                    step={0.1}
                    value={config.fontSize}
                    onChange={(e) => onUpdate({ fontSize: parseFloat(e.target.value) || 1 })}
                    style={{
                      width: '52px',
                      backgroundColor: '#27272A',
                      border: '1px solid #3F3F46',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                  <span>Max Width Limit:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{config.maxW}&quot;</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={config.maxW}
                    onChange={(e) => onUpdate({ maxW: parseFloat(e.target.value) })}
                    style={{ flex: 1, accentColor: '#E4572E' }}
                  />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={0.5}
                    value={config.maxW}
                    onChange={(e) => onUpdate({ maxW: parseFloat(e.target.value) || 1 })}
                    style={{
                      width: '52px',
                      backgroundColor: '#27272A',
                      border: '1px solid #3F3F46',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '3px 6px',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Letter Spacing & Case */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                  <span>Letter Spacing:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{(config.letterSpacing || 0).toFixed(2)}&quot;</span>
                </div>
                <input
                  type="range"
                  min={-0.05}
                  max={0.6}
                  step={0.01}
                  value={config.letterSpacing || 0}
                  onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#E4572E' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px', fontWeight: '600' }}>
                  Case Transformation:
                </label>
                <select
                  value={config.caseType}
                  onChange={(e) => onUpdate({ caseType: e.target.value as any })}
                  style={{
                    width: '100%',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px'
                  }}
                >
                  <option value="uppercase">ALL UPPERCASE</option>
                  <option value="normal">As Typed</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Color, Fill & Outline (Stroke) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fill & Outline Colors
              </span>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#27272A', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => onUpdate({ fillType: 'solid' })}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: (!config.fillType || config.fillType === 'solid') ? '#E4572E' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Solid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({ 
                      fillType: 'gradient',
                      gradientColor1: config.gradientColor1 || config.color || '#E4572E',
                      gradientColor2: config.gradientColor2 || '#000000'
                    });
                    if (onOpenGradientEditor) onOpenGradientEditor();
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: config.fillType === 'gradient' ? '#E4572E' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <Sparkles size={10} /> Gradient
                </button>
              </div>
            </div>

            {/* Quick Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#A1A1AA', flexShrink: 0 }}>Presets:</span>
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdate({ color: c })}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: config.color === c ? '2px solid #E4572E' : '1px solid #3F3F46',
                    boxShadow: config.color === c ? '0 0 0 2px rgba(228, 87, 46, 0.4)' : 'none',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title={`Select ${c}`}
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Fill Color */}
              <div style={{ backgroundColor: '#27272A', padding: '10px', borderRadius: '8px', border: '1px solid #3F3F46' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#A1A1AA', marginBottom: '6px', fontWeight: '600' }}>
                  Text Fill Color:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={config.color.startsWith('#') ? config.color : '#FFFFFF'}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    style={{
                      flex: 1,
                      backgroundColor: '#18181B',
                      border: '1px solid #3F3F46',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  />
                </div>
              </div>

              {/* Stroke / Outline */}
              <div style={{ backgroundColor: '#27272A', padding: '10px', borderRadius: '8px', border: '1px solid #3F3F46' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#A1A1AA', marginBottom: '6px', fontWeight: '600' }}>
                  Stroke (Outline) Color:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={config.strokeColor.startsWith('#') ? config.strokeColor : '#000000'}
                    onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                    style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input
                    type="text"
                    value={config.strokeColor}
                    onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                    style={{
                      flex: 1,
                      backgroundColor: '#18181B',
                      border: '1px solid #3F3F46',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stroke Width Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                <span>Outline Width (Stroke Thickness):</span>
                <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{config.strokeWidth} px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={16}
                  step={0.5}
                  value={config.strokeWidth}
                  onChange={(e) => onUpdate({ strokeWidth: parseFloat(e.target.value) })}
                  style={{ flex: 1, accentColor: '#E4572E' }}
                />
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={config.strokeWidth}
                  onChange={(e) => onUpdate({ strokeWidth: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '52px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '3px 6px',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. Position & Alignment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Position & Alignment
            </span>

            {/* Alignment buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#A1A1AA', width: '75px' }}>Align:</span>
              <div style={{ display: 'flex', flex: 1, backgroundColor: '#27272A', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3F3F46' }}>
                <button
                  type="button"
                  onClick={() => onUpdate({ align: 'left' })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: 'none',
                    backgroundColor: config.align === 'left' ? '#E4572E' : 'transparent',
                    color: config.align === 'left' ? '#FFFFFF' : '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <AlignLeft size={14} /> Left (L)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ align: 'center' })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: 'none',
                    borderLeft: '1px solid #3F3F46',
                    borderRight: '1px solid #3F3F46',
                    backgroundColor: (!config.align || config.align === 'center') ? '#E4572E' : 'transparent',
                    color: (!config.align || config.align === 'center') ? '#FFFFFF' : '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <AlignCenter size={14} /> Center (C)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ align: 'right' })}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: 'none',
                    backgroundColor: config.align === 'right' ? '#E4572E' : 'transparent',
                    color: config.align === 'right' ? '#FFFFFF' : '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <AlignRight size={14} /> Right (R)
                </button>
              </div>
            </div>

            {/* Vertical Y Position */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                <span>Vertical Position (Y%):</span>
                <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{config.yPos}%</span>
              </div>
              <input
                type="range"
                min={2}
                max={96}
                value={config.yPos}
                onChange={(e) => onUpdate({ yPos: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#E4572E' }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => onUpdate({ yPos: 12 })}
                  style={{
                    flex: 1,
                    padding: '3px',
                    fontSize: '10px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#A1A1AA',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Top (12%)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ yPos: isName ? 24 : 47 })}
                  style={{
                    flex: 1,
                    padding: '3px',
                    fontSize: '10px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#A1A1AA',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Standard ({isName ? '24%' : '47%'})
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ yPos: 50 })}
                  style={{
                    flex: 1,
                    padding: '3px',
                    fontSize: '10px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#A1A1AA',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Center (50%)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ yPos: 80 })}
                  style={{
                    flex: 1,
                    padding: '3px',
                    fontSize: '10px',
                    backgroundColor: '#27272A',
                    border: '1px solid #3F3F46',
                    color: '#A1A1AA',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Bottom (80%)
                </button>
              </div>
            </div>

            {/* Horizontal X Position (for Front Panel or free position) */}
            {panelKey === 'front' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A1A1AA', marginBottom: '4px' }}>
                  <span>Horizontal Position (X%):</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{config.xPos ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={config.xPos ?? 50}
                  onChange={(e) => onUpdate({ xPos: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#E4572E' }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onUpdate({ xPos: 25, align: 'center' })}
                    style={{ flex: 1, padding: '3px', fontSize: '10px', backgroundColor: '#27272A', border: '1px solid #3F3F46', color: '#A1A1AA', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Left Chest (25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ xPos: 50, align: 'center' })}
                    style={{ flex: 1, padding: '3px', fontSize: '10px', backgroundColor: '#27272A', border: '1px solid #3F3F46', color: '#A1A1AA', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Center (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ xPos: 75, align: 'center' })}
                    style={{ flex: 1, padding: '3px', fontSize: '10px', backgroundColor: '#27272A', border: '1px solid #3F3F46', color: '#A1A1AA', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Right Chest (75%)
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1E1E22'
          }}
        >
          {onUndo ? (
            <button
              type="button"
              onClick={onUndo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #3F3F46',
                backgroundColor: 'transparent',
                color: '#A1A1AA',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Undo last change (Ctrl+Z)"
            >
              <RotateCcw size={13} /> Undo (Ctrl+Z)
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 22px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#E4572E',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(228, 87, 46, 0.4)'
            }}
          >
            <Check size={15} /> Done
          </button>
        </div>
      </div>
    </div>
  );
};
