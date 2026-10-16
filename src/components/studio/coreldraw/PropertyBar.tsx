import React from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, AlignLeft, AlignCenter, AlignRight, 
  Lock, Unlock, Type, Image as ImageIcon, Paintbrush, Layers, Sliders, Sparkles,
  Plus, Trash2, X
} from 'lucide-react';
import type { CorelTool } from './ToolBox';
import { getEffectiveStrokes, type PanelConfig, type TextConfig, type StrokeConfig } from '../designer';

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
  onOpenGradientModal?: (targetId: string) => void;
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
  customFonts,
  onOpenGradientModal
}) => {
  const resolvedLayer: 'name' | 'number' | 'sizeTag' = 
    activeTextLayer || (panel.nameConfig?.enabled ? 'name' : panel.numberConfig?.enabled ? 'number' : 'sizeTag');

  const activeTextConfig: TextConfig | undefined = 
    resolvedLayer === 'name' ? panel.nameConfig :
    resolvedLayer === 'number' ? panel.numberConfig :
    panel.sizeTagConfig;

  const [selectedStrokeIdx, setSelectedStrokeIdx] = React.useState(0);

  React.useEffect(() => {
    setSelectedStrokeIdx(0);
  }, [resolvedLayer]);

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

  const strokes = getEffectiveStrokes(activeTextConfig);
  const safeStrokeIdx = Math.min(selectedStrokeIdx, Math.max(0, strokes.length - 1));
  const currentStroke = strokes[safeStrokeIdx] || strokes[0];

  const handleAddStroke = () => {
    if (!activeTextConfig) return;
    const currentExtra = Array.isArray(activeTextConfig.extraStrokes) ? [...activeTextConfig.extraStrokes] : [];
    const defaultW = resolvedLayer === 'name' ? 1.8 : 0.7;
    const newStroke: StrokeConfig = {
      color: currentExtra.length % 2 === 0 ? '#ffffff' : '#000000',
      width: defaultW,
      type: 'solid',
      gradientColor1: '#00e5ff',
      gradientColor2: '#ff0055',
      gradientStops: ['#00e5ff', '#ff0055'],
      gradientDirection: 'vertical'
    };
    const updatedExtra = [...currentExtra, newStroke];
    updateActiveText({ extraStrokes: updatedExtra });
    setSelectedStrokeIdx(updatedExtra.length);
  };

  const handleUpdateCurrentStroke = (updates: Partial<StrokeConfig>) => {
    if (!activeTextConfig) return;
    if (safeStrokeIdx === 0) {
      const mapped: Partial<TextConfig> = {};
      if (updates.color !== undefined) mapped.strokeColor = updates.color;
      if (updates.width !== undefined) mapped.strokeWidth = updates.width;
      if (updates.type !== undefined) mapped.strokeType = updates.type;
      if (updates.gradientColor1 !== undefined) mapped.strokeGradientColor1 = updates.gradientColor1;
      if (updates.gradientColor2 !== undefined) mapped.strokeGradientColor2 = updates.gradientColor2;
      if (updates.gradientStops !== undefined) mapped.strokeGradientStops = updates.gradientStops;
      if (updates.gradientDirection !== undefined) mapped.strokeGradientDirection = updates.gradientDirection;
      updateActiveText(mapped);
    } else {
      const currentExtra = [...(activeTextConfig.extraStrokes || [])];
      const extraIdx = safeStrokeIdx - 1;
      if (currentExtra[extraIdx]) {
        currentExtra[extraIdx] = { ...currentExtra[extraIdx], ...updates };
        updateActiveText({ extraStrokes: currentExtra });
      }
    }
  };

  const handleRemoveStroke = (index: number) => {
    if (!activeTextConfig || index <= 0) return;
    const currentExtra = [...(activeTextConfig.extraStrokes || [])];
    const updatedExtra = currentExtra.filter((_, i) => i !== index - 1);
    updateActiveText({ extraStrokes: updatedExtra });
    if (safeStrokeIdx >= index) {
      setSelectedStrokeIdx(Math.max(0, index - 1));
    }
  };

  const isFillGradient = activeTextConfig?.fillType === 'gradient';
  const fillGradientStops = (activeTextConfig?.gradientStops && activeTextConfig.gradientStops.length >= 2)
    ? activeTextConfig.gradientStops
    : [activeTextConfig?.gradientColor1 || activeTextConfig?.color || '#e4572e', activeTextConfig?.gradientColor2 || '#000000'];

  const handleToggleFillGradient = () => {
    if (!activeTextConfig) return;
    if (!isFillGradient) {
      updateActiveText({
        fillType: 'gradient',
        gradientColor1: activeTextConfig.gradientColor1 || activeTextConfig.color || '#e4572e',
        gradientColor2: activeTextConfig.gradientColor2 || '#000000',
        gradientStops: fillGradientStops
      });
      if (onOpenGradientModal) {
        onOpenGradientModal(resolvedLayer);
      }
    } else {
      updateActiveText({ fillType: 'solid' });
    }
  };

  const isStrokeGradient = currentStroke?.type === 'gradient';
  const strokeGradientStops = (currentStroke?.gradientStops && currentStroke.gradientStops.length >= 2)
    ? currentStroke.gradientStops
    : [currentStroke?.gradientColor1 || currentStroke?.color || '#00e5ff', currentStroke?.gradientColor2 || '#ff0055'];

  const handleToggleStrokeGradient = () => {
    if (!activeTextConfig) return;
    if (!isStrokeGradient) {
      handleUpdateCurrentStroke({
        type: 'gradient',
        gradientColor1: currentStroke?.gradientColor1 || currentStroke?.color || '#00e5ff',
        gradientColor2: currentStroke?.gradientColor2 || '#ff0055',
        gradientStops: strokeGradientStops
      });
      if (onOpenGradientModal) {
        onOpenGradientModal(`${resolvedLayer}-stroke-${safeStrokeIdx}`);
      }
    } else {
      handleUpdateCurrentStroke({ type: 'solid' });
    }
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

      {/* 4. ZOOM CONTROLS */}
      {activeTool === 'zoom' && (
        <div 
          className="cd-property-group"
          style={{
            background: '#FFFFFF',
            border: '1px solid #D8D5CF',
            borderRadius: '8px',
            padding: '3px 8px',
            gap: '5px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Zoom Tool:</span>
          
          <button
            type="button"
            onClick={() => onSetZoom(Math.min(4.0, Math.round(zoom * 1.25 * 100) / 100))}
            style={{ 
              padding: '3px 8px', 
              borderRadius: '5px', 
              fontSize: '10px', 
              fontWeight: '700', 
              background: '#FAF8F5', 
              color: '#1E293B', 
              border: '1px solid #CBD5E1', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '3px' 
            }}
            title="Zoom In (Click canvas or click here)"
          >
            <ZoomIn size={12} style={{ color: '#E4572E' }} /> In (+)
          </button>

          <button
            type="button"
            onClick={() => onSetZoom(Math.max(0.50, Math.round((zoom / 1.25) * 100) / 100))}
            style={{ 
              padding: '3px 8px', 
              borderRadius: '5px', 
              fontSize: '10px', 
              fontWeight: '700', 
              background: '#FAF8F5', 
              color: '#1E293B', 
              border: '1px solid #CBD5E1', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '3px' 
            }}
            title="Zoom Out (Alt+Click or Right-Click canvas)"
          >
            <ZoomOut size={12} style={{ color: '#4B5563' }} /> Out (-)
          </button>

          {[0.5, 0.75, 1, 1.5, 2].map(z => (
            <button
              key={z}
              type="button"
              onClick={() => onSetZoom(z)}
              style={{
                padding: '3px 7px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: '600',
                background: Math.abs(zoom - z) < 0.05 ? '#E4572E' : '#FFFFFF',
                color: Math.abs(zoom - z) < 0.05 ? '#FFFFFF' : '#686661',
                border: Math.abs(zoom - z) < 0.05 ? '1px solid #E4572E' : '1px solid #D8D5CF',
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
              fontWeight: '700',
              background: '#FBE7E1', 
              color: '#E4572E', 
              border: '1px solid #F5C4B2', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}
            title="Reset to 100% (Ctrl+1)"
          >
            <RotateCcw size={11} /> 100%
          </button>

          <span style={{ fontSize: '10px', color: '#64748B', marginLeft: '4px', borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
            💡 Click canvas to zoom in • Alt+Click or Right-click to zoom out
          </span>
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
                width: '165px',
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
              <optgroup label="Default Studio Fonts">
                <option value="OldSport02AthleticNcv-E0gj">Old Sport Athletic (Default)</option>
                <option value="OldSport01CollegeNcv-aeGm">Old Sport College</option>
                <option value="Jersey M54">Jersey M54</option>
                <option value="Pop Warner">Pop Warner</option>
                <option value="Calligraphy">Calligraphy Script</option>
                <option value="Eaglore 2">Eaglore 2</option>
                <option value="Khand-Bold">Khand Bold</option>
                <option value="Khand-SemiBold">Khand SemiBold</option>
                <option value="fhf">FHF Sport</option>
              </optgroup>
              <optgroup label="System Fonts">
                <option value="Impact">Impact (Bold Athletic)</option>
                <option value="Arial">Arial Black</option>
                <option value="Trebuchet MS">Trebuchet (Modern Sans)</option>
                <option value="Times New Roman">Times (Classic Serif)</option>
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
                  'OldSport01CollegeNcv-aeGm',
                  'Jersey M54',
                  'Pop Warner',
                  'Calligraphy',
                  'Eaglore 2',
                  'Khand-Bold',
                  'Khand-SemiBold',
                  'fhf',
                  'Impact',
                  'Arial',
                  'Trebuchet MS',
                  'Times New Roman',
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

          {/* Fill Group */}
          <div 
            className="cd-property-group"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Fill:</span>

            {/* Segmented Solid vs Gradient Switcher */}
            <div style={{ display: 'inline-flex', background: '#F4F2EE', padding: '2px', borderRadius: '5px', gap: '2px' }}>
              <button
                type="button"
                onClick={() => updateActiveText({ fillType: 'solid' })}
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  background: !isFillGradient ? '#E4572E' : 'transparent',
                  color: !isFillGradient ? '#FFFFFF' : '#686661',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Switch Fill to Solid Color"
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isFillGradient) {
                    handleToggleFillGradient();
                  } else if (onOpenGradientModal) {
                    onOpenGradientModal(resolvedLayer);
                  }
                }}
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  background: isFillGradient ? 'linear-gradient(135deg, #E4572E 0%, #FF8A00 100%)' : 'transparent',
                  color: isFillGradient ? '#FFFFFF' : '#686661',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease'
                }}
                title={isFillGradient ? "Click to open Gradient Editor" : "Switch Fill to Gradient Color"}
              >
                <Sparkles size={10} />
                Gradient
              </button>
            </div>

            {isFillGradient ? (
              <button
                type="button"
                onClick={() => onOpenGradientModal && onOpenGradientModal(resolvedLayer)}
                style={{
                  width: '26px',
                  height: '22px',
                  borderRadius: '4px',
                  border: '1px solid #D8D5CF',
                  background: `linear-gradient(90deg, ${fillGradientStops.join(', ')})`,
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Click to edit Fill Gradient in Photoshop Gradient Editor"
              />
            ) : (
              <input
                type="color"
                value={activeTextConfig.color?.startsWith('#') ? activeTextConfig.color : '#FFFFFF'}
                onChange={(e) => updateActiveText({ color: e.target.value, fillType: 'solid' })}
                style={{ width: '24px', height: '22px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
                title="Solid Fill Color"
              />
            )}
          </div>

          {/* Stroke Group */}
          <div 
            className="cd-property-group"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D8D5CF',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Stroke:</span>

            {/* Multiple Stroke selector pills if >1 strokes */}
            {strokes.length > 1 && (
              <div style={{ display: 'flex', gap: '2px', background: '#F4F2EE', padding: '2px', borderRadius: '5px' }}>
                {strokes.map((_, sIdx) => (
                  <div key={sIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedStrokeIdx(sIdx)}
                      style={{
                        padding: '2px 5px',
                        fontSize: '9px',
                        fontWeight: '700',
                        borderRadius: '3px',
                        border: 'none',
                        background: safeStrokeIdx === sIdx ? '#E4572E' : 'transparent',
                        color: safeStrokeIdx === sIdx ? '#FFFFFF' : '#686661',
                        cursor: 'pointer'
                      }}
                      title={`Select Stroke #${sIdx + 1}`}
                    >
                      #{sIdx + 1}
                    </button>
                    {sIdx > 0 && safeStrokeIdx === sIdx && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStroke(sIdx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          padding: '1px 2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove this outer stroke layer"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Segmented Solid vs Gradient Switcher */}
            <div style={{ display: 'inline-flex', background: '#F4F2EE', padding: '2px', borderRadius: '5px', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handleUpdateCurrentStroke({ type: 'solid' })}
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  background: !isStrokeGradient ? '#E4572E' : 'transparent',
                  color: !isStrokeGradient ? '#FFFFFF' : '#686661',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Switch Stroke to Solid Color"
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isStrokeGradient) {
                    handleToggleStrokeGradient();
                  } else if (onOpenGradientModal) {
                    onOpenGradientModal(`${resolvedLayer}-stroke-${safeStrokeIdx}`);
                  }
                }}
                style={{
                  padding: '2px 7px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '700',
                  border: 'none',
                  background: isStrokeGradient ? 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)' : 'transparent',
                  color: isStrokeGradient ? '#FFFFFF' : '#686661',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.15s ease'
                }}
                title={isStrokeGradient ? "Click to open Stroke Gradient Editor" : "Switch Stroke to Gradient Color"}
              >
                <Sparkles size={10} />
                Gradient
              </button>
            </div>

            {/* Stroke Color / Gradient swatch */}
            {isStrokeGradient ? (
              <button
                type="button"
                onClick={() => onOpenGradientModal && onOpenGradientModal(`${resolvedLayer}-stroke-${safeStrokeIdx}`)}
                style={{
                  width: '26px',
                  height: '22px',
                  borderRadius: '4px',
                  border: '1px solid #D8D5CF',
                  background: `linear-gradient(90deg, ${strokeGradientStops.join(', ')})`,
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Click to edit Stroke Gradient in Photoshop Gradient Editor"
              />
            ) : (
              <input
                type="color"
                value={currentStroke?.color?.startsWith('#') ? currentStroke.color : '#000000'}
                onChange={(e) => handleUpdateCurrentStroke({ color: e.target.value, type: 'solid' })}
                style={{ width: '24px', height: '22px', border: '1px solid #D8D5CF', borderRadius: '4px', background: 'none', cursor: 'pointer', padding: 0 }}
                title="Stroke Color"
              />
            )}

            {/* Stroke Width Input */}
            <span style={{ fontSize: '11px', color: '#92908A', fontWeight: '600' }}>Width:</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={currentStroke?.width !== undefined ? Number(currentStroke.width.toFixed(1)) : (resolvedLayer === 'name' ? 1.8 : 0.7)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleUpdateCurrentStroke({ width: isNaN(val) ? 0 : Math.max(0, Math.round(val * 10) / 10) });
              }}
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
              title="Stroke Width (Default: Name 1.8, Number 0.7)"
            />

            {/* + Add Stroke Button */}
            <button
              type="button"
              onClick={handleAddStroke}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '3px 7px',
                borderRadius: '5px',
                fontSize: '10px',
                fontWeight: '700',
                background: '#FBE7E1',
                color: '#E4572E',
                border: '1px solid #F5C4B2',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Add another outer stroke layer (Multi-Stroke)"
            >
              <Plus size={11} />
              Stroke
            </button>

            {/* Stroke Alignment Position (Outside, Inside, Center) */}
            <div style={{ display: 'flex', gap: '2px', background: '#F4F2EE', padding: '2px', borderRadius: '5px', marginLeft: '2px' }}>
              {(['outside', 'inside', 'center'] as const).map((pos) => {
                const isSelected = (activeTextConfig.strokePosition || 'outside') === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => updateActiveText({ strokePosition: pos })}
                    style={{
                      padding: '2px 5px',
                      fontSize: '9px',
                      fontWeight: '700',
                      borderRadius: '3px',
                      border: 'none',
                      background: isSelected ? '#E4572E' : 'transparent',
                      color: isSelected ? '#FFFFFF' : '#686661',
                      cursor: 'pointer'
                    }}
                    title={`Align Stroke to ${pos.toUpperCase()} (${pos === 'outside' ? 'Clean outer vector border' : pos === 'inside' ? 'Inside glyph' : 'Center half-in half-out'})`}
                  >
                    {pos === 'outside' ? 'Out' : pos === 'inside' ? 'In' : 'Ctr'}
                  </button>
                );
              })}
            </div>
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

    </div>
  );
};
