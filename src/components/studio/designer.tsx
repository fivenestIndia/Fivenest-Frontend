import React, { useState, useEffect, useRef } from 'react';
import { Upload, Paintbrush, Layers, FolderArchive, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import type { OrderMetadata } from './orderEntry';

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
}

export interface ArtDesignConfig {
  front: PanelConfig;
  back: PanelConfig;
  sleeveLeft: PanelConfig;
  sleeveRight: PanelConfig;
  a4Print: PanelConfig;
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
    nameConfig: { enabled: true, yPos: 25, fontSize: 2.5, color: '#000000', strokeColor: '#ffffff', strokeWidth: 4, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 11, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.18 },
    numberConfig: { enabled: true, yPos: 47, fontSize: 9.0, color: '#000000', strokeColor: '#ffffff', strokeWidth: 5, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 8.5, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.2 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 30, color: '#000000', strokeColor: '#ffffff', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0.06 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
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
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.5], horizontal: [8.0] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  a4Print: {
    backgroundType: 'generate',
    generatedStyle: 'neon-gradient',
    generatedColor1: '#9b4dff',
    generatedColor2: '#ff8c00',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 20, fontSize: 1.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: true, yPos: 55, fontSize: 6.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 4, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 8, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [5.0], horizontal: [5.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  }
};

export const Designer: React.FC<DesignerProps> = ({ designConfig, onDesignConfigChange, metadata }) => {
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print'>('back');
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

  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    zip: true,
    presets: true,
    background: true,
    overlays: true,
    logos: true,
    guidelines: true,
    fonts: true,
  });

  const logoImagesRef = useRef<Record<string, HTMLImageElement>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Pre-load and cache chest/torso logos for real-time canvas rendering
  useEffect(() => {
    const panel = designConfig[activeTab];
    const urls = {
      leftChest: panel.leftChestLogo?.uploadedUrl,
      rightChest: panel.rightChestLogo?.uploadedUrl,
      torso: panel.torsoLogo?.uploadedUrl
    };

    Object.entries(urls).forEach(([key, url]) => {
      if (url) {
        if (logoImagesRef.current[url]) return; // Already cached
        const img = new Image();
        img.onload = () => {
          logoImagesRef.current[url] = img;
          setPrefTrigger(prev => prev + 1); // Trigger canvas redrawing
        };
        img.src = url;
      }
    });
  }, [designConfig, activeTab]);

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
      if (e.key.toLowerCase() === 'z') {
        setZKeyPressed(true);
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
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
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

  const activePanel = designConfig[activeTab];

  // Helper to trigger parent update
  const updateActivePanel = (updatedFields: Partial<PanelConfig>) => {
    const updated = {
      ...designConfig,
      [activeTab]: {
        ...activePanel,
        ...updatedFields
      }
    };
    onDesignConfigChange(updated);
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

  // Draw preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * zoom;
    canvas.height = height * zoom;
    ctx.scale(zoom, zoom);

    const drawTechnicalMarks = (ctx: CanvasRenderingContext2D) => {
      const centerMarks = JSON.parse(localStorage.getItem('fivenest_pref_center_marks') || 'false');
      const sizeWatermarks = JSON.parse(localStorage.getItem('fivenest_pref_size_watermarks') || 'false');

      if (centerMarks && activeTab !== 'a4Print') {
        ctx.save();
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = 'transparent';

        const wPx = Math.round(0.1 * scale);
        const hPx = Math.round(0.2 * scale);

        // Use Math.round to match guideline centering exactly
        const leftEdgeXPx = Math.round(width / 2 - wPx / 2);

        // Top center solid patch
        ctx.fillRect(leftEdgeXPx, 0, wPx, hPx);

        // Bottom center solid patch
        ctx.fillRect(leftEdgeXPx, height - hPx, wPx, hPx);
        ctx.restore();
      }

      if (sizeWatermarks && activeTab !== 'a4Print') {
        ctx.save();
        ctx.fillStyle = '#ff1744';
        const fontSizePx = Math.round((14 / 72) * scale); // 14 pt
        ctx.font = `bold ${fontSizePx}px system-ui`;
        ctx.shadowColor = 'transparent';

        const offset = Math.round(0.04 * scale);

        // 2. Sleeve Style on top-right of Back panel only
        if (activeTab === 'back') {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          const isRaglan = metadata?.raglanStyle ?? false;
          const typeStr = previewSleeveType === 'full'
            ? (isRaglan ? 'RAGLAN FULL' : 'FULL')
            : (isRaglan ? 'RAGLAN HALF' : 'HALF');
          ctx.fillText(typeStr, width - offset, offset);
        }
        ctx.restore();
      }
    };

    const drawTexts = (ctx: CanvasRenderingContext2D) => {
      const drawSingleText = (text: string, conf: TextConfig, textX: number, textY: number, maxLimitPx: number) => {
        ctx.save();
        const fontSizePx = Math.round((conf.fontSize / 30) * height);
        ctx.font = `bold ${fontSizePx}px "${conf.fontFamily}"`;
        
        const align = conf.align || 'center';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = conf.color;
        ctx.strokeStyle = conf.strokeColor;
        ctx.lineWidth = conf.strokeWidth;

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
              ctx.strokeText(char, 0, -radius);
            }
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
            ctx.strokeText(displayName, 0, 0);
          }
          ctx.fillText(displayName, 0, 0);
        }
        ctx.restore();
      };

      const hideOverlays = metadata?.blankKit ?? false;
      if (!hideOverlays && activePanel.nameConfig.enabled) {
        drawSingleText(previewName, activePanel.nameConfig, width / 2, (activePanel.nameConfig.yPos / 100) * height, (activePanel.nameConfig.maxW / 20) * width);
      }
      if (!hideOverlays && activePanel.numberConfig.enabled) {
        drawSingleText(previewNumber, activePanel.numberConfig, width / 2, (activePanel.numberConfig.yPos / 100) * height, (activePanel.numberConfig.maxW / 20) * width);
      }

      // Draw customizable Size Tag (Top Left) - skip for A4
      const sizeTagConf = activePanel.sizeTagConfig || { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'Impact', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left' };
      if (sizeTagConf.enabled && activeTab !== 'a4Print') {
        ctx.save();
        const fontSizePx = Math.round((sizeTagConf.fontSize / 72) * scale);
        ctx.font = `bold ${fontSizePx}px "${sizeTagConf.fontFamily}"`;
        
        const align = sizeTagConf.align || 'left';
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillStyle = sizeTagConf.color;
        ctx.strokeStyle = sizeTagConf.strokeColor;
        ctx.lineWidth = sizeTagConf.strokeWidth;

        const offsetPx = Math.round(0.15 * scale);
        
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
          spacingPx = Math.round(sizeTagConf.letterSpacing * scale);
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

        if (sizeTagConf.strokeWidth > 0) {
          ctx.strokeText(displayText, adjustedX, offsetPx);
        }
        ctx.fillText(displayText, adjustedX, offsetPx);
        ctx.restore();
      }
    };

    const drawRulersAndGrid = (ctx: CanvasRenderingContext2D) => {
      const rulersEnabled = JSON.parse(localStorage.getItem('fivenest_pref_rulers') || 'true');
      if (!rulersEnabled) return;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      
      const physicalW = width / scale;
      const physicalH = physicalHeight;

      ctx.font = `${Math.max(8, Math.round(0.12 * scale))}px system-ui`;
      ctx.shadowColor = 'transparent';

      // Guidelines customizable spacing
      const gridSpacing = JSON.parse(localStorage.getItem('fivenest_pref_guideline_spacing') || '2');
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([Math.round(0.05 * scale), Math.round(0.05 * scale)]);
      for (let x = gridSpacing; x < physicalW; x += gridSpacing) {
        const xPx = Math.round(x * scale);
        ctx.beginPath();
        ctx.moveTo(xPx, 0);
        ctx.lineTo(xPx, height);
        ctx.stroke();
      }
      for (let y = gridSpacing; y < physicalH; y += gridSpacing) {
        const yPx = Math.round(y * scale);
        ctx.beginPath();
        ctx.moveTo(0, yPx);
        ctx.lineTo(width, yPx);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset dashed lines

      // Ruler size: 0.35 inches
      const rulerHeightPx = Math.round(0.35 * scale);
      
      // Background bar
      ctx.fillStyle = 'rgba(15, 15, 22, 0.9)';
      ctx.fillRect(0, 0, width, rulerHeightPx);
      ctx.fillRect(0, 0, rulerHeightPx, height);

      // Borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, rulerHeightPx);
      ctx.lineTo(width, rulerHeightPx);
      ctx.moveTo(rulerHeightPx, 0);
      ctx.lineTo(rulerHeightPx, height);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';

      // Top ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let x = 0; x <= physicalW; x += 0.5) {
        const xPx = Math.round(x * scale);
        if (xPx < rulerHeightPx) continue;
        const isWhole = x % 1 === 0;
        const tickLen = isWhole ? Math.round(0.08 * scale) : Math.round(0.04 * scale);
        ctx.beginPath();
        ctx.moveTo(xPx, rulerHeightPx - tickLen);
        ctx.lineTo(xPx, rulerHeightPx);
        ctx.stroke();

        if (isWhole && x > 0) {
          ctx.fillText(x.toString(), xPx, 2);
        }
      }

      // Left ticks
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let y = 0; y <= physicalH; y += 0.5) {
        const yPx = Math.round(y * scale);
        if (yPx < rulerHeightPx) continue;
        const isWhole = y % 1 === 0;
        const tickLen = isWhole ? Math.round(0.08 * scale) : Math.round(0.04 * scale);
        ctx.beginPath();
        ctx.moveTo(rulerHeightPx - tickLen, yPx);
        ctx.lineTo(rulerHeightPx, yPx);
        ctx.stroke();

        if (isWhole && y > 0) {
          ctx.fillText(y.toString(), 2, yPx);
        }
      }

      // Draw custom guidelines
      if (showGuidelines) {
        const customGuides = activePanel.guidelines || { vertical: [], horizontal: [] };
        ctx.save();
        ctx.strokeStyle = '#00f0ff'; // Cyan guideline color
        ctx.lineWidth = 0.5; // Decreased thickness
        ctx.setLineDash([4, 4]);

        ctx.fillStyle = '#00f0ff';
        ctx.font = `bold ${Math.max(9, Math.round(0.12 * scale))}px system-ui`;
        
        // 1. Vertical Guides (constant X position)
        (customGuides.vertical || []).forEach(xVal => {
          // Snap vertical center guidelines to exact center pixel
          const xPx = Math.abs(xVal - physicalWidth / 2) < 0.01 ? Math.round(width / 2) : Math.round(xVal * scale);
          if (xPx >= rulerHeightPx && xPx < width) {
            ctx.beginPath();
            ctx.moveTo(xPx, rulerHeightPx);
            ctx.lineTo(xPx, height);
            ctx.stroke();

            // Draw a label tag on top ruler
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.fillRect(xPx - 16, 2, 32, rulerHeightPx - 4);
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${xVal.toFixed(1)}`, xPx, 4);
            ctx.restore();
          }
        });

        // 2. Horizontal Guides (constant Y position)
        (customGuides.horizontal || []).forEach(yVal => {
          // Snap horizontal center guidelines to exact center pixel
          const yPx = Math.abs(yVal - physicalHeight / 2) < 0.01 ? Math.round(height / 2) : Math.round(yVal * scale);
          if (yPx >= rulerHeightPx && yPx < height) {
            ctx.beginPath();
            ctx.moveTo(rulerHeightPx, yPx);
            ctx.lineTo(width, yPx);
            ctx.stroke();

            // Draw a label tag on left ruler
            ctx.save();
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.fillRect(2, yPx - 7, rulerHeightPx - 4, 14);
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${yVal.toFixed(1)}`, 4, yPx);
            ctx.restore();
          }
        });
        ctx.restore();
      }

      ctx.restore();
    };

    // Draw customizable logos (Left Chest, Right Chest, Torso)
    const drawLogos = (ctx: CanvasRenderingContext2D) => {
      const hideOverlays = metadata?.blankKit ?? false;
      if (hideOverlays) return;

      const panel = activePanel;
      
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
        if (!cachedImg) return; // Not loaded yet

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

    // 1. Draw Background
    let bgUrl = activePanel.uploadedFileUrl;
    if (activeTab.startsWith('sleeve')) {
      bgUrl = previewSleeveType === 'full' 
        ? (activePanel.uploadedFileFullUrl || activePanel.uploadedFileUrl) 
        : (activePanel.uploadedFileHalfUrl || activePanel.uploadedFileUrl);
    }

    if (activePanel.backgroundType === 'upload' && bgUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawLogos(ctx);
        drawTexts(ctx);
        drawTechnicalMarks(ctx);
        drawRulersAndGrid(ctx);
      };
      img.onerror = () => {
        ctx.fillStyle = '#1c1c24';
        ctx.fillRect(0, 0, width, height);
        drawLogos(ctx);
        drawTexts(ctx);
        drawTechnicalMarks(ctx);
        drawRulersAndGrid(ctx);
      };
      img.src = bgUrl;
    } else {
      // Generated Backgrounds
      const c1 = activePanel.generatedColor1;
      const c2 = activePanel.generatedColor2;
      
      if (activePanel.generatedStyle === 'neon-gradient') {
        const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width*0.8);
        gradient.addColorStop(0, c1);
        gradient.addColorStop(1, c2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (activePanel.generatedStyle === 'classic-stripes') {
        ctx.fillStyle = c2;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = c1;
        // Draw diagonal stripes
        ctx.beginPath();
        for (let i = -100; i < width + height; i += 60) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 30, 0);
          ctx.lineTo(i - 100 + 30, height);
          ctx.lineTo(i - 100, height);
        }
        ctx.fill();
      } else if (activePanel.generatedStyle === 'camo-glow') {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        // Custom spotty glow
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
        // Blank
        ctx.fillStyle = '#1c1c24';
        ctx.fillRect(0, 0, width, height);
      }
      
      // Draw gridlines to represent a jersey mock border
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      
      drawLogos(ctx);
      drawTexts(ctx);
      drawTechnicalMarks(ctx);
      drawRulersAndGrid(ctx);
    }
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

  return (
    <div className="artwork-layout-designer fade-in">
      {/* 2D Canvas Mock Renderer */}
      <div 
        className="canvas-container" 
        style={{ 
          flexDirection: 'column', 
          gap: '16px',
          position: 'relative',
          border: isDragging ? '2px dashed var(--color-primary)' : '1px solid var(--border-light)',
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

        <div className="tab-btn-group" style={{ width: '100%', maxWidth: '580px' }}>
          <button className={`tab-btn ${activeTab === 'front' ? 'active' : ''}`} onClick={() => setActiveTab('front')}>Front</button>
          <button className={`tab-btn ${activeTab === 'back' ? 'active' : ''}`} onClick={() => setActiveTab('back')}>Back</button>
          <button className={`tab-btn ${activeTab === 'sleeveLeft' ? 'active' : ''}`} onClick={() => setActiveTab('sleeveLeft')}>Left Sleeve</button>
          <button className={`tab-btn ${activeTab === 'sleeveRight' ? 'active' : ''}`} onClick={() => setActiveTab('sleeveRight')}>Right Sleeve</button>
          <button className={`tab-btn ${activeTab === 'a4Print' ? 'active' : ''}`} onClick={() => setActiveTab('a4Print')}>A4 Print</button>
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
            overflow: 'auto', 
            display: 'block', 
            minHeight: 0,
            padding: '8px 0',
            cursor: spaceKeyPressed ? (panStart ? 'grabbing' : 'grab') : (zKeyPressed ? (dragStart ? 'grabbing' : 'zoom-in') : 'default'),
            userSelect: (spaceKeyPressed || zKeyPressed) ? 'none' : 'auto',
            position: 'relative'
          }}
          onWheel={(e) => {
            e.preventDefault();
            const sensitivity = 0.0015;
            const newZoom = Math.min(3, Math.max(0.5, zoom - e.deltaY * sensitivity));
            setZoom(newZoom);
          }}
          onMouseDown={(e) => {
            if (spaceKeyPressed && e.button === 0) {
              e.preventDefault();
              if (scrollWrapperRef.current) {
                setPanStart({
                  scrollLeft: scrollWrapperRef.current.scrollLeft,
                  scrollTop: scrollWrapperRef.current.scrollTop,
                  x: e.clientX,
                  y: e.clientY
                });
              }
            } else if (zKeyPressed && e.button === 0) {
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
          {/* Centering inner container that expands dynamically when zoomed */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '100%',
            minHeight: '100%',
            width: zoom === 1 ? '100%' : `${width * zoom + 160}px`,
            height: zoom === 1 ? '100%' : `${height * zoom + 160}px`,
            boxSizing: 'border-box',
            padding: zoom === 1 ? '0' : '80px'
          }}>
            <canvas 
              ref={canvasRef} 
              style={{ 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                cursor: (spaceKeyPressed || zKeyPressed) ? 'inherit' : 'pointer',
                width: zoom === 1 ? undefined : `${width * zoom}px`,
                height: zoom === 1 ? undefined : `${height * zoom}px`,
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? 'calc(100% - 10px)' : 'none',
                objectFit: 'contain',
                flexShrink: 0
              }} 
            />
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

      {/* Editor Panel Controls */}
      <div className="controls-panel">
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
                type="file" 
                accept=".zip" 
                id="zip-importer-input" 
                style={{ display: 'none' }} 
                onChange={handleZipImport} 
              />
              <label htmlFor="zip-importer-input" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '8px' }}>
                <Upload size={14} /> Import ZIP File
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
                        min="5" 
                        max="95" 
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

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Fill Color:</label>
                    <input 
                      type="color" 
                      value={activePanel.nameConfig.color}
                      onChange={(e) => updateTextConfig('name', { color: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                    />
                  </div>
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
                    min="5" 
                    max="95" 
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

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>Fill Color:</label>
                    <input 
                      type="color" 
                      value={activePanel.numberConfig.color}
                      onChange={(e) => updateTextConfig('number', { color: e.target.value })}
                      style={{ border: 'none', background: 'none', width: '100%', height: '28px', cursor: 'pointer' }}
                    />
                  </div>
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
  );
};

