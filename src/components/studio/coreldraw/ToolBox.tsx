import React, { useState } from 'react';
import { MousePointer, Hand, ZoomIn, Grid, Lock, Unlock, ArrowLeftRight } from 'lucide-react';

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
  fillColor = '#000000',
  strokeColor = '#ffffff',
  onUpdateFillColor,
  onUpdateStrokeColor,
  onSwapFillStroke,
  onDefaultFillStroke
}) => {
  const [activeSwatch, setActiveSwatch] = useState<'fill' | 'stroke'>('fill');

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

      {/* Illustrator-style Foreground (Fill) & Stroke Color Swatches */}
      <div 
        style={{ 
          position: 'relative', 
          width: '34px', 
          height: '38px', 
          margin: '2px 0 4px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Illustrator Fill & Stroke • Click to change color, Swap (Shift+X), Default (D)"
      >
        {/* Swap Fill & Stroke Icon (top-right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSwapFillStroke) onSwapFillStroke();
          }}
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-1px',
            width: '13px',
            height: '13px',
            padding: 0,
            background: '#FAF8F5',
            border: '1px solid #D8D5CF',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4B5563',
            zIndex: 10,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }}
          title="Swap Fill and Stroke (Shift+X)"
        >
          <ArrowLeftRight size={8} />
        </button>

        {/* Default Black/White Swatch Icon (bottom-left) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onDefaultFillStroke) onDefaultFillStroke();
          }}
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '-1px',
            width: '13px',
            height: '13px',
            padding: 0,
            background: '#FAF8F5',
            border: '1px solid #D8D5CF',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
          }}
          title="Default Fill and Stroke: Black & White (D)"
        >
          <div style={{ position: 'relative', width: '9px', height: '9px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '5px', background: '#000000', border: '0.5px solid #666' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '5px', height: '5px', background: '#FFFFFF', border: '0.5px solid #999' }} />
          </div>
        </button>

        {/* 1. Fill Swatch (Top-Left) */}
        <div
          onClick={() => setActiveSwatch('fill')}
          style={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            width: '20px',
            height: '20px',
            backgroundColor: fillColor || '#000000',
            border: activeSwatch === 'fill' ? '2px solid #E4572E' : '1px solid #4B5563',
            borderRadius: '3px',
            boxShadow: activeSwatch === 'fill' ? '0 0 0 1px #FFFFFF, 0 2px 6px rgba(228,87,46,0.4)' : '0 1px 3px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            zIndex: activeSwatch === 'fill' ? 4 : 2,
            transition: 'transform 0.1s ease'
          }}
          title={`Foreground / Fill Color: ${fillColor} (Click to pick)`}
        >
          <input
            type="color"
            value={fillColor?.startsWith('#') ? fillColor : '#000000'}
            onChange={(e) => {
              setActiveSwatch('fill');
              if (onUpdateFillColor) onUpdateFillColor(e.target.value);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              padding: 0
            }}
          />
        </div>

        {/* 2. Stroke Swatch (Bottom-Right, Hollow Frame) */}
        <div
          onClick={() => setActiveSwatch('stroke')}
          style={{
            position: 'absolute',
            bottom: '3px',
            right: '3px',
            width: '20px',
            height: '20px',
            backgroundColor: '#FFFFFF',
            border: `4px solid ${strokeColor || '#FFFFFF'}`,
            outline: activeSwatch === 'stroke' ? '2px solid #E4572E' : '1px solid #4B5563',
            borderRadius: '3px',
            boxShadow: activeSwatch === 'stroke' ? '0 0 0 1px #FFFFFF, 0 2px 6px rgba(228,87,46,0.4)' : '0 1px 3px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            zIndex: activeSwatch === 'stroke' ? 4 : 1,
            transition: 'transform 0.1s ease',
            boxSizing: 'border-box'
          }}
          title={`Stroke Color: ${strokeColor} (Click to pick)`}
        >
          <input
            type="color"
            value={strokeColor?.startsWith('#') ? strokeColor : '#FFFFFF'}
            onChange={(e) => {
              setActiveSwatch('stroke');
              if (onUpdateStrokeColor) onUpdateStrokeColor(e.target.value);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              padding: 0
            }}
          />
        </div>
      </div>

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
