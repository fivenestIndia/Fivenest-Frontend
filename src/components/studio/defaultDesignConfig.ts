export interface StrokeConfig {
  id?: string;
  color: string;
  width: number; // in pixels/pt
  type?: 'solid' | 'gradient';
  gradientColor1?: string;
  gradientColor2?: string;
  gradientStops?: string[];
  gradientDirection?: 'vertical' | 'horizontal' | 'radial' | 'diagonal';
}

export interface TextConfig {
  enabled: boolean;
  yPos: number; // percentage from top (0-100)
  xPos?: number; // percentage from left (0-100) - default 50 for center
  fontSize: number; // size in inches relative (often 2-3 inches for names, 8-10 inches for numbers)
  color: string;
  strokeColor: string;
  strokeWidth: number; // in pixels
  strokePosition?: 'outside' | 'inside' | 'center'; // 'outside' (default), 'inside', or 'center'
  strokeType?: 'solid' | 'gradient';
  strokeGradientColor1?: string;
  strokeGradientColor2?: string;
  strokeGradientStops?: string[];
  strokeGradientDirection?: 'vertical' | 'horizontal' | 'radial' | 'diagonal';
  extraStrokes?: StrokeConfig[]; // Additional outer stroke outlines
  fontFamily: string;
  fontWeight?: 'normal' | 'bold'; // 'normal' (default, original font thickness) or 'bold'
  maxW: number; // maximum width in inches
  scaleX?: number; // horizontal width scale multiplier (e.g. 1.10 for stretched name, 0.90 for condensed number)
  caseType?: 'uppercase' | 'normal' | 'original' | 'lowercase';
  effect?: 'none' | 'arch' | 'shadow' | 'outline' | 'gradient';
  text?: string;
  letterSpacing?: number;
  curveAmount?: number; // 5 to 100 percentage (default 35) for arched text
  align?: 'left' | 'center' | 'right';
  fillType?: 'solid' | 'gradient' | 'texture';
  gradientColor1?: string;
  gradientColor2?: string;
  gradientStops?: string[];
  gradientDirection?: 'vertical' | 'horizontal' | 'radial' | 'diagonal';
  textureUrl?: string | null;
  textureOffsetX?: number;
  textureOffsetY?: number;
  textureScale?: number;
  skewX?: number;
  envelope?: 'none' | 'bridge' | 'arch' | 'valley';
  envelopeAmount?: number;
  strokes?: StrokeConfig[];
  rotation?: number;
  customText?: string;
}

export interface LogoConfig {
  enabled: boolean;
  uploadedUrl: string | null;
  width: number;  // in inches
  height: number; // in inches
  xPos: number;   // horizontal distance in inches
  yPos: number;   // vertical distance in inches
  lockAspectRatio?: boolean;
  text?: string;
}

export interface GradientStopItem {
  id?: string;
  color: string;
  offset: number; // 0 to 100 (%)
}

export interface PanelConfig {
  backgroundType: 'generate' | 'upload';
  generatedStyle: 'neon-gradient' | 'classic-stripes' | 'camo-glow' | 'blank' | 'solid' | 'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial';
  generatedColor1: string;
  generatedColor2: string;
  gradientStops?: GradientStopItem[];
  uploadedFileUrl: string | null;
  uploadedFileHalfUrl?: string | null;
  uploadedFileFullUrl?: string | null;
  uploadedFileNoLogoUrl?: string | null;
  nameConfig: TextConfig;
  numberConfig: TextConfig;
  sizeTagConfig?: TextConfig;
  guidelines?: {
    vertical: number[];
    horizontal: number[];
  };
  leftChestLogo?: LogoConfig;
  rightChestLogo?: LogoConfig;
  torsoLogo?: LogoConfig;
  bottomLeftLogo?: LogoConfig;
  bgWidth?: number;
  bgHeight?: number;
  bgX?: number;
  bgY?: number;
  bgLockAspectRatio?: boolean;
  customWidth?: number;
  customHeight?: number;
}

export interface TrimPartConfig {
  enabled?: boolean;
  color: string;
  uploadedUrl: string | null;
  height?: number; // Height in inches (2.0 for sleeve stripe)
  fillType?: 'solid' | 'gradient';
  gradientStyle?: 'gradient-linear-lr' | 'gradient-linear-tb' | 'gradient-linear-diag' | 'gradient-radial';
  gradientStops?: GradientStopItem[];
}

export interface TrimConfig {
  collar: TrimPartConfig;
  placket: TrimPartConfig;
  sleeveStripe: TrimPartConfig;
  buttonColor?: string;
}

export interface CollarStripe {
  id: string;
  color: string;
  height: number; // Height in inches (e.g. 0.15)
  yOffset: number; // Vertical position in inches from top (0 to 4.5)
  fillType?: 'solid' | 'gradient';
  gradientStyle?: 'gradient-linear-lr' | 'gradient-linear-tb';
  gradientStops?: GradientStopItem[];
}

export interface CollarConfig extends PanelConfig {
  curved?: boolean;
  curveAmount?: number; // Arch height in inches (default 0.8)
  stripes?: CollarStripe[];
}

export interface ArtDesignConfig {
  front: PanelConfig;
  back: PanelConfig;
  sleeveLeft: PanelConfig;
  sleeveRight: PanelConfig;
  collar?: CollarConfig;
  a4Print: PanelConfig;
  trim?: TrimConfig;
}

/**
 * Samples border pixels of an image to automatically extract its dominant edge/background color.
 */
export const sampleImageEdgeColor = (img: HTMLImageElement): string => {
  try {
    const canvas = document.createElement('canvas');
    const w = Math.min(120, img.naturalWidth || img.width || 120);
    const h = Math.min(120, img.naturalHeight || img.height || 120);
    if (w <= 0 || h <= 0) return '#0A192F';
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#0A192F';
    ctx.drawImage(img, 0, 0, w, h);

    const edgePixels: [number, number, number][] = [];
    const step = Math.max(1, Math.floor(w / 12));
    const stepY = Math.max(1, Math.floor(h / 12));

    for (let x = 0; x < w; x += step) {
      const pTop = ctx.getImageData(x, 0, 1, 1).data;
      if (pTop[3] > 40) edgePixels.push([pTop[0], pTop[1], pTop[2]]);
      const pBottom = ctx.getImageData(x, h - 1, 1, 1).data;
      if (pBottom[3] > 40) edgePixels.push([pBottom[0], pBottom[1], pBottom[2]]);
    }
    for (let y = 0; y < h; y += stepY) {
      const pLeft = ctx.getImageData(0, y, 1, 1).data;
      if (pLeft[3] > 40) edgePixels.push([pLeft[0], pLeft[1], pLeft[2]]);
      const pRight = ctx.getImageData(w - 1, y, 1, 1).data;
      if (pRight[3] > 40) edgePixels.push([pRight[0], pRight[1], pRight[2]]);
    }

    if (edgePixels.length > 0) {
      let rTotal = 0, gTotal = 0, bTotal = 0;
      edgePixels.forEach(([r, g, b]) => {
        rTotal += r;
        gTotal += g;
        bTotal += b;
      });
      const avgR = Math.round(rTotal / edgePixels.length).toString(16).padStart(2, '0');
      const avgG = Math.round(gTotal / edgePixels.length).toString(16).padStart(2, '0');
      const avgB = Math.round(bTotal / edgePixels.length).toString(16).padStart(2, '0');
      return `#${avgR}${avgG}${avgB}`;
    }
  } catch (e) {
    console.warn('[Collar] Failed to sample edge color:', e);
  }
  return '#0A192F';
};

export const defaultDesignConfig: ArtDesignConfig = {
  front: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, xPos: 50, yPos: 20, fontSize: 1.5, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 13, scaleX: 1.10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.05 },
    numberConfig: { enabled: false, xPos: 50, yPos: 44, fontSize: 3.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4.5, scaleX: 0.90, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.04 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [2.0, 8.5, 11.0, 13.5, 20.0], horizontal: [7.0, 10.0, 12.0, 27.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 15.0, yPos: 8.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 7.0, yPos: 8.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.5, height: 2.6, xPos: 11.0, yPos: 13.3, text: '', lockAspectRatio: true },
    bottomLeftLogo: { enabled: false, uploadedUrl: null, width: 2.0, height: 2.0, xPos: 3.5, yPos: 26.0, lockAspectRatio: true }
  },
  back: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    nameConfig: { enabled: true, yPos: 24, fontSize: 2.5, color: '#000000', strokeColor: '#ffffff', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 16, scaleX: 1.10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.10 },
    numberConfig: { enabled: true, yPos: 47, fontSize: 9.0, color: '#000000', strokeColor: '#ffffff', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, scaleX: 0.90, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.06 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0.06 },
    guidelines: { vertical: [2.0, 11.0, 20.0], horizontal: [2.5, 6.0, 8.0, 9.5, 16.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  sleeveLeft: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 40, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 6.5, scaleX: 1.10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 70, fontSize: 3.0, color: '#ffffff', strokeColor: '#000000', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4.5, scaleX: 0.90, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.04 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.5], horizontal: [8.0] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  sleeveRight: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    nameConfig: { enabled: false, yPos: 40, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 6.5, scaleX: 1.10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 70, fontSize: 3.0, color: '#ffffff', strokeColor: '#000000', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4.5, scaleX: 0.90, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.04 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 3, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.5], horizontal: [8.0] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  a4Print: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    bgWidth: 10,
    bgHeight: 11,
    bgX: 0,
    bgY: 0,
    bgLockAspectRatio: true,
    nameConfig: { enabled: false, yPos: 24, fontSize: 2.5, color: '#000000', strokeColor: '#ffffff', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 11, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.08 },
    numberConfig: { enabled: true, yPos: 47, fontSize: 9.0, color: '#000000', strokeColor: '#ffffff', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 8.5, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0.2 },
    sizeTagConfig: { enabled: true, yPos: 4, fontSize: 26, color: '#ff1744', strokeColor: '#000000', strokeWidth: 0, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [5.0], horizontal: [5.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 13.5, yPos: 7.5, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 3.5, height: 3.5, xPos: 8.5, yPos: 7.5, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 8.0, height: 5.0, xPos: 11.0, yPos: 16.0, text: '', lockAspectRatio: true }
  },
  collar: {
    backgroundType: 'upload',
    generatedStyle: 'blank',
    generatedColor1: '#ffffff',
    generatedColor2: '#ffffff',
    uploadedFileUrl: null,
    curved: false,
    curveAmount: 0.8,
    stripes: [],
    nameConfig: { enabled: false, yPos: 50, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1.8, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 10, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    numberConfig: { enabled: false, yPos: 50, fontSize: 1.2, color: '#ffffff', strokeColor: '#000000', strokeWidth: 0.7, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 4, caseType: 'uppercase', effect: 'none', align: 'center', letterSpacing: 0 },
    sizeTagConfig: { enabled: false, yPos: 4, fontSize: 18, color: '#ff1744', strokeColor: '#ffffff', strokeWidth: 2, fontFamily: 'OldSport02AthleticNcv-E0gj', maxW: 6, caseType: 'uppercase', effect: 'none', align: 'left', letterSpacing: 0 },
    guidelines: { vertical: [9.0], horizontal: [0.5] },
    leftChestLogo: { enabled: false, uploadedUrl: null, width: 2, height: 2, xPos: 4.5, yPos: 2.25, lockAspectRatio: true },
    rightChestLogo: { enabled: false, uploadedUrl: null, width: 2, height: 2, xPos: 13.5, yPos: 2.25, lockAspectRatio: true },
    torsoLogo: { enabled: false, uploadedUrl: null, width: 4, height: 1.5, xPos: 9.0, yPos: 2.25, text: '', lockAspectRatio: true }
  },
  trim: {
    collar: { enabled: true, color: '#9b4dff', uploadedUrl: null },
    placket: { enabled: true, color: '#9b4dff', uploadedUrl: null },
    sleeveStripe: { enabled: false, color: '#171717', uploadedUrl: null, height: 2.0, fillType: 'solid' },
    buttonColor: '#ffffff'
  }
};
