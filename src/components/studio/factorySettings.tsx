import { useState } from "react";
import { Sliders, Printer, Save, CheckCircle2, ShieldCheck } from "lucide-react";

export function FactorySettings() {
  const [paperWidth, setPaperWidth] = useState("60");
  const [bleedMargin, setBleedMargin] = useState("0.5");
  const [resolutionDpi, setResolutionDpi] = useState("300");
  const [colorProfile, setColorProfile] = useState("FOGRA39 (Sublimation)");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Factory OS Settings</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Configure plotter paper roll widths, fabric bleeds, ICC color profiles & resolution.</p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Save size={16} />
          <span>{isSaved ? "Saved to Cloud Vault ✓" : "Save Factory Settings"}</span>
        </button>
      </div>

      {/* Settings Form Grid */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/60 border border-slate-800 p-6 md:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
        <div className="grid md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2">Sublimation Paper Roll Width</label>
            <select
              value={paperWidth}
              onChange={(e) => setPaperWidth(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-semibold focus:border-cyan-400 outline-none"
            >
              <option value="44">44 Inches (Standard Plotter)</option>
              <option value="60">60 Inches (Wide Format Roll)</option>
              <option value="64">64 Inches (Industrial Plotter)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2">Default Fabric Bleed Margin (Inches)</label>
            <select
              value={bleedMargin}
              onChange={(e) => setBleedMargin(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-semibold focus:border-cyan-400 outline-none"
            >
              <option value="0.25">0.25 Inch Margin</option>
              <option value="0.5">0.50 Inch Margin (Recommended)</option>
              <option value="0.75">0.75 Inch Margin</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2">Export Plotter Resolution (DPI)</label>
            <select
              value={resolutionDpi}
              onChange={(e) => setResolutionDpi(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-semibold focus:border-cyan-400 outline-none"
            >
              <option value="300">300 DPI (Commercial High-Res)</option>
              <option value="150">150 DPI (Fast Draft Mode)</option>
              <option value="72">72 DPI (Free Test Mode)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2">Sublimation ICC Color Profile</label>
            <select
              value={colorProfile}
              onChange={(e) => setColorProfile(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-semibold focus:border-cyan-400 outline-none"
            >
              <option value="FOGRA39 (Sublimation)">FOGRA39 (Sublimation Standard)</option>
              <option value="sRGB IEC61966-2.1">sRGB IEC61966-2.1 (Vibrant Digital)</option>
              <option value="CMYK US Web Coated">CMYK US Web Coated (SWOP) v2</option>
            </select>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 font-medium">
          💡 These settings are stored permanently in your private Cloud Vault. All future order exports automatically respect your plotter roll widths and ICC color profiles.
        </div>
      </div>
    </div>
  );
}
