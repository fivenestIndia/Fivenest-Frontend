import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, Users, Download, Wallet, Check, AlertCircle, Copy, 
  Upload, ArrowRight, Sparkles, RefreshCw, X, Package, 
  CreditCard, CheckCircle2, FileSpreadsheet, Plus, Trash2, 
  ShieldCheck, ChevronDown, ChevronUp, Type, Hash, Layers,
  SlidersHorizontal, CheckCircle, Image as ImageIcon, Shirt,
  Sliders, Ruler, Bookmark, Save, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';
import { sampleImageEdgeColor, type ArtDesignConfig, type TextConfig, type PanelConfig, type LogoConfig } from './designer';
import type { PlayerRecord, OrderMetadata } from './orderEntry';
import { defaultSizes, DEFAULT_SIZE_AGE_MAP, type SizeDatabase, type SizeConfig } from './sizesDb';
import type { NestingViewHandle } from './nestingView';
import { classifyZipPanelFile } from './zipHelper';

const FONT_OPTIONS = [
  { id: 'OldSport02AthleticNcv-E0gj', label: 'Old Sport Athletic' },
  { id: 'Impact', label: 'Impact Athletic' },
  { id: 'Arial', label: 'Arial Clean' },
  { id: 'Bebas Neue', label: 'Bebas Neue' },
  { id: 'Montserrat', label: 'Montserrat' }
];

const COLOR_SWATCHES = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#0A192F' },
  { name: 'Royal', hex: '#1E3A8A' },
  { name: 'Sky', hex: '#0284C7' },
  { name: 'Cyan', hex: '#00F0FF' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#E4572E' },
  { name: 'Gold', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Purple', hex: '#8B5CF6' }
];

interface MobileStudioViewProps {
  records: PlayerRecord[];
  onRecordsChange: (records: PlayerRecord[]) => void;
  metadata: OrderMetadata;
  onMetadataChange: (metadata: OrderMetadata) => void;
  designConfig: ArtDesignConfig;
  onDesignConfigChange: (config: ArtDesignConfig) => void;
  sizeDB: SizeDatabase;
  onSizeDBChange?: (db: SizeDatabase) => void;
  currentUser: { email: string; name: string; balance: number; id?: string } | null;
  onUserChange: (user: { email: string; name: string; balance: number; id?: string } | null) => void;
  testMode: boolean;
  onTestModeChange: (val: boolean) => void;
  onOpenLogin: () => void;
  onOpenSizeEditor?: () => void;
  nestingRef: React.RefObject<NestingViewHandle>;
}

export const MobileStudioView: React.FC<MobileStudioViewProps> = ({
  records,
  onRecordsChange,
  metadata,
  onMetadataChange,
  designConfig,
  onDesignConfigChange,
  sizeDB,
  onSizeDBChange,
  currentUser,
  onUserChange,
  testMode,
  onTestModeChange,
  onOpenLogin,
  onOpenSizeEditor,
  nestingRef
}) => {
  // Mobile tabs: artwork, roster (players data), export, payment
  const [activeTab, setActiveTab] = useState<'artwork' | 'roster' | 'export' | 'payment'>('artwork');
  const [showPcNotice, setShowPcNotice] = useState<boolean>(() => {
    return localStorage.getItem('fivenest_dismiss_pc_notice') !== 'true';
  });

  // Size Editor states
  const [showSizeModal, setShowSizeModal] = useState<boolean>(false);
  const [localSizeDB, setLocalSizeDB] = useState<SizeDatabase>(() => {
    try {
      const saved = localStorage.getItem('teedex_size_database') || localStorage.getItem('fivenest_size_db');
      return saved ? JSON.parse(saved) : (sizeDB || defaultSizes);
    } catch {
      return sizeDB || defaultSizes;
    }
  });
  const [selectedEditSize, setSelectedEditSize] = useState<string>("40");

  useEffect(() => {
    if (sizeDB && Object.keys(sizeDB).length > 0) {
      setLocalSizeDB(sizeDB);
    }
  }, [sizeDB]);

  const sizeList = Object.keys(localSizeDB).length > 0 ? Object.keys(localSizeDB) : Object.keys(defaultSizes);
  const currentEditingConfig: SizeConfig = localSizeDB[selectedEditSize] || defaultSizes[selectedEditSize] || defaultSizes["40"];

  const handleUpdateDimension = (panel: 'front' | 'back' | 'half' | 'full', dim: 'w' | 'h', val: number) => {
    const current = localSizeDB[selectedEditSize] || defaultSizes[selectedEditSize] || defaultSizes["40"];
    const updated = {
      ...localSizeDB,
      [selectedEditSize]: {
        ...current,
        [panel]: {
          ...current[panel],
          [dim]: val
        }
      }
    };
    setLocalSizeDB(updated);
  };

  // Size Presets states (synced with localStorage & desktop editor)
  const [savedSizePresets, setSavedSizePresets] = useState<Record<string, SizeDatabase>>(() => {
    try {
      return JSON.parse(localStorage.getItem('fivenest_size_presets') || '{}');
    } catch {
      return {};
    }
  });
  const [activeSizePreset, setActiveSizePreset] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('fivenest_active_size_preset');
      const presets = JSON.parse(localStorage.getItem('fivenest_size_presets') || '{}');
      if (saved && (saved === 'Default Size' || presets[saved])) {
        return saved;
      }
      return 'Default Size';
    } catch {
      return 'Default Size';
    }
  });
  const [newSizePresetName, setNewSizePresetName] = useState<string>('');
  const [sizePresetFeedback, setSizePresetFeedback] = useState<string | null>(null);

  const handleLoadSizePreset = (presetName: string) => {
    let targetDb: SizeDatabase = defaultSizes;
    if (presetName === 'Default Size') {
      targetDb = defaultSizes;
    } else if (savedSizePresets[presetName]) {
      targetDb = savedSizePresets[presetName];
    }
    setLocalSizeDB(targetDb);
    setActiveSizePreset(presetName);
    localStorage.setItem('fivenest_active_size_preset', presetName);
    localStorage.setItem('teedex_size_database', JSON.stringify(targetDb));
    localStorage.setItem('fivenest_size_db', JSON.stringify(targetDb));
    if (onSizeDBChange) onSizeDBChange(targetDb);
    setSizePresetFeedback(`Loaded preset "${presetName}"`);
    setTimeout(() => setSizePresetFeedback(null), 3000);
    confetti({ particleCount: 25, spread: 40 });
  };

  const handleSaveSizePreset = () => {
    const trimmed = newSizePresetName.trim();
    if (!trimmed) {
      alert("Please enter a preset name (e.g. Slim Fit, Cricket Jersey, Custom Fit 1).");
      return;
    }
    if (trimmed.toLowerCase() === 'default size') {
      alert("Cannot overwrite 'Default Size'. Please choose a custom name.");
      return;
    }
    const updatedPresets = { ...savedSizePresets, [trimmed]: localSizeDB };
    setSavedSizePresets(updatedPresets);
    localStorage.setItem('fivenest_size_presets', JSON.stringify(updatedPresets));
    setActiveSizePreset(trimmed);
    localStorage.setItem('fivenest_active_size_preset', trimmed);
    localStorage.setItem('teedex_size_database', JSON.stringify(localSizeDB));
    localStorage.setItem('fivenest_size_db', JSON.stringify(localSizeDB));
    if (onSizeDBChange) onSizeDBChange(localSizeDB);
    setNewSizePresetName('');
    setSizePresetFeedback(`Preset "${trimmed}" saved successfully!`);
    setTimeout(() => setSizePresetFeedback(null), 3500);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleDeleteSizePreset = (presetToDelete: string) => {
    if (!savedSizePresets[presetToDelete]) return;
    if (window.confirm(`Delete preset "${presetToDelete}"?`)) {
      const updated = { ...savedSizePresets };
      delete updated[presetToDelete];
      setSavedSizePresets(updated);
      localStorage.setItem('fivenest_size_presets', JSON.stringify(updated));
      if (activeSizePreset === presetToDelete) {
        setActiveSizePreset('Default Size');
        localStorage.setItem('fivenest_active_size_preset', 'Default Size');
        setLocalSizeDB(defaultSizes);
        localStorage.setItem('teedex_size_database', JSON.stringify(defaultSizes));
        localStorage.setItem('fivenest_size_db', JSON.stringify(defaultSizes));
        if (onSizeDBChange) onSizeDBChange(defaultSizes);
      }
      setSizePresetFeedback(`Preset "${presetToDelete}" deleted.`);
      setTimeout(() => setSizePresetFeedback(null), 3000);
    }
  };

  const handleSaveSizes = () => {
    localStorage.setItem('teedex_size_database', JSON.stringify(localSizeDB));
    localStorage.setItem('fivenest_size_db', JSON.stringify(localSizeDB));
    // Also if a custom preset is active, update it
    if (activeSizePreset !== 'Default Size' && savedSizePresets[activeSizePreset]) {
      const updatedPresets = { ...savedSizePresets, [activeSizePreset]: localSizeDB };
      setSavedSizePresets(updatedPresets);
      localStorage.setItem('fivenest_size_presets', JSON.stringify(updatedPresets));
    }
    if (onSizeDBChange) onSizeDBChange(localSizeDB);
    confetti({ particleCount: 35, spread: 45 });
    setShowSizeModal(false);
  };

  const handleResetAllSizes = () => {
    if (window.confirm("Reset all sizes back to factory default measurements?")) {
      setLocalSizeDB(defaultSizes);
      setActiveSizePreset('Default Size');
      localStorage.setItem('fivenest_active_size_preset', 'Default Size');
      localStorage.setItem('teedex_size_database', JSON.stringify(defaultSizes));
      localStorage.setItem('fivenest_size_db', JSON.stringify(defaultSizes));
      if (onSizeDBChange) onSizeDBChange(defaultSizes);
      confetti({ particleCount: 20, spread: 30 });
    }
  };

  // Active panel being viewed/edited in the static artwork box
  const [activePanel, setActivePanel] = useState<'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'collar'>('front');
  // Sleeve style selector: half vs full
  const [previewSleeveType, setPreviewSleeveType] = useState<'half' | 'full'>('half');

  // Preview text for live canvas rendering
  const [previewName, setPreviewName] = useState<string>("FIVENEST");
  const [previewNumber, setPreviewNumber] = useState<string>("23");

  // Canvas ref for static artwork box
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  // Collapsible editor accordion sections
  const [expandedSection, setExpandedSection] = useState<'presets' | 'background' | 'name' | 'number' | 'logos' | 'collar' | null>('background');

  // Zip upload state
  const [zipUploading, setZipUploading] = useState<boolean>(false);
  const [zipResultMsg, setZipResultMsg] = useState<string | null>(null);

  // Sheet import state
  const [sheetImportLoading, setSheetImportLoading] = useState<boolean>(false);
  const [sheetImportMessage, setSheetImportMessage] = useState<string | null>(null);
  const sheetFileInputRef = useRef<HTMLInputElement>(null);

  // Presets state (synced with localStorage)
  const [customPresets, setCustomPresets] = useState<{ name: string; config: ArtDesignConfig }[]>(() => {
    try {
      const saved = localStorage.getItem('fivenest_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Payment states
  const [topupLoading, setTopupLoading] = useState<boolean>(false);
  const [topupMessage, setTopupMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);

  // Quick player add modal
  const [showAddPlayer, setShowAddPlayer] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<string>('');
  const [newPlayerSize, setNewPlayerSize] = useState<string>('40');
  const [newPlayerSleeve, setNewPlayerSleeve] = useState<'half' | 'full'>('half');
  const [newPlayerQty, setNewPlayerQty] = useState<number>(1);

  // Total quantity calculation
  const totalQty = records.reduce((acc, r) => acc + r.qty, 0);

  // Artwork status check
  const hasFront = Boolean(designConfig.front?.uploadedFileUrl || (designConfig.front?.backgroundType === 'generate' && designConfig.front?.generatedColor1));
  const hasBack = Boolean(designConfig.back?.uploadedFileUrl || (designConfig.back?.backgroundType === 'generate' && designConfig.back?.generatedColor1));
  const hasSleeve = Boolean(designConfig.sleeveLeft?.uploadedFileUrl || designConfig.sleeveRight?.uploadedFileUrl);
  const hasCollar = Boolean(designConfig.collar?.uploadedFileUrl || designConfig.trim?.collar?.uploadedUrl);
  const anyArtworkUploaded = hasFront || hasBack || hasSleeve || hasCollar;

  // Cost calculation (default ₹3.00/pc with logo watermark)
  const orderCost = Math.max(0, (records.length > 0 ? totalQty : 1) * 3.00);

  // ── SheetJS Dynamic Loader for Excel Files ──
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

  // Helper to score columns during sheet parsing
  const scoreKey = (k: string, field: 'name' | 'number' | 'size' | 'sleeve' | 'qty'): number => {
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
      if (/^(sr|sr\.|sr no|sr\. no\.|serial|serial no|s\.no|s no|row|index)$/i.test(k)) return -500;
      if (/\b(number|num|#)\b/i.test(k) && !/sr|serial|order|batch|phone|mobile|contact|size|sleeve|qty|total|front|half|full/i.test(k)) return 50;
      return -100;
    }
    if (field === 'size') {
      if (/^(size|sizes|sz|jersey size|tshirt size|shirt size|garment size)$/i.test(k)) return 100;
      if (/^(chest|chest size|body size|sizing)$/i.test(k)) return 80;
      if (/\bsize\b/i.test(k) && !/font|text|tag|batch|file|name|number|sleeve|front|half|full|total/i.test(k)) return 70;
      return -100;
    }
    if (field === 'sleeve') {
      if (/^(sleeve type|sleeve style|sleeve|sleeves|sleeve_type|sleeve_style|slv type|slv style)$/i.test(k)) return 100;
      if (/^(slv|hand|hands|sleeve length|sleeve len)$/i.test(k)) return 80;
      if (/\b(sleeve|slv)\b/i.test(k)) return 70;
      return -100;
    }
    if (field === 'qty') {
      if (/^(qty|quantity|count|pieces|pcs|total pcs)$/i.test(k)) return 100;
      return -100;
    }
    return 0;
  };

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

  const normalizeSleeve = (rawSleeve: string): 'half' | 'full' | 'none' => {
    if (!rawSleeve) return 'half';
    const s = rawSleeve.toLowerCase().trim();
    if (s.includes('full') || s.includes('long') || s === 'fls' || s === 'fs' || s === 'full hand') return 'full';
    if (s.includes('none') || s.includes('blank') || s.includes('less') || s.includes('no') || s === 'zero' || s === 'vest') return 'none';
    return 'half';
  };

  const handleParsedRosterRows = (rawRows: any[], fileName: string) => {
    if (!rawRows || rawRows.length === 0) {
      setSheetImportMessage("⚠️ File appears to be empty.");
      setSheetImportLoading(false);
      return;
    }

    const validRows = rawRows.filter(r => r && typeof r === 'object');
    if (validRows.length === 0) {
      setSheetImportMessage("⚠️ No valid rows found in sheet.");
      setSheetImportLoading(false);
      return;
    }

    const rawKeys = Object.keys(validRows[0]);
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

    if (!sizeKey || !sleeveKey || !nameKey) {
      rawKeys.forEach(k => {
        if (/^(filename|file|total|front size|half sleeve|full sleeve|sr|serial)/i.test(k)) return;
        const sampleVals = validRows.slice(0, 10).map(r => String(r[k] || '').trim());
        if (!sizeKey) {
          const sizeLikeCount = sampleVals.filter(v => /^(18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|S|M|L|XL|2XL|XXL|3XL|4XL)$/i.test(v)).length;
          if (sizeLikeCount >= Math.min(2, sampleVals.length)) sizeKey = k;
        }
        if (!sleeveKey) {
          const sleeveLikeCount = sampleVals.filter(v => /^(half|full|none|short|long|fls|lhs|rhs|sleeveless|full hand|half hand)$/i.test(v)).length;
          if (sleeveLikeCount >= Math.min(2, sampleVals.length)) sleeveKey = k;
        }
        if (!nameKey && k !== sizeKey && k !== sleeveKey && k !== numKey && k !== qtyKey) {
          const nameLikeCount = sampleVals.filter(v => /^[a-zA-Z\s\.\-]{2,}$/.test(v) && !/^(half|full|none|size)$/i.test(v)).length;
          if (nameLikeCount >= Math.min(2, sampleVals.length)) nameKey = k;
        }
      });
    }

    const mappedRecords: PlayerRecord[] = [];
    validRows.forEach((row, index) => {
      const rawName = nameKey && row[nameKey] !== undefined ? String(row[nameKey]).trim() : '';
      const rawNum = numKey && row[numKey] !== undefined ? String(row[numKey]).trim() : '';
      const rawSize = sizeKey && row[sizeKey] !== undefined ? String(row[sizeKey]).trim() : '';
      const rawSleeve = sleeveKey && row[sleeveKey] !== undefined ? String(row[sleeveKey]).trim() : '';
      
      let qtyVal = 1;
      if (qtyKey && row[qtyKey] !== undefined) {
        const parsed = parseInt(String(row[qtyKey]).trim(), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) qtyVal = parsed;
      }

      if (!rawName && !rawNum && !rawSize && !rawSleeve) return;

      const cleanName = (rawName.toUpperCase() === 'BLANK' || rawName === '-' || rawName === 'N/A') ? '' : rawName;
      const cleanNum = (rawNum === '-' || rawNum === 'N/A') ? '' : rawNum.replace(/^#\s*/, '').trim();
      const sizeVal = rawSize ? normalizeSize(rawSize) : '40';
      const sleeveVal = normalizeSleeve(rawSleeve);

      mappedRecords.push({
        id: `m-row-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: cleanName,
        number: cleanNum,
        size: sizeVal,
        qty: qtyVal,
        sleeve: sleeveVal
      });
    });

    if (mappedRecords.length === 0) {
      setSheetImportMessage("⚠️ No valid player records found in the uploaded sheet.");
      setSheetImportLoading(false);
      return;
    }

    if (!metadata.customerName && fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
      onMetadataChange({ ...metadata, customerName: cleanName });
    }

    onRecordsChange(mappedRecords);
    setSheetImportMessage(`✅ Imported ${mappedRecords.length} jerseys from ${fileName}`);
    setSheetImportLoading(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleSheetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSheetImportLoading(true);
    setSheetImportMessage(null);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');

    try {
      if (isExcel) {
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
            handleParsedRosterRows(results.data as any[], file.name);
          },
          error: (error) => {
            setSheetImportMessage("❌ Failed to parse Excel sheet.");
            setSheetImportLoading(false);
          }
        });
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            handleParsedRosterRows(results.data as any[], file.name);
          },
          error: (error) => {
            setSheetImportMessage("❌ Failed to parse CSV file.");
            setSheetImportLoading(false);
          }
        });
      }
    } catch (err: any) {
      setSheetImportMessage(`❌ Could not load sheet: ${err.message || err}`);
      setSheetImportLoading(false);
    } finally {
      e.target.value = '';
    }
  };

  // ── Render Static Artwork Box onto Canvas ──
  const drawActivePanelToCanvas = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let physicalW = 22;
    let physicalH = 30;
    if (activePanel === 'front' || activePanel === 'back') {
      physicalW = 22;
      physicalH = 30;
    } else if (activePanel === 'sleeveLeft' || activePanel === 'sleeveRight') {
      if (previewSleeveType === 'full') {
        physicalW = 19;
        physicalH = 25;
      } else {
        physicalW = 19;
        physicalH = 11;
      }
    } else if (activePanel === 'collar') {
      physicalW = 18;
      physicalH = 4.5;
    }

    const containerW = Math.min(window.innerWidth - 32, 340);
    const containerH = activePanel === 'collar' ? 120 : 280;
    const scale = Math.min(containerW / physicalW, containerH / physicalH);
    const canvasW = Math.round(physicalW * scale);
    const canvasH = Math.round(physicalH * scale);

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;
    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasW, canvasH);

    const panelConf = (designConfig[activePanel] as PanelConfig) || designConfig.front;

    // 1. Draw Background Color
    ctx.fillStyle = panelConf.generatedColor1 || '#0F172A';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Gradient if enabled
    if (panelConf.backgroundType === 'generate' && panelConf.generatedGradientStyle) {
      let grad: CanvasGradient;
      if (panelConf.generatedGradientStyle === 'gradient-linear-tb') {
        grad = ctx.createLinearGradient(0, 0, 0, canvasH);
      } else {
        grad = ctx.createLinearGradient(0, 0, canvasW, 0);
      }
      grad.addColorStop(0, panelConf.generatedColor1 || '#0F172A');
      grad.addColorStop(1, panelConf.generatedColor2 || '#1E3A8A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Uploaded Image
    const isFullSleeve = (activePanel === 'sleeveLeft' || activePanel === 'sleeveRight') && previewSleeveType === 'full';
    const imgUrl = isFullSleeve
      ? (panelConf.uploadedFileFullUrl || panelConf.uploadedFileUrl)
      : panelConf.uploadedFileUrl;

    if (imgUrl) {
      const img = imageCacheRef.current[imgUrl];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvasW, canvasH);
      } else {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          imageCacheRef.current[imgUrl] = newImg;
          drawActivePanelToCanvas();
        };
        newImg.src = imgUrl;
      }
    }

    // 2. Collar curved arc or stripes
    if (activePanel === 'collar') {
      const collarConf = designConfig.collar;
      if (collarConf?.curved) {
        ctx.strokeStyle = '#E4572E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(canvasW / 2, canvasH / 2, canvasW * 0.45, canvasH * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (collarConf?.stripes && collarConf.stripes.length > 0) {
        collarConf.stripes.forEach(s => {
          ctx.fillStyle = s.color || '#FFFFFF';
          const yPx = (s.yOffset / 4.5) * canvasH;
          const hPx = Math.max(2, (s.height / 4.5) * canvasH);
          ctx.fillRect(0, yPx, canvasW, hPx);
        });
      }
    }

    // 3. Technical Center Guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(canvasW / 2, 0);
    ctx.lineTo(canvasW / 2, canvasH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Player Name
    if (panelConf.nameConfig?.enabled && (activePanel === 'front' || activePanel === 'back')) {
      const nameText = previewName || 'FIVENEST';
      const fontSizePx = Math.max(12, Math.round((panelConf.nameConfig.fontSize / 30) * canvasH));
      const family = panelConf.nameConfig.fontFamily || 'OldSport02AthleticNcv-E0gj';
      ctx.font = `bold ${fontSizePx}px "${family}", Impact, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const yPos = (panelConf.nameConfig.yPos / 100) * canvasH;

      if (panelConf.nameConfig.strokeWidth > 0) {
        ctx.strokeStyle = panelConf.nameConfig.strokeColor || '#000000';
        ctx.lineWidth = Math.max(1, Math.round((panelConf.nameConfig.strokeWidth / 50) * fontSizePx));
        ctx.lineJoin = 'round';
        ctx.strokeText(nameText, canvasW / 2, yPos);
      }
      ctx.fillStyle = panelConf.nameConfig.color || '#FFFFFF';
      ctx.fillText(nameText, canvasW / 2, yPos);
    }

    // 5. Draw Player Number
    if (panelConf.numberConfig?.enabled && (activePanel === 'front' || activePanel === 'back')) {
      const numText = previewNumber || '23';
      const fontSizePx = Math.max(16, Math.round((panelConf.numberConfig.fontSize / 30) * canvasH));
      const family = panelConf.numberConfig.fontFamily || 'OldSport02AthleticNcv-E0gj';
      ctx.font = `bold ${fontSizePx}px "${family}", Impact, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const yPos = (panelConf.numberConfig.yPos / 100) * canvasH;

      if (panelConf.numberConfig.strokeWidth > 0) {
        ctx.strokeStyle = panelConf.numberConfig.strokeColor || '#000000';
        ctx.lineWidth = Math.max(1, Math.round((panelConf.numberConfig.strokeWidth / 50) * fontSizePx));
        ctx.lineJoin = 'round';
        ctx.strokeText(numText, canvasW / 2, yPos);
      }
      ctx.fillStyle = panelConf.numberConfig.color || '#FFFFFF';
      ctx.fillText(numText, canvasW / 2, yPos);
    }

    // 6. Draw Logos
    const drawLogoHelper = (url: string | null, targetX: number, targetY: number, sizePx: number) => {
      if (!url) return;
      const img = imageCacheRef.current[url];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, targetX - sizePx / 2, targetY - sizePx / 2, sizePx, sizePx);
      } else {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          imageCacheRef.current[url] = newImg;
          drawActivePanelToCanvas();
        };
        newImg.src = url;
      }
    };

    if (panelConf.leftChestLogo?.enabled && panelConf.leftChestLogo?.uploadedUrl) {
      drawLogoHelper(panelConf.leftChestLogo.uploadedUrl, canvasW * 0.25, canvasH * 0.28, Math.round(canvasW * 0.18));
    }
    if (panelConf.rightChestLogo?.enabled && panelConf.rightChestLogo?.uploadedUrl) {
      drawLogoHelper(panelConf.rightChestLogo.uploadedUrl, canvasW * 0.75, canvasH * 0.28, Math.round(canvasW * 0.18));
    }
    if (panelConf.torsoLogo?.enabled && panelConf.torsoLogo?.uploadedUrl) {
      drawLogoHelper(panelConf.torsoLogo.uploadedUrl, canvasW * 0.5, canvasH * 0.55, Math.round(canvasW * 0.45));
    }

    // 7. Outline
    ctx.strokeStyle = '#E4572E';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, canvasW, canvasH);
  };

  // Re-draw static canvas on changes
  useEffect(() => {
    drawActivePanelToCanvas();
  }, [activePanel, previewSleeveType, previewName, previewNumber, designConfig]);

  // Bulk ZIP Upload handler
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipUploading(true);
    setZipResultMsg(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const newConfig = { ...designConfig };
      const loadedPanels: string[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const lowerName = relativePath.toLowerCase();
        if (!/\.(png|jpe?g|webp)$/i.test(lowerName)) continue;

        const target = classifyZipPanelFile(relativePath);
        if (!target) continue;

        const blob = await zipEntry.async('blob');
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        if (target === 'front') {
          newConfig.front = { ...newConfig.front, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          loadedPanels.push('Front');
        } else if (target === 'back') {
          newConfig.back = { ...newConfig.back, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          loadedPanels.push('Back');
        } else if (target === 'sleeve_left') {
          newConfig.sleeveLeft = { ...newConfig.sleeveLeft, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          loadedPanels.push('Left Sleeve');
        } else if (target === 'sleeve_right') {
          newConfig.sleeveRight = { ...newConfig.sleeveRight, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          loadedPanels.push('Right Sleeve');
        } else if (target === 'sleeve_both' || target === 'sleeve_both_all') {
          newConfig.sleeveLeft = { ...newConfig.sleeveLeft, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          newConfig.sleeveRight = { ...newConfig.sleeveRight, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          loadedPanels.push('Sleeves (L+R)');
        } else if (target === 'collar') {
          if (newConfig.collar) {
            newConfig.collar = { ...newConfig.collar, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
          }
          if (newConfig.trim?.collar) {
            newConfig.trim.collar = { ...newConfig.trim.collar, uploadedUrl: dataUrl };
          }
          loadedPanels.push('Collar');
        }
      }

      if (loadedPanels.length > 0) {
        onDesignConfigChange(newConfig);
        setZipResultMsg(`✅ Extracted: ${Array.from(new Set(loadedPanels)).join(', ')}`);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } else {
        setZipResultMsg('⚠️ No recognized panel images found in ZIP (name files e.g. front.jpg, back.png, sleeves.png)');
      }
    } catch (err: any) {
      setZipResultMsg(`❌ ZIP extraction failed: ${err.message || err}`);
    } finally {
      setZipUploading(false);
      e.target.value = '';
    }
  };

  // Upload single panel image
  const handleSinglePanelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newConfig = { ...designConfig };
      if (activePanel === 'collar') {
        if (newConfig.collar) {
          newConfig.collar = { ...newConfig.collar, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
        }
        if (newConfig.trim?.collar) {
          newConfig.trim.collar = { ...newConfig.trim.collar, uploadedUrl: dataUrl };
        }
      } else if (activePanel === 'sleeveLeft' || activePanel === 'sleeveRight') {
        if (previewSleeveType === 'full') {
          newConfig[activePanel] = {
            ...newConfig[activePanel],
            uploadedFileFullUrl: dataUrl,
            uploadedFileUrl: dataUrl,
            backgroundType: 'upload'
          };
        } else {
          newConfig[activePanel] = {
            ...newConfig[activePanel],
            uploadedFileHalfUrl: dataUrl,
            uploadedFileUrl: dataUrl,
            backgroundType: 'upload'
          };
        }
      } else {
        newConfig[activePanel] = {
          ...newConfig[activePanel],
          uploadedFileUrl: dataUrl,
          backgroundType: 'upload'
        };
      }
      onDesignConfigChange(newConfig);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clear single panel image
  const handleClearCurrentPanel = () => {
    const newConfig = { ...designConfig };
    if (activePanel === 'collar') {
      if (newConfig.collar) newConfig.collar.uploadedFileUrl = null;
      if (newConfig.trim?.collar) newConfig.trim.collar.uploadedUrl = null;
    } else {
      newConfig[activePanel] = {
        ...newConfig[activePanel],
        uploadedFileUrl: null,
        uploadedFileHalfUrl: null,
        uploadedFileFullUrl: null,
        backgroundType: 'generate'
      };
    }
    onDesignConfigChange(newConfig);
  };

  // Built-in presets
  const builtInPresets = [
    { name: 'Neon Cyber', c1: '#00F0FF', c2: '#FF6B00', trim: '#FF6B00', font: '#FFFFFF', stroke: '#00F0FF' },
    { name: 'Royal Navy', c1: '#0A192F', c2: '#1E3A8A', trim: '#FFFFFF', font: '#FFFFFF', stroke: '#1E3A8A' },
    { name: 'Gold Champion', c1: '#111827', c2: '#1F2937', trim: '#F59E0B', font: '#F59E0B', stroke: '#000000' },
    { name: 'Crimson Fury', c1: '#DC2626', c2: '#7F1D1D', trim: '#000000', font: '#FFFFFF', stroke: '#000000' },
    { name: 'Emerald Speed', c1: '#064E3B', c2: '#10B981', trim: '#10B981', font: '#FFFFFF', stroke: '#064E3B' },
    { name: 'Clean White', c1: '#FFFFFF', c2: '#F1F5F9', trim: '#1E293B', font: '#0F172A', stroke: '#FFFFFF' }
  ];

  // Apply a preset
  const handleApplyPreset = (p: typeof builtInPresets[0]) => {
    const newConfig: ArtDesignConfig = {
      ...designConfig,
      front: {
        ...designConfig.front,
        backgroundType: 'generate',
        generatedColor1: p.c1,
        generatedColor2: p.c2,
        generatedGradientStyle: 'gradient-linear-tb',
        nameConfig: { ...designConfig.front.nameConfig, color: p.font, strokeColor: p.stroke },
        numberConfig: { ...designConfig.front.numberConfig, color: p.font, strokeColor: p.stroke }
      },
      back: {
        ...designConfig.back,
        backgroundType: 'generate',
        generatedColor1: p.c1,
        generatedColor2: p.c2,
        generatedGradientStyle: 'gradient-linear-tb',
        nameConfig: { ...designConfig.back.nameConfig, color: p.font, strokeColor: p.stroke },
        numberConfig: { ...designConfig.back.numberConfig, color: p.font, strokeColor: p.stroke }
      },
      sleeveLeft: {
        ...designConfig.sleeveLeft,
        backgroundType: 'generate',
        generatedColor1: p.c1,
        generatedColor2: p.c2,
        generatedGradientStyle: 'gradient-linear-tb'
      },
      sleeveRight: {
        ...designConfig.sleeveRight,
        backgroundType: 'generate',
        generatedColor1: p.c1,
        generatedColor2: p.c2,
        generatedGradientStyle: 'gradient-linear-tb'
      },
      trim: {
        ...designConfig.trim,
        collar: { enabled: true, color: p.trim, uploadedUrl: null },
        placket: { enabled: true, color: p.trim, uploadedUrl: null },
        sleeveStripe: { enabled: false, color: p.trim, uploadedUrl: null, height: 2.0 }
      }
    };
    onDesignConfigChange(newConfig);
    confetti({ particleCount: 40, spread: 50 });
  };

  // Save custom preset
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) {
      alert("Please enter a name for your preset.");
      return;
    }
    const updated = [...customPresets.filter(p => p.name !== newPresetName.trim()), { name: newPresetName.trim(), config: designConfig }];
    setCustomPresets(updated);
    localStorage.setItem('fivenest_presets', JSON.stringify(updated));
    setNewPresetName('');
    alert(`Saved preset "${newPresetName.trim()}"!`);
  };

  // Load custom preset
  const handleLoadCustomPreset = (preset: { name: string; config: ArtDesignConfig }) => {
    onDesignConfigChange(preset.config);
    confetti({ particleCount: 40, spread: 50 });
  };

  // Handle Logo Upload (Left Chest, Right Chest, Torso)
  const handleLogoUpload = (type: 'leftChest' | 'rightChest' | 'torso', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const newConfig = { ...designConfig };
      const panelKey = (activePanel === 'collar' ? 'front' : activePanel) as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight';
      const targetPanel = newConfig[panelKey] || newConfig.front;

      if (type === 'leftChest') {
        targetPanel.leftChestLogo = {
          ...(targetPanel.leftChestLogo || { width: 3.5, height: 3.5, xPos: 15.0, yPos: 8.5, lockAspectRatio: true }),
          enabled: true,
          uploadedUrl: dataUrl
        };
      } else if (type === 'rightChest') {
        targetPanel.rightChestLogo = {
          ...(targetPanel.rightChestLogo || { width: 3.5, height: 3.5, xPos: 7.0, yPos: 8.5, lockAspectRatio: true }),
          enabled: true,
          uploadedUrl: dataUrl
        };
      } else if (type === 'torso') {
        targetPanel.torsoLogo = {
          ...(targetPanel.torsoLogo || { width: 8.5, height: 2.6, xPos: 11.0, yPos: 13.3, lockAspectRatio: true }),
          enabled: true,
          uploadedUrl: dataUrl
        };
      }
      onDesignConfigChange(newConfig);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toggle Logo Enabled
  const handleToggleLogo = (type: 'leftChest' | 'rightChest' | 'torso', enabled: boolean) => {
    const newConfig = { ...designConfig };
    const panelKey = (activePanel === 'collar' ? 'front' : activePanel) as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight';
    const targetPanel = newConfig[panelKey] || newConfig.front;

    if (type === 'leftChest' && targetPanel.leftChestLogo) {
      targetPanel.leftChestLogo.enabled = enabled;
    } else if (type === 'rightChest' && targetPanel.rightChestLogo) {
      targetPanel.rightChestLogo.enabled = enabled;
    } else if (type === 'torso' && targetPanel.torsoLogo) {
      targetPanel.torsoLogo.enabled = enabled;
    }
    onDesignConfigChange(newConfig);
  };

  // Remove/Clear Logo
  const handleClearLogo = (type: 'leftChest' | 'rightChest' | 'torso') => {
    const newConfig = { ...designConfig };
    const panelKey = (activePanel === 'collar' ? 'front' : activePanel) as 'front' | 'back' | 'sleeveLeft' | 'sleeveRight';
    const targetPanel = newConfig[panelKey] || newConfig.front;

    if (type === 'leftChest' && targetPanel.leftChestLogo) {
      targetPanel.leftChestLogo.uploadedUrl = null;
      targetPanel.leftChestLogo.enabled = false;
    } else if (type === 'rightChest' && targetPanel.rightChestLogo) {
      targetPanel.rightChestLogo.uploadedUrl = null;
      targetPanel.rightChestLogo.enabled = false;
    } else if (type === 'torso' && targetPanel.torsoLogo) {
      targetPanel.torsoLogo.uploadedUrl = null;
      targetPanel.torsoLogo.enabled = false;
    }
    onDesignConfigChange(newConfig);
  };

  // Auto-match collar and placket colors from front artwork edge analysis
  const handleAutoMatchCollar = () => {
    const frontUrl = designConfig.front?.uploadedFileUrl;
    if (frontUrl && imageCacheRef.current[frontUrl]) {
      const edgeColor = sampleImageEdgeColor(imageCacheRef.current[frontUrl]);
      const newConfig = { ...designConfig };
      if (newConfig.collar) {
        newConfig.collar.generatedColor1 = edgeColor;
      }
      if (newConfig.trim) {
        newConfig.trim.collar = { ...newConfig.trim.collar, color: edgeColor, enabled: true };
        newConfig.trim.placket = { ...newConfig.trim.placket, color: edgeColor, enabled: true };
      }
      onDesignConfigChange(newConfig);
      confetti({ particleCount: 35, spread: 45 });
    } else {
      const frontColor = designConfig.front?.generatedColor1 || '#1E3A8A';
      const newConfig = { ...designConfig };
      if (newConfig.collar) newConfig.collar.generatedColor1 = frontColor;
      if (newConfig.trim) {
        newConfig.trim.collar = { ...newConfig.trim.collar, color: frontColor, enabled: true };
        newConfig.trim.placket = { ...newConfig.trim.placket, color: frontColor, enabled: true };
      }
      onDesignConfigChange(newConfig);
      confetti({ particleCount: 20, spread: 30 });
    }
  };

  // Add new player to roster manually
  const handleAddPlayer = () => {
    if (!newPlayerName && !newPlayerNumber) {
      alert("Please provide at least a player name or number.");
      return;
    }

    const newRecord: PlayerRecord = {
      id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newPlayerName.trim().toUpperCase() || 'PLAYER',
      number: newPlayerNumber.trim(),
      size: newPlayerSize,
      sleeve: newPlayerSleeve,
      qty: Math.max(1, newPlayerQty)
    };

    onRecordsChange([...records, newRecord]);
    setNewPlayerName('');
    setNewPlayerNumber('');
    setShowAddPlayer(false);
  };

  // Remove player from roster
  const handleRemovePlayer = (id: string) => {
    onRecordsChange(records.filter(r => r.id !== id));
  };

  // Recharge Wallet
  const handleRechargeWallet = async (amount: number) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    setTopupLoading(true);
    setTopupMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");

      const { error } = await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: amount,
        transaction_type: 'topup',
        description: `Mobile wallet top-up ₹${amount}`
      });

      if (error) throw new Error(error.message);

      const details = await fetchUserWallet(user.id);
      const updatedUser = { ...currentUser, balance: details.balance };
      localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
      onUserChange(updatedUser);
      setTopupMessage(`✅ Added ₹${amount}! New balance: ₹${details.balance.toFixed(2)}`);
      confetti({ particleCount: 50, spread: 50 });
    } catch (err: any) {
      setTopupMessage(`❌ Top-up failed: ${err.message || err}`);
    } finally {
      setTopupLoading(false);
    }
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText("vilesh332-1@okhdfcbank");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const upiDeepLink = `upi://pay?pa=vilesh332-1@okhdfcbank&pn=FiveNest%20Studio&am=${orderCost.toFixed(2)}&cu=INR&tn=FiveNest%20Order%20${encodeURIComponent(metadata.orderNum || '01')}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiDeepLink)}`;

  const handleDismissNotice = () => {
    setShowPcNotice(false);
    localStorage.setItem('fivenest_dismiss_pc_notice', 'true');
  };

  return (
    <div className="mobile-studio-container" style={{
      minHeight: '100vh',
      background: '#090D16',
      color: '#F8FAFC',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingBottom: '90px',
      overflowX: 'hidden'
    }}>
      {/* ── Fixed Mobile Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(228,87,46,0.3)'
          }}>
            F
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              FiveNest
            </div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#E4572E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Mobile Production
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onTestModeChange(!testMode)}
            style={{
              background: testMode ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: testMode ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
              color: testMode ? '#FACC15' : '#4ADE80',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {testMode ? '🧪 Test' : '⚡ Live'}
          </button>

          <Link to="/orders" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#F8FAFC',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Package size={12} /> Orders
            </button>
          </Link>

          <div
            onClick={() => setActiveTab('payment')}
            style={{
              background: 'rgba(228, 87, 46, 0.12)',
              border: '1px solid rgba(228, 87, 46, 0.35)',
              padding: '4px 10px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Wallet size={12} style={{ color: '#E4572E' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#FF7A45' }}>
              ₹{currentUser ? currentUser.balance.toFixed(0) : '0'}
            </span>
          </div>
        </div>
      </header>

      {/* ── CAD Tools PC Notice Banner ── */}
      {showPcNotice && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(228, 87, 46, 0.12), rgba(59, 130, 246, 0.12))',
          borderBottom: '1px solid rgba(228, 87, 46, 0.25)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#E2E8F0' }}>
            <Sparkles size={14} style={{ color: '#E4572E', flexShrink: 0 }} />
            <span>
              <strong>PC Tools:</strong> Millimeter precision CAD rulers, vector curve warping & roll nest layout available on PC/Laptop.
            </span>
          </div>
          <button
            onClick={handleDismissNotice}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main Tab Content ── */}
      <main style={{ padding: '16px' }}>
        
        {/* ════════════════════════════════════════════════════════
            TAB 1: 🎨 ARTWORK (Static Artwork Box + Whole Editor Panel)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'artwork' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. Panel Selector Pills & Full/Half Sleeve Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {[
                  { id: 'front', label: 'Front Panel' },
                  { id: 'back', label: 'Back Panel' },
                  { id: 'sleeveLeft', label: 'Left Sleeve' },
                  { id: 'sleeveRight', label: 'Right Sleeve' },
                  { id: 'collar', label: 'Collar (18"×4.5")' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePanel(p.id as any)}
                    style={{
                      background: activePanel === p.id ? '#E4572E' : '#1E293B',
                      border: activePanel === p.id ? '1px solid #E4572E' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: activePanel === p.id ? '800' : '600',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Sleeve Type Toggle: Half vs Full */}
              <div style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>
                  Sleeve Style:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPreviewSleeveType('half')}
                    style={{
                      background: previewSleeveType === 'half' ? 'rgba(228,87,46,0.2)' : 'transparent',
                      border: previewSleeveType === 'half' ? '1px solid #E4572E' : '1px solid transparent',
                      color: previewSleeveType === 'half' ? '#FF7A45' : '#94A3B8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Half Sleeve (19"×11")
                  </button>
                  <button
                    onClick={() => setPreviewSleeveType('full')}
                    style={{
                      background: previewSleeveType === 'full' ? 'rgba(59,130,246,0.2)' : 'transparent',
                      border: previewSleeveType === 'full' ? '1px solid #3B82F6' : '1px solid transparent',
                      color: previewSleeveType === 'full' ? '#60A5FA' : '#94A3B8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Full Sleeve (19"×25")
                  </button>
                </div>
              </div>
            </div>

            {/* 2. STATIC ARTWORK BOX (NOT Moveable, 100% stable touch) */}
            <div style={{
              background: '#0B0F19',
              border: '1.5px solid rgba(228, 87, 46, 0.35)',
              borderRadius: '16px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}>
              {/* Artwork Box Header Bar */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activePanel === 'front' && 'Front Panel (22" × 30")'}
                  {activePanel === 'back' && 'Back Panel (22" × 30")'}
                  {activePanel === 'sleeveLeft' && `Left Sleeve (${previewSleeveType === 'full' ? '19" × 25"' : '19" × 11"'})`}
                  {activePanel === 'sleeveRight' && `Right Sleeve (${previewSleeveType === 'full' ? '19" × 25"' : '19" × 11"'})`}
                  {activePanel === 'collar' && 'Collar Band (18" × 4.5")'}
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                  Static Preview
                </span>
              </div>

              {/* Static Canvas Area */}
              <div style={{
                background: '#040711',
                borderRadius: '10px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: activePanel === 'collar' ? '110px' : '260px',
                maxHeight: '300px',
                padding: '6px'
              }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    borderRadius: '8px',
                    display: 'block',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Quick Action Buttons for Current Panel */}
              <div style={{ width: '100%', display: 'flex', gap: '6px' }}>
                <label style={{
                  flex: 1,
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '7px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer'
                }}>
                  <Upload size={13} />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleSinglePanelUpload} style={{ display: 'none' }} />
                </label>

                {((designConfig[activePanel] as PanelConfig)?.uploadedFileUrl) && (
                  <button
                    onClick={handleClearCurrentPanel}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* 3. WHOLE EDITOR PANEL ACCORDIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Accordion 1: Design Presets */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'presets' ? null : 'presets')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Sparkles size={16} style={{ color: '#F59E0B' }} />
                    <span>Design Presets</span>
                  </div>
                  {expandedSection === 'presets' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'presets' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Tap any style preset to instantly apply colors & fonts:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {builtInPresets.map(p => (
                        <button
                          key={p.name}
                          onClick={() => handleApplyPreset(p)}
                          style={{
                            background: '#1E293B',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '8px',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`, flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#FFFFFF' }}>{p.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Save Current as Preset */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="Save preset name..."
                        style={{ flex: 1, background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '6px 10px', color: '#FFFFFF', fontSize: '11px', outline: 'none' }}
                      />
                      <button
                        onClick={handleSaveCustomPreset}
                        style={{ background: '#E4572E', border: 'none', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>

                    {customPresets.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {customPresets.map(cp => (
                          <div
                            key={cp.name}
                            onClick={() => handleLoadCustomPreset(cp)}
                            style={{ background: '#1E293B', border: '1px solid rgba(228,87,46,0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', color: '#FF7A45', fontWeight: '700', cursor: 'pointer' }}
                          >
                            {cp.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Background Colors & Gradients */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'background' ? null : 'background')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Palette size={16} style={{ color: '#E4572E' }} />
                    <span>Panel Colors & Background</span>
                  </div>
                  {expandedSection === 'background' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'background' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Background Style: Solid vs Gradient */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Fill Style</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                        {[
                          { id: 'solid', label: 'Solid Color' },
                          { id: 'gradient-linear-tb', label: 'Top → Bottom' },
                          { id: 'gradient-linear-lr', label: 'Left → Right' }
                        ].map(st => {
                          const currentStyle = (designConfig[activePanel] as PanelConfig)?.generatedGradientStyle || 'solid';
                          const isSel = currentStyle === st.id;
                          return (
                            <button
                              key={st.id}
                              onClick={() => {
                                const newConfig = { ...designConfig };
                                if (activePanel === 'collar') {
                                  if (newConfig.collar) {
                                    newConfig.collar.backgroundType = 'generate';
                                  }
                                } else {
                                  newConfig[activePanel] = {
                                    ...newConfig[activePanel],
                                    backgroundType: 'generate',
                                    generatedGradientStyle: st.id as any
                                  };
                                }
                                onDesignConfigChange(newConfig);
                              }}
                              style={{
                                background: isSel ? 'rgba(228,87,46,0.2)' : '#1E293B',
                                border: isSel ? '1px solid #E4572E' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: isSel ? '#FF7A45' : '#CBD5E1',
                                padding: '6px 4px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary Color */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Primary Base Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              const newConfig = { ...designConfig };
                              if (activePanel === 'collar') {
                                if (newConfig.collar) newConfig.collar.generatedColor1 = col.hex;
                                if (newConfig.trim?.collar) newConfig.trim.collar.color = col.hex;
                              } else {
                                newConfig[activePanel] = {
                                  ...newConfig[activePanel],
                                  backgroundType: 'generate',
                                  generatedColor1: col.hex
                                };
                              }
                              onDesignConfigChange(newConfig);
                            }}
                            title={col.name}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: (designConfig[activePanel] as PanelConfig)?.generatedColor1 === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Secondary Color for Gradients */}
                    {((designConfig[activePanel] as PanelConfig)?.generatedGradientStyle && (designConfig[activePanel] as PanelConfig)?.generatedGradientStyle !== 'solid') && (
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Secondary Gradient Color</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {COLOR_SWATCHES.map(col => (
                            <button
                              key={col.hex}
                              onClick={() => {
                                const newConfig = { ...designConfig };
                                if (activePanel !== 'collar') {
                                  newConfig[activePanel] = {
                                    ...newConfig[activePanel],
                                    backgroundType: 'generate',
                                    generatedColor2: col.hex
                                  };
                                }
                                onDesignConfigChange(newConfig);
                              }}
                              title={col.name}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: col.hex,
                                border: (designConfig[activePanel] as PanelConfig)?.generatedColor2 === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Player Name Customizer */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'name' ? null : 'name')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Type size={16} style={{ color: '#38BDF8' }} />
                    <span>Player Name Customizer</span>
                  </div>
                  {expandedSection === 'name' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'name' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#E2E8F0', cursor: 'pointer' }}>
                      <span>Enable Name Overlay</span>
                      <input
                        type="checkbox"
                        checked={designConfig.back.nameConfig.enabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          onDesignConfigChange({
                            ...designConfig,
                            front: { ...designConfig.front, nameConfig: { ...designConfig.front.nameConfig, enabled: val } },
                            back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, enabled: val } }
                          });
                        }}
                        style={{ accentColor: '#E4572E', width: '16px', height: '16px' }}
                      />
                    </label>

                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Sample Name</label>
                      <input
                        type="text"
                        value={previewName}
                        onChange={(e) => setPreviewName(e.target.value.toUpperCase())}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>

                    {/* Font Family Dropdown */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Font Style</label>
                      <select
                        value={designConfig.back.nameConfig.fontFamily || 'OldSport02AthleticNcv-E0gj'}
                        onChange={(e) => {
                          const val = e.target.value;
                          onDesignConfigChange({
                            ...designConfig,
                            front: { ...designConfig.front, nameConfig: { ...designConfig.front.nameConfig, fontFamily: val } },
                            back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, fontFamily: val } }
                          });
                        }}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      >
                        {FONT_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Font Size ({designConfig.back.nameConfig.fontSize.toFixed(1)}")</label>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="0.1"
                          value={designConfig.back.nameConfig.fontSize}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onDesignConfigChange({
                              ...designConfig,
                              back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, fontSize: val } }
                            });
                          }}
                          style={{ width: '100%', accentColor: '#E4572E' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Y Position ({designConfig.back.nameConfig.yPos}%)</label>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={designConfig.back.nameConfig.yPos}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onDesignConfigChange({
                              ...designConfig,
                              back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, yPos: val } }
                            });
                          }}
                          style={{ width: '100%', accentColor: '#E4572E' }}
                        />
                      </div>
                    </div>

                    {/* Name Color Swatches */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Text Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              onDesignConfigChange({
                                ...designConfig,
                                front: { ...designConfig.front, nameConfig: { ...designConfig.front.nameConfig, color: col.hex } },
                                back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, color: col.hex } }
                              });
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.back.nameConfig.color === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Name Stroke / Outline Color */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Outline / Stroke Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              onDesignConfigChange({
                                ...designConfig,
                                front: { ...designConfig.front, nameConfig: { ...designConfig.front.nameConfig, strokeColor: col.hex, strokeWidth: designConfig.front.nameConfig.strokeWidth || 4 } },
                                back: { ...designConfig.back, nameConfig: { ...designConfig.back.nameConfig, strokeColor: col.hex, strokeWidth: designConfig.back.nameConfig.strokeWidth || 4 } }
                              });
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.back.nameConfig.strokeColor === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Player Number Customizer */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'number' ? null : 'number')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Hash size={16} style={{ color: '#4ADE80' }} />
                    <span>Player Number Customizer</span>
                  </div>
                  {expandedSection === 'number' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'number' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#E2E8F0', cursor: 'pointer' }}>
                      <span>Enable Number Overlay</span>
                      <input
                        type="checkbox"
                        checked={designConfig.back.numberConfig.enabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          onDesignConfigChange({
                            ...designConfig,
                            front: { ...designConfig.front, numberConfig: { ...designConfig.front.numberConfig, enabled: val } },
                            back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, enabled: val } }
                          });
                        }}
                        style={{ accentColor: '#E4572E', width: '16px', height: '16px' }}
                      />
                    </label>

                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Sample Number</label>
                      <input
                        type="text"
                        value={previewNumber}
                        onChange={(e) => setPreviewNumber(e.target.value)}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>

                    {/* Font Family Dropdown */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Font Style</label>
                      <select
                        value={designConfig.back.numberConfig.fontFamily || 'OldSport02AthleticNcv-E0gj'}
                        onChange={(e) => {
                          const val = e.target.value;
                          onDesignConfigChange({
                            ...designConfig,
                            front: { ...designConfig.front, numberConfig: { ...designConfig.front.numberConfig, fontFamily: val } },
                            back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, fontFamily: val } }
                          });
                        }}
                        style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      >
                        {FONT_OPTIONS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Number Size ({designConfig.back.numberConfig.fontSize.toFixed(1)}")</label>
                        <input
                          type="range"
                          min="4"
                          max="12"
                          step="0.5"
                          value={designConfig.back.numberConfig.fontSize}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onDesignConfigChange({
                              ...designConfig,
                              back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, fontSize: val } }
                            });
                          }}
                          style={{ width: '100%', accentColor: '#E4572E' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Y Position ({designConfig.back.numberConfig.yPos}%)</label>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          value={designConfig.back.numberConfig.yPos}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onDesignConfigChange({
                              ...designConfig,
                              back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, yPos: val } }
                            });
                          }}
                          style={{ width: '100%', accentColor: '#E4572E' }}
                        />
                      </div>
                    </div>

                    {/* Number Color Swatches */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Number Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              onDesignConfigChange({
                                ...designConfig,
                                front: { ...designConfig.front, numberConfig: { ...designConfig.front.numberConfig, color: col.hex } },
                                back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, color: col.hex } }
                              });
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.back.numberConfig.color === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Number Stroke / Outline Color */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Outline / Stroke Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              onDesignConfigChange({
                                ...designConfig,
                                front: { ...designConfig.front, numberConfig: { ...designConfig.front.numberConfig, strokeColor: col.hex, strokeWidth: designConfig.front.numberConfig.strokeWidth || 4 } },
                                back: { ...designConfig.back, numberConfig: { ...designConfig.back.numberConfig, strokeColor: col.hex, strokeWidth: designConfig.back.numberConfig.strokeWidth || 4 } }
                              });
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.back.numberConfig.strokeColor === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 5: Team Logos & Sponsor Badges */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'logos' ? null : 'logos')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <ShieldCheck size={16} style={{ color: '#A855F7' }} />
                    <span>Team Logos & Badges</span>
                  </div>
                  {expandedSection === 'logos' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'logos' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Left Chest Logo */}
                    <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F1F5F9' }}>Left Chest Logo</span>
                        <input
                          type="checkbox"
                          checked={Boolean(designConfig.front.leftChestLogo?.enabled)}
                          onChange={(e) => handleToggleLogo('leftChest', e.target.checked)}
                          style={{ accentColor: '#E4572E', width: '15px', height: '15px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {designConfig.front.leftChestLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <img src={designConfig.front.leftChestLogo.uploadedUrl} alt="Left Chest" style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#0F172A', borderRadius: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: '600', flex: 1 }}>Logo loaded</span>
                            <button onClick={() => handleClearLogo('leftChest')} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ flex: 1, background: '#0F172A', border: '1px dashed rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                            <Upload size={12} /> Upload Left Chest Logo
                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload('leftChest', e)} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Right Chest Logo */}
                    <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F1F5F9' }}>Right Chest Logo</span>
                        <input
                          type="checkbox"
                          checked={Boolean(designConfig.front.rightChestLogo?.enabled)}
                          onChange={(e) => handleToggleLogo('rightChest', e.target.checked)}
                          style={{ accentColor: '#E4572E', width: '15px', height: '15px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {designConfig.front.rightChestLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <img src={designConfig.front.rightChestLogo.uploadedUrl} alt="Right Chest" style={{ width: '32px', height: '32px', objectFit: 'contain', background: '#0F172A', borderRadius: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: '600', flex: 1 }}>Logo loaded</span>
                            <button onClick={() => handleClearLogo('rightChest')} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ flex: 1, background: '#0F172A', border: '1px dashed rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                            <Upload size={12} /> Upload Right Chest Logo
                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload('rightChest', e)} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Torso / Front Sponsor Logo */}
                    <div style={{ background: '#1E293B', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F1F5F9' }}>Center Sponsor / Torso Logo</span>
                        <input
                          type="checkbox"
                          checked={Boolean(designConfig.front.torsoLogo?.enabled)}
                          onChange={(e) => handleToggleLogo('torso', e.target.checked)}
                          style={{ accentColor: '#E4572E', width: '15px', height: '15px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {designConfig.front.torsoLogo?.uploadedUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <img src={designConfig.front.torsoLogo.uploadedUrl} alt="Torso Sponsor" style={{ width: '40px', height: '24px', objectFit: 'contain', background: '#0F172A', borderRadius: '4px' }} />
                            <span style={{ fontSize: '11px', color: '#4ADE80', fontWeight: '600', flex: 1 }}>Logo loaded</span>
                            <button onClick={() => handleClearLogo('torso')} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ flex: 1, background: '#0F172A', border: '1px dashed rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}>
                            <Upload size={12} /> Upload Center Sponsor Logo
                            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload('torso', e)} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 6: Collar & Trim Styling */}
              <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'collar' ? null : 'collar')}
                  style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
                    <Shirt size={16} style={{ color: '#F59E0B' }} />
                    <span>Collar & Trim Styling</span>
                  </div>
                  {expandedSection === 'collar' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedSection === 'collar' && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Auto Match Collar to Artwork */}
                    <button
                      onClick={handleAutoMatchCollar}
                      style={{
                        background: 'linear-gradient(135deg, rgba(228,87,46,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                        border: '1px solid #E4572E',
                        color: '#FFFFFF',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={14} style={{ color: '#FF7A45' }} />
                      <span>Auto-Match Collar to Design Colors</span>
                    </button>

                    {/* Collar Band Color */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Collar Band Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              const newConfig = { ...designConfig };
                              if (newConfig.collar) newConfig.collar.generatedColor1 = col.hex;
                              if (newConfig.trim) newConfig.trim.collar = { ...newConfig.trim.collar, color: col.hex, enabled: true };
                              onDesignConfigChange(newConfig);
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.trim?.collar?.color === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Placket Color */}
                    <div>
                      <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Placket Color</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_SWATCHES.map(col => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              const newConfig = { ...designConfig };
                              if (newConfig.trim) newConfig.trim.placket = { ...newConfig.trim.placket, color: col.hex, enabled: true };
                              onDesignConfigChange(newConfig);
                            }}
                            title={col.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: col.hex,
                              border: designConfig.trim?.placket?.color === col.hex ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Curved Collar Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#E2E8F0', cursor: 'pointer' }}>
                      <span>Curved Cut Collar Band</span>
                      <input
                        type="checkbox"
                        checked={Boolean(designConfig.collar?.curved)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const newConfig = { ...designConfig };
                          if (newConfig.collar) newConfig.collar.curved = val;
                          onDesignConfigChange(newConfig);
                        }}
                        style={{ accentColor: '#E4572E', width: '15px', height: '15px' }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Next Step Button */}
            <button
              onClick={() => setActiveTab('roster')}
              style={{
                background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(228,87,46,0.3)'
              }}
            >
              <span>Next: Players Data & Import Sheet</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2: 📋 ORDER DETAILS, IMPORT & PLAYERS DATA
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ── 1. ORDER DETAILS (FIRST) ── */}
            <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC' }}>
                  Order Details
                </div>
                {/* Size Editor minimized as setting icon */}
                <button
                  type="button"
                  onClick={() => setShowSizeModal(true)}
                  title={`Size Settings & Presets (${activeSizePreset})`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#FF7A45',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Settings size={14} />
                  <span>Sizes ({activeSizePreset})</span>
                </button>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Customer / Team Name</label>
                <input
                  type="text"
                  value={metadata.customerName}
                  onChange={(e) => onMetadataChange({ ...metadata, customerName: e.target.value })}
                  placeholder="e.g. Blue Dragons XI"
                  style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Order Number</label>
                  <input
                    type="text"
                    value={metadata.orderNum}
                    onChange={(e) => onMetadataChange({ ...metadata, orderNum: e.target.value })}
                    placeholder="01"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>WhatsApp #</label>
                  <input
                    type="tel"
                    value={metadata.whatsapp || ''}
                    onChange={(e) => onMetadataChange({ ...metadata, whatsapp: e.target.value })}
                    placeholder="e.g. 9876543210"
                    style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#CBD5E1', cursor: 'pointer' }}>
                  <span>Merge Half Sleeves (pair per row)</span>
                  <input
                    type="checkbox"
                    checked={metadata.halfSleeveMerge}
                    onChange={(e) => onMetadataChange({ ...metadata, halfSleeveMerge: e.target.checked })}
                    style={{ accentColor: '#E4572E', width: '16px', height: '16px' }}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#CBD5E1', cursor: 'pointer' }}>
                  <span>Raglan Style Sleeves</span>
                  <input
                    type="checkbox"
                    checked={metadata.raglanStyle}
                    onChange={(e) => onMetadataChange({ ...metadata, raglanStyle: e.target.checked })}
                    style={{ accentColor: '#E4572E', width: '16px', height: '16px' }}
                  />
                </label>
              </div>
            </div>

            {/* ── 2. EXCEL / CSV IMPORT (SECOND) ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1.5px dashed rgba(34, 197, 94, 0.45)',
              borderRadius: '14px',
              padding: '16px',
              position: 'relative'
            }}>
              <input
                ref={sheetFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSheetFileChange}
                disabled={sheetImportLoading}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4ADE80',
                  flexShrink: 0
                }}>
                  {sheetImportLoading ? <RefreshCw size={22} className="animate-spin" /> : <FileSpreadsheet size={22} />}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>
                    {sheetImportLoading ? 'Processing Sheet...' : 'Import Sheet (Excel / CSV)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Tap to upload players data (.xlsx, .xls, .csv). Auto-detects names, numbers, sizes & sleeves.
                  </div>
                </div>
              </div>
            </div>

            {sheetImportMessage && (
              <div style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: sheetImportMessage.startsWith('✅') ? '#4ADE80' : '#FACC15', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{sheetImportMessage}</span>
                <button onClick={() => setSheetImportMessage(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={12} /></button>
              </div>
            )}

            {/* ── 3. PLAYERS DATA LIST (THIRD) ── */}
            <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC' }}>Players Data</span>
                  <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(228,87,46,0.2)', color: '#FF7A45', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    {totalQty} Jerseys
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Minimized Size Settings Icon Button */}
                  <button
                    onClick={() => setShowSizeModal(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FF7A45',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title={`Size Settings & Presets (${activeSizePreset})`}
                  >
                    <Settings size={16} />
                  </button>

                  <button
                    onClick={() => setShowAddPlayer(true)}
                    style={{ background: '#E4572E', border: 'none', color: '#FFFFFF', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Add Jersey
                  </button>
                </div>
              </div>

              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748B', fontSize: '12px' }}>
                  No jerseys in players data yet. Use <strong>Import Sheet</strong> above or tap <strong>+ Add Jersey</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                  {records.map((rec, idx) => (
                    <div
                      key={rec.id}
                      style={{ background: '#1E293B', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#E4572E' }}>
                          {rec.number || `${idx + 1}`}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>{rec.name}</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                            Size: <strong style={{ color: '#F1F5F9' }}>{rec.size}</strong> • {rec.sleeve === 'full' ? 'Full Sleeve' : 'Half Sleeve'} • Qty: {rec.qty}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => handleRemovePlayer(rec.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '6px', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('export')}
              style={{
                background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(228,87,46,0.3)'
              }}
            >
              <span>Next: Export Panels</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 3: 🚀 EXPORT (PAYMENT PLACED ON TOP + INDIVIDUAL PANELS ONLY)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ── 1. PAYMENT & WALLET PLACED ON TOP AS REQUESTED ── */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1.5px solid rgba(228, 87, 46, 0.4)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} style={{ color: '#E4572E' }} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Payment Options (GPay / Wallet)
                  </span>
                </div>
                <span style={{ fontSize: '11px', background: currentUser ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: currentUser ? '#4ADE80' : '#FACC15', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  {currentUser ? currentUser.name.split(' ')[0] : 'Guest'}
                </span>
              </div>

              {/* Total Order Cost & Wallet Balance Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#090D16', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Order Total ({totalQty || 1} pcs)</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#FF7A45' }}>
                    ₹{orderCost.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Wallet Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF' }}>
                    ₹{currentUser ? currentUser.balance.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Payment Option 1: Pay with Wallet (Instant) */}
              {currentUser && currentUser.balance >= orderCost ? (
                <button
                  onClick={() => nestingRef.current?.executePaymentWithWallet()}
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '13px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  <Wallet size={17} />
                  <span>Pay ₹{orderCost.toFixed(2)} with Wallet (Instant)</span>
                </button>
              ) : (
                <div style={{
                  background: '#090D16',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#94A3B8'
                }}>
                  <div>
                    <span style={{ color: '#CBD5E1', fontWeight: '700' }}>Wallet Balance:</span> ₹{currentUser ? currentUser.balance.toFixed(2) : '0.00'}
                    <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '1px' }}>
                      {currentUser ? `Need ₹${(orderCost - currentUser.balance).toFixed(2)} more` : 'Sign in to use FiveNest wallet'}
                    </div>
                  </div>
                  {!currentUser ? (
                    <button
                      onClick={onOpenLogin}
                      style={{
                        background: '#2563EB',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Sign In
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('payment')}
                      style={{
                        background: 'rgba(255, 122, 69, 0.15)',
                        border: '1px solid rgba(255, 122, 69, 0.3)',
                        color: '#FF7A45',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Recharge
                    </button>
                  )}
                </div>
              )}

              {/* Payment Option 2: Pay with GPay (Google Pay) */}
              <a
                href={upiDeepLink}
                style={{
                  background: '#000000',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '800',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '15px', fontWeight: '900' }}>
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#FBBC05' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>
                  <span style={{ color: '#FFFFFF', marginLeft: '2px' }}>Pay</span>
                </span>
                <span style={{ color: '#64748B', fontSize: '12px' }}>•</span>
                <span>Pay ₹{orderCost.toFixed(2)} with GPay</span>
              </a>
            </div>

            {/* ── 2. ARTWORK READINESS BANNER ── */}
            <div style={{
              background: anyArtworkUploaded ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
              border: anyArtworkUploaded ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {anyArtworkUploaded ? (
                <>
                  <CheckCircle2 size={18} style={{ color: '#22C55E', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#4ADE80' }}>
                      Artwork Ready for Export
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {records.length > 0 ? `${totalQty} jerseys configured` : '1 default jersey ready'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={18} style={{ color: '#FACC15', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#FACC15' }}>
                      Artwork Missing
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Upload at least Front, Back or Sleeves in the Artwork tab before exporting.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── 3. DIRECT EXPORT INDIVIDUAL FILES (NO CLUNKY BOTTOM ZIP PANEL) ── */}
            <button
              onClick={() => nestingRef.current?.exportPanelsZip()}
              disabled={!anyArtworkUploaded}
              style={{
                background: anyArtworkUploaded ? 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)' : '#334155',
                border: 'none',
                color: '#FFFFFF',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: anyArtworkUploaded ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: anyArtworkUploaded ? '0 4px 14px rgba(228,87,46,0.35)' : 'none'
              }}
            >
              <Download size={18} />
              <span>Export Individual Files (300 DPI)</span>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 4: 💳 PAYMENT (Full dedicated wallet & recharge screen)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Wallet Balance Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(228, 87, 46, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={18} style={{ color: '#E4572E' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    FiveNest Wallet
                  </span>
                </div>
                <span style={{ fontSize: '11px', background: currentUser ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: currentUser ? '#4ADE80' : '#FACC15', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                  {currentUser ? currentUser.name.split(' ')[0] : 'Guest'}
                </span>
              </div>

              <div style={{ fontSize: '32px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                ₹{currentUser ? currentUser.balance.toFixed(2) : '0.00'}
              </div>

              <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={13} style={{ color: '#22C55E' }} />
                <span>Instant auto-deduction on export • No delays</span>
              </div>
            </div>

            {/* Quick Wallet Recharge Presets */}
            <div style={{ background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                  Recharge Wallet via GPay
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>
                  Google Pay
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                {[100, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleRechargeWallet(amt)}
                    disabled={topupLoading}
                    style={{ background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#FFFFFF', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <span>+ ₹{amt}</span>
                  </button>
                ))}
              </div>

              {topupMessage && (
                <div style={{ fontSize: '11px', color: topupMessage.startsWith('✅') ? '#4ADE80' : '#EF4444', textAlign: 'center', marginTop: '6px' }}>
                  {topupMessage}
                </div>
              )}
            </div>

            {!currentUser && (
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: '#93C5FD' }}>
                  Sign in to save your wallet balance and history across devices.
                </div>
                <button onClick={onOpenLogin} style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Fixed Bottom Thumb Navigation Bar ── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 10px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))'
      }}>
        <button
          onClick={() => setActiveTab('artwork')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'artwork' ? '#E4572E' : '#94A3B8', cursor: 'pointer' }}
        >
          <Palette size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'artwork' ? '800' : '600' }}>Artwork</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'roster' ? '#E4572E' : '#94A3B8', cursor: 'pointer', position: 'relative' }}
        >
          <Users size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'roster' ? '800' : '600' }}>Players Data</span>
          {records.length > 0 && (
            <span style={{ position: 'absolute', top: '-3px', right: '8px', background: '#E4572E', color: '#FFFFFF', borderRadius: '8px', padding: '1px 5px', fontSize: '9px', fontWeight: '800' }}>
              {totalQty}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('export')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'export' ? '#E4572E' : '#94A3B8', cursor: 'pointer', position: 'relative' }}
        >
          <Download size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'export' ? '800' : '600' }}>Export & Pay</span>
          {anyArtworkUploaded && (
            <span style={{ position: 'absolute', top: '-2px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: activeTab === 'payment' ? '#E4572E' : '#94A3B8', cursor: 'pointer' }}
        >
          <CreditCard size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'payment' ? '800' : '600' }}>Wallet</span>
        </button>
      </nav>

      {/* ── Add Player Quick Modal ── */}
      {showAddPlayer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 0 calc(env(safe-area-inset-bottom, 0px)) 0'
        }}>
          <div style={{
            background: '#0F172A',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px 20px 0 0',
            width: '100%',
            maxWidth: '500px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>Add to Players Data</span>
              <button onClick={() => setShowAddPlayer(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Player Name</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="e.g. VIKRAM"
                style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '9px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Jersey Number</label>
                <input
                  type="text"
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value)}
                  placeholder="e.g. 07"
                  style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '9px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94A3B8' }}>Size</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlayer(false);
                      setShowSizeModal(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#FF7A45', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: 0 }}
                  >
                    <Ruler size={11} /> Edit Sizes
                  </button>
                </div>
                <select
                  value={newPlayerSize}
                  onChange={(e) => setNewPlayerSize(e.target.value)}
                  style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '9px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                >
                  {Object.keys(sizeDB).map(s => (
                    <option key={s} value={s}>{s} ({DEFAULT_SIZE_AGE_MAP[s] || 'Standard'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Sleeve Style</label>
                <select
                  value={newPlayerSleeve}
                  onChange={(e) => setNewPlayerSleeve(e.target.value as any)}
                  style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '9px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                >
                  <option value="half">Half Sleeve</option>
                  <option value="full">Full Sleeve</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newPlayerQty}
                  onChange={(e) => setNewPlayerQty(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '9px 12px', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              onClick={handleAddPlayer}
              style={{ background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)', border: 'none', color: '#FFFFFF', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}
            >
              Add to Players Data
            </button>
          </div>
        </div>
      )}

      {/* ── Size Editor & Dimensions Modal ── */}
      {showSizeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0 0 calc(env(safe-area-inset-bottom, 0px)) 0'
        }}>
          <div style={{
            background: '#0F172A',
            borderTop: '1.5px solid rgba(228, 87, 46, 0.4)',
            borderRadius: '20px 20px 0 0',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(228,87,46,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7A45' }}>
                  <Ruler size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                    Size Editor & Dimensions
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Customize chest, length & sleeve inches per size
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSizeModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* ── SIZING PRESETS MANAGER (Save & Load Presets) ── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(228,87,46,0.12) 0%, rgba(30,41,59,0.85) 100%)',
                border: '1.5px solid rgba(228, 87, 46, 0.35)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Bookmark size={15} style={{ color: '#FF7A45' }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Sizing Presets
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    background: 'rgba(255, 122, 69, 0.15)',
                    color: '#FF7A45',
                    border: '1px solid rgba(255, 122, 69, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '800'
                  }}>
                    Active: {activeSizePreset}
                  </span>
                </div>

                {/* Preset Selector Dropdown & Delete */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    value={activeSizePreset}
                    onChange={(e) => handleLoadSizePreset(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '8px 10px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Default Size">Default Size (Official Matrix 18–60)</option>
                    {Object.keys(savedSizePresets).map(name => (
                      <option key={name} value={name}>{name} (Custom Preset)</option>
                    ))}
                  </select>

                  {activeSizePreset !== 'Default Size' && savedSizePresets[activeSizePreset] && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSizePreset(activeSizePreset)}
                      title="Delete this custom preset"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        borderRadius: '8px',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Save Current Measurements as New Preset */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="New preset name (e.g. Slim Fit, Kids, Cricket)..."
                    value={newSizePresetName}
                    onChange={(e) => setNewSizePresetName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSizePreset(); }}
                    style={{
                      flex: 1,
                      background: '#0F172A',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      padding: '7px 10px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveSizePreset}
                    style={{
                      background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Save size={12} />
                    <span>Save Preset</span>
                  </button>
                </div>

                {sizePresetFeedback && (
                  <div style={{
                    fontSize: '11px',
                    color: sizePresetFeedback.includes('deleted') ? '#F87171' : '#4ADE80',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '4px',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    {sizePresetFeedback}
                  </div>
                )}
              </div>

              {/* Size Selection Chips */}
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Select Size to Customize ({DEFAULT_SIZE_AGE_MAP[selectedEditSize] || selectedEditSize}):
                </label>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                  {sizeList.map(s => {
                    const isSel = s === selectedEditSize;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedEditSize(s)}
                        style={{
                          background: isSel ? '#E4572E' : '#1E293B',
                          border: isSel ? '1px solid #E4572E' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: isSel ? '800' : '600',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editing Card for selected size */}
              <div style={{ background: '#1E293B', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#FF7A45', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Size {selectedEditSize} ({DEFAULT_SIZE_AGE_MAP[selectedEditSize] || 'Standard'})</span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>Units: Inches (")</span>
                </div>

                {/* Front Panel W & H */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Front Panel (Chest Width × Height)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Chest Width (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.front?.w ?? 22}
                        onChange={(e) => handleUpdateDimension('front', 'w', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Body Length (H)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.front?.h ?? 30}
                        onChange={(e) => handleUpdateDimension('front', 'h', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Back Panel W & H */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Back Panel (Width × Height)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Width (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.back?.w ?? 22}
                        onChange={(e) => handleUpdateDimension('back', 'w', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Length (H)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.back?.h ?? 30}
                        onChange={(e) => handleUpdateDimension('back', 'h', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Half Sleeve W & H */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Half Sleeve (Width × Length)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Sleeve Width (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.half?.w ?? 19}
                        onChange={(e) => handleUpdateDimension('half', 'w', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Sleeve Length (H)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.half?.h ?? 11}
                        onChange={(e) => handleUpdateDimension('half', 'h', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Full Sleeve W & H */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#CBD5E1', marginBottom: '6px' }}>
                    Full Sleeve (Width × Length)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Sleeve Width (W)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.full?.w ?? 19}
                        onChange={(e) => handleUpdateDimension('full', 'w', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>Sleeve Length (H)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentEditingConfig?.full?.h ?? 25}
                        onChange={(e) => handleUpdateDimension('full', 'h', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', padding: '7px 10px', color: '#FFFFFF', fontSize: '12px', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleResetAllSizes}
                  style={{
                    flex: 1,
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#CBD5E1',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveSizes}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(228,87,46,0.3)'
                  }}
                >
                  <Check size={14} /> Save & Apply Dimensions
                </button>
              </div>

              {onOpenSizeEditor && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSizeModal(false);
                    onOpenSizeEditor();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    color: '#94A3B8',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Open Full Desktop Matrix Grid
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
