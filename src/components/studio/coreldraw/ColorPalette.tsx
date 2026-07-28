import React from 'react';

interface ColorPaletteProps {
  onSelectFillColor: (color: string) => void;
  onSelectStrokeColor: (color: string) => void;
}

const SWATCHES = [
  'transparent', '#ffffff', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#1e293b', '#0f172a', '#000000',
  '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#f97316', '#ea580c', '#c2410c', '#f59e0b', '#d97706',
  '#eab308', '#ca8a04', '#84cc16', '#65a30d', '#22c55e', '#16a34a', '#15803d', '#10b981', '#059669',
  '#06b6d4', '#0891b2', '#0284c7', '#0369a1', '#3b82f6', '#1d4ed8', '#6366f1', '#4338ca', '#8b5cf6',
  '#6d28d9', '#a855f7', '#7e22ce', '#ec4899', '#be185d', '#f43f5e', '#ff0055', '#00f0ff', '#00ff66'
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  onSelectFillColor,
  onSelectStrokeColor
}) => {
  return (
    <div className="cd-palette-bar">
      <div style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginRight: '4px', textTransform: 'uppercase' }}>
        Palette
      </div>

      {SWATCHES.map((color, idx) => (
        <div
          key={idx}
          className="cd-swatch"
          style={{
            background: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%)' : color,
            backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
            backgroundPosition: color === 'transparent' ? '0 0, 4px 4px' : undefined
          }}
          onClick={(e) => {
            e.preventDefault();
            onSelectFillColor(color);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onSelectStrokeColor(color);
          }}
          title={`${color} (Left-click: Fill, Right-click: Stroke)`}
        />
      ))}
    </div>
  );
};
