import React from 'react';
import type { CorelTool } from './ToolBox';

interface StatusBarProps {
  activeTool: CorelTool;
  cursorPos: { x: number; y: number } | null;
  activeTab: string;
  physicalWidth: number;
  physicalHeight: number;
  zoom: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTool,
  cursorPos,
  activeTab,
  physicalWidth,
  physicalHeight,
  zoom
}) => {
  const toolDescriptions: Record<CorelTool, string> = {
    pick: 'Pick Tool: Click objects to select. Hold Space to pan canvas.',
    pan: 'Pan Tool: Click and drag to navigate the workspace.',
    zoom: 'Zoom Tool: Scroll wheel or click to zoom in/out.',
    text: 'Text Tool: Configure name, number, or size tag layer.',
    logo: 'Logo Tool: Place and adjust torso/chest logos.',
    eyedrop: 'Eyedropper: Click swatch to set fill or stroke color.'
  };

  return (
    <div className="cd-statusbar">
      {/* Tool hint */}
      <div className="cd-statusbar-item" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ color: '#0284c7', fontWeight: '700' }}>[Tool]</span>
        <span>{toolDescriptions[activeTool]}</span>
      </div>

      {/* Cursor coordinates */}
      <div className="cd-statusbar-item" style={{ width: '150px', justifyContent: 'center', fontFamily: 'monospace' }}>
        {cursorPos ? (
          <span>X: <strong style={{ color: '#00f0ff' }}>{cursorPos.x.toFixed(2)}"</strong> Y: <strong style={{ color: '#00f0ff' }}>{cursorPos.y.toFixed(2)}"</strong></span>
        ) : (
          <span style={{ opacity: 0.4 }}>X: --.--" Y: --.--"</span>
        )}
      </div>

      {/* Panel Info */}
      <div className="cd-statusbar-item" style={{ width: '180px', justifyContent: 'flex-end', gap: '12px' }}>
        <span>{activeTab.toUpperCase()} ({physicalWidth}" × {physicalHeight}")</span>
        <span style={{ color: '#38bdf8', fontWeight: '700' }}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
