import React, { useState, useEffect, useRef } from 'react';
import { Upload, Paintbrush, Layers, FolderArchive, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, Trash2, Shirt, Plus, Maximize2 } from 'lucide-react';
import type { OrderMetadata } from './orderEntry';
import { ThreeDPreview } from './ThreeDPreview';
import { defaultSizes, SizesModal } from './sizesDb';
import { toast } from 'sonner';

import { ToolBox, CorelTool } from './coreldraw/ToolBox';
import { MenuBar } from './coreldraw/MenuBar';
import { PropertyBar } from './coreldraw/PropertyBar';
import { ColorPalette } from './coreldraw/ColorPalette';
import { StatusBar } from './coreldraw/StatusBar';
import { ShortcutsModal } from './coreldraw/ShortcutsModal';

export interface TextConfig {
  enabled: boolean;
  yPos: number; // percentage from top (0-100)
  fontSize: number; // size in inches relative (often 2-3 inches for names, 8-10 inches for numbers)
  color: string;
  strokeColor: string;
  strokeWidth: number; // in pixels
  fontFamily: string;
  maxW: number; // maximum width in inches
  caseType: 'uppercase' | 'normal';
  effect?: 'none' | 'arch' | 'shadow';
  text?: string;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  fillType?: 'solid' | 'gradient' | 'texture';
  gradientColor1?: string;
  gradientColor2?: string;
  gradientStops?: string[];
  gradientDirection?: 'vertical' | 'horizontal' | 'radial' | 'diagonal';
  textureUrl?: string | null;
}

export interface LogoConfig {
  enabled: boolean;
  uploadedUrl: string | null;
  width: number;  // in inches
  height: number; // in inches
  xPos: number;   // horizontal distance in inches
  yPos: number;   // vertical distance in inches
  lockAspectRatio?: boolean;
  text?: string;
}

export interface PanelConfig {
  backgroundType: 'generate' | 'upload';
  generatedStyle: 'neon-gradient' | 'classic-stripes' | 'camo-glow' | 'blank';
  generatedColor1: string;
  generatedColor2: string;
  uploadedFileUrl: string | null;
  uploadedFileHalfUrl?: string | null;
  uploadedFileFullUrl?: string | null;
  nameConfig: TextConfig;
  numberConfig: TextConfig;
  sizeTagConfig?: TextConfig;
  guidelines?: {
    vertical: number[];
    horizontal: number[];
  };
  leftChestLogo?: LogoConfig;
  rightChestLogo?: LogoConfig;
  torsoLogo?: LogoConfig;
  bgWidth?: number;
  bgHeight?: number;
  bgX?: number;
  bgY?: number;
  bgLockAspectRatio?: boolean;
}

export interface TrimPartConfig {
  color: string;
  uploadedUrl: string | null;
}

export interface TrimConfig {
  collar: TrimPartConfig;
  placket: TrimPartConfig;
  sleeveStripe: TrimPartConfig;
}

export interface ArtDesignConfig {
  front: PanelConfig;
  back: PanelConfig;
  sleeveLeft: PanelConfig;
  sleeveRight: PanelConfig;
  a4Print: PanelConfig;
  trim?: TrimConfig;
}

interface DesignerProps {
  designConfig: ArtDesignConfig;
  onDesignConfigChange: (config: ArtDesignConfig) => void;
  metadata?: OrderMetadata;
}

export const defaultDesignConfig: ArtDesignConfig = {
  front: {
    backgroundType: 'generate',
    generatedStyle: 'neon-gradient',
    generatedColor1: '#9b4dff',
    generatedColor2: '#ff8c00',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 20, fontSize: 1.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 44, fontSize: 3.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 4, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 3, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.08 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [2.0, 8.5, 11.0, 13.5, 20.0], horizontal: [7.0, 10.0, 12.0, 27.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 15.0, yPos: 8.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 7.0, yPos: 8.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11.0, yPos: 13.3, text: '', lockAspectRatio: true }
  },
  back: {
    backgroundType: 'generate',
    generatedStyle: 'neon-gradient',
    generatedColor1: '#9b4dff',
    generatedColor2: '#ff8c00',
    uploadedFileUrl: null,
    nameConfig: { enabled: true, yPos: 24, fontSize: 2.5, color: '#000000', strokeColor: '#ffffff', strokeWidth: 4, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 11, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.18 },
    numberConfig: { enabled: true, yPos: 47, fontSize: 9.0, color: '#000000', strokeColor: '#ffffff', strokeWidth: 5, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 8.5, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.2 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0.06 },
    guidelines: { vertical: [2.0, 11.0, 20.0], horizontal: [2.5, 6.0, 8.0, 9.5, 16.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  sleeveLeft: {
    backgroundType: 'generate',
    generatedStyle: 'classic-stripes',
    generatedColor1: '#9b4dff',
    generatedColor2: '#0a0a0f',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 40, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 5, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 70, fontSize: 3.0, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.5], horizontal: [8.0] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  sleeveRight: {
    backgroundType: 'generate',
    generatedStyle: 'classic-stripes',
    generatedColor1: '#9b4dff',
    generatedColor2: '#0a0a0f',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 40, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 5, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 70, fontSize: 3.0, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.5], horizontal: [8.0] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  a4Print: {
    backgroundType: 'generate',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    bgWidth: 10,
    bgHeight: 11,
    bgX: 0,
    bgY: 0,
    bgLockAspectRatio: true,
    nameConfig: { enabled: false, yPos: 20, fontSize: 1.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: true, yPos: 55, fontSize: 6.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 4, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 8, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [5.0], horizontal: [5.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  trim: {
    collar: { color: '#9b4dff', uploadedUrl: null },
    placket: { color: '#9b4dff', uploadedUrl: null },
    sleeveStripe: { color: '#9b4dff', uploadedUrl: null }
  }
};

export const Designer: React.FC<DesignerProps> = ({ designConfig, onDesignConfigChange, metadata }) => {
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'dual' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD'>('dual');
  const [dualActivePanel, setDualActivePanel] = useState<'front' | 'back' | 'sleeveLeft' | 'sleeveRight'>('front');
  const [previewName, setPreviewName] = useState<string>("FIVENEST");
  const [previewNumber, setPreviewNumber] = useState<string>("23");
  const [overlaySubTab, setOverlaySubTab] = useState<'name' | 'number' | 'logos' | 'sizeTag'>('name');
  const [showPanelEditorModal, setShowPanelEditorModal] = useState<boolean>(false);
  const [customFonts, setCustomFonts] = useState<{name: string, url: string}[]>([]);
  const [previewSleeveType, setPreviewSleeveType] = useState<'half' | 'full'>('half');
  const [prefTrigger, setPrefTrigger] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [newGuideType, setNewGuideType] = useState<'vertical' | 'horizontal'>('vertical');
  const [newGuideValue, setNewGuideValue] = useState<string>("");

  const [presets, setPresets] = useState<{name: string, config: ArtDesignConfig}[]>([]);
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [zKeyPressed, setZKeyPressed] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; zoom: number } | null>(null);
  const [spaceKeyPressed, setSpaceKeyPressed] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const [activeTextLayer, setActiveTextLayer] = useState<'name' | 'number' | null>(null);

  // Undo/Redo history stacks
  const [undoStack, setUndoStack] = useState<ArtDesignConfig[]>([]);
  const [redoStack, setRedoStack] = useState<ArtDesignConfig[]>([]);

  const applyDesignConfigUpdate = (newConfig: ArtDesignConfig, isUndoRedoAction = false) => {
    if (!isUndoRedoAction) {
      setUndoStack(prev => [...prev.slice(-49), designConfig]);
      setRedoStack([]);
    }
    onDesignConfigChange(newConfig);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast('Nothing to undo', { icon: 'ℹ️' });
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r.slice(-49), designConfig]);
    setUndoStack(s => s.slice(0, -1));
    onDesignConfigChange(prev);
    toast.success('Undo (Ctrl+Z)');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      toast('Nothing to redo', { icon: 'ℹ️' });
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s.slice(-49), designConfig]);
    setRedoStack(r => r.slice(0, -1));
    onDesignConfigChange(next);
    toast.success('Redo (Ctrl+Shift+Z)');
  };

  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<CorelTool>('pick');
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [rulersEnabled, setRulersEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fivenest_pref_rulers');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    zip: true,
    overlays: true,
    presets: true,
    trim: true,
    guidelines: true,
    fonts: true,
  });

  const logoImagesRef = useRef<Record<string, HTMLImageElement>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Pre-load and cache all logos and background images for real-time canvas rendering
  useEffect(() => {
    const urls: string[] = [];

    // Collect all backgrounds and logos across all panels
    const panelKeys: ('front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print')[] = [
      'front', 'back', 'sleeveLeft', 'sleeveRight', 'a4Print'
    ];

    panelKeys.forEach((key) => {
      const panel = designConfig[key];
      if (!panel) return;

      // Add backgrounds
      if (panel.backgroundType === 'upload') {
        let bgUrl = panel.uploadedFileUrl;
        if (key.startsWith('sleeve')) {
          bgUrl = previewSleeveType === 'full'
            ? (panel.uploadedFileFullUrl || panel.uploadedFileUrl)
            : (panel.uploadedFileHalfUrl || panel.uploadedFileUrl);
        }
        if (bgUrl) urls.push(bgUrl);
      }

      // Add logos
      if (panel.leftChestLogo?.enabled && panel.leftChestLogo.uploadedUrl) {
        urls.push(panel.leftChestLogo.uploadedUrl);
      }
      if (panel.rightChestLogo?.enabled && panel.rightChestLogo.uploadedUrl) {
        urls.push(panel.rightChestLogo.uploadedUrl);
      }
      if (panel.torsoLogo?.enabled && panel.torsoLogo.uploadedUrl) {
        urls.push(panel.torsoLogo.uploadedUrl);
      }
    });

    // Load each unique URL
    const uniqueUrls = Array.from(new Set(urls));
    uniqueUrls.forEach((url) => {
      if (logoImagesRef.current[url]) return; // Already cached
      const img = new Image();
      img.onload = () => {
        logoImagesRef.current[url] = img;
        setPrefTrigger(prev => prev + 1); // Trigger canvas redrawing/re-composition
      };
      img.src = url;
    });
  }, [designConfig, previewSleeveType]);

  useEffect(() => {
    const saved = localStorage.getItem('fivenest_presets');
    if (saved) {
      try { setPresets(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setSpaceKeyPressed(true);
      }
      if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('zoom');
        setZKeyPressed(true);
      }
      if (e.key.toLowerCase() === 'v') {
        setActiveTool('pick');
      }
      if (e.key.toLowerCase() === 'h') {
        setActiveTool('pan');
      }
      if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      }
      if (e.key.toLowerCase() === 'l') {
        setActiveTool('logo');
      }
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) {
        setActiveTool('eyedrop');
      }
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
        setShowGuidelines(prev => !prev);
      }
      if (e.key.toLowerCase() === 'r' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        setRulersEnabled(prev => {
          const next = !prev;
          localStorage.setItem('fivenest_pref_rulers', JSON.stringify(next));
          return next;
        });
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      // Import image: Ctrl + I or Cmd + I
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      // Clear panel background: Delete or Backspace
      if (e.key === 'Delete') {
        updateActivePanel({ uploadedFileUrl: null });
      }
      // Zoom fit: Ctrl + 0 or Cmd + 0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      }
      // Toggle guidelines: Ctrl + . or Cmd + .
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setShowGuidelines(prev => !prev);
      }
      // Undo: Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl + Shift + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setSpaceKeyPressed(false);
        setPanStart(null);
      }
      if (e.key.toLowerCase() === 'z') {
        setZKeyPressed(false);
        setDragStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      alert("Please enter a preset name.");
      return;
    }
    const name = newPresetName.trim();
    const updated = [...presets.filter(p => p.name !== name), { name, config: designConfig }];
    setPresets(updated);
    localStorage.setItem('fivenest_presets', JSON.stringify(updated));
    setNewPresetName("");
    alert(`Preset "${name}" saved successfully!`);
  };

  const handleLoadPreset = (name: string) => {
    const preset = presets.find(p => p.name === name);
    if (preset) {
      onDesignConfigChange(preset.config);
      alert(`Loaded preset "${name}".`);
    }
  };

  const handleDeletePreset = (name: string) => {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    localStorage.setItem('fivenest_presets', JSON.stringify(updated));
  };

  // Sync preference updates
  useEffect(() => {
    const handlePrefChanged = () => {
      setPrefTrigger(prev => prev + 1);
    };
    window.addEventListener('storage-preference-changed', handlePrefChanged);
    return () => window.removeEventListener('storage-preference-changed', handlePrefChanged);
  }, []);

  // Load custom fonts on mount
  useEffect(() => {
    const savedFonts = localStorage.getItem('teedex_custom_fonts');
    if (savedFonts) {
      try {
        const parsed = JSON.parse(savedFonts) as {name: string, url: string}[];
        setCustomFonts(parsed);
        parsed.forEach(async (font) => {
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
            console.error("Error loading custom font from storage", e);
          }
        });
      } catch (e) {
        console.error("Failed to parse saved fonts", e);
      }
    }
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftSleeveCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightSleeveCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const textureCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const textBoundingBoxesRef = useRef<{
    [key: string]: { x: number; y: number; w: number; h: number };
  }>({});
  const isDraggingTextRef = useRef<boolean>(false);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
    distance: number;
    zoom: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y
      };
      touchStartRef.current = null;
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      panStartRef.current = null;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const wrapper = scrollWrapperRef.current;
      const rect = wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
      touchStartRef.current = {
        x: centerX,
        y: centerY,
        scrollLeft: 0,
        scrollTop: 0,
        distance,
        zoom: zoom
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && panStartRef.current) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - panStartRef.current.startX;
      const deltaY = touch.clientY - panStartRef.current.startY;
      setPanOffset({
        x: panStartRef.current.initialPanX + deltaX,
        y: panStartRef.current.initialPanY + deltaY
      });
    } else if (e.touches.length === 2 && touchStartRef.current && touchStartRef.current.distance > 0) {
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDistance / touchStartRef.current.distance;
      const newZoom = Math.min(4.0, Math.max(0.15, Math.round(touchStartRef.current.zoom * ratio * 100) / 100));
      if (newZoom !== zoom) {
        const mouseX = touchStartRef.current.x;
        const mouseY = touchStartRef.current.y;
        const worldX = (mouseX - panOffset.x) / zoom;
        const worldY = (mouseY - panOffset.y) / zoom;
        const newPanX = Math.round(mouseX - worldX * newZoom);
        const newPanY = Math.round(mouseY - worldY * newZoom);
        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
    }
  };

  const handleTouchEnd = () => {
    panStartRef.current = null;
    touchStartRef.current = null;
    setIsPanning(false);
  };

  const handleZoomChange = (newZoom: number) => {
    const wrapper = scrollWrapperRef.current;
    const clampedZoom = Math.min(4.0, Math.max(0.15, Math.round(newZoom * 100) / 100));
    if (clampedZoom === zoom) return;

    if (!wrapper) {
      setZoom(clampedZoom);
      return;
    }
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const worldX = (centerX - panOffset.x) / zoom;
    const worldY = (centerY - panOffset.y) / zoom;

    const newPanX = Math.round(centerX - worldX * clampedZoom);
    const newPanY = Math.round(centerY - worldY * clampedZoom);

    setZoom(clampedZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleFitToScreen = () => {
    const wrapper = scrollWrapperRef.current;
    if (!wrapper) {
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    const containerW = wrapper.clientWidth;
    const containerH = wrapper.clientHeight;
    if (containerW <= 0 || containerH <= 0) return;

    const currentRulerOffset = rulersEnabled ? Math.round(0.55 * scale) : 0;
    
    let contentW = 0;
    let contentH = 0;

    if (activeTab === 'dual') {
      const leftW = sleeveSpreadWidth + currentRulerOffset;
      const frontW = width + currentRulerOffset;
      const backW = width + currentRulerOffset;
      const rightW = sleeveSpreadWidth + currentRulerOffset;
      const gap = 24;
      contentW = leftW + frontW + backW + rightW + (gap * 3) + 24;
      contentH = Math.max(height + currentRulerOffset, sleeveSpreadHeight + currentRulerOffset) + 40;
    } else {
      contentW = width + currentRulerOffset + 24;
      contentH = height + currentRulerOffset + 40;
    }

    const padX = 40;
    const padY = 40;
    const availW = Math.max(100, containerW - padX);
    const availH = Math.max(100, containerH - padY);

    const fitRatio = Math.min(availW / contentW, availH / contentH);
    const optimalZoom = Math.min(2.0, Math.max(0.2, parseFloat(fitRatio.toFixed(2))));

    const newPanX = Math.round((containerW - contentW * optimalZoom) / 2);
    const newPanY = Math.round((containerH - contentH * optimalZoom) / 2);

    setZoom(optimalZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Global window listeners for pan dragging
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (panStartRef.current) {
        const deltaX = e.clientX - panStartRef.current.startX;
        const deltaY = e.clientY - panStartRef.current.startY;
        setPanOffset({
          x: panStartRef.current.initialPanX + deltaX,
          y: panStartRef.current.initialPanY + deltaY
        });
      }
      if (isDraggingTextRef.current && activeTextLayer && dragTargetCanvasRef.current) {
        const rect = dragTargetCanvasRef.current.getBoundingClientRect();
        const currentRulerOffset = rulersEnabled ? Math.round(0.55 * scale) : 0;
        const canvasY = (e.clientY - rect.top) / zoom - currentRulerOffset;
        const targetYPx = canvasY - dragOffsetYRef.current;
        const newYPercent = Math.min(95, Math.max(5, Math.round((targetYPx / height) * 100)));
        updateTextConfig(activeTextLayer, { yPos: newYPercent });
      }
    };

    const handleWindowMouseUp = () => {
      if (panStartRef.current) {
        panStartRef.current = null;
        setIsPanning(false);
      }
      isDraggingTextRef.current = false;
      dragTargetCanvasRef.current = null;
    };

    const handleWindowBlur = () => {
      setSpaceKeyPressed(false);
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Auto-fit panels to screen on first mount
  useEffect(() => {
    const timer = setTimeout(() => handleFitToScreen(), 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Physical dimensions based on active tab and metadata
  let physicalHeight = 30;
  let physicalWidth = 22;

  if (activeTab === 'sleeveLeft' || activeTab === 'sleeveRight') {
    physicalHeight = previewSleeveType === 'full' ? 25 : 11;
    physicalWidth = 19;
  } else if (activeTab === 'a4Print') {
    physicalHeight = 11;
    physicalWidth = 10;
  }

  // Display canvas pixel dimensions dynamically based on physical aspect ratio (rounded to even integers)
  const maxW = 480;
  const maxH = 530;
  const physicalAspect = physicalWidth / physicalHeight;
  const maxAspect = maxW / maxH;

  let width = 380;
  let height = 530;

  if (physicalAspect > maxAspect) {
    // Width limited
    width = maxW; // 480 is even
    height = Math.round((width / physicalAspect) / 2) * 2;
  } else {
    // Height limited
    height = maxH; // 530 is even
    width = Math.round((height * physicalAspect) / 2) * 2;
  }

  const scale = width / physicalWidth;

  // Sleeve dimensions for full 4-panel spread (Top-Aligned, Half 11" / Full 25")
  const sleeveSpreadPhysicalH = previewSleeveType === 'full' ? 25 : 11;
  const sleeveSpreadPhysicalW = 19;
  const sleeveSpreadWidth = Math.round(sleeveSpreadPhysicalW * scale);
  const sleeveSpreadHeight = Math.round(sleeveSpreadPhysicalH * scale);

  const activePanel = activeTab === 'threeD' ? designConfig.front : activeTab === 'dual' ? designConfig[dualActivePanel] : designConfig[activeTab];

  // Helper to trigger parent update
  const updateActivePanel = (updatedFields: Partial<PanelConfig>) => {
    const targetTab = activeTab === 'threeD' ? 'front' : activeTab === 'dual' ? dualActivePanel : activeTab;
    const updated = {
      ...designConfig,
      [targetTab]: {
        ...activePanel,
        ...updatedFields
      }
    };
    applyDesignConfigUpdate(updated);
  };

  const updateTrimConfig = (partKey: 'collar' | 'placket' | 'sleeveStripe', updatedFields: Partial<TrimPartConfig>) => {
    const currentTrim = designConfig.trim || {
      collar: { color: designConfig.front.generatedColor1, uploadedUrl: null },
      placket: { color: designConfig.front.generatedColor1, uploadedUrl: null },
      sleeveStripe: { color: designConfig.front.generatedColor1, uploadedUrl: null }
    };
    const updated = {
      ...designConfig,
      trim: {
        ...currentTrim,
        [partKey]: {
          ...currentTrim[partKey],
          ...updatedFields
        }
      }
    };
    applyDesignConfigUpdate(updated);
  };

  const handleTrimFileUpload = (partKey: 'collar' | 'placket' | 'sleeveStripe', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        updateTrimConfig(partKey, { uploadedUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTextConfig = (textType: 'name' | 'number' | 'sizeTag', fields: Partial<TextConfig>) => {
    const configKey = textType === 'name' ? 'nameConfig' : textType === 'number' ? 'numberConfig' : 'sizeTagConfig';
    updateActivePanel({
      [configKey]: {
        ...(activePanel[configKey] || { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none' }),
        ...fields
      }
    });
  };

  const updateLogoConfig = (logoType: 'leftChest' | 'rightChest' | 'torso', fields: Partial<LogoConfig>) => {
    const configKey = logoType === 'leftChest' ? 'leftChestLogo' : logoType === 'rightChest' ? 'rightChestLogo' : 'torsoLogo';
    const current = activePanel[configKey] || {
      enabled: false,
      uploadedUrl: null,
      width: logoType === 'torso' ? 8.5 : 3.5,
      height: logoType === 'torso' ? 2.6 : 3.5,
      xPos: logoType === 'leftChest' ? 15.0 : logoType === 'rightChest' ? 7.0 : 11.0,
      yPos: logoType === 'torso' ? 13.3 : 8.5,
      lockAspectRatio: true
    };

    let updated = { ...current, ...fields };

    // Aspect ratio locking logic: if lockAspectRatio is true and we're scaling width or height,
    // we scale the other dimension proportionally.
    const isLocked = updated.lockAspectRatio ?? true;
    if (isLocked) {
      if (fields.width !== undefined && fields.height === undefined && fields.width !== current.width && current.width > 0) {
        const ratio = current.height / current.width;
        updated.height = parseFloat((fields.width * ratio).toFixed(2));
      } else if (fields.height !== undefined && fields.width === undefined && fields.height !== current.height && current.height > 0) {
        const ratio = current.width / current.height;
        updated.width = parseFloat((fields.height * ratio).toFixed(2));
      }
    }

    updateActivePanel({
      [configKey]: updated
    });
  };

  const updateBackgroundConfig = (fields: Partial<{ bgWidth: number; bgHeight: number; bgX: number; bgY: number; bgLockAspectRatio: boolean }>) => {
    const current = {
      bgWidth: activePanel.bgWidth ?? physicalWidth,
      bgHeight: activePanel.bgHeight ?? physicalHeight,
      bgX: activePanel.bgX ?? 0,
      bgY: activePanel.bgY ?? 0,
      bgLockAspectRatio: activePanel.bgLockAspectRatio ?? true
    };

    let updated = { ...current, ...fields };

    const isLocked = updated.bgLockAspectRatio;
    if (isLocked) {
      if (fields.bgWidth !== undefined && fields.bgHeight === undefined && current.bgWidth > 0) {
        const ratio = current.bgHeight / current.bgWidth;
        updated.bgHeight = parseFloat((fields.bgWidth * ratio).toFixed(2));
      } else if (fields.bgHeight !== undefined && fields.bgWidth === undefined && current.bgHeight > 0) {
        const ratio = current.bgWidth / current.bgHeight;
        updated.bgWidth = parseFloat((fields.bgHeight * ratio).toFixed(2));
      }
    }

    updateActivePanel(updated);
  };

  const handleSleeveTypeChange = (newType: 'half' | 'full') => {
    setPreviewSleeveType(newType);

    const oldType = newType === 'half' ? 'full' : 'half';
    const oldVert = [9.5];
    const oldHoriz = oldType === 'half' ? [8.0] : [9.0];
    const newVert = [9.5];
    const newHoriz = newType === 'half' ? [8.0] : [9.0];

    const arraysEqual = (a: number[], b: number[]) => {
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    const shouldUpdateGuidelines = (g: any) => {
      if (!g) return true;
      const vert = g.vertical || [];
      const horiz = g.horizontal || [];
      if (vert.length === 0 && horiz.length === 0) return true;
      if (arraysEqual(vert, oldVert) && arraysEqual(horiz, oldHoriz)) return true;
      return false;
    };

    let updated = { ...designConfig };
    let modified = false;

    if (designConfig.sleeveLeft) {
      const g = designConfig.sleeveLeft.guidelines;
      if (shouldUpdateGuidelines(g)) {
        updated.sleeveLeft = {
          ...designConfig.sleeveLeft,
          guidelines: { vertical: newVert, horizontal: newHoriz }
        };
        modified = true;
      }
    }

    if (designConfig.sleeveRight) {
      const g = designConfig.sleeveRight.guidelines;
      if (shouldUpdateGuidelines(g)) {
        updated.sleeveRight = {
          ...designConfig.sleeveRight,
          guidelines: { vertical: newVert, horizontal: newHoriz }
        };
        modified = true;
      }
    }

    if (modified) {
      onDesignConfigChange(updated);
    }
  };

  // Parameters-based Canvas Drawing Helper for both 2D and 3D
  const renderPanelToCanvas = (
    panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print',
    ctx: CanvasRenderingContext2D,
    customWidth: number,
    customHeight: number,
    customScale: number,
    is3DPreview: boolean = false
  ) => {
    const panel = designConfig[panelKey];
    if (!panel) return;

    const width = customWidth;
    const height = customHeight;
    const scale = customScale;

    // Resolve physical panel properties for correct mapping size
    const sizeConf = defaultSizes["40"];
    let physicalW = 15;
    let physicalH = 21;
    if (panelKey === 'front' || panelKey === 'back') {
      physicalW = sizeConf[panelKey].w;
      physicalH = sizeConf[panelKey].h;
    } else if (panelKey === 'sleeveLeft' || panelKey === 'sleeveRight') {
      const isFull = previewSleeveType === 'full';
      physicalW = isFull ? sizeConf.full.w : sizeConf.half.w;
      physicalH = isFull ? sizeConf.full.h : sizeConf.half.h;
    } else if (panelKey === 'a4Print') {
      physicalW = 10;
      physicalH = 11;
    }

    const drawTechnicalMarks = (ctx: CanvasRenderingContext2D) => {
      if (is3DPreview) return; // Skip technical marks in 3D preview
      const savedCenter = localStorage.getItem('fivenest_pref_center_marks');
      let centerMarks = true;
      if (savedCenter !== null) {
        try { centerMarks = JSON.parse(savedCenter); } catch (e) {}
      }
      const savedWater = localStorage.getItem('fivenest_pref_size_watermarks');
      let sizeWatermarks = true;
      if (savedWater !== null) {
        try { sizeWatermarks = JSON.parse(savedWater); } catch (e) {}
      }

      const stroke3ptPx = Math.max(1, Math.round((3 / 72) * scale));

      if (centerMarks && panelKey !== 'a4Print') {
        ctx.save();
        ctx.shadowColor = 'transparent';

        // FIXED PHYSICAL SIZE: 0.1" wide x 0.25" tall, same on ALL panels (size 18-60, front/sleeve)
        // Always compute from physicalW so 0.1" is the same proportion regardless of tab/sleeve switch
        const pxPerInch = width / physicalW; // canvas pixels per inch for THIS panel
        const wPx = Math.round(0.1 * pxPerInch);
        const hPx = Math.round(0.25 * pxPerInch);
        const leftEdgeXPx = Math.round(width / 2 - wPx / 2);

        // White 3pt outside stroke for technical center marks
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = stroke3ptPx;
        ctx.strokeRect(leftEdgeXPx - stroke3ptPx / 2, 0, wPx + stroke3ptPx, hPx + stroke3ptPx / 2);
        ctx.strokeRect(leftEdgeXPx - stroke3ptPx / 2, height - hPx - stroke3ptPx / 2, wPx + stroke3ptPx, hPx + stroke3ptPx / 2);

        // Top & Bottom center solid patch in Red
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(leftEdgeXPx, 0, wPx, hPx);
        ctx.fillRect(leftEdgeXPx, height - hPx, wPx, hPx);
        ctx.restore();
      }

      if (sizeWatermarks && panelKey !== 'a4Print') {
        ctx.save();
        // FIXED 26pt text size — same physical size on ALL panels
        const pxPerInch = width / physicalW;
        const fontSizePx = Math.round((26 / 72) * pxPerInch);
        ctx.font = `bold ${fontSizePx}px system-ui`;
        ctx.shadowColor = 'transparent';

        const offset = Math.round(0.04 * pxPerInch);

        // Sleeve Style on top-right of Back panel
        if (panelKey === 'back') {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          const isRaglan = metadata?.raglanStyle ?? false;
          const typeStr = previewSleeveType === 'full'
            ? (isRaglan ? 'RAGLAN FULL' : 'FULL')
            : (isRaglan ? 'RAGLAN HALF' : 'HALF');

          // White 3pt outside stroke
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = stroke3ptPx * 2;
          ctx.strokeText(typeStr, width - offset, offset);

          // Red Fill
          ctx.fillStyle = '#ff1744';
          ctx.fillText(typeStr, width - offset, offset);
        }

        // Sleeve Direction label on top-right of Sleeve panels
        if (panelKey === 'sleeveLeft' || panelKey === 'sleeveRight') {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          const dirStr = panelKey === 'sleeveLeft' ? 'LEFT' : 'RIGHT';

          // White 3pt outside stroke
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = stroke3ptPx * 2;
          ctx.strokeText(dirStr, width - offset, offset);

          // Red Fill
          ctx.fillStyle = '#ff1744';
          ctx.fillText(dirStr, width - offset, offset);
        }
        ctx.restore();
      }
    };

    const drawTexts = (ctx: CanvasRenderingContext2D) => {
      const drawSingleText = (text: string, conf: TextConfig, textX: number, textY: number, maxLimitPx: number, layerKey?: 'name' | 'number') => {
        ctx.save();
        const fontSizePx = Math.round((conf.fontSize / 30) * height);
        ctx.font = `bold ${fontSizePx}px "${conf.fontFamily}"`;
        
        const align = conf.align || 'center';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // Proportional outside stroke calculation (scaled directly with font size / panel height)
        const strokePx = Math.max(1, Math.round((conf.strokeWidth / 100) * fontSizePx));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Calculate custom position based on alignment
        let targetX = textX;
        if (conf.effect !== 'arch') {
          if (align === 'left') {
            targetX = (width / 2) - (maxLimitPx / 2);
          } else if (align === 'right') {
            targetX = (width / 2) + (maxLimitPx / 2);
          }
        }

        // Apply custom letter spacing and compensation offset
        let adjustedX = targetX;
        let spacingPx = 0;
        if (conf.letterSpacing !== undefined) {
          spacingPx = Math.round(conf.letterSpacing * scale);
          ctx.letterSpacing = `${spacingPx}px`;
          if (align === 'center') {
            adjustedX += spacingPx / 2;
          } else if (align === 'right') {
            adjustedX += spacingPx;
          }
        }

        // Apply drop shadow effect
        if (conf.effect === 'shadow') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
        }

        const displayName = conf.caseType === 'uppercase' ? text.toUpperCase() : text;

        // Store bounding box for canvas clicking & drag selection
        const textMetrics = ctx.measureText(displayName);
        const boundsW = Math.min(textMetrics.width, maxLimitPx);
        const boundsH = fontSizePx * 1.2;

        let boxX = adjustedX;
        if (align === 'center') {
          boxX = adjustedX - boundsW / 2;
        } else if (align === 'right') {
          boxX = adjustedX - boundsW;
        }
        const boxY = textY - fontSizePx * 0.6;

        if (layerKey) {
          textBoundingBoxesRef.current[layerKey] = {
            x: boxX,
            y: boxY,
            w: boundsW,
            h: boundsH
          };
        }

        // Calculate text fill style (Solid, Gradient, or Texture Pattern)
        const getTextFill = (bW: number, bH: number): string | CanvasGradient | CanvasPattern => {
          if (conf.fillType === 'gradient') {
            const stops = (conf.gradientStops && conf.gradientStops.length >= 2)
              ? conf.gradientStops
              : [conf.gradientColor1 || conf.color || '#00f0ff', conf.gradientColor2 || '#ff0055'];
            const dir = conf.gradientDirection || 'vertical';
            let grad: CanvasGradient;

            if (dir === 'horizontal') {
              grad = ctx.createLinearGradient(-bW / 2, 0, bW / 2, 0);
            } else if (dir === 'radial') {
              grad = ctx.createRadialGradient(0, 0, 2, 0, 0, bH);
            } else if (dir === 'diagonal') {
              grad = ctx.createLinearGradient(-bW / 2, -bH / 2, bW / 2, bH / 2);
            } else {
              // vertical (default)
              grad = ctx.createLinearGradient(0, -bH / 2, 0, bH / 2);
            }
            
            stops.forEach((color, idx) => {
              const offset = idx / Math.max(1, stops.length - 1);
              grad.addColorStop(offset, color);
            });
            return grad;
          }

          if (conf.fillType === 'texture' && conf.textureUrl) {
            const cached = textureCache.current.get(conf.textureUrl);
            if (cached && cached.complete && cached.naturalWidth > 0) {
              try {
                const pattern = ctx.createPattern(cached, 'repeat');
                if (pattern) return pattern;
              } catch (err) {}
            } else if (!cached) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                textureCache.current.set(conf.textureUrl!, img);
                setPrefTrigger(prev => prev + 1);
              };
              img.src = conf.textureUrl;
              textureCache.current.set(conf.textureUrl, img);
            }
          }

          return conf.color || '#ffffff';
        };

        const activeFillStyle = getTextFill(maxLimitPx, fontSizePx);

        if (conf.effect === 'arch') {
          // Circular arched text bending concave (ends down)
          const radius = height * 0.45;
          ctx.translate(targetX, textY + radius);
          const totalAngle = Math.min(Math.PI / 2.5, (displayName.length * fontSizePx * 0.55) / radius);
          const startAngle = -totalAngle / 2;
          const angleStep = totalAngle / (displayName.length - 1 || 1);

          for (let i = 0; i < displayName.length; i++) {
            const char = displayName[i];
            const charAngle = startAngle + i * angleStep;
            ctx.save();
            ctx.rotate(charAngle);
            if (conf.strokeWidth > 0) {
              ctx.strokeStyle = conf.strokeColor;
              ctx.lineWidth = strokePx * 2;
              ctx.strokeText(char, 0, -radius);
            }
            ctx.fillStyle = activeFillStyle;
            ctx.fillText(char, 0, -radius);
            ctx.restore();
          }
        } else {
          // Standard straight text
          const measuredW = ctx.measureText(displayName).width;
          ctx.translate(adjustedX, textY);
          if (measuredW > maxLimitPx) {
            ctx.scale(maxLimitPx / measuredW, 1);
          }
          if (conf.strokeWidth > 0) {
            ctx.strokeStyle = conf.strokeColor;
            ctx.lineWidth = strokePx * 2;
            ctx.strokeText(displayName, 0, 0);
          }
          ctx.fillStyle = activeFillStyle;
          ctx.fillText(displayName, 0, 0);
        }
        ctx.restore();
      };

      const hideOverlays = metadata?.blankKit ?? false;
      if (!hideOverlays && panel.nameConfig.enabled) {
        drawSingleText(previewName, panel.nameConfig, width / 2, (panel.nameConfig.yPos / 100) * height, (panel.nameConfig.maxW / 20) * width, 'name');
      }
      if (!hideOverlays && panel.numberConfig.enabled) {
        drawSingleText(previewNumber, panel.numberConfig, width / 2, (panel.numberConfig.yPos / 100) * height, (panel.numberConfig.maxW / 20) * width, 'number');
      }

      // Draw interactive Cyan Selection Box with 8 Control Handles around Active Selected Text Layer ONLY if text is selected
      if (!is3DPreview && activeTextLayer) {
        const selectedBox = textBoundingBoxesRef.current[activeTextLayer];
        if (selectedBox) {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);

          const pad = 10;
          const bx = selectedBox.x - pad;
          const by = selectedBox.y - pad;
          const bw = selectedBox.w + pad * 2;
          const bh = selectedBox.h + pad * 2;

          // Dashed selection rectangle
          ctx.strokeRect(bx, by, bw, bh);
          ctx.setLineDash([]); // solid lines for handles

          // 8 Control Handles (white squares with cyan outline)
          const handles = [
            { x: bx, y: by },                        // TL
            { x: bx + bw / 2, y: by },               // TC
            { x: bx + bw, y: by },                   // TR
            { x: bx, y: by + bh / 2 },               // ML
            { x: bx + bw, y: by + bh / 2 },           // MR
            { x: bx, y: by + bh },                   // BL
            { x: bx + bw / 2, y: by + bh },            // BC
            { x: bx + bw, y: by + bh }                // BR
          ];

          handles.forEach(h => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 1.5;
            ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
            ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
          });

          // Active Layer Name Badge
          const badgeText = activeTextLayer === 'name' ? 'PLAYER NAME (SELECTED)' : 'PLAYER NUMBER (SELECTED)';
          ctx.font = 'bold 10px sans-serif';
          const badgeW = ctx.measureText(badgeText).width + 14;
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(bx, Math.max(2, by - 20), badgeW, 18);
          ctx.fillStyle = '#000000';
          ctx.fillText(badgeText, bx + 7, Math.max(14, by - 6));

          ctx.restore();
        }
      }

      // Draw customizable Size Tag (Top Left) - skip for A4 and skip if 3D preview
      const sizeTagConf = panel.sizeTagConfig || { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left' };
      if (!is3DPreview && sizeTagConf.enabled && panelKey !== 'a4Print') {
        ctx.save();
        // Use pxPerInch (physicalW-based) so size tag is SAME physical size on all panels
        const pxPerInch = width / physicalW;
        const fontSizePx = Math.round((sizeTagConf.fontSize / 72) * pxPerInch);
        ctx.font = `bold ${fontSizePx}px "${sizeTagConf.fontFamily}"`;
        
        const align = sizeTagConf.align || 'left';
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.lineJoin = 'round';

        const offsetPx = Math.round(0.15 * pxPerInch);
        
        let targetX = offsetPx;
        if (align === 'center') {
          targetX = width / 2;
        } else if (align === 'right') {
          targetX = width - offsetPx;
        }

        // Apply custom letter spacing and compensation offset
        let adjustedX = targetX;
        let spacingPx = 0;
        if (sizeTagConf.letterSpacing !== undefined) {
          spacingPx = Math.round(sizeTagConf.letterSpacing * pxPerInch);
          ctx.letterSpacing = `${spacingPx}px`;
          if (align === 'center') {
            adjustedX += spacingPx / 2;
          } else if (align === 'right') {
            adjustedX += spacingPx;
          }
        }

        if (sizeTagConf.effect === 'shadow') {
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        const templateText = sizeTagConf.text || '{size}';
        const displayText = templateText.replace('{size}', "40");

        const sw = sizeTagConf.strokeWidth > 0 ? sizeTagConf.strokeWidth : 7;
        const swPx = Math.max(1, Math.round((sw / 72) * pxPerInch));

        ctx.strokeStyle = sizeTagConf.strokeColor || '#ffffff';
        ctx.lineWidth = swPx * 2;
        ctx.strokeText(displayText, adjustedX, offsetPx);

        ctx.fillStyle = sizeTagConf.color || '#ff1744';
        ctx.fillText(displayText, adjustedX, offsetPx);
        ctx.restore();
      }
    };

    let rulersPref = true;
    try {
      const savedR = localStorage.getItem('fivenest_pref_rulers');
      if (savedR !== null) rulersPref = JSON.parse(savedR);
    } catch (e) {}
    const rulersEnabled = !is3DPreview && rulersPref;
    const rulerOffset = rulersEnabled ? Math.round(0.55 * scale) : 0;

    const drawRulersAndGrid = (ctx: CanvasRenderingContext2D) => {
      if (is3DPreview || !rulersEnabled) return;

      const isLightMode = document.querySelector('.app-layout')?.classList.contains('light');

      ctx.save();
      ctx.shadowColor = 'transparent';

      // 1. Gridlines inside artwork area (offset by rulerOffset)
      let gridSpacing = 2;
      try {
        const savedG = localStorage.getItem('fivenest_pref_guideline_spacing');
        if (savedG !== null) gridSpacing = JSON.parse(savedG);
      } catch (e) {}
      ctx.strokeStyle = isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([Math.round(0.05 * scale), Math.round(0.05 * scale)]);
      for (let x = gridSpacing; x < physicalW; x += gridSpacing) {
        const xPx = rulerOffset + Math.round(x * scale);
        ctx.beginPath();
        ctx.moveTo(xPx, rulerOffset);
        ctx.lineTo(xPx, rulerOffset + height);
        ctx.stroke();
      }
      for (let y = gridSpacing; y < physicalH; y += gridSpacing) {
        const yPx = rulerOffset + Math.round(y * scale);
        ctx.beginPath();
        ctx.moveTo(rulerOffset, yPx);
        ctx.lineTo(rulerOffset + width, yPx);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 2. Photoshop-style Ruler Background tracks & ticks
      const rulerBg = '#2a2a2a';
      const tickColor = '#e0e0e0';
      const borderLineColor = '#1a1a1a';

      // Top Ruler track (0 .. rulerOffset y)
      ctx.fillStyle = rulerBg;
      ctx.fillRect(rulerOffset, 0, width, rulerOffset);

      // Left Ruler track (0 .. rulerOffset x)
      ctx.fillRect(0, rulerOffset, rulerOffset, height);

      // Top-Left Corner Junction Box
      ctx.fillStyle = '#242424';
      ctx.fillRect(0, 0, rulerOffset, rulerOffset);

      // Divider borders separating ruler from artwork area
      ctx.strokeStyle = borderLineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Line under top ruler
      ctx.moveTo(0, rulerOffset);
      ctx.lineTo(rulerOffset + width, rulerOffset);
      // Line to right of left ruler
      ctx.moveTo(rulerOffset, 0);
      ctx.lineTo(rulerOffset, rulerOffset + height);
      ctx.stroke();

      // Corner junction text "in"
      ctx.fillStyle = tickColor;
      ctx.font = `bold ${Math.max(8, Math.round(0.11 * scale))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('in', rulerOffset / 2, rulerOffset / 2);

      // Top ticks
      ctx.font = `${Math.max(8, Math.round(0.12 * scale))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = tickColor;
      ctx.fillStyle = tickColor;

      for (let x = 0; x <= physicalW; x += 0.25) {
        const xPx = rulerOffset + Math.round(x * scale);
        const isWhole = x % 1 === 0;
        const isHalf = x % 0.5 === 0 && !isWhole;
        const tickLen = isWhole ? Math.round(0.12 * scale) : isHalf ? Math.round(0.07 * scale) : Math.round(0.04 * scale);
        ctx.lineWidth = isWhole ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(xPx, rulerOffset - tickLen);
        ctx.lineTo(xPx, rulerOffset);
        ctx.stroke();

        if (isWhole && x > 0) {
          ctx.fillText(x.toString(), xPx, 2);
        }
      }

      // Left ticks
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let y = 0; y <= physicalH; y += 0.5) {
        const yPx = rulerOffset + Math.round(y * scale);
        const isWhole = y % 1 === 0;
        const tickLen = isWhole ? Math.round(0.10 * scale) : Math.round(0.05 * scale);
        ctx.beginPath();
        ctx.moveTo(rulerOffset - tickLen, yPx);
        ctx.lineTo(rulerOffset, yPx);
        ctx.stroke();

        if (isWhole && y > 0) {
          ctx.fillText(y.toString(), 2, yPx);
        }
      }

      // 3. Custom Guidelines
      if (showGuidelines) {
        const customGuides = panel.guidelines || { vertical: [], horizontal: [] };
        ctx.save();
        ctx.strokeStyle = '#00f0ff'; // Cyan guideline color
        ctx.lineWidth = 0.6;
        ctx.setLineDash([4, 4]);

        ctx.fillStyle = '#00f0ff';
        ctx.font = `bold ${Math.max(9, Math.round(0.12 * scale))}px system-ui`;

        (customGuides.vertical || []).forEach(xVal => {
          const rawPx = Math.abs(xVal - physicalW / 2) < 0.01 ? Math.round(width / 2) : Math.round(xVal * scale);
          const xPx = rulerOffset + rawPx;
          if (xPx >= rulerOffset && xPx <= rulerOffset + width) {
            ctx.beginPath();
            ctx.moveTo(xPx, rulerOffset);
            ctx.lineTo(xPx, rulerOffset + height);
            ctx.stroke();

            // Label tag on top ruler
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.fillRect(xPx - 16, 2, 32, rulerOffset - 4);
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${xVal.toFixed(1)}"`, xPx, rulerOffset / 2);
            ctx.restore();
          }
        });

        (customGuides.horizontal || []).forEach(yVal => {
          const yPx = rulerOffset + Math.round(yVal * scale);
          if (yPx >= rulerOffset && yPx <= rulerOffset + height) {
            ctx.beginPath();
            ctx.moveTo(rulerOffset, yPx);
            ctx.lineTo(rulerOffset + width, yPx);
            ctx.stroke();

            // Label tag on left ruler
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
            ctx.fillRect(2, yPx - 8, rulerOffset - 4, 16);
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${yVal.toFixed(1)}"`, rulerOffset / 2, yPx);
            ctx.restore();
          }
        });
        ctx.restore();
      }
      ctx.restore();
    };

    const drawLogos = (ctx: CanvasRenderingContext2D) => {
      const hideOverlays = metadata?.blankKit ?? false;
      if (hideOverlays) return;

      const drawSingleLogo = (logo: LogoConfig | undefined, isTorso: boolean = false) => {
        if (!logo || !logo.enabled) return;

        if (isTorso && logo.text && logo.text.trim()) {
          ctx.save();
          const xPx = logo.xPos * scale;
          const yPx = logo.yPos * scale;
          const wPx = logo.width * scale;
          const hPx = logo.height * scale;

          ctx.font = `bold ${hPx}px OldSport02AthleticNcv-E0gj, Impact, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, Math.round(0.06 * hPx));

          ctx.strokeText(logo.text, xPx, yPx, wPx);
          ctx.fillText(logo.text, xPx, yPx, wPx);
          ctx.restore();
          return;
        }

        if (!logo.uploadedUrl) return;
        const cachedImg = logoImagesRef.current[logo.uploadedUrl];
        if (!cachedImg) {
          const img = new Image();
          img.onload = () => {
            logoImagesRef.current[logo.uploadedUrl!] = img;
            setPrefTrigger(prev => prev + 1);
          };
          img.src = logo.uploadedUrl;
          return;
        }

        ctx.save();
        const wPx = logo.width * scale;
        const hPx = logo.height * scale;
        const xPx = logo.xPos * scale;
        const yPx = logo.yPos * scale;

        ctx.drawImage(cachedImg, xPx - wPx / 2, yPx - hPx / 2, wPx, hPx);
        ctx.restore();
      };

      drawSingleLogo(panel.leftChestLogo, false);
      drawSingleLogo(panel.rightChestLogo, false);
      drawSingleLogo(panel.torsoLogo, true);
    };

    const drawPanelArtwork = () => {
      ctx.save();
      if (rulerOffset > 0) {
        ctx.translate(rulerOffset, rulerOffset);
      }

      let bgUrl = panel.uploadedFileUrl;
      if (panelKey.startsWith('sleeve')) {
        bgUrl = previewSleeveType === 'full' 
          ? (panel.uploadedFileFullUrl || panel.uploadedFileUrl) 
          : (panel.uploadedFileHalfUrl || panel.uploadedFileUrl);
      }

      if (panel.backgroundType === 'upload' && bgUrl) {
        const cachedImg = logoImagesRef.current[bgUrl];
        if (cachedImg && cachedImg.complete) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          const bgW = (panel.bgWidth !== undefined ? panel.bgWidth : physicalW) * scale;
          const bgH = (panel.bgHeight !== undefined ? panel.bgHeight : physicalH) * scale;
          const bgX = (panel.bgX !== undefined ? panel.bgX : 0) * scale;
          const bgY = (panel.bgY !== undefined ? panel.bgY : 0) * scale;

          ctx.drawImage(cachedImg, bgX, bgY, bgW, bgH);
          drawLogos(ctx);
          drawTexts(ctx);
          drawTechnicalMarks(ctx);
        } else {
          const img = new Image();
          img.onload = () => {
            logoImagesRef.current[bgUrl] = img;
            setPrefTrigger(prev => prev + 1);
          };
          img.src = bgUrl;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          drawLogos(ctx);
          drawTexts(ctx);
          drawTechnicalMarks(ctx);
        }
      } else {
        const c1 = panel.generatedColor1;
        const c2 = panel.generatedColor2;
        
        if (panel.generatedStyle === 'neon-gradient') {
          const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width*0.8);
          gradient.addColorStop(0, c1);
          gradient.addColorStop(1, c2);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (panel.generatedStyle === 'classic-stripes') {
          ctx.fillStyle = c2;
          ctx.fillRect(0, 0, width, height);
          
          ctx.fillStyle = c1;
          ctx.beginPath();
          for (let i = -100; i < width + height; i += 60) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 30, 0);
            ctx.lineTo(i - 100 + 30, height);
            ctx.lineTo(i - 100, height);
          }
          ctx.fill();
        } else if (panel.generatedStyle === 'camo-glow') {
          ctx.fillStyle = '#111';
          ctx.fillRect(0, 0, width, height);
          
          ctx.fillStyle = c1;
          ctx.beginPath();
          ctx.arc(width * 0.3, height * 0.25, 80, 0, Math.PI * 2);
          ctx.arc(width * 0.7, height * 0.75, 120, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = c2;
          ctx.beginPath();
          ctx.arc(width * 0.8, height * 0.25, 60, 0, Math.PI * 2);
          ctx.arc(width * 0.2, height * 0.8, 90, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Default panel base color: Pure White inside, like Illustrator artboard
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }
        
        if (!is3DPreview) {
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, width, height);
        }
        
        drawLogos(ctx);
        drawTexts(ctx);
        drawTechnicalMarks(ctx);
      }
      ctx.restore();
    };

    drawPanelArtwork();
    drawRulersAndGrid(ctx);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable
        )
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toUpperCase();

      // Bulk ZIP Import shortcut: Ctrl + Shift + I  OR  Ctrl + B
      if ((isCtrl && e.shiftKey && key === 'I') || (isCtrl && key === 'B')) {
        e.preventDefault();
        zipInputRef.current?.click();
        return;
      }

      // Import Graphic Image shortcut: Ctrl + I
      if (isCtrl && key === 'I') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Zoom reset: Ctrl + 0
      if (isCtrl && key === '0') {
        e.preventDefault();
        handleFitToScreen();
        return;
      }

      // Zoom in: Ctrl + '=' or Ctrl + '+'
      if (isCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom(z => Math.min(3, Math.round((z + 0.25) * 100) / 100));
        return;
      }

      // Zoom out: Ctrl + '-'
      if (isCtrl && e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
        return;
      }

      // Guidelines toggle shortcut: G  or  Ctrl + '.'
      if (key === 'G' || (isCtrl && e.key === '.')) {
        e.preventDefault();
        setShowGuidelines(prev => !prev);
        return;
      }

      // Tool Switching Shortcuts (V, H, Z, T, L, I, R)
      if (key === 'V' || e.key === 'F1') {
        setActiveTool('pick');
      } else if (key === 'H') {
        setActiveTool('pan');
      } else if (key === 'Z') {
        setActiveTool('zoom');
      } else if (key === 'T' && !isCtrl) {
        setActiveTool('text');
      } else if (key === 'L' && !isCtrl) {
        setActiveTool('logo');
      } else if (key === 'I' && !isCtrl) {
        setActiveTool('eyedrop');
      } else if (key === 'R' && !isCtrl) {
        setRulersEnabled(prev => {
          const next = !prev;
          localStorage.setItem('fivenest_pref_rulers', JSON.stringify(next));
          return next;
        });
      } else if (e.key === 'Delete') {
        updateActivePanel({ uploadedFileUrl: null });
      }

      // Text Manipulation & CorelDRAW Alignment shortcuts (Arrow Keys, C, E, P, T, B, L, R)
      const targetLayer: 'name' | 'number' = activeTextLayer || (activePanel.nameConfig?.enabled ? 'name' : 'number');
      const conf = activePanel[targetLayer === 'name' ? 'nameConfig' : 'numberConfig'];

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        updateTextConfig(targetLayer, { yPos: Math.max(0, conf.yPos - step) });
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        updateTextConfig(targetLayer, { yPos: Math.min(100, conf.yPos + step) });
        return;
      }

      if (['C', 'E', 'P', 'T', 'B', 'L', 'R'].includes(key) && !isCtrl) {
        if (key === 'C') {
          // Center Horizontally
          updateTextConfig(targetLayer, { align: 'center' });
        } else if (key === 'E') {
          // Center Vertically (50%)
          updateTextConfig(targetLayer, { yPos: 50 });
        } else if (key === 'P') {
          // Center to Page (Both Horizontally & Vertically)
          updateTextConfig(targetLayer, { align: 'center', yPos: 50 });
        } else if (key === 'T') {
          // Align Extreme Top (5%)
          updateTextConfig(targetLayer, { yPos: 5 });
        } else if (key === 'B') {
          // Align Extreme Bottom (92%)
          updateTextConfig(targetLayer, { yPos: 92 });
        } else if (key === 'L') {
          // Align Left
          updateTextConfig(targetLayer, { align: 'left' });
        } else if (key === 'R') {
          // Align Right
          updateTextConfig(targetLayer, { align: 'right' });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      isDraggingTextRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activePanel, activeTextLayer]);

  // Draw preview canvas (Single or Dual Front & Back)
  useEffect(() => {
    if (activeTab === 'threeD') return;

    let rulersPref = true;
    try {
      const savedR = localStorage.getItem('fivenest_pref_rulers');
      if (savedR !== null) rulersPref = JSON.parse(savedR);
    } catch (e) {}
    const rulerOffset = rulersPref ? Math.round(0.55 * scale) : 0;

    if (activeTab === 'dual') {
      // 1. Left Sleeve
      if (leftSleeveCanvasRef.current) {
        const lsCtx = leftSleeveCanvasRef.current.getContext('2d');
        if (lsCtx) {
          leftSleeveCanvasRef.current.width = (sleeveSpreadWidth + rulerOffset) * zoom;
          leftSleeveCanvasRef.current.height = (sleeveSpreadHeight + rulerOffset) * zoom;
          lsCtx.scale(zoom, zoom);
          renderPanelToCanvas('sleeveLeft', lsCtx, sleeveSpreadWidth, sleeveSpreadHeight, scale, false);
        }
      }
      // 2. Front Panel
      if (frontCanvasRef.current) {
        const fCtx = frontCanvasRef.current.getContext('2d');
        if (fCtx) {
          frontCanvasRef.current.width = (width + rulerOffset) * zoom;
          frontCanvasRef.current.height = (height + rulerOffset) * zoom;
          fCtx.scale(zoom, zoom);
          renderPanelToCanvas('front', fCtx, width, height, scale, false);
        }
      }
      // 3. Back Panel
      if (backCanvasRef.current) {
        const bCtx = backCanvasRef.current.getContext('2d');
        if (bCtx) {
          backCanvasRef.current.width = (width + rulerOffset) * zoom;
          backCanvasRef.current.height = (height + rulerOffset) * zoom;
          bCtx.scale(zoom, zoom);
          renderPanelToCanvas('back', bCtx, width, height, scale, false);
        }
      }
      // 4. Right Sleeve
      if (rightSleeveCanvasRef.current) {
        const rsCtx = rightSleeveCanvasRef.current.getContext('2d');
        if (rsCtx) {
          rightSleeveCanvasRef.current.width = (sleeveSpreadWidth + rulerOffset) * zoom;
          rightSleeveCanvasRef.current.height = (sleeveSpreadHeight + rulerOffset) * zoom;
          rsCtx.scale(zoom, zoom);
          renderPanelToCanvas('sleeveRight', rsCtx, sleeveSpreadWidth, sleeveSpreadHeight, scale, false);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = (width + rulerOffset) * zoom;
    canvas.height = (height + rulerOffset) * zoom;
    ctx.scale(zoom, zoom);

    renderPanelToCanvas(activeTab, ctx, width, height, scale, false);
  }, [activeTab, dualActivePanel, activePanel, previewName, previewNumber, designConfig, customFonts, metadata, previewSleeveType, prefTrigger, zoom, showGuidelines]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        const targetUpload = activeTab === 'dual' ? dualActivePanel : activeTab;
        if (targetUpload.startsWith('sleeve')) {
          if (previewSleeveType === 'full') {
            updateActivePanel({
              backgroundType: 'upload',
              uploadedFileFullUrl: url
            });
          } else {
            updateActivePanel({
              backgroundType: 'upload',
              uploadedFileHalfUrl: url
            });
          }
        } else if (activeTab === 'a4Print') {
          const img = new Image();
          img.onload = () => {
            const targetW = parseFloat((img.naturalWidth / 300).toFixed(2));
            const targetH = parseFloat((img.naturalHeight / 300).toFixed(2));
            updateActivePanel({
              backgroundType: 'upload',
              uploadedFileUrl: url,
              bgWidth: targetW,
              bgHeight: targetH,
              bgX: 0,
              bgY: 0,
              bgLockAspectRatio: true
            });
          };
          img.src = url;
        } else {
          updateActivePanel({
            backgroundType: 'upload',
            uploadedFileUrl: url
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleZipImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      const newConfig = {
        front: { ...designConfig.front },
        back: { ...designConfig.back },
        sleeveLeft: { ...designConfig.sleeveLeft },
        sleeveRight: { ...designConfig.sleeveRight },
        a4Print: { ...designConfig.a4Print },
      };
      
      let importedCount = 0;
      const importedNames: string[] = [];

      for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir) continue;
        if (filename.includes('__MACOSX') || filename.split('/').some(p => p.startsWith('.'))) continue;
        
        const pathParts = filename.split('/');
        const baseFilename = pathParts[pathParts.length - 1];
        const lowerBase = baseFilename.toLowerCase();
        
        if (!lowerBase.endsWith('.png') && !lowerBase.endsWith('.jpg') && !lowerBase.endsWith('.jpeg') && !lowerBase.endsWith('.webp')) {
          continue;
        }

        const base64Data = await zipEntry.async('base64');
        const mimeType = lowerBase.endsWith('.png') ? 'image/png' : lowerBase.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Data}`;

        if (lowerBase.includes('front') && !lowerBase.includes('sleeve') && !lowerBase.includes('sl') && !lowerBase.includes('back')) {
          newConfig.front.uploadedFileUrl = dataUrl;
          newConfig.front.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Front');
        }
        else if (lowerBase.includes('back') && !lowerBase.includes('sleeve') && !lowerBase.includes('sl') && !lowerBase.includes('front')) {
          newConfig.back.uploadedFileUrl = dataUrl;
          newConfig.back.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Back');
        }
        else if (lowerBase.includes('left') && (lowerBase.includes('half sl') || (lowerBase.includes('half') && lowerBase.includes('sleeve')) || lowerBase.includes('lhs') || lowerBase.includes('lh sl'))) {
          newConfig.sleeveLeft.uploadedFileHalfUrl = dataUrl;
          newConfig.sleeveLeft.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Left Half Sleeve');
        }
        else if (lowerBase.includes('right') && (lowerBase.includes('half sl') || (lowerBase.includes('half') && lowerBase.includes('sleeve')) || lowerBase.includes('rhs') || lowerBase.includes('rh sl'))) {
          newConfig.sleeveRight.uploadedFileHalfUrl = dataUrl;
          newConfig.sleeveRight.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Right Half Sleeve');
        }
        else if (lowerBase.includes('left') && (lowerBase.includes('full sleeve') || lowerBase.includes('full sl') || lowerBase.includes('fls') || lowerBase.includes('lf sl'))) {
          newConfig.sleeveLeft.uploadedFileFullUrl = dataUrl;
          newConfig.sleeveLeft.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Left Full Sleeve');
        }
        else if (lowerBase.includes('right') && (lowerBase.includes('full sleeve') || lowerBase.includes('full sl') || lowerBase.includes('rls') || lowerBase.includes('rf sl'))) {
          newConfig.sleeveRight.uploadedFileFullUrl = dataUrl;
          newConfig.sleeveRight.backgroundType = 'upload';
          importedCount++;
          importedNames.push('Right Full Sleeve');
        }
      }

      if (importedCount > 0) {
        onDesignConfigChange(newConfig);
        alert(`Successfully imported ${importedCount} panels from ZIP:\n- ${importedNames.join('\n- ')}`);
      } else {
        alert('No matching panel graphics found in ZIP file.\n\nMake sure filenames contain: Front, Back, Left Half SL, Right Half SL, Left Full Sleeve, or Right Full Sleeve.');
      }
    } catch (err) {
      console.error('Failed to import ZIP:', err);
      alert('Error parsing ZIP file. Make sure it is a valid zip archive.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePaletteFill = (color: string) => {
    if (activeTool === 'text') {
      const configKey = activeTextLayer === 'name' ? 'nameConfig' : activeTextLayer === 'number' ? 'numberConfig' : 'sizeTagConfig';
      const current = activePanel[configKey];
      if (current) {
        updateActivePanel({ [configKey]: { ...current, color } });
      }
    } else {
      updateActivePanel({ generatedColor1: color });
    }
  };

  const handlePaletteStroke = (color: string) => {
    if (activeTool === 'text') {
      const configKey = activeTextLayer === 'name' ? 'nameConfig' : activeTextLayer === 'number' ? 'numberConfig' : 'sizeTagConfig';
      const current = activePanel[configKey];
      if (current) {
        updateActivePanel({ [configKey]: { ...current, strokeColor: color } });
      }
    } else {
      updateActivePanel({ generatedColor2: color });
    }
  };

  const handlePaletteGradient = (stops: string[]) => {
    const targetLayer: 'name' | 'number' = activeTextLayer || (activePanel.nameConfig?.enabled ? 'name' : 'number');
    updateTextConfig(targetLayer, {
      fillType: 'gradient',
      gradientStops: stops,
      gradientColor1: stops[0],
      gradientColor2: stops[stops.length - 1]
    });
  };

  const dragTargetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragOffsetYRef = useRef<number>(0);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (spaceKeyPressed || activeTool === 'pan' || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y
      };
      return;
    }
    const currentCanvas = (e.currentTarget || (activeTab === 'dual' ? backCanvasRef.current : canvasRef.current)) as HTMLCanvasElement;
    if (!currentCanvas || activeTab === 'threeD') return;

    dragTargetCanvasRef.current = currentCanvas;
    const rect = currentCanvas.getBoundingClientRect();
    const currentRulerOffset = rulersEnabled ? Math.round(0.55 * scale) : 0;
    const canvasX = (e.clientX - rect.left) / zoom - currentRulerOffset;
    const canvasY = (e.clientY - rect.top) / zoom - currentRulerOffset;

    const pad = 24;

    // Check hit test for Player Name
    const nameBox = textBoundingBoxesRef.current['name'];
    if (nameBox && activePanel.nameConfig?.enabled) {
      if (
        canvasX >= nameBox.x - pad &&
        canvasX <= nameBox.x + nameBox.w + pad &&
        canvasY >= nameBox.y - pad &&
        canvasY <= nameBox.y + nameBox.h + pad
      ) {
        setActiveTextLayer('name');
        setOverlaySubTab('name');
        setActiveTool('text');
        isDraggingTextRef.current = true;
        const currentTextYPx = (activePanel.nameConfig.yPos / 100) * height;
        dragOffsetYRef.current = canvasY - currentTextYPx;
        setPrefTrigger(prev => prev + 1);
        return;
      }
    }

    // Check hit test for Player Number
    const numBox = textBoundingBoxesRef.current['number'];
    if (numBox && activePanel.numberConfig?.enabled) {
      if (
        canvasX >= numBox.x - pad &&
        canvasX <= numBox.x + numBox.w + pad &&
        canvasY >= numBox.y - pad &&
        canvasY <= numBox.y + numBox.h + pad
      ) {
        setActiveTextLayer('number');
        setOverlaySubTab('number');
        setActiveTool('text');
        isDraggingTextRef.current = true;
        const currentTextYPx = (activePanel.numberConfig.yPos / 100) * height;
        dragOffsetYRef.current = canvasY - currentTextYPx;
        setPrefTrigger(prev => prev + 1);
        return;
      }
    }

    // If clicked on canvas outside text, deselect text layer
    setActiveTextLayer(null);
  };

  const handleCanvasMouseUp = () => {
    isDraggingTextRef.current = false;
    dragTargetCanvasRef.current = null;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentCanvas = (e.currentTarget || (activeTab === 'dual' ? backCanvasRef.current : canvasRef.current)) as HTMLCanvasElement;
    if (!currentCanvas) return;
    const rect = currentCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingTextRef.current && activeTextLayer) {
      const currentRulerOffset = rulersEnabled ? Math.round(0.55 * scale) : 0;
      const canvasY = (mouseY / zoom) - currentRulerOffset;
      const targetYPx = canvasY - dragOffsetYRef.current;
      const newYPercent = Math.min(95, Math.max(5, Math.round((targetYPx / height) * 100)));
      updateTextConfig(activeTextLayer, { yPos: newYPercent });
    }

    const currentScale = scale * zoom;
    if (currentScale > 0) {
      setCursorPos({
        x: Math.max(0, mouseX / currentScale),
        y: Math.max(0, mouseY / currentScale)
      });
    }
  };

  return (
    <div className="cd-studio-container fade-in">
      {/* 1. COREL TOP MENU BAR */}
      <MenuBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        zoom={zoom}
        onSetZoom={setZoom}
        showGuidelines={showGuidelines}
        onToggleGuidelines={() => setShowGuidelines(prev => !prev)}
        rulersEnabled={rulersEnabled}
        onToggleRulers={() => {
          setRulersEnabled(prev => {
            const next = !prev;
            localStorage.setItem('fivenest_pref_rulers', JSON.stringify(next));
            return next;
          });
        }}
        onOpenImport={() => fileInputRef.current?.click()}
        onOpenBulkImport={() => zipInputRef.current?.click()}
        onClearPanel={() => updateActivePanel({ uploadedFileUrl: null })}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        onOpenPanelEditor={() => setShowPanelEditorModal(true)}
      />

      {/* 2. COREL CONTEXT PROPERTY BAR */}
      <PropertyBar
        activeTool={activeTool}
        activeTab={activeTab}
        panel={activePanel}
        physicalWidth={physicalWidth}
        physicalHeight={physicalHeight}
        zoom={zoom}
        onSetZoom={setZoom}
        onUpdatePanel={updateActivePanel}
        activeTextLayer={activeTextLayer as any}
        onSelectTextLayer={(layer) => setActiveTextLayer(layer as any)}
        previewSleeveType={previewSleeveType}
        onSleeveTypeChange={handleSleeveTypeChange}
      />

      {/* 3. MAIN WORKSPACE: LEFT TOOLBOX + CANVAS + RIGHT DOCKERS */}
      <div className="cd-workspace-main">
        <ToolBox
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          showGuidelines={showGuidelines}
          onToggleGuidelines={() => setShowGuidelines(prev => !prev)}
        />

        <div className="cd-canvas-area">


          {/* 2D Canvas Mock Renderer */}
          <div 
            className="cd-canvas-container" 
            style={{ 
              display: 'flex',
              flexDirection: 'column', 
              alignItems: 'center',
              width: '100%',
              height: '100%',
              flex: '1 1 0%',
              minWidth: 0,
              minHeight: 0,
              gap: '12px',
              position: 'relative',
              border: isDragging ? '2px dashed var(--color-primary)' : 'none',
              background: isDragging ? 'rgba(155, 77, 255, 0.03)' : 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              if (activeTab.startsWith('sleeve')) {
                if (previewSleeveType === 'full') {
                  updateActivePanel({
                    backgroundType: 'upload',
                    uploadedFileFullUrl: url
                  });
                } else {
                  updateActivePanel({
                    backgroundType: 'upload',
                    uploadedFileHalfUrl: url
                  });
                }
              } else {
                updateActivePanel({
                  backgroundType: 'upload',
                  uploadedFileUrl: url
                });
              }
            };
            reader.readAsDataURL(file);
          }
        }}
      >
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(10, 10, 15, 0.85)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            pointerEvents: 'none',
            border: '2px dashed var(--color-primary)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}>
            <Upload size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h3 style={{ color: 'white', marginBottom: '8px' }}>Drop Image Here</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Upload to active {activeTab === 'front' ? 'Front' : activeTab === 'back' ? 'Back' : activeTab === 'sleeveLeft' ? 'Left Sleeve' : activeTab === 'sleeveRight' ? 'Right Sleeve' : 'A4'} panel graphic</p>
          </div>
        )}


        
        {/* Sleeve Style moved to PropertyBar — clean center canvas */}
        
        {/* Controls Bar: 2D Zoom Bar OR 3D Viewport Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
          {activeTab === 'threeD' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.85)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.5px' }}>
                  3D REAL-TIME VIEWPORT ACTIVE (BLENDER CONTROLS)
                </span>
              </div>
              <button 
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '6px', fontWeight: 'bold' }}
                onClick={() => setActiveTab('dual')}
                title="Exit 3D View and Return to 2D Spread Layout"
              >
                ✕ Exit 3D View
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => handleZoomChange(zoom - 0.25)}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => handleZoomChange(zoom + 0.25)}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#00f0ff' }}
                onClick={handleFitToScreen}
                title="Fit Full View to Screen (Ctrl+0)"
              >
                <Maximize2 size={12} /> Fit View (Ctrl+0)
              </button>
              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '6px' }}
                onClick={() => setActiveTab('threeD')}
                title="Enter 3D Jersey Preview"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                3D View
              </button>
              {zoom !== 1 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}
                  onClick={() => handleZoomChange(1)}
                  title="Reset Zoom to 100%"
                >
                  <RotateCcw size={12} /> 100%
                </button>
              )}
            </>
          )}
        </div>

        {/* Global Invisible Image File Input for Double Click / Button Upload */}
        <input 
          ref={fileInputRef} 
          type="file" 
          onChange={handleFileUpload} 
          accept="image/*" 
          style={{ display: 'none' }} 
          id="global-artwork-file-input" 
        />

        {/* 3D VIEWPORT: 100% Locked Container (Zero DOM zoom, Three.js OrbitControls only) */}
        {activeTab === 'threeD' ? (
          <div style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', padding: '8px', boxSizing: 'border-box' }}>
            <ThreeDPreview 
              designConfig={designConfig} 
              renderPanelToCanvas={renderPanelToCanvas}
              previewSleeveType={previewSleeveType}
              prefTrigger={prefTrigger}
              zoom={1}
            />
          </div>
        ) : (
          <div 
            ref={scrollWrapperRef}
            style={{ 
              flexGrow: 1, 
              width: '100%', 
              height: '100%',
              overflow: 'hidden', 
              minHeight: 0,
              boxSizing: 'border-box',
              cursor: (spaceKeyPressed || activeTool === 'pan' || isPanning) 
                ? (isPanning ? 'grabbing' : 'grab') 
                : (activeTool === 'zoom' ? 'zoom-in' : 'default'),
              userSelect: 'none',
              position: 'relative',
              touchAction: 'none'
            }}
            onWheel={(e) => {
              e.preventDefault();
              const wrapper = scrollWrapperRef.current;
              if (!wrapper) return;

              const rect = wrapper.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;

              const zoomDelta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
              const newZoom = Math.min(4.0, Math.max(0.15, Math.round(zoom * zoomDelta * 100) / 100));
              if (newZoom === zoom) return;

              const worldX = (mouseX - panOffset.x) / zoom;
              const worldY = (mouseY - panOffset.y) / zoom;

              const newPanX = Math.round(mouseX - worldX * newZoom);
              const newPanY = Math.round(mouseY - worldY * newZoom);

              setZoom(newZoom);
              setPanOffset({ x: newPanX, y: newPanY });
            }}
            onMouseDown={(e) => {
              if (spaceKeyPressed || activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.target === scrollWrapperRef.current)) {
                e.preventDefault();
                setIsPanning(true);
                panStartRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  initialPanX: panOffset.x,
                  initialPanY: panOffset.y
                };
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Transform Layer for Locked Panels */}
            <div 
              onDoubleClick={() => {
                if (!spaceKeyPressed) fileInputRef.current?.click();
              }}
              title="Double-click canvas to upload artwork background image"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
                willChange: 'transform',
                display: 'inline-flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start'
              }}
            >
              {activeTab === 'dual' ? (
                <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'nowrap', padding: '0 20px' }}>
                  {/* 1. LEFT SLEEVE CANVAS */}
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => setDualActivePanel('sleeveLeft')}
                  >
                    <div 
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 ${
                        dualActivePanel === 'sleeveLeft' 
                          ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30' 
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🧤 LEFT SLEEVE ({sleeveSpreadPhysicalW}" × {sleeveSpreadPhysicalH}")</span>
                      {dualActivePanel === 'sleeveLeft' && <span className="text-[10px] text-cyan-400 font-semibold">• Active</span>}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <canvas 
                        ref={leftSleeveCanvasRef} 
                        onMouseDown={(e) => {
                          if (spaceKeyPressed || activeTool === 'pan' || e.button === 1) {
                            e.preventDefault();
                            setIsPanning(true);
                            panStartRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              initialPanX: panOffset.x,
                              initialPanY: panOffset.y
                            };
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setDualActivePanel('sleeveLeft');
                          fileInputRef.current?.click();
                        }}
                        title="Left Sleeve - Double-click to upload artwork image"
                        style={{ 
                          borderRadius: '8px', 
                          border: dualActivePanel === 'sleeveLeft' ? '2px solid rgba(0, 240, 255, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)', 
                          boxShadow: dualActivePanel === 'sleeveLeft' ? '0 0 35px rgba(0, 240, 255, 0.35)' : '0 0 30px rgba(0,0,0,0.85)',
                          cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer',
                          width: `${Math.round((sleeveSpreadWidth + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          height: `${Math.round((sleeveSpreadHeight + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'contain',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </div>

                  {/* 2. FRONT PANEL CANVAS */}
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer' }}
                    onClick={() => { if (!spaceKeyPressed) setDualActivePanel('front'); }}
                  >
                    <div 
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 ${
                        dualActivePanel === 'front' 
                          ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30' 
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>👕 FRONT PANEL ({designConfig.front.customWidth || 22}" × {designConfig.front.customHeight || 30}")</span>
                      {dualActivePanel === 'front' && <span className="text-[10px] text-cyan-400 font-semibold">• Active</span>}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <canvas 
                        ref={frontCanvasRef} 
                        onMouseDown={(e) => {
                          if (spaceKeyPressed || activeTool === 'pan' || e.button === 1) {
                            e.preventDefault();
                            setIsPanning(true);
                            panStartRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              initialPanX: panOffset.x,
                              initialPanY: panOffset.y
                            };
                          }
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setDualActivePanel('front');
                          fileInputRef.current?.click();
                        }}
                        title="Front Panel - Double-click to upload artwork image"
                        style={{ 
                          borderRadius: '8px', 
                          border: dualActivePanel === 'front' ? '2px solid rgba(0, 240, 255, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)', 
                          boxShadow: dualActivePanel === 'front' ? '0 0 35px rgba(0, 240, 255, 0.35)' : '0 0 30px rgba(0,0,0,0.85)',
                          cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer',
                          width: `${Math.round((width + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          height: `${Math.round((height + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'contain',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </div>

                  {/* 3. BACK PANEL CANVAS */}
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer' }}
                    onClick={() => { if (!spaceKeyPressed) setDualActivePanel('back'); }}
                  >
                    <div 
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 ${
                        dualActivePanel === 'back' 
                          ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30' 
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>👕 BACK PANEL ({designConfig.back.customWidth || 22}" × {designConfig.back.customHeight || 30}")</span>
                      {dualActivePanel === 'back' && <span className="text-[10px] text-cyan-400 font-semibold">• Active</span>}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <canvas 
                        ref={backCanvasRef} 
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => {
                          setCursorPos(null);
                          isDraggingTextRef.current = false;
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setDualActivePanel('back');
                          fileInputRef.current?.click();
                        }}
                        title="Back Panel - Double-click to upload artwork, click & drag player name/number"
                        style={{ 
                          borderRadius: '8px', 
                          border: dualActivePanel === 'back' ? '2px solid rgba(0, 240, 255, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)', 
                          boxShadow: dualActivePanel === 'back' ? '0 0 35px rgba(0, 240, 255, 0.35)' : '0 0 30px rgba(0,0,0,0.85)',
                          cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer',
                          width: `${Math.round((width + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          height: `${Math.round((height + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'contain',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </div>

                  {/* 4. RIGHT SLEEVE CANVAS */}
                  <div 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: (spaceKeyPressed || isPanning) ? 'inherit' : 'pointer' }}
                    onClick={() => { if (!spaceKeyPressed) setDualActivePanel('sleeveRight'); }}
                  >
                    <div 
                      className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md transition-all flex items-center gap-1.5 ${
                        dualActivePanel === 'sleeveRight' 
                          ? 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30' 
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🧤 RIGHT SLEEVE ({sleeveSpreadPhysicalW}" × {sleeveSpreadPhysicalH}")</span>
                      {dualActivePanel === 'sleeveRight' && <span className="text-[10px] text-cyan-400 font-semibold">• Active</span>}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <canvas 
                        ref={rightSleeveCanvasRef} 
                        onMouseDown={(e) => {
                          if (spaceKeyPressed || activeTool === 'pan' || e.button === 1) {
                            e.preventDefault();
                            setIsPanning(true);
                            panStartRef.current = {
                              startX: e.clientX,
                              startY: e.clientY,
                              initialPanX: panOffset.x,
                              initialPanY: panOffset.y
                            };
                          }
                        }} 
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setDualActivePanel('sleeveRight');
                          fileInputRef.current?.click();
                        }}
                        title="Right Sleeve - Double-click to upload artwork image"
                        style={{ 
                          borderRadius: '8px', 
                          border: dualActivePanel === 'sleeveRight' ? '2px solid rgba(0, 240, 255, 0.9)' : '2px solid rgba(255, 255, 255, 0.15)', 
                          boxShadow: dualActivePanel === 'sleeveRight' ? '0 0 35px rgba(0, 240, 255, 0.35)' : '0 0 30px rgba(0,0,0,0.85)',
                          cursor: 'pointer',
                          width: `${Math.round((sleeveSpreadWidth + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          height: `${Math.round((sleeveSpreadHeight + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                          objectFit: 'contain',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Double click helper badge */}
                  <div 
                    className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400/40 text-cyan-300 text-[11px] font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>💡 Double-click canvas to upload artwork image</span>
                  </div>

                  <canvas 
                    ref={canvasRef} 
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={() => {
                      setCursorPos(null);
                      isDraggingTextRef.current = false;
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    title="Double-click to upload artwork background image"
                    style={{ 
                      borderRadius: '8px', 
                      border: '2px solid rgba(0, 240, 255, 0.5)', 
                      boxShadow: '0 0 50px rgba(0,0,0,0.95)',
                      cursor: (spaceKeyPressed || zKeyPressed) ? 'inherit' : 'pointer',
                      width: `${Math.round((width + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                      height: `${Math.round((height + (rulersEnabled ? Math.round(0.55 * scale) : 0)) * zoom)}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      objectFit: 'contain',
                      flexShrink: 0
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mock inputs for testing positions (visible in 2D layout) */}
        {activeTab !== 'threeD' && (
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '360px' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Test Name" 
              value={previewName} 
              onChange={(e) => setPreviewName(e.target.value)} 
              title="Change the preview player name overlay" 
            />
          </div>
          <div style={{ width: '80px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Test #" 
              value={previewNumber} 
              onChange={(e) => setPreviewNumber(e.target.value)} 
              title="Change the preview player number overlay"
            />
          </div>
        </div>
        )}
      </div>
      </div>

      {/* CorelDRAW Right Docker Panel (Strict Single Vertical Column) */}
      <div 
        className="cd-docker-panel" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          width: '360px', 
          minWidth: '360px', 
          maxWidth: '360px', 
          flexShrink: 0, 
          height: '100%', 
          overflowY: 'auto', 
          padding: '12px', 
          paddingBottom: '120px',
          gap: '12px',
          boxSizing: 'border-box'
        }}
      >
        {/* Step 1: Bulk ZIP Importer Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-secondary)' }}
            onClick={() => toggleCollapse('zip')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderArchive size={18} /> Bulk ZIP Importer
            </span>
            {collapsed.zip ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>
          {!collapsed.zip && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload a `.zip` file. The system will auto-detect and import: <strong>Front, Back, Left Half SL, Right Half SL, Left Full Sleeve, & Right Full Sleeve</strong>.
              </p>
              <input 
                ref={zipInputRef}
                type="file" 
                accept=".zip" 
                id="zip-importer-input" 
                style={{ display: 'none' }} 
                onChange={handleZipImport} 
              />
              <label htmlFor="zip-importer-input" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px' }}>
                <Upload size={14} /> Import ZIP File <span style={{ fontSize: '9px', opacity: 0.75, background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>Ctrl+Shift+I</span>
              </label>
            </div>
          )}
        </div>

        {/* Step 2: Print Layer Overlays (Names, Numbers & Logos - HIGHLY HIGHLIGHTED STEP 2) */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '20px', 
            background: 'linear-gradient(180deg, rgba(0, 240, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '2px solid rgba(0, 240, 255, 0.8)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
            borderRadius: '12px'
          }}
        >
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: '#00f0ff', marginBottom: collapsed.overlays ? 0 : '16px' }}
            onClick={() => toggleCollapse('overlays')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Layers size={20} style={{ color: '#00f0ff' }} /> 
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#00f0ff' }}>Print Layer Overlays</span>
              <span style={{ fontSize: '9px', background: 'linear-gradient(90deg, #00f0ff, #8b5cf6)', color: '#000', fontWeight: '900', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ STEP 2</span>
            </span>
            {collapsed.overlays ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.overlays && (
            <div>
              {/* Sub-Tab Navigation Bar */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                {/* Hide Name sub-tab for sleeve panels */}
                {!(activeTab === 'sleeveLeft' || activeTab === 'sleeveRight' || (activeTab === 'dual' && (dualActivePanel === 'sleeveLeft' || dualActivePanel === 'sleeveRight'))) && (
                <button 
                  type="button"
                  className={`btn ${overlaySubTab === 'name' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 2px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                  onClick={() => {
                    setOverlaySubTab('name');
                    setActiveTextLayer('name');
                    if (activeTab === 'dual') setDualActivePanel('back');
                    if (!designConfig.back.nameConfig.enabled) updateTextConfig('name', { enabled: true });
                  }}
                >
                  👤 Name
                </button>
                )}
                <button 
                  type="button"
                  className={`btn ${overlaySubTab === 'number' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 2px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                  onClick={() => {
                    setOverlaySubTab('number');
                    setActiveTextLayer('number');
                    if (activeTab === 'dual') setDualActivePanel('back');
                    if (!designConfig.back.numberConfig.enabled) updateTextConfig('number', { enabled: true });
                  }}
                >
                  🔢 Number
                </button>
                <button 
                  type="button"
                  className={`btn ${overlaySubTab === 'logos' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 2px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                  onClick={() => setOverlaySubTab('logos')}
                >
                  🛡️ Logos
                </button>
                <button 
                  type="button"
                  className={`btn ${overlaySubTab === 'sizeTag' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '6px 2px', fontSize: '11px', fontWeight: 'bold', borderRadius: '6px' }}
                  onClick={() => setOverlaySubTab('sizeTag')}
                >
                  🏷️ Size Tag
                </button>
              </div>

              {/* Hotkey Helper Banner */}
              <div style={{ 
                background: 'rgba(155, 77, 255, 0.08)', 
                border: '1px solid rgba(155, 77, 255, 0.3)', 
                padding: '8px 12px', 
                borderRadius: '8px', 
                marginBottom: '14px', 
                fontSize: '11px', 
                color: 'rgba(255,255,255,0.85)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px' 
              }}>
                <span>⚡ <strong>Text Alignment Shortcuts:</strong> Press <code>C</code> (Center), <code>T</code> (Top), <code>B</code> (Bottom), <code>L</code> (Left), <code>R</code> (Right)</span>
              </div>

              {/* 1. Name Config Sub-Tab */}

              <div style={{ display: overlaySubTab === "name" ? "block" : "none", paddingBottom: "8px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Player Name Layer</span>
                  <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={activePanel.nameConfig.enabled}
                      onChange={(e) => updateTextConfig('name', { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>

                {true && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Vertical Position (Y):</span>
                        <span>{activePanel.nameConfig.yPos}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={activePanel.nameConfig.yPos}
                        onChange={(e) => updateTextConfig('name', { yPos: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Horizontal Spacing (Letter Spacing):</span>
                        <span>{activePanel.nameConfig.letterSpacing || 0} in</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.02" 
                        value={activePanel.nameConfig.letterSpacing || 0}
                        onChange={(e) => updateTextConfig('name', { letterSpacing: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Font Size (in):</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="form-input" 
                          value={activePanel.nameConfig.fontSize}
                          onChange={(e) => updateTextConfig('name', { fontSize: parseFloat(e.target.value) || 1 })}
                          style={{ padding: '6px' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Max Width (in):</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="form-input" 
                          value={activePanel.nameConfig.maxW}
                          onChange={(e) => updateTextConfig('name', { maxW: parseFloat(e.target.value) || 5 })}
                          style={{ padding: '6px' }}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Font Style:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.nameConfig.fontFamily}
                          onChange={(e) => updateTextConfig('name', { fontFamily: e.target.value })}
                          style={{ padding: '6px' }}
                        >
                          <option value="OldSport02AthleticNcv-E0gj">Old Sport Athletic (Default)</option>
                          <option value="Impact">Impact (Bold Athletic)</option>
                          <option value="Arial">Arial Black</option>
                          <option value="Trebuchet MS">Trebuchet (Modern Sans)</option>
                          <option value="Times New Roman">Times (Classic Serif)</option>
                          {customFonts.map(font => (
                            <option key={font.name} value={font.name}>{font.name} (Custom)</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Text Effect:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.nameConfig.effect || 'none'}
                          onChange={(e) => updateTextConfig('name', { effect: e.target.value as any })}
                          style={{ padding: '6px' }}
                        >
                          <option value="none">Flat (Normal)</option>
                          <option value="arch">Arched Curve</option>
                          <option value="shadow">Drop Shadow</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Case Style:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.nameConfig.caseType}
                          onChange={(e) => updateTextConfig('name', { caseType: e.target.value as any })}
                          style={{ padding: '6px' }}
                        >
                          <option value="uppercase">ALL UPPERCASE</option>
                          <option value="normal">As Typed</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Alignment:</label>
                        <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', background: activePanel.nameConfig.align === 'left' ? 'var(--color-primary)' : 'transparent', color: activePanel.nameConfig.align === 'left' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('name', { align: 'left' })}
                            title="Align Left"
                          >
                            <AlignLeft size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', background: (!activePanel.nameConfig.align || activePanel.nameConfig.align === 'center') ? 'var(--color-primary)' : 'transparent', color: (!activePanel.nameConfig.align || activePanel.nameConfig.align === 'center') ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('name', { align: 'center' })}
                            title="Align Center"
                          >
                            <AlignCenter size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', background: activePanel.nameConfig.align === 'right' ? 'var(--color-primary)' : 'transparent', color: activePanel.nameConfig.align === 'right' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('name', { align: 'right' })}
                            title="Align Right"
                          >
                            <AlignRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                {/* Fill Style & Texture Controls for Name */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ fontSize: '11px', margin: 0, fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      Name Fill Style & Texture:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn ${(!activePanel.nameConfig.fillType || activePanel.nameConfig.fillType === 'solid') ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('name', { fillType: 'solid' })}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        className={`btn ${activePanel.nameConfig.fillType === 'gradient' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('name', { fillType: 'gradient', gradientColor1: activePanel.nameConfig.gradientColor1 || activePanel.nameConfig.color || '#00f0ff', gradientColor2: activePanel.nameConfig.gradientColor2 || '#ff0055' })}
                      >
                        Gradient
                      </button>
                      <button
                        type="button"
                        className={`btn ${activePanel.nameConfig.fillType === 'texture' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('name', { fillType: 'texture' })}
                      >
                        Texture
                      </button>
                    </div>
                  </div>

                  {(!activePanel.nameConfig.fillType || activePanel.nameConfig.fillType === 'solid') && (
                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '10px' }}>Fill Color:</label>
                        <input 
                          type="color" 
                          value={activePanel.nameConfig.color}
                          onChange={(e) => updateTextConfig('name', { color: e.target.value })}
                          style={{ border: 'none', background: 'none', width: '100%', height: '26px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {activePanel.nameConfig.fillType === 'gradient' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>
                          Color Stops ({(activePanel.nameConfig.gradientStops || [activePanel.nameConfig.gradientColor1 || '#00f0ff', activePanel.nameConfig.gradientColor2 || '#ff0055']).length}):
                        </label>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '2px 6px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px', color: '#00f0ff' }}
                          onClick={() => {
                            const current = activePanel.nameConfig.gradientStops || [activePanel.nameConfig.gradientColor1 || '#00f0ff', activePanel.nameConfig.gradientColor2 || '#ff0055'];
                            updateTextConfig('name', { gradientStops: [...current, '#eab308'] });
                          }}
                        >
                          <Plus size={9} /> Add Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {activePanel.nameConfig.fillType === 'texture' && (
                    <div style={{ marginTop: '8px' }}>
                      <label className="btn btn-secondary" style={{ padding: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                        Upload Texture Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleTextTextureUpload('name', e)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      {activePanel.nameConfig.textureUrl && (
                        <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px', textAlign: 'center' }}>
                          ✓ Texture Loaded
                        </div>
                      )}
                    </div>
                  )}

                {/* Stroke Outline Controls for Name */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', margin: '0 0 6px 0', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Name Stroke / Outline:
                  </label>
                  <div className="grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Stroke Color:</label>
                      <input 
                        type="color" 
                        value={activePanel.nameConfig.strokeColor || '#000000'} 
                        onChange={(e) => updateTextConfig('name', { strokeColor: e.target.value })}
                        style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Stroke Width:</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        max="50"
                        className="form-input" 
                        value={activePanel.nameConfig.strokeWidth || 0}
                        onChange={(e) => updateTextConfig('name', { strokeWidth: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '4px', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}
              </div>


              {/* 2. Number Config Sub-Tab */}

              <div style={{ display: overlaySubTab === "number" ? "block" : "none", paddingBottom: "8px" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Player Number Layer</span>
                  <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={activePanel.numberConfig.enabled}
                      onChange={(e) => updateTextConfig('number', { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                </div>

                {true && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Vertical Position (Y):</span>
                        <span>{activePanel.numberConfig.yPos}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={activePanel.numberConfig.yPos}
                        onChange={(e) => updateTextConfig('number', { yPos: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Horizontal Spacing (Digit Spacing):</span>
                        <span>{activePanel.numberConfig.letterSpacing || 0} in</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.02" 
                        value={activePanel.numberConfig.letterSpacing || 0}
                        onChange={(e) => updateTextConfig('number', { letterSpacing: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Font Size (in):</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="form-input" 
                          value={activePanel.numberConfig.fontSize}
                          onChange={(e) => updateTextConfig('number', { fontSize: parseFloat(e.target.value) || 5 })}
                          style={{ padding: '6px' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Max Width (in):</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="form-input" 
                          value={activePanel.numberConfig.maxW}
                          onChange={(e) => updateTextConfig('number', { maxW: parseFloat(e.target.value) || 8 })}
                          style={{ padding: '6px' }}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Font Style:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.numberConfig.fontFamily}
                          onChange={(e) => updateTextConfig('number', { fontFamily: e.target.value })}
                          style={{ padding: '6px' }}
                        >
                          <option value="OldSport02AthleticNcv-E0gj">Old Sport Athletic (Default)</option>
                          <option value="Impact">Impact (Bold Athletic)</option>
                          <option value="Arial">Arial Black</option>
                          <option value="Trebuchet MS">Trebuchet (Modern Sans)</option>
                          <option value="Times New Roman">Times (Classic Serif)</option>
                          {customFonts.map(font => (
                            <option key={font.name} value={font.name}>{font.name} (Custom)</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Alignment:</label>
                        <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', background: activePanel.numberConfig.align === 'left' ? 'var(--color-primary)' : 'transparent', color: activePanel.numberConfig.align === 'left' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('number', { align: 'left' })}
                            title="Align Left"
                          >
                            <AlignLeft size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', background: (!activePanel.numberConfig.align || activePanel.numberConfig.align === 'center') ? 'var(--color-primary)' : 'transparent', color: (!activePanel.numberConfig.align || activePanel.numberConfig.align === 'center') ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('number', { align: 'center' })}
                            title="Align Center"
                          >
                            <AlignCenter size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ flex: 1, padding: '6px 0', border: 'none', background: activePanel.numberConfig.align === 'right' ? 'var(--color-primary)' : 'transparent', color: activePanel.numberConfig.align === 'right' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            onClick={() => updateTextConfig('number', { align: 'right' })}
                            title="Align Right"
                          >
                            <AlignRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                {/* Fill Style & Texture Controls for Number */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ fontSize: '11px', margin: 0, fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      Number Fill Style & Texture:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn ${(!activePanel.numberConfig.fillType || activePanel.numberConfig.fillType === 'solid') ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('number', { fillType: 'solid' })}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        className={`btn ${activePanel.numberConfig.fillType === 'gradient' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('number', { fillType: 'gradient', gradientColor1: activePanel.numberConfig.gradientColor1 || activePanel.numberConfig.color || '#00f0ff', gradientColor2: activePanel.numberConfig.gradientColor2 || '#ff0055' })}
                      >
                        Gradient
                      </button>
                      <button
                        type="button"
                        className={`btn ${activePanel.numberConfig.fillType === 'texture' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={() => updateTextConfig('number', { fillType: 'texture' })}
                      >
                        Texture
                      </button>
                    </div>
                  </div>

                  {(!activePanel.numberConfig.fillType || activePanel.numberConfig.fillType === 'solid') && (
                    <div className="form-row">
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label" style={{ fontSize: '10px' }}>Fill Color:</label>
                        <input 
                          type="color" 
                          value={activePanel.numberConfig.color}
                          onChange={(e) => updateTextConfig('number', { color: e.target.value })}
                          style={{ border: 'none', background: 'none', width: '100%', height: '26px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {activePanel.numberConfig.fillType === 'gradient' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>
                          Color Stops ({(activePanel.numberConfig.gradientStops || [activePanel.numberConfig.gradientColor1 || '#00f0ff', activePanel.numberConfig.gradientColor2 || '#ff0055']).length}):
                        </label>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '2px 6px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px', color: '#00f0ff' }}
                          onClick={() => {
                            const current = activePanel.numberConfig.gradientStops || [activePanel.numberConfig.gradientColor1 || '#00f0ff', activePanel.numberConfig.gradientColor2 || '#ff0055'];
                            updateTextConfig('number', { gradientStops: [...current, '#eab308'] });
                          }}
                        >
                          <Plus size={9} /> Add Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {activePanel.numberConfig.fillType === 'texture' && (
                    <div style={{ marginTop: '8px' }}>
                      <label className="btn btn-secondary" style={{ padding: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                        Upload Texture Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleTextTextureUpload('number', e)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      {activePanel.numberConfig.textureUrl && (
                        <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px', textAlign: 'center' }}>
                          ✓ Texture Loaded
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Stroke Outline Controls for Number */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)', marginTop: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', margin: '0 0 6px 0', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Number Stroke / Outline:
                  </label>
                  <div className="grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Stroke Color:</label>
                      <input 
                        type="color" 
                        value={activePanel.numberConfig.strokeColor || '#000000'} 
                        onChange={(e) => updateTextConfig('number', { strokeColor: e.target.value })}
                        style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Stroke Width:</label>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0"
                        max="50"
                        className="form-input" 
                        value={activePanel.numberConfig.strokeWidth || 0}
                        onChange={(e) => updateTextConfig('number', { strokeWidth: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '4px', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}
              </div>


              {/* 3. Logos Sub-Tab */}

                <div style={{ display: overlaySubTab === "logos" ? "flex" : "none", flexDirection: "column", gap: "14px", paddingBottom: "8px" }}>
                  {/* Left Chest Logo */}
                  {(activeTab === 'front' || activeTab === 'dual') && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Left Chest Logo / Crest</span>
                        <label className="checkbox-card" style={{ padding: '2px 6px', margin: 0, fontSize: '11px' }}>
                          <input 
                            type="checkbox" 
                            checked={activePanel.leftChestLogo?.enabled ?? false} 
                            onChange={(e) => updateLogoConfig('leftChest', { enabled: e.target.checked })}
                          />
                          Enable
                        </label>
                      </div>

                      {activePanel.leftChestLogo?.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <label className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>
                              Import Logo Image
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleLogoFileUpload('leftChest', e)} 
                                style={{ display: 'none' }} 
                              />
                            </label>
                            {activePanel.leftChestLogo?.uploadedUrl && (
                              <button 
                                className="btn" 
                                style={{ padding: '6px', fontSize: '10px', background: 'rgba(255,23,68,0.2)', border: 'none', color: '#ff1744' }}
                                onClick={() => updateLogoConfig('leftChest', { uploadedUrl: null })}
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-2px', marginBottom: '4px' }}>
                            <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={activePanel.leftChestLogo?.lockAspectRatio ?? true}
                                onChange={(e) => updateLogoConfig('leftChest', { lockAspectRatio: e.target.checked })}
                              />
                              Lock Proportions
                            </label>
                          </div>

                          <div className="grid-2">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px' }}>Width (in):</label>
                              <input 
                                type="number" 
                                step="0.2" 
                                className="form-input" 
                                value={activePanel.leftChestLogo?.width ?? 3.5} 
                                onChange={(e) => updateLogoConfig('leftChest', { width: parseFloat(e.target.value) || 0 })}
                                style={{ padding: '4px', fontSize: '11px' }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px' }}>Height (in):</label>
                              <input 
                                type="number" 
                                step="0.2" 
                                className="form-input" 
                                value={activePanel.leftChestLogo?.height ?? 3.5} 
                                onChange={(e) => updateLogoConfig('leftChest', { height: parseFloat(e.target.value) || 0 })}
                                style={{ padding: '4px', fontSize: '11px' }}
                              />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                              <span>Horizontal Pos (X) (in):</span>
                              <span>{activePanel.leftChestLogo?.xPos ?? 6.0} in</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={physicalWidth}
                              step="0.1"
                              value={activePanel.leftChestLogo?.xPos ?? 6.0}
                              onChange={(e) => updateLogoConfig('leftChest', { xPos: parseFloat(e.target.value) })}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                              <span>Vertical Pos (Y) (in):</span>
                              <span>{activePanel.leftChestLogo?.yPos ?? 7.0} in</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={physicalHeight}
                              step="0.1"
                              value={activePanel.leftChestLogo?.yPos ?? 7.0}
                              onChange={(e) => updateLogoConfig('leftChest', { yPos: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right Chest Logo */}
                  {(activeTab === 'front' || activeTab === 'dual') && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Right Chest Logo / Brand</span>
                        <label className="checkbox-card" style={{ padding: '2px 6px', margin: 0, fontSize: '11px' }}>
                          <input 
                            type="checkbox" 
                            checked={activePanel.rightChestLogo?.enabled ?? false} 
                            onChange={(e) => updateLogoConfig('rightChest', { enabled: e.target.checked })}
                          />
                          Enable
                        </label>
                      </div>

                      {activePanel.rightChestLogo?.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <label className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>
                              Import Logo Image
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleLogoFileUpload('rightChest', e)} 
                                style={{ display: 'none' }} 
                              />
                            </label>
                            {activePanel.rightChestLogo?.uploadedUrl && (
                              <button 
                                className="btn" 
                                style={{ padding: '6px', fontSize: '10px', background: 'rgba(255,23,68,0.2)', border: 'none', color: '#ff1744' }}
                                onClick={() => updateLogoConfig('rightChest', { uploadedUrl: null })}
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-2px', marginBottom: '4px' }}>
                            <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={activePanel.rightChestLogo?.lockAspectRatio ?? true}
                                onChange={(e) => updateLogoConfig('rightChest', { lockAspectRatio: e.target.checked })}
                              />
                              Lock Proportions
                            </label>
                          </div>

                          <div className="grid-2">
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px' }}>Width (in):</label>
                              <input 
                                type="number" 
                                step="0.2" 
                                className="form-input" 
                                value={activePanel.rightChestLogo?.width ?? 3.5} 
                                onChange={(e) => updateLogoConfig('rightChest', { width: parseFloat(e.target.value) || 0 })}
                                style={{ padding: '4px', fontSize: '11px' }}
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px' }}>Height (in):</label>
                              <input 
                                type="number" 
                                step="0.2" 
                                className="form-input" 
                                value={activePanel.rightChestLogo?.height ?? 3.5} 
                                onChange={(e) => updateLogoConfig('rightChest', { height: parseFloat(e.target.value) || 0 })}
                                style={{ padding: '4px', fontSize: '11px' }}
                              />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                              <span>Horizontal Pos (X) (in):</span>
                              <span>{activePanel.rightChestLogo?.xPos ?? (physicalWidth - 6.0)} in</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={physicalWidth}
                              step="0.1"
                              value={activePanel.rightChestLogo?.xPos ?? (physicalWidth - 6.0)}
                              onChange={(e) => updateLogoConfig('rightChest', { xPos: parseFloat(e.target.value) })}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                              <span>Vertical Pos (Y) (in):</span>
                              <span>{activePanel.rightChestLogo?.yPos ?? 7.0} in</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={physicalHeight}
                              step="0.1"
                              value={activePanel.rightChestLogo?.yPos ?? 7.0}
                              onChange={(e) => updateLogoConfig('rightChest', { yPos: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Center Torso Sponsor Logo */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Main Center Torso Sponsor Logo</span>
                      <label className="checkbox-card" style={{ padding: '2px 6px', margin: 0, fontSize: '11px' }}>
                        <input 
                          type="checkbox" 
                          checked={activePanel.torsoLogo?.enabled ?? false} 
                          onChange={(e) => updateLogoConfig('torso', { enabled: e.target.checked })}
                        />
                        Enable
                      </label>
                    </div>

                    {activePanel.torsoLogo?.enabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>
                            Import Logo Image
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleLogoFileUpload('torso', e)} 
                              style={{ display: 'none' }} 
                            />
                          </label>
                          {activePanel.torsoLogo?.uploadedUrl && (
                            <button 
                              className="btn" 
                              style={{ padding: '6px', fontSize: '10px', background: 'rgba(255,23,68,0.2)', border: 'none', color: '#ff1744' }}
                              onClick={() => updateLogoConfig('torso', { uploadedUrl: null })}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '10px' }}>Text Logo (If no image):</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. SPONSOR NAME" 
                            value={activePanel.torsoLogo?.text || ''} 
                            onChange={(e) => updateLogoConfig('torso', { text: e.target.value })}
                            style={{ padding: '4px', fontSize: '11px' }}
                          />
                        </div>

                        <div className="grid-2">
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '10px' }}>Width (in):</label>
                            <input 
                              type="number" 
                              step="0.5" 
                              className="form-input" 
                              value={activePanel.torsoLogo?.width ?? 11.0} 
                              onChange={(e) => updateLogoConfig('torso', { width: parseFloat(e.target.value) || 0 })}
                              style={{ padding: '6px' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '10px' }}>Height (in):</label>
                            <input 
                              type="number" 
                              step="0.5" 
                              className="form-input" 
                              value={activePanel.torsoLogo?.height ?? 4.0} 
                              onChange={(e) => updateLogoConfig('torso', { height: parseFloat(e.target.value) || 0 })}
                              style={{ padding: '6px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-2px', marginBottom: '4px' }}>
                          <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={activePanel.torsoLogo?.lockAspectRatio ?? true}
                              onChange={(e) => updateLogoConfig('torso', { lockAspectRatio: e.target.checked })}
                            />
                            Lock Proportions
                          </label>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>Horizontal Pos (X) (in):</span>
                            <span>{activePanel.torsoLogo?.xPos ?? 11.0} in</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={physicalWidth}
                            step="0.1"
                            value={activePanel.torsoLogo?.xPos ?? 11.0}
                            onChange={(e) => updateLogoConfig('torso', { xPos: parseFloat(e.target.value) })}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>Vertical Pos (Y) (in):</span>
                            <span>{activePanel.torsoLogo?.yPos ?? 16.0} in</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={physicalHeight}
                            step="0.1"
                            value={activePanel.torsoLogo?.yPos ?? 16.0}
                            onChange={(e) => updateLogoConfig('torso', { yPos: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>


              {/* 4. Size Tag Sub-Tab */}

                <div style={{ display: overlaySubTab === "sizeTag" ? "block" : "none", paddingBottom: "8px" }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '12px' }}>Size Tag Overlay (Top Left)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                        <input 
                          type="checkbox" 
                          checked={activePanel.sizeTagConfig?.enabled ?? true}
                          onChange={(e) => updateTextConfig('sizeTag', { enabled: e.target.checked })}
                        />
                        Enable Size Tag Overlay
                      </label>
                    </div>

                    {true && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="form-row">
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px' }}>Font Size (pt):</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              value={activePanel.sizeTagConfig?.fontSize ?? 34}
                              onChange={(e) => updateTextConfig('sizeTag', { fontSize: parseInt(e.target.value) || 20 })}
                              style={{ padding: '6px' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '11px' }}>Stroke Width:</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              value={activePanel.sizeTagConfig?.strokeWidth ?? 3}
                              onChange={(e) => updateTextConfig('sizeTag', { strokeWidth: parseInt(e.target.value) || 0 })}
                              style={{ padding: '6px' }}
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '11px' }}>Text Color:</label>
                            <input 
                              type="color" 
                              value={activePanel.sizeTagConfig?.color || '#ff1744'}
                              onChange={(e) => updateTextConfig('sizeTag', { color: e.target.value })}
                              style={{ border: 'none', background: 'none', width: '100%', height: '30px', cursor: 'pointer' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0, flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '11px' }}>Stroke Color:</label>
                            <input 
                              type="color" 
                              value={activePanel.sizeTagConfig?.strokeColor || '#ffffff'}
                              onChange={(e) => updateTextConfig('sizeTag', { strokeColor: e.target.value })}
                              style={{ border: 'none', background: 'none', width: '100%', height: '30px', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
              )}
              </div>
              </div>

              </div>
              )}
        </div>

        {/* Step 3: Design Presets Manager Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)' }}
            onClick={() => toggleCollapse('presets')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💾</span> Design Presets Manager
            </span>
            {collapsed.presets ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>
          {!collapsed.presets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Save the current design configuration (background uploads, colors, fonts, strokes, and text formats) as a reusable template preset.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Preset Name" 
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  style={{ padding: '8px', fontSize: '12px' }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleSavePreset}
                  style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  Save
                </button>
              </div>

              {presets.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>Select Preset to Load:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {presets.map((preset, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '11px' }}>
                        <span 
                          style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-bright)' }}
                          onClick={() => handleLoadPreset(preset.name)}
                        >
                          {preset.name}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '3px 8px', fontSize: '9px' }}
                            onClick={() => handleLoadPreset(preset.name)}
                          >
                            Load
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '3px 8px', fontSize: '9px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744' }}
                            onClick={() => handleDeletePreset(preset.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Collar & Trim Customization */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)' }}
            onClick={() => toggleCollapse('trim')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shirt size={18} /> Collar & Trim Customization
            </span>
            {collapsed.trim ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.trim && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Part 1: Collar */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'semibold', color: '#fff', marginBottom: '8px' }}>Collar & Rib</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={designConfig.trim?.collar.color || designConfig.front.generatedColor1} 
                      onChange={(e) => updateTrimConfig('collar', { color: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '38px', height: '38px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={(designConfig.trim?.collar.color || designConfig.front.generatedColor1).toUpperCase()}
                      onChange={(e) => updateTrimConfig('collar', { color: e.target.value })}
                      style={{ padding: '6px', fontSize: '12px', width: '90px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    {designConfig.trim?.collar.uploadedUrl ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Image Active
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateTrimConfig('collar', { uploadedUrl: null })}
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'inline-block' }}>
                        Import Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleTrimFileUpload('collar', e)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 2: Placket */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'semibold', color: '#fff', marginBottom: '8px' }}>Button Placket</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={designConfig.trim?.placket.color || designConfig.front.generatedColor1} 
                      onChange={(e) => updateTrimConfig('placket', { color: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '38px', height: '38px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={(designConfig.trim?.placket.color || designConfig.front.generatedColor1).toUpperCase()}
                      onChange={(e) => updateTrimConfig('placket', { color: e.target.value })}
                      style={{ padding: '6px', fontSize: '12px', width: '90px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    {designConfig.trim?.placket.uploadedUrl ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Image Active
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateTrimConfig('placket', { uploadedUrl: null })}
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'inline-block' }}>
                        Import Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleTrimFileUpload('placket', e)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 3: Sleeve Stripe */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 'semibold', color: '#fff', marginBottom: '8px' }}>Sleeve Stripe / Cuff</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={designConfig.trim?.sleeveStripe.color || designConfig.front.generatedColor1} 
                      onChange={(e) => updateTrimConfig('sleeveStripe', { color: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '38px', height: '38px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={(designConfig.trim?.sleeveStripe.color || designConfig.front.generatedColor1).toUpperCase()}
                      onChange={(e) => updateTrimConfig('sleeveStripe', { color: e.target.value })}
                      style={{ padding: '6px', fontSize: '12px', width: '90px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    {designConfig.trim?.sleeveStripe.uploadedUrl ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Image Active
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateTrimConfig('sleeveStripe', { uploadedUrl: null })}
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <label className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', textAlign: 'center', display: 'inline-block' }}>
                        Import Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleTrimFileUpload('sleeveStripe', e)} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>




        {/* Custom Guidelines Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: '#00f0ff', marginBottom: collapsed.guidelines ? 0 : '16px' }}
            onClick={() => toggleCollapse('guidelines')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📏</span> Custom Guidelines (Inches)
            </span>
            {collapsed.guidelines ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.guidelines && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Add horizontal or vertical guidelines at custom positions on this panel. Guidelines are saved per panel.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <select 
                  className="form-select" 
                  style={{ width: '120px', padding: '6px' }}
                  value={newGuideType}
                  onChange={(e) => setNewGuideType(e.target.value as any)}
                >
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  className="form-input" 
                  placeholder="Inches" 
                  style={{ padding: '6px', flexGrow: 1 }}
                  value={newGuideValue}
                  onChange={(e) => setNewGuideValue(e.target.value)}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    const val = parseFloat(newGuideValue);
                    if (isNaN(val) || val < 0) {
                      alert("Please enter a valid position in inches.");
                      return;
                    }
                    const maxVal = newGuideType === 'vertical' ? physicalWidth : physicalHeight;
                    if (val > maxVal) {
                      alert(`Position exceeds panel boundary (${maxVal.toFixed(1)} inches).`);
                      return;
                    }

                    // Add to active panel guidelines
                    const currentGuides = activePanel.guidelines || { vertical: [], horizontal: [] };
                    const list = newGuideType === 'vertical' 
                      ? [...(currentGuides.vertical || [])] 
                      : [...(currentGuides.horizontal || [])];
                    
                    if (list.includes(val)) {
                      alert("This guideline already exists.");
                      return;
                    }

                    // Sort numerically
                    list.push(val);
                    list.sort((a, b) => a - b);

                    updateActivePanel({
                      guidelines: {
                        vertical: newGuideType === 'vertical' ? list : (currentGuides.vertical || []),
                        horizontal: newGuideType === 'horizontal' ? list : (currentGuides.horizontal || [])
                      }
                    });
                    setNewGuideValue("");
                  }}
                >
                  + Add
                </button>
              </div>

              {/* List of active guidelines */}
              {((activePanel.guidelines?.vertical?.length || 0) > 0 || (activePanel.guidelines?.horizontal?.length || 0) > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-muted)' }}>Active Guides:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {/* Vertical Guides */}
                      {(activePanel.guidelines?.vertical || []).map((val, idx) => (
                        <div key={`v-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0, 240, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.15)', fontSize: '11px' }}>
                          <span style={{ color: '#00f0ff', fontWeight: '500' }}>Vertical: {val.toFixed(1)}"</span>
                          <button 
                            className="btn" 
                            style={{ padding: '2px 6px', fontSize: '9px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                            onClick={() => {
                              const currentGuides = activePanel.guidelines || { vertical: [], horizontal: [] };
                              updateActivePanel({
                                guidelines: {
                                  vertical: (currentGuides.vertical || []).filter(v => v !== val),
                                  horizontal: currentGuides.horizontal || []
                                }
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      {/* Horizontal Guides */}
                      {(activePanel.guidelines?.horizontal || []).map((val, idx) => (
                        <div key={`h-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0, 240, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(0, 240, 255, 0.15)', fontSize: '11px' }}>
                          <span style={{ color: '#00f0ff', fontWeight: '500' }}>Horizontal: {val.toFixed(1)}"</span>
                          <button 
                            className="btn" 
                            style={{ padding: '2px 6px', fontSize: '9px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                            onClick={() => {
                              const currentGuides = activePanel.guidelines || { vertical: [], horizontal: [] };
                              updateActivePanel({
                                guidelines: {
                                  vertical: currentGuides.vertical || [],
                                  horizontal: (currentGuides.horizontal || []).filter(h => h !== val)
                                }
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px', fontSize: '11px', width: '100%', marginTop: '6px' }}
                    onClick={() => {
                      updateActivePanel({
                        guidelines: { vertical: [], horizontal: [] }
                      });
                    }}
                  >
                    Clear All Guides
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '8px 0' }}>
                  No custom guidelines defined for this panel.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Custom Font Upload Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-success)', marginBottom: collapsed.fonts ? 0 : '16px' }}
            onClick={() => toggleCollapse('fonts')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔤</span> Custom Font Registry
            </span>
            {collapsed.fonts ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.fonts && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Upload custom TrueType (.ttf) or Web (.woff/.woff2) fonts to use for player names and numbers. Font styles will load into the canvas and export automatically.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="file" 
                  accept=".ttf,.woff,.woff2" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fontName = file.name.substring(0, file.name.lastIndexOf('.'));
                      const reader = new FileReader();
                      reader.onload = async (uploadEvent) => {
                        const dataUrl = uploadEvent.target?.result as string;
                        try {
                          const fontFace = new FontFace(fontName, `url(${dataUrl})`);
                          const loadedFace = await fontFace.load();
                          document.fonts.add(loadedFace);
                          
                          const newFont = { name: fontName, url: dataUrl };
                          const updated = [...customFonts, newFont];
                          setCustomFonts(updated);
                          localStorage.setItem('teedex_custom_fonts', JSON.stringify(updated));
                        } catch (err) {
                          console.error("Failed to register font:", err);
                          alert("Could not load font file. Please verify it is a valid TTF or WOFF file.");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ display: 'none' }} 
                  id="font-uploader-input"
                />
                <label htmlFor="font-uploader-input" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px' }}>
                  <Upload size={14} /> Upload Font File
                </label>
                
                {customFonts.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Loaded Custom Fonts:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                      {customFonts.map((font, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-light)', fontSize: '11px' }}>
                          <span style={{ fontFamily: font.name, fontWeight: 'bold' }}>{font.name}</span>
                          <button 
                            className="btn" 
                            style={{ padding: '2px 6px', fontSize: '9px', background: 'rgba(255,23,68,0.2)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                            onClick={() => {
                              const updated = customFonts.filter(f => f.name !== font.name);
                              setCustomFonts(updated);
                              localStorage.setItem('teedex_custom_fonts', JSON.stringify(updated));
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
    </div>

      {/* 4. COREL COLOR PALETTE STRIP */}
      <ColorPalette
        onSelectFillColor={handlePaletteFill}
        onSelectStrokeColor={handlePaletteStroke}
        onSelectGradientColor={handlePaletteGradient}
      />

      {/* 5. COREL STATUS BAR */}
      <StatusBar
        activeTool={activeTool}
        cursorPos={cursorPos}
        activeTab={activeTab}
        physicalWidth={physicalWidth}
        physicalHeight={physicalHeight}
        zoom={zoom}
      />

      {/* 6. SHORTCUTS HELP MODAL */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {/* 7. SUBLIMATION CORE PANEL & SIZE GRADING EDITOR MODAL */}
      <SizesModal 
        isOpen={showPanelEditorModal} 
        onClose={() => setShowPanelEditorModal(false)} 
        onDatabaseChange={() => setPrefTrigger(prev => prev + 1)}
      />
    </div>
  );
};

