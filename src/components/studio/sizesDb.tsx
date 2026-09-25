import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, CheckCircle2, Bookmark, Grid, Lock, Unlock } from 'lucide-react';

export interface Dimension {
  w: number;
  h: number;
}

export interface SizeConfig {
  front: Dimension;
  back: Dimension;
  half: Dimension;
  full: Dimension;
  rHalf: Dimension;
  rFull: Dimension;
  nn: Dimension;
}

export interface SizeDatabase {
  [key: string]: SizeConfig;
}

// defaultSizes from the enterprise Photoshop plugin
export const defaultSizes: SizeDatabase = {
  "18": { front: { w: 11, h: 15 }, back: { w: 11, h: 15 }, half: { w: 10.5, h: 5.5 }, full: { w: 10, h: 15 }, rHalf: { w: 11.5, h: 9.5 }, rFull: { w: 11.5, h: 17 }, nn: { w: 5, h: 5 } },
  "20": { front: { w: 12, h: 16 }, back: { w: 12, h: 16 }, half: { w: 11.0, h: 6.0 }, full: { w: 11, h: 16 }, rHalf: { w: 12.5, h: 10.5 }, rFull: { w: 12.5, h: 18 }, nn: { w: 6, h: 6 } },
  "22": { front: { w: 13, h: 17 }, back: { w: 13, h: 17 }, half: { w: 12.0, h: 6.5 }, full: { w: 12, h: 17 }, rHalf: { w: 13.5, h: 11.5 }, rFull: { w: 13.5, h: 19 }, nn: { w: 6, h: 6 } },
  "24": { front: { w: 14, h: 20 }, back: { w: 14, h: 20 }, half: { w: 13.0, h: 6.5 }, full: { w: 13, h: 18.5 }, rHalf: { w: 14.5, h: 12.5 }, rFull: { w: 14.5, h: 20 }, nn: { w: 7, h: 7 } },
  "26": { front: { w: 15, h: 21 }, back: { w: 15, h: 21 }, half: { w: 13.5, h: 8.0 }, full: { w: 13.5, h: 19 }, rHalf: { w: 15.5, h: 13.5 }, rFull: { w: 15.5, h: 21 }, nn: { w: 7, h: 7 } },
  "28": { front: { w: 15.8, h: 23 }, back: { w: 15.8, h: 23 }, half: { w: 15.0, h: 8.5 }, full: { w: 15, h: 20 }, rHalf: { w: 16.0, h: 14.0 }, rFull: { w: 16.0, h: 22 }, nn: { w: 8, h: 8 } },
  "30": { front: { w: 17, h: 25 }, back: { w: 17, h: 25 }, half: { w: 15.5, h: 9.0 }, full: { w: 15.5, h: 21.5 }, rHalf: { w: 16.5, h: 14.5 }, rFull: { w: 16.5, h: 23 }, nn: { w: 8, h: 8 } },
  "32": { front: { w: 18, h: 26 }, back: { w: 18, h: 26 }, half: { w: 16.0, h: 9.5 }, full: { w: 16, h: 22 }, rHalf: { w: 17.5, h: 15.0 }, rFull: { w: 17.5, h: 25 }, nn: { w: 9, h: 9 } },
  "34": { front: { w: 19, h: 27 }, back: { w: 19, h: 27 }, half: { w: 17.0, h: 10.0 }, full: { w: 17, h: 23.5 }, rHalf: { w: 17.5, h: 16.0 }, rFull: { w: 17.5, h: 28 }, nn: { w: 9, h: 9 } },
  "36": { front: { w: 20, h: 28 }, back: { w: 20, h: 28 }, half: { w: 18.0, h: 11.0 }, full: { w: 18, h: 24.5 }, rHalf: { w: 18.5, h: 17.0 }, rFull: { w: 18.5, h: 31 }, nn: { w: 10, h: 10 } },
  "38": { front: { w: 21, h: 29 }, back: { w: 21, h: 29 }, half: { w: 19.0, h: 11.0 }, full: { w: 19, h: 25 }, rHalf: { w: 19.0, h: 16.5 }, rFull: { w: 19.0, h: 31 }, nn: { w: 10, h: 10 } },
  "40": { front: { w: 22, h: 30 }, back: { w: 22, h: 30 }, half: { w: 20.0, h: 11.0 }, full: { w: 20, h: 26 }, rHalf: { w: 19.5, h: 17.0 }, rFull: { w: 19.5, h: 31 }, nn: { w: 11, h: 11 } },
  "42": { front: { w: 23, h: 31 }, back: { w: 23, h: 31 }, half: { w: 21.0, h: 12.0 }, full: { w: 21, h: 26 }, rHalf: { w: 20.5, h: 18.0 }, rFull: { w: 20.5, h: 31.5 }, nn: { w: 11, h: 11 } },
  "44": { front: { w: 24, h: 31.8 }, back: { w: 24, h: 31.8 }, half: { w: 22.0, h: 13.0 }, full: { w: 22, h: 27 }, rHalf: { w: 21.5, h: 18.5 }, rFull: { w: 21.5, h: 32 }, nn: { w: 11, h: 11 } },
  "46": { front: { w: 25, h: 33 }, back: { w: 25, h: 33 }, half: { w: 23.0, h: 13.5 }, full: { w: 23, h: 28 }, rHalf: { w: 22.5, h: 19.0 }, rFull: { w: 22.5, h: 32 }, nn: { w: 12, h: 12 } },
  "48": { front: { w: 26, h: 33.5 }, back: { w: 26, h: 33.5 }, half: { w: 24.5, h: 14.0 }, full: { w: 24.5, h: 28.5 }, rHalf: { w: 23.0, h: 19.5 }, rFull: { w: 23.0, h: 33 }, nn: { w: 12, h: 12 } },
  "50": { front: { w: 27, h: 34 }, back: { w: 27, h: 34 }, half: { w: 24.0, h: 14.5 }, full: { w: 25, h: 29 }, rHalf: { w: 23.5, h: 20.0 }, rFull: { w: 23.5, h: 33 }, nn: { w: 12, h: 12 } },
  "52": { front: { w: 28, h: 34.5 }, back: { w: 28, h: 34.5 }, half: { w: 24.0, h: 15.0 }, full: { w: 25.5, h: 29.5 }, rHalf: { w: 24.0, h: 20.5 }, rFull: { w: 24.0, h: 33.5 }, nn: { w: 13, h: 13 } },
  "54": { front: { w: 29, h: 34.5 }, back: { w: 29, h: 34.5 }, half: { w: 25.0, h: 15.5 }, full: { w: 26.5, h: 30 }, rHalf: { w: 24.5, h: 21.0 }, rFull: { w: 24.5, h: 34 }, nn: { w: 13, h: 13 } },
  "56": { front: { w: 30, h: 35 }, back: { w: 30, h: 35 }, half: { w: 26.0, h: 15.5 }, full: { w: 27, h: 30 }, rHalf: { w: 25.0, h: 21.5 }, rFull: { w: 25.0, h: 34 }, nn: { w: 13, h: 13 } },
  "58": { front: { w: 31, h: 36 }, back: { w: 31, h: 36 }, half: { w: 26.5, h: 16.0 }, full: { w: 27, h: 30 }, rHalf: { w: 25.5, h: 22.0 }, rFull: { w: 25.5, h: 34.5 }, nn: { w: 13, h: 13 } },
  "60": { front: { w: 32, h: 37 }, back: { w: 32, h: 37 }, half: { w: 27.0, h: 16.5 }, full: { w: 27, h: 30 }, rHalf: { w: 26.0, h: 22.5 }, rFull: { w: 26.0, h: 34.5 }, nn: { w: 13, h: 13 } }
};

export const DEFAULT_SIZE_AGE_MAP: Record<string, string> = {
  "18": "6 month To 1 year",
  "20": "1 year",
  "22": "1.5 year",
  "24": "2-3 year",
  "26": "4-5 year",
  "28": "6-8 year",
  "30": "10-11 year",
  "32": "11-12 year",
  "34": "13-14 year",
  "36": "XS",
  "38": "S",
  "40": "M",
  "42": "L",
  "44": "XL",
  "46": "2XL",
  "48": "3XL",
  "50": "4XL",
  "52": "5XL",
  "54": "6XL",
  "56": "7XL",
  "58": "8XL",
  "60": "9XL"
};

export const BUILT_IN_PRESETS: Record<string, { label: string; description: string; db: SizeDatabase }> = {
  "Default Size": {
    label: "Default Size",
    description: "Official factory sizing matrix calibrated for standard sublimated sportswear (sizes 18–60).",
    db: defaultSizes
  }
};

export interface CollarExportDimensions {
  small: { w: number; h: number }; // Sizes 18 to 30 (Youth)
  big: { w: number; h: number };   // Sizes 32 to 60 (Adult)
}

export const DEFAULT_COLLAR_EXPORT_SIZES: CollarExportDimensions = {
  small: { w: 16, h: 4.5 },
  big: { w: 18, h: 4.5 }
};

export const getCollarExportSizes = (): CollarExportDimensions => {
  try {
    const saved = localStorage.getItem('fivenest_collar_export_sizes');
    if (saved) {
      const parsed = JSON.parse(saved);
      const sw = parseFloat(parsed?.small?.w);
      const sh = parseFloat(parsed?.small?.h);
      const bw = parseFloat(parsed?.big?.w);
      const bh = parseFloat(parsed?.big?.h);
      return {
        small: {
          w: !isNaN(sw) && sw > 0 ? sw : 16,
          h: !isNaN(sh) && sh > 0 ? sh : 4.5
        },
        big: {
          w: !isNaN(bw) && bw > 0 ? bw : 18,
          h: !isNaN(bh) && bh > 0 ? bh : 4.5
        }
      };
    }
  } catch (e) {
    console.error("Failed to load collar export sizes:", e);
  }
  return DEFAULT_COLLAR_EXPORT_SIZES;
};

export const saveCollarExportSizes = (sizes: CollarExportDimensions) => {
  try {
    localStorage.setItem('fivenest_collar_export_sizes', JSON.stringify(sizes));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('collar-export-sizes-changed'));
    }
  } catch (e) {
    console.error("Failed to save collar export sizes:", e);
  }
};

interface SizesDbProps {
  onDatabaseChange?: (db: SizeDatabase) => void;
}

export const SizesDb: React.FC<SizesDbProps> = ({ onDatabaseChange }) => {
  const [sizeDB, setSizeDB] = useState<SizeDatabase>(defaultSizes);
  const [selectedSize, setSelectedSize] = useState<string>("40");
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [presetName, setPresetName] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  
  const [ageMap, setAgeMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fivenest_size_age_map');
      return saved ? JSON.parse(saved) : DEFAULT_SIZE_AGE_MAP;
    } catch {
      return DEFAULT_SIZE_AGE_MAP;
    }
  });

  const handleUpdateAge = (size: string, val: string) => {
    setAgeMap(prev => {
      const next = { ...prev, [size]: val };
      localStorage.setItem('fivenest_size_age_map', JSON.stringify(next));
      return next;
    });
  };

  const [savedPresets, setSavedPresets] = useState<Record<string, SizeDatabase>>(() => {
    try { 
      return JSON.parse(localStorage.getItem('fivenest_size_presets') || '{}'); 
    } catch { 
      return {}; 
    }
  });

  const [activePreset, setActivePreset] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('fivenest_active_size_preset');
      const presets = JSON.parse(localStorage.getItem('fivenest_size_presets') || '{}');
      if (saved && saved !== 'Standard Factory Sizing' && (saved === 'Default Size' || presets[saved])) {
        return saved;
      }
      return 'Default Size';
    } catch {
      return 'Default Size';
    }
  });

  const [centerMarks, setCenterMarks] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fivenest_pref_center_marks');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [sizeWatermarks, setSizeWatermarks] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fivenest_pref_size_watermarks');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [collarExportSizes, setCollarExportSizes] = useState<CollarExportDimensions>(() => getCollarExportSizes());

  const handleUpdateCollarExportSize = (setKey: 'small' | 'big', dim: 'w' | 'h', val: number) => {
    setCollarExportSizes(prev => {
      const next = {
        ...prev,
        [setKey]: {
          ...prev[setKey],
          [dim]: val > 0 ? val : 0.1
        }
      };
      saveCollarExportSizes(next);
      return next;
    });
  };

  const handleResetCollarExportSizes = () => {
    setCollarExportSizes(DEFAULT_COLLAR_EXPORT_SIZES);
    saveCollarExportSizes(DEFAULT_COLLAR_EXPORT_SIZES);
    setSaveMessage("Collar export dimensions reset to factory defaults (16\"×4.5\" & 18\"×4.5\")!");
    setTimeout(() => setSaveMessage(""), 3500);
  };

  // Load active size database from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('teedex_size_database');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSizeDB(parsed);
        if (onDatabaseChange) onDatabaseChange(parsed);
      } catch (e) {
        console.error("Failed to parse saved size database", e);
      }
    }
  }, []);

  // Update a single cell dimension in real time
  const handleUpdateCell = (
    size: string,
    panel: 'front' | 'back' | 'half' | 'full' | 'rHalf' | 'rFull' | 'nn',
    dim: 'w' | 'h',
    val: number
  ) => {
    setSizeDB(prev => {
      const currentConf = prev[size] || defaultSizes[size] || {
        front: { w: 0, h: 0 },
        back: { w: 0, h: 0 },
        half: { w: 0, h: 0 },
        full: { w: 0, h: 0 },
        rHalf: { w: 0, h: 0 },
        rFull: { w: 0, h: 0 },
        nn: { w: 0, h: 0 }
      };
      const updated = {
        ...prev,
        [size]: {
          ...currentConf,
          [panel]: {
            ...currentConf[panel],
            [dim]: val
          }
        }
      };
      localStorage.setItem('teedex_size_database', JSON.stringify(updated));
      if (onDatabaseChange) onDatabaseChange(updated);
      return updated;
    });
  };

  // Load a preset
  const handleLoadPreset = (name: string) => {
    if (!name) return;
    let targetDb: SizeDatabase | null = null;
    if (name === "Default Size" || BUILT_IN_PRESETS[name]) {
      targetDb = defaultSizes;
    } else if (savedPresets[name]) {
      targetDb = savedPresets[name];
    }
    if (!targetDb) return;

    setActivePreset(name);
    localStorage.setItem('fivenest_active_size_preset', name);
    setSizeDB(targetDb);
    localStorage.setItem('teedex_size_database', JSON.stringify(targetDb));
    if (onDatabaseChange) onDatabaseChange(targetDb);
    setSaveMessage(`Loaded preset "${name}" into all 22 sizes!`);
    setTimeout(() => setSaveMessage(""), 3500);
  };

  // Save current sizing as a new preset
  const handleSavePreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed) {
      alert("Please enter a preset name.");
      return;
    }
    if (trimmed.toLowerCase() === 'default size') {
      alert("Cannot overwrite 'Default Size'. Please choose a unique name for your preset.");
      return;
    }
    localStorage.setItem('teedex_size_database', JSON.stringify(sizeDB));
    if (onDatabaseChange) onDatabaseChange(sizeDB);

    const updatedPresets = { ...savedPresets, [trimmed]: sizeDB };
    setSavedPresets(updatedPresets);
    localStorage.setItem('fivenest_size_presets', JSON.stringify(updatedPresets));
    setActivePreset(trimmed);
    localStorage.setItem('fivenest_active_size_preset', trimmed);
    setPresetName('');
    setSaveMessage(`Preset "${trimmed}" saved and added to Sizing Presets Manager!`);
    setTimeout(() => setSaveMessage(""), 3500);
  };

  // Delete a custom preset
  const handleDeletePreset = (nameToDelete?: string) => {
    const name = nameToDelete || activePreset;
    if (!name || name === 'Default Size') {
      alert("Default Size cannot be deleted.");
      return;
    }
    if (!savedPresets[name]) {
      alert(`Custom preset "${name}" not found.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete preset "${name}"?`)) {
      const updated = { ...savedPresets };
      delete updated[name];
      setSavedPresets(updated);
      localStorage.setItem('fivenest_size_presets', JSON.stringify(updated));
      setActivePreset('Default Size');
      localStorage.setItem('fivenest_active_size_preset', 'Default Size');
      setSizeDB(defaultSizes);
      localStorage.setItem('teedex_size_database', JSON.stringify(defaultSizes));
      if (onDatabaseChange) onDatabaseChange(defaultSizes);
      setSaveMessage(`Preset "${name}" deleted. Reverted to Default Size.`);
      setTimeout(() => setSaveMessage(""), 3500);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all size dimensions back to default factory settings?")) {
      setSizeDB(defaultSizes);
      setAgeMap(DEFAULT_SIZE_AGE_MAP);
      localStorage.setItem('fivenest_size_age_map', JSON.stringify(DEFAULT_SIZE_AGE_MAP));
      setActivePreset("Default Size");
      localStorage.setItem('fivenest_active_size_preset', 'Default Size');
      localStorage.setItem('teedex_size_database', JSON.stringify(defaultSizes));
      if (onDatabaseChange) onDatabaseChange(defaultSizes);
      setSaveMessage("Reset all sizes to Default Size.");
      setTimeout(() => setSaveMessage(""), 3500);
    }
  };

  const renderCellContent = (
    size: string,
    panel: 'front' | 'back' | 'half' | 'full' | 'rHalf' | 'rFull' | 'nn',
    dim: Dimension,
    textColor: string,
    panelLabel: string,
    isSelected: boolean
  ) => {
    if (!isUnlocked) {
      return (
        <td
          key={panel}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '12.5px',
            fontWeight: isSelected ? '700' : '500',
            color: textColor,
            padding: '8px 12px',
            whiteSpace: 'nowrap'
          }}
        >
          {dim.w}" × {dim.h}"
        </td>
      );
    }

    return (
      <td
        key={panel}
        style={{
          padding: '5px 8px',
          background: isSelected ? '#FFF0EB' : '#FFFFFF',
          whiteSpace: 'nowrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <input
            type="number"
            step="any"
            className="table-dim-input"
            value={dim.w === 0 ? '' : dim.w}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
              handleUpdateCell(size, panel, 'w', isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            style={{
              width: '46px',
              height: '28px',
              fontSize: '12px',
              fontWeight: '700',
              textAlign: 'center',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              color: '#111827',
              padding: '0 2px'
            }}
            title={`Size ${size} ${panelLabel} Width (in)`}
          />
          <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', userSelect: 'none' }}>×</span>
          <input
            type="number"
            step="any"
            className="table-dim-input"
            value={dim.h === 0 ? '' : dim.h}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
              handleUpdateCell(size, panel, 'h', isNaN(val) ? 0 : val);
            }}
            placeholder="0"
            style={{
              width: '46px',
              height: '28px',
              fontSize: '12px',
              fontWeight: '700',
              textAlign: 'center',
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              color: '#111827',
              padding: '0 2px'
            }}
            title={`Size ${size} ${panelLabel} Height (in)`}
          />
        </div>
      </td>
    );
  };

  return (
    <div className="sizes-db-container fade-in" style={{ paddingBottom: '20px' }}>
      
      {/* 1. TOP PROMINENT BANNER: Current Active Preset */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #FFF0EB 0%, #FAF8F5 100%)',
        border: '1.5px solid #FCD7C8',
        borderRadius: '12px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(228, 87, 46, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#E4572E',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(228, 87, 46, 0.28)',
            flexShrink: 0
          }}>
            ⭐
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Sizing Preset
              </span>
              <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '1px 8px', borderRadius: '10px', fontWeight: '800' }}>
                LOADED & APPLIED
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
              {activePreset}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#E4572E' }}>
            22 Sizes Active
          </span>
          <span style={{ display: 'block', fontSize: '11px', color: '#6B7280' }}>
            Chest 18" to 60"
          </span>
        </div>
      </div>

      {/* 2. Load Preset & Management Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📦 Sizing Presets Manager
          </span>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            Switch presets or save current dimensions for different sports or client cut profiles
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* Dropdown to select and load preset */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={activePreset}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="form-select"
              style={{
                flex: 1,
                height: '38px',
                fontSize: '12px',
                fontWeight: '700',
                padding: '0 30px 0 12px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#111827'
              }}
            >
              <option value="Default Size">Default Size</option>
              {Object.keys(savedPresets).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {activePreset !== 'Default Size' && savedPresets[activePreset] && (
              <button
                type="button"
                className="btn"
                title={`Delete preset "${activePreset}"`}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#DC2626',
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => handleDeletePreset(activePreset)}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>

          {/* Save New Preset */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="New preset name (e.g. Football Slim, Pro Rugby)..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset(); }}
              className="form-input"
              style={{
                flex: 1,
                height: '38px',
                fontSize: '12px',
                padding: '0 12px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#111827'
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{
                height: '38px',
                padding: '0 16px',
                fontSize: '12px',
                fontWeight: '700',
                background: '#E4572E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(228,87,46,0.25)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
              onClick={handleSavePreset}
            >
              💾 Save Preset
            </button>
          </div>
        </div>
      </div>

      {/* 3. Master Size Database Editor Panel (Direct Table Editor) */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '20px', background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {saveMessage && (
          <div style={{ 
            padding: '9px 14px', 
            background: '#DCFCE7', 
            border: '1px solid #86EFAC', 
            color: '#15803D', 
            fontWeight: '700', 
            fontSize: '12px', 
            borderRadius: '8px', 
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span> {saveMessage}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📐 Master Database Editor (All Dimensions in Inches)
              </h3>
              {isUnlocked ? (
                <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '3px 9px', borderRadius: '8px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Unlock size={12} /> UNLOCKED & EDITABLE
                </span>
              ) : (
                <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', padding: '3px 9px', borderRadius: '8px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Lock size={12} /> LOCKED (READ-ONLY)
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {isUnlocked 
                ? "Direct spreadsheet editing active. Edit any dimension directly in the table below. Edits auto-apply." 
                : "Master size grading matrix for all 22 chest sizes. Click 'Unlock Editor' to edit measurements."}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsUnlocked(!isUnlocked)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '800',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isUnlocked ? '#16A34A' : '#E4572E',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: isUnlocked ? '0 2px 8px rgba(22, 163, 74, 0.25)' : '0 2px 8px rgba(228, 87, 46, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title={isUnlocked ? "Lock table to prevent accidental changes" : "Unlock table to edit dimensions directly"}
            >
              {isUnlocked ? (
                <>
                  <Lock size={14} /> Lock Editor
                </>
              ) : (
                <>
                  <Unlock size={14} /> Unlock Editor
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#4B5563'
              }}
              title="Reset all sizes back to Default Size"
            >
              <RotateCcw size={13} /> Reset Defaults
            </button>
          </div>
        </div>

        <div className="sheets-scroll-container" style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #E8E4DE', borderRadius: '10px 10px 0 0' }}>
          <table className="custom-table sheets-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '65px', textAlign: 'center' }}>Size</th>
                <th style={{ minWidth: '130px', textAlign: 'center' }}>Age</th>
                <th style={{ minWidth: '135px' }}>Front (W × H)</th>
                <th style={{ minWidth: '135px' }}>Back (W × H)</th>
                <th style={{ minWidth: '135px' }}>Half Sleeve</th>
                <th style={{ minWidth: '135px' }}>Full Sleeve</th>
                <th style={{ minWidth: '135px' }}>Raglan Half</th>
                <th style={{ minWidth: '135px' }}>Raglan Full</th>
                <th style={{ minWidth: '125px' }}>Name & #</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(sizeDB).sort((a,b) => parseInt(a) - parseInt(b)).map(size => {
                const conf = sizeDB[size];
                const isSelected = size === selectedSize;
                return (
                  <tr 
                    key={size} 
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? '#FFF0EB' : '#FFFFFF',
                      transition: 'background 0.15s ease'
                    }} 
                    onClick={() => setSelectedSize(size)}
                    title={`Size ${size}`}
                  >
                    <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '800',
                        background: isSelected ? '#E4572E' : '#F3F0EA',
                        color: isSelected ? '#FFFFFF' : '#111827',
                        minWidth: '46px'
                      }}>
                        {size}
                      </span>
                    </td>
                    {isUnlocked ? (
                      <td style={{ textAlign: 'center', padding: '5px 8px', background: isSelected ? '#FFF0EB' : '#FFFFFF', whiteSpace: 'nowrap' }}>
                        <input
                          type="text"
                          value={ageMap[size] ?? DEFAULT_SIZE_AGE_MAP[size] ?? ''}
                          onChange={(e) => handleUpdateAge(size, e.target.value)}
                          style={{
                            width: '115px',
                            height: '28px',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            textAlign: 'center',
                            background: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            borderRadius: '6px',
                            color: '#111827',
                            padding: '0 4px'
                          }}
                          title={`Size ${size} Age / Fit label`}
                        />
                      </td>
                    ) : (
                      <td style={{ textAlign: 'center', padding: '6px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: parseInt(size) >= 36 ? '#EFF6FF' : '#F4F2EC',
                          color: parseInt(size) >= 36 ? '#1D4ED8' : '#374151',
                          border: parseInt(size) >= 36 ? '1px solid #BFDBFE' : '1px solid #E2DED7'
                        }}>
                          {ageMap[size] || DEFAULT_SIZE_AGE_MAP[size] || '-'}
                        </span>
                      </td>
                    )}
                    {renderCellContent(size, 'front', conf.front, isSelected ? '#111827' : '#374151', 'Front', isSelected)}
                    {renderCellContent(size, 'back', conf.back, isSelected ? '#111827' : '#374151', 'Back', isSelected)}
                    {renderCellContent(size, 'half', conf.half, isSelected ? '#16A34A' : '#15803D', 'Half Sleeve', isSelected)}
                    {renderCellContent(size, 'full', conf.full, isSelected ? '#2563EB' : '#1D4ED8', 'Full Sleeve', isSelected)}
                    {renderCellContent(size, 'rHalf', conf.rHalf, isSelected ? '#7C3AED' : '#6D28D9', 'Raglan Half', isSelected)}
                    {renderCellContent(size, 'rFull', conf.rFull, isSelected ? '#7C3AED' : '#6D28D9', 'Raglan Full', isSelected)}
                    {renderCellContent(size, 'nn', conf.nn, isSelected ? '#C2410C' : '#4B5563', 'Name & #', isSelected)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="sheets-summary-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span>Total Sizes: <strong style={{ color: '#111827' }}>22</strong> (Sizes 18 to 60)</span>
            <span style={{ color: '#D1D5DB' }}>|</span>
            <span>Active Size: <strong style={{ color: '#E4572E' }}>Size {selectedSize}</strong></span>
            {isUnlocked && (
              <>
                <span style={{ color: '#D1D5DB' }}>|</span>
                <span style={{ color: '#15803D', fontWeight: '700' }}>✏️ Direct Editing Enabled</span>
              </>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {isUnlocked ? "Type in any input box to modify dimensions" : "Click 'Unlock Editor' to edit any dimensions"}
          </span>
        </div>
      </div>

      {/* 4. Collar Export Dimensions Editor (Youth & Adult) */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '20px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👔 Collar Export Dimensions Editor (Inches)
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
              Customize physical export dimensions for collar panels. Small Collars apply to youth sizes (18 to 30) and Big Collar applies to adult sizes (32 to 60). Used in Roll Nesting and Individual Panels export.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetCollarExportSizes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '700',
              background: '#F3F4F6',
              color: '#4B5563',
              border: '1px solid #D1D5DB',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Reset collar sizes to standard default dimensions"
          >
            <RotateCcw size={13} /> Reset Collar Defaults
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Small Collars (Youth: 18 - 30) */}
          <div style={{ 
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)', 
            border: '1.5px solid #FED7AA', 
            borderRadius: '10px', 
            padding: '16px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  YOUTH / JUNIOR COLLAR
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                  Small Collars (Sizes 18 to 30)
                </h4>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', background: '#FFEDD5', color: '#9A3412', border: '1px solid #FDBA74', padding: '2px 8px', borderRadius: '6px' }}>
                Default: 16" × 4.5"
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4B5563', marginBottom: '4px' }}>
                  Width (inches)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={collarExportSizes.small.w}
                    onChange={(e) => handleUpdateCollarExportSize('small', 'w', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 28px 0 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: '700', color: '#9CA3AF' }}>in</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4B5563', marginBottom: '4px' }}>
                  Height (inches)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={collarExportSizes.small.h}
                    onChange={(e) => handleUpdateCollarExportSize('small', 'h', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 28px 0 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: '700', color: '#9CA3AF' }}>in</span>
                </div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6B7280' }}>
              Exported as: <strong style={{ color: '#111827' }}>Small Collars = {'{qty}'} pcs (dimention = {collarExportSizes.small.w} x {collarExportSizes.small.h})</strong>
            </p>
          </div>

          {/* Big Collar (Adult: 32 - 60) */}
          <div style={{ 
            background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)', 
            border: '1.5px solid #BFDBFE', 
            borderRadius: '10px', 
            padding: '16px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ADULT / MEN & WOMEN COLLAR
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                  Big Collar (Sizes 32 to 60)
                </h4>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '800', background: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD', padding: '2px 8px', borderRadius: '6px' }}>
                Default: 18" × 4.5"
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4B5563', marginBottom: '4px' }}>
                  Width (inches)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={collarExportSizes.big.w}
                    onChange={(e) => handleUpdateCollarExportSize('big', 'w', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 28px 0 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: '700', color: '#9CA3AF' }}>in</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#4B5563', marginBottom: '4px' }}>
                  Height (inches)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={collarExportSizes.big.h}
                    onChange={(e) => handleUpdateCollarExportSize('big', 'h', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 28px 0 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: '700', color: '#9CA3AF' }}>in</span>
                </div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6B7280' }}>
              Exported as: <strong style={{ color: '#111827' }}>Big Collar = {'{qty}'} pcs (dimention = {collarExportSizes.big.w} x {collarExportSizes.big.h})</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 5. Technical Alignment Marks Options */}
      <div className="glass-card" style={{ padding: '18px 20px', marginBottom: '20px', textAlign: 'left', background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '12px' }}>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 Technical Alignment Marks Options
          </h3>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
            Toggle cutting guide lines and print alignment annotations on exported sublimation panels.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <label 
            className={`checkbox-card ${centerMarks ? 'checked' : ''}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              padding: '14px 16px', 
              margin: 0, 
              cursor: 'pointer',
              background: centerMarks ? '#FFF0EB' : '#FFFFFF',
              border: centerMarks ? '1px solid #E4572E' : '1px solid #E2DED7',
              borderRadius: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <input 
              type="checkbox" 
              checked={centerMarks} 
              onChange={(e) => {
                setCenterMarks(e.target.checked);
                localStorage.setItem('fivenest_pref_center_marks', JSON.stringify(e.target.checked));
                window.dispatchEvent(new Event('storage-preference-changed'));
              }} 
              style={{ accentColor: '#E4572E', width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <p style={{ fontWeight: '800', fontSize: '13px', margin: 0, color: '#111827' }}>Print Center Marks</p>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4 }}>
                Adds vertical ticks at the top and bottom center of every jersey and sleeve panel for heat-press alignment.
              </p>
            </div>
          </label>

          <label 
            className={`checkbox-card ${sizeWatermarks ? 'checked' : ''}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              padding: '14px 16px', 
              margin: 0, 
              cursor: 'pointer',
              background: sizeWatermarks ? '#FFF0EB' : '#FFFFFF',
              border: sizeWatermarks ? '1px solid #E4572E' : '1px solid #E2DED7',
              borderRadius: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            <input 
              type="checkbox" 
              checked={sizeWatermarks} 
              onChange={(e) => {
                setSizeWatermarks(e.target.checked);
                localStorage.setItem('fivenest_pref_size_watermarks', JSON.stringify(e.target.checked));
                window.dispatchEvent(new Event('storage-preference-changed'));
              }} 
              style={{ accentColor: '#E4572E', width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
            />
            <div>
              <p style={{ fontWeight: '800', fontSize: '13px', margin: 0, color: '#111827' }}>Print Size Watermarks (Corners)</p>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4 }}>
                Adds Size text to top-left and Sleeve-Type to top-right corner of back panel for fast cutting identification.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

interface SizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseChange?: () => void;
}

export const SizesModal: React.FC<SizesModalProps> = ({ isOpen, onClose, onDatabaseChange }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(23,23,23,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '14px', width: '100%', maxWidth: '980px', maxHeight: '90vh', overflowY: 'auto', padding: '20px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: '#F3F0EA', border: '1px solid #E2DED7', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#171717', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
          title="Close modal"
        >
          ✕
        </button>
        <SizesDb onDatabaseChange={onDatabaseChange} />
      </div>
    </div>
  );
};

