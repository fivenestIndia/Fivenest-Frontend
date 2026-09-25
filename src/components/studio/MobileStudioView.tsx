import React, { useState, useRef } from 'react';
import { 
  Palette, Users, Download, Wallet, Check, AlertCircle, Copy, 
  Upload, ArrowRight, Sparkles, RefreshCw, X, Package, 
  CreditCard, CheckCircle2, FileSpreadsheet, Plus, Trash2, 
  ShieldCheck, FileText, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';
import type { ArtDesignConfig } from './designer';
import type { PlayerRecord, OrderMetadata } from './orderEntry';
import type { SizeDatabase } from './sizesDb';
import type { NestingViewHandle } from './nestingView';
import { classifyZipPanelFile } from './zipHelper';

interface MobileStudioViewProps {
  records: PlayerRecord[];
  onRecordsChange: (records: PlayerRecord[]) => void;
  metadata: OrderMetadata;
  onMetadataChange: (metadata: OrderMetadata) => void;
  designConfig: ArtDesignConfig;
  onDesignConfigChange: (config: ArtDesignConfig) => void;
  sizeDB: SizeDatabase;
  currentUser: { email: string; name: string; balance: number; id?: string } | null;
  onUserChange: (user: { email: string; name: string; balance: number; id?: string } | null) => void;
  testMode: boolean;
  onTestModeChange: (val: boolean) => void;
  onOpenLogin: () => void;
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
  currentUser,
  onUserChange,
  testMode,
  onTestModeChange,
  onOpenLogin,
  nestingRef
}) => {
  // Mobile navigation tabs: Artwork, Roster, Export, Payment
  const [activeTab, setActiveTab] = useState<'artwork' | 'roster' | 'export' | 'payment'>('artwork');
  const [showPcNotice, setShowPcNotice] = useState<boolean>(() => {
    return localStorage.getItem('fivenest_dismiss_pc_notice') !== 'true';
  });

  // Zip upload state
  const [zipUploading, setZipUploading] = useState<boolean>(false);
  const [zipResultMsg, setZipResultMsg] = useState<string | null>(null);

  // Sheet import state
  const [sheetImportLoading, setSheetImportLoading] = useState<boolean>(false);
  const [sheetImportMessage, setSheetImportMessage] = useState<string | null>(null);
  const sheetFileInputRef = useRef<HTMLInputElement>(null);

  // Payment states
  const [topupLoading, setTopupLoading] = useState<boolean>(false);
  const [topupMessage, setTopupMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

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

  // Parse rows extracted from sheet
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

    // Content-based heuristic fallback
    if (!sizeKey || !sleeveKey || !nameKey) {
      rawKeys.forEach(k => {
        if (/^(filename|file|total|front size|half sleeve|full sleeve|sr|serial)/i.test(k)) return;
        const sampleVals = validRows.slice(0, 10).map(r => String(r[k] || '').trim());
        
        if (!sizeKey) {
          const sizeLikeCount = sampleVals.filter(v => /^(18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|S|M|L|XL|2XL|XXL|3XL|4XL)$/i.test(v)).length;
          if (sizeLikeCount >= Math.min(2, sampleVals.length)) {
            sizeKey = k;
          }
        }

        if (!sleeveKey) {
          const sleeveLikeCount = sampleVals.filter(v => /^(half|full|none|short|long|fls|lhs|rhs|sleeveless|full hand|half hand)$/i.test(v)).length;
          if (sleeveLikeCount >= Math.min(2, sampleVals.length)) {
            sleeveKey = k;
          }
        }

        if (!nameKey && k !== sizeKey && k !== sleeveKey && k !== numKey && k !== qtyKey) {
          const nameLikeCount = sampleVals.filter(v => /^[a-zA-Z\s\.\-]{2,}$/.test(v) && !/^(half|full|none|size)$/i.test(v)).length;
          if (nameLikeCount >= Math.min(2, sampleVals.length)) {
            nameKey = k;
          }
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
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
          qtyVal = parsed;
        }
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

    // Auto-update customer/team name if empty
    if (!metadata.customerName && fileName) {
      const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
      onMetadataChange({ ...metadata, customerName: cleanName });
    }

    onRecordsChange(mappedRecords);
    setSheetImportMessage(`✅ Imported ${mappedRecords.length} jerseys from ${fileName}`);
    setSheetImportLoading(false);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  // Process sheet file (Excel or CSV)
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
            console.error("Excel parse error", error);
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
            console.error("CSV parse error", error);
            setSheetImportMessage("❌ Failed to parse CSV file.");
            setSheetImportLoading(false);
          }
        });
      }
    } catch (err: any) {
      console.error("Sheet process error", err);
      setSheetImportMessage(`❌ Could not load sheet: ${err.message || err}`);
      setSheetImportLoading(false);
    } finally {
      e.target.value = '';
    }
  };

  // Handle Bulk ZIP Import
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

  // Handle individual panel image upload
  const handleSinglePanelUpload = (
    panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'collar',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newConfig = { ...designConfig };
      if (panelKey === 'collar') {
        if (newConfig.collar) {
          newConfig.collar = { ...newConfig.collar, uploadedFileUrl: dataUrl, backgroundType: 'upload' };
        }
        if (newConfig.trim?.collar) {
          newConfig.trim.collar = { ...newConfig.trim.collar, uploadedUrl: dataUrl };
        }
      } else {
        newConfig[panelKey] = {
          ...newConfig[panelKey],
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
  const handleClearPanel = (panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'collar') => {
    const newConfig = { ...designConfig };
    if (panelKey === 'collar') {
      if (newConfig.collar) newConfig.collar.uploadedFileUrl = null;
      if (newConfig.trim?.collar) newConfig.trim.collar.uploadedUrl = null;
    } else {
      newConfig[panelKey] = {
        ...newConfig[panelKey],
        uploadedFileUrl: null,
        backgroundType: 'generate'
      };
    }
    onDesignConfigChange(newConfig);
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

  // Handle Quick Top-up in payment tab
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

  // Copy UPI ID to clipboard
  const handleCopyUPI = () => {
    navigator.clipboard.writeText("vilesh332-1@okhdfcbank");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // UPI deep link for 1-tap app launch
  const upiDeepLink = `upi://pay?pa=vilesh332-1@okhdfcbank&pn=FiveNest%20Studio&am=${orderCost.toFixed(2)}&cu=INR&tn=FiveNest%20Order%20${encodeURIComponent(metadata.orderNum || '01')}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiDeepLink)}`;

  // Dismiss PC notice
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
          {/* Test / Live Toggle */}
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

          {/* Orders Link */}
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

          {/* Wallet Balance Pill */}
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

      {/* ── CAD Tools PC Notice Banner (Dismissible) ── */}
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
            TAB 1: 🎨 ARTWORK (Clean 2D, NO 3D)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'artwork' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1-Tap Bulk ZIP Upload Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(228,87,46,0.15) 0%, rgba(30,41,59,0.7) 100%)',
              border: '1.5px dashed rgba(228,87,46,0.5)',
              borderRadius: '14px',
              padding: '18px 16px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={handleZipUpload}
                disabled={zipUploading}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(228,87,46,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E4572E'
                }}>
                  {zipUploading ? <RefreshCw size={22} className="animate-spin" /> : <Upload size={22} />}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                  {zipUploading ? 'Extracting ZIP Panels...' : '1-Tap Bulk ZIP Import'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', maxWidth: '280px' }}>
                  Select a ZIP file containing Front, Back, Sleeves, or Collar artwork. Auto-detects each panel automatically.
                </div>
              </div>
            </div>

            {zipResultMsg && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{zipResultMsg}</span>
                <button onClick={() => setZipResultMsg(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Collar & Trim Color Selection */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#F8FAFC' }}>
                Collar & Trim Color
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  '#FFFFFF', '#000000', '#0F172A', '#1E3A8A', '#0284C7', 
                  '#DC2626', '#E4572E', '#F59E0B', '#10B981', '#8B5CF6'
                ].map(col => (
                  <button
                    key={col}
                    onClick={() => {
                      const newConfig = { ...designConfig };
                      if (newConfig.trim?.collar) {
                        newConfig.trim.collar = { ...newConfig.trim.collar, color: col };
                      }
                      if (newConfig.collar) {
                        newConfig.collar = { ...newConfig.collar, generatedColor1: col };
                      }
                      onDesignConfigChange(newConfig);
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: col,
                      border: designConfig.trim?.collar?.color === col ? '3px solid #E4572E' : '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Individual Panels Upload Cards */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#F8FAFC' }}>
                Artwork Panels
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Front Panel Card */}
                <div style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '10px',
                  border: hasFront ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Front Panel</span>
                    {hasFront && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '80px',
                    borderRadius: '6px',
                    background: '#090D16',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}>
                    {designConfig.front.uploadedFileUrl ? (
                      <img src={designConfig.front.uploadedFileUrl} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No artwork</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('front', e)} style={{ display: 'none' }} />
                    </label>
                    {hasFront && (
                      <button onClick={() => handleClearPanel('front')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Back Panel Card */}
                <div style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '10px',
                  border: hasBack ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Back Panel</span>
                    {hasBack && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '80px',
                    borderRadius: '6px',
                    background: '#090D16',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}>
                    {designConfig.back.uploadedFileUrl ? (
                      <img src={designConfig.back.uploadedFileUrl} alt="Back" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No artwork</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('back', e)} style={{ display: 'none' }} />
                    </label>
                    {hasBack && (
                      <button onClick={() => handleClearPanel('back')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Left Sleeve Card */}
                <div style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '10px',
                  border: designConfig.sleeveLeft.uploadedFileUrl ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Left Sleeve</span>
                    {designConfig.sleeveLeft.uploadedFileUrl && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '80px',
                    borderRadius: '6px',
                    background: '#090D16',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}>
                    {designConfig.sleeveLeft.uploadedFileUrl ? (
                      <img src={designConfig.sleeveLeft.uploadedFileUrl} alt="L Sleeve" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No artwork</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('sleeveLeft', e)} style={{ display: 'none' }} />
                    </label>
                    {designConfig.sleeveLeft.uploadedFileUrl && (
                      <button onClick={() => handleClearPanel('sleeveLeft')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Sleeve Card */}
                <div style={{
                  background: '#1E293B',
                  borderRadius: '10px',
                  padding: '10px',
                  border: designConfig.sleeveRight.uploadedFileUrl ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Right Sleeve</span>
                    {designConfig.sleeveRight.uploadedFileUrl && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '80px',
                    borderRadius: '6px',
                    background: '#090D16',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}>
                    {designConfig.sleeveRight.uploadedFileUrl ? (
                      <img src={designConfig.sleeveRight.uploadedFileUrl} alt="R Sleeve" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No artwork</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('sleeveRight', e)} style={{ display: 'none' }} />
                    </label>
                    {designConfig.sleeveRight.uploadedFileUrl && (
                      <button onClick={() => handleClearPanel('sleeveRight')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
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
              <span>Next: Edit Roster & Import Sheet</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2: 📋 ROSTER & JOB DETAILS (With Import Sheet)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Import Sheet Action Card */}
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
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  zIndex: 10
                }}
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
                    Tap to upload team roster (.xlsx, .xls, .csv). Auto-detects names, numbers, sizes & sleeves.
                  </div>
                </div>
              </div>
            </div>

            {sheetImportMessage && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: sheetImportMessage.startsWith('✅') ? '#4ADE80' : '#FACC15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{sheetImportMessage}</span>
                <button onClick={() => setSheetImportMessage(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Job Metadata Card */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC' }}>
                Order Details
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Customer / Team Name
                </label>
                <input
                  type="text"
                  value={metadata.customerName}
                  onChange={(e) => onMetadataChange({ ...metadata, customerName: e.target.value })}
                  placeholder="e.g. Blue Dragons XI"
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={metadata.orderNum}
                    onChange={(e) => onMetadataChange({ ...metadata, orderNum: e.target.value })}
                    placeholder="01"
                    style={{
                      width: '100%',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                    WhatsApp #
                  </label>
                  <input
                    type="tel"
                    value={metadata.whatsapp || ''}
                    onChange={(e) => onMetadataChange({ ...metadata, whatsapp: e.target.value })}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Quick style switches */}
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

            {/* Players Roster List Card */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC' }}>
                    Jersey Roster
                  </span>
                  <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(228,87,46,0.2)', color: '#FF7A45', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                    {totalQty} Jerseys
                  </span>
                </div>

                <button
                  onClick={() => setShowAddPlayer(true)}
                  style={{
                    background: '#E4572E',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Jersey
                </button>
              </div>

              {/* Player Items List */}
              {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748B', fontSize: '12px' }}>
                  No jerseys added yet. Use <strong>Import Sheet</strong> above or tap <strong>+ Add Jersey</strong>.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                  {records.map((rec, idx) => (
                    <div
                      key={rec.id}
                      style={{
                        background: '#1E293B',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: '#E4572E'
                        }}>
                          {rec.number || `${idx + 1}`}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                            {rec.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                            Size: <strong style={{ color: '#F1F5F9' }}>{rec.size}</strong> • {rec.sleeve === 'full' ? 'Full Sleeve' : 'Half Sleeve'} • Qty: {rec.qty}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemovePlayer(rec.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          padding: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Next Step Button */}
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
            TAB 3: 🚀 EXPORT (ONLY Individual Files / Panels ZIP)
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Artwork Readiness Status Banner */}
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
                      {records.length > 0 ? `${totalQty} jerseys configured` : '1 default jersey piece ready'}
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

            {/* ONLY Option: Sublimation Panels Individual Files ZIP */}
            <div style={{
              background: '#0F172A',
              border: '1.5px solid rgba(228, 87, 46, 0.35)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(228,87,46,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E4572E',
                  flexShrink: 0
                }}>
                  <Package size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                    Sublimation Panels (ZIP)
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    Individual high-resolution 300 DPI panels (Front, Back, Sleeves & Collars) sorted with quantities
                  </div>
                </div>
              </div>

              <div style={{
                background: '#1E293B',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px',
                color: '#CBD5E1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} style={{ color: '#22C55E' }} />
                  <span>Individual print files in separate folders (Front, Back, Sleeve, Collar)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} style={{ color: '#22C55E' }} />
                  <span>Formatted filenames with quantities (e.g. <code>40 = 5 F.jpg</code>)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} style={{ color: '#22C55E' }} />
                  <span>300 DPI ready for sublimation plotting</span>
                </div>
              </div>

              {/* 1-Tap Download Button */}
              <button
                onClick={() => nestingRef.current?.exportPanelsZip()}
                disabled={!anyArtworkUploaded}
                style={{
                  background: anyArtworkUploaded ? 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)' : '#334155',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '14px',
                  borderRadius: '10px',
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
                <span>Download Individual Panels (ZIP)</span>
              </button>
            </div>

            {/* Pay Button / Quick Wallet link */}
            <div style={{
              background: 'rgba(228,87,46,0.1)',
              border: '1px solid rgba(228,87,46,0.25)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FF7A45' }}>
                  Export Cost: ₹{orderCost.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Wallet Balance: ₹{currentUser ? currentUser.balance.toFixed(2) : '0.00'}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('payment')}
                style={{
                  background: '#E4572E',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Make Payment
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 4: 💳 MAKE PAYMENT & WALLET
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
                <span style={{
                  fontSize: '11px',
                  background: currentUser ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: currentUser ? '#4ADE80' : '#FACC15',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
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

            {/* Current Order Cost Breakdown */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                Current Order Cost
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                <span>Total Jerseys:</span>
                <span style={{ fontWeight: '700', color: '#FFFFFF' }}>{totalQty || 1} pcs</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                <span>Rate per Jersey:</span>
                <span style={{ fontWeight: '700', color: '#FFFFFF' }}>₹3.00</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#FF7A45' }}>
                <span>Order Total:</span>
                <span>₹{orderCost.toFixed(2)}</span>
              </div>

              {/* 1-Tap Pay with Wallet Button */}
              {currentUser && currentUser.balance >= orderCost ? (
                <button
                  onClick={() => nestingRef.current?.executePaymentWithWallet()}
                  style={{
                    background: '#16A34A',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} /> Pay ₹{orderCost.toFixed(2)} from Wallet
                </button>
              ) : null}

              {/* 1-Tap UPI Launch Button (Mobile Deep-Link) */}
              <a
                href={upiDeepLink}
                style={{
                  background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(228,87,46,0.35)',
                  marginTop: '4px'
                }}
              >
                <CreditCard size={16} /> Pay ₹{orderCost.toFixed(2)} via UPI App (GPay / PhonePe)
              </a>
            </div>

            {/* UPI QR Code & Manual Copy Card */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                Scan UPI QR Code
              </div>

              <div style={{
                padding: '10px',
                background: '#FFFFFF',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
              }}>
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              </div>

              {/* UPI ID with Copy Button */}
              <div style={{
                background: '#1E293B',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#CBD5E1',
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontFamily: 'monospace' }}>vilesh332-1@okhdfcbank</span>
                <button
                  onClick={handleCopyUPI}
                  style={{
                    background: copiedUpi ? '#16A34A' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                  {copiedUpi ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Quick Wallet Recharge Options */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: '#F8FAFC' }}>
                Recharge Wallet
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                {[100, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleRechargeWallet(amt)}
                    disabled={topupLoading}
                    style={{
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + ₹{amt}
                  </button>
                ))}
              </div>

              {topupMessage && (
                <div style={{ fontSize: '11px', color: topupMessage.startsWith('✅') ? '#4ADE80' : '#EF4444', textAlign: 'center', marginTop: '6px' }}>
                  {topupMessage}
                </div>
              )}
            </div>

            {/* Sign in banner if guest */}
            {!currentUser && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '12px', color: '#93C5FD' }}>
                  Sign in to save your wallet balance and history across devices.
                </div>
                <button
                  onClick={onOpenLogin}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
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
        {/* Tab 1: Artwork (Clean 2D) */}
        <button
          onClick={() => setActiveTab('artwork')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'artwork' ? '#E4572E' : '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <Palette size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'artwork' ? '800' : '600' }}>Artwork</span>
        </button>

        {/* Tab 2: Roster (With Import Sheet) */}
        <button
          onClick={() => setActiveTab('roster')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'roster' ? '#E4572E' : '#94A3B8',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Users size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'roster' ? '800' : '600' }}>Roster</span>
          {records.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '8px',
              background: '#E4572E',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '1px 5px',
              fontSize: '9px',
              fontWeight: '800'
            }}>
              {totalQty}
            </span>
          )}
        </button>

        {/* Tab 3: Export (Only Individual Panels ZIP) */}
        <button
          onClick={() => setActiveTab('export')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'export' ? '#E4572E' : '#94A3B8',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Download size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'export' ? '800' : '600' }}>Export</span>
          {anyArtworkUploaded && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '12px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22C55E'
            }} />
          )}
        </button>

        {/* Tab 4: Payment */}
        <button
          onClick={() => setActiveTab('payment')}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: activeTab === 'payment' ? '#E4572E' : '#94A3B8',
            cursor: 'pointer'
          }}
        >
          <CreditCard size={20} />
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'payment' ? '800' : '600' }}>Payment</span>
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
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#F8FAFC' }}>
                Add Player to Roster
              </span>
              <button
                onClick={() => setShowAddPlayer(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                Player Name
              </label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="e.g. VIKRAM"
                style={{
                  width: '100%',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Jersey Number
                </label>
                <input
                  type="text"
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value)}
                  placeholder="e.g. 07"
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Size
                </label>
                <select
                  value={newPlayerSize}
                  onChange={(e) => setNewPlayerSize(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {Object.keys(sizeDB).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Sleeve
                </label>
                <select
                  value={newPlayerSleeve}
                  onChange={(e) => setNewPlayerSleeve(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="half">Half Sleeve</option>
                  <option value="full">Full Sleeve</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPlayerQty}
                  onChange={(e) => setNewPlayerQty(parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleAddPlayer}
              style={{
                background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              Add to Roster
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
