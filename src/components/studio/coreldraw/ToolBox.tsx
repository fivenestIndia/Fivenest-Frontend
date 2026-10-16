import React from 'react';
import { MousePointer, Hand, ZoomIn, Grid, Lock, Unlock } from 'lucide-react';

export type CorelTool = 'pick' | 'pan' | 'zoom' | 'text' | 'logo' | 'eyedrop';

interface ToolBoxProps {
  activeTool: CorelTool;
  onSelectTool: (tool: CorelTool) => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
  lockGuidelines?: boolean;
  onToggleLockGuidelines?: () => void;
  fillColor?: string;
  strokeColor?: string;
  onUpdateFillColor?: (color: string) => void;
  onUpdateStrokeColor?: (color: string) => void;
  onSwapFillStroke?: () => void;
  onDefaultFillStroke?: () => void;
}

export const ToolBox: React.FC<ToolBoxProps> = ({
  activeTool,
  onSelectTool,
  showGuidelines,
  onToggleGuidelines,
  lockGuidelines,
  onToggleLockGuidelines,
}) => {
  const tools: { id: CorelTool; name: string; shortcut: string; icon: React.FC<any> }[] = [
    { id: 'pick', name: 'Pick Tool', shortcut: 'V', icon: MousePointer },
    { id: 'pan', name: 'Pan / Hand Tool', shortcut: 'H', icon: Hand },
    { id: 'zoom', name: 'Zoom Tool', shortcut: 'Z', icon: ZoomIn },
  ];

  return (
    <div className="cd-toolbox">
      {/* Main Pick, Pan, Zoom Tools */}
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

      <div style={{ width: '24px', height: '1px', background: '#D8D5CF', margin: '4px auto' }} />

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
