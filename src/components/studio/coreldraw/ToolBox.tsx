import React from 'react';
import { MousePointer, Hand, ZoomIn, Type, Image as ImageIcon, Pipette, Grid, Lock, Unlock } from 'lucide-react';

export type CorelTool = 'pick' | 'pan' | 'zoom' | 'text' | 'logo' | 'eyedrop';

interface ToolBoxProps {
  activeTool: CorelTool;
  onSelectTool: (tool: CorelTool) => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
  lockGuidelines?: boolean;
  onToggleLockGuidelines?: () => void;
}

export const ToolBox: React.FC<ToolBoxProps> = ({
  activeTool,
  onSelectTool,
  showGuidelines,
  onToggleGuidelines,
  lockGuidelines,
  onToggleLockGuidelines
}) => {
  const tools: { id: CorelTool; name: string; shortcut: string; icon: React.FC<any> }[] = [
    { id: 'pick', name: 'Pick Tool', shortcut: 'V', icon: MousePointer },
    { id: 'pan', name: 'Pan / Hand Tool', shortcut: 'H', icon: Hand },
    { id: 'zoom', name: 'Zoom Tool', shortcut: 'Z', icon: ZoomIn },
    { id: 'text', name: 'Text Overlay Tool', shortcut: 'T', icon: Type },
    { id: 'logo', name: 'Logo / Image Tool', shortcut: 'L', icon: ImageIcon },
    { id: 'eyedrop', name: 'Color Eyedropper', shortcut: 'I', icon: Pipette },
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

      <div style={{ width: '24px', height: '1px', background: '#D8D5CF', margin: '6px auto' }} />

      {/* Guidelines Toggle */}
      <button
        className={`cd-tool-btn ${showGuidelines ? 'active' : ''}`}
        onClick={onToggleGuidelines}
        title="Toggle Guidelines (G / Ctrl+.)"
      >
        <Grid size={18} />
      </button>

      {/* Guidelines Lock / Unlock Toggle */}
      {onToggleLockGuidelines && (
        <button
          className={`cd-tool-btn ${lockGuidelines ? 'active' : ''}`}
          onClick={onToggleLockGuidelines}
          title={lockGuidelines ? "Guidelines Locked (Default) • Click to Unlock (Ctrl+;)" : "Guidelines Unlocked (Draggable) • Click to Lock (Ctrl+;)"}
          style={lockGuidelines ? { color: '#E4572E' } : undefined}
        >
          {lockGuidelines ? <Lock size={17} /> : <Unlock size={17} />}
        </button>
      )}
    </div>
  );
};
