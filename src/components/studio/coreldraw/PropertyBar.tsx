import React from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, AlignLeft, AlignCenter, AlignRight, 
  Lock, Unlock, Type, Image as ImageIcon, Paintbrush, Layers, Sliders, Sparkles 
} from 'lucide-react';
import type { CorelTool } from './ToolBox';
import type { PanelConfig, TextConfig } from '../designer';

interface PropertyBarProps {
  activeTool: CorelTool;
  activeTab: 'front' | 'back' | 'dual' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD';
  panel: PanelConfig;
  physicalWidth: number;
  physicalHeight: number;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  onUpdatePanel: (fields: Partial<PanelConfig>) => void;
  activeTextLayer: 'name' | 'number' | 'sizeTag';
  onSelectTextLayer: (layer: 'name' | 'number' | 'sizeTag') => void;
  previewSleeveType?: 'half' | 'full';
  onSleeveTypeChange?: (type: 'half' | 'full') => void;
}

export const PropertyBar: React.FC<PropertyBarProps> = ({
  activeTool,
  activeTab,
  panel,
  physicalWidth,
  physicalHeight,
  zoom,
  onSetZoom,
  onUpdatePanel,
  activeTextLayer,
  onSelectTextLayer,
  previewSleeveType,
  onSleeveTypeChange
}) => {
  const activeTextConfig: TextConfig | undefined = 
    activeTextLayer === 'name' ? panel.nameConfig :
    activeTextLayer === 'number' ? panel.numberConfig :
    panel.sizeTagConfig;

  const updateActiveText = (fields: Partial<TextConfig>) => {
    if (!activeTextConfig) return;
    const configKey = activeTextLayer === 'name' ? 'nameConfig' : activeTextLayer === 'number' ? 'numberConfig' : 'sizeTagConfig';
    onUpdatePanel({
      [configKey]: {
        ...activeTextConfig,
        ...fields
      }
    });
  };

  return (
    <div 
      className="cd-propertybar" 
      style={{ 
        background: 'rgba(6, 10, 24, 0.85)', 
        backdropFilter: 'blur(32px) saturate(200%)', 
        WebkitBackdropFilter: 'blur(32px) saturate(200%)', 
        borderBottom: '1px solid rgba(0, 229, 255, 0.25)', 
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '42px',
        minHeight: '42px',
        padding: '0 12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        boxSizing: 'border-box',
        zIndex: 35
      }}
    >
      {/* 1. ACTIVE TOOL BADGE */}
      <div 
        className="cd-property-group"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.18) 0%, rgba(124, 58, 237, 0.12) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.45)',
          borderRadius: '8px',
          padding: '4px 10px',
          boxShadow: '0 0 12px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        <span style={{ fontWeight: '800', color: '#00e5ff', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
          [{activeTool}]
        </span>
      </div>

      {/* 2. PANEL SIZE / TAB CONTROL */}
      <div 
        className="cd-property-group"
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          padding: '4px 10px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Page Size:</span>
        <span style={{ color: '#00e5ff', fontWeight: '800', fontSize: '11px', marginLeft: '4px', letterSpacing: '0.02em' }}>
          {physicalWidth}" × {physicalHeight}"
        </span>
      </div>

      {/* 3. SLEEVE STYLE TOGGLE */}
      {previewSleeveType && onSleeveTypeChange && (
        <div 
          className="cd-property-group" 
          style={{ 
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '8px',
            padding: '3px 6px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '2px' }}>
            Sleeve:
          </span>
          <button
            type="button"
            onClick={() => onSleeveTypeChange('half')}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '6px',
              border: previewSleeveType === 'half' ? '1px solid #00e5ff' : '1px solid transparent',
              cursor: 'pointer',
              background: previewSleeveType === 'half' 
                ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                : 'rgba(255, 255, 255, 0.04)',
              color: previewSleeveType === 'half' ? '#040814' : '#94a3b8',
              boxShadow: previewSleeveType === 'half' ? '0 0 14px rgba(0, 229, 255, 0.5)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Half Sleeve
          </button>
          <button
            type="button"
            onClick={() => onSleeveTypeChange('full')}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '800',
              borderRadius: '6px',
              border: previewSleeveType === 'full' ? '1px solid #00e5ff' : '1px solid transparent',
              cursor: 'pointer',
              background: previewSleeveType === 'full' 
                ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                : 'rgba(255, 255, 255, 0.04)',
              color: previewSleeveType === 'full' ? '#040814' : '#94a3b8',
              boxShadow: previewSleeveType === 'full' ? '0 0 14px rgba(0, 229, 255, 0.5)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Full Sleeve
          </button>
        </div>
      )}

      {/* 4. ZOOM CONTROLS */}
      {activeTool === 'zoom' && (
        <div 
          className="cd-property-group"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '8px',
            padding: '3px 8px',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Zoom:</span>
          {[0.5, 1, 1.5, 2].map(z => (
            <button
              key={z}
              type="button"
              onClick={() => onSetZoom(z)}
              style={{
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: '700',
                background: zoom === z 
                  ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                  : 'rgba(255,255,255,0.05)',
                color: zoom === z ? '#040814' : '#94a3b8',
                border: zoom === z ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                boxShadow: zoom === z ? '0 0 10px rgba(0, 229, 255, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
          <button
            type="button"
            onClick={() => onSetZoom(1)}
            style={{ 
              padding: '3px 8px', 
              borderRadius: '5px', 
              fontSize: '10px', 
              fontWeight: '700',
              background: 'rgba(0, 229, 255, 0.12)', 
              color: '#00e5ff', 
              border: '1px solid rgba(0, 229, 255, 0.35)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      )}

      {/* 5. TEXT CONTROLS */}
      {activeTool === 'text' && activeTextConfig && (
        <>
          {/* Layer Selector */}
          <div 
            className="cd-property-group"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '8px',
              padding: '3px 6px',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Layer:</span>
            {(['name', 'number', 'sizeTag'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => onSelectTextLayer(l)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: activeTextLayer === l 
                    ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                    : 'rgba(255, 255, 255, 0.04)',
                  color: activeTextLayer === l ? '#040814' : '#94a3b8',
                  border: activeTextLayer === l ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  boxShadow: activeTextLayer === l ? '0 0 10px rgba(0, 229, 255, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Font & Size */}
          <div 
            className="cd-property-group"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Font:</span>
            <select
              value={activeTextConfig.fontFamily}
              onChange={(e) => updateActiveText({ fontFamily: e.target.value })}
              style={{
                width: '120px',
                background: 'rgba(10, 16, 32, 0.95)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 6px',
                outline: 'none'
              }}
            >
              <option value="OldSport02AthleticNcv-E0gj">Athletic Bold</option>
              <option value="Impact">Impact</option>
              <option value="Arial">Arial</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
            </select>

            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginLeft: '4px' }}>Size:</span>
            <input
              type="number"
              step="0.1"
              value={activeTextConfig.fontSize}
              onChange={(e) => updateActiveText({ fontSize: parseFloat(e.target.value) || 1 })}
              style={{
                width: '50px',
                background: 'rgba(10, 16, 32, 0.95)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 6px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>

          {/* Alignment */}
          <div 
            className="cd-property-group"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '8px',
              padding: '3px 6px',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Align:</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {(['left', 'center', 'right'] as const).map(a => {
                const isSelected = (activeTextConfig.align || 'center') === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => updateActiveText({ align: a })}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '5px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)' 
                        : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#040814' : '#94a3b8',
                      border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 10px rgba(0, 229, 255, 0.4)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fill & Stroke */}
          <div 
            className="cd-property-group"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Fill:</span>
            <input
              type="color"
              value={activeTextConfig.color}
              onChange={(e) => updateActiveText({ color: e.target.value })}
              style={{ width: '24px', height: '22px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginLeft: '4px' }}>Stroke:</span>
            <input
              type="color"
              value={activeTextConfig.strokeColor}
              onChange={(e) => updateActiveText({ strokeColor: e.target.value })}
              style={{ width: '24px', height: '22px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginLeft: '4px' }}>Width:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeTextConfig.strokeWidth || 0}
              onChange={(e) => updateActiveText({ strokeWidth: parseFloat(e.target.value) || 0 })}
              style={{
                width: '46px',
                background: 'rgba(10, 16, 32, 0.95)',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 4px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>
        </>
      )}

      {/* 6. LOGO CONTROLS */}
      {activeTool === 'logo' && (
        <div 
          className="cd-property-group"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            borderRadius: '8px',
            padding: '3px 8px',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Torso Logo (in):</span>
          <input
            type="number"
            step="0.5"
            placeholder="W"
            value={panel.torsoLogo?.width || 8.5}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), width: parseFloat(e.target.value) || 1 } })}
            style={{
              width: '46px',
              background: 'rgba(10, 16, 32, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 4px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
          <span style={{ color: '#94a3b8' }}>×</span>
          <input
            type="number"
            step="0.5"
            placeholder="H"
            value={panel.torsoLogo?.height || 2.6}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), height: parseFloat(e.target.value) || 1 } })}
            style={{
              width: '46px',
              background: 'rgba(10, 16, 32, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 4px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* 7. QUICK BACKGROUND COLOR CHOOSERS */}
      <div 
        className="cd-property-group" 
        style={{ 
          marginLeft: 'auto',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          borderRadius: '8px',
          padding: '3px 8px',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>BG Colors:</span>
        <input
          type="color"
          value={panel.generatedColor1}
          onChange={(e) => onUpdatePanel({ generatedColor1: e.target.value })}
          title="Background Color 1"
          style={{ width: '22px', height: '20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
        />
        <input
          type="color"
          value={panel.generatedColor2}
          onChange={(e) => onUpdatePanel({ generatedColor2: e.target.value })}
          title="Background Color 2"
          style={{ width: '22px', height: '20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
        />
      </div>
    </div>
  );
};
