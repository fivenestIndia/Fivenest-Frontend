import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { Play, Download, Sliders, Coins, QrCode, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import JSZip from 'jszip';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';

const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.85); // Optimized quality to reduce file sizes (by ~2x) without losing print clarity
  });
};

const injectJPDpi = (blob: Blob, dpiValue: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const view = new DataView(buffer);
      
      // Verify JPEG SOI marker (FF D8)
      if (view.byteLength < 2 || view.getUint16(0) !== 0xFFD8) {
        resolve(blob);
        return;
      }

      let offset = 2;
      let patched = false;

      // Find APP0 marker (FF E0)
      while (offset < buffer.byteLength - 4) {
        const marker = view.getUint16(offset);
        if (marker === 0xFFE0) {
          // APP0 Segment found - verify identifier "JFIF\0"
          if (view.getUint32(offset + 4) === 0x4A464946 && view.getUint8(offset + 8) === 0) {
            view.setUint8(offset + 11, 1); // Set units to 1 (dots per inch)
            view.setUint16(offset + 12, dpiValue); // X density
            view.setUint16(offset + 14, dpiValue); // Y density
            patched = true;
          }
          break;
        }
        if (marker === 0xFFDA || marker === 0xFFD9) break;
        const length = view.getUint16(offset + 2);
        offset += 2 + length;
      }

      // If APP0 header is missing, construct one and insert right after SOI
      if (!patched) {
        const newBuffer = new ArrayBuffer(buffer.byteLength + 18);
        const newView = new DataView(newBuffer);
        const oldBytes = new Uint8Array(buffer);
        const newBytes = new Uint8Array(newBuffer);

        newView.setUint16(0, 0xFFD8); // SOI
        newView.setUint16(2, 0xFFE0); // APP0 marker
        newView.setUint16(4, 16);     // Segment length
        newView.setUint8(6, 0x4A);    // 'J'
        newView.setUint8(7, 0x46);    // 'F'
        newView.setUint8(8, 0x49);    // 'I'
        newView.setUint8(9, 0x46);    // 'F'
        newView.setUint8(10, 0x00);   // '\0'
        newView.setUint8(11, 1);      // Version Major
        newView.setUint8(12, 1);      // Version Minor
        newView.setUint8(13, 1);      // Units (1 = DPI)
        newView.setUint16(14, dpiValue); // X density
        newView.setUint16(16, dpiValue); // Y density
        newView.setUint8(18, 0);      // Thumbnail width
        newView.setUint8(19, 0);      // Thumbnail height

        newBytes.set(oldBytes.subarray(2), 20);
        resolve(new Blob([newBuffer], { type: 'image/jpeg' }));
        return;
      }

      resolve(new Blob([buffer], { type: 'image/jpeg' }));
    };
    reader.onerror = () => resolve(blob);
    reader.readAsArrayBuffer(blob);
  });
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

import type { SizeDatabase } from './sizesDb';
import type { PlayerRecord, OrderMetadata } from './orderEntry';
import type { ArtDesignConfig, TextConfig } from './designer';

interface NestingViewProps {
  records: PlayerRecord[];
  metadata: OrderMetadata;
  sizeDB: SizeDatabase;
  designConfig: ArtDesignConfig;
  currentUser: { email: string; name: string; balance: number } | null;
  testMode: boolean;
  onUserChange: (user: { email: string; name: string; balance: number } | null) => void;
  onOpenLogin: () => void;
}

interface PlacedItem {
  recordId: string;
  playerName: string;
  playerNum: string;
  panelType: 'front' | 'back' | 'sleeve-left' | 'sleeve-right' | 'sleeve-merged' | 'a4-print';
  size: string;
  w: number; // inches
  h: number; // inches
  x: number; // nested x in inches
  y: number; // nested y in inches
  rotated: boolean;
  sleeveType?: 'half' | 'full';
  isRaglan?: boolean;
}

interface NestingSheet {
  width: number; // roll width in inches
  height: number; // actual sheet height in inches
  items: PlacedItem[];
  efficiency: number;
}

// 2D Packer helper node for Node Splitting (Tightest Fit)
class PackNode {
  used = false;
  x = 0;
  y = 0;
  w = 0;
  h = 0;
  down: PackNode | null = null;
  right: PackNode | null = null;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

export const NestingView: React.FC<NestingViewProps> = ({
  records,
  metadata,
  sizeDB,
  designConfig,
  currentUser,
  testMode,
  onUserChange,
  onOpenLogin
}) => {
  const [enableNesting, setEnableNesting] = useState<boolean>(true);
  const [rollW, setRollW] = useState<number>(64);
  const [rollH, setRollH] = useState<number>(100); // Max paper height before page split
  const [itemGap, setItemGap] = useState<number>(0.25);
  const [tightestFit, setTightestFit] = useState<boolean>(true);
  const [rotateToFit, setRotateToFit] = useState<boolean>(true);
  const [dpi, setDpi] = useState<number>(100); // Render DPI: 72, 100, 150, 300
  
  const [nestingSheets, setNestingSheets] = useState<NestingSheet[]>([]);
  const [isNesting, setIsNesting] = useState<boolean>(false);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentCost, setPaymentCost] = useState<number>(0);
  const [pendingExportAction, setPendingExportAction] = useState<(() => Promise<void>) | null>(null);
  const [simulatedPaymentLoading, setSimulatedPaymentLoading] = useState<boolean>(false);
  const [upiPaymentMethod, setUpiPaymentMethod] = useState<'wallet' | 'upi'>('wallet');

  const executePaymentWithWallet = async () => {
    if (!currentUser) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: success, error } = await supabase.rpc('deduct_export_credits', {
        amount_to_deduct: paymentCost,
        export_desc: `Exported ${records.reduce((acc, r) => acc + r.qty, 0)} items (${getItemsToExport().filter(item => item.panelType === 'back').length} back, ${getItemsToExport().filter(item => item.panelType === 'a4-print').length} A4)`
      });

      if (error) {
        alert(`Deduction failed: ${error.message}`);
        return;
      }

      if (!success) {
        alert("Insufficient wallet balance. Please recharge your wallet or scan the UPI QR code.");
        return;
      }

      const details = await fetchUserWallet(user.id);
      const updatedUser = {
        ...currentUser,
        balance: details.balance
      };
      
      localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
      onUserChange(updatedUser);
      
      setShowPaymentModal(false);
      if (pendingExportAction) {
        pendingExportAction();
      }
    } catch (err: any) {
      alert(`Payment failed: ${err.message || err}`);
    }
  };

  const executePaymentWithUPI = () => {
    setSimulatedPaymentLoading(true);
    setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 1. Simulate webhook wallet topup in database
          const { error: topupError } = await supabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: paymentCost,
            transaction_type: 'topup',
            description: `Simulated UPI payment topup for order export`
          });

          if (topupError) {
            console.error("Topup simulation failed:", topupError);
          }

          // 2. Perform credit deduction
          const { data: success, error: deductError } = await supabase.rpc('deduct_export_credits', {
            amount_to_deduct: paymentCost,
            export_desc: `Exported ${records.reduce((acc, r) => acc + r.qty, 0)} items via UPI`
          });

          if (deductError) {
             console.error("Deduction simulation failed:", deductError);
          }

          // 3. Fetch latest balance
          const details = await fetchUserWallet(user.id);
          const updatedUser = {
            ...currentUser,
            balance: details.balance
          };
          
          localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
          onUserChange(updatedUser);
        }
        
        setSimulatedPaymentLoading(false);
        setShowPaymentModal(false);

        if (pendingExportAction) {
          pendingExportAction();
        }
      } catch (err) {
        console.error("UPI simulation failed:", err);
        setSimulatedPaymentLoading(false);
        setShowPaymentModal(false);
      }
    }, 1500);
  };
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load custom fonts & nesting preferences on mount
  useEffect(() => {
    // Custom fonts
    const savedFonts = localStorage.getItem('teedex_custom_fonts');
    if (savedFonts) {
      try {
        const parsed = JSON.parse(savedFonts) as {name: string, url: string}[];
        parsed.forEach(async (font) => {
          try {
            let alreadyLoaded = false;
            document.fonts.forEach(f => {
              if (f.family === font.name) alreadyLoaded = true;
            });
            if (!alreadyLoaded) {
              const fontFace = new FontFace(font.name, `url(${font.url})`);
              const loaded = await fontFace.load();
              document.fonts.add(loaded);
            }
          } catch (e) {
            console.error("Error loading custom font from storage", e);
          }
        });
      } catch (e) {
        console.error("Failed to parse saved fonts", e);
      }
    }

    // Nesting options persistence
    const savedEnable = localStorage.getItem('fivenest_pref_enable_nesting');
    if (savedEnable) {
      try { setEnableNesting(JSON.parse(savedEnable)); } catch (e) {}
    }
    const savedRollW = localStorage.getItem('fivenest_pref_roll_w');
    if (savedRollW) {
      try { setRollW(JSON.parse(savedRollW)); } catch (e) {}
    }
    const savedRollH = localStorage.getItem('fivenest_pref_roll_h');
    if (savedRollH) {
      try { setRollH(JSON.parse(savedRollH)); } catch (e) {}
    }
    const savedGap = localStorage.getItem('fivenest_pref_item_gap');
    if (savedGap) {
      try { setItemGap(JSON.parse(savedGap)); } catch (e) {}
    }
    const savedTight = localStorage.getItem('fivenest_pref_tightest_fit');
    if (savedTight) {
      try { setTightestFit(JSON.parse(savedTight)); } catch (e) {}
    }
    const savedRotate = localStorage.getItem('fivenest_pref_rotate_to_fit');
    if (savedRotate) {
      try { setRotateToFit(JSON.parse(savedRotate)); } catch (e) {}
    }
    const savedDpi = localStorage.getItem('fivenest_pref_dpi');
    if (savedDpi) {
      try { setDpi(JSON.parse(savedDpi)); } catch (e) {}
    }
  }, []);

  // Trigger Nesting layout calculations
  // Helper to compile the list of all panel pieces to export on the fly
  const getItemsToExport = (): PlacedItem[] => {
    const items: PlacedItem[] = [];
    records.forEach((player, idx) => {
      const sizeConf = sizeDB[player.size] || sizeDB["40"];
      const isSleeveOnly = player.name.toUpperCase() === 'SLEEVE';
      const isFrontOnly = player.name.toUpperCase() === 'FRONT';
      const isBackOnly = player.name.toUpperCase() === 'BACK';
      
      for (let q = 0; q < player.qty; q++) {
        const itemIndex = `${player.id}-item-${idx}-${q}`;
        
        // Front panel
        if (!isSleeveOnly && !isBackOnly) {
          items.push({
            recordId: itemIndex,
            playerName: player.name,
            playerNum: player.number,
            panelType: 'front',
            size: player.size,
            w: sizeConf.front.w,
            h: sizeConf.front.h,
            x: 0,
            y: 0,
            rotated: false
          });
        }
        
        // Back panel (exported even in blank kit mode)
        if (!isSleeveOnly && !isFrontOnly) {
          items.push({
            recordId: itemIndex,
            playerName: player.name,
            playerNum: player.number,
            panelType: 'back',
            size: player.size,
            w: sizeConf.back.w,
            h: sizeConf.back.h,
            x: 0,
            y: 0,
            rotated: false
          });
        }

        // Sleeve panels
        if (!isFrontOnly && !isBackOnly && player.sleeve !== 'none') {
          let sleeveW = 0;
          let sleeveH = 0;
          if (player.sleeve === 'full') {
            sleeveW = metadata.raglanStyle ? sizeConf.rFull.w : sizeConf.full.w;
            sleeveH = metadata.raglanStyle ? sizeConf.rFull.h : sizeConf.full.h;
          } else {
            sleeveW = metadata.raglanStyle ? sizeConf.rHalf.w : sizeConf.half.w;
            sleeveH = metadata.raglanStyle ? sizeConf.rHalf.h : sizeConf.half.h;
          }

          if (metadata.halfSleeveMerge && player.sleeve === 'half' && !metadata.raglanStyle) {
            items.push({
              recordId: itemIndex,
              playerName: player.name,
              playerNum: player.number,
              panelType: 'sleeve-merged',
              size: player.size,
              w: sleeveW,
              h: (sleeveH * 2) + 0.2,
              x: 0,
              y: 0,
              rotated: false,
              sleeveType: player.sleeve as 'half' | 'full',
              isRaglan: metadata.raglanStyle
            });
          } else {
            items.push({
              recordId: itemIndex,
              playerName: player.name,
              playerNum: player.number,
              panelType: 'sleeve-left',
              size: player.size,
              w: sleeveW,
              h: sleeveH,
              x: 0,
              y: 0,
              rotated: false,
              sleeveType: player.sleeve as 'half' | 'full',
              isRaglan: metadata.raglanStyle
            });
            items.push({
              recordId: itemIndex,
              playerName: player.name,
              playerNum: player.number,
              panelType: 'sleeve-right',
              size: player.size,
              w: sleeveW,
              h: sleeveH,
              x: 0,
              y: 0,
              rotated: false,
              sleeveType: player.sleeve as 'half' | 'full',
              isRaglan: metadata.raglanStyle
            });
          }
        }

        // Standalone A4 chest/print panel (10x11 in)
        if (metadata.a4BackPrint && !isSleeveOnly) {
          items.push({
            recordId: itemIndex,
            playerName: player.name,
            playerNum: player.number,
            panelType: 'a4-print',
            size: player.size,
            w: 10,
            h: 11,
            x: 0,
            y: 0,
            rotated: false
          });
        }
      }
    });
    return items;
  };

  // Trigger Nesting layout calculations
  const runNesting = () => {
    if (records.length === 0) {
      alert("No items in order to nest. Please import a CSV or add quick size quantities first.");
      return;
    }
    
    setIsNesting(true);
    
    const itemsToPack = getItemsToExport();

    if (!enableNesting) {
      setIsNesting(false);
      return;
    }

    // Sort items by height descending for optimal packing
    itemsToPack.sort((a, b) => b.h - a.h);

    // 2. Perform Bin Packing
    let sheets: NestingSheet[] = [];
    const effectiveRollH = rollH;
    
    if (tightestFit) {
      sheets = packItemsTight(itemsToPack, effectiveRollH);
    } else {
      sheets = packItemsShelf(itemsToPack, effectiveRollH);
    }

    setNestingSheets(sheets);
    setActiveSheetIndex(0);
    setIsNesting(false);

    // Play victory confetti for premium experience
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#9b4dff', '#ff8c00', '#00e676']
    });
  };

  // --- 2D packing algorithms ---

  // Shelf Packer (Classic Row-based)
  const packItemsShelf = (items: any[], maxHParam?: number) => {
    const effectiveRollH = maxHParam ?? rollH;
    const sheets: NestingSheet[] = [];
    let currentItems: PlacedItem[] = [];
    let currentX = 0;
    let currentY = 0;
    let shelfHeight = 0;

    const commitSheet = () => {
      if (currentItems.length === 0) return;
      let maxH = 0;
      currentItems.forEach(item => {
        maxH = Math.max(maxH, item.y + item.h);
      });
      sheets.push({
        width: rollW,
        height: maxH,
        items: [...currentItems],
        efficiency: calculateEfficiency(currentItems, rollW, maxH)
      });
      currentItems = [];
      currentX = 0;
      currentY = 0;
      shelfHeight = 0;
    };

    for (const item of items as any[]) {
      const itemW = item.w;
      const itemH = item.h;
      const canRotate = rotateToFit && (itemH <= rollW);

      let placed = false;

      // 1. Try fit on current shelf
      if (currentX + itemW <= rollW && currentY + itemH <= effectiveRollH) {
        currentItems.push({
          ...item,
          x: currentX,
          y: currentY,
          rotated: false
        });
        currentX += itemW + itemGap;
        shelfHeight = Math.max(shelfHeight, itemH);
        placed = true;
      }
      // 2. Try fit rotated on current shelf
      else if (canRotate && currentX + itemH <= rollW && currentY + itemW <= effectiveRollH) {
        currentItems.push({
          ...item,
          w: itemH,
          h: itemW,
          x: currentX,
          y: currentY,
          rotated: true
        });
        currentX += itemH + itemGap;
        shelfHeight = Math.max(shelfHeight, itemW);
        placed = true;
      }

      // 3. Start new shelf on same sheet
      if (!placed) {
        const nextY = currentY + shelfHeight + itemGap;
        
        if (nextY + itemH <= effectiveRollH) {
          currentY = nextY;
          currentX = 0;
          shelfHeight = itemH;
          
          currentItems.push({
            ...item,
            x: currentX,
            y: currentY,
            rotated: false
          });
          currentX += itemW + itemGap;
          placed = true;
        } else if (canRotate && nextY + itemW <= effectiveRollH) {
          currentY = nextY;
          currentX = 0;
          shelfHeight = itemW;

          currentItems.push({
            ...item,
            w: itemH,
            h: itemW,
            x: currentX,
            y: currentY,
            rotated: true
          });
          currentX += itemH + itemGap;
          placed = true;
        }
      }

      // 4. Start new sheet
      if (!placed) {
        commitSheet();
        currentItems.push({
          ...item,
          x: 0,
          y: 0,
          rotated: false
        });
        currentX = itemW + itemGap;
        shelfHeight = itemH;
      }
    }

    commitSheet();
    return sheets;
  };

  // Node-Splitting Packer (Tight 2D bin packing)
  const packItemsTight = (items: any[], maxHParam?: number) => {
    const effectiveRollH = maxHParam ?? rollH;
    const sheets: NestingSheet[] = [];

    const splitNode = (node: PackNode, w: number, h: number) => {
      node.used = true;
      node.down = new PackNode(node.x, node.y + h, node.w, node.h - h);
      node.right = new PackNode(node.x + w, node.y, node.w - w, h);
    };

    const findNode = (root: PackNode, w: number, h: number): PackNode | null => {
      if (root.used) {
        return findNode(root.right!, w, h) || findNode(root.down!, w, h);
      }
      if (w <= root.w && h <= root.h) {
        return root;
      }
      return null;
    };

    for (const item of items) {
      const padW = item.w + itemGap;
      const padH = item.h + itemGap;
      let placed = false;

      // Try placing on existing sheets
      for (const sheet of sheets) {
        let node = findNode((sheet as any).root, padW, padH);
        let rotated = false;

        if (!node && rotateToFit) {
          node = findNode((sheet as any).root, padH, padW);
          if (node) rotated = true;
        }

        if (node) {
          const packW = rotated ? padH : padW;
          const packH = rotated ? padW : padH;
          splitNode(node, packW, packH);
          sheet.items.push({
            ...item,
            w: rotated ? item.h : item.w,
            h: rotated ? item.w : item.h,
            x: node.x,
            y: node.y,
            rotated
          });
          placed = true;
          break;
        }
      }

      // Start a new sheet
      if (!placed) {
        const rootNode = new PackNode(0, 0, rollW, effectiveRollH);
        let rotated = false;
        
        let node = findNode(rootNode, padW, padH);
        if (!node && rotateToFit) {
          node = findNode(rootNode, padH, padW);
          if (node) rotated = true;
        }

        const packW = rotated ? padH : padW;
        const packH = rotated ? padW : padH;
        
        const newItems: PlacedItem[] = [];
        
        if (node) {
          splitNode(node, packW, packH);
          newItems.push({
            ...item,
            w: rotated ? item.h : item.w,
            h: rotated ? item.w : item.h,
            x: node.x,
            y: node.y,
            rotated
          });
        } else {
          // Force fallback place at origin if it doesn't fit the sheet boundaries
          newItems.push({
            ...item,
            x: 0,
            y: 0,
            rotated: false
          });
        }

        sheets.push({
          width: rollW,
          height: effectiveRollH, // we will trim actual height later
          items: newItems,
          efficiency: 0,
          // Attach root for next items
          root: rootNode
        } as any);
      }
    }

    // Post-process sheets: trim actual height & compute efficiency
    sheets.forEach(sheet => {
      let maxBottom = 0;
      sheet.items.forEach(item => {
        maxBottom = Math.max(maxBottom, item.y + item.h);
      });
      sheet.height = maxBottom > 0 ? maxBottom : effectiveRollH;
      sheet.efficiency = calculateEfficiency(sheet.items, rollW, sheet.height);
    });

    return sheets;
  };

  const calculateEfficiency = (items: PlacedItem[], totalW: number, totalH: number) => {
    let itemArea = 0;
    items.forEach(item => {
      itemArea += item.w * item.h;
    });
    const totalArea = totalW * totalH;
    return totalArea > 0 ? Math.round((itemArea / totalArea) * 100) : 0;
  };

  // Draw Nested Canvas Preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || nestingSheets.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sheet = nestingSheets[activeSheetIndex];
    if (!sheet) return;

    // Scale canvas pixels
    // Let's map rollW to a standard visual width of 480px.
    const scale = 480 / rollW;
    canvas.width = 480;
    canvas.height = sheet.height * scale;

    // Background roll color
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw gridlines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.strokeRect(x, 0, 0.1, canvas.height);
    }

    // Colors mapping for panels to make nesting clear
    const colors = {
      'front': 'rgba(155, 77, 255, 0.25)', // Purple
      'back': 'rgba(255, 140, 0, 0.25)',  // Orange
      'sleeve-left': 'rgba(0, 230, 118, 0.25)', // Green
      'sleeve-right': 'rgba(0, 230, 118, 0.25)',
      'sleeve-merged': 'rgba(0, 150, 136, 0.25)', // Teal
      'a4-print': 'rgba(255, 23, 68, 0.25)' // Red
    };

    const strokeColors = {
      'front': '#9b4dff',
      'back': '#ff8c00',
      'sleeve-left': '#00e676',
      'sleeve-right': '#00e676',
      'sleeve-merged': '#009688',
      'a4-print': '#ff1744'
    };

    // Draw nested blocks
    sheet.items.forEach(item => {
      const rx = item.x * scale;
      const ry = item.y * scale;
      const rw = item.w * scale;
      const rh = item.h * scale;

      ctx.fillStyle = colors[item.panelType] || 'rgba(255,255,255,0.1)';
      ctx.strokeStyle = strokeColors[item.panelType] || '#fff';
      ctx.lineWidth = 1.5;
      
      // Draw item rectangle
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);

      // Add label text inside rect if it fits
      if (rw > 30 && rh > 25) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textY = ry + rh / 2;
        ctx.fillText(`${item.panelType.toUpperCase()} ${item.size}`, rx + rw/2, textY - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '7px system-ui';
        ctx.fillText(item.playerName || '-', rx + rw/2, textY + 5);
      }
    });
  }, [nestingSheets, activeSheetIndex, rollW]);

  // High-Resolution Sublimation Rendering in Browser Canvas
  const renderPanelGraphic = (item: PlacedItem, scaleDpi: number, isPreview?: boolean): Promise<HTMLCanvasElement> => {
    if (item.panelType === 'sleeve-merged') {
      const singleH = (item.h - 0.2) / 2;
      const leftItem: PlacedItem = { ...item, panelType: 'sleeve-left', h: singleH };
      const rightItem: PlacedItem = { ...item, panelType: 'sleeve-right', h: singleH };
      
      return Promise.all([
        renderPanelGraphic(leftItem, scaleDpi, isPreview),
        renderPanelGraphic(rightItem, scaleDpi, isPreview)
      ]).then(([leftCanvas, rightCanvas]) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = Math.round(item.w * scaleDpi);
        canvas.height = Math.round(item.h * scaleDpi);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(leftCanvas, 0, 0);
        ctx.drawImage(rightCanvas, 0, Math.round((singleH + 0.2) * scaleDpi));
        
        return canvas;
      });
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Convert dimensions to pixels
      const widthPx = Math.round(item.w * scaleDpi);
      const heightPx = Math.round(item.h * scaleDpi);
      canvas.width = widthPx;
      canvas.height = heightPx;

      let panelTypeKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print';
      if (item.panelType === 'front') panelTypeKey = 'front';
      else if (item.panelType === 'back') panelTypeKey = 'back';
      else if (item.panelType === 'sleeve-left') panelTypeKey = 'sleeveLeft';
      else if (item.panelType === 'sleeve-right') panelTypeKey = 'sleeveRight';
      else if (item.panelType === 'a4-print') panelTypeKey = 'a4Print';
      else {
        panelTypeKey = 'front';
      }
      const conf = designConfig[panelTypeKey] || designConfig.front;

      // Load optional guides preferences from localStorage (Default ON = true)
      const savedCenter = localStorage.getItem('fivenest_pref_center_marks');
      const centerMarks = savedCenter !== null ? JSON.parse(savedCenter) : true;
      const savedWater = localStorage.getItem('fivenest_pref_size_watermarks');
      const sizeWatermarks = savedWater !== null ? JSON.parse(savedWater) : true;

      const drawTechnicalMarks = () => {
        if (centerMarks && item.panelType !== 'a4-print') {
          ctx.save();
          ctx.fillStyle = '#ff1744';
          ctx.shadowColor = 'transparent';
          
          const wPx = Math.round(0.1 * scaleDpi);
          const hPx = Math.round(0.2 * scaleDpi);

          // Top Center solid patch
          ctx.fillRect(widthPx / 2 - wPx / 2, 0, wPx, hPx);

          // Bottom Center solid patch
          ctx.fillRect(widthPx / 2 - wPx / 2, heightPx - hPx, wPx, hPx);
          ctx.restore();
        }

        if (sizeWatermarks && item.panelType !== 'a4-print') {
          ctx.save();
          ctx.fillStyle = '#ff1744';
          const fontSizePx = Math.round((14 / 72) * scaleDpi); // 14 pt
          ctx.font = `bold ${fontSizePx}px system-ui`;
          ctx.shadowColor = 'transparent';

          const offset = Math.round(0.04 * scaleDpi);

          // 2. Sleeve Style on top-right of Back panel only
          if (item.panelType === 'back') {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';

            // Find the record for this item to determine the sleeve type
            const record = records.find(r => item.recordId.startsWith(r.id));
            const sleeveStyle = record?.sleeve || 'none';
            if (sleeveStyle !== 'none') {
              const isRaglan = item.isRaglan || false;
              const typeStr = sleeveStyle === 'full'
                ? (isRaglan ? 'RAGLAN FULL' : 'FULL')
                : (isRaglan ? 'RAGLAN HALF' : 'HALF');
              ctx.fillText(typeStr, widthPx - offset, offset);
            }
          }
          ctx.restore();
        }
      };

      const drawSingleText = (text: string, textConf: TextConfig, textX: number, textY: number, maxLimitPx: number) => {
        ctx.save();
        const fontSizePx = Math.round((textConf.fontSize / 30) * heightPx);
        ctx.font = `bold ${fontSizePx}px "${textConf.fontFamily}"`;
        
        const align = textConf.align || 'center';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textConf.color;
        ctx.strokeStyle = textConf.strokeColor;
        ctx.lineWidth = textConf.strokeWidth * (scaleDpi / 100);

        // Calculate custom position based on alignment
        let targetX = textX;
        if (textConf.effect !== 'arch') {
          if (align === 'left') {
            targetX = (widthPx / 2) - (maxLimitPx / 2);
          } else if (align === 'right') {
            targetX = (widthPx / 2) + (maxLimitPx / 2);
          }
        }

        // Apply custom letter spacing and compensation offset
        let drawX = targetX;
        let spacingPx = 0;

        if (textConf.letterSpacing !== undefined) {
          spacingPx = Math.round(textConf.letterSpacing * scaleDpi);
          ctx.letterSpacing = `${spacingPx}px`;
          if (align === 'center') {
            drawX += spacingPx / 2;
          } else if (align === 'right') {
            drawX += spacingPx;
          }
        }

        // Apply drop shadow effect
        if (textConf.effect === 'shadow') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 8 * (scaleDpi / 100);
          ctx.shadowOffsetX = 3 * (scaleDpi / 100);
          ctx.shadowOffsetY = 3 * (scaleDpi / 100);
        }

        const displayName = textConf.caseType === 'uppercase' ? text.toUpperCase() : text;

        if (textConf.effect === 'arch') {
          // Circular arched text bending concave (ends down)
          const radius = heightPx * 0.45;
          ctx.translate(drawX, textY + radius);
          const totalAngle = Math.min(Math.PI / 2.5, (displayName.length * fontSizePx * 0.55) / radius);
          const startAngle = -totalAngle / 2;
          const angleStep = totalAngle / (displayName.length - 1 || 1);

          for (let i = 0; i < displayName.length; i++) {
            const char = displayName[i];
            const charAngle = startAngle + i * angleStep;
            ctx.save();
            ctx.rotate(charAngle);
            if (textConf.strokeWidth > 0) {
              ctx.strokeText(char, 0, -radius);
            }
            ctx.fillText(char, 0, -radius);
            ctx.restore();
          }
        } else {
          // Standard straight text
          const measuredW = ctx.measureText(displayName).width;
          ctx.translate(drawX, textY);
          if (measuredW > maxLimitPx) {
            ctx.scale(maxLimitPx / measuredW, 1);
          }
          if (textConf.strokeWidth > 0) {
            ctx.strokeText(displayName, 0, 0);
          }
          ctx.fillText(displayName, 0, 0);
        }
        ctx.restore();
      };

      const drawOverlays = () => {
        const hideOverlays = metadata.blankKit;
        // Force name/number overlay on front panel in preview mode so customers can verify
        const isFrontPreview = item.panelType === 'front' && isPreview;
        const isNameEnabled = conf.nameConfig.enabled || isFrontPreview;
        const isNumEnabled = conf.numberConfig.enabled || isFrontPreview;

        // Draw Name overlay if enabled
        if (!hideOverlays && isNameEnabled && item.playerName && item.playerName !== "BLANK") {
          const textX = widthPx / 2;
          const textY = (conf.nameConfig.yPos / 100) * heightPx;
          const maxLimitPx = (conf.nameConfig.maxW / item.w) * widthPx;
          drawSingleText(item.playerName, conf.nameConfig, textX, textY, maxLimitPx);
        }

        // Draw Number overlay if enabled
        if (!hideOverlays && isNumEnabled && item.playerNum) {
          const textX = widthPx / 2;
          const textY = (conf.numberConfig.yPos / 100) * heightPx;
          const maxLimitPx = (conf.numberConfig.maxW / item.w) * widthPx;
          drawSingleText(item.playerNum, conf.numberConfig, textX, textY, maxLimitPx);
        }

        // Draw customizable Size Tag (Top Left)
        const sizeTagConf = conf.sizeTagConfig || { enabled: true, yPos: 4, fontSize: 34, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'Impact', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left' };
        if (sizeTagConf.enabled && item.panelType !== 'a4-print') {
          ctx.save();
          const fontSizePx = Math.round((sizeTagConf.fontSize / 72) * scaleDpi);
          ctx.font = `bold ${fontSizePx}px "${sizeTagConf.fontFamily}"`;
          
          const align = sizeTagConf.align || 'left';
          ctx.textAlign = align;
          ctx.textBaseline = 'top';
          ctx.fillStyle = sizeTagConf.color;
          ctx.strokeStyle = sizeTagConf.strokeColor;
          ctx.lineWidth = sizeTagConf.strokeWidth * (scaleDpi / 100);

          const offsetPx = Math.round(0.15 * scaleDpi);
          
          let targetX = offsetPx;
          if (align === 'center') {
            targetX = widthPx / 2;
          } else if (align === 'right') {
            targetX = widthPx - offsetPx;
          }

          let drawX = targetX;
          let spacingPx = 0;

          if (sizeTagConf.letterSpacing !== undefined) {
            spacingPx = Math.round(sizeTagConf.letterSpacing * scaleDpi);
            ctx.letterSpacing = `${spacingPx}px`;
            if (align === 'center') {
              drawX += spacingPx / 2;
            } else if (align === 'right') {
              drawX += spacingPx;
            }
          }

          if (sizeTagConf.effect === 'shadow') {
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4 * (scaleDpi / 100);
            ctx.shadowOffsetX = 2 * (scaleDpi / 100);
            ctx.shadowOffsetY = 2 * (scaleDpi / 100);
          }

          // Calculate total quantity for this size in the roster order
          const matchingRecords = records.filter(r => (r.size || '').trim() === (item.size || '').trim());
          const sizeQty = matchingRecords.reduce((acc, r) => acc + (r.qty || 1), 0);
          const qtyVal = sizeQty > 0 ? sizeQty : (item.qty || 1);

          // Requirement: Format size watermark as "40 = Quantity" (e.g. "40 = 2")
          const sizeQtyText = `${item.size} = ${qtyVal}`;
          const templateText = sizeTagConf.text || '{size}';
          const displayText = templateText.includes('{size}')
            ? templateText.replace('{size}', sizeQtyText)
            : sizeQtyText;

          if (sizeTagConf.strokeWidth > 0) {
            ctx.strokeText(displayText, drawX, offsetPx);
          }
          ctx.fillText(displayText, drawX, offsetPx);
          ctx.restore();
        }

        // Draw center tick marks and corner watermark text labels
        drawTechnicalMarks();

        // Draw Test Mode watermark if active
        if (testMode) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.18)';
          ctx.fillStyle = 'rgba(255, 23, 68, 0.12)';
          ctx.lineWidth = Math.round(3 * (scaleDpi / 100));
          ctx.font = `bold ${Math.round(28 * (scaleDpi / 100))}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.translate(widthPx / 2, heightPx / 2);
          ctx.rotate(-Math.PI / 4);
          
          ctx.fillText("TEST COPY - 72 DPI ONLY", 0, -45 * (scaleDpi / 100));
          ctx.fillText("NOT FOR PRODUCTION PRINTING", 0, 0);
          ctx.fillText("FIVENEST WEB STUDIO DEMO", 0, 45 * (scaleDpi / 100));
          
          ctx.strokeText("TEST COPY - 72 DPI ONLY", 0, -45 * (scaleDpi / 100));
          ctx.strokeText("NOT FOR PRODUCTION PRINTING", 0, 0);
          ctx.strokeText("FIVENEST WEB STUDIO DEMO", 0, 45 * (scaleDpi / 100));
          ctx.restore();
        }
      };

      // 1. Draw Template Artwork
      let bgUrl = conf.uploadedFileUrl;
      if (item.panelType.startsWith('sleeve')) {
        bgUrl = item.sleeveType === 'full'
          ? (conf.uploadedFileFullUrl || conf.uploadedFileUrl)
          : (conf.uploadedFileHalfUrl || conf.uploadedFileUrl);
      }

      const leftLogo = conf.leftChestLogo;
      const rightLogo = conf.rightChestLogo;
      const torsoLogo = conf.torsoLogo;

      const loadAllImages = async () => {
        const images: { bg?: HTMLImageElement; leftLogo?: HTMLImageElement; rightLogo?: HTMLImageElement; torsoLogo?: HTMLImageElement } = {};
        const promises: Promise<void>[] = [];

        if (conf.backgroundType === 'upload' && bgUrl) {
          promises.push(
            loadImage(bgUrl)
              .then(img => { images.bg = img; })
              .catch(err => console.warn("Failed to load background:", err))
          );
        }

        if (leftLogo?.enabled && leftLogo?.uploadedUrl) {
          promises.push(
            loadImage(leftLogo.uploadedUrl)
              .then(img => { images.leftLogo = img; })
              .catch(err => console.warn("Failed to load Left Chest Logo:", err))
          );
        }

        if (rightLogo?.enabled && rightLogo?.uploadedUrl) {
          promises.push(
            loadImage(rightLogo.uploadedUrl)
              .then(img => { images.rightLogo = img; })
              .catch(err => console.warn("Failed to load Right Chest Logo:", err))
          );
        }

        if (torsoLogo?.enabled && torsoLogo?.uploadedUrl) {
          promises.push(
            loadImage(torsoLogo.uploadedUrl)
              .then(img => { images.torsoLogo = img; })
              .catch(err => console.warn("Failed to load Torso Logo:", err))
          );
        }

        await Promise.all(promises);
        return images;
      };

      loadAllImages().then(images => {
        // Draw background
        if (images.bg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, widthPx, heightPx);

          const bgW = (conf.bgWidth !== undefined ? conf.bgWidth : item.w) * scaleDpi;
          const bgH = (conf.bgHeight !== undefined ? conf.bgHeight : item.h) * scaleDpi;
          const bgX = (conf.bgX !== undefined ? conf.bgX : 0) * scaleDpi;
          const bgY = (conf.bgY !== undefined ? conf.bgY : 0) * scaleDpi;

          ctx.drawImage(images.bg, bgX, bgY, bgW, bgH);
        } else {
          // Render generated vectors at high-res
          const c1 = conf.generatedColor1;
          const c2 = conf.generatedColor2;

          if (conf.generatedStyle === 'neon-gradient') {
            const gradient = ctx.createRadialGradient(widthPx/2, heightPx/2, widthPx*0.1, widthPx/2, heightPx/2, widthPx*0.8);
            gradient.addColorStop(0, c1);
            gradient.addColorStop(1, c2);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, widthPx, heightPx);
          } else if (conf.generatedStyle === 'classic-stripes') {
            ctx.fillStyle = c2;
            ctx.fillRect(0, 0, widthPx, heightPx);
            
            ctx.fillStyle = c1;
            ctx.beginPath();
            const stripeW = widthPx * 0.15;
            for (let i = -widthPx; i < widthPx + heightPx; i += stripeW * 2) {
              ctx.moveTo(i, 0);
              ctx.lineTo(i + stripeW, 0);
              ctx.lineTo(i - heightPx + stripeW, heightPx);
              ctx.lineTo(i - heightPx, heightPx);
            }
            ctx.fill();
          } else if (conf.generatedStyle === 'camo-glow') {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, widthPx, heightPx);
            
            ctx.fillStyle = c1;
            ctx.beginPath();
            ctx.arc(widthPx * 0.3, heightPx * 0.25, widthPx * 0.2, 0, Math.PI * 2);
            ctx.arc(widthPx * 0.7, heightPx * 0.75, widthPx * 0.35, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = c2;
            ctx.beginPath();
            ctx.arc(widthPx * 0.8, heightPx * 0.25, widthPx * 0.15, 0, Math.PI * 2);
            ctx.arc(widthPx * 0.2, heightPx * 0.8, widthPx * 0.25, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = item.panelType === 'a4-print' ? '#ffffff' : '#1c1c24';
            ctx.fillRect(0, 0, widthPx, heightPx);
          }
        }

        // Draw customizable logos (Left Chest, Right Chest, Torso)
        const drawLogo = (logoConf: any, logoImg: HTMLImageElement | undefined, isTorso: boolean = false) => {
          if (logoConf && logoConf.enabled) {
            if (isTorso && logoConf.text && logoConf.text.trim()) {
              ctx.save();
              const logoX = Math.round(logoConf.xPos * scaleDpi);
              const logoY = Math.round(logoConf.yPos * scaleDpi);
              const maxW = Math.round(logoConf.width * scaleDpi);
              const logoH = Math.round(logoConf.height * scaleDpi);

              ctx.font = `bold ${logoH}px OldSport02AthleticNcv-E0gj, Impact, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(1, Math.round(0.06 * logoH));

              ctx.strokeText(logoConf.text, logoX, logoY, maxW);
              ctx.fillText(logoConf.text, logoX, logoY, maxW);
              ctx.restore();
              return;
            }

            if (logoImg) {
              ctx.save();
              const logoW = Math.round(logoConf.width * scaleDpi);
              const logoH = Math.round(logoConf.height * scaleDpi);
              const logoX = Math.round(logoConf.xPos * scaleDpi) - Math.round(logoW / 2);
              const logoY = Math.round(logoConf.yPos * scaleDpi) - Math.round(logoH / 2);
              ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
              ctx.restore();
            }
          }
        };

        drawLogo(leftLogo, images.leftLogo);
        drawLogo(rightLogo, images.rightLogo);
        drawLogo(torsoLogo, images.torsoLogo, true);

        // Draw overlays
        drawOverlays();
        resolve(canvas);
      });
    });
  };

  // Compile full nesting sheets and save PDF
  const handleExportPDF = async () => {
    if (enableNesting && nestingSheets.length === 0) {
      alert("Please run the nesting calculation first.");
      return;
    }

    const items = getItemsToExport();
    const totalPieces = items.length;
    if (totalPieces === 0) {
      alert("No items to export.");
      return;
    }

    const calculatedCost = items.reduce((acc, item) => {
      if (item.panelType === 'back') {
        return acc + 3.00;
      } else if (item.panelType === 'a4-print') {
        return acc + 0.50;
      }
      return acc;
    }, 0);

    const executeExport = async () => {
      setIsExporting(true);
      setExportProgress("Initializing high-resolution rendering...");

      try {
        // Wait for custom fonts to load completely
        if (document.fonts) {
          await document.fonts.ready;
        }

        // Enforce 72 DPI in Test Mode
        let activeDpi = testMode ? 72 : dpi;

        const cleanCust = metadata.customerName.replace(/[\/\\:*?"<>|]/g, "_").trim() || "Unknown";
        const cleanOrder = metadata.orderNum.replace(/[\/\\:*?"<>|]/g, "_").trim() || "01";

        // TEST MODE: EXPORT SINGLE 72 DPI PDF ONLY (NO ZIP / NO FOLDERS)
        if (testMode) {
          setExportProgress("Generating Test Mode 72 DPI PDF document...");

          const frontOverlaysChecked = (designConfig.front.nameConfig.enabled || designConfig.front.numberConfig.enabled) && !metadata.blankKit;
          const backOverlaysChecked = (designConfig.back.nameConfig.enabled || designConfig.back.numberConfig.enabled) && !metadata.blankKit;
          const a4OverlaysChecked = (designConfig.a4Print.nameConfig.enabled || designConfig.a4Print.numberConfig.enabled) && !metadata.blankKit;

          interface TestPdfPage {
            item: PlacedItem;
            label: string;
          }
          const testPdfPages: TestPdfPage[] = [];

          // 1. Group / Format Fronts
          const frontItems = items.filter(it => it.panelType === 'front');
          const frontSizeMap: Record<string, PlacedItem[]> = {};
          frontItems.forEach(it => {
            if (!frontSizeMap[it.size]) frontSizeMap[it.size] = [];
            frontSizeMap[it.size].push(it);
          });

          if (frontOverlaysChecked) {
            Object.keys(frontSizeMap).sort().forEach(size => {
              frontSizeMap[size].forEach((it, idx) => {
                testPdfPages.push({
                  item: it,
                  label: `[Front] ${it.size} ${idx + 1} F`
                });
              });
            });
          } else {
            Object.keys(frontSizeMap).forEach(size => {
              const list = frontSizeMap[size];
              testPdfPages.push({
                item: list[0],
                label: `[Front] ${size} = ${list.length} F`
              });
            });
          }

          // 2. Group / Format Backs
          const backItems = items.filter(it => it.panelType === 'back');
          const backSizeMap: Record<string, PlacedItem[]> = {};
          backItems.forEach(it => {
            if (!backSizeMap[it.size]) backSizeMap[it.size] = [];
            backSizeMap[it.size].push(it);
          });

          if (backOverlaysChecked) {
            Object.keys(backSizeMap).sort().forEach(size => {
              backSizeMap[size].forEach((it, idx) => {
                testPdfPages.push({
                  item: it,
                  label: `[Back] ${it.size} ${idx + 1} B`
                });
              });
            });
          } else {
            Object.keys(backSizeMap).forEach(size => {
              const list = backSizeMap[size];
              testPdfPages.push({
                item: list[0],
                label: `[Back] ${size} = ${list.length} B`
              });
            });
          }

          // 3. Group / Format Sleeves
          const sleeveItems = items.filter(it => it.panelType.startsWith('sleeve'));
          const sleeveSizeMap: Record<string, PlacedItem[]> = {};
          sleeveItems.forEach(it => {
            const key = `${it.size}-${it.panelType}-${it.sleeveType || ''}`;
            if (!sleeveSizeMap[key]) sleeveSizeMap[key] = [];
            sleeveSizeMap[key].push(it);
          });

          Object.keys(sleeveSizeMap).forEach(key => {
            const list = sleeveSizeMap[key];
            const rep = list[0];
            const qty = list.length;
            let sleeveCode = 'HSL';
            if (rep.panelType === 'sleeve-left') {
              sleeveCode = rep.sleeveType === 'full' ? 'FSL L' : 'HSL L';
            } else if (rep.panelType === 'sleeve-right') {
              sleeveCode = rep.sleeveType === 'full' ? 'FSL R' : 'HSL R';
            } else {
              sleeveCode = rep.sleeveType === 'full' ? 'FSL' : 'HSL';
            }

            testPdfPages.push({
              item: rep,
              label: `[Sleeve] ${rep.size} = ${qty} ${sleeveCode}`
            });
          });

          // 4. Group / Format A4 Prints
          const a4Items = items.filter(it => it.panelType === 'a4-print');
          if (a4OverlaysChecked) {
            a4Items.forEach((it, idx) => {
              testPdfPages.push({
                item: it,
                label: `[A4] ${it.size} ${idx + 1} A4`
              });
            });
          } else {
            const a4SizeMap: Record<string, PlacedItem[]> = {};
            a4Items.forEach(it => {
              if (!a4SizeMap[it.size]) a4SizeMap[it.size] = [];
              a4SizeMap[it.size].push(it);
            });
            Object.keys(a4SizeMap).forEach(size => {
              const list = a4SizeMap[size];
              testPdfPages.push({
                item: list[0],
                label: `[A4] ${size} = ${list.length} A4`
              });
            });
          }

          if (testPdfPages.length > 0) {
            const firstPage = testPdfPages[0];
            const maxItemHeight = testPdfPages.reduce((max, pg) => Math.max(max, pg.item.h), 0);
            const maxItemHeightPt = (maxItemHeight * 72) + 40;
            const zipUUnit = maxItemHeightPt > 14400 ? Math.ceil(maxItemHeightPt / 14400) : 1.0;

            const testPdf = new jsPDF({
              orientation: 'portrait',
              unit: 'pt',
              format: [ (firstPage.item.w * 72) / zipUUnit, ((firstPage.item.h * 72) + 40) / zipUUnit ],
              userUnit: zipUUnit
            });

            for (let i = 0; i < testPdfPages.length; i++) {
              const page = testPdfPages[i];
              const item = page.item;
              setExportProgress(`Rendering 72 DPI Test PDF Page (${i + 1}/${testPdfPages.length}): ${page.label}...`);

              const pageW = (item.w * 72) / zipUUnit;
              const pageH = ((item.h * 72) + 40) / zipUUnit;

              if (i > 0) {
                testPdf.addPage([ pageW, pageH ], 'portrait');
              }

              // Solid white background
              testPdf.setFillColor(255, 255, 255);
              testPdf.rect(0, 0, pageW, pageH, 'F');

              const previewItemCanvas = await renderPanelGraphic(item, 72);
              const previewImgData = previewItemCanvas.toDataURL('image/jpeg', 0.85);

              const targetXPt = 0;
              const targetYPt = 5;
              const targetWPt = item.w * 72;
              const targetHPt = item.h * 72;

              testPdf.addImage(
                previewImgData, 
                'JPEG', 
                targetXPt / zipUUnit, 
                targetYPt / zipUUnit, 
                targetWPt / zipUUnit, 
                targetHPt / zipUUnit, 
                undefined, 
                'FAST'
              );

              // Add centered label below image in brackets
              testPdf.setFontSize(13);
              testPdf.setFont("helvetica", "bold");
              testPdf.setTextColor(30, 30, 30);
              testPdf.text(
                page.label,
                pageW / 2,
                ((item.h * 72) + 26) / zipUUnit,
                { align: 'center' }
              );
            }

            testPdf.save(`${cleanCust}_${cleanOrder}_72DPI_Test.pdf`);
          }

          setIsExporting(false);
          setExportProgress("");

          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
          return;
        }

        if (!enableNesting) {
          // EXPORT AS ZIP OF INDIVIDUAL IMAGES (Front, Back, Sleeve, A4 folders)
          const frontOverlaysChecked = (designConfig.front.nameConfig.enabled || designConfig.front.numberConfig.enabled) && !metadata.blankKit;
          const backOverlaysChecked = (designConfig.back.nameConfig.enabled || designConfig.back.numberConfig.enabled) && !metadata.blankKit;
          const a4OverlaysChecked = (designConfig.a4Print.nameConfig.enabled || designConfig.a4Print.numberConfig.enabled) && !metadata.blankKit;

          // Build list of render actions based on grouping rules
          interface RenderAction {
            representativeItem: PlacedItem;
            fileName: string;
            folder: 'Front' | 'Back' | 'Sleeve' | 'A4' | '';
          }

          const renderActions: RenderAction[] = [];

          // Size maps to group panels when overlays are disabled
          const frontSizeMap: Record<string, PlacedItem[]> = {};
          const backSizeMap: Record<string, PlacedItem[]> = {};
          const sleeveSizeMap: Record<string, PlacedItem[]> = {}; // Key: `${size}-${panelType}-${sleeveType}`
          const a4SizeMap: Record<string, PlacedItem[]> = {};

          items.forEach(item => {
            if (item.panelType === 'front') {
              if (!frontSizeMap[item.size]) frontSizeMap[item.size] = [];
              frontSizeMap[item.size].push(item);
            } else if (item.panelType === 'back') {
              if (!backSizeMap[item.size]) backSizeMap[item.size] = [];
              backSizeMap[item.size].push(item);
            } else if (item.panelType === 'a4-print') {
              if (a4OverlaysChecked) {
                const safeName = (item.playerName || 'BLANK').replace(/[\/\\:*?"<>|]/g, "_").trim();
                const safeNum = (item.playerNum || '').replace(/[\/\\:*?"<>|]/g, "_").trim();
                const suffix = safeNum ? `_${safeNum}` : '';
                renderActions.push({
                  representativeItem: item,
                  fileName: `${item.size}_${safeName}${suffix}_A4.jpg`,
                  folder: 'A4'
                });
              } else {
                if (!a4SizeMap[item.size]) a4SizeMap[item.size] = [];
                a4SizeMap[item.size].push(item);
              }
            } else if (item.panelType.startsWith('sleeve')) {
              const key = `${item.size}-${item.panelType}-${item.sleeveType || ''}`;
              if (!sleeveSizeMap[key]) sleeveSizeMap[key] = [];
              sleeveSizeMap[key].push(item);
            } else {
              const safeName = (item.playerName || 'BLANK').replace(/[\/\\:*?"<>|]/g, "_").trim();
              const safeNum = (item.playerNum || '').replace(/[\/\\:*?"<>|]/g, "_").trim();
              const suffix = safeNum ? `_${safeNum}` : '';
              renderActions.push({
                representativeItem: item,
                fileName: `${item.panelType}_${item.size}_${safeName}${suffix}.jpg`,
                folder: ''
              });
            }
          });

          // Group/Format Fronts
          if (frontOverlaysChecked) {
            // Sort front items by size alphabetically to make sequential numbers clean
            const allFrontItems: PlacedItem[] = [];
            Object.keys(frontSizeMap).sort().forEach(size => {
              allFrontItems.push(...frontSizeMap[size]);
            });
            allFrontItems.forEach((item, index) => {
              renderActions.push({
                representativeItem: item,
                fileName: `${item.size} ${index + 1} F.jpg`,
                folder: 'Front'
              });
            });
          } else {
            // Group by size
            Object.keys(frontSizeMap).forEach(size => {
              const list = frontSizeMap[size];
              renderActions.push({
                representativeItem: list[0],
                fileName: `${size} = ${list.length} F.jpg`,
                folder: 'Front'
              });
            });
          }

          // Group/Format Backs
          if (backOverlaysChecked) {
            // Sort back items by size alphabetically to make sequential numbers clean
            const allBackItems: PlacedItem[] = [];
            Object.keys(backSizeMap).sort().forEach(size => {
              allBackItems.push(...backSizeMap[size]);
            });
            allBackItems.forEach((item, index) => {
              renderActions.push({
                representativeItem: item,
                fileName: `${item.size} ${index + 1} B.jpg`,
                folder: 'Back'
              });
            });
          } else {
            // Group by size
            Object.keys(backSizeMap).forEach(size => {
              const list = backSizeMap[size];
              renderActions.push({
                representativeItem: list[0],
                fileName: `${size} = ${list.length} B.jpg`,
                folder: 'Back'
              });
            });
          }

          // Group A4 chest prints by size (when overlays disabled)
          if (!a4OverlaysChecked) {
            Object.keys(a4SizeMap).forEach(size => {
              const list = a4SizeMap[size];
              renderActions.push({
                representativeItem: list[0],
                fileName: `${size} = ${list.length} A4.jpg`,
                folder: 'A4'
              });
            });
          }

          // Group Sleeves
          Object.keys(sleeveSizeMap).forEach(key => {
            const list = sleeveSizeMap[key];
            const rep = list[0];
            const qty = list.length;
            
            let sleeveCode = 'LHS';
            if (rep.panelType === 'sleeve-left') {
              sleeveCode = rep.sleeveType === 'full' ? 'FLS' : 'LHS';
            } else if (rep.panelType === 'sleeve-right') {
              sleeveCode = rep.sleeveType === 'full' ? 'RLS' : 'RHS';
            } else {
              sleeveCode = 'MS';
            }

            let fileName = '';
            if (rep.sleeveType === 'full') {
              fileName = `${rep.size} = ${qty} ${sleeveCode}.jpg`;
            } else {
              fileName = `${rep.size}=${qty} ${sleeveCode}.jpg`;
            }

            renderActions.push({
              representativeItem: rep,
              fileName,
              folder: 'Sleeve'
            });
          });

          const zip = new JSZip();

          for (let i = 0; i < renderActions.length; i++) {
            const action = renderActions[i];
            setExportProgress(`Rendering ${action.folder || 'other'} panel: ${action.fileName} (${i + 1}/${renderActions.length}) at ${activeDpi} DPI...`);

            const itemCanvas = await renderPanelGraphic(action.representativeItem, activeDpi);
            let blob = await getCanvasBlob(itemCanvas);

            // Pipe through injectJPDpi to ensure physical size is correct in inches
            blob = await injectJPDpi(blob, activeDpi);

            if (action.folder) {
              zip.folder(action.folder)?.file(action.fileName, blob);
            } else {
              zip.file(action.fileName, blob);
            }
          }

          setExportProgress("Compiling ZIP package...");
          const content = await zip.generateAsync({ type: "blob" });
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `${cleanCust}_${cleanOrder}_Sublimation_Panels.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Now, generate and download a 72 DPI preview PDF alongside if activeDpi > 72 and not in testMode
          const needPreviewPdf = !testMode && activeDpi > 72;
          if (needPreviewPdf && renderActions.length > 0) {
            setExportProgress("Generating preview PDF at 72 DPI...");
            
            interface PreviewPage {
              item: PlacedItem;
              label: string;
            }
            const previewPages: PreviewPage[] = [];
            const processedItemIds = new Set<string>();

            // 1. Pair Front and Back for each player piece
            items.forEach(item => {
              if (item.panelType === 'back') {
                // Find corresponding front panel for this item (shares the same recordId prefix)
                const recordPrefix = item.recordId.substring(0, item.recordId.lastIndexOf('-item-') + 6);
                const frontItem = items.find(fit => fit.panelType === 'front' && fit.recordId.startsWith(recordPrefix));
                
                if (frontItem) {
                  previewPages.push({
                    item: frontItem,
                    label: `[Front] ${item.playerName || 'BLANK'} F`
                  });
                }
                previewPages.push({
                  item: item,
                  label: `[Back] ${item.playerName || 'BLANK'} B`
                });
                processedItemIds.add(item.recordId);
                if (frontItem) {
                  processedItemIds.add(frontItem.recordId);
                }
              }
            });

            // 2. Add any other items (unpaired fronts, sleeves, A4 prints)
            items.forEach(item => {
              if (!processedItemIds.has(item.recordId)) {
                let label = `[${item.panelType.toUpperCase()}] ${item.size}`;
                if (item.panelType === 'front') {
                  label = `[Front] ${item.playerName || 'BLANK'} F`;
                } else if (item.panelType.startsWith('sleeve')) {
                  label = `[Sleeve] ${item.size}`;
                } else if (item.panelType === 'a4-print') {
                  label = `[A4] ${item.size}`;
                }
                previewPages.push({
                  item,
                  label
                });
              }
            });

            if (previewPages.length > 0) {
              const maxItemHeight = previewPages.reduce((max, pg) => Math.max(max, pg.item.h), 0);
              const maxItemHeightPt = (maxItemHeight * 72) + 30;
              const zipUUnit = maxItemHeightPt > 14400 ? Math.ceil(maxItemHeightPt / 14400) : 1.0;

              const previewPdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [ (previewPages[0].item.w * 72) / zipUUnit, ((previewPages[0].item.h * 72) + 30) / zipUUnit ],
                userUnit: zipUUnit
              });

              for (let i = 0; i < previewPages.length; i++) {
                const page = previewPages[i];
                const item = page.item;
                const pageW = (item.w * 72) / zipUUnit;
                const pageH = ((item.h * 72) + 30) / zipUUnit;

                if (i > 0) {
                  previewPdf.addPage([ pageW, pageH ], 'portrait');
                }

                // Draw solid white background
                previewPdf.setFillColor(255, 255, 255);
                previewPdf.rect(0, 0, pageW, pageH, 'F');

                const previewItemCanvas = await renderPanelGraphic(item, 72, true);
                const previewImgData = previewItemCanvas.toDataURL('image/jpeg', 0.75);

                const targetXPt = 0;
                const targetYPt = 5;
                const targetWPt = item.w * 72;
                const targetHPt = item.h * 72;

                previewPdf.addImage(
                  previewImgData, 
                  'JPEG', 
                  targetXPt / zipUUnit, 
                  targetYPt / zipUUnit, 
                  targetWPt / zipUUnit, 
                  targetHPt / zipUUnit, 
                  undefined, 
                  'FAST'
                );

                // Add centered label below image
                previewPdf.setFontSize(12);
                previewPdf.setTextColor(50, 50, 50);
                previewPdf.text(
                  page.label,
                  pageW / 2,
                  ((item.h * 72) + 20) / zipUUnit,
                  { align: 'center' }
                );
              }
              previewPdf.save(`${cleanCust}_${cleanOrder}_Preview_72dpi.pdf`);
            }
          }

          setIsExporting(false);
          setExportProgress("");

          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
          return;
        }

        // Standard Nested Roll export
        const firstSheet = nestingSheets[0];
        // Calculate userUnit scaling factor to bypass PDF 200-inch limit (14400 points)
        const maxSheetHeight = nestingSheets.reduce((max, s) => Math.max(max, s.height), 0);
        const maxSheetHeightPt = maxSheetHeight * 72;
        const uUnit = maxSheetHeightPt > 14400 ? Math.ceil(maxSheetHeightPt / 14400) : 1.0;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [ (rollW * 72) / uUnit, (firstSheet.height * 72) / uUnit ],
          userUnit: uUnit
        });

        // Create the 72 DPI preview PDF if activeDpi is not 72
        const needPreviewPdf = !testMode && activeDpi > 72;
        let previewPdf: jsPDF | null = null;
        if (needPreviewPdf) {
          previewPdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: [ (rollW * 72) / uUnit, (firstSheet.height * 72) / uUnit ],
            userUnit: uUnit
          });
        }

        for (let s = 0; s < nestingSheets.length; s++) {
          const sheet = nestingSheets[s];
          const widthPt = rollW * 72;
          const heightPt = sheet.height * 72;

          if (s > 0) {
            pdf.addPage([ widthPt / uUnit, heightPt / uUnit ], 'portrait');
            if (needPreviewPdf && previewPdf) {
              previewPdf.addPage([ widthPt / uUnit, heightPt / uUnit ], 'portrait');
            }
          }

          // Directly draw each nested panel onto the PDF document
          for (let i = 0; i < sheet.items.length; i++) {
            const item = sheet.items[i];
            setExportProgress(`Rendering panel ${i + 1}/${sheet.items.length} on Sheet ${s + 1} at ${activeDpi} DPI...`);

            // Compute original unrotated dimensions to prevent template stretching
            const origW = item.rotated ? item.h : item.w;
            const origH = item.rotated ? item.w : item.h;
            const unrotatedItem = { ...item, w: origW, h: origH };

            const itemCanvas = await renderPanelGraphic(unrotatedItem, activeDpi);
            let previewItemCanvas = null;
            if (needPreviewPdf) {
              previewItemCanvas = await renderPanelGraphic(unrotatedItem, 72, true);
            }

            // Handle pre-rotation of the panel if it is rotated in the layout
            let finalCanvas = itemCanvas;
            if (item.rotated) {
              const rotatedCanvas = document.createElement('canvas');
              rotatedCanvas.width = itemCanvas.height;
              rotatedCanvas.height = itemCanvas.width;
              const rCtx = rotatedCanvas.getContext('2d');
              if (rCtx) {
                rCtx.save();
                rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                rCtx.rotate(Math.PI / 2);
                rCtx.drawImage(itemCanvas, -itemCanvas.width / 2, -itemCanvas.height / 2);
                rCtx.restore();
                finalCanvas = rotatedCanvas;
              }
            }

            let finalPreviewCanvas = previewItemCanvas;
            if (needPreviewPdf && item.rotated && previewItemCanvas) {
              const rotatedCanvas = document.createElement('canvas');
              rotatedCanvas.width = previewItemCanvas.height;
              rotatedCanvas.height = previewItemCanvas.width;
              const rCtx = rotatedCanvas.getContext('2d');
              if (rCtx) {
                rCtx.save();
                rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
                rCtx.rotate(Math.PI / 2);
                rCtx.drawImage(previewItemCanvas, -previewItemCanvas.width / 2, -previewItemCanvas.height / 2);
                rCtx.restore();
                finalPreviewCanvas = rotatedCanvas;
              }
            }

            const imgData = finalCanvas.toDataURL('image/jpeg', 0.85);

            const targetXPt = item.x * 72;
            const targetYPt = item.y * 72;
            const targetWPt = item.w * 72;
            const targetHPt = item.h * 72;

            pdf.addImage(imgData, 'JPEG', targetXPt / uUnit, targetYPt / uUnit, targetWPt / uUnit, targetHPt / uUnit, undefined, 'FAST');

            if (needPreviewPdf && finalPreviewCanvas && previewPdf) {
              const previewImgData = finalPreviewCanvas.toDataURL('image/jpeg', 0.75);
              previewPdf.addImage(previewImgData, 'JPEG', targetXPt / uUnit, targetYPt / uUnit, targetWPt / uUnit, targetHPt / uUnit, undefined, 'FAST');
            }
          }
        }

        setExportProgress("Saving PDF document...");
        pdf.save(`${cleanCust}_${cleanOrder}_Print_Roll.pdf`);

        if (needPreviewPdf && previewPdf) {
          previewPdf.save(`${cleanCust}_${cleanOrder}_Preview_72dpi.pdf`);
        }

        setIsExporting(false);
        setExportProgress("");

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (err) {
        console.error("Export process failed:", err);
        alert(`Export failed: ${(err as Error).message}\n\nPlease check the developer console for detailed logs.`);
        setIsExporting(false);
        setExportProgress("");
      }
    };

    if (testMode || calculatedCost === 0) {
      await executeExport();
    } else {
      if (!currentUser) {
        alert("Authentication Required:\n\nPlease Sign In or Register to export production-ready prints.");
        onOpenLogin();
        return;
      }

      setPaymentCost(calculatedCost);
      setPendingExportAction(() => executeExport);
      if (currentUser.balance >= calculatedCost) {
        setUpiPaymentMethod('wallet');
      } else {
        setUpiPaymentMethod('upi');
      }
      setShowPaymentModal(true);
    }
  };

  return (
    <div className="nesting-view fade-in">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} style={{ color: 'var(--color-primary)' }} /> Nesting Engine Configuration
        </h2>

        {enableNesting && (
          <div className="grid-3" style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Roll Canvas Width (in):</label>
              <input 
                type="number" 
                className="form-input" 
                value={rollW} 
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 64;
                  setRollW(w);
                  localStorage.setItem('fivenest_pref_roll_w', JSON.stringify(w));
                }} 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Max Print Height (in):</label>
              <input 
                type="number" 
                className="form-input" 
                value={rollH} 
                onChange={(e) => {
                  const h = parseFloat(e.target.value) || 100;
                  setRollH(h);
                  localStorage.setItem('fivenest_pref_roll_h', JSON.stringify(h));
                }} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Item Safety Gap (in):</label>
              <input 
                type="number" 
                step="0.05" 
                className="form-input" 
                value={itemGap} 
                onChange={(e) => {
                  const g = parseFloat(e.target.value) || 0.25;
                  setItemGap(g);
                  localStorage.setItem('fivenest_pref_item_gap', JSON.stringify(g));
                }} 
              />
            </div>
          </div>
        )}

        <div className="form-row" style={{ marginBottom: '24px' }}>
          <label className={`checkbox-card ${enableNesting ? 'checked' : ''}`}>
            <input 
              type="checkbox" 
              checked={enableNesting} 
              onChange={(e) => {
                setEnableNesting(e.target.checked);
                localStorage.setItem('fivenest_pref_enable_nesting', JSON.stringify(e.target.checked));
              }} 
            />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Enable Roll Nesting</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pack panels onto a continuous roll. Uncheck to export as individual files</p>
            </div>
          </label>

          {enableNesting && (
            <>
              <label className={`checkbox-card ${tightestFit ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={tightestFit} 
                  onChange={(e) => {
                    setTightestFit(e.target.checked);
                    localStorage.setItem('fivenest_pref_tightest_fit', JSON.stringify(e.target.checked));
                  }} 
                />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Tightest 2D Fit (Bin Packing)</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maximize roll space using nested gaps</p>
                </div>
              </label>

              <label className={`checkbox-card ${rotateToFit ? 'checked' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={rotateToFit} 
                  onChange={(e) => {
                    setRotateToFit(e.target.checked);
                    localStorage.setItem('fivenest_pref_rotate_to_fit', JSON.stringify(e.target.checked));
                  }} 
                />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px' }}>Rotate Panels to Fit</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Allows 90° rotation to fit tight empty spots</p>
                </div>
              </label>
            </>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Export Print DPI Resolution:</label>
            <select 
              className="form-select" 
              value={dpi} 
              onChange={(e) => {
                const d = parseInt(e.target.value);
                setDpi(d);
                localStorage.setItem('fivenest_pref_dpi', JSON.stringify(d));
              }}
            >
              <option value="72">72 DPI (Low-res Preview Fast)</option>
              <option value="100">100 DPI (Medium Standard)</option>
              <option value="150">150 DPI (High-res Sublimation Print)</option>
              <option value="300">300 DPI (Ultra high-res Professional Rip)</option>
            </select>
          </div>
        </div>

        {enableNesting && (
          <button className="btn btn-primary" onClick={runNesting} style={{ width: '100%', padding: '12px' }} disabled={isNesting}>
            <Play size={16} /> {isNesting ? "Preparing Export Layout..." : "▶ RUN NESTING CALCULATION"}
          </button>
        )}
      </div>

      {(!enableNesting || (enableNesting && nestingSheets.length > 0)) && (
        <div className="grid-2">
          {/* Visual Canvas Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            {enableNesting ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>🗺️ Visual Roll Sheet Preview</h3>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                    {nestingSheets.map((_, index) => (
                      <button 
                        key={index} 
                        className={`btn ${activeSheetIndex === index ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => setActiveSheetIndex(index)}
                      >
                        Sheet {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nesting-roll-canvas">
                  <canvas ref={previewCanvasRef} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Roll Width</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{rollW}"</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Roll Length Height</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                      {Math.round(nestingSheets[activeSheetIndex]?.height || 0)}"
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Efficiency</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                      {nestingSheets[activeSheetIndex]?.efficiency || 0}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '16px' }}>📋 Individual Export Roster ({getItemsToExport().length} Panels)</h3>
                {getItemsToExport().length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '420px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    {getItemsToExport().map((item, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '6px', textAlign: 'left' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                          {item.panelType.replace('-', ' ')}
                        </span>
                        <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.playerName || 'BLANK'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>Size {item.size}</span>
                          <span>{item.w}"x{item.h}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px dashed var(--border-light)', width: '100%' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px' }}>📋 Roster is currently empty</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Go to the <strong>Roster & Details</strong> tab to import or add items.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Export Action Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ marginBottom: '16px' }}>📦 Export Options & Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Export Format Mode:</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {enableNesting ? `${nestingSheets.length} Roll Pages` : `Individual Panel Images (ZIP)`}
                  </p>
                </div>
                
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Packed Components:</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {enableNesting 
                      ? nestingSheets.reduce((acc, sheet) => acc + sheet.items.length, 0)
                      : getItemsToExport().length} printable panels
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Output Document DPI:</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {testMode ? "72 DPI (Forced in Test Mode)" : `${dpi} DPI`} {enableNesting ? `(${dpi * rollW} x ${Math.round(dpi * (nestingSheets[activeSheetIndex]?.height || 0))} pixels)` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isExporting ? (
                <div style={{ textAlign: 'center', background: 'rgba(155, 77, 255, 0.08)', border: '1px solid var(--border-active)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }}></div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Rendering High-Resolution Graphics...</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{exportProgress}</p>
                </div>
              ) : (
                <>
                  <button 
                    className={`btn ${testMode ? 'btn-secondary' : 'btn-success'}`}
                    onClick={handleExportPDF} 
                    style={{ width: '100%', padding: '14px' }} 
                    disabled={getItemsToExport().length === 0}
                  >
                    <Download size={18} /> {testMode ? "TEST DOWNLOAD (FREE - 72 DPI)" : (enableNesting ? "DOWNLOAD PRINT-READY ROLL (PDF)" : "DOWNLOAD INDIVIDUAL PANELS (ZIP)")}
                  </button>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {testMode 
                      ? "Downloads a watermarked, low-resolution 72 DPI copy of your panels for layout verification."
                      : (enableNesting 
                          ? "Saves a direct multi-page PDF vector container file. Ideal for loading straight into Rip Software (Wasatch, ErgoSoft, Caldera)."
                          : "Saves a structured ZIP file containing individual JPEG panels sorted into Front, Back, and Sleeve folders.")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Payment Modal */}
      {showPaymentModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card fade-in" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '30px',
            background: 'rgba(15, 15, 25, 0.85)',
            border: '1px solid var(--border-active)',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <button 
              onClick={() => {
                setShowPaymentModal(false);
                setIsExporting(false);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={22} style={{ color: 'var(--color-primary)' }} /> Sublimation Panel Checkout
            </h3>
            
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Production-ready rendering is billed at **₹3.00 INR per Back panel** and **₹0.50 INR per A4 size print panel**. Front and sleeve panels are free.
            </p>

            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Player Roster Count:</span>
                <span style={{ fontWeight: '600' }}>{records.reduce((acc, r) => acc + r.qty, 0)} players</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Charged Back Panels:</span>
                <span style={{ fontWeight: '600' }}>{getItemsToExport().filter(item => item.panelType === 'back').length} pcs (₹3.00 each)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Charged A4 Prints:</span>
                <span style={{ fontWeight: '600' }}>{getItemsToExport().filter(item => item.panelType === 'a4-print').length} pcs (₹0.50 each)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Free Panels (Front/Sleeve):</span>
                <span style={{ fontWeight: '600' }}>{getItemsToExport().filter(item => item.panelType !== 'back' && item.panelType !== 'a4-print').length} pcs (₹0.00 each)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Total Amount Due:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)', fontSize: '15px' }}>₹{paymentCost.toFixed(2)} INR</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="tab-btn-group" style={{ marginBottom: '20px' }}>
              <button 
                className={`tab-btn ${upiPaymentMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setUpiPaymentMethod('wallet')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px' }}
              >
                <Coins size={14} /> Pay via Wallet
              </button>
              <button 
                className={`tab-btn ${upiPaymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setUpiPaymentMethod('upi')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px' }}
              >
                <QrCode size={14} /> Scan UPI QR
              </button>
            </div>

            {/* Wallet Deduct Panel */}
            {upiPaymentMethod === 'wallet' && currentUser && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Wallet Balance: <strong style={{ color: currentUser.balance >= paymentCost ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{currentUser.balance.toFixed(2)}</strong>
                </div>

                {currentUser.balance >= paymentCost ? (
                  <button 
                    className="btn btn-primary"
                    onClick={executePaymentWithWallet}
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={16} /> Deduct ₹{paymentCost.toFixed(2)} & Export High-Res
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ color: 'var(--color-danger)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                      <AlertTriangle size={14} /> Insufficient balance. Please recharge or choose UPI QR.
                    </div>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowPaymentModal(false);
                        onOpenLogin();
                      }}
                      style={{ width: '100%', padding: '10px' }}
                    >
                      Top Up Wallet Balance
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR Scanner Panel */}
            {upiPaymentMethod === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative' }}>
                {simulatedPaymentLoading ? (
                  <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--color-primary)' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Confirming UPI Payment...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      padding: '10px', 
                      background: 'white', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=0a0a0f&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`upi://pay?pa=fivenest@ybl&pn=FiveNest%20Studio&am=${paymentCost}&cu=INR&tn=FiveNest%20Sublimation%20Export`)}`} 
                        alt="UPI Payment QR Code" 
                        style={{ width: '160px', height: '160px', display: 'block' }}
                      />
                      
                      {/* Pulse Scan Line overlay */}
                      <div className="scan-line" style={{
                        position: 'absolute',
                        left: '10px',
                        right: '10px',
                        height: '2px',
                        background: 'var(--color-primary)',
                        boxShadow: '0 0 8px var(--color-primary)',
                        animation: 'scan 2.5s linear infinite'
                      }}></div>
                      <style>{`
                        @keyframes scan {
                          0% { top: 10px; }
                          50% { top: 170px; }
                          100% { top: 10px; }
                        }
                        @keyframes spin { to { transform: rotate(360deg); } }
                        .spin { animation: spin 1s linear infinite; }
                      `}</style>
                    </div>
                    
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                      Scan this QR code using GPay, PhonePe, Paytm, or BHIM to pay ₹{paymentCost.toFixed(2)} INR.
                    </p>

                  </>
                )}
              </div>
            )}
            
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowPaymentModal(false);
                setIsExporting(false);
              }}
              style={{ width: '100%', marginTop: '12px', padding: '10px' }}
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
