import React, { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';

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

interface SizesDbProps {
  onDatabaseChange?: (db: SizeDatabase) => void;
}

export const SizesDb: React.FC<SizesDbProps> = ({ onDatabaseChange }) => {
  const [sizeDB, setSizeDB] = useState<SizeDatabase>(defaultSizes);
  const [selectedSize, setSelectedSize] = useState<string>("40");
  const [saveMessage, setSaveMessage] = useState<string>("");
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
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [gridSpacing, setGridSpacing] = useState<number>(2);

  // Load technical marks preferences from localStorage on mount
  useEffect(() => {
    const savedCenter = localStorage.getItem('fivenest_pref_center_marks');
    if (savedCenter !== null) {
      try {
        setCenterMarks(JSON.parse(savedCenter));
      } catch (e) {}
    } else {
      localStorage.setItem('fivenest_pref_center_marks', 'true');
    }

    const savedWater = localStorage.getItem('fivenest_pref_size_watermarks');
    if (savedWater !== null) {
      try {
        setSizeWatermarks(JSON.parse(savedWater));
      } catch (e) {}
    } else {
      localStorage.setItem('fivenest_pref_size_watermarks', 'true');
    }
    const savedRulers = localStorage.getItem('fivenest_pref_rulers');
    if (savedRulers) {
      try {
        setShowRulers(JSON.parse(savedRulers));
      } catch (e) {}
    }
    const savedGrid = localStorage.getItem('fivenest_pref_guideline_spacing');
    if (savedGrid) {
      try {
        setGridSpacing(JSON.parse(savedGrid));
      } catch (e) {}
    }
  }, []);

  // Dimensions state for the selected size in inputs
  const [frontW, setFrontW] = useState<number>(0);
  const [frontH, setFrontH] = useState<number>(0);
  const [backW, setBackW] = useState<number>(0);
  const [backH, setBackH] = useState<number>(0);
  const [halfW, setHalfW] = useState<number>(0);
  const [halfH, setHalfH] = useState<number>(0);
  const [fullW, setFullW] = useState<number>(0);
  const [fullH, setFullH] = useState<number>(0);
  const [rHalfW, setRHalfW] = useState<number>(0);
  const [rHalfH, setRHalfH] = useState<number>(0);
  const [rFullW, setRFullW] = useState<number>(0);
  const [rFullH, setRFullH] = useState<number>(0);
  const [nnW, setNnW] = useState<number>(0);
  const [nnH, setNnH] = useState<number>(0);

  // Load from localStorage on mount
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

  // Update inputs when selected size or database changes
  useEffect(() => {
    const config = sizeDB[selectedSize];
    if (config) {
      setFrontW(config.front.w);
      setFrontH(config.front.h);
      setBackW(config.back.w);
      setBackH(config.back.h);
      setHalfW(config.half.w);
      setHalfH(config.half.h);
      setFullW(config.full.w);
      setFullH(config.full.h);
      setRHalfW(config.rHalf.w);
      setRHalfH(config.rHalf.h);
      setRFullW(config.rFull.w);
      setRFullH(config.rFull.h);
      setNnW(config.nn.w);
      setNnH(config.nn.h);
    }
  }, [selectedSize, sizeDB]);

  const handleSaveSize = () => {
    const updated = {
      ...sizeDB,
      [selectedSize]: {
        front: { w: frontW, h: frontH },
        back: { w: backW, h: backH },
        half: { w: halfW, h: halfH },
        full: { w: fullW, h: fullH },
        rHalf: { w: rHalfW, h: rHalfH },
        rFull: { w: rFullW, h: rFullH },
        nn: { w: nnW, h: nnH }
      }
    };
    setSizeDB(updated);
    localStorage.setItem('teedex_size_database', JSON.stringify(updated));
    if (onDatabaseChange) onDatabaseChange(updated);
    
    setSaveMessage("Size " + selectedSize + " dimensions saved!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all size dimensions back to default factory settings?")) {
      setSizeDB(defaultSizes);
      localStorage.setItem('teedex_size_database', JSON.stringify(defaultSizes));
      if (onDatabaseChange) onDatabaseChange(defaultSizes);
      setSaveMessage("Database reset to defaults.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="sizes-db-container fade-in">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👕 Sublimation Grading Size Database
        </h2>
        <p className="form-label" style={{ marginBottom: '20px' }}>
          Define the precise fabric print dimensions in **inches** for each jersey panel size. 
          The rendering engine uses these measurements to auto-scale the jersey panels, sleeves, and collars to fit the size chosen for each player.
        </p>

        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '24px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Size to Edit:</label>
            <select 
              className="form-select" 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              {Object.keys(sizeDB).sort((a,b) => parseInt(a) - parseInt(b)).map(size => (
                <option key={size} value={size}>Size {size}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleSaveSize}>
              <Save size={16} /> Save Size {selectedSize}
            </button>
            <button className="btn btn-secondary" onClick={handleResetToDefault}>
              <RotateCcw size={16} /> Reset All Defaults
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className="status-tiny" style={{ color: 'var(--color-success)', fontWeight: 'bold', marginBottom: '16px' }}>
            {saveMessage}
          </div>
        )}

        <div className="grid-2">
          {/* Main Panel Dimensions */}
          <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--color-primary)' }}>
              Core Panels
            </h3>
            
            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Front Panel Width (in)</label>
                <input type="number" step="0.1" className="form-input" value={frontW} onChange={(e) => setFrontW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Front Panel Height (in)</label>
                <input type="number" step="0.1" className="form-input" value={frontH} onChange={(e) => setFrontH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Back Panel Width (in)</label>
                <input type="number" step="0.1" className="form-input" value={backW} onChange={(e) => setBackW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Back Panel Height (in)</label>
                <input type="number" step="0.1" className="form-input" value={backH} onChange={(e) => setBackH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Name & Number Print Width (in)</label>
                <input type="number" step="0.1" className="form-input" value={nnW} onChange={(e) => setNnW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Name & Number Print Height (in)</label>
                <input type="number" step="0.1" className="form-input" value={nnH} onChange={(e) => setNnH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Sleeve Panel Dimensions */}
          <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '16px', color: 'var(--color-secondary)' }}>
              Sleeve Panels (Standard & Raglan)
            </h3>

            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Half Sleeve Width (in)</label>
                <input type="number" step="0.1" className="form-input" value={halfW} onChange={(e) => setHalfW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Half Sleeve Height (in)</label>
                <input type="number" step="0.1" className="form-input" value={halfH} onChange={(e) => setHalfH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Sleeve Width (in)</label>
                <input type="number" step="0.1" className="form-input" value={fullW} onChange={(e) => setFullW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Sleeve Height (in)</label>
                <input type="number" step="0.1" className="form-input" value={fullH} onChange={(e) => setFullH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Raglan Half Sleeve W (in)</label>
                <input type="number" step="0.1" className="form-input" value={rHalfW} onChange={(e) => setRHalfW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Raglan Half Sleeve H (in)</label>
                <input type="number" step="0.1" className="form-input" value={rHalfH} onChange={(e) => setRHalfH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Raglan Full Sleeve W (in)</label>
                <input type="number" step="0.1" className="form-input" value={rFullW} onChange={(e) => setRFullW(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Raglan Full Sleeve H (in)</label>
                <input type="number" step="0.1" className="form-input" value={rFullH} onChange={(e) => setRFullH(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Alignment Marks & Corner Options */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
          🎯 Technical Alignment Marks Options
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Toggle cutting guide lines and print alignment annotations. These will draw directly onto the exported sublimation panels.
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px' }}>
          <label className={`checkbox-card ${centerMarks ? 'checked' : ''}`} style={{ flex: 1, margin: 0, padding: '12px' }}>
            <input 
              type="checkbox" 
              checked={centerMarks} 
              onChange={(e) => {
                setCenterMarks(e.target.checked);
                localStorage.setItem('fivenest_pref_center_marks', JSON.stringify(e.target.checked));
                window.dispatchEvent(new Event('storage-preference-changed'));
              }} 
            />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Print Center Marks</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Adds vertical ticks at the top and bottom center of every jersey/sleeve panel</p>
            </div>
          </label>

          <label className={`checkbox-card ${sizeWatermarks ? 'checked' : ''}`} style={{ flex: 1, margin: 0, padding: '12px' }}>
            <input 
              type="checkbox" 
              checked={sizeWatermarks} 
              onChange={(e) => {
                setSizeWatermarks(e.target.checked);
                localStorage.setItem('fivenest_pref_size_watermarks', JSON.stringify(e.target.checked));
                window.dispatchEvent(new Event('storage-preference-changed'));
              }} 
            />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Print Size Watermarks (Corners)</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Adds Size text to top-left and Sleeve-Type to top-right corner of back panel</p>
            </div>
          </label>

          <div className={`checkbox-card ${showRulers ? 'checked' : ''}`} style={{ flex: 1, margin: 0, padding: '12px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', margin: 0, padding: 0 }}>
              <input 
                type="checkbox" 
                checked={showRulers} 
                onChange={(e) => {
                  setShowRulers(e.target.checked);
                  localStorage.setItem('fivenest_pref_rulers', JSON.stringify(e.target.checked));
                  window.dispatchEvent(new Event('storage-preference-changed'));
                }} 
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
              />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Show Rulers & Guidelines</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Draw custom rulers and gridlines on panels</p>
              </div>
            </label>
            {showRulers && (
              <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grid Spacing:</span>
                <input 
                  type="number" 
                  min="0.5" 
                  max="10" 
                  step="0.5"
                  className="form-input"
                  style={{ width: '80px', padding: '4px 8px', fontSize: '11px', margin: 0 }}
                  value={gridSpacing}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 2;
                    setGridSpacing(val);
                    localStorage.setItem('fivenest_pref_guideline_spacing', JSON.stringify(val));
                    window.dispatchEvent(new Event('storage-preference-changed'));
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>inches</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Overview Table */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>📐 Database Overview (Inches)</h3>
        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Front (W x H)</th>
                <th>Back (W x H)</th>
                <th>Half Sleeve (W x H)</th>
                <th>Full Sleeve (W x H)</th>
                <th>Raglan Half (W x H)</th>
                <th>Raglan Full (W x H)</th>
                <th>A4 Back (W x H)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(sizeDB).sort((a,b) => parseInt(a) - parseInt(b)).map(size => {
                const conf = sizeDB[size];
                return (
                  <tr key={size} style={size === selectedSize ? { background: 'rgba(155, 77, 255, 0.08)' } : {}} onClick={() => setSelectedSize(size)}>
                    <td style={{ fontWeight: 'bold', cursor: 'pointer', color: 'var(--color-primary)' }}>{size}</td>
                    <td>{conf.front.w}" x {conf.front.h}"</td>
                    <td>{conf.back.w}" x {conf.back.h}"</td>
                    <td>{conf.half.w}" x {conf.half.h}"</td>
                    <td>{conf.full.w}" x {conf.full.h}"</td>
                    <td>{conf.rHalf.w}" x {conf.rHalf.h}"</td>
                    <td>{conf.rFull.w}" x {conf.rFull.h}"</td>
                    <td>{conf.nn.w}" x {conf.nn.h}"</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#14141a', border: '1px solid var(--border-light)', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        <SizesDb onDatabaseChange={onDatabaseChange} />
      </div>
    </div>
  );
};

