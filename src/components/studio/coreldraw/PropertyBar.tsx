import React from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, AlignLeft, AlignCenter, AlignRight, 
  Lock, Unlock, Type, Image as ImageIcon, Paintbrush, Layers, Sliders, Sparkles 
} from 'lucide-react';
import type { CorelTool } from './ToolBox';
import type { PanelConfig, TextConfig } from '../designer';

interface PropertyBarProps {
  activeTool: CorelTool;
  activeTab: 'front' | 'back' | 'dual' | 'collar' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD';
  panel: PanelConfig;
  physicalWidth: number;
  physicalHeight: number;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  onUpdatePanel: (fields: Partial<PanelConfig>) => void;
  activeTextLayer?: 'name' | 'number' | 'sizeTag' | null;
  onSelectTextLayer: (layer: 'name' | 'number' | 'sizeTag') => void;
  previewSleeveType?: 'half' | 'full';
  onSleeveTypeChange?: (type: 'half' | 'full') => void;
  customFonts?: Array<{ name: string; url: string }>;
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
  onSleeveTypeChange,
  customFonts
}) => {
  const resolvedLayer: 'name' | 'number' | 'sizeTag' = 
    activeTextLayer || (panel.nameConfig?.enabled ? 'name' : panel.numberConfig?.enabled ? 'number' : 'sizeTag');

  const activeTextConfig: TextConfig | undefined = 
    resolvedLayer === 'name' ? panel.nameConfig :
    resolvedLayer === 'number' ? panel.numberConfig :
    panel.sizeTagConfig;

  // Resolve custom fonts from props or localStorage
  const effectiveCustomFonts = React.useMemo(() => {
    let fonts = customFonts || [];
    if (fonts.length === 0 && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('teedex_custom_fonts');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            fonts = parsed;
          }
        }
      } catch (e) {
        console.error('Failed to read teedex_custom_fonts in PropertyBar', e);
      }
    }
    return fonts;
  }, [customFonts]);

  // Ensure any custom fonts are loaded into document.fonts
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('fonts' in document)) return;
    effectiveCustomFonts.forEach(async (font) => {
      try {
        let alreadyLoaded = false;
        document.fonts.forEach(f => {
          if (f.family === font.name) alreadyLoaded = true;
        });
        if (!alreadyLoaded) {
          const fontFace = new FontFace(font.name, `url(${font.url})`);
          const loaded = await fontFace.load();
          document.fonts.add(loaded);
        }
      } catch (e) {
        console.error('Error registering custom font in PropertyBar:', font.name, e);
      }
    });
  }, [effectiveCustomFonts]);

  const updateActiveText = (fields: Partial<TextConfig>) => {
    if (!activeTextConfig) return;
    const configKey = resolvedLayer === 'name' ? 'nameConfig' : resolvedLayer === 'number' ? 'numberConfig' : 'sizeTagConfig';
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
          background: '#FBE7E1',
          border: '1px solid #F5C4B2',
          borderRadius: '8px',
          padding: '4px 10px',
        }}
      >
        <span style={{ fontWeight: '600', color: '#E4572E', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E4572E' }} />
          [{activeTool}]
        </span>
      </div>

      {/* 2. PANEL SIZE / TAB CONTROL */}
      <div 
        className="cd-property-group"
        style={{
          background: '#FFFFFF',
          border: '1px solid #D8D5CF',
          borderRadius: '8px',
          padding: '4px 10px',
        }}
      >
        <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Page Size:</span>
        <span style={{ color: '#E4572E', fontWeight: '700', fontSize: '11px', marginLeft: '4px', letterSpacing: '0.02em' }}>
          {physicalWidth}" × {physicalHeight}"
        </span>
      </div>



      {/* 4. ZOOM CONTROLS */}
      {activeTool === 'zoom' && (
        <div 
          className="cd-property-group"
          style={{
            background: '#FFFFFF',
            border: '1px solid #D8D5CF',
            borderRadius: '8px',
            padding: '3px 8px',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Zoom:</span>
          {[0.5, 1, 1.5, 2].map(z => (
            <button
              key={z}
              type="button"
              onClick={() => onSetZoom(z)}
              style={{
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: '600',
                background: zoom === z ? '#E4572E' : '#FFFFFF',
                color: zoom === z ? '#FFFFFF' : '#686661',
                border: zoom === z ? '1px solid #E4572E' : '1px solid #D8D5CF',
                cursor: 'pointer',
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
              fontWeight: '600',
              background: '#FBE7E1', 
              color: '#E4572E', 
              border: '1px solid #F5C4B2', 
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
      {(activeTool === 'text' || !!activeTextLayer) && activeTextConfig && (
        <>
          {/* Layer Selector */}
          <div 
            className="cd-property-group"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 6px',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#92908A', textTransform: 'uppercase' }}>Layer:</span>
            {(['name', 'number', 'sizeTag'] as const).map(l => {
              const isSelected = activeTextLayer === l || (!activeTextLayer && resolvedLayer === l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => onSelectTextLayer(l)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: isSelected ? '#E4572E' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#686661',
                    border: isSelected ? '1px solid #E4572E' : '1px solid #D8D5CF',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>

          {/* Font & Size */}
          <div 
            className="cd-property-group"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Font:</span>
            <select
              value={activeTextConfig.fontFamily || 'OldSport02AthleticNcv-E0gj'}
              onChange={(e) => updateActiveText({ fontFamily: e.target.value })}
              style={{
                width: '145px',
                border: '1px solid #D8D5CF',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 6px',
                outline: 'none',
                background: '#FFFFFF',
                color: '#1A1917',
                cursor: 'pointer'
              }}
            >
              <optgroup label="Standard Fonts">
                <option value="OldSport02AthleticNcv-E0gj">Athletic Bold (Default)</option>
                <option value="Impact">Impact (Bold Athletic)</option>
                <option value="Arial">Arial Black</option>
                <option value="Trebuchet MS">Trebuchet (Modern Sans)</option>
                <option value="Times New Roman">Times (Classic Serif)</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
              </optgroup>

              {effectiveCustomFonts.length > 0 && (
                <optgroup label="Custom Uploaded Fonts">
                  {effectiveCustomFonts.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.name} (Custom)
                    </option>
                  ))}
                </optgroup>
              )}

              {activeTextConfig.fontFamily &&
                ![
                  'OldSport02AthleticNcv-E0gj',
                  'Impact',
                  'Arial',
                  'Trebuchet MS',
                  'Times New Roman',
                  'Roboto',
                  'Montserrat',
                  ...effectiveCustomFonts.map(f => f.name)
                ].includes(activeTextConfig.fontFamily) && (
                  <optgroup label="Current Font">
                    <option value={activeTextConfig.fontFamily}>
                      {activeTextConfig.fontFamily}
                    </option>
                  </optgroup>
                )
              }
            </select>

            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600', marginLeft: '4px' }}>Size:</span>
            <input
              type="number"
              step="0.1"
              value={activeTextConfig.fontSize}
              onChange={(e) => updateActiveText({ fontSize: parseFloat(e.target.value) || 1 })}
              style={{
                width: '50px',
                border: '1px solid #D8D5CF',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
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
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 6px',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Align:</span>
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
                      background: isSelected ? '#E4572E' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#686661',
                      border: isSelected ? '1px solid #E4572E' : '1px solid #D8D5CF',
                      cursor: 'pointer',
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
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Fill:</span>
            <input
              type="color"
              value={activeTextConfig.color}
              onChange={(e) => updateActiveText({ color: e.target.value })}
              style={{ width: '24px', height: '22px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600', marginLeft: '4px' }}>Stroke:</span>
            <input
              type="color"
              value={activeTextConfig.strokeColor}
              onChange={(e) => updateActiveText({ strokeColor: e.target.value })}
              style={{ width: '24px', height: '22px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600', marginLeft: '4px' }}>Width:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={activeTextConfig.strokeWidth || 0}
              onChange={(e) => updateActiveText({ strokeWidth: parseFloat(e.target.value) || 0 })}
              style={{
                width: '46px',
                border: '1px solid #D8D5CF',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
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
            background: '#FFFFFF',
            border: '1px solid #D8D5CF',
            borderRadius: '8px',
            padding: '3px 8px',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Torso Logo (in):</span>
          <input
            type="number"
            step="0.5"
            placeholder="W"
            value={panel.torsoLogo?.width || 8.5}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), width: parseFloat(e.target.value) || 1 } })}
            style={{
              width: '46px',
              border: '1px solid #D8D5CF',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 4px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
          <span style={{ color: '#92908A' }}>×</span>
          <input
            type="number"
            step="0.5"
            placeholder="H"
            value={panel.torsoLogo?.height || 2.6}
            onChange={(e) => onUpdatePanel({ torsoLogo: { ...(panel.torsoLogo || { enabled: true, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11, yPos: 13.3 }), height: parseFloat(e.target.value) || 1 } })}
            style={{
              width: '46px',
              border: '1px solid #D8D5CF',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
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
          background: '#FFFFFF',
          border: '1px solid #D8D5CF',
          borderRadius: '8px',
          padding: '3px 8px',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '700' }}>BG Colors:</span>
        <input
          type="color"
          value={panel.generatedColor1}
          onChange={(e) => onUpdatePanel({ generatedColor1: e.target.value })}
          title="Background Color 1"
          style={{ width: '22px', height: '20px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
        />
        <input
          type="color"
          value={panel.generatedColor2}
          onChange={(e) => onUpdatePanel({ generatedColor2: e.target.value })}
          title="Background Color 2"
          style={{ width: '22px', height: '20px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
        />
      </div>
    </div>
  );
};
