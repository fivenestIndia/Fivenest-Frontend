import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, Users, Sliders, Download, Wallet, Check, AlertCircle, Copy, 
  Upload, ArrowRight, Sparkles, RefreshCw, X, Package, 
  CreditCard, CheckCircle2, RotateCw, ExternalLink, ChevronRight,
  Eye, Plus, Trash2, Camera, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';
import type { ArtDesignConfig } from './designer';
import type { PlayerRecord, OrderMetadata } from './orderEntry';
import type { SizeDatabase } from './sizesDb';
import type { NestingViewHandle } from './nestingView';
import { ThreeDPreview, type ThreeDPreviewHandle, generatePresentationBoard } from './ThreeDPreview';
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
  // Mobile navigation tabs
  const [activeTab, setActiveTab] = useState<'artwork' | 'roster' | 'export' | 'payment'>('artwork');
  const [showPcNotice, setShowPcNotice] = useState<boolean>(() => {
    return localStorage.getItem('fivenest_dismiss_pc_notice') !== 'true';
  });

  // 3D Preview reference & trigger
  const threeDRef = useRef<ThreeDPreviewHandle>(null);
  const [trigger3D, setTrigger3D] = useState<number>(0);
  const [cameraAngle, setCameraAngle] = useState<'front' | 'back' | 'left' | 'right'>('front');

  // Image cache map for 3D texture drawing
  const imageMapRef = useRef<Record<string, HTMLImageElement>>({});

  // Zip import state
  const [zipUploading, setZipUploading] = useState<boolean>(false);
  const [zipResultMsg, setZipResultMsg] = useState<string | null>(null);

  // Export progress
  const [isExportingCustom, setIsExportingCustom] = useState<boolean>(false);
  const [customExportStatus, setCustomExportStatus] = useState<string>('');

  // Payment top-up state
  const [topupAmount, setTopupAmount] = useState<string>('500');
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
  const hasFront = Boolean(designConfig.front.uploadedFileUrl || (designConfig.front.backgroundType === 'generate' && designConfig.front.generatedColor1));
  const hasBack = Boolean(designConfig.back.uploadedFileUrl || (designConfig.back.backgroundType === 'generate' && designConfig.back.generatedColor1));
  const hasSleeve = Boolean(designConfig.sleeveLeft.uploadedFileUrl || designConfig.sleeveRight.uploadedFileUrl);
  const hasCollar = Boolean(designConfig.collar?.uploadedFileUrl || designConfig.trim?.collar?.uploadedUrl);
  const anyArtworkUploaded = hasFront || hasBack || hasSleeve || hasCollar;

  // Cost calculation (default ₹3.00/pc with logo watermark)
  const orderCost = Math.max(0, (records.length > 0 ? totalQty : 1) * 3.00);

  // Preload artwork images whenever designConfig changes
  useEffect(() => {
    const urlsToPreload = [
      designConfig.front.uploadedFileUrl,
      designConfig.back.uploadedFileUrl,
      designConfig.sleeveLeft.uploadedFileUrl,
      designConfig.sleeveRight.uploadedFileUrl,
      designConfig.collar?.uploadedFileUrl,
      designConfig.trim?.collar?.uploadedUrl
    ].filter(Boolean) as string[];

    urlsToPreload.forEach(url => {
      if (!imageMapRef.current[url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imageMapRef.current[url] = img;
          setTrigger3D(prev => prev + 1);
        };
        img.src = url;
      }
    });
  }, [designConfig]);

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
        setTrigger3D(prev => prev + 1);
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
      setTrigger3D(prev => prev + 1);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clear a single panel image
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
    setTrigger3D(prev => prev + 1);
  };

  // Render panel texture for 3D Preview
  const renderPanelToCanvas = (
    panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print',
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _scale: number,
    _is3DPreview: boolean = true
  ) => {
    const panel = designConfig[panelKey];
    if (!panel) return;

    // Background color
    ctx.fillStyle = panel.generatedColor1 || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Gradient if selected
    if (panel.backgroundType === 'generate' && panel.generatedGradientStyle) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, panel.generatedColor1 || '#FFFFFF');
      grad.addColorStop(1, panel.generatedColor2 || '#1E3A8A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Uploaded artwork image
    const imgUrl = panel.uploadedFileUrl;
    if (imgUrl) {
      const img = imageMapRef.current[imgUrl];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          imageMapRef.current[imgUrl] = newImg;
          setTrigger3D(prev => prev + 1);
        };
        newImg.src = imgUrl;
      }
    }
  };

  // Download 3D Presentation Board Mockup (JPG)
  const handleDownload3DMockupJPG = async () => {
    if (!threeDRef.current) {
      alert("3D Studio is initializing. Please try again in a moment.");
      return;
    }

    setIsExportingCustom(true);
    setCustomExportStatus("Rendering 4 camera angles in 3D...");

    try {
      const views = await threeDRef.current.captureAll4Views((step, total) => {
        setCustomExportStatus(`Capturing 3D angle ${step} of ${total}...`);
      });

      setCustomExportStatus("Generating 2400x1600 Presentation Board...");
      const presentationJpg = await generatePresentationBoard(views, {
        orderNumber: metadata.orderNum || '01',
        designName: metadata.customerName || 'Sublimation Jersey',
        bgColor: '#0B0F19',
        sleeveType: metadata.raglanStyle ? 'Raglan Sleeve' : 'Set-in Sleeve'
      });

      const cleanCust = (metadata.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanOrder = (metadata.orderNum || '01').replace(/[^a-zA-Z0-9_-]/g, '_');
      const link = document.createElement('a');
      link.href = presentationJpg;
      link.download = `${cleanCust}_${cleanOrder}_3D_Mockup_Proof.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(`Failed to export 3D Mockup: ${err.message || err}`);
    } finally {
      setIsExportingCustom(false);
      setCustomExportStatus('');
    }
  };

  // Download 4 Angles 3D Mockup ZIP
  const handleDownload4AnglesZip = async () => {
    if (!threeDRef.current) return;

    setIsExportingCustom(true);
    setCustomExportStatus("Rendering 4 camera angles...");

    try {
      const views = await threeDRef.current.captureAll4Views((step, total) => {
        setCustomExportStatus(`Capturing 3D view ${step} of ${total}...`);
      });

      setCustomExportStatus("Building 4-angle ZIP package...");
      const zip = new JSZip();

      const toBlob = async (dataUrl: string) => {
        const res = await fetch(dataUrl);
        return res.blob();
      };

      zip.file("1_Front_View.jpg", await toBlob(views.front));
      zip.file("2_Back_View.jpg", await toBlob(views.back));
      zip.file("3_Left_Sleeve_View.jpg", await toBlob(views.left));
      zip.file("4_Right_Sleeve_View.jpg", await toBlob(views.right));

      const content = await zip.generateAsync({ type: "blob" });
      const cleanCust = (metadata.customerName || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanOrder = (metadata.orderNum || '01').replace(/[^a-zA-Z0-9_-]/g, '_');

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${cleanCust}_${cleanOrder}_3D_Angles.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(`Failed to export 4 Angles ZIP: ${err.message || err}`);
    } finally {
      setIsExportingCustom(false);
      setCustomExportStatus('');
    }
  };

  // Add a new player to roster
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
        background: 'rgba(15, 23, 42, 0.92)',
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
              <strong>PC CAD Tools:</strong> Precision millimeter rulers, vector warping, and roll nest layouts are best on PC/Laptop.
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
            TAB 1: 🎨 ARTWORK & 3D PREVIEW
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'artwork' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1-Tap Bulk ZIP Upload Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(228,87,46,0.15) 0%, rgba(30,41,59,0.7) 100%)',
              border: '1.5px dashed rgba(228,87,46,0.5)',
              borderRadius: '14px',
              padding: '16px',
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(228,87,46,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E4572E'
                }}>
                  {zipUploading ? <RefreshCw size={20} className="animate-spin" /> : <Upload size={20} />}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>
                  {zipUploading ? 'Extracting ZIP Panels...' : '1-Tap Bulk ZIP Import'}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Auto-detects Front, Back, Sleeves, and Collar from ZIP file
                </div>
              </div>
            </div>

            {zipResultMsg && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.8)',
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
                <button onClick={() => setZipResultMsg(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* 3D Mockup Studio Card */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#F8FAFC' }}>
                    3D Interactive Mockup
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Touch to Rotate 360°</span>
              </div>

              {/* 3D Canvas Viewport */}
              <div style={{
                height: '280px',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#070A12',
                position: 'relative'
              }}>
                <ThreeDPreview
                  ref={threeDRef}
                  designConfig={designConfig}
                  renderPanelToCanvas={renderPanelToCanvas}
                  previewSleeveType={records.some(r => r.sleeve === 'full') ? 'full' : 'half'}
                  prefTrigger={trigger3D}
                  bgColor="#070A12"
                />

                {/* Quick Camera Angle Pills overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '6px',
                  zIndex: 20
                }}>
                  {(['front', 'back', 'left', 'right'] as const).map(angle => (
                    <button
                      key={angle}
                      onClick={() => {
                        setCameraAngle(angle);
                        threeDRef.current?.setCameraAngle(angle);
                      }}
                      style={{
                        background: cameraAngle === angle ? '#E4572E' : 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        backdropFilter: 'blur(6px)'
                      }}
                    >
                      {angle}
                    </button>
                  ))}
                  <button
                    onClick={() => threeDRef.current?.resetCamera()}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    title="Reset Angle"
                  >
                    <RotateCw size={11} />
                  </button>
                </div>
              </div>

              {/* 1-Tap Download 3D Proof Button */}
              <button
                onClick={handleDownload3DMockupJPG}
                disabled={isExportingCustom}
                style={{
                  background: 'linear-gradient(135deg, #FF6B3D 0%, #E4572E 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(228,87,46,0.35)'
                }}
              >
                {isExportingCustom ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{customExportStatus || 'Rendering Mockup...'}</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download 3D Mockup JPG (Presentation Proof)</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Collar Color Selection */}
            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '14px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
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
                      setTrigger3D(prev => prev + 1);
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
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>
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
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Front</span>
                    {hasFront && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '70px',
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
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No file</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '5px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('front', e)} style={{ display: 'none' }} />
                    </label>
                    {hasFront && (
                      <button onClick={() => handleClearPanel('front')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}>
                        <Trash2 size={11} />
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
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Back</span>
                    {hasBack && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>

                  <div style={{
                    height: '70px',
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
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No file</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '5px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('back', e)} style={{ display: 'none' }} />
                    </label>
                    {hasBack && (
                      <button onClick={() => handleClearPanel('back')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}>
                        <Trash2 size={11} />
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
                    height: '70px',
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
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No file</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '5px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('sleeveLeft', e)} style={{ display: 'none' }} />
                    </label>
                    {designConfig.sleeveLeft.uploadedFileUrl && (
                      <button onClick={() => handleClearPanel('sleeveLeft')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}>
                        <Trash2 size={11} />
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
                    height: '70px',
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
                      <span style={{ fontSize: '10px', color: '#64748B' }}>No file</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <label style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '5px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}>
                      Upload
                      <input type="file" accept="image/*" onChange={(e) => handleSinglePanelUpload('sleeveRight', e)} style={{ display: 'none' }} />
                    </label>
                    {designConfig.sleeveRight.uploadedFileUrl && (
                      <button onClick={() => handleClearPanel('sleeveRight')} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#EF4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Next Step Pill */}
            <button
              onClick={() => setActiveTab('roster')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>Next: Edit Roster & Order</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2: 📋 ROSTER & JOB DETAILS
           ════════════════════════════════════════════════════════ */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
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

            {/* Players Roster Card */}
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
                  No jerseys added yet. Tap <strong>+ Add Jersey</strong> to specify names and sizes.
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
                cursor: 'pointer'
              }}
            >
              <span>Next: Export Files</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 3: 🚀 EXPORT FILES
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

            {/* Direct Export Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Option 1: Panels ZIP */}
              <div style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(228,87,46,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#E4572E',
                    flexShrink: 0
                  }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                      Sublimation Panels (ZIP)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      High-res Front, Back, Sleeves & Collars sorted with quantities
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => nestingRef.current?.exportPanelsZip()}
                  disabled={!anyArtworkUploaded}
                  style={{
                    background: '#E4572E',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: anyArtworkUploaded ? 'pointer' : 'not-allowed',
                    opacity: anyArtworkUploaded ? 1 : 0.5,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Download ZIP
                </button>
              </div>

              {/* Option 2: 3D Mockup Presentation Board (JPG) */}
              <div style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA',
                    flexShrink: 0
                  }}>
                    <Eye size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                      3D Mockup Proof (JPG)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      2400x1600 4-in-1 angle client proof card for WhatsApp
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload3DMockupJPG}
                  disabled={isExportingCustom}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Download JPG
                </button>
              </div>

              {/* Option 3: 4-Angles 3D ZIP */}
              <div style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#C084FC',
                    flexShrink: 0
                  }}>
                    <RotateCw size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                      4-Angle 3D Images (ZIP)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Individual Front, Back, Left & Right high-res views
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload4AnglesZip}
                  disabled={isExportingCustom}
                  style={{
                    background: '#9333EA',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Download ZIP
                </button>
              </div>

              {/* Option 4: Production Print Roll (PDF) */}
              <div style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ADE80',
                    flexShrink: 0
                  }}>
                    <Sliders size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                      Production Print Roll (PDF)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Packed nesting roll layout ready for direct plotter RIP
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => nestingRef.current?.exportRollPDF()}
                  disabled={!anyArtworkUploaded}
                  style={{
                    background: '#16A34A',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: anyArtworkUploaded ? 'pointer' : 'not-allowed',
                    opacity: anyArtworkUploaded ? 1 : 0.5,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Download Roll
                </button>
              </div>
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
        {/* Tab 1: Artwork */}
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
          <span style={{ fontSize: '10px', fontWeight: activeTab === 'artwork' ? '800' : '600' }}>Artwork & 3D</span>
        </button>

        {/* Tab 2: Roster */}
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

        {/* Tab 3: Export */}
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
