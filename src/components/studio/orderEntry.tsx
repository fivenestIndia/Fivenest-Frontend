import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Trash2, Edit2, CheckCircle2, Grid, FileSpreadsheet, Search, RotateCcw, Zap, ArrowDown, HelpCircle } from 'lucide-react';

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
  whatsapp?: string;
  fileName?: string;
  rate?: number;
  designCharges?: number;
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

  const loadXLSX = (): Promise<any> => {
    if ((window as any).XLSX) return Promise.resolve((window as any).XLSX);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = () => resolve((window as any).XLSX);
      script.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        fallback.onload = () => resolve((window as any).XLSX);
        fallback.onerror = reject;
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleParsedData = (data: any[], fileName: string) => {
    const validRows = data.filter(row => row && Object.keys(row).length > 0);
    if (validRows.length === 0) {
      alert("The uploaded file contains no data rows.");
      return;
    }

    const rawKeys = Object.keys(validRows[0]);

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
        if (/^(qty|quantity|count|pieces|pcs|total pcs)$/i.test(k)) return 100;
        return -100;
      }

      return 0;
    };

    const getBestKey = (field: 'name' | 'number' | 'size' | 'sleeve' | 'qty'): string | null => {
      let bestKey: string | null = null;
      let highestScore = 0;

      rawKeys.forEach(k => {
        const score = scoreKey(k, field);
        if (score > highestScore) {
          highestScore = score;
          bestKey = k;
        }
      });

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
        const sampleVals = validRows.slice(0, 10).map(r => String(r[k] || '').trim());
        
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
        'XS': '36',
        'S': '38', 'M': '40', 'L': '42', 'XL': '44',
        '2XL': '46', 'XXL': '46',
        '3XL': '48', 'XXXL': '48',
        '4XL': '50', 'XXXXL': '50',
        '5XL': '52', '6XL': '54',
        '7XL': '56', '8XL': '58', '9XL': '60'
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
    validRows.forEach((row, index) => {
      const rawName = nameKey && row[nameKey] !== undefined ? String(row[nameKey]).trim() : '';
      const rawNum = numKey && row[numKey] !== undefined ? String(row[numKey]).trim() : '';
      const rawSize = sizeKey && row[sizeKey] !== undefined ? String(row[sizeKey]).trim() : '';
      const rawSleeve = sleeveKey && row[sleeveKey] !== undefined ? String(row[sleeveKey]).trim() : '';
      
      // In roster import: each row is 1 player jersey piece (default 1)
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
      // Strip leading '#' tag if present before number
      const cleanNum = (rawNum === '-' || rawNum === 'N/A') ? '' : rawNum.replace(/^#\s*/, '').trim();
      const sizeVal = rawSize ? normalizeSize(rawSize) : '40';
      const sleeveVal = normalizeSleeve(rawSleeve);

      mappedRecords.push({
        id: `row-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: cleanName,
        number: cleanNum,
        size: sizeVal,
        qty: qtyVal,
        sleeve: sleeveVal
      });
    });

    if (mappedRecords.length === 0) {
      alert("No valid player records found in file.");
      return;
    }

    if (fileName) {
      updateMetadata({ fileName: fileName.replace(/\.[^/.]+$/, "") });
    }
    onRecordsChange(mappedRecords);
    alert(`Successfully imported ${mappedRecords.length} player records from ${fileName}`);
  };

  const processFile = async (file: File) => {
    setCsvFile(file);
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');

    if (isExcel) {
      try {
        const XLSX = await loadXLSX();
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            handleParsedData(results.data as any[], file.name);
          },
          error: (error) => {
            console.error("Excel to CSV Parse Error", error);
            alert("Failed to parse sheet content. Please check file formatting or export as CSV.");
          }
        });
      } catch (err) {
        console.error("Excel load error", err);
        alert("Could not load Excel file parser. Please save the sheet as CSV or check your internet connection.");
      }
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        handleParsedData(results.data as any[], file.name);
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

  const totalGridPcs = Object.values(manualGrid).reduce((acc, v) => acc + (v.fb || 0) + (v.full || 0) + (v.half || 0), 0);

  return (
    <div className="order-entry-container fade-in">
      {/* Unified Compact Job Header & Controls */}
      <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        {/* Row 1: Job Identification & Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 500px', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 180px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151', display: 'block' }}>
                Customer / Team
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 12px', fontSize: '13px', height: '36px', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', background: '#FFFFFF', width: '100%' }}
                placeholder="e.g. Deep Textile / Blue Dragon" 
                value={metadata.customerName}
                onChange={(e) => updateMetadata({ customerName: e.target.value })}
                title="Customer name used for output folder prefixes and billing"
              />
            </div>
            <div style={{ flex: '1 1 80px', maxWidth: '100px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151', display: 'block' }}>
                Order #
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 12px', fontSize: '13px', height: '36px', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', background: '#FFFFFF', width: '100%' }}
                placeholder="01" 
                value={metadata.orderNum}
                onChange={(e) => updateMetadata({ orderNum: e.target.value })}
                title="Order index identifier prefix"
              />
            </div>
            <div style={{ flex: '1.5 1 140px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151', display: 'block' }}>
                WhatsApp No
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 12px', fontSize: '13px', height: '36px', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', background: '#FFFFFF', width: '100%' }}
                placeholder="e.g. 9664090039" 
                value={metadata.whatsapp || ''}
                onChange={(e) => updateMetadata({ whatsapp: e.target.value })}
                title="Customer WhatsApp number for payment link and bill dispatch"
              />
            </div>
            <div style={{ flex: '2 1 180px' }}>
              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151', display: 'block' }}>
                File / Design Name
              </label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '6px 12px', fontSize: '13px', height: '36px', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', background: '#FFFFFF', width: '100%' }}
                placeholder="e.g. Blue Dragon XI" 
                value={metadata.fileName || ''}
                onChange={(e) => updateMetadata({ fileName: e.target.value })}
                title="Design / CSV reference name for Invoice & Bill"
              />
            </div>
          </div>

          {/* Segmented Mode Selector & Size Grading Editor */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            {onOpenSizeEditor && (
              <button
                type="button"
                onClick={onOpenSizeEditor}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  color: '#374151',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
                title="Open Size Grading Editor to customize dimensions and manage size presets"
              >
                📐 Size Grading Editor
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                marginBottom: '4px', 
                color: '#6B7280', 
                textTransform: 'uppercase', 
                letterSpacing: '0.04em',
                display: 'block'
              }}>
                Files supported : CSV & Excelsheet
              </span>
              <div style={{ display: 'inline-flex', background: '#F3F0EA', padding: '3px', borderRadius: '8px', border: '1px solid #E2DED7', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => updateMetadata({ manualMode: false })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: !metadata.manualMode ? '#E4572E' : 'transparent',
                    color: !metadata.manualMode ? '#ffffff' : '#6B7280',
                    boxShadow: !metadata.manualMode ? '0 2px 6px rgba(228, 87, 46, 0.28)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileSpreadsheet size={14} /> Import name & number Data
                </button>
                <button
                  type="button"
                  onClick={() => updateMetadata({ manualMode: true })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: metadata.manualMode ? '#E4572E' : 'transparent',
                    color: metadata.manualMode ? '#ffffff' : '#6B7280',
                    boxShadow: metadata.manualMode ? '0 2px 6px rgba(228, 87, 46, 0.28)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Grid size={14} /> Quick Size Entry
                </button>
              </div>
            </div>
          </div>
        </div>

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
              padding: '16px 20px', 
              minHeight: '64px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px',
              background: csvFile 
                ? '#F0FDF4' 
                : (dragActive ? '#FFF0EB' : '#FAF8F5'),
              border: dragActive 
                ? '2px dashed #E4572E' 
                : csvFile 
                  ? '1.5px solid #86EFAC' 
                  : '2px dashed #E4572E',
              borderRadius: '12px',
              boxShadow: csvFile 
                ? '0 2px 10px rgba(34, 197, 94, 0.1)' 
                : '0 2px 12px rgba(228, 87, 46, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              style={{ display: 'none' }} 
            />
            
            {/* Left: Glowing Icon Badge + Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: csvFile ? '#DCFCE7' : '#FFF0EB',
                border: csvFile ? '1px solid #86EFAC' : '1px solid #FCD7C8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: csvFile ? '0 2px 8px rgba(34,197,94,0.15)' : '0 2px 8px rgba(228,87,46,0.15)'
              }}>
                <Upload size={22} style={{ color: csvFile ? '#16A34A' : '#E4572E' }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: csvFile ? '#166534' : '#111827', letterSpacing: '-0.01em' }}>
                    {csvFile ? `✅ Loaded: ${csvFile.name}` : "🚀 Import name & number Data"}
                  </span>
                  {!csvFile && (
                    <span style={{ fontSize: '10px', background: '#FFF0EB', color: '#E4572E', border: '1px solid #FCD7C8', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                      Files supported : CSV & Excelsheet
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: '500', color: csvFile ? '#15803D' : '#4B5563' }}>
                  {csvFile ? "File parsed successfully into Job Data Sheet below" : "Auto-detects Name, Number, Size, and Sleeve Type from CSV or Excel (.xlsx, .xls) files"}
                </p>
              </div>
            </div>

            {/* Right: Prominent Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '12px', 
                  fontWeight: '700',
                  background: csvFile 
                    ? '#DCFCE7' 
                    : '#E4572E',
                  color: csvFile ? '#15803D' : '#FFFFFF',
                  border: csvFile ? '1px solid #86EFAC' : 'none',
                  borderRadius: '8px',
                  boxShadow: csvFile ? 'none' : '0 2px 10px rgba(228, 87, 46, 0.3)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {csvFile ? "Replace File" : "📂 Choose File (CSV & Excelsheet)"}
              </button>
            </div>
          </div>

        ) : (
          <div style={{ marginTop: '12px', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E8E4DE', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            {/* Header bar with title, live summary badges, and actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Grid size={16} style={{ color: '#E4572E' }} /> Quick Size Entry (All Sizes 18 to 60)
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  background: '#FFF0EB', 
                  border: '1px solid #FCD7C8', 
                  padding: '3px 10px', 
                  borderRadius: '12px', 
                  color: '#C2410C',
                  fontWeight: '700'
                }}>
                  Total Entered: <strong style={{ color: '#E4572E' }}>{totalGridPcs} pcs</strong>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '5px 12px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: '#4B5563', 
                    borderColor: '#D1D5DB',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }} 
                  onClick={handleClearGrid}
                  title="Reset all size quantities in this grid to 0"
                >
                  <RotateCcw size={12} /> Clear All
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
                <div style={{ background: '#FAF8F5', borderRadius: '10px', border: '1px solid #E8E4DE', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F3F0EA', borderBottom: '1px solid #E8E4DE' }}>
                    {groupLabel}
                  </div>
                  <table className="custom-table" style={{ fontSize: '11px', width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9F8F6', borderBottom: '1px solid #E8E4DE' }}>
                        <th style={{ padding: '6px 10px', fontSize: '11px', width: '70px', color: '#6B7280', fontWeight: '700', textAlign: 'left' }}>Size</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#16A34A', fontSize: '11px', fontWeight: '700' }}>Half Sleeve</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#2563EB', fontSize: '11px', fontWeight: '700' }}>Full Sleeve</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#D97706', fontSize: '11px', fontWeight: '700' }}>Sleeve Only</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map(size => (
                        <tr key={size} style={{ height: '30px', borderBottom: '1px solid #EFECE6' }}>
                          <td style={{ padding: '4px 10px', fontWeight: '700', color: '#111827', fontSize: '12px' }}>
                            Size {size}
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.fb || ''} 
                              onChange={(e) => handleManualGridChange(size, 'fb', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#16A34A', fontWeight: '700', borderRadius: '6px', textAlign: 'center', padding: '3px 4px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.full || ''} 
                              onChange={(e) => handleManualGridChange(size, 'full', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#2563EB', fontWeight: '700', borderRadius: '6px', textAlign: 'center', padding: '3px 4px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0"
                              value={manualGrid[size]?.half || ''} 
                              onChange={(e) => handleManualGridChange(size, 'half', e.target.value)}
                              style={{ width: '100%', maxWidth: '64px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#D97706', fontWeight: '700', borderRadius: '6px', textAlign: 'center', padding: '3px 4px', fontSize: '12px' }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E8E4DE' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sublimation:</span>
          
          <label style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: '700', 
            padding: '4px 10px',
            borderRadius: '6px',
            border: metadata.halfSleeveMerge ? '1px solid #E4572E' : '1px solid #E2DED7',
            background: metadata.halfSleeveMerge ? '#FFF0EB' : '#FFFFFF',
            color: metadata.halfSleeveMerge ? '#E4572E' : '#4B5563',
            transition: 'all 0.15s ease'
          }}>
            <input 
              type="checkbox" 
              checked={metadata.halfSleeveMerge} 
              onChange={() => updateMetadata({ halfSleeveMerge: !metadata.halfSleeveMerge })} 
              style={{ accentColor: '#E4572E', cursor: 'pointer' }}
            />
            <span>Half-Sleeve Merge</span>
          </label>

          <label style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: '700', 
            padding: '4px 10px',
            borderRadius: '6px',
            border: metadata.blankKit ? '1px solid #E4572E' : '1px solid #E2DED7',
            background: metadata.blankKit ? '#FFF0EB' : '#FFFFFF',
            color: metadata.blankKit ? '#E4572E' : '#4B5563',
            transition: 'all 0.15s ease'
          }}>
            <input 
              type="checkbox" 
              checked={metadata.blankKit} 
              onChange={() => updateMetadata({ blankKit: !metadata.blankKit })} 
              style={{ accentColor: '#E4572E', cursor: 'pointer' }}
            />
            <span>Blank Kit</span>
          </label>

          <label style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: '700', 
            padding: '4px 10px',
            borderRadius: '6px',
            border: metadata.a4BackPrint ? '1px solid #E4572E' : '1px solid #E2DED7',
            background: metadata.a4BackPrint ? '#FFF0EB' : '#FFFFFF',
            color: metadata.a4BackPrint ? '#E4572E' : '#4B5563',
            transition: 'all 0.15s ease'
          }}>
            <input 
              type="checkbox" 
              checked={metadata.a4BackPrint} 
              onChange={() => updateMetadata({ a4BackPrint: !metadata.a4BackPrint })} 
              style={{ accentColor: '#E4572E', cursor: 'pointer' }}
            />
            <span>A4 Print (10×11")</span>
          </label>

          <label style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: '700', 
            padding: '4px 10px',
            borderRadius: '6px',
            border: metadata.raglanStyle ? '1px solid #E4572E' : '1px solid #E2DED7',
            background: metadata.raglanStyle ? '#FFF0EB' : '#FFFFFF',
            color: metadata.raglanStyle ? '#E4572E' : '#4B5563',
            transition: 'all 0.15s ease'
          }}>
            <input 
              type="checkbox" 
              checked={metadata.raglanStyle} 
              onChange={() => updateMetadata({ raglanStyle: !metadata.raglanStyle })} 
              style={{ accentColor: '#E4572E', cursor: 'pointer' }}
            />
            <span>Raglan Style</span>
          </label>
        </div>

        {/* Quick Size Entry: Big Action Button + "How to Use It" Guide */}
        {metadata.manualMode && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E8E4DE' }}>
            {/* 1. Prominent Large "Load into Panel Order" Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={handleGenerateFromGrid}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '480px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  background: totalGridPcs > 0
                    ? 'linear-gradient(135deg, #E4572E 0%, #EA580C 100%)'
                    : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(228, 87, 46, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 22px rgba(228, 87, 46, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(228, 87, 46, 0.35)';
                }}
              >
                <Zap size={18} style={{ fill: '#FFFFFF' }} />
                <span>⚡ Load into Panel Order {totalGridPcs > 0 ? `(${totalGridPcs} Pieces)` : ''}</span>
                <ArrowDown size={18} />
              </button>
              
              <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {totalGridPcs > 0 ? (
                  <span style={{ color: '#15803D', fontWeight: '700' }}>
                    ✓ {totalGridPcs} pieces configured across entered sizes. Click above to populate the Job Details roster below.
                  </span>
                ) : (
                  <span>
                    Enter jersey quantities in the size tables above, then click this button to generate the cut panel roster.
                  </span>
                )}
              </div>
            </div>

            {/* 2. "How to use it" Guide Box */}
            <div style={{
              background: '#FAF8F5',
              border: '1px solid #E8E4DE',
              borderRadius: '10px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HelpCircle size={16} style={{ color: '#E4572E' }} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>
                  How to Use Quick Size Entry
                </span>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>
                  • Quick 3-step workflow
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {/* Step 1 */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E5E1D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFF0EB',
                      color: '#E4572E',
                      fontWeight: '800',
                      fontSize: '11px'
                    }}>1</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                      Enter Size Quantities
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#4B5563', lineHeight: 1.5 }}>
                    Type piece quantities per size (18 to 60) under <strong>Half Sleeve</strong> (full jersey), <strong>Full Sleeve</strong>, or <strong>Sleeve Only</strong>.
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E5E1D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFF0EB',
                      color: '#E4572E',
                      fontWeight: '800',
                      fontSize: '11px'
                    }}>2</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                      Select Sublimation Options
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#4B5563', lineHeight: 1.5 }}>
                    Toggle <strong>Half-Sleeve Merge</strong> (merge L+R sleeves), <strong>Blank Kit</strong> (plain jerseys), <strong>A4 Print</strong>, or <strong>Raglan Style</strong> above as needed.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E5E1D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#FFF0EB',
                      color: '#E4572E',
                      fontWeight: '800',
                      fontSize: '11px'
                    }}>3</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                      Load into Panel Order
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#4B5563', lineHeight: 1.5 }}>
                    Click the <strong>Load into Panel Order</strong> button above. All cut panels populate into <strong>Step 2: Job Details</strong> below, ready for auto-nesting and export.
                  </p>
                </div>
              </div>

              {/* Helpful Hint Footer */}
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #EFECE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '11px',
                color: '#6B7280'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📐 <strong>Custom Dimensions?</strong> Click <strong>Size Grading Editor</strong> in the top-right toolbar to adjust chest, length, or sleeve width.
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔄 <strong>Reset Counts:</strong> Use the <strong>Clear All</strong> button at the top right of the grid to reset all numbers.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Order Table details */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Step 2: Job Details & Excel Data
            </h3>
            <span style={{ fontSize: '11px', background: '#FFF0EB', color: '#C2410C', border: '1px solid #FCD7C8', padding: '3px 10px', borderRadius: '12px', fontWeight: '800' }}>
              {records.length} {records.length === 1 ? 'Row' : 'Rows'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {records.length > 5 && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#9CA3AF' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Filter by name, #, size..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '4px 10px 4px 30px', fontSize: '12px', width: '190px', height: '32px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827' }}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {records.length > 0 && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px', color: '#DC2626', borderColor: '#FECACA' }} 
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all rows from the roster?")) {
                    onRecordsChange([]);
                  }
                }}
                title="Clear all rows"
              >
                <Trash2 size={13} /> Clear All
              </button>
            )}

            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', background: '#E4572E', color: '#FFFFFF', border: 'none', borderRadius: '8px', boxShadow: '0 2px 8px rgba(228,87,46,0.25)' }} 
              onClick={handleAddRow}
            >
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
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th>Player Name</th>
                    <th>Number</th>
                    <th>Size</th>
                    <th>Sleeve Style</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
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
                            style={{ padding: '4px 8px', fontSize: '13px', background: '#FFFFFF', border: '1px solid #E4572E', color: '#111827' }}
                            placeholder="Leave blank for none"
                            value={record.name}
                            onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: '600', color: record.name ? '#111827' : '#9CA3AF', fontStyle: record.name ? 'normal' : 'italic' }}>
                            {record.name || '— (Blank)'}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '70px', background: '#FFFFFF', border: '1px solid #E4572E', color: '#111827' }}
                            placeholder="—"
                            value={record.number}
                            onChange={(e) => handleFieldChange(record.id, 'number', e.target.value)}
                          />
                        ) : (
                          record.number ? (
                            <span style={{ fontWeight: '700', color: '#E4572E', fontFamily: 'monospace', fontSize: '13px' }}>
                              {record.number.replace(/^#\s*/, '')}
                            </span>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>—</span>
                          )
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '90px', background: '#FFFFFF', border: '1px solid #E4572E', color: '#111827' }}
                            value={record.size}
                            onChange={(e) => handleFieldChange(record.id, 'size', e.target.value)}
                          >
                            {availableSizes.map(s => <option key={s} value={s}>Size {s}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontWeight: '600', color: '#1F2937', padding: '2px 8px', background: '#F3F0EA', borderRadius: '6px', fontSize: '12px' }}>
                            Size {record.size}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingRowId === record.id ? (
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '13px', width: '110px', background: '#FFFFFF', border: '1px solid #E4572E', color: '#111827' }}
                            value={record.sleeve}
                            onChange={(e) => handleFieldChange(record.id, 'sleeve', e.target.value)}
                          >
                            <option value="half">Half Sleeve</option>
                            <option value="full">Full Sleeve</option>
                            <option value="none">No Sleeve</option>
                          </select>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: record.sleeve === 'full' ? '#DBEAFE' : record.sleeve === 'none' ? '#F3F4F6' : '#DCFCE7',
                            color: record.sleeve === 'full' ? '#1D4ED8' : record.sleeve === 'none' ? '#4B5563' : '#15803D'
                          }}>
                            {record.sleeve === 'half' ? 'Half Sleeve' : record.sleeve === 'full' ? 'Full Sleeve' : 'None'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editingRowId === record.id ? (
                          <input 
                            type="number" 
                            min="1" 
                            className="form-input" 
                            style={{ padding: '4px 6px', fontSize: '13px', width: '60px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E4572E', color: '#111827' }}
                            value={record.qty}
                            onChange={(e) => handleFieldChange(record.id, 'qty', parseInt(e.target.value) || 1)}
                          />
                        ) : (
                          <span style={{ fontWeight: '800', color: '#111827', fontSize: '13px' }}>
                            {record.qty}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {editingRowId === record.id ? (
                            <button 
                              className="btn" 
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '700', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '6px' }} 
                              onClick={() => setEditingRowId(null)}
                            >
                              Done
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#4B5563', borderColor: '#D1D5DB' }} 
                              onClick={() => setEditingRowId(record.id)}
                              title="Edit Row"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                          <button 
                            className="btn" 
                            style={{ padding: '4px 8px', fontSize: '12px', color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px' }} 
                            onClick={() => handleDeleteRow(record.id)}
                            title="Delete Row"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sheets-summary-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span>Total Rows: <strong style={{ color: '#111827' }}>{records.length}</strong></span>
                {searchTerm && (
                  <span style={{ color: '#E4572E', fontSize: '12px', fontWeight: '600' }}>
                    (Filtered: {records.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.number.toLowerCase().includes(searchTerm.toLowerCase()) || r.size.toLowerCase().includes(searchTerm.toLowerCase())).length})
                  </span>
                )}
                <span style={{ color: '#D1D5DB' }}>|</span>
                <span>Total Jersey Qty: <strong style={{ color: '#16A34A', fontSize: '13px' }}>{records.reduce((acc, r) => acc + r.qty, 0)} pcs</strong></span>
              </div>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                💡 Tip: Click edit icon to change names, numbers, or sizes directly
              </span>
            </div>
          </>
        ) : (
          <div style={{ 
            padding: '48px 20px', 
            textAlign: 'center', 
            background: '#FAF8F5', 
            borderRadius: '10px', 
            border: '2px dashed #E2DED7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: '#FFF0EB', 
              border: '1px solid #FCD7C8',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#E4572E'
            }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                No Player Records Yet
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', maxWidth: '380px' }}>
                Upload an Excel / CSV roster file above, or add records manually using the button below.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ 
                marginTop: '4px',
                padding: '7px 16px', 
                fontSize: '12px', 
                fontWeight: '700', 
                background: '#E4572E', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(228,87,46,0.25)' 
              }} 
              onClick={handleAddRow}
            >
              <Plus size={14} /> Add First Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
