import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Palette, Sparkles, Check, ArrowRightLeft, 
  RotateCcw, Sliders, CheckCheck, Shirt, Layers
} from 'lucide-react';
import type { ArtDesignConfig, PanelConfig, TrimPartConfig } from './designer';

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
const SOLID_COLOR_PALETTE = [
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

// Curated Athletic Jersey Gradient Presets
const GRADIENT_PRESETS = [
  { name: 'Sunset Blaze', c1: '#FF416C', c2: '#FF4B2B', style: 'gradient-linear-tb' },
  { name: 'Cyber Blue', c1: '#0052D4', c2: '#4364F7', style: 'gradient-linear-tb' },
  { name: 'Neon Volt', c1: '#0B0D11', c2: '#84CC16', style: 'gradient-linear-diag' },
  { name: 'India Blue Fade', c1: '#002244', c2: '#1E90FF', style: 'gradient-linear-tb' },
  { name: 'Royal Midnight', c1: '#0F2027', c2: '#203A43', style: 'gradient-linear-tb' },
  { name: 'Golden Trophy', c1: '#F7971E', c2: '#FFD200', style: 'gradient-linear-diag' },
  { name: 'Crimson Shadow', c1: '#8A2387', c2: '#E94057', style: 'gradient-linear-diag' },
  { name: 'Deep Ocean', c1: '#000428', c2: '#004E92', style: 'gradient-linear-tb' },
  { name: 'Emerald Fade', c1: '#064E3B', c2: '#10B981', style: 'gradient-linear-tb' },
  { name: 'Titanium Stealth', c1: '#1F242D', c2: '#374151', style: 'gradient-linear-tb' },
  { name: 'Fire & Ice', c1: '#FA709A', c2: '#FEE140', style: 'gradient-linear-diag' },
  { name: 'Arctic Cyan', c1: '#00C9FF', c2: '#92FE9D', style: 'gradient-linear-lr' },
  { name: 'Barcelona Gold', c1: '#004D98', c2: '#A50044', style: 'gradient-linear-tb' },
  { name: 'Lakers Vibe', c1: '#552583', c2: '#FDB927', style: 'gradient-linear-diag' },
  { name: 'Viper Strike', c1: '#111827', c2: '#10B981', style: 'gradient-linear-tb' },
  { name: 'Radiant Glow', c1: '#FF0844', c2: '#FFB199', style: 'gradient-radial' }
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

  // Active tab inside modal
  const [tab, setTab] = useState<'solid' | 'gradient' | 'sleeveStripe' | 'presets'>(() => {
    if (panel.generatedStyle && panel.generatedStyle.includes('gradient')) return 'gradient';
    return 'solid';
  });

  const [color1, setColor1] = useState<string>(panel.generatedColor1 || '#FFFFFF');
  const [color2, setColor2] = useState<string>(panel.generatedColor2 || '#1D4ED8');
  const [gradientStyle, setGradientStyle] = useState<string>(
    panel.generatedStyle || 'gradient-linear-tb'
  );

  // Sleeve Stripe Config
  const stripe = designConfig.trim?.sleeveStripe || {
    enabled: true,
    color: '#171717',
    uploadedUrl: null,
    height: 2.3
  };
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(stripe.enabled !== false);
  const [stripeColor, setStripeColor] = useState<string>(stripe.color || '#171717');

  if (!isOpen) return null;

  const panelNames: Record<string, string> = {
    front: '👕 Front Panel',
    back: '👕 Back Panel',
    sleeveLeft: '🧤 Left Sleeve',
    sleeveRight: '🧤 Right Sleeve',
    a4Print: '📄 A4 Back Print'
  };

  const handleApplySolid = (color: string) => {
    setColor1(color);
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: 'solid',
      generatedColor1: color,
      generatedColor2: color
    });
  };

  const handleApplyGradient = (
    c1: string,
    c2: string,
    style: string = gradientStyle
  ) => {
    setColor1(c1);
    setColor2(c2);
    setGradientStyle(style);
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: style as any,
      generatedColor1: c1,
      generatedColor2: c2
    });
  };

  const handleSwapGradient = () => {
    const nextC1 = color2;
    const nextC2 = color1;
    handleApplyGradient(nextC1, nextC2, gradientStyle);
  };

  const handleApplyAll = () => {
    if (tab === 'solid') {
      onApplyAllPanels({
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: color1,
        generatedColor2: color1
      });
    } else {
      onApplyAllPanels({
        backgroundType: 'generate',
        generatedStyle: gradientStyle as any,
        generatedColor1: color1,
        generatedColor2: color2
      });
    }
  };

  const handleResetBlank = () => {
    onUpdatePanel(panelKey, {
      backgroundType: 'generate',
      generatedStyle: 'solid',
      generatedColor1: '#FFFFFF',
      generatedColor2: '#FFFFFF'
    });
    setColor1('#FFFFFF');
    setColor2('#FFFFFF');
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-[#181B22] text-[#E2E8F0] border border-[#2E3544] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2E3544] bg-[#14171E]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#E4572E] border border-orange-500/30 flex items-center justify-center font-bold">
                <Palette size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {panelNames[panelKey] || 'Artboard Fill'}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Triple-Click Active
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  Select solid color, athletic sports gradients, or bottom sleeve stripe
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Live Preview Bar */}
          <div className="px-5 pt-3 pb-1">
            <div 
              className="h-10 rounded-xl border border-white/15 shadow-inner flex items-center justify-between px-3 text-xs font-semibold text-white/90 drop-shadow-sm transition-all"
              style={{
                background: tab === 'solid'
                  ? color1
                  : gradientStyle === 'gradient-linear-tb'
                  ? `linear-gradient(to bottom, ${color1}, ${color2})`
                  : gradientStyle === 'gradient-linear-lr'
                  ? `linear-gradient(to right, ${color1}, ${color2})`
                  : gradientStyle === 'gradient-linear-diag'
                  ? `linear-gradient(135deg, ${color1}, ${color2})`
                  : gradientStyle === 'gradient-radial' || gradientStyle === 'neon-gradient'
                  ? `radial-gradient(circle, ${color1} 15%, ${color2} 100%)`
                  : color1
              }}
            >
              <span className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono">
                {tab === 'solid' ? color1.toUpperCase() : `${color1.toUpperCase()} ➔ ${color2.toUpperCase()}`}
              </span>
              <span className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-sans">
                {tab === 'solid' ? 'Solid Fill' : gradientStyle.replace('gradient-', '').replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#2E3544] px-5 gap-1 pt-2">
            <button
              onClick={() => setTab('solid')}
              className={`px-3 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tab === 'solid'
                  ? 'border-[#E4572E] text-[#E4572E]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color1 }} />
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
              Gradients
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
                {stripeEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
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

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* 1. SOLID COLOR TAB */}
            {tab === 'solid' && (
              <div className="space-y-4">
                {/* Custom Color Input Row */}
                <div className="flex items-center gap-3 bg-[#111319] p-3 rounded-xl border border-[#2E3544]">
                  <div className="relative">
                    <input
                      type="color"
                      value={color1}
                      onChange={(e) => handleApplySolid(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Custom Hex Code
                    </label>
                    <input
                      type="text"
                      value={color1.toUpperCase()}
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
                        className={`group relative h-9 rounded-xl border flex items-center justify-center transition-all transform active:scale-95 ${
                          color1.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/40 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {color1.toLowerCase() === swatch.hex.toLowerCase() && (
                          <Check
                            size={14}
                            className={swatch.dark ? 'text-white' : 'text-black'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GRADIENTS TAB */}
            {tab === 'gradient' && (
              <div className="space-y-4">
                {/* Gradient Direction Controls */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-2">
                    Gradient Direction & Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'gradient-linear-tb', label: 'Top ➔ Bottom ↓' },
                      { key: 'gradient-linear-lr', label: 'Left ➔ Right →' },
                      { key: 'gradient-linear-diag', label: 'Diagonal ↘' },
                      { key: 'gradient-radial', label: 'Radial Center ⊙' }
                    ].map((dir) => (
                      <button
                        key={dir.key}
                        onClick={() => handleApplyGradient(color1, color2, dir.key)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
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

                {/* Dual Color Controls */}
                <div className="grid grid-cols-2 gap-3 bg-[#111319] p-3 rounded-xl border border-[#2E3544] items-center">
                  {/* Color 1 */}
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                      Color 1 (Start)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color1}
                        onChange={(e) => handleApplyGradient(e.target.value, color2)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={color1.toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          handleApplyGradient(val, color2);
                        }}
                        className="w-full bg-[#181B22] border border-[#2E3544] rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Swap & Color 2 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-gray-400">
                        Color 2 (End)
                      </label>
                      <button
                        onClick={handleSwapGradient}
                        title="Swap Colors"
                        className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
                      >
                        <ArrowRightLeft size={10} /> Swap
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color2}
                        onChange={(e) => handleApplyGradient(color1, e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={color2.toUpperCase()}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          handleApplyGradient(color1, val);
                        }}
                        className="w-full bg-[#181B22] border border-[#2E3544] rounded-lg px-2 py-1 text-xs font-mono font-bold text-white focus:border-[#E4572E] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Popular Gradient Swatches */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 mb-2">
                    Quick Athletic Gradients
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.slice(0, 8).map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleApplyGradient(preset.c1, preset.c2, preset.style)}
                        className="h-9 rounded-xl border border-white/10 hover:border-white/40 px-2 flex items-center justify-between text-[11px] font-bold text-white shadow-sm transition-transform active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`
                        }}
                      >
                        <span className="drop-shadow bg-black/40 px-1.5 py-0.5 rounded text-[10px]">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. SLEEVE BOTTOM STRIPE (2.3") TAB */}
            {tab === 'sleeveStripe' && isSleeve && (
              <div className="space-y-4">
                {/* Banner / Explanation */}
                <div className="bg-[#111319] p-3.5 rounded-xl border border-[#2E3544] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers size={14} className="text-[#E4572E]" />
                        Sleeve Bottom Stripe / Cuff
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        2.3" fixed height across all sizes (18–60) on export. Width auto-fits panel.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stripeEnabled}
                        onChange={(e) => handleStripeToggle(e.target.checked)}
                        className="w-4 h-4 accent-[#E4572E] rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-gray-200">
                        {stripeEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {stripeEnabled && (
                    <div className="pt-2 border-t border-[#2E3544] flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Fixed Print Height:</span>
                      <span className="font-bold text-orange-400 font-mono">2.3 Inches (Fixed)</span>
                    </div>
                  )}
                </div>

                {/* Stripe Color Picker */}
                {stripeEnabled && (
                  <div className="space-y-3">
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
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleApplyGradient(preset.c1, preset.c2, preset.style)}
                      className="p-3 rounded-xl border border-white/10 hover:border-white/40 flex flex-col justify-between h-20 text-left transition-transform active:scale-95 shadow-sm group"
                      style={{
                        background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`
                      }}
                    >
                      <span className="text-xs font-extrabold text-white drop-shadow-md">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-mono text-white/90 bg-black/40 px-2 py-0.5 rounded w-max drop-shadow">
                        {preset.c1} ➔ {preset.c2}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-5 py-3.5 border-t border-[#2E3544] bg-[#14171E] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetBlank}
                className="px-3 py-1.5 rounded-xl border border-[#2E3544] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                White / Blank
              </button>

              <button
                type="button"
                onClick={handleApplyAll}
                className="px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1.5"
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
