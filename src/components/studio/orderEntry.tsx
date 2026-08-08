import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Trash2, Edit2, CheckCircle2, Grid, FileSpreadsheet } from 'lucide-react';

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
}

export const OrderEntry: React.FC<OrderEntryProps> = ({
  records,
  onRecordsChange,
  metadata,
  onMetadataChange,
  availableSizes
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

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
        const data = results.data as any[];
        
        // Smart Header mapping supporting all common Indian & International production headers
        const findField = (rowKeys: string[], regex: RegExp): string | null => {
          const match = rowKeys.find(key => regex.test(key.toLowerCase().trim()));
          return match || null;
        };

        if (data.length === 0) return;
        const keys = Object.keys(data[0]);

        const nameKey = findField(keys, /name|player|cust/i);
        const numKey = findField(keys, /number|num|#|no\.|no\b|jersey|sr/i);
        const sizeKey = findField(keys, /size|sz|chest/i);
        const qtyKey = findField(keys, /qty|quantity|count|qnty|pcs|total/i);
        const sleeveKey = findField(keys, /sleeve|slv|type|style/i);

        // Normalize letter sizes (e.g. S, M, L, XL) and strings (e.g. "40 Inches")
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

        const mappedRecords: PlayerRecord[] = data.map((row, index) => {
          let sleeveVal: PlayerRecord['sleeve'] = 'half';
          const sleeveText = sleeveKey ? String(row[sleeveKey]).toLowerCase() : '';
          if (sleeveText.includes('full') || sleeveText.includes('long')) sleeveVal = 'full';
          else if (sleeveText.includes('none') || sleeveText.includes('blank') || sleeveText.includes('less') || sleeveText.includes('no')) sleeveVal = 'none';

          const rawSize = sizeKey ? String(row[sizeKey]).trim() : '40';
          const sizeVal = normalizeSize(rawSize);

          const rawName = nameKey ? String(row[nameKey]).trim() : '';
          const rawNum = numKey ? String(row[numKey]).trim() : '';

          return {
            id: `csv-${index}-${Date.now()}`,
            name: rawName || `Player ${index + 1}`,
            number: rawNum || String(index + 1),
            size: sizeVal,
            qty: qtyKey ? parseInt(row[qtyKey]) || 1 : 1,
            sleeve: sleeveVal
          };
        });

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
      {/* 1. Job details */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>📋 1. Job Identification Details</h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Customer / Team Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Red Wings FC" 
              value={metadata.customerName}
              onChange={(e) => updateMetadata({ customerName: e.target.value })}
              title="Customer name used for output folder prefixes"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Order / Batch Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="01" 
              value={metadata.orderNum}
              onChange={(e) => updateMetadata({ orderNum: e.target.value })}
              title="Order index identifier prefix"
            />
          </div>
        </div>
      </div>

      {/* 2. Mode select */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div 
          className={`glass-card interactive ${!metadata.manualMode ? 'active' : ''}`} 
          style={{ flex: 1, cursor: 'pointer', borderLeft: !metadata.manualMode ? '4px solid var(--color-primary)' : '' }}
          onClick={() => updateMetadata({ manualMode: false })}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={24} style={{ color: 'var(--color-primary)' }} />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px' }}>CSV Import Mode</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Load custom roster sheet (Name, Number, Size)</p>
            </div>
          </div>
        </div>

        <div 
          className={`glass-card interactive ${metadata.manualMode ? 'active' : ''}`} 
          style={{ flex: 1, cursor: 'pointer', borderLeft: metadata.manualMode ? '4px solid var(--color-secondary)' : '' }}
          onClick={() => updateMetadata({ manualMode: true })}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Grid size={24} style={{ color: 'var(--color-secondary)' }} />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px' }}>Quick Size Entry</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Input panel quantities directly (Bypasses CSV)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CSV Dropzone / Quick grid panel */}
      {!metadata.manualMode ? (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Upload Production CSV</h3>
          <div 
            className={`file-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".csv" 
              style={{ display: 'none' }} 
            />
            <Upload className="file-dropzone-icon" size={32} />
            <div>
              <p style={{ fontWeight: 'bold' }}>Drag and drop your roster CSV file here</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Or click to browse files</p>
            </div>
            {csvFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 'bold', fontSize: '12px' }}>
                <CheckCircle2 size={16} /> Loaded: {csvFile.name}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Quick Size Entry (Panel Quantities)</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleClearGrid}>Clear Qty</button>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleGenerateFromGrid}>Load into Panel Order</button>
            </div>
          </div>
          
          <div className="table-container" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Size</th>
                  <th style={{ textAlign: 'center', color: '#4ade80' }}>Half Sleeve Jersey<br/><span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Front+Back+Half Sleeves</span></th>
                  <th style={{ textAlign: 'center', color: '#60a5fa' }}>Full Sleeve Jersey<br/><span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Front+Back+Full Sleeves</span></th>
                  <th style={{ textAlign: 'center', color: '#f59e0b' }}>Sleeve Only<br/><span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-muted)' }}>Half Sleeve panels only</span></th>
                </tr>
              </thead>
              <tbody>
                {availableSizes.sort((a,b)=>parseInt(a)-parseInt(b)).map(size => (
                  <tr key={size}>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>Size {size}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={manualGrid[size]?.fb || ''} 
                        onChange={(e) => handleManualGridChange(size, 'fb', e.target.value)}
                        style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: '#fff', borderRadius: '4px', textAlign: 'center', padding: '4px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={manualGrid[size]?.half || ''} 
                        onChange={(e) => handleManualGridChange(size, 'half', e.target.value)}
                        style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: '#fff', borderRadius: '4px', textAlign: 'center', padding: '4px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="number" 
                        min="0" 
                        value={manualGrid[size]?.full || ''} 
                        onChange={(e) => handleManualGridChange(size, 'full', e.target.value)}
                        style={{ width: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)', color: '#fff', borderRadius: '4px', textAlign: 'center', padding: '4px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Order Table details */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>📋 Active Panel Order List ({records.length} items)</h3>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddRow}>
            <Plus size={14} /> Add Row
          </button>
        </div>

        {records.length > 0 ? (
          <div className="table-container" style={{ maxHeight: '400px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Player Name</th>
                  <th>Number</th>
                  <th>Size</th>
                  <th>Sleeve Style</th>
                  <th>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>
                      {editingRowId === record.id ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '13px' }}
                          value={record.name}
                          onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
                        />
                      ) : (
                        record.name
                      )}
                    </td>
                    <td>
                      {editingRowId === record.id ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '13px', width: '60px' }}
                          value={record.number}
                          onChange={(e) => handleFieldChange(record.id, 'number', e.target.value)}
                        />
                      ) : (
                        record.number || '-'
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
        ) : (
          <div style={{ padding: '40px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Order list is empty. Add a manual row or import a CSV file to get started.
          </div>
        )}
      </div>

      {/* 5. Sublimation Options */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>⚙️ Sublimation Panel Rendering Options</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          
          <div 
            className={`checkbox-card ${metadata.blankKit ? 'checked' : ''}`}
            onClick={() => updateMetadata({ blankKit: !metadata.blankKit })}
          >
            <input type="checkbox" checked={metadata.blankKit} readOnly />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-primary)' }}>Blank Kit Mode</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Render panels without Name/Number</p>
            </div>
          </div>

          <div 
            className={`checkbox-card ${metadata.a4BackPrint ? 'checked' : ''}`}
            onClick={() => updateMetadata({ a4BackPrint: !metadata.a4BackPrint })}
          >
            <input type="checkbox" checked={metadata.a4BackPrint} readOnly />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-secondary)' }}>Export A4 Print Panel (10x11 in)</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Generate standalone chest/pocket print panels</p>
            </div>
          </div>

          <div 
            className={`checkbox-card ${metadata.raglanStyle ? 'checked' : ''}`}
            onClick={() => updateMetadata({ raglanStyle: !metadata.raglanStyle })}
          >
            <input type="checkbox" checked={metadata.raglanStyle} readOnly />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#9c27b0' }}>Raglan Style sleeves</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Use raglan grading sizes for sleeves</p>
            </div>
          </div>

          <div 
            className={`checkbox-card ${metadata.halfSleeveMerge ? 'checked' : ''}`}
            onClick={() => updateMetadata({ halfSleeveMerge: !metadata.halfSleeveMerge })}
          >
            <input type="checkbox" checked={metadata.halfSleeveMerge} readOnly />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', color: '#009688' }}>Half-Sleeve Merge</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Combine normal left/right half sleeves in 1 block (excludes full & raglan)</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
