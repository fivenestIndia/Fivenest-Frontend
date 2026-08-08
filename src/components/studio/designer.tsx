import React, { useState, useEffect, useRef } from 'react';
import { Upload, Paintbrush, Layers, FolderArchive, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, Trash2, Shirt, Plus } from 'lucide-react';
import type { OrderMetadata } from './orderEntry';
import { ThreeDPreview } from './ThreeDPreview';
import { defaultSizes } from './sizesDb';
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 30, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0.06 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print' | 'threeD'>('back');
  const [previewName, setPreviewName] = useState<string>("RODRIGUEZ");
  const [previewNumber, setPreviewNumber] = useState<string>("10");
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
  const [panStart, setPanStart] = useState<{ scrollLeft: number; scrollTop: number; x: number; y: number } | null>(null);
  const [activeTextLayer, setActiveTextLayer] = useState<'name' | 'number'>('name');

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
    presets: true,
    background: true,
    overlays: true,
    logos: true,
    guidelines: true,
    fonts: true,
    trim: true,
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
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
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
      // Zoom reset: Ctrl + 0 or Cmd + 0
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
      // Toggle guidelines: Ctrl + . or Cmd + .
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault();
        setShowGuidelines(prev => !prev);
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
      if (scrollWrapperRef.current) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          scrollLeft: scrollWrapperRef.current.scrollLeft,
          scrollTop: scrollWrapperRef.current.scrollTop,
          distance: 0,
          zoom: zoom
        };
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = {
        x: 0,
        y: 0,
        scrollLeft: 0,
        scrollTop: 0,
        distance,
        zoom: zoom
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 1 && touchStartRef.current.distance === 0) {
      // Touch drag pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      if (scrollWrapperRef.current) {
        if (zoom > 1) {
          if (e.cancelable) e.preventDefault();
          scrollWrapperRef.current.scrollLeft = touchStartRef.current.scrollLeft - deltaX;
          scrollWrapperRef.current.scrollTop = touchStartRef.current.scrollTop - deltaY;
        }
      }
    } else if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      // Touch pinch zoom
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDistance / touchStartRef.current.distance;
      const newZoom = Math.min(3, Math.max(0.5, touchStartRef.current.zoom * ratio));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Physical dimensions based on active tab and metadata
  let physicalHeight = 30;
  let physicalWidth = 22;

  if (activeTab === 'sleeveLeft' || activeTab === 'sleeveRight') {
    const isRaglan = metadata?.raglanStyle ?? false;
    physicalHeight = previewSleeveType === 'full' ? (isRaglan ? 31 : 25) : (isRaglan ? 16.5 : 11);
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

  const activePanel = activeTab === 'threeD' ? designConfig.front : designConfig[activeTab];

  // Helper to trigger parent update
  const updateActivePanel = (updatedFields: Partial<PanelConfig>) => {
    const targetTab = activeTab === 'threeD' ? 'front' : activeTab;
    const updated = {
      ...designConfig,
      [targetTab]: {
        ...activePanel,
        ...updatedFields
      }
    };
    onDesignConfigChange(updated);
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
    onDesignConfigChange(updated);
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
        ...(activePanel[configKey] || { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'Impact', maxW: 10, caseType: 'uppercase', effect: 'none' }),
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
        // FIXED 14pt text size — same physical size on ALL panels
        const pxPerInch = width / physicalW;
        const fontSizePx = Math.round((14 / 72) * pxPerInch);
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

      // Draw interactive Cyan Selection Box with 8 Control Handles around Active Selected Text Layer
      if (!is3DPreview) {
        const activeKey = activeTextLayer || (panel.nameConfig.enabled ? 'name' : 'number');
        const selectedBox = textBoundingBoxesRef.current[activeKey];
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
          const badgeText = activeKey === 'name' ? 'PLAYER NAME (SELECTED)' : 'PLAYER NUMBER (SELECTED)';
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
      const sizeTagConf = panel.sizeTagConfig || { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 7, fontFamily: 'Impact', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left' };
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
    const rulerOffset = rulersEnabled ? Math.round(0.35 * scale) : 0;

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

      // 2. Photoshop Ruler Background bars (OUTSIDE panel image area)
      const rulerBg = isLightMode ? '#cbd5e1' : '#1e1e24';
      const tickColor = isLightMode ? '#0f172a' : '#f8fafc';
      const borderLineColor = isLightMode ? '#94a3b8' : '#334155';

      // Top Ruler track (0 .. rulerOffset y)
      ctx.fillStyle = rulerBg;
      ctx.fillRect(rulerOffset, 0, width, rulerOffset);

      // Left Ruler track (0 .. rulerOffset x)
      ctx.fillRect(0, rulerOffset, rulerOffset, height);

      // Top-Left Corner Junction Box
      ctx.fillStyle = isLightMode ? '#94a3b8' : '#2a2a36';
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

      for (let x = 0; x <= physicalW; x += 0.5) {
        const xPx = rulerOffset + Math.round(x * scale);
        const isWhole = x % 1 === 0;
        const tickLen = isWhole ? Math.round(0.10 * scale) : Math.round(0.05 * scale);
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
          ctx.fillStyle = panelKey === 'a4Print' ? '#ffffff' : '#1c1c24';
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
          ctx.fillStyle = panelKey === 'a4Print' ? '#ffffff' : '#1c1c24';
          ctx.fillRect(0, 0, width, height);
        }
        
        if (!is3DPreview) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, width - 20, height - 20);
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
        setZoom(1);
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

  // Draw preview canvas
  useEffect(() => {
    if (activeTab === 'threeD') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rulersPref = true;
    try {
      const savedR = localStorage.getItem('fivenest_pref_rulers');
      if (savedR !== null) rulersPref = JSON.parse(savedR);
    } catch (e) {}
    const rulerOffset = rulersPref ? Math.round(0.35 * scale) : 0;

    canvas.width = (width + rulerOffset) * zoom;
    canvas.height = (height + rulerOffset) * zoom;
    ctx.scale(zoom, zoom);

    renderPanelToCanvas(activeTab, ctx, width, height, scale, false);
  }, [activeTab, activePanel, previewName, previewNumber, designConfig, customFonts, metadata, previewSleeveType, prefTrigger, zoom, showGuidelines]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
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

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || activeTab === 'threeD') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (width / rect.width);
    const canvasY = (e.clientY - rect.top) * (height / rect.height);

    const pad = 16;

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
        setActiveTool('text');
        isDraggingTextRef.current = true;
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
        setActiveTool('text');
        isDraggingTextRef.current = true;
        setPrefTrigger(prev => prev + 1);
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingTextRef.current && activeTextLayer) {
      const canvasY = (mouseY / rect.height) * height;
      const newYPercent = Math.min(100, Math.max(0, Math.round((canvasY / height) * 100)));
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

        <div className="tab-btn-group" style={{ width: '100%', maxWidth: '640px' }}>
          <button className={`tab-btn ${activeTab === 'front' ? 'active' : ''}`} onClick={() => setActiveTab('front')}>Front</button>
          <button className={`tab-btn ${activeTab === 'back' ? 'active' : ''}`} onClick={() => setActiveTab('back')}>Back</button>
          <button className={`tab-btn ${activeTab === 'sleeveLeft' ? 'active' : ''}`} onClick={() => setActiveTab('sleeveLeft')}>Left Sleeve</button>
          <button className={`tab-btn ${activeTab === 'sleeveRight' ? 'active' : ''}`} onClick={() => setActiveTab('sleeveRight')}>Right Sleeve</button>
          <button className={`tab-btn ${activeTab === 'a4Print' ? 'active' : ''}`} onClick={() => setActiveTab('a4Print')}>A4 Print</button>
          <button 
            className={`tab-btn flex items-center gap-1.5 ${activeTab === 'threeD' ? 'active' : ''}`} 
            onClick={() => setActiveTab('threeD')}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '12px' }}
          >
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            3D View
          </button>
        </div>
        
        {(activeTab === 'sleeveLeft' || activeTab === 'sleeveRight') && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
            <button 
              className={`btn ${previewSleeveType === 'half' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '20px' }}
              onClick={() => handleSleeveTypeChange('half')}
            >
              Half Sleeve ({metadata?.raglanStyle ? "19x17\"" : "19x11\""})
            </button>
            <button 
              className={`btn ${previewSleeveType === 'full' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '20px' }}
              onClick={() => handleSleeveTypeChange('full')}
            >
              Full Sleeve ({metadata?.raglanStyle ? "19x31\"" : "19x25\""})
            </button>
          </div>
        )}
        
        {/* Zoom Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
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
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          {zoom !== 1 && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        {/* Scrollable Wrapper for Canvas Zoom */}
        <div 
          ref={scrollWrapperRef}
          style={{ 
            flexGrow: 1, 
            width: '100%', 
            height: '100%',
            overflow: 'auto', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            padding: '16px',
            boxSizing: 'border-box',
            cursor: (spaceKeyPressed || activeTool === 'pan') ? (panStart ? 'grabbing' : 'grab') : ((zKeyPressed || activeTool === 'zoom') ? (dragStart ? 'grabbing' : 'zoom-in') : 'default'),
            userSelect: (spaceKeyPressed || activeTool === 'pan' || zKeyPressed || activeTool === 'zoom') ? 'none' : 'auto',
            position: 'relative'
          }}
          onWheel={(e) => {
            e.preventDefault();
            const sensitivity = 0.0015;
            const newZoom = Math.min(3, Math.max(0.5, zoom - e.deltaY * sensitivity));
            setZoom(newZoom);
          }}
          onMouseDown={(e) => {
            if ((spaceKeyPressed || activeTool === 'pan') && e.button === 0) {
              e.preventDefault();
              if (scrollWrapperRef.current) {
                setPanStart({
                  scrollLeft: scrollWrapperRef.current.scrollLeft,
                  scrollTop: scrollWrapperRef.current.scrollTop,
                  x: e.clientX,
                  y: e.clientY
                });
              }
            } else if ((zKeyPressed || activeTool === 'zoom') && e.button === 0) {
              e.preventDefault();
              setDragStart({ x: e.clientX, y: e.clientY, zoom: zoom });
            }
          }}
          onMouseMove={(e) => {
            if (panStart) {
              e.preventDefault();
              const deltaX = e.clientX - panStart.x;
              const deltaY = e.clientY - panStart.y;
              if (scrollWrapperRef.current) {
                scrollWrapperRef.current.scrollLeft = panStart.scrollLeft - deltaX;
                scrollWrapperRef.current.scrollTop = panStart.scrollTop - deltaY;
              }
            } else if (dragStart) {
              e.preventDefault();
              const deltaX = e.clientX - dragStart.x;
              const deltaY = dragStart.y - e.clientY;
              const dragDistance = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
              const sensitivity = 0.008;
              const newZoom = Math.min(3, Math.max(0.5, dragStart.zoom + dragDistance * sensitivity));
              setZoom(newZoom);
            }
          }}
          onMouseUp={() => {
            setDragStart(null);
            setPanStart(null);
          }}
          onMouseLeave={() => {
            setDragStart(null);
            setPanStart(null);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Centering inner container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box'
          }}>
            {activeTab === 'threeD' ? (
              <div style={{ width: '100%', height: '100%', minHeight: '450px', flexGrow: 1 }}>
                <ThreeDPreview 
                  designConfig={designConfig} 
                  renderPanelToCanvas={renderPanelToCanvas}
                  previewSleeveType={previewSleeveType}
                  prefTrigger={prefTrigger}
                  zoom={zoom}
                />
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setCursorPos(null)}
                style={{ 
                  borderRadius: '8px', 
                  border: '2px solid rgba(0, 240, 255, 0.4)', 
                  boxShadow: '0 0 40px rgba(0,0,0,0.95)',
                  cursor: (spaceKeyPressed || zKeyPressed) ? 'inherit' : 'pointer',
                  width: `${width * zoom}px`,
                  height: `${height * zoom}px`,
                  maxWidth: zoom > 1 ? 'none' : '100%',
                  maxHeight: zoom > 1 ? 'none' : '100%',
                  objectFit: 'contain',
                  flexShrink: 0
                }} 
              />
            )}
          </div>
        </div>
        
        {/* Mock inputs for testing positions */}
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
      </div>
      </div>

      {/* CorelDRAW Right Docker Panel */}
      <div className="cd-docker-panel">
        {/* Bulk ZIP Importer Card */}
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

        {/* Saved Presets Card */}
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

        {/* Artwork Background */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)' }}
            onClick={() => toggleCollapse('background')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paintbrush size={18} /> Artwork Background
            </span>
            {collapsed.background ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.background && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button 
                  className={`btn ${activePanel.backgroundType === 'generate' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => updateActivePanel({ backgroundType: 'generate' })}
                >
                  Pattern Generator
                </button>
                <button 
                  className={`btn ${activePanel.backgroundType === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => updateActivePanel({ backgroundType: 'upload' })}
                >
                  Upload Graphic
                </button>
              </div>

              {activePanel.backgroundType === 'generate' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Pattern Style:</label>
                    <select 
                      className="form-select" 
                      value={activePanel.generatedStyle}
                      onChange={(e) => updateActivePanel({ generatedStyle: e.target.value as any })}
                    >
                      <option value="neon-gradient">Radial Glow Gradient</option>
                      <option value="classic-stripes">Diagonal Athletic Stripes</option>
                      <option value="camo-glow">Digital Camo Glow Spots</option>
                      <option value="blank">Blank Flat Background</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Theme Color 1:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="color" 
                          value={activePanel.generatedColor1} 
                          onChange={(e) => updateActivePanel({ generatedColor1: e.target.value })}
                          style={{ border: 'none', background: 'none', width: '38px', height: '38px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-input" 
                          value={activePanel.generatedColor1.toUpperCase()}
                          onChange={(e) => updateActivePanel({ generatedColor1: e.target.value })}
                          style={{ padding: '6px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Theme Color 2:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="color" 
                          value={activePanel.generatedColor2} 
                          onChange={(e) => updateActivePanel({ generatedColor2: e.target.value })}
                          style={{ border: 'none', background: 'none', width: '38px', height: '38px', cursor: 'pointer' }}
                        />
                        <input 
                          type="text" 
                          className="form-input" 
                          value={activePanel.generatedColor2.toUpperCase()}
                          onChange={(e) => updateActivePanel({ generatedColor2: e.target.value })}
                          style={{ padding: '6px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="file-dropzone" 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                  <Upload className="file-dropzone-icon" size={24} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Choose background template</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, SVG or TIFF</p>
                  </div>
                  {activeTab.startsWith('sleeve') ? (
                    (previewSleeveType === 'full' ? activePanel.uploadedFileFullUrl : activePanel.uploadedFileHalfUrl) && (
                      <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold', wordBreak: 'break-all', marginTop: '8px' }}>
                        Sleeve Image Loaded Successfully ✓
                      </div>
                    )
                  ) : (
                    activePanel.uploadedFileUrl && (
                      <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'bold', wordBreak: 'break-all', marginTop: '8px' }}>
                        Image Loaded Successfully ✓
                      </div>
                    )
                  )}
                </div>
              )}

              {activePanel.backgroundType === 'upload' && activeTab === 'a4Print' && activePanel.uploadedFileUrl && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--color-primary)' }}>A4 Background Image Position & Size</span>
                  
                  <div className="grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Width (in):</label>
                      <input 
                        type="number" 
                        step="0.05"
                        className="form-input" 
                        value={activePanel.bgWidth ?? 10} 
                        onChange={(e) => updateBackgroundConfig({ bgWidth: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Height (in):</label>
                      <input 
                        type="number" 
                        step="0.05"
                        className="form-input" 
                        value={activePanel.bgHeight ?? 11} 
                        onChange={(e) => updateBackgroundConfig({ bgHeight: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '6px', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '11px', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={activePanel.bgLockAspectRatio ?? true} 
                        onChange={(e) => updateBackgroundConfig({ bgLockAspectRatio: e.target.checked })}
                      />
                      Lock Proportions
                    </label>
                  </div>

                  <div className="grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>X Position (in):</label>
                      <input 
                        type="number" 
                        step="0.05"
                        className="form-input" 
                        value={activePanel.bgX ?? 0} 
                        onChange={(e) => updateBackgroundConfig({ bgX: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '6px', fontSize: '12px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Y Position (in):</label>
                      <input 
                        type="number" 
                        step="0.05"
                        className="form-input" 
                        value={activePanel.bgY ?? 0} 
                        onChange={(e) => updateBackgroundConfig({ bgY: parseFloat(e.target.value) || 0 })}
                        style={{ padding: '6px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activePanel.backgroundType === 'upload' && (
                activeTab.startsWith('sleeve') 
                  ? (previewSleeveType === 'full' ? activePanel.uploadedFileFullUrl : activePanel.uploadedFileHalfUrl)
                  : activePanel.uploadedFileUrl
              ) && (
                <div style={{ marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ width: '100%', padding: '6px', fontSize: '11px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                    onClick={() => {
                      if (activeTab.startsWith('sleeve')) {
                        if (previewSleeveType === 'full') {
                          updateActivePanel({ uploadedFileFullUrl: null });
                        } else {
                          updateActivePanel({ uploadedFileHalfUrl: null });
                        }
                      } else {
                        updateActivePanel({ uploadedFileUrl: null });
                      }
                    }}
                  >
                    Remove Uploaded Background
                  </button>
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

        {/* Name and Number overlays */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-secondary)', marginBottom: collapsed.overlays ? 0 : '16px' }}
            onClick={() => toggleCollapse('overlays')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} /> Print Layer Overlays
            </span>
            {collapsed.overlays ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </h3>

          {!collapsed.overlays && (
            <div>
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

              {/* Name Config */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
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

                {activePanel.nameConfig.enabled && (
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

                  {/* Solid Fill */}
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

                  {/* Multi-Color Gradient Fill */}
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
                          <Plus size={9} /> Add Color Stop
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(activePanel.nameConfig.gradientStops || [activePanel.nameConfig.gradientColor1 || '#00f0ff', activePanel.nameConfig.gradientColor2 || '#ff0055']).map((c, sIdx, arr) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '9px', opacity: 0.6 }}>#{sIdx + 1}</span>
                            <input 
                              type="color" 
                              value={c}
                              onChange={(e) => {
                                const newStops = [...arr];
                                newStops[sIdx] = e.target.value;
                                updateTextConfig('name', { 
                                  gradientStops: newStops,
                                  gradientColor1: newStops[0],
                                  gradientColor2: newStops[newStops.length - 1]
                                });
                              }}
                              style={{ border: 'none', background: 'none', width: '22px', height: '22px', cursor: 'pointer' }}
                            />
                            {arr.length > 2 && (
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px' }}
                                onClick={() => {
                                  const newStops = arr.filter((_, i) => i !== sIdx);
                                  updateTextConfig('name', { gradientStops: newStops });
                                }}
                                title="Remove Stop"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '10px' }}>Gradient Direction:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.nameConfig.gradientDirection || 'vertical'}
                          onChange={(e) => updateTextConfig('name', { gradientDirection: e.target.value as any })}
                          style={{ padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="vertical">Vertical (Top → Bottom)</option>
                          <option value="horizontal">Horizontal (Left → Right)</option>
                          <option value="diagonal">Diagonal (Corner → Corner)</option>
                          <option value="radial">Radial (Center Outward)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Texture Fill */}
                  {activePanel.nameConfig.fillType === 'texture' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Upload Texture Image (Gold foil, camo, glitter, carbon, pattern):</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              const url = uploadEvent.target?.result as string;
                              updateTextConfig('name', { textureUrl: url, fillType: 'texture' });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {activePanel.nameConfig.textureUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <img src={activePanel.nameConfig.textureUrl} alt="Name Texture" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #00f0ff' }} />
                          <span style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 'bold' }}>Texture Active</span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '9px', marginLeft: 'auto', color: '#ef4444' }}
                            onClick={() => updateTextConfig('name', { textureUrl: null, fillType: 'solid' })}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Stroke Color:</label>
                    <input 
                      type="color" 
                      value={activePanel.nameConfig.strokeColor}
                      onChange={(e) => updateTextConfig('name', { strokeColor: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Stroke (px):</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="15" 
                      className="form-input" 
                      value={activePanel.nameConfig.strokeWidth}
                      onChange={(e) => updateTextConfig('name', { strokeWidth: parseInt(e.target.value) || 0 })}
                      style={{ padding: '6px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Number Config */}
          <div>
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

            {activePanel.numberConfig.enabled && (
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
                    <span>Horizontal Spacing (Letter Spacing):</span>
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
                      step="0.1" 
                      className="form-input" 
                      value={activePanel.numberConfig.fontSize}
                      onChange={(e) => updateTextConfig('number', { fontSize: parseFloat(e.target.value) || 1 })}
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
                      onChange={(e) => updateTextConfig('number', { maxW: parseFloat(e.target.value) || 5 })}
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
                    <label className="form-label" style={{ fontSize: '11px' }}>Text Effect:</label>
                    <select 
                      className="form-select" 
                      value={activePanel.numberConfig.effect || 'none'}
                      onChange={(e) => updateTextConfig('number', { effect: e.target.value as any })}
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

                  {/* Solid Fill */}
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

                  {/* Multi-Color Gradient Fill */}
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
                          <Plus size={9} /> Add Color Stop
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(activePanel.numberConfig.gradientStops || [activePanel.numberConfig.gradientColor1 || '#00f0ff', activePanel.numberConfig.gradientColor2 || '#ff0055']).map((c, sIdx, arr) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '9px', opacity: 0.6 }}>#{sIdx + 1}</span>
                            <input 
                              type="color" 
                              value={c}
                              onChange={(e) => {
                                const newStops = [...arr];
                                newStops[sIdx] = e.target.value;
                                updateTextConfig('number', { 
                                  gradientStops: newStops,
                                  gradientColor1: newStops[0],
                                  gradientColor2: newStops[newStops.length - 1]
                                });
                              }}
                              style={{ border: 'none', background: 'none', width: '22px', height: '22px', cursor: 'pointer' }}
                            />
                            {arr.length > 2 && (
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px' }}
                                onClick={() => {
                                  const newStops = arr.filter((_, i) => i !== sIdx);
                                  updateTextConfig('number', { gradientStops: newStops });
                                }}
                                title="Remove Stop"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '10px' }}>Gradient Direction:</label>
                        <select 
                          className="form-select" 
                          value={activePanel.numberConfig.gradientDirection || 'vertical'}
                          onChange={(e) => updateTextConfig('number', { gradientDirection: e.target.value as any })}
                          style={{ padding: '4px 6px', fontSize: '11px' }}
                        >
                          <option value="vertical">Vertical (Top → Bottom)</option>
                          <option value="horizontal">Horizontal (Left → Right)</option>
                          <option value="diagonal">Diagonal (Corner → Corner)</option>
                          <option value="radial">Radial (Center Outward)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Texture Fill */}
                  {activePanel.numberConfig.fillType === 'texture' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="form-label" style={{ fontSize: '10px' }}>Upload Texture Image (Gold foil, camo, glitter, carbon, pattern):</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ fontSize: '11px', color: 'var(--text-muted)' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              const url = uploadEvent.target?.result as string;
                              updateTextConfig('number', { textureUrl: url, fillType: 'texture' });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {activePanel.numberConfig.textureUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <img src={activePanel.numberConfig.textureUrl} alt="Number Texture" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #00f0ff' }} />
                          <span style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 'bold' }}>Texture Active</span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '9px', marginLeft: 'auto', color: '#ef4444' }}
                            onClick={() => updateTextConfig('number', { textureUrl: null, fillType: 'solid' })}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Stroke Color:</label>
                    <input 
                      type="color" 
                      value={activePanel.numberConfig.strokeColor}
                      onChange={(e) => updateTextConfig('number', { strokeColor: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Stroke (px):</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="15" 
                      className="form-input" 
                      value={activePanel.numberConfig.strokeWidth}
                      onChange={(e) => updateTextConfig('number', { strokeWidth: parseInt(e.target.value) || 0 })}
                      style={{ padding: '6px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Size Tag Config */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Size Tag Layer (Top Left)</span>
                <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                  <input 
                    type="checkbox" 
                    checked={activePanel.sizeTagConfig?.enabled ?? true}
                    onChange={(e) => updateTextConfig('sizeTag', { enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>

              {(activePanel.sizeTagConfig?.enabled ?? true) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Text (use {'{size}'} for automatic):</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={activePanel.sizeTagConfig?.text ?? '{size}'}
                        onChange={(e) => updateTextConfig('sizeTag', { text: e.target.value })}
                        style={{ padding: '6px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Horizontal Spacing (Letter Spacing):</span>
                      <span>{activePanel.sizeTagConfig?.letterSpacing || 0} in</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.02" 
                      value={activePanel.sizeTagConfig?.letterSpacing || 0}
                      onChange={(e) => updateTextConfig('sizeTag', { letterSpacing: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Font Size (pt):</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={activePanel.sizeTagConfig?.fontSize ?? 34}
                        onChange={(e) => updateTextConfig('sizeTag', { fontSize: parseInt(e.target.value) || 1 })}
                        style={{ padding: '6px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Font Style:</label>
                      <select 
                        className="form-select" 
                        value={activePanel.sizeTagConfig?.fontFamily ?? 'Impact'}
                        onChange={(e) => updateTextConfig('sizeTag', { fontFamily: e.target.value })}
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
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Text Effect:</label>
                      <select 
                        className="form-select" 
                        value={activePanel.sizeTagConfig?.effect ?? 'none'}
                        onChange={(e) => updateTextConfig('sizeTag', { effect: e.target.value as any })}
                        style={{ padding: '6px' }}
                      >
                        <option value="none">Flat (Normal)</option>
                        <option value="shadow">Drop Shadow</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Alignment:</label>
                      <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ flex: 1, padding: '6px 0', border: 'none', background: (activePanel.sizeTagConfig?.align === 'left' || !activePanel.sizeTagConfig?.align) ? 'var(--color-primary)' : 'transparent', color: (activePanel.sizeTagConfig?.align === 'left' || !activePanel.sizeTagConfig?.align) ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                          onClick={() => updateTextConfig('sizeTag', { align: 'left' })}
                          title="Align Left"
                        >
                          <AlignLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ flex: 1, padding: '6px 0', border: 'none', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', background: activePanel.sizeTagConfig?.align === 'center' ? 'var(--color-primary)' : 'transparent', color: activePanel.sizeTagConfig?.align === 'center' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                          onClick={() => updateTextConfig('sizeTag', { align: 'center' })}
                          title="Align Center"
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ flex: 1, padding: '6px 0', border: 'none', background: activePanel.sizeTagConfig?.align === 'right' ? 'var(--color-primary)' : 'transparent', color: activePanel.sizeTagConfig?.align === 'right' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                          onClick={() => updateTextConfig('sizeTag', { align: 'right' })}
                          title="Align Right"
                        >
                          <AlignRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Fill Color:</label>
                      <input 
                        type="color" 
                        value={activePanel.sizeTagConfig?.color ?? '#ff1744'}
                        onChange={(e) => updateTextConfig('sizeTag', { color: e.target.value })}
                        style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Stroke Color:</label>
                      <input 
                        type="color" 
                        value={activePanel.sizeTagConfig?.strokeColor ?? '#000000'}
                        onChange={(e) => updateTextConfig('sizeTag', { strokeColor: e.target.value })}
                        style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Stroke (px):</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="15" 
                        className="form-input" 
                        value={activePanel.sizeTagConfig?.strokeWidth ?? 0}
                        onChange={(e) => updateTextConfig('sizeTag', { strokeWidth: parseInt(e.target.value) || 0 })}
                        style={{ padding: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>




        {/* Chest & Torso Logos Card (shown when activeTab === 'front') */}
        {activeTab === 'front' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', color: 'var(--color-success)', marginBottom: collapsed.logos ? 0 : '16px' }}
              onClick={() => toggleCollapse('logos')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🛡️</span> Chest & Torso Logos
              </span>
              {collapsed.logos ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </h3>

            {!collapsed.logos && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Left Chest Logo */}
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Left Chest Logo</span>
                    <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={activePanel.leftChestLogo?.enabled ?? false}
                        onChange={(e) => updateLogoConfig('leftChest', { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  {(activePanel.leftChestLogo?.enabled ?? false) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Logo Image:</label>
                        {activePanel.leftChestLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            <img src={activePanel.leftChestLogo.uploadedUrl} style={{ height: '30px', objectFit: 'contain', borderRadius: '4px' }} />
                            <button 
                              type="button" 
                              className="btn" 
                              style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                              onClick={() => updateLogoConfig('leftChest', { uploadedUrl: null })}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="left-chest-logo-file"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const dataUrl = event.target?.result as string;
                                    const img = new Image();
                                    img.onload = () => {
                                      const targetW = parseFloat((img.naturalWidth / 300).toFixed(2));
                                      const targetH = parseFloat((img.naturalHeight / 300).toFixed(2));
                                      updateLogoConfig('leftChest', { 
                                        uploadedUrl: dataUrl,
                                        width: targetW,
                                        height: targetH
                                      });
                                    };
                                    img.src = dataUrl;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor="left-chest-logo-file" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px', fontSize: '12px' }}>
                              <Upload size={14} /> Upload Left Logo
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Width (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.leftChestLogo?.width ?? 3.5}
                            onChange={(e) => updateLogoConfig('leftChest', { width: parseFloat(e.target.value) || 1.0 })}
                            style={{ padding: '6px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Height (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.leftChestLogo?.height ?? 3.5}
                            onChange={(e) => updateLogoConfig('leftChest', { height: parseFloat(e.target.value) || 1.0 })}
                            style={{ padding: '6px' }}
                          />
                        </div>
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

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Horizontal Pos (X) (in):</span>
                          <span>{activePanel.leftChestLogo?.xPos ?? 13.5} in</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={physicalWidth}
                          step="0.1"
                          value={activePanel.leftChestLogo?.xPos ?? 13.5}
                          onChange={(e) => updateLogoConfig('leftChest', { xPos: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Vertical Pos (Y) (in):</span>
                          <span>{activePanel.leftChestLogo?.yPos ?? 7.5} in</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={physicalHeight}
                          step="0.1"
                          value={activePanel.leftChestLogo?.yPos ?? 7.5}
                          onChange={(e) => updateLogoConfig('leftChest', { yPos: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Chest Logo */}
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Right Chest Logo</span>
                    <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={activePanel.rightChestLogo?.enabled ?? false}
                        onChange={(e) => updateLogoConfig('rightChest', { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  {(activePanel.rightChestLogo?.enabled ?? false) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Logo Image:</label>
                        {activePanel.rightChestLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            <img src={activePanel.rightChestLogo.uploadedUrl} style={{ height: '30px', objectFit: 'contain', borderRadius: '4px' }} />
                            <button 
                              type="button" 
                              className="btn" 
                              style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                              onClick={() => updateLogoConfig('rightChest', { uploadedUrl: null })}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="right-chest-logo-file"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const dataUrl = event.target?.result as string;
                                    const img = new Image();
                                    img.onload = () => {
                                      const targetW = parseFloat((img.naturalWidth / 300).toFixed(2));
                                      const targetH = parseFloat((img.naturalHeight / 300).toFixed(2));
                                      updateLogoConfig('rightChest', { 
                                        uploadedUrl: dataUrl,
                                        width: targetW,
                                        height: targetH
                                      });
                                    };
                                    img.src = dataUrl;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor="right-chest-logo-file" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px', fontSize: '12px' }}>
                              <Upload size={14} /> Upload Right Logo
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Width (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.rightChestLogo?.width ?? 3.5}
                            onChange={(e) => updateLogoConfig('rightChest', { width: parseFloat(e.target.value) || 1.0 })}
                            style={{ padding: '6px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Height (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.rightChestLogo?.height ?? 3.5}
                            onChange={(e) => updateLogoConfig('rightChest', { height: parseFloat(e.target.value) || 1.0 })}
                            style={{ padding: '6px' }}
                          />
                        </div>
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

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Horizontal Pos (X) (in):</span>
                          <span>{activePanel.rightChestLogo?.xPos ?? 8.5} in</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={physicalWidth}
                          step="0.1"
                          value={activePanel.rightChestLogo?.xPos ?? 8.5}
                          onChange={(e) => updateLogoConfig('rightChest', { xPos: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Vertical Pos (Y) (in):</span>
                          <span>{activePanel.rightChestLogo?.yPos ?? 7.5} in</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={physicalHeight}
                          step="0.1"
                          value={activePanel.rightChestLogo?.yPos ?? 7.5}
                          onChange={(e) => updateLogoConfig('rightChest', { yPos: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Torso Logo */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Torso Logo / Text</span>
                    <label className="checkbox-card" style={{ padding: '4px 8px', margin: 0, fontSize: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={activePanel.torsoLogo?.enabled ?? false}
                        onChange={(e) => updateLogoConfig('torso', { enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  {(activePanel.torsoLogo?.enabled ?? false) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Logo Text (Optional):</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={activePanel.torsoLogo?.text ?? ''}
                          onChange={(e) => updateLogoConfig('torso', { text: e.target.value })}
                          placeholder="Enter torso text..."
                          style={{ padding: '6px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontSize: '11px' }}>Logo Image:</label>
                        {activePanel.torsoLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                            <img src={activePanel.torsoLogo.uploadedUrl} style={{ height: '30px', objectFit: 'contain', borderRadius: '4px' }} />
                            <button 
                              type="button" 
                              className="btn" 
                              style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(255,23,68,0.15)', border: 'none', color: '#ff1744', cursor: 'pointer' }}
                              onClick={() => updateLogoConfig('torso', { uploadedUrl: null })}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="torso-logo-file"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const dataUrl = event.target?.result as string;
                                    const img = new Image();
                                    img.onload = () => {
                                      const targetW = parseFloat((img.naturalWidth / 300).toFixed(2));
                                      const targetH = parseFloat((img.naturalHeight / 300).toFixed(2));
                                      updateLogoConfig('torso', { 
                                        uploadedUrl: dataUrl,
                                        width: targetW,
                                        height: targetH
                                      });
                                    };
                                    img.src = dataUrl;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor="torso-logo-file" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px', fontSize: '12px' }}>
                              <Upload size={14} /> Upload Torso Logo
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Width (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.torsoLogo?.width ?? 8.0}
                            onChange={(e) => updateLogoConfig('torso', { width: parseFloat(e.target.value) || 1.0 })}
                            style={{ padding: '6px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px' }}>Height (in):</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={activePanel.torsoLogo?.height ?? 5.0}
                            onChange={(e) => updateLogoConfig('torso', { height: parseFloat(e.target.value) || 1.0 })}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
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
            )}
          </div>
        )}

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
    </div>
  );
};

