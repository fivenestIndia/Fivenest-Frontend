import React from 'react';
import { MousePointer, Hand, ZoomIn, Type, Image as ImageIcon, Pipette, Grid } from 'lucide-react';

export type CorelTool = 'pick' | 'pan' | 'zoom' | 'text' | 'logo' | 'eyedrop';

interface ToolBoxProps {
  activeTool: CorelTool;
  onSelectTool: (tool: CorelTool) => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
}

export const ToolBox: React.FC<ToolBoxProps> = ({
  activeTool,
  onSelectTool,
  showGuidelines,
  onToggleGuidelines
}) => {
  const tools: { id: CorelTool; name: string; shortcut: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'pick', name: 'Pick Tool', shortcut: 'V', icon: MousePointer },
    { id: 'pan', name: 'Pan / Hand Tool', shortcut: 'H', icon: Hand },
    { id: 'zoom', name: 'Zoom Tool', shortcut: 'Z', icon: ZoomIn },
    { id: 'text', name: 'Text Overlay Tool', shortcut: 'T', icon: Type },
    { id: 'logo', name: 'Logo / Image Tool', shortcut: 'L', icon: ImageIcon },
    { id: 'eyedrop', name: 'Color Eyedropper', shortcut: 'I', icon: Pipette },
  ];

  return (
    <div className="cd-toolbox" style={{ background: 'rgba(5, 7, 18, 0.7)', backdropFilter: 'blur(40px) saturate(190%)', WebkitBackdropFilter: 'blur(40px) saturate(190%)', borderRight: '1px solid rgba(255, 255, 255, 0.07)', boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}>
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
    </div>
  );
};
