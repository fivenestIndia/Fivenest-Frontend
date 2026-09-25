import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ArtDesignConfig } from './designer';
import { Loader2 } from 'lucide-react';
import { defaultSizes } from './sizesDb';

export type CameraAngle = 'front' | 'back' | 'left' | 'right';

export interface ColorAnalysisResult {
  dominant: string;
  accent: string;
  neck: string;
  palette: string[];
}

export interface ThreeDPreviewHandle {
  setCameraAngle: (angle: CameraAngle) => void;
  resetCamera: () => void;
  captureFrame: (angle: CameraAngle) => Promise<string>;
  captureCurrentView: () => string | null;
  captureAll4Views: (progressCallback?: (step: number, total: number) => void) => Promise<{
    front: string;
    back: string;
    left: string;
    right: string;
  }>;
  analyzeColors: () => ColorAnalysisResult;
}

export interface ThreeDPreviewProps {
  designConfig: ArtDesignConfig;
  renderPanelToCanvas: (
    panelKey: 'front' | 'back' | 'sleeveLeft' | 'sleeveRight' | 'a4Print',
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    is3DPreview?: boolean
  ) => void;
  previewSleeveType?: 'half' | 'full';
  prefTrigger?: number;
  zoom?: number;
  bgColor?: string;
  bgImageUrl?: string | null;
  placketMode?: 'matchFront' | 'color' | 'image';
  onColorsAnalyzed?: (result: ColorAnalysisResult) => void;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toH = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

/**
 * Smart color analysis of front artwork canvas:
 * 1. Samples neck/collar opening area to get exact neck trim color.
 * 2. Samples canvas grid to extract dominant jersey color and top palette colors.
 */
export function analyzeCanvasColors(canvas: HTMLCanvasElement): ColorAnalysisResult {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return { dominant: '#171717', accent: '#E4572E', neck: '#171717', palette: ['#171717', '#E4572E', '#ffffff'] };
  }

  const w = canvas.width;
  const h = canvas.height;

  // 1. Sample Neck Opening (top center 16% width, top 4% to 14% height)
  const neckX = Math.round(w * 0.42);
  const neckY = Math.round(h * 0.04);
  const neckW = Math.round(w * 0.16);
  const neckH = Math.round(h * 0.10);

  let neckColor = '#171717';
  try {
    const neckData = ctx.getImageData(neckX, neckY, neckW, neckH).data;
    const neckBucket: Record<string, number> = {};
    for (let i = 0; i < neckData.length; i += 16) {
      const a = neckData[i + 3];
      if (a < 128) continue;
      const r = neckData[i];
      const g = neckData[i + 1];
      const b = neckData[i + 2];
      const qr = Math.floor(r / 32) * 32;
      const qg = Math.floor(g / 32) * 32;
      const qb = Math.floor(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      neckBucket[key] = (neckBucket[key] || 0) + 1;
    }
    const sortedNeck = Object.entries(neckBucket).sort((a, b) => b[1] - a[1]);
    if (sortedNeck.length > 0) {
      const [r, g, b] = sortedNeck[0][0].split(',').map(Number);
      neckColor = rgbToHex(r, g, b);
    }
  } catch (e) {
    console.warn('Neck color sampling error:', e);
  }

  // 2. Sample Overall Canvas for Dominant, Accent, and Palette
  const step = Math.max(8, Math.floor(Math.min(w, h) / 60));
  const colorBuckets: Record<string, { count: number; r: number; g: number; b: number }> = {};

  try {
    const imgData = ctx.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const a = imgData[idx + 3];
        if (a < 128) continue;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];

        const qr = Math.floor(r / 24) * 24;
        const qg = Math.floor(g / 24) * 24;
        const qb = Math.floor(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        if (!colorBuckets[key]) {
          colorBuckets[key] = { count: 0, r, g, b };
        }
        colorBuckets[key].count++;
      }
    }
  } catch (e) {
    console.warn('Canvas color sampling error:', e);
  }

  const sortedBuckets = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

  // Filter distinct colors (min Euclidean RGB distance 45)
  const distinctHex: string[] = [];
  const distinctRGB: Array<{ r: number; g: number; b: number }> = [];

  for (const item of sortedBuckets) {
    const isDistinct = distinctRGB.every(existing => {
      const dist = Math.sqrt(
        Math.pow(item.r - existing.r, 2) +
        Math.pow(item.g - existing.g, 2) +
        Math.pow(item.b - existing.b, 2)
      );
      return dist > 45;
    });

    if (isDistinct) {
      distinctRGB.push({ r: item.r, g: item.g, b: item.b });
      distinctHex.push(rgbToHex(item.r, item.g, item.b));
      if (distinctHex.length >= 6) break;
    }
  }

  const dominant = distinctHex[0] || neckColor || '#171717';
  let accent = distinctHex[1] || distinctHex[0] || '#E4572E';

  return {
    dominant,
    accent,
    neck: neckColor,
    palette: distinctHex.length > 0 ? distinctHex : [dominant, accent]
  };
}

/**
 * Generates an ultra-high-resolution 2400x1600 Client Presentation Board in JPG format.
 */
export async function generatePresentationBoard(
  views: { front: string; back: string; left: string; right: string },
  options: {
    orderNumber?: string;
    designName?: string;
    bgColor?: string;
    sleeveType?: string;
    dateStr?: string;
  }
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  const isLight = options.bgColor ? isLightColor(options.bgColor) : false;
  const boardBg = isLight ? '#F8FAFC' : '#0B0F19';
  const cardBg = isLight ? '#FFFFFF' : '#141A28';
  const cardBorder = isLight ? '#E2E8F0' : '#232D42';
  const textPrimary = isLight ? '#0F172A' : '#F8FAFC';
  const textSecondary = isLight ? '#64748B' : '#94A3B8';
  const accentColor = '#E4572E';

  // Board background
  ctx.fillStyle = boardBg;
  ctx.fillRect(0, 0, 2400, 1600);

  // Top accent bar
  const headerGrad = ctx.createLinearGradient(0, 0, 2400, 0);
  headerGrad.addColorStop(0, accentColor);
  headerGrad.addColorStop(0.5, '#F97316');
  headerGrad.addColorStop(1, '#FB923C');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, 2400, 8);

  // Header Brand
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 36px "Inter", -apple-system, sans-serif';
  ctx.fillText('FIVENEST', 80, 75);

  ctx.fillStyle = textPrimary;
  ctx.font = '700 24px "Inter", -apple-system, sans-serif';
  ctx.fillText('DESIGN STUDIO', 255, 75);

  ctx.fillStyle = textSecondary;
  ctx.font = '600 16px "Inter", -apple-system, sans-serif';
  ctx.fillText('PROFESSIONAL 3D APPAREL MOCKUP PROOF', 80, 108);

  // Header Order Info (right aligned)
  ctx.textAlign = 'right';
  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 22px "Inter", -apple-system, sans-serif';
  ctx.fillText(`ORDER: ${options.orderNumber || 'MOCKUP-001'}`, 2320, 75);

  ctx.fillStyle = textSecondary;
  ctx.font = '500 16px "Inter", -apple-system, sans-serif';
  const dateStr = options.dateStr || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const sleeveLabel = (options.sleeveType === 'full' ? 'Full Sleeve' : 'Half Sleeve') + ' Sublimation Polo';
  ctx.fillText(`${sleeveLabel}  •  ${dateStr}`, 2320, 105);
  ctx.textAlign = 'left';

  // Divider
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 135);
  ctx.lineTo(2320, 135);
  ctx.stroke();

  // 4 View Cards Layout (2 columns x 2 rows)
  const cardW = 1060;
  const cardH = 650;
  const col1X = 80;
  const col2X = 1260;
  const row1Y = 165;
  const row2Y = 855;

  const cardDefs = [
    { key: 'front', label: '01. FRONT VIEW (0°)', x: col1X, y: row1Y, src: views.front },
    { key: 'back', label: '02. BACK VIEW (180°)', x: col2X, y: row1Y, src: views.back },
    { key: 'left', label: '03. LEFT 3/4 PROFILE (-45°)', x: col1X, y: row2Y, src: views.left },
    { key: 'right', label: '04. RIGHT 3/4 PROFILE (+45°)', x: col2X, y: row2Y, src: views.right },
  ];

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const loadedImages = await Promise.all(cardDefs.map(c => loadImage(c.src)));

  cardDefs.forEach((card, index) => {
    const img = loadedImages[index];

    // Card frame
    drawRoundedRect(ctx, card.x, card.y, cardW, cardH, 16);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // View Image inside card
    const imgPadding = 18;
    const labelH = 50;
    const imgX = card.x + imgPadding;
    const imgY = card.y + labelH;
    const maxImgW = cardW - imgPadding * 2;
    const maxImgH = cardH - labelH - imgPadding;

    const imgAspect = img.width / img.height;
    let drawW = maxImgW;
    let drawH = drawW / imgAspect;
    if (drawH > maxImgH) {
      drawH = maxImgH;
      drawW = drawH * imgAspect;
    }
    const offX = imgX + (maxImgW - drawW) / 2;
    const offY = imgY + (maxImgH - drawH) / 2;

    ctx.save();
    drawRoundedRect(ctx, card.x + 8, card.y + labelH, cardW - 16, cardH - labelH - 8, 12);
    ctx.clip();
    ctx.drawImage(img, offX, offY, drawW, drawH);
    ctx.restore();

    // Badge / Label at top-left of card
    ctx.fillStyle = isLight ? '#EEF2F6' : '#1E2638';
    drawRoundedRect(ctx, card.x + 20, card.y + 16, 260, 32, 8);
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(card.x + 36, card.y + 32, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
    ctx.fillText(card.label, card.x + 48, card.y + 37);
  });

  // Footer
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 1545);
  ctx.lineTo(2320, 1545);
  ctx.stroke();

  ctx.fillStyle = textSecondary;
  ctx.font = '500 14px "Inter", -apple-system, sans-serif';
  ctx.fillText('Client Proofing Specification • Sublimation Printing • Colors rendered on screen may slightly vary from final fabric', 80, 1575);

  ctx.textAlign = 'right';
  ctx.fillStyle = textSecondary;
  ctx.fillText('Powered by Fivenest Design Studio', 2320, 1575);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/jpeg', 0.95);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function isLightColor(colorStr: string): boolean {
  if (!colorStr) return false;
  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
  }
  return false;
}

export const ThreeDPreview = forwardRef<ThreeDPreviewHandle, ThreeDPreviewProps>(({
  designConfig,
  renderPanelToCanvas,
  previewSleeveType = 'half',
  prefTrigger,
  zoom = 1,
  bgColor = '#0a0a0f',
  bgImageUrl = null,
  placketMode = 'matchFront',
  onColorsAnalyzed
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poloModelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Canvas layers for panel composition
  const frontCanvas = useRef(document.createElement('canvas'));
  const backCanvas = useRef(document.createElement('canvas'));
  const leftSleeveCanvas = useRef(document.createElement('canvas'));
  const rightSleeveCanvas = useRef(document.createElement('canvas'));

  // Preloaded/cached images for Collar, Placket, and Sleeve stripe trims
  const [loadedTrimImages, setLoadedTrimImages] = useState<{
    collar?: HTMLImageElement;
    placket?: HTMLImageElement;
    sleeveStripe?: HTMLImageElement;
    collarArtwork?: HTMLImageElement;
  }>({});

  // Dynamic image preloader hook for trims and uploaded collar artwork
  useEffect(() => {
    const trim = designConfig.trim;
    const collarArtUrl = designConfig.collar?.uploadedFileUrl;

    const urls = {
      collar: trim?.collar.uploadedUrl,
      placket: trim?.placket.uploadedUrl,
      sleeveStripe: trim?.sleeveStripe.uploadedUrl,
      collarArtwork: collarArtUrl
    };

    let changed = false;
    const newImages = { ...loadedTrimImages };

    const loadPromises = Object.entries(urls).map(([key, url]) => {
      const typedKey = key as 'collar' | 'placket' | 'sleeveStripe' | 'collarArtwork';
      if (!url) {
        if (newImages[typedKey]) {
          delete newImages[typedKey];
          changed = true;
        }
        return Promise.resolve();
      }
      if (newImages[typedKey]?.src === url) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          newImages[typedKey] = img;
          changed = true;
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load trim image for ${key}: ${url}`);
          resolve();
        };
        img.src = url;
      });
    });

    Promise.all(loadPromises).then(() => {
      if (changed) {
        setLoadedTrimImages(newImages);
      }
    });
  }, [designConfig.trim, designConfig.collar?.uploadedFileUrl]);

  // Re-draw panels and compose onto single 4267x4267 texture sheet
  const composeTexture = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    const mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) return;

    // Clear background
    mainCtx.fillStyle = '#ffffff';
    mainCtx.fillRect(0, 0, 4267, 4267);

    // 1. Draw Front panel (Component 14: X=[64, 1450], Y=[1962, 3861], Size: 1386x1899)
    const sizeConf = defaultSizes["40"];
    const frontScale = 1386 / sizeConf.front.w;
    const backScale = 1515 / sizeConf.back.w;
    const isFullSleeve = previewSleeveType === 'full';
    const sleeveW = isFullSleeve ? sizeConf.full.w : sizeConf.half.w;
    const sleeveScale = 1344 / sleeveW;

    const frontCtx = frontCanvas.current.getContext('2d');
    if (frontCtx) {
      frontCanvas.current.width = 1386;
      frontCanvas.current.height = 1899;
      renderPanelToCanvas('front', frontCtx, 1386, 1899, frontScale, true);
      mainCtx.drawImage(frontCanvas.current, 64, 1962);
    }

    // 2. Draw Back panel (Component 15: X=[2282, 3797], Y=[1962, 4117], Size: 1515x2155)
    const backCtx = backCanvas.current.getContext('2d');
    if (backCtx) {
      backCanvas.current.width = 1515;
      backCanvas.current.height = 2155;
      renderPanelToCanvas('back', backCtx, 1515, 2155, backScale, true);
      mainCtx.drawImage(backCanvas.current, 2282, 1962);
    }

    // 3. Draw Left Sleeve (Component 8: X=[341, 1685], Y=[576, 1280], Size: 1344x704)
    const leftSleeveCtx = leftSleeveCanvas.current.getContext('2d');
    if (leftSleeveCtx) {
      leftSleeveCanvas.current.width = 1344;
      leftSleeveCanvas.current.height = 704;
      renderPanelToCanvas('sleeveLeft', leftSleeveCtx, 1344, 704, sleeveScale, true);
      mainCtx.drawImage(leftSleeveCanvas.current, 341, 576);
    }

    // 4. Draw Right Sleeve (Component 9: X=[1728, 3072], Y=[576, 1280], Size: 1344x704)
    const rightSleeveCtx = rightSleeveCanvas.current.getContext('2d');
    if (rightSleeveCtx) {
      rightSleeveCanvas.current.width = 1344;
      rightSleeveCanvas.current.height = 704;
      renderPanelToCanvas('sleeveRight', rightSleeveCtx, 1344, 704, sleeveScale, true);
      mainCtx.drawImage(rightSleeveCanvas.current, 1728, 576);
    }

    // Draw collar, button placket, cuffs and other parts with solid matches or custom images
    const c1 = designConfig.front.generatedColor1;
    const trim = designConfig.trim || {
      collar: { color: c1, uploadedUrl: null },
      placket: { color: c1, uploadedUrl: null },
      sleeveStripe: { color: c1, uploadedUrl: null }
    };

    const activeCollarImg = loadedTrimImages.collar || loadedTrimImages.collarArtwork;

    // Component 1: Collar (X=[3157, 4117], Y=[42, 1002])
    if (activeCollarImg) {
      mainCtx.drawImage(activeCollarImg, 3157, 42, 960, 960);
    } else {
      mainCtx.fillStyle = trim.collar.color || c1;
      mainCtx.fillRect(3157, 42, 960, 960);
    }

    // Component 10: Collar rib (X=[1813, 2901], Y=[1408, 1514])
    if (activeCollarImg) {
      mainCtx.drawImage(activeCollarImg, 1813, 1408, 1088, 106);
    } else {
      mainCtx.fillStyle = trim.collar.color || c1;
      mainCtx.fillRect(1813, 1408, 1088, 106);
    }

    // Component 11: Sleeve cuff (X=[490, 1557], Y=[1429, 1536])
    if (trim.sleeveStripe?.enabled === true) {
      if (loadedTrimImages.sleeveStripe) {
        mainCtx.drawImage(loadedTrimImages.sleeveStripe, 490, 1429, 1067, 107);
      } else if (trim.sleeveStripe.fillType === 'gradient' || (trim.sleeveStripe.gradientStops && trim.sleeveStripe.gradientStops.length >= 2)) {
        const grad = mainCtx.createLinearGradient(490, 1429, 1557, 1429);
        const stops = [...trim.sleeveStripe.gradientStops].sort((a, b) => a.offset - b.offset);
        stops.forEach(s => grad.addColorStop(Math.max(0, Math.min(1, s.offset / 100)), s.color));
        mainCtx.fillStyle = grad;
        mainCtx.fillRect(490, 1429, 1067, 107);
      } else {
        mainCtx.fillStyle = trim.sleeveStripe.color || c1;
        mainCtx.fillRect(490, 1429, 1067, 107);
      }
    } else {
      mainCtx.fillStyle = c1;
      mainCtx.fillRect(490, 1429, 1067, 107);
    }

    // Component 12: Placket (X=[2474, 3050], Y=[1706, 1834], Size: 576x128)
    if (placketMode === 'matchFront') {
      // Seamlessly integrate with front uploaded design
      const fW = frontCanvas.current.width;
      const fH = frontCanvas.current.height;
      const sampleW = Math.round(fW * 0.16); // center chest strip
      const sampleH = Math.round(fH * 0.28); // down chest height
      const sampleX = Math.round((fW - sampleW) / 2);
      const sampleY = Math.round(fH * 0.04); // neck drop

      const pCanvas = document.createElement('canvas');
      pCanvas.width = 576;
      pCanvas.height = 128;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        // Rotate 90 degrees clockwise so vertical chest drop matches horizontal UV strip
        pCtx.save();
        pCtx.translate(288, 64);
        pCtx.rotate(Math.PI / 2);
        pCtx.drawImage(
          frontCanvas.current,
          sampleX, sampleY, sampleW, sampleH,
          -64, -288, 128, 576
        );
        pCtx.restore();
        mainCtx.drawImage(pCanvas, 2474, 1706, 576, 128);
      }
    } else if (placketMode === 'image' && loadedTrimImages.placket) {
      mainCtx.drawImage(loadedTrimImages.placket, 2474, 1706, 576, 128);
    } else {
      mainCtx.fillStyle = trim.placket.color || c1;
      mainCtx.fillRect(2474, 1706, 576, 128);
    }

    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  };

  // Re-run composition and dynamically update solid meshes when trim configuration changes
  useEffect(() => {
    composeTexture();

    // Dynamically update solid color materials on 3D meshes (buttons, sleeve ends) in real-time
    if (poloModelRef.current) {
      const c1 = designConfig.front.generatedColor1;
      const trim = designConfig.trim || {
        collar: { color: c1, uploadedUrl: null },
        placket: { color: c1, uploadedUrl: null },
        sleeveStripe: { color: c1, uploadedUrl: null }
      };

      poloModelRef.current.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
          const matName = (mesh.material as any).name || '';
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat) {
            if (
              matName.toLowerCase().includes('button') || 
              matName.toLowerCase().includes('material 1')
            ) {
              if (placketMode === 'matchFront') {
                mat.color.set(trim.collar.color || '#ffffff');
              } else {
                mat.color.set(trim.placket.color || '#ffffff');
              }
            } else if (
              matName.toLowerCase().includes('sleeve end') || 
              matName.toLowerCase().includes('material 2')
            ) {
              mat.color.set(trim.sleeveStripe?.enabled ? (trim.sleeveStripe.color || '#ffffff') : (c1 || '#ffffff'));
            }
          }
        }
      });
    }
  }, [designConfig, previewSleeveType, prefTrigger, loadedTrimImages, placketMode]);

  // Handle external zoom controls dynamically
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.zoom = zoom;
      cameraRef.current.updateProjectionMatrix();
    }
    if (zoom === 1 && cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0.2, 2.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [zoom]);

  // Update 3D Background when bgColor or bgImageUrl changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (bgImageUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        bgImageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          scene.background = tex;
        },
        undefined,
        (err) => {
          console.error('Failed to load custom 3D background image:', err);
          scene.background = new THREE.Color(bgColor || '#0a0a0f');
        }
      );
    } else {
      scene.background = new THREE.Color(bgColor || '#0a0a0f');
    }
  }, [bgColor, bgImageUrl]);

  // Expose imperative API for camera angles, captures, and color analysis
  useImperativeHandle(ref, () => ({
    setCameraAngle: (angle: CameraAngle) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      if (angle === 'front') {
        camera.position.set(0, 0.2, 2.2);
      } else if (angle === 'back') {
        camera.position.set(0, 0.2, -2.2);
      } else if (angle === 'left') {
        camera.position.set(-1.55, 0.2, 1.55);
      } else if (angle === 'right') {
        camera.position.set(1.55, 0.2, 1.55);
      }
      controls.target.set(0, 0, 0);
      controls.update();

      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
    },
    resetCamera: () => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;
      camera.position.set(0, 0.2, 2.2);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera);
      }
    },
    captureFrame: async (angle: CameraAngle) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const canvas = canvasRef.current;
      if (!camera || !controls || !renderer || !scene || !canvas) {
        throw new Error('3D Viewport not initialized');
      }

      if (angle === 'front') {
        camera.position.set(0, 0.2, 2.2);
      } else if (angle === 'back') {
        camera.position.set(0, 0.2, -2.2);
      } else if (angle === 'left') {
        camera.position.set(-1.55, 0.2, 1.55);
      } else if (angle === 'right') {
        camera.position.set(1.55, 0.2, 1.55);
      }
      controls.target.set(0, 0, 0);
      controls.update();

      renderer.render(scene, camera);
      await new Promise(r => requestAnimationFrame(r));
      renderer.render(scene, camera);

      return canvas.toDataURL('image/jpeg', 0.95);
    },
    captureCurrentView: () => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!canvas || !renderer || !scene || !camera) return null;
      renderer.render(scene, camera);
      return canvas.toDataURL('image/jpeg', 0.95);
    },
    captureAll4Views: async (progressCallback) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const canvas = canvasRef.current;
      if (!camera || !controls || !renderer || !scene || !canvas) {
        throw new Error('3D Viewport not initialized');
      }

      const savedPos = camera.position.clone();
      const savedTarget = controls.target.clone();

      try {
        progressCallback?.(1, 4);
        camera.position.set(0, 0.2, 2.2);
        controls.target.set(0, 0, 0);
        controls.update();
        renderer.render(scene, camera);
        await new Promise(r => setTimeout(r, 60));
        renderer.render(scene, camera);
        const front = canvas.toDataURL('image/jpeg', 0.95);

        progressCallback?.(2, 4);
        camera.position.set(0, 0.2, -2.2);
        controls.target.set(0, 0, 0);
        controls.update();
        renderer.render(scene, camera);
        await new Promise(r => setTimeout(r, 60));
        renderer.render(scene, camera);
        const back = canvas.toDataURL('image/jpeg', 0.95);

        progressCallback?.(3, 4);
        camera.position.set(-1.55, 0.2, 1.55);
        controls.target.set(0, 0, 0);
        controls.update();
        renderer.render(scene, camera);
        await new Promise(r => setTimeout(r, 60));
        renderer.render(scene, camera);
        const left = canvas.toDataURL('image/jpeg', 0.95);

        progressCallback?.(4, 4);
        camera.position.set(1.55, 0.2, 1.55);
        controls.target.set(0, 0, 0);
        controls.update();
        renderer.render(scene, camera);
        await new Promise(r => setTimeout(r, 60));
        renderer.render(scene, camera);
        const right = canvas.toDataURL('image/jpeg', 0.95);

        return { front, back, left, right };
      } finally {
        camera.position.copy(savedPos);
        controls.target.copy(savedTarget);
        controls.update();
        renderer.render(scene, camera);
      }
    },
    analyzeColors: () => {
      const analysis = analyzeCanvasColors(frontCanvas.current);
      if (onColorsAnalyzed) {
        onColorsAnalyzed(analysis);
      }
      return analysis;
    }
  }));

  // Initialize ThreeJS scene, camera, lights, and OrbitControls
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor || '#0a0a0f');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 2.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.75);
    scene.add(ambientLight);

    // Front Main Directional Light
    const dirLight1 = new THREE.DirectionalLight('#ffffff', 0.95);
    dirLight1.position.set(2, 4, 3);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.bias = -0.0001;
    scene.add(dirLight1);

    // Back Directional Light for fills
    const dirLight2 = new THREE.DirectionalLight('#ffffff', 0.45);
    dirLight2.position.set(-2, 2, -3);
    scene.add(dirLight2);

    // Point Light from bottom
    const pointLight = new THREE.PointLight('#ffffff', 0.2, 10);
    pointLight.position.set(0, -2, 2);
    scene.add(pointLight);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.0;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Spacebar Panning Control Handlers
    let isSpaceDown = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!isSpaceDown) {
          isSpaceDown = true;
          controls.enablePan = true;
          controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
          if (canvasRef.current) {
            canvasRef.current.style.cursor = 'grab';
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        isSpaceDown = false;
        controls.enablePan = false;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'auto';
        }
      }
    };

    const handleMouseDown = () => {
      if (isSpaceDown && canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isSpaceDown ? 'grab' : 'auto';
      }
    };

    const handleBlur = () => {
      isSpaceDown = false;
      controls.enablePan = false;
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'auto';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      canvasEl.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Create Main Composition Canvas
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 4267;
    mainCanvas.height = 4267;
    mainCanvasRef.current = mainCanvas;

    const texture = new THREE.CanvasTexture(mainCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;
    textureRef.current = texture;

    // Load Fabric Normal Map
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load('/textures/TShirt_NRM.jpg', (normTex) => {
      normTex.wrapS = THREE.RepeatWrapping;
      normTex.wrapT = THREE.RepeatWrapping;
      normTex.repeat.set(12, 12);
    });

    // Load T-Shirt GLTF model
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/models/tshirt.glb',
      (gltf) => {
        const model = gltf.scene;
        poloModelRef.current = model;

        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const targetHeight = 0.95;
        const scaleFactor = targetHeight / (size.y || 1);
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        model.position.copy(center).multiplyScalar(-scaleFactor);
        model.position.y -= 0.45;

        // Apply materials to meshes
        model.traverse((child) => {
          if ((child as any).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const matName = (mesh.material as any).name || '';

            const mat = new THREE.MeshStandardMaterial({
              roughness: 0.82,
              metalness: 0.12,
              normalMap: normalMap,
              normalScale: new THREE.Vector2(0.12, 0.12)
            });

            const c1 = designConfig.front.generatedColor1;
            const trim = designConfig.trim || {
              collar: { color: c1, uploadedUrl: null },
              placket: { color: c1, uploadedUrl: null },
              sleeveStripe: { color: c1, uploadedUrl: null }
            };

            if (
              matName.toLowerCase().includes('button') || 
              matName.toLowerCase().includes('material 1')
            ) {
              if (placketMode === 'matchFront') {
                mat.color.set(trim.collar.color || '#ffffff');
              } else {
                mat.color.set(trim.placket.color || '#ffffff');
              }
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('sleeve end') || 
              matName.toLowerCase().includes('material 2')
            ) {
              mat.color.set(trim.sleeveStripe?.enabled ? (trim.sleeveStripe.color || '#ffffff') : (c1 || '#ffffff'));
              mesh.material = mat;
            } else if (
              matName.toLowerCase().includes('main design') || 
              matName.toLowerCase().includes('material 0') || 
              mesh.name.toLowerCase().includes('cloth')
            ) {
              mat.map = texture;
              mesh.material = mat;
            } else {
              mat.color.set('#ffffff');
              mesh.material = mat;
            }
          }
        });

        scene.add(model);
        composeTexture();
        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setProgress(percent);
        }
      },
      (error) => {
        console.error('Failed loading GLTF TShirt:', error);
        setLoading(false);
      }
    );

    // Animation frames loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer for dynamic dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      if (canvasEl) {
        canvasEl.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      }
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      renderer.dispose();
      texture.dispose();
      normalMap.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative" 
      style={{ minHeight: '520px', backgroundColor: bgColor || '#0a0a0f', borderRadius: '8px' }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
        style={{ touchAction: 'none' }}
      />
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]/95 text-white z-50 rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
          <p className="text-sm font-semibold tracking-wider">GENERATING 3D MODEL PREVIEW... {progress}%</p>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded select-none pointer-events-none">
        Left-click & drag to rotate • Scroll to zoom • Space+drag to pan
      </div>
    </div>
  );
});

ThreeDPreview.displayName = 'ThreeDPreview';
