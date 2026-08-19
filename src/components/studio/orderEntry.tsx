import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Trash2, Edit2, CheckCircle2, Grid, FileSpreadsheet, Search, RotateCcw } from 'lucide-react';

export interface PlayerRecord {
  id: string;
  name: string;
  number: string;
  size: string;
  qty: number;
  sleeve: 'half' | 'full' | 'none';
}

export interface OrderMetadata {
  customerName: string;
  orderNum: string;
  blankKit: boolean;
  a4BackPrint: boolean;
  raglanStyle: boolean;
  halfSleeveMerge: boolean;
  manualMode: boolean;
}

interface OrderEntryProps {
  records: PlayerRecord[];
  onRecordsChange: (records: PlayerRecord[]) => void;
  metadata: OrderMetadata;
  onMetadataChange: (meta: OrderMetadata) => void;
  availableSizes: string[];
  onOpenSizeEditor?: () => void;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({
  records,
  onRecordsChange,
  metadata,
  onMetadataChange,
  availableSizes,
  onOpenSizeEditor
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Manual entry grid quantities (Photoshop plugin style)
  const [manualGrid, setManualGrid] = useState<{ [size: string]: { fb: number; half: number; full: number } }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize manual grid values
  useEffect(() => {
    const initGrid: typeof manualGrid = {};
    availableSizes.forEach(size => {
      initGrid[size] = { fb: 0, half: 0, full: 0 };
    });
    setManualGrid(initGrid);
  }, [availableSizes]);

  const updateMetadata = (fields: Partial<OrderMetadata>) => {
    onMetadataChange({ ...metadata, ...fields });
  };

  // CSV Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSV(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSV(e.target.files[0]);
    }
  };

  const processCSV = (file: File) => {
    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = (results.data as any[]).filter(row => row && Object.keys(row).length > 0);
        if (data.length === 0) {
          alert("The uploaded CSV file is empty.");
          return;
        }

        const rawKeys = Object.keys(data[0]);

        // Helper to score how well a column key matches a target field
        const scoreKey = (key: string, field: 'name' | 'number' | 'size' | 'sleeve' | 'qty'): number => {
          const k = key.toLowerCase().trim().replace(/[_\-\.]/g, ' ');

          // Negative penalties for conflicting system, file, and summary breakdown columns
          if (/^(filename|file name|file|file_name|filepath|path|total|total qty|total pcs|total quantity|total_qty|sum|summary|grand total)$/i.test(k)) {
            return -1000;
          }

          if (field === 'name') {
            if (/^(name|player name|player_name|player|players|athlete|member|person|student)$/i.test(k)) return 100;
            if (/^(cust name|customer name|client name)$/i.test(k)) return 80;
            if (/\b(player|athlete|person)\b/i.test(k)) return 70;
            if (/\bname\b/i.test(k) && !/file|team|batch|project|job|order|font|tag|sleeve|size|number|qty|no|front|half|full|total/i.test(k)) return 60;
            return -100;
          }

          if (field === 'number') {
            if (/^(number|jersey number|jersey num|jersey #|jersey no|jersey_no|player number|player no|kit number|back number|tshirt number|shirt number)$/i.test(k)) return 100;
            if (/^(no|no\.|num|#|jersey|tshirt no|shirt no)$/i.test(k)) return 90;
            if (/\b(jersey|kit|back)\b/i.test(k) && /\b(no|num|number|#)\b/i.test(k)) return 90;
            if (/^(sr|sr\.|sr no|sr\. no\.|serial|serial no|s\.no|s no|row|index)$/i.test(k)) return -500; // Ignore serial numbers
            if (/\b(number|num|#)\b/i.test(k) && !/sr|serial|order|batch|phone|mobile|contact|size|sleeve|qty|total|front|half|full/i.test(k)) return 50;
            return -100;
          }

          if (field === 'size') {
            if (/^(size|sizes|sz|jersey size|tshirt size|shirt size|garment size)$/i.test(k)) return 100;
            if (/^(chest|chest size|body size|sizing)$/i.test(k)) return 80;
            if (/^(front size|back size|tag size)$/i.test(k)) return -500; // Ignore summary table Front size column
            if (/\bsize\b/i.test(k) && !/font|text|tag|batch|file|name|number|sleeve|front|half|full|total/i.test(k)) return 70;
            return -100;
          }

          if (field === 'sleeve') {
            if (/^(sleeve type|sleeve style|sleeve|sleeves|sleeve_type|sleeve_style|slv type|slv style)$/i.test(k)) return 100;
            if (/^(slv|hand|hands|sleeve length|sleeve len)$/i.test(k)) return 80;
            if (/^(half sleeve|full sleeve|half|full)$/i.test(k)) return -500; // Ignore summary breakdown columns
            if (/\b(sleeve|slv)\b/i.test(k) && !/half sleeve|full sleeve/i.test(k)) return 70;
            return -100;
          }

          if (field === 'qty') {
            if (/^(qty|quantity|pcs|pieces|count|units)$/i.test(k) && !/total|sum|grand|front|half|full/i.test(k)) return 100;
            return -100;
          }

          return 0;
        };

        // Pick best matching key for each field based on highest positive score
        const getBestKey = (field: 'name' | 'number' | 'size' | 'sleeve' | 'qty'): string | null => {
          let bestKey: string | null = null;
          let bestScore = 0;
          for (const key of rawKeys) {
            const score = scoreKey(key, field);
            if (score > bestScore) {
              bestScore = score;
              bestKey = key;
            }
          }
          return bestKey;
        };

        let nameKey = getBestKey('name');
        let numKey = getBestKey('number');
        let sizeKey = getBestKey('size');
        let sleeveKey = getBestKey('sleeve');
        let qtyKey = getBestKey('qty');

        // Content-based heuristic validation fallback
        if (!sizeKey || !sleeveKey || !nameKey) {
          rawKeys.forEach(k => {
            if (/^(filename|file|total|front size|half sleeve|full sleeve|sr|serial)/i.test(k)) return;
            const sampleVals = data.slice(0, 10).map(r => String(r[k] || '').trim());
            
            // Check if column looks like Size values (e.g. 20, 22, 40, 42, S, M, L)
            if (!sizeKey) {
              const sizeLikeCount = sampleVals.filter(v => /^(18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|S|M|L|XL|2XL|XXL|3XL|4XL)$/i.test(v)).length;
              if (sizeLikeCount >= Math.min(2, sampleVals.length)) {
                sizeKey = k;
              }
            }

            // Check if column looks like Sleeve values (Half, Full, Sleeveless)
            if (!sleeveKey) {
              const sleeveLikeCount = sampleVals.filter(v => /^(half|full|none|short|long|fls|lhs|rhs|sleeveless|full hand|half hand)$/i.test(v)).length;
              if (sleeveLikeCount >= Math.min(2, sampleVals.length)) {
                sleeveKey = k;
              }
            }

            // Check if column looks like Player Names (contains letters, not pure numbers)
            if (!nameKey && k !== sizeKey && k !== sleeveKey && k !== numKey && k !== qtyKey) {
              const nameLikeCount = sampleVals.filter(v => /^[a-zA-Z\s\.\-]{2,}$/.test(v) && !/^(half|full|none|size)$/i.test(v)).length;
              if (nameLikeCount >= Math.min(2, sampleVals.length)) {
                nameKey = k;
              }
            }
          });
        }

        // Normalize letter sizes and numerical strings
        const normalizeSize = (rawSize: string): string => {
          if (!rawSize) return '40';
          const cleaned = rawSize.trim().toUpperCase();
          const letterMap: Record<string, string> = {
            'YS': '28', 'YM': '32', 'YL': '34',
            'S': '36', 'M': '38', 'L': '40', 'XL': '42',
            '2XL': '44', 'XXL': '44',
            '3XL': '46', 'XXXL': '46',
            '4XL': '48', 'XXXXL': '48',
            '5XL': '50', '6XL': '52'
          };
          if (letterMap[cleaned]) return letterMap[cleaned];
          const numMatch = cleaned.match(/\d+/);
          return numMatch ? numMatch[0] : (cleaned || '40');
        };

        // Normalize sleeve styles
        const normalizeSleeve = (rawSleeve: string): 'half' | 'full' | 'none' => {
          if (!rawSleeve) return 'half';
          const s = rawSleeve.toLowerCase().trim();
          if (s.includes('full') || s.includes('long') || s === 'fls' || s === 'fs' || s === 'full hand') return 'full';
          if (s.includes('none') || s.includes('blank') || s.includes('less') || s.includes('no') || s === 'zero' || s === 'vest') return 'none';
          return 'half';
        };

        const mappedRecords: PlayerRecord[] = [];
        data.forEach((row, index) => {
          const rawName = nameKey && row[nameKey] !== undefined ? String(row[nameKey]).trim() : '';
          const rawNum = numKey && row[numKey] !== undefined ? String(row[numKey]).trim() : '';
          const rawSize = sizeKey && row[sizeKey] !== undefined ? String(row[sizeKey]).trim() : '';
          const rawSleeve = sleeveKey && row[sleeveKey] !== undefined ? String(row[sleeveKey]).trim() : '';
          
          // In CSV roster import: each row is 1 player jersey piece (default 1)
          let qtyVal = 1;
          if (qtyKey && row[qtyKey] !== undefined) {
            const parsed = parseInt(String(row[qtyKey]).trim(), 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
              qtyVal = parsed;
            }
          }

          // Skip completely empty rows
          if (!rawName && !rawNum && !rawSize && !rawSleeve) return;

          // Clean blank placeholders (preserve intentional blanks as empty string)
          const cleanName = (rawName.toUpperCase() === 'BLANK' || rawName === '-' || rawName === 'N/A') ? '' : rawName;
          const cleanNum = (rawNum === '-' || rawNum === 'N/A') ? '' : rawNum;
          const sizeVal = rawSize ? normalizeSize(rawSize) : '40';
          const sleeveVal = normalizeSleeve(rawSleeve);

          mappedRecords.push({
            id: `csv-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: cleanName,
            number: cleanNum,
            size: sizeVal,
            qty: qtyVal,
            sleeve: sleeveVal
          });
        });

        if (mappedRecords.length === 0) {
          alert("No valid player records found in CSV.");
          return;
        }

        onRecordsChange(mappedRecords);
        alert(`Successfully imported ${mappedRecords.length} player records from ${file.name}`);
      },
      error: (error) => {
        console.error("CSV Parse Error", error);
        alert("Failed to parse CSV file. Ensure it is a valid format.");
      }
    });
  };

  // Convert manual quick size entry grid into PlayerRecords
  const handleGenerateFromGrid = () => {
    const newRecords: PlayerRecord[] = [];

    Object.keys(manualGrid).forEach(size => {
      const { fb, half, full } = manualGrid[size];
      
      // Full Jersey records (Front + Back + Half Sleeve) - the most common production case
      if (fb > 0) {
        newRecords.push({
          id: `manual-fb-${size}-${Date.now()}`,
          name: "BLANK",
          number: "",
          size: size,
          qty: fb,
          sleeve: 'half' // generates front, back, AND half sleeves together
        });
      }

      // Full sleeve jersey records (Front + Back + Full Sleeve)
      if (full > 0) {
        newRecords.push({
          id: `manual-full-${size}-${Date.now()}`,
          name: "BLANK",
          number: "",
          size: size,
          qty: full,
          sleeve: 'full' // generates front, back, AND full sleeves together
        });
      }

      // Sleeve-only records (only sleeve panels, no front/back)
      if (half > 0) {
        newRecords.push({
          id: `manual-half-${size}-${Date.now()}`,
          name: "SLEEVE",
          number: "",
          size: size,
          qty: half,
          sleeve: 'half'
        });
      }
    });

    if (newRecords.length === 0) {
      alert("Please enter quantities in the grid first.");
      return;
    }

    if (records.length > 0) {
      const shouldAppend = window.confirm(
        `You currently have ${records.length} items in your order roster.\n\nClick "OK" to APPEND the new grid quantities to your roster, or "Cancel" to REPLACE your roster.`
      );
      if (shouldAppend) {
        onRecordsChange([...records, ...newRecords]);
        alert(`Appended ${newRecords.length} batch sizing panels to existing roster.`);
        return;
      }
    }

    onRecordsChange(newRecords);
    alert(`Generated ${newRecords.length} batch sizing panels from Quick Size Entry.`);
  };

  const handleManualGridChange = (size: string, type: 'fb' | 'half' | 'full', value: string) => {
    const val = parseInt(value) || 0;
    setManualGrid(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        [type]: val
      }
    }));
  };

  const handleClearGrid = () => {
    const cleared: typeof manualGrid = {};
    availableSizes.forEach(size => {
      cleared[size] = { fb: 0, half: 0, full: 0 };
    });
    setManualGrid(cleared);
  };

  // Inline table edit actions
  const handleAddRow = () => {
    const newRow: PlayerRecord = {
      id: `man-row-${Date.now()}`,
      name: "NEW PLAYER",
      number: "99",
      size: availableSizes.includes("40") ? "40" : availableSizes[0] || "40",
      qty: 1,
      sleeve: 'half'
    };
    onRecordsChange([...records, newRow]);
    setEditingRowId(newRow.id);
  };

  const handleDeleteRow = (id: string) => {
    onRecordsChange(records.filter(r => r.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof PlayerRecord, value: any) => {
    onRecordsChange(records.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="order-entry-container fade-in">
      {/* Unified Compact Job Header & Controls */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        {/* Row 1: Job Identification & Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 360px' }}>
            <div style={{ flex: '2 1 200px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Customer / Team
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '5px 10px', fontSize: '13px', height: '32px' }}
                placeholder="e.g. Red Wings FC" 
                value={metadata.customerName}
                onChange={(e) => updateMetadata({ customerName: e.target.value })}
                title="Customer name used for output folder prefixes"
              />
            </div>
            <div style={{ flex: '1 1 100px', maxWidth: '140px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Order #
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '5px 10px', fontSize: '13px', height: '32px' }}
                placeholder="01" 
                value={metadata.orderNum}
                onChange={(e) => updateMetadata({ orderNum: e.target.value })}
                title="Order index identifier prefix"
              />
            </div>
          </div>

          {/* Segmented Mode Selector & Size Grading Editor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {onOpenSizeEditor && (
              <button
                type="button"
                onClick={onOpenSizeEditor}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  background: 'rgba(0, 229, 255, 0.1)',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)',
                  transition: 'all 0.15s ease'
                }}
                title="Open Size Grading Editor to customize dimensions and manage size presets"
              >
                📐 Size Grading Editor
              </button>
            )}

            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)', gap: '4px' }}>
              <button
                type="button"
                onClick={() => updateMetadata({ manualMode: false })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: !metadata.manualMode ? 'var(--color-primary)' : 'transparent',
                  color: !metadata.manualMode ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileSpreadsheet size={14} /> CSV Import
              </button>
              <button
                type="button"
                onClick={() => updateMetadata({ manualMode: true })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: metadata.manualMode ? 'var(--color-secondary)' : 'transparent',
                  color: metadata.manualMode ? '#000000' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Grid size={14} /> Quick Size Entry
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Compact CSV Upload Strip or Quick Grid */}
        {/* Row 2: Prominent "Start Here" CSV Upload Strip or Quick Grid */}
        {!metadata.manualMode ? (
          <div 
            className={`file-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              padding: '12px 18px', 
              minHeight: '52px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px',
              background: csvFile 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)' 
                : 'linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(66, 133, 244, 0.16) 100%)',
              border: dragActive 
                ? '2px dashed var(--accent-cyan)' 
                : csvFile 
                  ? '1.5px solid rgba(34, 197, 94, 0.55)' 
                  : '1.5px dashed rgba(0, 229, 255, 0.65)',
              borderRadius: '10px',
              boxShadow: csvFile 
                ? '0 0 20px rgba(34, 197, 94, 0.15)' 
                : '0 4px 22px rgba(0, 229, 255, 0.15), inset 0 0 16px rgba(0, 229, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".csv" 
              style={{ display: 'none' }} 
            />
            
            {/* Left: Glowing Icon Badge + Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: csvFile ? 'rgba(34, 197, 94, 0.2)' : 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(66,133,244,0.25))',
                border: csvFile ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(0,229,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: csvFile ? '0 0 10px rgba(34,197,94,0.3)' : '0 0 14px rgba(0,229,255,0.4)'
              }}>
                <Upload size={20} style={{ color: csvFile ? '#4ade80' : 'var(--accent-cyan)' }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: csvFile ? '#4ade80' : '#ffffff', letterSpacing: '0.02em' }}>
                    {csvFile ? `✅ Loaded: ${csvFile.name}` : "🚀 Start Here: Upload Production CSV (Drag & Drop or Click)"}
                  </span>
                  {!csvFile && (
                    <span style={{ fontSize: '10px', background: 'rgba(0,229,255,0.25)', color: 'var(--accent-cyan)', padding: '2px 7px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Main Action
                    </span>
                  )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: csvFile ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.65)' }}>
                  {csvFile ? "File parsed successfully into Job Data Sheet below" : "Auto-detects Name, Number, Size, and Sleeve Type from Excel / Google Sheets exports"}
                </p>
              </div>
            </div>

            {/* Right: Prominent Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  padding: '6px 14px', 
                  fontSize: '12px', 
                  fontWeight: '700',
                  background: csvFile 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'linear-gradient(135deg, #00e5ff 0%, #00b4d8 100%)',
                  color: csvFile ? '#4ade80' : '#000000',
                  border: csvFile ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
                  borderRadius: '6px',
                  boxShadow: csvFile ? 'none' : '0 2px 10px rgba(0, 229, 255, 0.35)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {csvFile ? "Replace CSV" : "📂 Choose CSV File"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.32)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            {/* Header bar with title, live summary badges, and actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Grid size={16} /> Quick Size Entry (All Sizes 18 to 60)
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                  Total Entered: <strong style={{ color: '#00e5ff' }}>{Object.values(manualGrid).reduce((acc, v) => acc + (v.fb || 0) + (v.full || 0) + (v.half || 0), 0)} pcs</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {onOpenSizeEditor && (
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', borderColor: 'rgba(0,229,255,0.35)' }} 
                    onClick={onOpenSizeEditor}
                    title="Open Size Grading Editor to customize size dimensions and presets"
                  >
                    📐 Edit Sizes & Presets
                  </button>
                )}
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleClearGrid}>
                  Clear All
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '4px 14px', 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    background: 'linear-gradient(135deg, var(--color-secondary), #00b4d8)', 
                    color: '#000',
                    boxShadow: '0 2px 8px rgba(0, 229, 255, 0.3)'
                  }} 
                  onClick={handleGenerateFromGrid}
                >
                  ⚡ Load into Panel Order
                </button>
              </div>
            </div>
            
            {/* Dual Column Grid: Left (18-38) | Right (40-60) - All 22 sizes on screen simultaneously */}
            {(() => {
              const allSizesSorted = (availableSizes.length > 0 
                ? [...availableSizes] 
                : ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"]
              ).sort((a,b) => parseInt(a) - parseInt(b));
              const mid = Math.ceil(allSizesSorted.length / 2);
              const leftSizes = allSizesSorted.slice(0, mid);
              const rightSizes = allSizesSorted.slice(mid);

              const renderSizeTable = (sizes: string[], groupLabel: string) => (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {groupLabel}
                  </div>
                  <table className="custom-table" style={{ fontSize: '11px', width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <th style={{ padding: '6px 8px', fontSize: '10px', width: '60px', color: 'var(--text-muted)' }}>Size</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#4ade80', fontSize: '10px' }}>Half Sleeve</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#60a5fa', fontSize: '10px' }}>Full Sleeve</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#f59e0b', fontSize: '10px' }}>Sleeve Only</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map(size => (
                        <tr key={size} style={{ height: '26px' }}>
                          <td style={{ padding: '3px 8px', fontWeight: '800', color: 'var(--color-secondary)', fontSize: '11px' }}>
                            Size {size}
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.fb || ''} 
                              onChange={(e) => handleManualGridChange(size, 'fb', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', fontWeight: '700', borderRadius: '4px', textAlign: 'center', padding: '2px 4px', fontSize: '11px' }}
                            />
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.full || ''} 
                              onChange={(e) => handleManualGridChange(size, 'full', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa', fontWeight: '700', borderRadius: '4px', textAlign: 'center', padding: '2px 4px', fontSize: '11px' }}
                            />
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.half || ''} 
                              onChange={(e) => handleManualGridChange(size, 'half', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', fontWeight: '700', borderRadius: '4px', textAlign: 'center', padding: '2px 4px', fontSize: '11px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                  {renderSizeTable(leftSizes, `Youth & Standard Sizes (Size ${leftSizes[0]} – ${leftSizes[leftSizes.length - 1]})`)}
                  {renderSizeTable(rightSizes, `Adult & Plus Sizes (Size ${rightSizes[0]} – ${rightSizes[rightSizes.length - 1]})`)}
                </div>
              );
            })()}
          </div>
        )}

        {/* Row 3: Sublimation Panel Rendering Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sublimation:</span>
          
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: metadata.halfSleeveMerge ? '#00e5ff' : 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={metadata.halfSleeveMerge} 
              onChange={() => updateMetadata({ halfSleeveMerge: !metadata.halfSleeveMerge })} 
            />
            <span>Half-Sleeve Merge</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: metadata.blankKit ? 'var(--color-primary)' : 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={metadata.blankKit} 
              onChange={() => updateMetadata({ blankKit: !metadata.blankKit })} 
            />
            <span>Blank Kit</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: metadata.a4BackPrint ? 'var(--color-secondary)' : 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={metadata.a4BackPrint} 
              onChange={() => updateMetadata({ a4BackPrint: !metadata.a4BackPrint })} 
            />
            <span>A4 Print (10×11")</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: metadata.raglanStyle ? '#bb86fc' : 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={metadata.raglanStyle} 
              onChange={() => updateMetadata({ raglanStyle: !metadata.raglanStyle })} 
            />
            <span>Raglan Style</span>
          </label>
        </div>
      </div>

      {/* 4. Order Table details */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>📋 Step 2: Job Details & Excel Data</h3>
            <span style={{ fontSize: '11px', background: 'rgba(66,133,244,0.15)', color: '#8ab4f8', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
              {records.length} {records.length === 1 ? 'Row' : 'Rows'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {records.length > 5 && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Filter by name, #, size..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '4px 8px 4px 28px', fontSize: '12px', width: '180px', height: '30px' }}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    style={{ position: 'absolute', right: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {records.length > 0 && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '5px 10px', fontSize: '12px' }} 
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all rows from the roster?")) {
                    onRecordsChange([]);
                  }
                }}
                title="Clear all rows"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}

            <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={handleAddRow}>
              <Plus size={14} /> Add Row
            </button>
          </div>
        </div>

        {records.length > 0 ? (
          <>
            <div className="sheets-scroll-container">
              <table className="custom-table sheets-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}></th>
                    <th><span className="sheets-col-letter">A</span>Player Name</th>
                    <th><span className="sheets-col-letter">B</span>Number</th>
                    <th><span className="sheets-col-letter">C</span>Size</th>
                    <th><span className="sheets-col-letter">D</span>Sleeve Style</th>
                    <th><span className="sheets-col-letter">E</span>Qty</th>
                    <th><span className="sheets-col-letter">F</span>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(searchTerm.trim() ? records.filter(r => 
                    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    r.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    r.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.sleeve.toLowerCase().includes(searchTerm.toLowerCase())
                  ) : records).map((record, index) => (
                    <tr key={record.id}>
                      <td className="sheets-row-num">{index + 1}</td>
                      <td>
                        {editingRowId === record.id ? (
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '13px' }}
                            placeholder="Leave blank for none"
                            value={record.name}
                            onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                          />
                        ) : (
                          record.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>— (Blank)</span>
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }}
                            placeholder="—"
                            value={record.number}
                            onChange={(e) => handleFieldChange(record.id, 'number', e.target.value)}
                          />
                        ) : (
                          record.number || <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '90px' }}
                            value={record.size}
                            onChange={(e) => handleFieldChange(record.id, 'size', e.target.value)}
                          >
                            {availableSizes.map(s => <option key={s} value={s}>Size {s}</option>)}
                          </select>
                        ) : (
                          `Size ${record.size}`
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '100px' }}
                            value={record.sleeve}
                            onChange={(e) => handleFieldChange(record.id, 'sleeve', e.target.value)}
                          >
                            <option value="half">Half Sleeve</option>
                            <option value="full">Full Sleeve</option>
                            <option value="none">No Sleeve</option>
                          </select>
                        ) : (
                          record.sleeve === 'half' ? 'Half Sleeve' : record.sleeve === 'full' ? 'Full Sleeve' : 'None'
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <input 
                            type="number" 
                            min="1" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }}
                            value={record.qty}
                            onChange={(e) => handleFieldChange(record.id, 'qty', parseInt(e.target.value) || 1)}
                          />
                        ) : (
                          record.qty
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editingRowId === record.id ? (
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditingRowId(null)}>Done</button>
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditingRowId(record.id)}><Edit2 size={12} /></button>
                          )}
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleDeleteRow(record.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sheets-summary-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Total Rows: <strong>{records.length}</strong></span>
                {searchTerm && (
                  <span style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>
                    (Filtered: {records.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.number.toLowerCase().includes(searchTerm.toLowerCase()) || r.size.toLowerCase().includes(searchTerm.toLowerCase())).length})
                  </span>
                )}
                <span>|</span>
                <span>Total Jersey Qty: <strong style={{ color: '#4ade80' }}>{records.reduce((acc, r) => acc + r.qty, 0)}</strong></span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                💡 Scroll to browse all {records.length} records
              </span>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Order list is empty. Add a manual row or import a CSV file to get started.
          </div>
        )}
      </div>
    </div>
  );
};
