// BUILD v20260906-r5 — FiveNest Studio Export Processing Modal
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { Play, Download, Sliders, Coins, QrCode, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import JSZip from 'jszip';
import { supabase, fetchUserWallet } from '../../lib/supabaseClient';
import { fivenestLabelTagDataUrl } from '../../assets/labelTagBase64';
import { ExportProcessingModal } from './ExportProcessingModal';

// ---- Export format utilities ----
type ExportFormat = 'jpg' | 'png' | 'tiff';
type ColorProfile = 'rgb' | 'cmyk';

/** Convert RGB pixel to CMYK approximation */
const rgbToCmyk = (r: number, g: number, b: number): [number, number, number, number] => {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 1];
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return [c, m, y, k];
};

/** Convert RGB canvas to PNG blob */
const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
};

/** Inject DPI into PNG blob via pHYs chunk (pixels per metre) */
const injectPngDpi = (blob: Blob, dpiValue: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const ppm = Math.round(dpiValue / 0.0254); // pixels per metre
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target!.result as ArrayBuffer;
        const orig = new Uint8Array(ab);
        // Build pHYs chunk: 4 bytes type "pHYs", 4+4+1 = 9 bytes data, 4 bytes CRC
        const chunkData = new Uint8Array(9);
        const view = new DataView(chunkData.buffer);
        view.setUint32(0, ppm); // X pixels per unit
        view.setUint32(4, ppm); // Y pixels per unit
        chunkData[8] = 1; // unit: metre
        // CRC32 over "pHYs" + data
        const crcInput = new Uint8Array(13);
        crcInput.set([112, 72, 89, 115]); // "pHYs"
        crcInput.set(chunkData, 4);
        const crc = crc32(crcInput);
        const chunk = new Uint8Array(4 + 4 + 9 + 4);
        const cv = new DataView(chunk.buffer);
        cv.setUint32(0, 9); // chunk length
        chunk.set([112, 72, 89, 115], 4); // "pHYs"
        chunk.set(chunkData, 8);
        cv.setUint32(17, crc);
        // Insert after PNG signature (8 bytes) + IHDR chunk (4+4+13+4=25 bytes) = offset 33
        const insertAt = 33;
        const result = new Uint8Array(orig.length + chunk.length);
        result.set(orig.slice(0, insertAt));
        result.set(chunk, insertAt);
        result.set(orig.slice(insertAt), insertAt + chunk.length);
        resolve(new Blob([result], { type: 'image/png' }));
      } catch {
        resolve(blob);
      }
    };
    reader.onerror = () => resolve(blob);
    reader.readAsArrayBuffer(blob);
  });
};

/** Simple CRC32 for PNG chunk */
const crc32 = (data: Uint8Array): number => {
  let crc = 0xFFFFFFFF;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

/** Encode canvas as minimal TIFF (baseline, uncompressed, RGB or CMYK) */
const canvasToTiffBlob = (canvas: HTMLCanvasElement, dpiValue: number, cmyk: boolean): Promise<Blob> => {
  return new Promise((resolve) => {
    try {
      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imgData;
      const samplesPerPixel = cmyk ? 4 : 3;
      const pixelCount = width * height;
      const stripData = new Uint8Array(pixelCount * samplesPerPixel);
      for (let i = 0; i < pixelCount; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        if (cmyk) {
          const [c, m, y, k] = rgbToCmyk(r, g, b);
          stripData[i * 4]     = Math.round(c * 255);
          stripData[i * 4 + 1] = Math.round(m * 255);
          stripData[i * 4 + 2] = Math.round(y * 255);
          stripData[i * 4 + 3] = Math.round(k * 255);
        } else {
          stripData[i * 3]     = r;
          stripData[i * 3 + 1] = g;
          stripData[i * 3 + 2] = b;
        }
      }
      // TIFF header: II (little endian), magic 42, offset to first IFD
      const ifdEntryCount = 12;
      const ifdOffset = 8;
      const ifdSize = 2 + ifdEntryCount * 12 + 4;
      const extraDataOffset = ifdOffset + ifdSize;
      // Extra data: BitsPerSample (3 or 4 SHORTs), XRes rational (2 LONGs), YRes rational
      const bpsSize = samplesPerPixel * 2;
      const resSize = 8; // rational = 2 * uint32
      const stripOffset = extraDataOffset + bpsSize + resSize * 2;
      const totalSize = stripOffset + stripData.length;
      const buf = new ArrayBuffer(totalSize);
      const v = new DataView(buf);
      const u = new Uint8Array(buf);
      // TIFF header
      v.setUint16(0, 0x4949, true); // 'II' little endian
      v.setUint16(2, 42, true);
      v.setUint32(4, ifdOffset, true);
      // IFD
      let p = ifdOffset;
      v.setUint16(p, ifdEntryCount, true); p += 2;
      const setEntry = (tag: number, type: number, count: number, valOrOffset: number) => {
        v.setUint16(p, tag, true);
        v.setUint16(p + 2, type, true);
        v.setUint32(p + 4, count, true);
        v.setUint32(p + 8, valOrOffset, true);
        p += 12;
      };
      setEntry(256, 4, 1, width);               // ImageWidth
      setEntry(257, 4, 1, height);              // ImageLength
      setEntry(258, 3, samplesPerPixel, bpsSize > 4 ? extraDataOffset : (samplesPerPixel === 1 ? 8 : 0x00080008)); // BitsPerSample
      setEntry(259, 3, 1, 1);                   // Compression: none
      setEntry(262, 3, 1, cmyk ? 5 : 2);        // PhotometricInterpretation: 5=CMYK, 2=RGB
      setEntry(278, 4, 1, height);              // RowsPerStrip
      setEntry(279, 4, 1, stripData.length);   // StripByteCounts
      setEntry(282, 5, 1, extraDataOffset + bpsSize);       // XResolution rational offset
      setEntry(283, 5, 1, extraDataOffset + bpsSize + resSize); // YResolution rational offset
      setEntry(284, 3, 1, 1);                   // PlanarConfig: chunky
      setEntry(296, 3, 1, 2);                   // ResolutionUnit: inch
      setEntry(273, 4, 1, stripOffset);         // StripOffsets
      v.setUint32(p, 0, true); // next IFD offset = 0 (none)
      // Write BitsPerSample values
      for (let i = 0; i < samplesPerPixel; i++) {
        v.setUint16(extraDataOffset + i * 2, 8, true);
      }
      // Write XRes and YRes rationals
      const resOff = extraDataOffset + bpsSize;
      v.setUint32(resOff, dpiValue, true);
      v.setUint32(resOff + 4, 1, true);
      v.setUint32(resOff + resSize, dpiValue, true);
      v.setUint32(resOff + resSize + 4, 1, true);
      // Write pixel data
      u.set(stripData, stripOffset);
      resolve(new Blob([buf], { type: 'image/tiff' }));
    } catch (e) {
      console.warn('TIFF encode error:', e);
      resolve(new Blob());
    }
  });
};

/** Get canvas blob in the selected format */
const getCanvasBlobForFormat = async (
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  profile: ColorProfile,
  dpi: number
): Promise<Blob> => {
  if (format === 'png') {
    let blob = await canvasToPngBlob(canvas);
    blob = await injectPngDpi(blob, dpi);
    return blob;
  }
  if (format === 'tiff') {
    return canvasToTiffBlob(canvas, dpi, profile === 'cmyk');
  }
  // Default: JPG
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const parts = dataUrl.split(',');
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          resolve(new Blob([ab], { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.92);
    } catch {
      resolve(new Blob());
    }
  });
};

const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return getCanvasBlobForFormat(canvas, 'jpg', 'rgb', 300);
};


const logoPathCyan = typeof Path2D !== 'undefined' ? new Path2D("M32.55,0l3.08,2.98c.82.79.83,2.1.03,2.91l-14.83,14.9c-1.88,1.98-2.2,4.93-.21,6.95l4.84,4.94,13.51-13.47,2.99,2.72c.8.73,1.1,2.2.22,3.09l-8.72,8.82c-1.7,1.72-2.03,4.58-.29,6.38l3.18,3.3-4.6,4.57-1.44-1.69-14.48-14.7c-3.92-3.98-3.89-10.64.04-14.63L32.55,0Z") : null;
const logoPathWhite = typeof Path2D !== 'undefined' ? new Path2D("M43.8,27.28c1.93-1.94,2.44-4.88.4-6.88l-4.99-4.88-13.44,13.22-2.84-2.54c-.35-.31-.94-.94-.94-1.63,0-.79.52-1.52.98-2.01l15.96-16.62,9.95,10.2c4.27,4.37,3.79,11.05-.3,15.32l-10.11,10.18-3.15-2.92c-.83-.88-.93-2,0-2.94l8.46-8.49h.02Z") : null;

const fivenestLogoImageInstance = new Image();
fivenestLogoImageInstance.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.8 48.1"><path fill="#0acbf9" d="M32.55,0l3.08,2.98c.82.79.83,2.1.03,2.91l-14.83,14.9c-1.88,1.98-2.2,4.93-.21,6.95l4.84,4.94,13.51-13.47,2.99,2.72c.8.73,1.1,2.2.22,3.09l-8.72,8.82c-1.7,1.72-2.03,4.58-.29,6.38l3.18,3.3-4.6,4.57-1.44-1.69-14.48-14.7c-3.92-3.98-3.89-10.64.04-14.63L32.55,0Z"/><path fill="#ffffff" d="M43.8,27.28c1.93-1.94,2.44-4.88.4-6.88l-4.99-4.88-13.44,13.22-2.84-2.54c-.35-.31-.94-.94-.94-1.63,0-.79.52-1.52.98-2.01l15.96-16.62,9.95,10.2c4.27,4.37,3.79,11.05-.3,15.32l-10.11,10.18-3.15-2.92c-.83-.88-.93-2,0-2.94l8.46-8.49h.02Z"/></svg>`)}`;

const fivenestLabelTagImageInstance = new Image();
fivenestLabelTagImageInstance.src = fivenestLabelTagDataUrl;

const injectJPDpi = (blob: Blob, dpiValue: number): Promise<Blob> => {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(blob);
      }
    }, 1000);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve(blob);
          return;
        }
        const view = new DataView(buffer);
        
        if (view.byteLength < 2 || view.getUint16(0) !== 0xFFD8) {
          resolve(blob);
          return;
        }

        let offset = 2;
        let patched = false;

        while (offset < buffer.byteLength - 4) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE0) {
            if (view.getUint32(offset + 4) === 0x4A464946 && view.getUint8(offset + 8) === 0) {
              view.setUint8(offset + 11, 1);
              view.setUint16(offset + 12, dpiValue);
              view.setUint16(offset + 14, dpiValue);
              patched = true;
            }
            break;
          }
          if (marker === 0xFFDA || marker === 0xFFD9) break;
          const length = view.getUint16(offset + 2);
          offset += 2 + length;
        }

        if (!patched) {
          const newBuffer = new ArrayBuffer(buffer.byteLength + 18);
          const newView = new DataView(newBuffer);
          const oldBytes = new Uint8Array(buffer);

          newView.setUint16(0, 0xFFD8);
          newView.setUint16(2, 0xFFE0);
          newView.setUint16(4, 16);
          newView.setUint8(6, 0x4A);
          newView.setUint8(7, 0x46);
          newView.setUint8(8, 0x49);
          newView.setUint8(9, 0x46);
          newView.setUint8(10, 0x00);
          newView.setUint8(11, 1);
          newView.setUint8(12, 1);
          newView.setUint8(13, 1);
          newView.setUint16(14, dpiValue);
          newView.setUint16(16, dpiValue);
          newView.setUint8(18, 0);
          newView.setUint8(19, 0);

          new Uint8Array(newBuffer).set(oldBytes.subarray(2), 20);
          resolve(new Blob([newBuffer], { type: 'image/jpeg' }));
          return;
        }

        resolve(new Blob([buffer], { type: 'image/jpeg' }));
      } catch (err) {
        resolve(blob);
      }
    };
    reader.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(blob);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const FIVENEST_LOGO_SVG_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.8 48.1"><path fill="#0acbf9" d="M32.55,0l3.08,2.98c.82.79.83,2.1.03,2.91l-14.83,14.9c-1.88,1.98-2.2,4.93-.21,6.95l4.84,4.94,13.51-13.47,2.99,2.72c.8.73,1.1,2.2.22,3.09l-8.72,8.82c-1.7,1.72-2.03,4.58-.29,6.38l3.18,3.3-4.6,4.57-1.44-1.69-14.48-14.7c-3.92-3.98-3.89-10.64.04-14.63L32.55,0Z"/><path fill="#ffffff" d="M43.8,27.28c1.93-1.94,2.44-4.88.4-6.88l-4.99-4.88-13.44,13.22-2.84-2.54c-.35-.31-.94-.94-.94-1.63,0-.79.52-1.52.98-2.01l15.96-16.62,9.95,10.2c4.27,4.37,3.79,11.05-.3,15.32l-10.11,10.18-3.15-2.92c-.83-.88-.93-2,0-2.94l8.46-8.49h.02Z"/></svg>`)}`;

const globalImageCache: Record<string, HTMLImageElement> = {};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout for ${url}`));
    }, 3000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = (e) => {
      clearTimeout(timer);
      reject(e);
    };
    img.src = url;
  });
};

const getCachedImage = async (url: string): Promise<HTMLImageElement | null> => {
  if (!url) return null;
  if (globalImageCache[url]) return globalImageCache[url];
  try {
    const img = await loadImage(url);
    globalImageCache[url] = img;
    return img;
  } catch (e) {
    console.warn(`Failed to load image at ${url}:`, e);
    return null;
  }
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
  const [dpi, setDpi] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fivenest_pref_dpi');
      return saved ? JSON.parse(saved) : 300;
    } catch { return 300; }
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>(() => {
    try { return (localStorage.getItem('fivenest_pref_export_format') as ExportFormat) || 'jpg'; } catch { return 'jpg'; }
  });
  const [colorProfile, setColorProfile] = useState<ColorProfile>(() => {
    try { return (localStorage.getItem('fivenest_pref_color_profile') as ColorProfile) || 'rgb'; } catch { return 'rgb'; }
  });
  
  const [includeWatermarkLogo, setIncludeWatermarkLogo] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fivenest_pref_logo_watermark');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });
  
  const [nestingSheets, setNestingSheets] = useState<NestingSheet[]>([]);
  const [isNesting, setIsNesting] = useState<boolean>(false);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentCost, setPaymentCost] = useState<number>(0);
  const [pendingExportAction, setPendingExportAction] = useState<(() => Promise<void>) | null>(null);
  const [simulatedPaymentLoading, setSimulatedPaymentLoading] = useState<boolean>(false);
  const [upiPaymentMethod, setUpiPaymentMethod] = useState<'wallet' | 'upi'>('wallet');
  // Custom top-up amount the user wants to add to wallet
  const [customTopupAmount, setCustomTopupAmount] = useState<string>('');

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

  // Add a custom amount to wallet via Supabase
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMessage, setTopupMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleCustomTopup = async () => {
    const amt = parseFloat(customTopupAmount);
    if (!amt || amt <= 0) {
      setTopupMessage({ text: 'Enter a valid amount (e.g. ₹100)', ok: false });
      return;
    }
    if (!currentUser) {
      setTopupMessage({ text: 'Please sign in first.', ok: false });
      return;
    }
    setTopupLoading(true);
    setTopupMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expired');

      const { error } = await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: amt,
        transaction_type: 'topup',
        description: `Manual wallet top-up ₹${amt}`
      });
      if (error) throw new Error(error.message);

      const details = await fetchUserWallet(user.id);
      const updatedUser = { ...currentUser, balance: details.balance };
      localStorage.setItem('fivenest_active_user', JSON.stringify(updatedUser));
      onUserChange(updatedUser);
      setCustomTopupAmount('');
      setTopupMessage({ text: `✅ ₹${amt} added! New balance: ₹${details.balance.toFixed(2)}`, ok: true });
      setTimeout(() => setTopupMessage(null), 4000);
    } catch (err: any) {
      setTopupMessage({ text: err.message || 'Top-up failed', ok: false });
    } finally {
      setTopupLoading(false);
    }
  };
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [exportProgressPct, setExportProgressPct] = useState<number>(0);
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

  // Trigger Nesting layout cal  // Helper to compile the list of all panel pieces to export on the fly with Selective Panel Filtering
  const getItemsToExport = (): PlacedItem[] => {
    const items: PlacedItem[] = [];

    // Check panel artwork status: Strictly check if graphic files are uploaded or text overlays are enabled
    const frontHasArtwork = Boolean(
      designConfig?.front?.uploadedFileUrl ||
      (designConfig?.front?.nameConfig?.enabled && !metadata?.blankKit) ||
      (designConfig?.front?.numberConfig?.enabled && !metadata?.blankKit)
    );
    const backHasArtwork = Boolean(
      designConfig?.back?.uploadedFileUrl ||
      (designConfig?.back?.nameConfig?.enabled && !metadata?.blankKit) ||
      (designConfig?.back?.numberConfig?.enabled && !metadata?.blankKit)
    );
    const sleeveHasArtwork = Boolean(
      designConfig?.sleeveLeft?.uploadedFileUrl || 
      designConfig?.sleeveLeft?.uploadedFileHalfUrl || 
      designConfig?.sleeveLeft?.uploadedFileFullUrl || 
      designConfig?.sleeveRight?.uploadedFileUrl ||
      designConfig?.sleeveRight?.uploadedFileHalfUrl ||
      designConfig?.sleeveRight?.uploadedFileFullUrl
    );
    const a4HasArtwork = Boolean(
      metadata?.a4BackPrint && (
        designConfig?.a4Print?.uploadedFileUrl ||
        (designConfig?.a4Print?.nameConfig?.enabled && !metadata?.blankKit) ||
        (designConfig?.a4Print?.numberConfig?.enabled && !metadata?.blankKit)
      )
    );

    // If any artwork is uploaded, strictly only export panels that have uploaded/active artwork!
    const anyArtworkUploaded = frontHasArtwork || backHasArtwork || sleeveHasArtwork || a4HasArtwork;

    records.forEach((player, idx) => {
      const sizeConf = sizeDB[player.size] || sizeDB["40"] || Object.values(sizeDB)[0];
      if (!sizeConf) return;
      const isSleeveOnly = player.name.toUpperCase() === 'SLEEVE';
      const isFrontOnly = player.name.toUpperCase() === 'FRONT';
      const isBackOnly = player.name.toUpperCase() === 'BACK';
      
      for (let q = 0; q < player.qty; q++) {
        const itemIndex = `${player.id}-item-${idx}-${q}`;
        
        // Front panel: Include if front artwork exists (or fallback if nothing uploaded)
        const includeFront = (!anyArtworkUploaded || frontHasArtwork || isFrontOnly) && !isSleeveOnly && !isBackOnly;
        if (includeFront) {
          items.push({
            recordId: itemIndex,
            playerName: player.name,
            playerNum: player.number,
            panelType: 'front',
            size: player.size,
            w: sizeConf.front?.w || 15,
            h: sizeConf.front?.h || 21,
            x: 0,
            y: 0,
            rotated: false
          });
        }
        
        // Back panel: Include if back artwork exists (or fallback if nothing uploaded)
        const includeBack = (!anyArtworkUploaded || backHasArtwork || isBackOnly) && !isSleeveOnly && !isFrontOnly;
        if (includeBack) {
          items.push({
            recordId: itemIndex,
            playerName: player.name,
            playerNum: player.number,
            panelType: 'back',
            size: player.size,
            w: sizeConf.back?.w || 15,
            h: sizeConf.back?.h || 21,
            x: 0,
            y: 0,
            rotated: false
          });
        }

        // Sleeve panels: Include ONLY if sleeve artwork was actually uploaded!
        const effectiveSleeveType: 'half' | 'full' = player.sleeve === 'full' ? 'full' : 'half';
        const includeSleeve = sleeveHasArtwork && player.sleeve !== 'none' && !isFrontOnly && !isBackOnly;

        if (includeSleeve) {
          let sleeveW = 0;
          let sleeveH = 0;
          if (effectiveSleeveType === 'full') {
            sleeveW = metadata.raglanStyle ? (sizeConf.rFull?.w || sizeConf.full?.w || 14) : (sizeConf.full?.w || 14);
            sleeveH = metadata.raglanStyle ? (sizeConf.rFull?.h || sizeConf.full?.h || 18) : (sizeConf.full?.h || 18);
          } else {
            sleeveW = metadata.raglanStyle ? (sizeConf.rHalf?.w || sizeConf.half?.w || 14) : (sizeConf.half?.w || 7);
            sleeveH = metadata.raglanStyle ? (sizeConf.rHalf?.h || sizeConf.half?.h || 7) : (sizeConf.half?.h || 7);
          }

          if (metadata.halfSleeveMerge && effectiveSleeveType === 'half' && !metadata.raglanStyle) {
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
              sleeveType: effectiveSleeveType,
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
              sleeveType: effectiveSleeveType,
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
              sleeveType: effectiveSleeveType,
              isRaglan: metadata.raglanStyle
            });
          }
        }

        // Standalone A4 chest/print panel (10x11 in)
        const includeA4 = metadata.a4BackPrint && (!anyArtworkUploaded || a4HasArtwork) && !isSleeveOnly;
        if (includeA4) {
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
    if (itemsToPack.length === 0) {
      alert("No items to nest. Check your roster entries.");
      setIsNesting(false);
      return;
    }

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
    const isLightMode = document.querySelector('.app-layout')?.classList.contains('light');
    ctx.fillStyle = isLightMode ? '#e2e8f0' : '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw gridlines
    ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
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
      else if (item.panelType === 'sleeve-left' || item.panelType === 'sleeve-merged') panelTypeKey = 'sleeveLeft';
      else if (item.panelType === 'sleeve-right') panelTypeKey = 'sleeveRight';
      else if (item.panelType === 'a4-print') panelTypeKey = 'a4Print';
      else {
        panelTypeKey = 'sleeveLeft';
      }
      const conf = designConfig[panelTypeKey] || designConfig.front;

      // Reference Size 40 base dimensions (inches) for perfect grading normalization across Size 18-60
      const refW = (item.panelType === 'front' || item.panelType === 'back') ? 22 : item.panelType.startsWith('sleeve') ? 20 : 10;
      const refH = (item.panelType === 'front' || item.panelType === 'back') ? 30 : item.panelType.startsWith('sleeve') ? 26 : 11;
      const relW = item.w / refW;
      const relH = item.h / refH;

      // Load optional guides preferences from localStorage (Default ON = true)
      const savedCenter = localStorage.getItem('fivenest_pref_center_marks');
      const centerMarks = savedCenter !== null ? JSON.parse(savedCenter) : true;
      const savedWater = localStorage.getItem('fivenest_pref_size_watermarks');
      const sizeWatermarks = savedWater !== null ? JSON.parse(savedWater) : true;

      const drawTechnicalMarks = () => {
        if (centerMarks && item.panelType !== 'a4-print') {
          ctx.save();
          ctx.shadowColor = 'transparent';
          
          // Smart normalized notch mark: Normalized to reference Size 40 proportions
          // Identical relative appearance & razor sharp across all sizes 18 to 60
          const wPx = Math.max(2, Math.round(0.08 * scaleDpi * relW));
          const hPx = Math.max(4, Math.round(0.22 * scaleDpi * relH));
          const strokePx = Math.max(1, Math.round(((1.5 / 72) * scaleDpi) * relW));
          const leftEdgeXPx = Math.round(widthPx / 2 - wPx / 2);

          // White outside stroke for technical center marks
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = strokePx;
          ctx.strokeRect(leftEdgeXPx - strokePx / 2, 0, wPx + strokePx, hPx + strokePx / 2);
          ctx.strokeRect(leftEdgeXPx - strokePx / 2, heightPx - hPx - strokePx / 2, wPx + strokePx, hPx + strokePx / 2);

          // Top Center & Bottom Center solid patch in Red
          ctx.fillStyle = '#ff1744';
          ctx.fillRect(leftEdgeXPx, 0, wPx, hPx);
          ctx.fillRect(leftEdgeXPx, heightPx - hPx, wPx, hPx);
          ctx.restore();
        }

        if (sizeWatermarks && item.panelType !== 'a4-print') {
          ctx.save();
          // Smart normalized sleeve watermark (14pt reference scaled with panel width)
          const fontSizePx = Math.max(8, Math.round(((14 / 72) * scaleDpi) * relW));
          const strokePx = Math.max(1, Math.round(fontSizePx * 0.12));
          ctx.font = `bold ${fontSizePx}px system-ui`;
          ctx.shadowColor = 'transparent';

          const offset = Math.max(4, Math.round(0.06 * scaleDpi * relW));

          // Sleeve Style on top-right of Back panel
          if (item.panelType === 'back') {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';

            const record = records.find(r => item.recordId.startsWith(r.id));
            const sleeveStyle = record?.sleeve || 'none';
            if (sleeveStyle !== 'none') {
              const isRaglan = item.isRaglan || false;
              const typeStr = sleeveStyle === 'full'
                ? (isRaglan ? 'RAGLAN FULL' : 'FULL')
                : (isRaglan ? 'RAGLAN HALF' : 'HALF');

              // White outside stroke
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = strokePx * 2;
              ctx.strokeText(typeStr, widthPx - offset, offset);

              // Red Fill
              ctx.fillStyle = '#ff1744';
              ctx.fillText(typeStr, widthPx - offset, offset);
            }
          }
          ctx.restore();
        }
      };

      const drawSingleText = (text: string, textConf: TextConfig, textX: number, textY: number, maxLimitPx: number) => {
        ctx.save();
        const fontSizePx = Math.round((textConf.fontSize / 30) * heightPx);
        // Include fallback font chain so canvas rendering never fails on custom fonts
        ctx.font = `bold ${fontSizePx}px "${textConf.fontFamily}", Impact, "Arial Black", sans-serif`;
        
        const align = textConf.align || 'center';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        // Proportional stroke calculation matching screen preview
        const strokePx = Math.max(1, Math.round((textConf.strokeWidth / 50) * fontSizePx));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

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

        const getTextFillStyle = (measuredTextW: number, textH: number): string | CanvasGradient => {
          if (textConf.fillType === 'gradient') {
            const stops = (textConf.gradientStops && textConf.gradientStops.length >= 2)
              ? textConf.gradientStops
              : [textConf.gradientColor1 || textConf.color || '#00e5ff', textConf.gradientColor2 || '#ff0055'];
            const dir = textConf.gradientDirection || 'vertical';
            let grad: CanvasGradient;
            if (dir === 'horizontal') {
              grad = ctx.createLinearGradient(-measuredTextW / 2, 0, measuredTextW / 2, 0);
            } else if (dir === 'radial') {
              grad = ctx.createRadialGradient(0, 0, 2, 0, 0, textH);
            } else if (dir === 'diagonal') {
              grad = ctx.createLinearGradient(-measuredTextW / 2, -textH / 2, measuredTextW / 2, textH / 2);
            } else {
              grad = ctx.createLinearGradient(0, -textH / 2, 0, textH / 2);
            }
            stops.forEach((color, idx) => {
              const offset = idx / Math.max(1, stops.length - 1);
              grad.addColorStop(offset, color);
            });
            return grad;
          }
          return textConf.color;
        };

        if (textConf.effect === 'arch') {
          // Circular arched text bending concave (ends down)
          const radius = heightPx * 0.45;
          ctx.translate(drawX, textY + radius);
          const totalAngle = Math.min(Math.PI / 2.5, (displayName.length * fontSizePx * 0.55) / radius);
          const startAngle = -totalAngle / 2;
          const angleStep = totalAngle / (displayName.length - 1 || 1);
          const archFill = getTextFillStyle(radius * 2, fontSizePx);

          for (let i = 0; i < displayName.length; i++) {
            const char = displayName[i];
            const charAngle = startAngle + i * angleStep;
            ctx.save();
            ctx.rotate(charAngle);
            if (textConf.strokeWidth > 0) {
              ctx.strokeStyle = textConf.strokeColor;
              ctx.lineWidth = strokePx * 2;
              ctx.strokeText(char, 0, -radius);
            }
            ctx.fillStyle = archFill;
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
            ctx.strokeStyle = textConf.strokeColor;
            ctx.lineWidth = strokePx * 2;
            ctx.strokeText(displayName, 0, 0);
          }
          ctx.fillStyle = getTextFillStyle(measuredW, fontSizePx);
          ctx.fillText(displayName, 0, 0);
        }
        ctx.restore();
      };

      const drawOverlays = () => {
        const hideOverlays = metadata.blankKit;
        const isNameEnabled = conf.nameConfig.enabled;
        const isNumEnabled = conf.numberConfig.enabled;

        // Draw Name overlay if enabled
        if (!hideOverlays && isNameEnabled && item.playerName && item.playerName !== "BLANK") {
          const textX = conf.nameConfig.xPos !== undefined ? (conf.nameConfig.xPos / 100) * widthPx : widthPx / 2;
          const textY = (conf.nameConfig.yPos / 100) * heightPx;
          // Scale maxLimitPx proportionally to reference width (22in) so scaling across sizes (18 to 60) stays proportional
          const maxLimitPx = (conf.nameConfig.maxW / 22) * widthPx;
          drawSingleText(item.playerName, conf.nameConfig, textX, textY, maxLimitPx);
        }

        // Draw Number overlay if enabled
        if (!hideOverlays && isNumEnabled && item.playerNum) {
          const textX = conf.numberConfig.xPos !== undefined ? (conf.numberConfig.xPos / 100) * widthPx : widthPx / 2;
          const textY = (conf.numberConfig.yPos / 100) * heightPx;
          // Scale maxLimitPx proportionally to reference width (22in) so scaling across sizes (18 to 60) stays proportional
          const maxLimitPx = (conf.numberConfig.maxW / 22) * widthPx;
          drawSingleText(item.playerNum, conf.numberConfig, textX, textY, maxLimitPx);
        }

        // Draw customizable Size Tag (Top Left)
        const sizeTagConf = conf.sizeTagConfig || { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left' };
        if (sizeTagConf.enabled && item.panelType !== 'a4-print') {
          ctx.save();
          // Smart normalized size tag font (reference pt scaled with panel width relative to Size 40)
          const basePt = sizeTagConf.fontSize || 26;
          const fontSizePx = Math.max(8, Math.round(((basePt / 72) * scaleDpi) * relW));
          ctx.font = `bold ${fontSizePx}px "${sizeTagConf.fontFamily}", Impact, sans-serif`;

          const align = sizeTagConf.align || 'left';
          ctx.textAlign = align;
          ctx.textBaseline = 'top';
          ctx.lineJoin = 'round';

          const offsetX = Math.max(4, Math.round(0.06 * scaleDpi * relW));
          const offsetY = Math.max(4, Math.round(0.05 * scaleDpi * relH));
          
          let targetX = offsetX;
          if (align === 'center') {
            targetX = widthPx / 2;
          } else if (align === 'right') {
            targetX = widthPx - offsetX;
          }

          let drawX = targetX;
          let spacingPx = 0;

          if (sizeTagConf.letterSpacing !== undefined) {
            spacingPx = Math.round(sizeTagConf.letterSpacing * scaleDpi * relW);
            ctx.letterSpacing = `${spacingPx}px`;
            if (align === 'center') {
              drawX += spacingPx / 2;
            } else if (align === 'right') {
              drawX += spacingPx;
            }
          }

          if (sizeTagConf.effect === 'shadow') {
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4 * (scaleDpi / 100) * relW;
            ctx.shadowOffsetX = 2 * (scaleDpi / 100) * relW;
            ctx.shadowOffsetY = 2 * (scaleDpi / 100) * relW;
          }

          // Calculate total quantity for this size in the roster order
          const matchingRecords = records.filter(r => (r.size || '').trim() === (item.size || '').trim());
          const sizeQty = matchingRecords.reduce((acc, r) => acc + (r.qty || 1), 0);
          const qtyVal = sizeQty > 0 ? sizeQty : (item.qty || 1);

          // Requirement: Format size watermark without spaces as "40=2"
          const sizeQtyText = `${item.size}=${qtyVal}`;
          const templateText = sizeTagConf.text || '{size}';
          const displayText = templateText.includes('{size}')
            ? templateText.replace('{size}', sizeQtyText)
            : sizeQtyText;

          // Slightly compressed width of size tag (0.80x scale) so it takes up less space
          ctx.scale(0.80, 1.0);
          const compressedDrawX = drawX / 0.80;

          const sw = sizeTagConf.strokeWidth > 0 ? sizeTagConf.strokeWidth : 3;
          const swPx = Math.max(1, Math.round(((sw / 72) * scaleDpi) * relW));

          ctx.strokeStyle = sizeTagConf.strokeColor || '#ffffff';
          ctx.lineWidth = swPx * 2;
          ctx.strokeText(displayText, compressedDrawX, offsetY);

          ctx.fillStyle = sizeTagConf.color || '#ff1744';
          ctx.fillText(displayText, compressedDrawX, offsetY);
          ctx.restore();
        }

        // Draw center tick marks and corner watermark text labels
        drawTechnicalMarks();

        // Draw FiveNest Woven Label Tag (Upright, 0.50 in from Right side, 0.05 in from Bottom edge, FIXED 1" x 0.4" on ALL sizes)
        if (includeWatermarkLogo && item.panelType === 'front') {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // FIXED physical dimensions: 1.00" x 0.40" (identical physical size on all panels 18 to 60)
          const physicalPatchW = 1.00; // in inches
          const physicalPatchH = 0.40; // in inches
          const patchW = Math.round(physicalPatchW * scaleDpi);
          const patchH = Math.round(physicalPatchH * scaleDpi);

          // EXACT Placement: 0.50 inches from Right edge and 0.05 inches from Bottom edge
          const marginFromRight = Math.round(0.50 * scaleDpi);
          const marginFromBottom = Math.round(0.05 * scaleDpi);

          const drawX = widthPx - marginFromRight - patchW;
          const drawY = heightPx - marginFromBottom - patchH;

          ctx.globalAlpha = 1.0;

          if (fivenestLabelTagImageInstance && fivenestLabelTagImageInstance.complete && fivenestLabelTagImageInstance.naturalWidth > 0) {
            ctx.drawImage(fivenestLabelTagImageInstance, drawX, drawY, patchW, patchH);
          } else if (fivenestLogoImageInstance && fivenestLogoImageInstance.complete && fivenestLogoImageInstance.naturalWidth > 0) {
            ctx.drawImage(fivenestLogoImageInstance, drawX, drawY, patchW, patchH);
          }

          ctx.restore();
        }

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
      let isUploadBg = conf.backgroundType === 'upload';

      if (item.panelType.startsWith('sleeve')) {
        const leftConf = designConfig?.sleeveLeft;
        const rightConf = designConfig?.sleeveRight;
        const activeSleeve = (item.panelType === 'sleeve-right' && (rightConf?.uploadedFileUrl || rightConf?.uploadedFileFullUrl || rightConf?.uploadedFileHalfUrl))
          ? rightConf
          : leftConf;

        bgUrl = item.sleeveType === 'full'
          ? (activeSleeve?.uploadedFileFullUrl || activeSleeve?.uploadedFileUrl || conf.uploadedFileFullUrl || conf.uploadedFileUrl)
          : (activeSleeve?.uploadedFileHalfUrl || activeSleeve?.uploadedFileUrl || conf.uploadedFileHalfUrl || conf.uploadedFileUrl);

        if (bgUrl || activeSleeve?.backgroundType === 'upload') {
          isUploadBg = true;
        }
      }

      const leftLogo = conf.leftChestLogo;
      const rightLogo = conf.rightChestLogo;
      const torsoLogo = conf.torsoLogo;

      const loadAllImages = async () => {
        const images: { bg?: HTMLImageElement; leftLogo?: HTMLImageElement; rightLogo?: HTMLImageElement; torsoLogo?: HTMLImageElement } = {};
        const promises: Promise<void>[] = [];

        if ((isUploadBg || conf.backgroundType === 'upload') && bgUrl) {
          promises.push(
            getCachedImage(bgUrl).then(img => { if (img) images.bg = img; })
          );
        }

        if (leftLogo?.enabled && leftLogo?.uploadedUrl) {
          promises.push(
            getCachedImage(leftLogo.uploadedUrl).then(img => { if (img) images.leftLogo = img; })
          );
        }

        if (rightLogo?.enabled && rightLogo?.uploadedUrl) {
          promises.push(
            getCachedImage(rightLogo.uploadedUrl).then(img => { if (img) images.rightLogo = img; })
          );
        }

        if (torsoLogo?.enabled && torsoLogo?.uploadedUrl) {
          promises.push(
            getCachedImage(torsoLogo.uploadedUrl).then(img => { if (img) images.torsoLogo = img; })
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

          // For sleeves, enforce background dimensions matching actual sleeve item dimensions to prevent cropping
          let targetBgW = item.w;
          let targetBgH = item.h;
          if (conf.bgWidth !== undefined && !item.panelType.startsWith('sleeve')) {
            targetBgW = conf.bgWidth;
          }
          if (conf.bgHeight !== undefined && !item.panelType.startsWith('sleeve')) {
            targetBgH = conf.bgHeight;
          }

          const bgW = targetBgW * scaleDpi;
          const bgH = targetBgH * scaleDpi;
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

  const logPrintProductionExportBillingEntry = (backPanelCount: number) => {
    try {
      const activeRate = includeWatermarkLogo ? 3.00 : 5.00;
      const designDebitCost = backPanelCount * activeRate;   // charged per back panel (jersey)
      const cleanCust = metadata?.customerName || "Studio Client";
      const cleanOrder = metadata?.orderNum || "01";
      const userEmail = currentUser?.email || 'guest';
      const timestamp = Date.now();
      const exportId = `RIP-EXP-${cleanOrder}-${timestamp}`;

      const newRecord = {
        id: exportId,
        orderCode: `RIP-EXP-${cleanOrder}`,
        date: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
        customerName: cleanCust,
        fileName: `🖨️ 300 DPI Plotter RIP Export (${backPanelCount} Jerseys)`,
        whatsapp: "",
        qty: backPanelCount,
        rate: activeRate,
        designCharges: designDebitCost,
        status: "Completed",
        advance: 0
      };

      // Write to all 3 keys so billing page always finds it
      const keysToUpdate = [
        `fivenest_studio_export_billing_${userEmail.toLowerCase().trim()}`,
        `fivenest_studio_export_billing_guest`,
        `fivenest_studio_export_billing_all`
      ];

      keysToUpdate.forEach(k => {
        const existingStr = localStorage.getItem(k);
        let list: any[] = existingStr ? JSON.parse(existingStr) : [];
        list.unshift(newRecord);
        localStorage.setItem(k, JSON.stringify(list));
      });

      console.log(`[FiveNest] Logged billing entry: ${exportId} — ${backPanelCount} jerseys × ₹${activeRate} = ₹${designDebitCost}`);
    } catch (err) {
      console.error("Failed to log print export billing entry:", err);
    }
  };

  // Compile full nesting sheets and save PDF
  const handleExportPDF = async () => {
    if (enableNesting && nestingSheets.length === 0) {
      // Auto-run nesting calculation so user doesn't get blocked
      runNesting();
      // Allow state update
      await new Promise(r => setTimeout(r, 100));
    }

    const items = getItemsToExport();
    const totalPieces = items.length;
    // Only back panels are billed (one per jersey)
    const billedJerseyCount = items.filter(i => i.panelType === 'back').length || totalPieces;
    if (totalPieces === 0) {
      alert("No items to export.");
      return;
    }

    const backHasArtwork = Boolean(
      designConfig?.back?.uploadedFileUrl || 
      (designConfig?.back?.backgroundType === 'upload' && designConfig?.back?.uploadedFileUrl) ||
      designConfig?.back?.backgroundType === 'generate'
    );
    const activeRate = includeWatermarkLogo ? 3.00 : 5.00;
    const calculatedCost = items.reduce((acc, item) => {
      if (item.panelType === 'back') {
        // If client did not upload back image / artwork, charge 0 rs
        return acc + (backHasArtwork ? activeRate : 0);
      } else if (item.panelType === 'a4-print') {
        return acc + 0.50;
      }
      return acc;
    }, 0);

    const executeExport = async () => {
      setIsExporting(true);
      setExportProgressPct(0);
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
          setExportProgressPct(8);
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
                label: `[Front] ${size}=${list.length} F`
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
                label: `[Back] ${size}=${list.length} B`
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
              label: `[Sleeve] ${rep.size}=${qty} ${sleeveCode}`
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
                label: `[A4] ${size}=${list.length} A4`
              });
            });
          }

          if (testPdfPages.length > 0) {
            const firstPage = testPdfPages[0];
            const maxItemHeight = testPdfPages.reduce((max, pg) => Math.max(max, pg.item.h), 0);
            const maxItemHeightPt = (maxItemHeight * 72) + 60;
            const zipUUnit = maxItemHeightPt > 14400 ? Math.ceil(maxItemHeightPt / 14400) : 1.0;

            const initialItemW = firstPage.item.w * 72;
            const initialItemH = firstPage.item.h * 72;
            const initialPageW = (initialItemW + 60) / zipUUnit;
            const initialPageH = (initialItemH + 70) / zipUUnit;

            const testPdf = new jsPDF({
              orientation: initialPageW > initialPageH ? 'landscape' : 'portrait',
              unit: 'pt',
              format: [ initialPageW, initialPageH ],
              userUnit: zipUUnit
            });

            for (let i = 0; i < testPdfPages.length; i++) {
              const page = testPdfPages[i];
              const item = page.item;
              setExportProgressPct(Math.round(10 + ((i / testPdfPages.length) * 85)));
              setExportProgress(`Rendering 72 DPI Test PDF Page (${i + 1}/${testPdfPages.length}): ${page.label}...`);

              // Page margins & top header layout
              const paddingSidePt = 40;     // 40pt side padding
              const paddingTopPt = 20;      // 20pt top page margin
              const headerBarHPt = 48;      // 48pt top header bar area for file label
              const gapBelowHeaderPt = 20;  // 20pt gap between header & panel image
              const paddingBottomPt = 40;  // 40pt bottom page margin

              const itemWPt = item.w * 72;
              const itemHPt = item.h * 72;

              const pageWPt = (itemWPt + (paddingSidePt * 2)) / zipUUnit;
              const pageHPt = (itemHPt + paddingTopPt + headerBarHPt + gapBelowHeaderPt + paddingBottomPt) / zipUUnit;
              const orientation = pageWPt > pageHPt ? 'landscape' : 'portrait';

              if (i > 0) {
                testPdf.addPage([ pageWPt, pageHPt ], orientation);
              }

              // 1. Solid white background for full page
              testPdf.setFillColor(255, 255, 255);
              testPdf.rect(0, 0, pageWPt, pageHPt, 'F');

              // 2. Draw Clean Header Bar & File Name Label at TOP of Page
              const fontPt = Math.max(18, Math.round(pageWPt * 0.028));
              testPdf.setFontSize(fontPt);
              testPdf.setFont("helvetica", "bold");

              const textStr = page.label;
              const textWidth = testPdf.getTextWidth(textStr);
              const pillW = Math.max(textWidth + 40, pageWPt * 0.35);
              const pillH = fontPt + 16;
              const pillX = (pageWPt / 2) - (pillW / 2);
              const pillY = (paddingTopPt + (headerBarHPt - pillH) / 2) / zipUUnit;

              // High-contrast rounded pill box for file label
              testPdf.setFillColor(248, 249, 254);
              testPdf.setDrawColor(180, 185, 210);
              testPdf.setLineWidth(1.5);
              testPdf.roundedRect(pillX, pillY, pillW, pillH, 6, 6, 'FD');

              // Centered bold text in header pill
              testPdf.setTextColor(15, 15, 30);
              testPdf.text(
                textStr,
                pageWPt / 2,
                pillY + (fontPt * 0.78),
                { align: 'center' }
              );

              // 3. Render Panel Graphic BELOW Top Header Bar
              const previewItemCanvas = await renderPanelGraphic(item, 72);
              const previewImgData = previewItemCanvas.toDataURL('image/jpeg', 0.85);

              const targetXPt = paddingSidePt / zipUUnit;
              const targetYPt = (paddingTopPt + headerBarHPt + gapBelowHeaderPt) / zipUUnit;
              const targetWPt = itemWPt / zipUUnit;
              const targetHPt = itemHPt / zipUUnit;

              testPdf.addImage(
                previewImgData, 
                'JPEG', 
                targetXPt, 
                targetYPt, 
                targetWPt, 
                targetHPt, 
                undefined, 
                'FAST'
              );
            }

            testPdf.save(`${cleanCust}_${cleanOrder}_72DPI_Test.pdf`);
          }

          setExportProgressPct(100);
          setExportProgress("Export complete!");
          await new Promise(r => setTimeout(r, 1800));
          setIsExporting(false);
          setExportProgress("");
          setExportProgressPct(0);

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
          const fileExt = exportFormat === 'png' ? '.png' : exportFormat === 'tiff' ? '.tif' : '.jpg';

          for (let i = 0; i < renderActions.length; i++) {
            const action = renderActions[i];
            // Replace .jpg extension in fileName with selected format extension
            const outFileName = action.fileName.replace(/\.jpe?g$/i, fileExt);
            setExportProgressPct(Math.round(15 + ((i / renderActions.length) * 65)));
            setExportProgress(`Rendering ${action.folder || 'other'} panel: ${outFileName} (${i + 1}/${renderActions.length}) at ${activeDpi} DPI...`);

            // Yield control to main thread so browser repaints progress text
            await new Promise(r => setTimeout(r, 0));

            const itemCanvas = await renderPanelGraphic(action.representativeItem, activeDpi);
            let blob = await getCanvasBlobForFormat(itemCanvas, exportFormat, colorProfile, activeDpi);

            // For JPG, inject DPI metadata into EXIF
            if (exportFormat === 'jpg') {
              blob = await injectJPDpi(blob, activeDpi);
            }

            if (action.folder) {
              zip.folder(action.folder)?.file(outFileName, blob);
            } else {
              zip.file(outFileName, blob);
            }

            // Immediately release GPU canvas memory
            itemCanvas.width = 0;
            itemCanvas.height = 0;
          }

          setExportProgressPct(82);
          setExportProgress("Compiling ZIP package...");
          const content = await zip.generateAsync({ type: "blob" });
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `${cleanCust}_${cleanOrder}_Sublimation_Panels.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Billing is logged once at end of full export (not here, to avoid duplicates)

          // Now, generate and download a 72 DPI preview PDF alongside if activeDpi > 72 and not in testMode
          const needPreviewPdf = !testMode && activeDpi > 72;
          if (needPreviewPdf && renderActions.length > 0) {
            setExportProgressPct(90);
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

          // Auto-log Print Production Export Billing Entry (Test Mode)
          logPrintProductionExportBillingEntry(billedJerseyCount);

          setExportProgressPct(100);
          setExportProgress("Export complete!");
          await new Promise(r => setTimeout(r, 1800));
          setIsExporting(false);
          setExportProgress("");
          setExportProgressPct(0);

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
            const totalItems = nestingSheets.reduce((acc, sh) => acc + sh.items.length, 0);
            const globalIdx = nestingSheets.slice(0, s).reduce((acc, sh) => acc + sh.items.length, 0) + i;
            setExportProgressPct(Math.round(15 + ((globalIdx / Math.max(totalItems, 1)) * 68)));
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

        setExportProgressPct(97);
        setExportProgress("Saving PDF document...");
        pdf.save(`${cleanCust}_${cleanOrder}_Print_Roll.pdf`);

        if (needPreviewPdf && previewPdf) {
          previewPdf.save(`${cleanCust}_${cleanOrder}_Preview_72dpi.pdf`);
        }

        // Auto-log Print Production Export Billing Entry in Invoices & Billing
        logPrintProductionExportBillingEntry(billedJerseyCount);

        setExportProgressPct(100);
        setExportProgress("Export complete!");
        await new Promise(r => setTimeout(r, 1800));
        setIsExporting(false);
        setExportProgress("");
        setExportProgressPct(0);

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
        setExportProgressPct(0);
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
    <div className="nesting-view fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* Top Hero Glass Header & Quick Stat Tiles */}
      <div className="glass-panel" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient background glow orb */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(0,229,255,0.2) 0%, rgba(124,58,237,0.2) 100%)', border: '1px solid rgba(0,229,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0,229,255,0.2)' }}>
                <Sliders size={20} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Production & Export Engine
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  High-Precision Sublimation RIP Layouts, Roll Packing & 300 DPI Export
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Balance Pill */}
          <div 
            onClick={onOpenLogin}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '8px 16px', 
              borderRadius: '9999px', 
              background: 'rgba(15,23,42,0.65)', 
              backdropFilter: 'blur(16px)', 
              border: '1px solid rgba(0,229,255,0.3)', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Click to manage wallet / recharge"
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={14} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet Balance</div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: (currentUser?.balance || 0) > 0 ? '#4ade80' : '#f59e0b' }}>
                ₹{(currentUser?.balance || 0).toFixed(2)} INR
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '800', background: 'rgba(0,229,255,0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(0,229,255,0.3)' }}>
              + Add
            </span>
          </div>
        </div>

        {/* 4 Glassmorphism Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', position: 'relative', zIndex: 1 }}>
          
          {/* Card 1: Printable Panels */}
          <div className="glass-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Printable Panels</span>
              <span style={{ fontSize: '16px' }}>📦</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' }}>
              {enableNesting 
                ? `${nestingSheets.reduce((acc, sheet) => acc + sheet.items.length, 0)} Panels`
                : `${getItemsToExport().length} Panels`}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {records.reduce((acc, r) => acc + r.qty, 0)} Total Garments in Job
            </div>
          </div>

          {/* Card 2: Export Resolution */}
          <div className="glass-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile & Quality</span>
              <span style={{ fontSize: '16px' }}>⚙️</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-cyan)' }}>
              {dpi} DPI
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {exportFormat.toUpperCase()} • {colorProfile.toUpperCase()} Profile
            </div>
          </div>

          {/* Card 3: Woven Label Watermark Tag */}
          <div 
            className="glass-stat-card" 
            style={{ cursor: 'pointer', border: includeWatermarkLogo ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 171, 0, 0.4)' }}
            onClick={() => {
              const val = !includeWatermarkLogo;
              setIncludeWatermarkLogo(val);
              localStorage.setItem('fivenest_pref_logo_watermark', JSON.stringify(val));
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FiveNest Woven Label</span>
              <span style={{ fontSize: '14px' }}>{includeWatermarkLogo ? '🏷️' : '🚫'}</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: includeWatermarkLogo ? '#4ade80' : '#f59e0b' }}>
              {includeWatermarkLogo ? 'ON (₹3/pc)' : 'OFF (₹5/pc)'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {includeWatermarkLogo ? 'Discounted Rate Applied' : 'Standard Rate (No Tag)'}
            </div>
          </div>

          {/* Card 4: Layout Efficiency */}
          <div className="glass-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layout Strategy</span>
              <span style={{ fontSize: '16px' }}>🗺️</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#a78bfa' }}>
              {enableNesting 
                ? `${nestingSheets[activeSheetIndex]?.efficiency || 0}% Efficiency` 
                : 'Individual ZIP'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {enableNesting ? `Roll: ${rollW}" × ${Math.round(nestingSheets[activeSheetIndex]?.height || 0)}"` : 'Organized in Subfolders'}
            </div>
          </div>

        </div>
      </div>

      {/* Main Dual Configuration Container (Mode Selection + Export Bar) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Mode Selector & Roll Options */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} /> Production Packaging Mode
            </h3>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Select Workflow</span>
          </div>

          {/* Segmented Mode Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            
            {/* Mode 1: Individual Panels (ZIP) */}
            <div 
              onClick={() => {
                setEnableNesting(false);
                localStorage.setItem('fivenest_pref_enable_nesting', JSON.stringify(false));
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: !enableNesting ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: !enableNesting ? '1px solid rgba(0, 229, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: !enableNesting ? '0 0 20px rgba(0, 229, 255, 0.15)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px' }}>📦</span>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: !enableNesting ? '4px solid var(--accent-cyan)' : '2px solid rgba(255,255,255,0.2)', background: !enableNesting ? '#ffffff' : 'transparent' }}></span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: !enableNesting ? '#00e5ff' : 'var(--text-primary)' }}>
                Individual (ZIP)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                Separated panel files sorted into Front, Back, and Sleeves.
              </div>
            </div>

            {/* Mode 2: Roll Nesting (PDF) */}
            <div 
              onClick={() => {
                setEnableNesting(true);
                localStorage.setItem('fivenest_pref_enable_nesting', JSON.stringify(true));
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: enableNesting ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: enableNesting ? '1px solid rgba(0, 229, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: enableNesting ? '0 0 20px rgba(0, 229, 255, 0.15)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px' }}>🗺️</span>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: enableNesting ? '4px solid var(--accent-cyan)' : '2px solid rgba(255,255,255,0.2)', background: enableNesting ? '#ffffff' : 'transparent' }}></span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: enableNesting ? '#00e5ff' : 'var(--text-primary)' }}>
                Roll Nesting (PDF)
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                Continuous tightly-packed canvas for direct RIP roll printing.
              </div>
            </div>

          </div>

          {/* Roll Nesting Specific Sub-controls */}
          {enableNesting && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Roll W (in):</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
                    value={rollW} 
                    onChange={(e) => {
                      const w = parseFloat(e.target.value) || 64;
                      setRollW(w);
                      localStorage.setItem('fivenest_pref_roll_w', JSON.stringify(w));
                    }} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max H (in):</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
                    value={rollH} 
                    onChange={(e) => {
                      const h = parseFloat(e.target.value) || 100;
                      setRollH(h);
                      localStorage.setItem('fivenest_pref_roll_h', JSON.stringify(h));
                    }} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gap (in):</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    className="form-input" 
                    style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
                    value={itemGap} 
                    onChange={(e) => {
                      const g = parseFloat(e.target.value) || 0.25;
                      setItemGap(g);
                      localStorage.setItem('fivenest_pref_item_gap', JSON.stringify(g));
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={tightestFit} 
                    onChange={(e) => {
                      setTightestFit(e.target.checked);
                      localStorage.setItem('fivenest_pref_tightest_fit', JSON.stringify(e.target.checked));
                    }} 
                  />
                  <span>Tightest 2D Fit</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={rotateToFit} 
                    onChange={(e) => {
                      setRotateToFit(e.target.checked);
                      localStorage.setItem('fivenest_pref_rotate_to_fit', JSON.stringify(e.target.checked));
                    }} 
                  />
                  <span>Rotate 90° to Fit</span>
                </label>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={runNesting} 
                style={{ width: '100%', padding: '8px 14px', fontSize: '11px', fontWeight: '800', borderRadius: '8px' }} 
                disabled={isNesting}
              >
                <Play size={14} /> {isNesting ? "Computing Optimal Layout..." : "▶ Re-Calculate Roll Packing"}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Smart Export Parameters & Download CTA */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(13,17,34,0.75) 0%, rgba(15,23,42,0.85) 100%)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <Download size={16} style={{ color: 'var(--accent-cyan)' }} /> Export Configuration
            </h3>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Print Parameters</span>
          </div>

          {/* Row 1: Dropdown Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Resolution:</label>
              <select
                className="form-select"
                style={{ padding: '6px 8px', fontSize: '11px', borderRadius: '6px' }}
                value={dpi}
                onChange={(e) => {
                  const d = parseInt(e.target.value);
                  setDpi(d);
                  localStorage.setItem('fivenest_pref_dpi', JSON.stringify(d));
                }}
              >
                <option value="72">72 DPI</option>
                <option value="100">100 DPI</option>
                <option value="150">150 DPI</option>
                <option value="300">300 DPI ★</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Format:</label>
              <select
                className="form-select"
                style={{ padding: '6px 8px', fontSize: '11px', borderRadius: '6px' }}
                value={exportFormat}
                onChange={(e) => {
                  const f = e.target.value as ExportFormat;
                  setExportFormat(f);
                  localStorage.setItem('fivenest_pref_export_format', f);
                }}
              >
                <option value="jpg">JPG (Default ★)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="tiff">TIFF (Pro)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Color Mode:</label>
              <select
                className="form-select"
                style={{ padding: '6px 8px', fontSize: '11px', borderRadius: '6px' }}
                value={colorProfile}
                onChange={(e) => {
                  const p = e.target.value as ColorProfile;
                  setColorProfile(p);
                  localStorage.setItem('fivenest_pref_color_profile', p);
                }}
              >
                <option value="rgb">RGB (Default ★)</option>
                <option value="cmyk">CMYK</option>
              </select>
            </div>
          </div>

          {/* Row 2: Artwork Detection Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Detected Artwork:</span>
            
            {(() => {
              const frontHasArtwork = Boolean(
                designConfig?.front?.uploadedFileUrl ||
                (designConfig?.front?.nameConfig?.enabled && !metadata?.blankKit) ||
                (designConfig?.front?.numberConfig?.enabled && !metadata?.blankKit)
              );
              const backHasArtwork = Boolean(
                designConfig?.back?.uploadedFileUrl ||
                (designConfig?.back?.nameConfig?.enabled && !metadata?.blankKit) ||
                (designConfig?.back?.numberConfig?.enabled && !metadata?.blankKit)
              );
              const sleeveHasArtwork = Boolean(
                designConfig?.sleeveLeft?.uploadedFileUrl || 
                designConfig?.sleeveLeft?.uploadedFileHalfUrl || 
                designConfig?.sleeveLeft?.uploadedFileFullUrl || 
                designConfig?.sleeveRight?.uploadedFileUrl ||
                designConfig?.sleeveRight?.uploadedFileHalfUrl ||
                designConfig?.sleeveRight?.uploadedFileFullUrl
              );

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: frontHasArtwork ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: frontHasArtwork ? '#4ade80' : 'var(--text-muted)',
                    border: frontHasArtwork ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    Front {frontHasArtwork ? '✓' : '—'}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: backHasArtwork ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: backHasArtwork ? '#4ade80' : 'var(--text-muted)',
                    border: backHasArtwork ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    Back {backHasArtwork ? '✓' : '—'}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '800', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: sleeveHasArtwork ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: sleeveHasArtwork ? '#4ade80' : 'var(--text-muted)',
                    border: sleeveHasArtwork ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    Sleeves {sleeveHasArtwork ? '✓' : '—'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Row 3: Export progress bar (visible when rendering) */}
          {isExporting ? (
            <div style={{ padding: '4px 0 8px' }}>
              {/* Pct label + step text */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#E4572E' }}>
                  ⚙ Rendering production panels…
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#E4572E', fontVariantNumeric: 'tabular-nums' }}>
                  {exportProgressPct}%
                </span>
              </div>
              {/* Track */}
              <div style={{ height: '8px', borderRadius: '4px', background: '#2A1A10', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: 'linear-gradient(90deg, #E4572E, #F5A67D)',
                  width: `${exportProgressPct}%`,
                  transition: 'width 0.3s ease',
                  minWidth: exportProgressPct > 0 ? '8px' : '0',
                }}/>
                {/* Shimmer sweep */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  animation: 'shimmerSweep 1.6s ease-in-out infinite',
                  backgroundSize: '200% 100%',
                }}/>
              </div>
              {/* Step detail text */}
              <div style={{ fontSize: '10px', color: '#686661', marginTop: '6px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {exportProgress || 'Initialising…'}
              </div>
            </div>
          ) : (
            <button 
              type="button"
              className="btn"
              onClick={handleExportPDF} 
              disabled={getItemsToExport().length === 0}
              style={{ 
                width: '100%', 
                padding: '13px 20px', 
                fontSize: '13px', 
                fontWeight: '900', 
                letterSpacing: '0.04em',
                borderRadius: '10px',
                border: 'none',
                background: getItemsToExport().length > 0 
                  ? 'linear-gradient(135deg, #00e5ff 0%, #10b981 100%)' 
                  : 'rgba(255,255,255,0.06)',
                color: getItemsToExport().length > 0 ? '#07080f' : 'var(--text-muted)',
                boxShadow: getItemsToExport().length > 0 
                  ? '0 0 25px rgba(0, 229, 255, 0.4), 0 4px 18px rgba(16, 185, 129, 0.35)' 
                  : 'none',
                cursor: getItemsToExport().length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <Download size={18} style={{ color: '#07080f' }} /> 
              {testMode 
                ? "TEST DOWNLOAD (FREE - 72 DPI)" 
                : (enableNesting ? "DOWNLOAD PRINT-READY ROLL (PDF)" : "DOWNLOAD INDIVIDUAL PANELS (ZIP)")}
            </button>
          )}

        </div>
      </div>

      {/* Main View Canvas / Roster Area */}
      {(!enableNesting || (enableNesting && nestingSheets.length > 0)) && (
        <div style={{ width: '100%' }}>
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {enableNesting ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                    🗺️ Visual Roll Sheet Preview
                  </h3>
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {nestingSheets.map((_, index) => (
                      <button 
                        key={index} 
                        className={`btn ${activeSheetIndex === index ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
                        onClick={() => setActiveSheetIndex(index)}
                      >
                        Sheet {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nesting-roll-canvas" style={{ minHeight: '420px', background: 'rgba(5,7,15,0.85)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                  <canvas ref={previewCanvasRef} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'rgba(15,23,42,0.6)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: '700', textTransform: 'uppercase' }}>Total Roll Width</p>
                    <p style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-cyan)', margin: 0 }}>{rollW}"</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: '700', textTransform: 'uppercase' }}>Roll Length Height</p>
                    <p style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent-amber)', margin: 0 }}>
                      {Math.round(nestingSheets[activeSheetIndex]?.height || 0)}"
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: '700', textTransform: 'uppercase' }}>Nesting Efficiency</p>
                    <p style={{ fontSize: '20px', fontWeight: '900', color: '#4ade80', margin: 0 }}>
                      {nestingSheets[activeSheetIndex]?.efficiency || 0}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>
                    📋 Individual Export Roster ({getItemsToExport().length} Panels)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Exporting as {exportFormat.toUpperCase()} at {dpi} DPI ({colorProfile.toUpperCase()})
                  </span>
                </div>

                {getItemsToExport().length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', maxHeight: '540px', overflowY: 'auto', padding: '14px', background: 'rgba(5,7,15,0.6)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {getItemsToExport().map((item, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '12px', textAlign: 'left', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: '800', letterSpacing: '0.05em' }}>
                          {item.panelType.replace('-', ' ')}
                        </span>
                        <p style={{ fontSize: '13px', fontWeight: '800', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ffffff' }}>
                          {item.playerName || '— (Blank)'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          <span style={{ fontWeight: '800', color: '#4ade80' }}>Size {item.size}</span>
                          <span>{item.w}" × {item.h}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '70px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)', width: '100%' }}>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px' }}>📋 Roster is currently empty</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Go to the <strong>Job Details & Excel Data</strong> tab to import CSV or enter sizes.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Glassmorphic Sublimation Checkout Modal */}
      {showPaymentModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel fade-in" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.15)'
          }}>
            <button 
              onClick={() => {
                setShowPaymentModal(false);
                setIsExporting(false);
                setExportProgressPct(0);
              }}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={20} style={{ color: 'var(--accent-cyan)' }} /> Sublimation Panel Checkout
            </h3>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.4' }}>
              Production rendering is billed at <strong>₹3.00/pc</strong> for Back panels with FiveNest label tag (or ₹5.00/pc standard). Front and sleeve panels are free.
            </p>

            {/* Pricing Breakdown Card */}
            <div style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Player Roster Count:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{records.reduce((acc, r) => acc + r.qty, 0)} players</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Charged Back Panels:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{getItemsToExport().filter(item => item.panelType === 'back').length} pcs (₹{includeWatermarkLogo ? '3.00' : '5.00'} each)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Charged A4 Prints:</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>{getItemsToExport().filter(item => item.panelType === 'a4-print').length} pcs (₹0.50 each)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Free Panels (Front/Sleeve):</span>
                <span style={{ fontWeight: '700', color: '#4ade80' }}>{getItemsToExport().filter(item => item.panelType !== 'back' && item.panelType !== 'a4-print').length} pcs (₹0.00)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ fontWeight: '800', color: '#ffffff' }}>Total Amount Due:</span>
                <span style={{ fontWeight: '900', color: 'var(--accent-cyan)', fontSize: '16px' }}>₹{paymentCost.toFixed(2)} INR</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="tab-btn-group" style={{ marginBottom: '18px' }}>
              <button 
                className={`tab-btn ${upiPaymentMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setUpiPaymentMethod('wallet')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', borderRadius: '6px' }}
              >
                <Coins size={14} /> Pay via Wallet
              </button>
              <button 
                className={`tab-btn ${upiPaymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setUpiPaymentMethod('upi')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', borderRadius: '6px' }}
              >
                <QrCode size={14} /> Scan UPI QR
              </button>
            </div>

            {/* Wallet Deduct Panel */}
            {upiPaymentMethod === 'wallet' && currentUser && (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Wallet Balance: <strong style={{ color: currentUser.balance >= paymentCost ? '#4ade80' : '#f43f5e', fontSize: '15px' }}>₹{currentUser.balance.toFixed(2)}</strong>
                </div>

                {currentUser.balance >= paymentCost ? (
                  <button 
                    className="btn btn-primary"
                    onClick={executePaymentWithWallet}
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}
                  >
                    <CheckCircle size={16} /> Deduct ₹{paymentCost.toFixed(2)} & Export High-Res
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ color: '#f43f5e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                      <AlertTriangle size={14} /> Insufficient balance (₹{currentUser.balance.toFixed(2)}). Add funds below.
                    </div>

                    {/* Custom topup input */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '13px' }}>₹</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          value={customTopupAmount}
                          onChange={(e) => setCustomTopupAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 10px 9px 26px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        onClick={handleCustomTopup}
                        disabled={topupLoading}
                        style={{
                          padding: '9px 14px',
                          background: topupLoading ? 'rgba(0,229,255,0.3)' : 'rgba(0,229,255,0.15)',
                          border: '1px solid rgba(0,229,255,0.4)',
                          borderRadius: '8px',
                          color: 'var(--accent-cyan)',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: topupLoading ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {topupLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                        Add to Wallet
                      </button>
                    </div>

                    {topupMessage && (
                      <div style={{
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: topupMessage.ok ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                        color: topupMessage.ok ? '#00e676' : '#ff5252',
                        border: `1px solid ${topupMessage.ok ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`
                      }}>
                        {topupMessage.text}
                      </div>
                    )}

                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowPaymentModal(false);
                        onOpenLogin();
                      }}
                      style={{ width: '100%', padding: '9px', fontSize: '11px', borderRadius: '8px' }}
                    >
                      Or Recharge via Razorpay
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UPI QR Scanner Panel */}
            {upiPaymentMethod === 'upi' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', position: 'relative' }}>
                {simulatedPaymentLoading ? (
                  <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Loader2 size={36} className="spin" style={{ color: 'var(--accent-cyan)' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Confirming UPI Payment...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      padding: '10px', 
                      background: '#ffffff', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
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
                        background: 'var(--accent-cyan)',
                        boxShadow: '0 0 10px var(--accent-cyan)',
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
                    
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      Scan QR code using GPay, PhonePe, Paytm, or BHIM to pay ₹{paymentCost.toFixed(2)} INR.
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
              style={{ width: '100%', marginTop: '14px', padding: '9px', borderRadius: '8px', fontSize: '12px' }}
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      )}

      {/* ── Animated Export Processing Modal ── */}
      <ExportProcessingModal
        isOpen={isExporting}
        progress={exportProgressPct}
        statusText={exportProgress}
        totalPanels={getItemsToExport().length}
        orderName={metadata.customerName ? `${metadata.customerName} — Order ${metadata.orderNum || '#'}` : undefined}
      />
    </div>
  );
};
