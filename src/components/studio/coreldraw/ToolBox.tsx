import React from 'react';
import { MousePointer, Hand, ZoomIn, Type, Image as ImageIcon, Grid, ArrowLeftRight } from 'lucide-react';

export type CorelTool = 'pick' | 'pan' | 'zoom' | 'text' | 'logo';

interface ToolBoxProps {
  activeTool: CorelTool;
  onSelectTool: (tool: CorelTool) => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
  fillColor?: string;
  strokeColor?: string;
  onFillColorChange?: (color: string) => void;
  onStrokeColorChange?: (color: string) => void;
  onSwapColors?: () => void;
}

export const ToolBox: React.FC<ToolBoxProps> = ({
  activeTool,
  onSelectTool,
  showGuidelines,
  onToggleGuidelines,
  fillColor = '#00F0FF',
  strokeColor = '#000000',
  onFillColorChange,
  onStrokeColorChange,
  onSwapColors
}) => {
  const tools: { id: CorelTool; name: string; shortcut: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'pick', name: 'Pick Tool', shortcut: 'V', icon: MousePointer },
    { id: 'pan', name: 'Pan / Hand Tool', shortcut: 'H', icon: Hand },
    { id: 'zoom', name: 'Zoom Tool', shortcut: 'Z', icon: ZoomIn },
    { id: 'text', name: 'Text Overlay Tool', shortcut: 'T', icon: Type },
    { id: 'logo', name: 'Logo / Image Tool', shortcut: 'L', icon: ImageIcon },
  ];

  return (
    <div className="cd-toolbox">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            className={`cd-tool-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTool(t.id)}
            title={`${t.name} (${t.shortcut})`}
          >
            <Icon size={18} />
          </button>
        );
      })}

      <div style={{ width: '20px', height: '1px', background: '#2d2d38', margin: '6px 0' }} />

      {/* Guidelines Toggle */}
      <button
        className={`cd-tool-btn ${showGuidelines ? 'active' : ''}`}
        onClick={onToggleGuidelines}
        title="Toggle Guidelines (G / Ctrl+.)"
      >
        <Grid size={18} />
      </button>

      <div style={{ width: '20px', height: '1px', background: '#2d2d38', margin: '6px 0' }} />

      {/* 🎨 Photoshop-Style Dual Color Selector (Fill Color & Stroke Color) */}
      <div 
        className="relative w-8 h-10 flex flex-col items-center justify-center my-1 select-none"
        title="Photoshop Dual Color Selector: Fill Color (Top) & Stroke Color (Bottom)"
      >
        {/* Fill Color Box (Foreground) */}
        <div className="relative w-5 h-5 rounded border border-white/40 shadow-md overflow-hidden cursor-pointer z-10 hover:scale-110 transition-transform">
          <input
            type="color"
            value={fillColor}
            onChange={(e) => onFillColorChange && onFillColorChange(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0"
            title="Choose Fill / Text Color"
          />
          <div className="w-full h-full" style={{ backgroundColor: fillColor }} />
        </div>

        {/* Stroke Color Box (Background/Outline) */}
        <div className="absolute bottom-0 right-0 w-5 h-5 rounded border border-white/30 shadow-sm overflow-hidden cursor-pointer z-0 hover:scale-110 transition-transform">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange && onStrokeColorChange(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0"
            title="Choose Stroke / Border Color"
          />
          <div className="w-full h-full" style={{ backgroundColor: strokeColor }} />
        </div>

        {/* Swap Colors Button */}
        {onSwapColors && (
          <button
            onClick={onSwapColors}
            className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 z-20"
            title="Swap Fill & Stroke Colors"
          >
            <ArrowLeftRight size={9} />
          </button>
        )}
      </div>
    </div>
  );
};
