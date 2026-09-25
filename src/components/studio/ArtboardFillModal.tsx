import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, Palette, Sparkles, Check, ArrowRightLeft, 
  RotateCcw, Sliders, CheckCheck, Shirt, Layers, 
  GripHorizontal, Trash2, Plus, Edit3, Wand2
} from 'lucide-react';
import type { ArtDesignConfig, PanelConfig, TrimPartConfig, GradientStopItem } from './designer';

interface ArtboardFillModalProps {
  isOpen: boolean;
  panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print';
  designConfig: ArtDesignConfig;
  onUpdatePanel: (panelKey: string, updates: Partial<PanelConfig>) => void;
  onApplyAllPanels: (updates: Partial<PanelConfig>) => void;
  onUpdateSleeveStripe: (updates: Partial<TrimPartConfig>) => void;
  onApplyFullJerseyPreset?: (config: {
    panelUpdates: Partial<PanelConfig>;
    stripeUpdates?: Partial<TrimPartConfig>;
    collarColor?: string;
    placketColor?: string;
  }) => void;
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

// Complete Jersey Team Matching Presets (All Panels + 2" Stripe + Trim)
export interface CompleteJerseyPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  panelGradient: {
    style: 'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial';
    stops: Array<{ color: string; offset: number }>;
  };
  stripe: {
    fillType: 'solid' | 'gradient';
    color: string;
    gradientStyle?: 'gradient-linear-lr' | 'gradient-linear-tb' | 'gradient-linear-diag' | 'gradient-radial';
    stops?: Array<{ color: string; offset: number }>;
  };
  collarColor: string;
  placketColor: string;
}

export const COMPLETE_JERSEY_PRESETS: CompleteJerseyPreset[] = [
  {
    id: 'india-bleed-blue',
    name: 'India Bleed Blue & Saffron',
    category: 'Cricket Pro',
    description: 'Navy to Cobalt Bleed Blue body with vibrant Saffron Gold 2" sleeve stripe & collar',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#0A192F', offset: 0 },
        { color: '#0047AB', offset: 50 },
        { color: '#1E90FF', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#FF671F',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#FF671F', offset: 0 },
        { color: '#FFA500', offset: 100 }
      ]
    },
    collarColor: '#FF671F',
    placketColor: '#FF671F'
  },
  {
    id: 'metallic-gold-champion',
    name: 'Metallic Gold Champion',
    category: 'Championship',
    description: 'Rich specular chrome gold body with pitch black & chrome accent sleeve stripe',
    panelGradient: {
      style: 'gradient-linear-diag',
      stops: [
        { color: '#BF953F', offset: 0 },
        { color: '#FCF6BA', offset: 25 },
        { color: '#B38728', offset: 50 },
        { color: '#FBF5B7', offset: 75 },
        { color: '#AA771C', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'solid',
      color: '#0B0D11'
    },
    collarColor: '#0B0D11',
    placketColor: '#0B0D11'
  },
  {
    id: 'cyber-volt-stealth',
    name: 'Cyber Volt & Stealth Charcoal',
    category: 'Esports Pro',
    description: 'Pitch Black to Charcoal gradient body with high-voltage neon volt 2" sleeve cuff',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#0B0D11', offset: 0 },
        { color: '#1F242D', offset: 60 },
        { color: '#374151', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#84CC16',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#84CC16', offset: 0 },
        { color: '#A3E635', offset: 100 }
      ]
    },
    collarColor: '#84CC16',
    placketColor: '#84CC16'
  },
  {
    id: 'sunset-blaze-carbon',
    name: 'Sunset Blaze & Carbon',
    category: 'Athletic Dynamic',
    description: 'Crimson to flame orange fade body with carbon stealth 2" sleeve stripe & trim',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#FF416C', offset: 0 },
        { color: '#FF4B2B', offset: 50 },
        { color: '#FFA07A', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'solid',
      color: '#0B0D11'
    },
    collarColor: '#0B0D11',
    placketColor: '#0B0D11'
  },
  {
    id: 'real-madrid-gold',
    name: 'Madrid Pure White & Gold',
    category: 'Football Classic',
    description: 'Pure Ice White jersey with royal gold 2" sleeve stripe and navy trim accent',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#FFFFFF', offset: 0 },
        { color: '#F8FAFC', offset: 60 },
        { color: '#F1F5F9', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#D97706',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#B45309', offset: 0 },
        { color: '#F59E0B', offset: 50 },
        { color: '#FCD34D', offset: 100 }
      ]
    },
    collarColor: '#0A192F',
    placketColor: '#0A192F'
  },
  {
    id: 'lakers-purple-gold',
    name: 'Lakers Regal Purple & Gold',
    category: 'Basketball Elite',
    description: 'Deep royal purple body with iconic trophy gold 2" sleeve stripe and matching trim',
    panelGradient: {
      style: 'gradient-linear-diag',
      stops: [
        { color: '#552583', offset: 0 },
        { color: '#4C1D95', offset: 60 },
        { color: '#2E1065', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#FDB927',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#F59E0B', offset: 0 },
        { color: '#FDB927', offset: 100 }
      ]
    },
    collarColor: '#FDB927',
    placketColor: '#FDB927'
  },
  {
    id: 'barcelona-blaugrana',
    name: 'Barcelona Blaugrana & Gold',
    category: 'Football Legend',
    description: 'Deep Royal Navy to Crimson Garnet diagonal fade with golden yellow cuff & collar',
    panelGradient: {
      style: 'gradient-linear-diag',
      stops: [
        { color: '#004D98', offset: 0 },
        { color: '#5B1736', offset: 50 },
        { color: '#A50044', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'solid',
      color: '#EDBB00'
    },
    collarColor: '#EDBB00',
    placketColor: '#EDBB00'
  },
  {
    id: 'viper-emerald-glow',
    name: 'Viper Strike Emerald & Dark Forest',
    category: 'Motorsport & Cricket',
    description: 'Charcoal carbon into emerald green fade with mint neon 2" sleeve stripe',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#111827', offset: 0 },
        { color: '#064E3B', offset: 50 },
        { color: '#047857', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#10B981',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#059669', offset: 0 },
        { color: '#34D399', offset: 100 }
      ]
    },
    collarColor: '#10B981',
    placketColor: '#10B981'
  },
  {
    id: 'miami-vice-neon',
    name: 'Miami Vice Cyan & Neon Pink',
    category: 'Retro Wave',
    description: 'Electric cyan to violet purple body with screaming hot neon pink 2" cuff stripe',
    panelGradient: {
      style: 'gradient-linear-diag',
      stops: [
        { color: '#00F2FE', offset: 0 },
        { color: '#7F00FF', offset: 55 },
        { color: '#4A00E0', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#EC4899',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#D946EF', offset: 0 },
        { color: '#F43F5E', offset: 100 }
      ]
    },
    collarColor: '#EC4899',
    placketColor: '#EC4899'
  },
  {
    id: 'ferrari-scarlet-chrome',
    name: 'Scuderia Scarlet Red & Silver',
    category: 'Racing Speed',
    description: 'Ruby Scarlet into deep dark maroon with pure silver chrome 2" stripe and black trim',
    panelGradient: {
      style: 'gradient-linear-tb',
      stops: [
        { color: '#DC2626', offset: 0 },
        { color: '#991B1B', offset: 55 },
        { color: '#450A0A', offset: 100 }
      ]
    },
    stripe: {
      fillType: 'gradient',
      color: '#E0E0E0',
      gradientStyle: 'gradient-linear-lr',
      stops: [
        { color: '#9CA3AF', offset: 0 },
        { color: '#FFFFFF', offset: 50 },
        { color: '#9CA3AF', offset: 100 }
      ]
    },
    collarColor: '#0B0D11',
    placketColor: '#0B0D11'
  }
];

export default function ArtboardFillModal({
  isOpen,
  panelKey,
  designConfig,
  onUpdatePanel,
  onApplyAllPanels,
  onUpdateSleeveStripe,
  onApplyFullJerseyPreset,
  onClose
}: ArtboardFillModalProps) {
  const panel = designConfig[panelKey] || designConfig.front;
  const isSleeve = panelKey === 'sleeveLeft' || panelKey === 'sleeveRight';

  const dragControls = useDragControls();
  const spectrumBarRef = useRef<HTMLDivElement>(null);
  const stripeSpectrumRef = useRef<HTMLDivElement>(null);

  // Active tab inside modal
  const [tab, setTab] = useState<'solid' | 'gradient' | 'sleeveStripe' | 'presets'>(() => {
    if (panel.generatedStyle && panel.generatedStyle.includes('gradient')) return 'gradient';
    return 'solid';
  });

  // Feedback banner when preset is loaded into editor
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Solid Color State
  const [solidColor, setSolidColor] = useState<string>(panel.generatedColor1 || '#FFFFFF');

  // Multi-stop Photoshop Gradient State for Panel
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

  // Sleeve Stripe Config: DEFAULT IS FALSE (OFF), HEIGHT IS 2.0"
  const stripe = designConfig.trim?.sleeveStripe;
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(Boolean(stripe?.enabled));
  const [stripeColor, setStripeColor] = useState<string>(stripe?.color || '#171717');
  const [stripeFillType, setStripeFillType] = useState<'solid' | 'gradient'>(stripe?.fillType || 'solid');
  const [stripeGradientStyle, setStripeGradientStyle] = useState<
    'gradient-linear-lr' | 'gradient-linear-tb' | 'gradient-linear-diag' | 'gradient-radial'
  >(stripe?.gradientStyle || 'gradient-linear-lr');
  const [stripeStops, setStripeStops] = useState<GradientStopItem[]>(() => {
    if (stripe?.gradientStops && stripe.gradientStops.length >= 2) {
      return [...stripe.gradientStops].sort((a, b) => a.offset - b.offset);
    }
    return [
      { id: 'stripe-stop-0', color: stripe?.color || '#FF671F', offset: 0 },
      { id: 'stripe-stop-1', color: '#FFA500', offset: 100 }
    ];
  });
  const [stripeSelectedStopId, setStripeSelectedStopId] = useState<string>(
    stripeStops[0]?.id || 'stripe-stop-0'
  );

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
      if (strp?.fillType) setStripeFillType(strp.fillType);
      if (strp?.gradientStyle) setStripeGradientStyle(strp.gradientStyle);
      if (strp?.gradientStops && strp.gradientStops.length >= 2) {
        setStripeStops([...strp.gradientStops].sort((a, b) => a.offset - b.offset));
        setStripeSelectedStopId(strp.gradientStops[0].id || 'stripe-stop-0');
      }
    }
  }, [isOpen, panelKey]);

  if (!isOpen) return null;

  const panelNames: Record<string, string> = {
    front: '👕 Front Panel',
    back: '👕 Back Panel',
    sleeveLeft: '🧤 Left Sleeve',
    sleeveRight: '🧤 Right Sleeve',
    a4Print: '📄 A4 Back Print'
  };

  // Selected stop object for Panel Gradient
  const selectedStop = stops.find((s) => s.id === selectedStopId) || stops[0] || {
    id: 'stop-0',
    color: '#FF416C',
    offset: 0
  };

  // Sorted stops for CSS strings
  const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
  const cssStopsString = sortedStops.map((s) => `${s.color} ${s.offset}%`).join(', ');

  // Selected stop object for Sleeve Stripe Gradient
  const stripeSelectedStop =
    stripeStops.find((s) => s.id === stripeSelectedStopId) || stripeStops[0] || {
      id: 'stripe-stop-0',
      color: '#FF671F',
      offset: 0
    };
  const stripeSortedStops = [...stripeStops].sort((a, b) => a.offset - b.offset);
  const stripeCssStopsString = stripeSortedStops.map((s) => `${s.color} ${s.offset}%`).join(', ');

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

  // Apply Gradient updates for Panel
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

  // Change Color of selected stop
  const handleSelectedStopColorChange = (newColor: string) => {
    const updated = stops.map((s) => (s.id === selectedStop.id ? { ...s, color: newColor } : s));
    setStops(updated);
    applyGradientChange(updated, gradientStyle);
  };

  // Change Offset Location (%) of selected stop
  const handleSelectedStopOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newOffset)));
    const updated = stops.map((s) => (s.id === selectedStop.id ? { ...s, offset: clamped } : s));
    setStops(updated);
    applyGradientChange(updated, gradientStyle);
  };

  // Delete active stop
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

  // ── SLEEVE STRIPE GRADIENT HANDLERS ──
  const applyStripeUpdate = (updates: Partial<TrimPartConfig>) => {
    onUpdateSleeveStripe({
      enabled: stripeEnabled,
      height: 2.0,
      fillType: stripeFillType,
      color: stripeColor,
      gradientStyle: stripeGradientStyle,
      gradientStops: stripeStops,
      ...updates
    });
  };

  const handleStripeToggle = (enabled: boolean) => {
    setStripeEnabled(enabled);
    onUpdateSleeveStripe({
      enabled,
      height: 2.0,
      color: stripeColor,
      fillType: stripeFillType,
      gradientStyle: stripeGradientStyle,
      gradientStops: stripeStops
    });
  };

  const handleStripeSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stripeSpectrumRef.current) return;
    const rect = stripeSpectrumRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const offset = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));

    const newStop: GradientStopItem = {
      id: `stripe-stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      color: stripeSelectedStop?.color || '#FFA500',
      offset
    };

    const nextStops = [...stripeStops, newStop].sort((a, b) => a.offset - b.offset);
    setStripeStops(nextStops);
    setStripeSelectedStopId(newStop.id!);
    applyStripeUpdate({ gradientStops: nextStops });
  };

  const handleStripeStopPointerDown = (e: React.PointerEvent, stopId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setStripeSelectedStopId(stopId);

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!stripeSpectrumRef.current) return;
      const rect = stripeSpectrumRef.current.getBoundingClientRect();
      const currentX = moveEvt.clientX - rect.left;
      const newOffset = Math.max(0, Math.min(100, Math.round((currentX / rect.width) * 100)));

      setStripeStops((prev) => {
        const updated = prev.map((s) => (s.id === stopId ? { ...s, offset: newOffset } : s));
        applyStripeUpdate({ gradientStops: updated });
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

  const handleStripeStopColorChange = (newColor: string) => {
    const updated = stripeStops.map((s) =>
      s.id === stripeSelectedStop.id ? { ...s, color: newColor } : s
    );
    setStripeStops(updated);
    applyStripeUpdate({ gradientStops: updated });
  };

  const handleStripeStopOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newOffset)));
    const updated = stripeStops.map((s) =>
      s.id === stripeSelectedStop.id ? { ...s, offset: clamped } : s
    );
    setStripeStops(updated);
    applyStripeUpdate({ gradientStops: updated });
  };

  const handleDeleteStripeStop = () => {
    if (stripeStops.length <= 2) return;
    const remaining = stripeStops.filter((s) => s.id !== stripeSelectedStop.id);
    setStripeStops(remaining);
    setStripeSelectedStopId(remaining[0].id!);
    applyStripeUpdate({ gradientStops: remaining });
  };

  // ── APPLY MATCHING FULL JERSEY TEAM PRESET ──
  const handleApplyFullPreset = (preset: CompleteJerseyPreset, switchToEditorTab?: 'gradient' | 'sleeveStripe') => {
    const sortedPanelStops: GradientStopItem[] = preset.panelGradient.stops.map((s, i) => ({
      id: `preset-stop-${i}-${Date.now()}`,
      color: s.color,
      offset: s.offset
    }));

    setStops(sortedPanelStops);
    setSelectedStopId(sortedPanelStops[0].id!);
    setGradientStyle(preset.panelGradient.style);

    const stripeStopsFormatted: GradientStopItem[] = (preset.stripe.stops || [
      { color: preset.stripe.color, offset: 0 },
      { color: '#ffffff', offset: 100 }
    ]).map((s, i) => ({
      id: `preset-stripe-${i}-${Date.now()}`,
      color: s.color,
      offset: s.offset
    }));

    setStripeEnabled(true);
    setStripeColor(preset.stripe.color);
    setStripeFillType(preset.stripe.fillType);
    if (preset.stripe.gradientStyle) setStripeGradientStyle(preset.stripe.gradientStyle);
    setStripeStops(stripeStopsFormatted);
    setStripeSelectedStopId(stripeStopsFormatted[0].id!);

    const panelUpdate: Partial<PanelConfig> = {
      backgroundType: 'generate',
      generatedStyle: preset.panelGradient.style,
      generatedColor1: sortedPanelStops[0].color,
      generatedColor2: sortedPanelStops[sortedPanelStops.length - 1].color,
      gradientStops: sortedPanelStops
    };

    const stripeUpdate: Partial<TrimPartConfig> = {
      enabled: true,
      height: 2.0,
      fillType: preset.stripe.fillType,
      color: preset.stripe.color,
      gradientStyle: preset.stripe.gradientStyle || 'gradient-linear-lr',
      gradientStops: stripeStopsFormatted
    };

    if (onApplyFullJerseyPreset) {
      onApplyFullJerseyPreset({
        panelUpdates: panelUpdate,
        stripeUpdates: stripeUpdate,
        collarColor: preset.collarColor,
        placketColor: preset.placketColor
      });
    } else {
      onApplyAllPanels(panelUpdate);
      onUpdateSleeveStripe(stripeUpdate);
    }

    if (switchToEditorTab) {
      setTab(switchToEditorTab);
      setFeedbackMessage(`Loaded "${preset.name}". You can now customize colors & stops live!`);
      setTimeout(() => setFeedbackMessage(null), 3800);
    } else {
      setFeedbackMessage(`Applied "${preset.name}" across all panels & 2" sleeve stripe!`);
      setTimeout(() => setFeedbackMessage(null), 3800);
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
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-auto bg-[#181B22]/95 backdrop-blur-2xl text-[#E2E8F0] border border-[#2E3544] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_25px_rgba(228,87,46,0.18)] w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] select-none"
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
                title="Color & Gradient Studio"
              >
                <Palette size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  {panelNames[panelKey] || 'Artboard Fill'}
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                    Moveable Window
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <GripHorizontal size={11} className="text-gray-500" />
                  Drag header to move • Artwork is visible live behind
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

          {/* NOTIFICATION FEEDBACK BANNER */}
          {feedbackMessage && (
            <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1.5 text-[11px] font-bold text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check size={13} /> {feedbackMessage}
              </span>
              <button onClick={() => setFeedbackMessage(null)} className="text-emerald-300 hover:text-white">✕</button>
            </div>
          )}

          {/* LIVE GRADIENT / COLOR PREVIEW BAR */}
          <div className="px-4 pt-3 pb-1">
            <div
              className="h-9 rounded-xl border border-white/20 shadow-inner flex items-center justify-between px-3 text-xs font-semibold text-white/95 drop-shadow-sm transition-all"
              style={{ background: previewBackground }}
            >
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                {tab === 'solid'
                  ? solidColor.toUpperCase()
                  : `${sortedStops.length} STOPS • ${gradientStyle.replace('gradient-', '').replace('-', ' ').toUpperCase()}`}
              </span>
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-orange-300">
                LIVE ARTWORK PREVIEW
              </span>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="flex border-b border-[#2E3544] px-3 gap-1 pt-1.5 bg-[#14171E]/60 text-xs">
            <button
              onClick={() => setTab('solid')}
              className={`px-2.5 py-2 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'solid'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-white/40" style={{ background: solidColor }} />
              Solid
            </button>

            <button
              onClick={() => setTab('gradient')}
              className={`px-2.5 py-2 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'gradient'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles size={13} />
              Gradient
            </button>

            {isSleeve && (
              <button
                onClick={() => setTab('sleeveStripe')}
                className={`px-2.5 py-2 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  tab === 'sleeveStripe'
                    ? 'border-[#E4572E] text-[#E4572E]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Layers size={13} />
                Sleeve Stripe (2")
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
              className={`px-2.5 py-2 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'presets'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Wand2 size={13} />
              Team Presets
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
              <div className="space-y-3.5">
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
                      <span className="text-[10px] font-bold text-gray-400">Color:</span>
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
              </div>
            )}

            {/* 3. SLEEVE BOTTOM STRIPE (2" FIXED) WITH GRADIENT EDITOR */}
            {tab === 'sleeveStripe' && isSleeve && (
              <div className="space-y-3.5">
                {/* PROMINENT TOGGLE CARD: DEFAULT OFF */}
                <div className="bg-[#111319] p-3.5 rounded-xl border border-[#2E3544] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers size={14} className="text-[#E4572E]" />
                        Sleeve Bottom Stripe Visibility
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          stripeEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {stripeEnabled ? 'Visible (ON)' : 'Hidden (OFF - Default)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Fixed <strong>2.0 Inches</strong> height on all sizes (18–60). Width auto-fits sleeve.
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
                      Sleeve stripe is currently <strong>OFF</strong>. Turn it ON to add a 2.0-inch bottom cuff stripe.
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
                    {/* Fixed Height & Stripe Preview */}
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#14171E] border border-[#2E3544] text-[11px]">
                      <span className="text-gray-400">Fixed Print Height:</span>
                      <span className="font-bold text-orange-400 font-mono">2.0 Inches (Fixed)</span>
                    </div>

                    {/* Stripe Fill Type Switch: Solid vs Gradient */}
                    <div className="flex items-center gap-1 bg-[#111319] p-1 rounded-xl border border-[#2E3544]">
                      <button
                        type="button"
                        onClick={() => {
                          setStripeFillType('solid');
                          applyStripeUpdate({ fillType: 'solid' });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          stripeFillType === 'solid'
                            ? 'bg-[#E4572E] text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Solid Stripe Color
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStripeFillType('gradient');
                          applyStripeUpdate({ fillType: 'gradient' });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          stripeFillType === 'gradient'
                            ? 'bg-[#E4572E] text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Sparkles size={12} />
                        Gradient Sleeve Stripe
                      </button>
                    </div>

                    {/* SOLID STRIPE CONTROLS */}
                    {stripeFillType === 'solid' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-[#111319] p-3 rounded-xl border border-[#2E3544]">
                          <input
                            type="color"
                            value={stripeColor}
                            onChange={(e) => {
                              setStripeColor(e.target.value);
                              applyStripeUpdate({ color: e.target.value, fillType: 'solid' });
                            }}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                          />
                          <div className="flex-1">
                            <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                              Stripe Hex Color
                            </label>
                            <input
                              type="text"
                              value={stripeColor.toUpperCase()}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val.startsWith('#')) val = '#' + val;
                                setStripeColor(val);
                                applyStripeUpdate({ color: val, fillType: 'solid' });
                              }}
                              className="w-full bg-[#181B22] border border-[#2E3544] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Quick Swatches for Stripe */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-300 mb-2">
                            Quick Stripe Swatches
                          </h4>
                          <div className="grid grid-cols-7 gap-2">
                            {SOLID_COLOR_PALETTE.slice(0, 14).map((swatch) => (
                              <button
                                key={swatch.name}
                                onClick={() => {
                                  setStripeColor(swatch.hex);
                                  applyStripeUpdate({ color: swatch.hex, fillType: 'solid' });
                                }}
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
                      </div>
                    )}

                    {/* GRADIENT STRIPE CONTROLS (PHOTOSHOP-STYLE) */}
                    {stripeFillType === 'gradient' && (
                      <div className="space-y-3 bg-[#111319] p-3.5 rounded-xl border border-[#2E3544]">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-orange-400" />
                            Sleeve Stripe Gradient Slider
                          </span>
                          <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                            {stripeStops.length} Stops • Click to add stop
                          </span>
                        </div>

                        {/* Spectrum Track */}
                        <div
                          ref={stripeSpectrumRef}
                          onClick={handleStripeSpectrumClick}
                          className="relative h-8 rounded-lg border-2 border-white/30 cursor-crosshair shadow-inner"
                          style={{
                            background: `linear-gradient(to right, ${stripeCssStopsString})`,
                            marginBottom: '26px'
                          }}
                          title="Click anywhere along the bar to add a new stripe color stop"
                        >
                          {stripeSortedStops.map((stop) => {
                            const isSelected = stop.id === stripeSelectedStop.id;
                            return (
                              <div
                                key={stop.id}
                                onPointerDown={(e) => handleStripeStopPointerDown(e, stop.id!)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStripeSelectedStopId(stop.id!);
                                }}
                                className="absolute -bottom-6 flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform"
                                style={{
                                  left: `${stop.offset}%`,
                                  transform: 'translateX(-50%)',
                                  zIndex: isSelected ? 30 : 20
                                }}
                                title={`Color: ${stop.color} (${stop.offset}%)`}
                              >
                                <div
                                  style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '5px solid transparent',
                                    borderRight: '5px solid transparent',
                                    borderBottom: isSelected ? '6px solid #F97316' : '6px solid #FFFFFF'
                                  }}
                                />
                                <div
                                  className={`w-3.5 h-3.5 rounded-sm shadow-md transition-all ${
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

                        {/* Active Stop Controller */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2E3544]/80">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400">Stop:</span>
                            <input
                              type="color"
                              value={stripeSelectedStop.color}
                              onChange={(e) => handleStripeStopColorChange(e.target.value)}
                              className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                            />
                          </div>

                          <div className="flex items-center gap-1 flex-1 min-w-[90px]">
                            <input
                              type="text"
                              value={stripeSelectedStop.color.toUpperCase()}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val.startsWith('#')) val = '#' + val;
                                handleStripeStopColorChange(val);
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
                              value={stripeSelectedStop.offset}
                              onChange={(e) => handleStripeStopOffsetChange(Number(e.target.value))}
                              className="w-11 bg-[#181B22] border border-[#2E3544] rounded px-1.5 py-1 text-xs font-mono font-bold text-white text-center focus:border-[#E4572E] focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400 font-bold">%</span>
                          </div>

                          {stripeStops.length > 2 && (
                            <button
                              type="button"
                              onClick={handleDeleteStripeStop}
                              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                              title="Delete selected color stop"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Angle direction buttons for sleeve stripe */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[
                            { key: 'gradient-linear-lr', label: 'Left ➔ Right' },
                            { key: 'gradient-linear-tb', label: 'Top ➔ Bottom' },
                            { key: 'gradient-linear-diag', label: 'Diagonal ↘' },
                            { key: 'gradient-radial', label: 'Radial ⊙' }
                          ].map((dir) => (
                            <button
                              key={dir.key}
                              type="button"
                              onClick={() => {
                                setStripeGradientStyle(dir.key as any);
                                applyStripeUpdate({ gradientStyle: dir.key as any });
                              }}
                              className={`py-1 rounded text-[10px] font-bold border ${
                                stripeGradientStyle === dir.key
                                  ? 'bg-[#E4572E] text-white border-[#E4572E]'
                                  : 'bg-[#181B22] text-gray-400 border-[#2E3544]'
                              }`}
                            >
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

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

            {/* 4. COMPLETE TEAM MATCHING PRESETS (ALL PANELS + 2" STRIPE + EDITABLE) */}
            {tab === 'presets' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Wand2 size={13} className="text-[#E4572E]" />
                      Full Jersey Matching Presets
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Coordinates Front, Back, Sleeves, 2" Sleeve Stripe, and Trim in 1-Click
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {COMPLETE_JERSEY_PRESETS.map((preset) => {
                    const bodyCss = `linear-gradient(135deg, ${preset.panelGradient.stops.map((s) => `${s.color} ${s.offset}%`).join(', ')})`;
                    const stripePreviewColor = preset.stripe.color;

                    return (
                      <div
                        key={preset.id}
                        className="p-3 rounded-xl border border-white/10 bg-[#111319] hover:border-white/25 transition-all space-y-2.5"
                      >
                        {/* Preset Header with Mini Jersey Preview */}
                        <div className="flex items-center gap-3">
                          {/* Mini Visual Swatch showing body gradient + bottom sleeve stripe */}
                          <div
                            className="w-14 h-12 rounded-lg border border-white/20 shadow-sm relative overflow-hidden flex flex-col justify-between flex-shrink-0"
                            style={{ background: bodyCss }}
                          >
                            <span className="text-[8px] font-bold text-white/80 bg-black/40 px-1 py-0.2 rounded m-1 w-max">
                              TEAM
                            </span>
                            {/* 2" Stripe preview band */}
                            <div
                              className="h-3 w-full border-t border-black/30 shadow-sm"
                              style={{ backgroundColor: stripePreviewColor }}
                              title="2.0-inch Matching Cuff Stripe"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-white truncate">
                                {preset.name}
                              </h5>
                              <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                {preset.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {preset.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions for this Preset */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[#2E3544]/60">
                          {/* 1-Click Apply to All Panels & Stripe */}
                          <button
                            type="button"
                            onClick={() => handleApplyFullPreset(preset)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            title="Apply matching colors to Front, Back, Sleeves and 2-inch Stripe"
                          >
                            <Check size={13} />
                            Apply Full Jersey + 2" Stripe
                          </button>

                          {/* "If customer want to in that colour add Editor also" */}
                          <button
                            type="button"
                            onClick={() => handleApplyFullPreset(preset, 'gradient')}
                            className="py-1.5 px-3 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-[11px] font-bold transition-all flex items-center gap-1.5"
                            title="Load these colors into the Gradient Editor to customize color stops"
                          >
                            <Edit3 size={12} />
                            Customize in Editor
                          </button>
                        </div>
                      </div>
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
