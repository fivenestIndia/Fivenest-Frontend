import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Palette, Sparkles, Check, ArrowRightLeft, 
  RotateCcw, Sliders, CheckCheck, Shirt, Layers, 
  GripHorizontal, Trash2, Plus
} from 'lucide-react';
import type { ArtDesignConfig, PanelConfig, TrimPartConfig, GradientStopItem } from './designer';

interface ArtboardFillModalProps {
  isOpen: boolean;
  panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print';
  designConfig: ArtDesignConfig;
  onUpdatePanel: (panelKey: string, updates: Partial<PanelConfig>) => void;
  onApplyAllPanels: (updates: Partial<PanelConfig>) => void;
  onUpdateSleeveStripe: (updates: Partial<TrimPartConfig>) => void;
  onClose: () => void;
}

// Curated Athletic Jersey Solid Colors
export const SOLID_COLOR_PALETTE = [
  // Neutrals / Core
  { name: 'Pure White', hex: '#FFFFFF', dark: false },
  { name: 'Ice White', hex: '#F3F4F6', dark: false },
  { name: 'Pitch Black', hex: '#0B0D11', dark: true },
  { name: 'Rich Charcoal', hex: '#1F242D', dark: true },
  { name: 'Slate Gray', hex: '#4B5563', dark: true },
  { name: 'Silver Mist', hex: '#9CA3AF', dark: false },

  // Blues & Navies (Cricket / Football classics)
  { name: 'Deep Navy', hex: '#0A192F', dark: true },
  { name: 'Midnight Blue', hex: '#162A45', dark: true },
  { name: 'India Bleed Blue', hex: '#0047AB', dark: true },
  { name: 'Royal Blue', hex: '#1D4ED8', dark: true },
  { name: 'Electric Cobalt', hex: '#2563EB', dark: true },
  { name: 'Cyan Sky', hex: '#0EA5E9', dark: false },
  { name: 'Teal Frost', hex: '#0D9488', dark: true },

  // Reds, Oranges & Yellows
  { name: 'Crimson Red', hex: '#DC2626', dark: true },
  { name: 'Ruby Scarlet', hex: '#E11D48', dark: true },
  { name: 'Deep Maroon', hex: '#631023', dark: true },
  { name: 'Flame Orange', hex: '#EA580C', dark: true },
  { name: 'Neon Coral', hex: '#F97316', dark: false },
  { name: 'Golden Champion', hex: '#EAB308', dark: false },
  { name: 'Athletic Gold', hex: '#F59E0B', dark: false },

  // Greens & Neons
  { name: 'Cyber Volt', hex: '#84CC16', dark: false },
  { name: 'Emerald Green', hex: '#059669', dark: true },
  { name: 'Kelly Green', hex: '#16A34A', dark: true },
  { name: 'Dark Forest', hex: '#064E3B', dark: true },

  // Purples & Pinks
  { name: 'Regal Purple', hex: '#7C3AED', dark: true },
  { name: 'Deep Violet', hex: '#4C1D95', dark: true },
  { name: 'Neon Magenta', hex: '#D946EF', dark: false },
  { name: 'Hot Pink', hex: '#EC4899', dark: false }
];

// Photoshop & Athletic Multi-Stop Gradient Presets
export const PHOTOSHOP_GRADIENT_PRESETS: Array<{
  name: string;
  stops: Array<{ color: string; offset: number }>;
  style: 'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial';
}> = [
  {
    name: 'Sunset Blaze',
    style: 'gradient-linear-tb',
    stops: [
      { color: '#FF416C', offset: 0 },
      { color: '#FF4B2B', offset: 50 },
      { color: '#FFA07A', offset: 100 }
    ]
  },
  {
    name: 'Metallic Gold',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#BF953F', offset: 0 },
      { color: '#FCF6BA', offset: 25 },
      { color: '#B38728', offset: 50 },
      { color: '#FBF5B7', offset: 75 },
      { color: '#AA771C', offset: 100 }
    ]
  },
  {
    name: 'Silver Chrome',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#E0E0E0', offset: 0 },
      { color: '#F5F5F5', offset: 35 },
      { color: '#9E9E9E', offset: 70 },
      { color: '#757575', offset: 100 }
    ]
  },
  {
    name: 'India Bleed Blue',
    style: 'gradient-linear-tb',
    stops: [
      { color: '#0A192F', offset: 0 },
      { color: '#0047AB', offset: 50 },
      { color: '#1E90FF', offset: 100 }
    ]
  },
  {
    name: 'Cyber Volt',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#0B0D11', offset: 0 },
      { color: '#16A34A', offset: 55 },
      { color: '#84CC16', offset: 100 }
    ]
  },
  {
    name: 'Copper Bronze',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#804A00', offset: 0 },
      { color: '#F7BA70', offset: 30 },
      { color: '#A06000', offset: 60 },
      { color: '#603000', offset: 100 }
    ]
  },
  {
    name: 'Electric Cyan',
    style: 'gradient-linear-tb',
    stops: [
      { color: '#0052D4', offset: 0 },
      { color: '#4364F7', offset: 60 },
      { color: '#6FB1FC', offset: 100 }
    ]
  },
  {
    name: 'Deep Ocean',
    style: 'gradient-linear-tb',
    stops: [
      { color: '#000428', offset: 0 },
      { color: '#004E92', offset: 65 },
      { color: '#00C9FF', offset: 100 }
    ]
  },
  {
    name: 'Crimson Shadow',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#4A0012', offset: 0 },
      { color: '#DC2626', offset: 50 },
      { color: '#FFA07A', offset: 100 }
    ]
  },
  {
    name: 'Viper Strike',
    style: 'gradient-linear-tb',
    stops: [
      { color: '#111827', offset: 0 },
      { color: '#064E3B', offset: 45 },
      { color: '#10B981', offset: 100 }
    ]
  },
  {
    name: 'Lakers Vibe',
    style: 'gradient-linear-diag',
    stops: [
      { color: '#552583', offset: 0 },
      { color: '#800080', offset: 40 },
      { color: '#FDB927', offset: 100 }
    ]
  },
  {
    name: 'Fire & Ice',
    style: 'gradient-linear-lr',
    stops: [
      { color: '#FA709A', offset: 0 },
      { color: '#FEE140', offset: 50 },
      { color: '#00C9FF', offset: 100 }
    ]
  }
];

export default function ArtboardFillModal({
  isOpen,
  panelKey,
  designConfig,
  onUpdatePanel,
  onApplyAllPanels,
  onUpdateSleeveStripe,
  onClose
}: ArtboardFillModalProps) {
  const panel = designConfig[panelKey] || designConfig.front;
  const isSleeve = panelKey === 'sleeveLeft' || panelKey === 'sleeveRight';

  const dragControls = useDragControls();
  const spectrumBarRef = useRef<HTMLDivElement>(null);

  // Active tab inside modal
  const [tab, setTab] = useState<'solid' | 'gradient' | 'sleeveStripe' | 'presets'>(() => {
    if (panel.generatedStyle && panel.generatedStyle.includes('gradient')) return 'gradient';
    return 'solid';
  });

  // Solid Color State
  const [solidColor, setSolidColor] = useState<string>(panel.generatedColor1 || '#FFFFFF');

  // Multi-stop Photoshop Gradient State
  const [stops, setStops] = useState<GradientStopItem[]>(() => {
    if (panel.gradientStops && panel.gradientStops.length >= 2) {
      return [...panel.gradientStops].sort((a, b) => a.offset - b.offset);
    }
    const c1 = panel.generatedColor1 || '#FF416C';
    const c2 = panel.generatedColor2 || '#FF4B2B';
    return [
      { id: 'stop-0', color: c1, offset: 0 },
      { id: 'stop-1', color: c2, offset: 100 }
    ];
  });

  const [selectedStopId, setSelectedStopId] = useState<string>(() => stops[0]?.id || 'stop-0');
  const [gradientStyle, setGradientStyle] = useState<
    'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial'
  >(() => {
    const s = panel.generatedStyle;
    if (s === 'gradient-linear-lr' || s === 'gradient-linear-diag' || s === 'gradient-radial') {
      return s;
    }
    return 'gradient-linear-tb';
  });

  // Custom User Saved Presets (from localStorage)
  const [customPresets, setCustomPresets] = useState<
    Array<{ name: string; stops: Array<{ color: string; offset: number }>; style: any }>
  >([]);
  const [isSavingPreset, setIsSavingPreset] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');

  // Sleeve Stripe Config: DEFAULT IS FALSE (OFF)
  const stripe = designConfig.trim?.sleeveStripe;
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(Boolean(stripe?.enabled));
  const [stripeColor, setStripeColor] = useState<string>(stripe?.color || '#171717');

  // Sync state when panel changes or modal reopens
  useEffect(() => {
    if (isOpen) {
      setSolidColor(panel.generatedColor1 || '#FFFFFF');
      if (panel.gradientStops && panel.gradientStops.length >= 2) {
        const sorted = [...panel.gradientStops].sort((a, b) => a.offset - b.offset);
        setStops(sorted);
        setSelectedStopId(sorted[0].id || 'stop-0');
      } else {
        const c1 = panel.generatedColor1 || '#FF416C';
        const c2 = panel.generatedColor2 || '#FF4B2B';
        const initial = [
          { id: 'stop-0', color: c1, offset: 0 },
          { id: 'stop-1', color: c2, offset: 100 }
        ];
        setStops(initial);
        setSelectedStopId('stop-0');
      }

      if (panel.generatedStyle && panel.generatedStyle.includes('gradient')) {
        const s = panel.generatedStyle as any;
        if (['gradient-linear-tb', 'gradient-linear-lr', 'gradient-linear-diag', 'gradient-radial'].includes(s)) {
          setGradientStyle(s);
        }
      }

      const strp = designConfig.trim?.sleeveStripe;
      setStripeEnabled(Boolean(strp?.enabled));
      if (strp?.color) setStripeColor(strp.color);
    }
  }, [isOpen, panelKey]);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fivenest_photoshop_gradient_presets');
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom presets', e);
    }
  }, []);

  if (!isOpen) return null;

  const panelNames: Record<string, string> = {
    front: '👕 Front Panel',
    back: '👕 Back Panel',
    sleeveLeft: '🧤 Left Sleeve',
    sleeveRight: '🧤 Right Sleeve',
    a4Print: '📄 A4 Back Print'
  };

  // Selected stop object
  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0] || {
    id: 'stop-0',
    color: '#FF416C',
    offset: 0
  };

  // Sorted stops for CSS strings
  const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
  const cssStopsString = sortedStops.map((s) => `${s.color} ${s.offset}%`).join(', ');

  // Compute live CSS background for preview
  const previewBackground =
    tab === 'solid'
      ? solidColor
      : gradientStyle === 'gradient-linear-tb'
      ? `linear-gradient(to bottom, ${cssStopsString})`
      : gradientStyle === 'gradient-linear-lr'
      ? `linear-gradient(to right, ${cssStopsString})`
      : gradientStyle === 'gradient-linear-diag'
      ? `linear-gradient(135deg, ${cssStopsString})`
      : `radial-gradient(circle at 50% 50%, ${cssStopsString})`;

  // Apply Solid Color
  const handleApplySolid = (color: string) => {
    setSolidColor(color);
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: 'solid',
      generatedColor1: color,
      generatedColor2: color
    });
  };

  // Apply Gradient updates
  const applyGradientChange = (
    currentStops: GradientStopItem[],
    currentStyle: 'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial' = gradientStyle
  ) => {
    const sorted = [...currentStops].sort((a, b) => a.offset - b.offset);
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: currentStyle as any,
      generatedColor1: sorted[0]?.color || '#FFFFFF',
      generatedColor2: sorted[sorted.length - 1]?.color || '#000000',
      gradientStops: sorted
    });
  };

  // Click on spectrum bar to add a new Photoshop-style stop pin
  const handleSpectrumBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spectrumBarRef.current) return;
    const rect = spectrumBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const offset = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));

    const newStop: GradientStopItem = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      color: selectedStop?.color || '#F97316',
      offset
    };

    const nextStops = [...stops, newStop].sort((a, b) => a.offset - b.offset);
    setStops(nextStops);
    setSelectedStopId(newStop.id!);
    applyGradientChange(nextStops, gradientStyle);
  };

  // Dragging a Stop Pin along the spectrum track
  const handleStopPointerDown = (e: React.PointerEvent, stopId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStopId(stopId);

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!spectrumBarRef.current) return;
      const rect = spectrumBarRef.current.getBoundingClientRect();
      const currentX = moveEvt.clientX - rect.left;
      const newOffset = Math.max(0, Math.min(100, Math.round((currentX / rect.width) * 100)));

      setStops((prev) => {
        const updated = prev.map((s) => (s.id === stopId ? { ...s, offset: newOffset } : s));
        applyGradientChange(updated, gradientStyle);
        return updated;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Change Color of the currently selected stop
  const handleSelectedStopColorChange = (newColor: string) => {
    const updated = stops.map((s) => (s.id === selectedStop.id ? { ...s, color: newColor } : s));
    setStops(updated);
    applyGradientChange(updated, gradientStyle);
  };

  // Change Offset Location (%) of the currently selected stop
  const handleSelectedStopOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newOffset)));
    const updated = stops.map((s) => (s.id === selectedStop.id ? { ...s, offset: clamped } : s));
    setStops(updated);
    applyGradientChange(updated, gradientStyle);
  };

  // Delete active stop (requires minimum 2 stops, Photoshop standard)
  const handleDeleteSelectedStop = () => {
    if (stops.length <= 2) return;
    const remaining = stops.filter((s) => s.id !== selectedStop.id);
    setStops(remaining);
    setSelectedStopId(remaining[0].id!);
    applyGradientChange(remaining, gradientStyle);
  };

  // Reverse / Invert Gradient stops
  const handleReverseGradient = () => {
    const reversed = stops
      .map((s) => ({ ...s, offset: 100 - s.offset }))
      .sort((a, b) => a.offset - b.offset);
    setStops(reversed);
    applyGradientChange(reversed, gradientStyle);
  };

  // Load a preset into the Photoshop editor
  const handleLoadPreset = (
    presetStops: Array<{ color: string; offset: number }>,
    style: any = 'gradient-linear-tb'
  ) => {
    const formatted: GradientStopItem[] = presetStops.map((s, idx) => ({
      id: `stop-${idx}-${Date.now()}`,
      color: s.color,
      offset: s.offset
    }));
    setStops(formatted);
    setSelectedStopId(formatted[0].id!);
    setGradientStyle(style);
    applyGradientChange(formatted, style);
  };

  // Save current gradient as a custom preset to localStorage
  const handleSaveCustomPreset = () => {
    const name = presetNameInput.trim() || `Gradient ${customPresets.length + 1}`;
    const newPreset = {
      name,
      stops: sortedStops.map((s) => ({ color: s.color, offset: s.offset })),
      style: gradientStyle
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('fivenest_photoshop_gradient_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setPresetNameInput('');
    setIsSavingPreset(false);
  };

  const handleDeleteCustomPreset = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((_, idx) => idx !== index);
    setCustomPresets(updated);
    try {
      localStorage.setItem('fivenest_photoshop_gradient_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Apply to All Panels
  const handleApplyAll = () => {
    if (tab === 'solid') {
      onApplyAllPanels({
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: solidColor,
        generatedColor2: solidColor
      });
    } else {
      onApplyAllPanels({
        backgroundType: 'generate',
        generatedStyle: gradientStyle as any,
        generatedColor1: sortedStops[0]?.color || '#FFFFFF',
        generatedColor2: sortedStops[sortedStops.length - 1]?.color || '#000000',
        gradientStops: sortedStops
      });
    }
  };

  // Reset to Plain White / Blank
  const handleResetBlank = () => {
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: 'solid',
      generatedColor1: '#FFFFFF',
      generatedColor2: '#FFFFFF'
    });
    setSolidColor('#FFFFFF');
  };

  // Sleeve Stripe Toggle (Default is OFF)
  const handleStripeToggle = (enabled: boolean) => {
    setStripeEnabled(enabled);
    onUpdateSleeveStripe({
      enabled,
      color: stripeColor,
      height: 2.3
    });
  };

  const handleStripeColorChange = (newColor: string) => {
    setStripeColor(newColor);
    onUpdateSleeveStripe({
      enabled: stripeEnabled,
      color: newColor,
      height: 2.3
    });
  };

  return (
    <AnimatePresence>
      {/* 
        NON-BLOCKING CONTAINER:
        pointer-events-none on outer backdrop so artwork behind remains 100% visible and interactive.
        NO dark blur/overlay! 
      */}
      <div className="fixed inset-0 z-50 pointer-events-none p-3 sm:p-4 md:p-6 flex items-start justify-end overflow-hidden">
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragConstraints={{ left: -1200, right: 100, top: -50, bottom: 650 }}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-auto bg-[#181B22]/95 backdrop-blur-2xl text-[#E2E8F0] border border-[#2E3544] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_20px_rgba(228,87,46,0.15)] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] select-none"
        >
          {/* DRAGGABLE HEADER BAR */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex items-center justify-between px-4 py-3 border-b border-[#2E3544] bg-[#14171E] cursor-grab active:cursor-grabbing select-none"
            style={{ touchAction: 'none' }}
            title="Click & Drag this header to move the window anywhere"
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 rounded-lg bg-orange-500/20 text-[#E4572E] border border-orange-500/30 flex items-center justify-center font-bold"
                title="Photoshop-Style Color & Gradient Studio"
              >
                <Palette size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  {panelNames[panelKey] || 'Artboard Fill'}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                    Moveable
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <GripHorizontal size={11} className="text-gray-500" />
                  Drag header to reposition • Artwork visible live behind
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close window"
            >
              <X size={16} />
            </button>
          </div>

          {/* LIVE GRADIENT / COLOR PREVIEW BAR */}
          <div className="px-4 pt-3 pb-1">
            <div
              className="h-9 rounded-xl border border-white/20 shadow-inner flex items-center justify-between px-3 text-xs font-semibold text-white/95 drop-shadow-sm transition-all"
              style={{ background: previewBackground }}
            >
              <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                {tab === 'solid'
                  ? solidColor.toUpperCase()
                  : `${sortedStops.length} STOPS • ${gradientStyle.replace('gradient-', '').replace('-', ' ').toUpperCase()}`}
              </span>
              <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-orange-300">
                LIVE PREVIEW
              </span>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex border-b border-[#2E3544] px-4 gap-1 pt-1.5 bg-[#14171E]/60">
            <button
              onClick={() => setTab('solid')}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'solid'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ background: solidColor }} />
              Solid Color
            </button>

            <button
              onClick={() => setTab('gradient')}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'gradient'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles size={13} />
              Photoshop Gradient
            </button>

            {isSleeve && (
              <button
                onClick={() => setTab('sleeveStripe')}
                className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  tab === 'sleeveStripe'
                    ? 'border-[#E4572E] text-[#E4572E]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Layers size={13} />
                Sleeve Stripe (2.3")
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    stripeEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {stripeEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            <button
              onClick={() => setTab('presets')}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'presets'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Shirt size={13} />
              Presets
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* 1. SOLID COLOR TAB */}
            {tab === 'solid' && (
              <div className="space-y-3.5">
                {/* Custom Color Input Row */}
                <div className="flex items-center gap-3 bg-[#111319] p-3 rounded-xl border border-[#2E3544]">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => handleApplySolid(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                  />
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Custom Hex Code
                    </label>
                    <input
                      type="text"
                      value={solidColor.toUpperCase()}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('#')) val = '#' + val;
                        handleApplySolid(val);
                      }}
                      className="w-full bg-[#181B22] border border-[#2E3544] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Palette Swatches */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 mb-2">
                    Athletic Jersey Color Palette
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {SOLID_COLOR_PALETTE.map((swatch) => (
                      <button
                        key={swatch.name}
                        onClick={() => handleApplySolid(swatch.hex)}
                        title={swatch.name}
                        className={`group relative h-8 rounded-lg border flex items-center justify-center transition-all transform active:scale-95 ${
                          solidColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/40 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {solidColor.toLowerCase() === swatch.hex.toLowerCase() && (
                          <Check
                            size={13}
                            className={swatch.dark ? 'text-white' : 'text-black'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. PHOTOSHOP-STYLE GRADIENT EDITOR TAB */}
            {tab === 'gradient' && (
              <div className="space-y-4">
                {/* INTERACTIVE PHOTOSHOP SPECTRUM TRACK */}
                <div className="bg-[#111319] p-3.5 rounded-xl border border-[#2E3544]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-orange-400" />
                      Photoshop Gradient Slider
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {stops.length} Stops • Click bar to add stop
                    </span>
                  </div>

                  {/* Gradient Spectrum Track */}
                  <div
                    ref={spectrumBarRef}
                    onClick={handleSpectrumBarClick}
                    className="relative h-9 rounded-lg border-2 border-white/30 cursor-crosshair shadow-inner"
                    style={{
                      background: `linear-gradient(to right, ${cssStopsString})`,
                      marginBottom: '28px'
                    }}
                    title="Click anywhere along the bar to add a new color stop"
                  >
                    {/* Photoshop Stop Pins */}
                    {sortedStops.map((stop) => {
                      const isSelected = stop.id === selectedStop.id;
                      return (
                        <div
                          key={stop.id}
                          onPointerDown={(e) => handleStopPointerDown(e, stop.id!)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStopId(stop.id!);
                          }}
                          className="absolute -bottom-6 flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform"
                          style={{
                            left: `${stop.offset}%`,
                            transform: 'translateX(-50%)',
                            zIndex: isSelected ? 30 : 20
                          }}
                          title={`Color: ${stop.color} (${stop.offset}%) - Drag to move`}
                        >
                          {/* Upward Triangle Pin */}
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderLeft: '5px solid transparent',
                              borderRight: '5px solid transparent',
                              borderBottom: isSelected ? '6px solid #F97316' : '6px solid #FFFFFF'
                            }}
                          />
                          {/* Square Color Box */}
                          <div
                            className={`w-4 h-4 rounded-sm shadow-md transition-all ${
                              isSelected
                                ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-[#111319] scale-110'
                                : 'border border-white/80'
                            }`}
                            style={{ backgroundColor: stop.color }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Selected Stop Controller */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#2E3544]/80 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400">Stop Color:</span>
                      <input
                        type="color"
                        value={selectedStop.color}
                        onChange={(e) => handleSelectedStopColorChange(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                      />
                    </div>

                    <div className="flex items-center gap-1 flex-1 min-w-[110px]">
                      <span className="text-[10px] font-bold text-gray-400">Hex:</span>
                      <input
                        type="text"
                        value={selectedStop.color.toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          handleSelectedStopColorChange(val);
                        }}
                        className="w-full bg-[#181B22] border border-[#2E3544] rounded px-2 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400">Pos:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedStop.offset}
                        onChange={(e) => handleSelectedStopOffsetChange(Number(e.target.value))}
                        className="w-12 bg-[#181B22] border border-[#2E3544] rounded px-1.5 py-1 text-xs font-mono font-bold text-white text-center focus:border-[#E4572E] focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-400 font-bold">%</span>
                    </div>

                    {stops.length > 2 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedStop}
                        className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                        title="Delete selected color stop"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Quick Color Swatches for Active Stop */}
                  <div className="mt-2.5 pt-2 border-t border-[#2E3544]/60">
                    <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                      Assign Color to Active Stop:
                    </span>
                    <div className="grid grid-cols-8 gap-1.5">
                      {SOLID_COLOR_PALETTE.slice(0, 16).map((swatch) => (
                        <button
                          key={swatch.name}
                          type="button"
                          onClick={() => handleSelectedStopColorChange(swatch.hex)}
                          title={`Set to ${swatch.name}`}
                          className="h-6 rounded border border-white/10 hover:border-white/40 transition-transform active:scale-95"
                          style={{ backgroundColor: swatch.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* DIRECTION & ANGLE CONTROLS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-300">
                      Gradient Angle / Style
                    </label>
                    <button
                      type="button"
                      onClick={handleReverseGradient}
                      className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20"
                    >
                      <ArrowRightLeft size={11} /> Reverse / Invert
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'gradient-linear-tb', label: 'Top ➔ Bottom ↓' },
                      { key: 'gradient-linear-lr', label: 'Left ➔ Right →' },
                      { key: 'gradient-linear-diag', label: 'Diagonal ↘' },
                      { key: 'gradient-radial', label: 'Radial Center ⊙' }
                    ].map((dir) => (
                      <button
                        key={dir.key}
                        onClick={() => {
                          setGradientStyle(dir.key as any);
                          applyGradientChange(stops, dir.key as any);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border text-center ${
                          gradientStyle === dir.key
                            ? 'bg-[#E4572E] text-white border-[#E4572E] shadow-sm'
                            : 'bg-[#14171E] text-gray-300 border-[#2E3544] hover:border-gray-500'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QUICK PHOTOSHOP PRESET STRIP */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-300">
                      Photoshop & Athletic Presets
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(!isSavingPreset)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25"
                    >
                      <Plus size={11} /> Save Current
                    </button>
                  </div>

                  {isSavingPreset && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-[#111319] rounded-lg border border-cyan-500/30">
                      <input
                        type="text"
                        placeholder="Preset Name (e.g. Bleed Blue 2)"
                        value={presetNameInput}
                        onChange={(e) => setPresetNameInput(e.target.value)}
                        className="flex-1 bg-[#181B22] border border-[#2E3544] rounded px-2 py-1 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomPreset}
                        className="px-2.5 py-1 bg-cyan-500 text-black text-xs font-bold rounded hover:bg-cyan-400"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PHOTOSHOP_GRADIENT_PRESETS.map((preset) => {
                      const css = `linear-gradient(135deg, ${preset.stops.map((s) => `${s.color} ${s.offset}%`).join(', ')})`;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleLoadPreset(preset.stops, preset.style)}
                          className="h-8 rounded-lg border border-white/10 hover:border-white/40 px-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform active:scale-95"
                          style={{ background: css }}
                        >
                          <span className="bg-black/50 px-1 py-0.5 rounded drop-shadow">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}

                    {customPresets.map((cp, idx) => {
                      const css = `linear-gradient(135deg, ${cp.stops.map((s) => `${s.color} ${s.offset}%`).join(', ')})`;
                      return (
                        <div
                          key={`custom-${idx}`}
                          onClick={() => handleLoadPreset(cp.stops, cp.style)}
                          className="relative h-8 rounded-lg border-2 border-cyan-400 px-2 flex items-center justify-center text-[10px] font-bold text-white shadow-sm cursor-pointer transition-transform active:scale-95"
                          style={{ background: css }}
                        >
                          <span className="bg-black/60 px-1 py-0.5 rounded drop-shadow">
                            {cp.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomPreset(idx, e)}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold"
                            title="Delete custom preset"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. SLEEVE BOTTOM STRIPE (2.3") TAB */}
            {tab === 'sleeveStripe' && isSleeve && (
              <div className="space-y-4">
                {/* PROMINENT TOGGLE CARD: DEFAULT OFF */}
                <div className="bg-[#111319] p-4 rounded-xl border border-[#2E3544] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers size={14} className="text-[#E4572E]" />
                        Sleeve Bottom Stripe Visibility
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          stripeEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {stripeEnabled ? 'Visible (ON)' : 'Hidden (OFF - Default)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      2.3" fixed height stripe across all sizes (18–60). Width auto-fits sleeve.
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleStripeToggle(!stripeEnabled)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none p-1 ${
                      stripeEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                    title={stripeEnabled ? 'Click to Turn OFF Sleeve Stripe' : 'Click to Turn ON Sleeve Stripe'}
                  >
                    <span className="sr-only">Toggle Sleeve Stripe</span>
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                        stripeEnabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* When Stripe is OFF */}
                {!stripeEnabled && (
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-dashed border-zinc-700 text-center space-y-2">
                    <p className="text-xs text-gray-300">
                      Sleeve stripe is currently <strong>OFF</strong>. Turn it ON to add a 2.3-inch bottom cuff stripe.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleStripeToggle(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Check size={14} /> Turn ON Sleeve Stripe
                    </button>
                  </div>
                )}

                {/* When Stripe is ON */}
                {stripeEnabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#14171E] border border-[#2E3544] text-[11px]">
                      <span className="text-gray-400">Fixed Print Height:</span>
                      <span className="font-bold text-orange-400 font-mono">2.3 Inches (Fixed)</span>
                    </div>

                    <div className="flex items-center gap-3 bg-[#111319] p-3 rounded-xl border border-[#2E3544]">
                      <input
                        type="color"
                        value={stripeColor}
                        onChange={(e) => handleStripeColorChange(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                      />
                      <div className="flex-1">
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                          Stripe Color (Hex)
                        </label>
                        <input
                          type="text"
                          value={stripeColor.toUpperCase()}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith('#')) val = '#' + val;
                            handleStripeColorChange(val);
                          }}
                          className="w-full bg-[#181B22] border border-[#2E3544] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Swatches for Stripe */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-300 mb-2">
                        Stripe Color Swatches
                      </h4>
                      <div className="grid grid-cols-7 gap-2">
                        {SOLID_COLOR_PALETTE.slice(0, 14).map((swatch) => (
                          <button
                            key={swatch.name}
                            onClick={() => handleStripeColorChange(swatch.hex)}
                            title={swatch.name}
                            className={`h-8 rounded-lg border flex items-center justify-center transition-all ${
                              stripeColor.toLowerCase() === swatch.hex.toLowerCase()
                                ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105'
                                : 'border-white/10 hover:border-white/40'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {stripeColor.toLowerCase() === swatch.hex.toLowerCase() && (
                              <Check
                                size={12}
                                className={swatch.dark ? 'text-white' : 'text-black'}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleStripeToggle(false)}
                        className="text-xs text-red-400 hover:text-red-300 underline font-semibold"
                      >
                        Turn OFF Sleeve Stripe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. PRESETS TAB */}
            {tab === 'presets' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300">
                  Select a Designer Team Gradient Preset
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {PHOTOSHOP_GRADIENT_PRESETS.map((preset) => {
                    const css = `linear-gradient(135deg, ${preset.stops.map((s) => `${s.color} ${s.offset}%`).join(', ')})`;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleLoadPreset(preset.stops, preset.style)}
                        className="p-3 rounded-xl border border-white/10 hover:border-white/40 flex flex-col justify-between h-20 text-left transition-transform active:scale-95 shadow-sm group"
                        style={{ background: css }}
                      >
                        <span className="text-xs font-extrabold text-white drop-shadow-md">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded w-max drop-shadow">
                          {preset.stops.length} STOPS • {preset.style.replace('gradient-', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER CONTROLS */}
          <div className="px-4 py-3 border-t border-[#2E3544] bg-[#14171E] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBlank}
                className="px-3 py-1.5 rounded-xl border border-[#2E3544] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                title="Reset artboard to blank pure white"
              >
                <RotateCcw size={12} />
                White / Blank
              </button>

              <button
                type="button"
                onClick={handleApplyAll}
                className="px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1.5"
                title="Apply this fill to Front, Back and Sleeves"
              >
                <CheckCheck size={14} />
                Apply to All Panels
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
