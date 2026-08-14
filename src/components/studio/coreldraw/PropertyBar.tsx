import React from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, AlignLeft, AlignCenter, AlignRight, 
  Lock, Unlock, Type, Image as ImageIcon, Paintbrush, Layers, Sliders 
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
    <div className="cd-propertybar">
      {/* 1. TOOL INDICATOR BADGE */}
      <div className="cd-property-group">
        <span style={{ fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', fontSize: '10px' }}>
          [{activeTool}]
        </span>
      </div>

      {/* 2. PANEL SIZE / TAB CONTROL */}
      <div className="cd-property-group">
        <span style={{ opacity: 0.6 }}>Page Size:</span>
        <span style={{ color: '#00f0ff', fontWeight: '600' }}>{physicalWidth}" × {physicalHeight}"</span>

        {(activeTab === 'dual' || activeTab === 'sleeveLeft' || activeTab === 'sleeveRight') && previewSleeveType && onSleeveTypeChange && (
          <div className="cd-property-group" style={{ gap: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Sleeve:</span>
            <button
              onClick={() => onSleeveTypeChange('half')}
              style={{
                padding: '2px 8px', fontSize: '10px', fontWeight: '700', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: previewSleeveType === 'half' ? 'rgba(0,229,255,0.2)' : 'transparent',
                color: previewSleeveType === 'half' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >½</button>
            <button
              onClick={() => onSleeveTypeChange('full')}
              style={{
                padding: '2px 8px', fontSize: '10px', fontWeight: '700', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: previewSleeveType === 'full' ? 'rgba(0,229,255,0.2)' : 'transparent',
                color: previewSleeveType === 'full' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >Full</button>
          </div>
        )}
      </div>

      {/* 3. TOOL-SPECIFIC CONTROLS */}
      {activeTool === 'zoom' && (
        <div className="cd-property-group">
          <span style={{ opacity: 0.6 }}>Zoom level:</span>
          {[0.5, 1, 1.5, 2].map(z => (
            <button
              key={z}
              onClick={() => onSetZoom(z)}
              style={{
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                background: zoom === z ? '#0284c7' : '#1e1e28',
                color: zoom === z ? '#fff' : '#94a3b8',
                border: '1px solid #334155',
                cursor: 'pointer'
              }}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
          <button
            onClick={() => onSetZoom(1)}
            style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', background: '#1e1e28', color: '#38bdf8', border: '1px solid #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <RotateCcw size={10} /> Reset
          </button>
        </div>
      )}

      {activeTool === 'text' && activeTextConfig && (
        <>
          <div className="cd-property-group">
            <span style={{ opacity: 0.6 }}>Layer:</span>
            {(['name', 'number', 'sizeTag'] as const).map(l => (
              <button
                key={l}
                onClick={() => onSelectTextLayer(l)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  background: activeTextLayer === l ? '#0284c7' : '#1e1e28',
                  color: activeTextLayer === l ? '#fff' : '#94a3b8',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="cd-property-group">
            <span style={{ opacity: 0.6 }}>Font:</span>
            <select
              value={activeTextConfig.fontFamily}
              onChange={(e) => updateActiveText({ fontFamily: e.target.value })}
              className="cd-property-input"
              style={{ width: '110px' }}
            >
              <option value="OldSport02AthleticNcv-E0gj">Athletic Bold</option>
              <option value="Impact">Impact</option>
              <option value="Arial">Arial</option>
              <option value="Roboto">Roboto</option>
              <option value="Montserrat">Montserrat</option>
            </select>

            <span style={{ opacity: 0.6, marginLeft: '6px' }}>Size:</span>
            <input
              type="number"
              step="0.1"
              value={activeTextConfig.fontSize}
              onChange={(e) => updateActiveText({ fontSize: parseFloat(e.target.value) || 1 })}
              className="cd-property-input"
              style={{ width: '50px' }}
            />
          </div>

          <div className="cd-property-group">
            <span style={{ opacity: 0.6 }}>Align:</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => updateActiveText({ align: a })}
                  style={{
                    padding: '3px 5px',
                    borderRadius: '3px',
                    background: (activeTextConfig.align || 'center') === a ? '#0284c7' : '#1e1e28',
                    color: '#fff',
                    border: '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="cd-property-group">
            <span style={{ opacity: 0.6 }}>Fill:</span>
            <input
              type="color"
              value={activeTextConfig.color}
              onChange={(e) => updateActiveText({ color: e.target.value })}
              style={{ width: '22px', height: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <span style={{ opacity: 0.6, marginLeft: '4px' }}>Stroke:</span>
            <input
              type="color"
              value={activeTextConfig.strokeColor}
              onChange={(e) => updateActiveText({ strokeColor: e.target.value })}
              style={{ width: '22px', height: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <span style={{ opacity: 0.6, marginLeft: '6px' }}>W:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeTextConfig.strokeWidth || 0}
              onChange={(e) => updateActiveText({ strokeWidth: parseFloat(e.target.value) || 0 })}
              className="cd-property-input"
              style={{ width: '50px', marginLeft: '2px' }}
            />
          </div>
        </>
      )}

      {activeTool === 'logo' && (
        <div className="cd-property-group">
          <span style={{ opacity: 0.6 }}>Torso Logo W/H (in):</span>
          <input
            type="number"
            step="0.5"
            placeholder="W"
            value={panel.torsoLogo?.width || 8.5}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), width: parseFloat(e.target.value) || 1 } })}
            className="cd-property-input"
            style={{ width: '45px' }}
          />
          <span>×</span>
          <input
            type="number"
            step="0.5"
            placeholder="H"
            value={panel.torsoLogo?.height || 2.6}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), height: parseFloat(e.target.value) || 1 } })}
            className="cd-property-input"
            style={{ width: '45px' }}
          />
        </div>
      )}

      {/* QUICK BACKGROUND COLOR CHOOSERS */}
      <div className="cd-property-group" style={{ marginLeft: 'auto' }}>
        <span style={{ opacity: 0.6 }}>BG Colors:</span>
        <input
          type="color"
          value={panel.generatedColor1}
          onChange={(e) => onUpdatePanel({ generatedColor1: e.target.value })}
          title="Background Color 1"
          style={{ width: '22px', height: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
        />
        <input
          type="color"
          value={panel.generatedColor2}
          onChange={(e) => onUpdatePanel({ generatedColor2: e.target.value })}
          title="Background Color 2"
          style={{ width: '22px', height: '20px', border: 'none', background: 'none', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};
