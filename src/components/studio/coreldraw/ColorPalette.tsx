import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCcw, Sparkles } from 'lucide-react';

export interface CustomPaletteGradient {
  name: string;
  stops: string[];
  css: string;
}

interface ColorPaletteProps {
  onSelectFillColor: (color: string) => void;
  onSelectStrokeColor: (color: string) => void;
  onSelectGradientColor?: (stops: string[]) => void;
  onOpenGradientEditor?: () => void;
}

export const PRESET_GRADIENTS = [
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
    name: 'Sunset Fire',
    stops: ['#FF512F', '#DD2476', '#F09819'],
    css: 'linear-gradient(135deg, #FF512F 0%, #DD2476 50%, #F09819 100%)'
  },
  {
    name: 'Electric Cyan',
    stops: ['#00F2FE', '#4FACFE', '#00C6FF'],
    css: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #00C6FF 100%)'
  },
  {
    name: 'Neon Purple',
    stops: ['#B5179E', '#7209B7', '#480CA8'],
    css: 'linear-gradient(135deg, #B5179E 0%, #7209B7 50%, #480CA8 100%)'
  }
];

const DEFAULT_SWATCHES = [
  'transparent', '#ffffff', '#e2e8f0', '#71717A', '#52525B', '#E2DED7', '#E2DED7', '#F5F3EF', '#000000',
  '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#f97316', '#ea580c', '#c2410c', '#f59e0b', '#d97706',
  '#eab308', '#ca8a04', '#84cc16', '#65a30d', '#22c55e', '#16a34a', '#15803d', '#10b981', '#059669',
  '#06b6d4', '#0891b2', '#E4572E', '#C13D1E', '#3b82f6', '#1d4ed8', '#6366f1', '#4338ca', '#8b5cf6',
  '#6d28d9', '#a855f7', '#7e22ce', '#ec4899', '#be185d', '#f43f5e', '#ff0055', '#E4572E', '#00ff66'
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  onSelectFillColor,
  onSelectStrokeColor,
  onSelectGradientColor,
  onOpenGradientEditor
}) => {
  const [swatches, setSwatches] = useState<string[]>(DEFAULT_SWATCHES);
  const [customGradients, setCustomGradients] = useState<CustomPaletteGradient[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoveredGradIdx, setHoveredGradIdx] = useState<number | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Load custom swatches & custom gradients from localStorage
  useEffect(() => {
    try {
      const savedSwatches = localStorage.getItem('fivenest_custom_palette');
      if (savedSwatches) {
        const custom: string[] = JSON.parse(savedSwatches);
        if (Array.isArray(custom) && custom.length > 0) {
          const merged = Array.from(new Set([...DEFAULT_SWATCHES, ...custom]));
          setSwatches(merged);
        }
      }

      const savedGradients = localStorage.getItem('fivenest_custom_gradient_presets');
      if (savedGradients) {
        const customGrads: CustomPaletteGradient[] = JSON.parse(savedGradients);
        if (Array.isArray(customGrads)) {
          setCustomGradients(customGrads);
        }
      }
    } catch (e) {
      console.error('Failed to load custom palette items', e);
    }
  }, []);

  const saveCustomPalette = (newSwatches: string[]) => {
    setSwatches(newSwatches);
    const customOnly = newSwatches.filter(s => !DEFAULT_SWATCHES.includes(s));
    localStorage.setItem('fivenest_custom_palette', JSON.stringify(customOnly));
  };

  const handleAddColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (newColor && !swatches.includes(newColor)) {
      const updated = [...swatches, newColor];
      saveCustomPalette(updated);
    }
  };

  const handleDeleteSwatch = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = swatches.filter((_, idx) => idx !== indexToDelete);
    saveCustomPalette(updated);
  };

  const handleDeleteCustomGradient = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = customGradients.filter((_, idx) => idx !== indexToDelete);
    setCustomGradients(updated);
    localStorage.setItem('fivenest_custom_gradient_presets', JSON.stringify(updated));
  };

  const handleResetPalette = () => {
    setSwatches(DEFAULT_SWATCHES);
    localStorage.removeItem('fivenest_custom_palette');
  };

  return (
    <div className="cd-palette-bar" style={{ position: 'relative', background: '#FFFFFF', borderTop: '1px solid #E8E4DE', boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', overflowX: 'auto', minHeight: '40px' }}>
      <div style={{ fontSize: '9px', fontWeight: '800', color: '#88847C', marginRight: '2px', textTransform: 'uppercase', flexShrink: 0 }}>
        Palette
      </div>

      {/* Gradients Section (Built-in + Custom Gradients + Add Button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingRight: '10px', borderRight: '1px solid #E8E4DE', marginRight: '4px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: '800', color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Gradients:
        </span>

        {/* Built-in Preset Gradients */}
        {PRESET_GRADIENTS.map((g, idx) => (
          <div
            key={`preset-${idx}`}
            className="cd-swatch"
            style={{
              background: g.css,
              border: g.name.includes('Gold') ? '1.5px solid #F59E0B' : '1px solid #D8D5CF',
              boxShadow: g.name.includes('Gold') ? '0 0 6px rgba(245, 158, 11, 0.4)' : undefined,
              cursor: 'pointer'
            }}
            onClick={() => {
              if (onSelectGradientColor) {
                onSelectGradientColor(g.stops);
              }
            }}
            title={`Apply ${g.name} Gradient`}
          />
        ))}

        {/* User Added Custom Gradients */}
        {customGradients.map((g, idx) => (
          <div
            key={`custom-grad-${idx}`}
            className="cd-swatch"
            style={{
              position: 'relative',
              background: g.css,
              border: '2px solid #E4572E',
              boxShadow: '0 0 6px rgba(228, 87, 46, 0.3)',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredGradIdx(idx)}
            onMouseLeave={() => setHoveredGradIdx(null)}
            onClick={() => {
              if (onSelectGradientColor) {
                onSelectGradientColor(g.stops);
              }
            }}
            title={`Custom Gradient: ${g.name} (Click to Apply)`}
          >
            {/* Delete custom gradient */}
            {hoveredGradIdx === idx && (
              <button
                type="button"
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  zIndex: 20
                }}
                onClick={(e) => handleDeleteCustomGradient(idx, e)}
                title="Delete Custom Gradient"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Custom Gradient Button */}
        {onOpenGradientEditor && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '2px 8px',
              height: '22px',
              fontSize: '10px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              background: '#FEF3C7',
              borderColor: '#FDE68A',
              color: '#B45309',
              cursor: 'pointer',
              fontWeight: '700'
            }}
            onClick={onOpenGradientEditor}
            title="Open Photoshop Gradient Editor to create & add custom gradient"
          >
            <Sparkles size={11} /> + Custom Gradient
          </button>
        )}
      </div>

      {/* Solid Color Swatches */}
      {swatches.map((color, idx) => {
        const isCustom = !DEFAULT_SWATCHES.includes(color);
        return (
          <div
            key={`${color}-${idx}`}
            className="cd-swatch"
            style={{
              position: 'relative',
              background: color === 'transparent' ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%), linear-gradient(45deg, #e5e7eb 25%, #fff 25%, #fff 75%, #e5e7eb 75%)' : color,
              backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
              backgroundPosition: color === 'transparent' ? '0 0, 4px 4px' : undefined,
              border: isCustom ? '2px solid #E4572E' : '1px solid #D8D5CF'
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={(e) => {
              e.preventDefault();
              onSelectFillColor(color);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onSelectStrokeColor(color);
            }}
            title={`${color} (Left-Click: Fill | Right-Click: Stroke${isCustom ? ' | Hover trash to delete' : ''})`}
          >
            {/* Delete icon on hover */}
            {hoveredIdx === idx && idx > 0 && (
              <button
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '8px',
                  zIndex: 10
                }}
                onClick={(e) => handleDeleteSwatch(idx, e)}
                title="Delete Swatch from Palette"
              >
                <Trash2 size={7} />
              </button>
            )}
          </div>
        );
      })}

      {/* Hidden Color Input for Picker */}
      <input
        ref={colorInputRef}
        type="color"
        defaultValue="#E4572E"
        style={{ display: 'none' }}
        onChange={handleAddColor}
      />

      {/* Add Custom Color Button */}
      <button
        className="btn btn-secondary"
        style={{
          padding: '2px 8px',
          height: '22px',
          fontSize: '10px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
          background: '#FFF4F0',
          borderColor: '#F5C4B2',
          color: '#E4572E',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        onClick={() => colorInputRef.current?.click()}
        title="Add custom color to palette"
      >
        <Plus size={11} /> Add Color
      </button>

      {/* Reset Palette Button if custom colors exist */}
      {swatches.length !== DEFAULT_SWATCHES.length && (
        <button
          className="btn btn-secondary"
          style={{
            padding: '2px 6px',
            height: '22px',
            fontSize: '9px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            flexShrink: 0,
            color: '#686661',
            background: '#FAF8F5',
            borderColor: '#E2DED7',
            cursor: 'pointer'
          }}
          onClick={handleResetPalette}
          title="Reset Palette to Defaults"
        >
          <RotateCcw size={10} /> Reset
        </button>
      )}
    </div>
  );
};
