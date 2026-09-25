// Helper functions for smart typo-tolerant ZIP panel file classification

export type ZipPanelTarget = 
  | 'front' 
  | 'back' 
  | 'collar' 
  | 'sleeve_left' 
  | 'sleeve_right' 
  | 'sleeve_both' 
  | 'sleeve_both_all' 
  | null;

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function classifyZipPanelFile(rawPath: string): ZipPanelTarget {
  const pathParts = rawPath.split('/');
  const baseFilename = pathParts[pathParts.length - 1];
  const nameWithoutExt = baseFilename.replace(/\.[a-zA-Z0-9]+$/, '').toLowerCase();
  const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2].toLowerCase() : '';

  const cleanName = nameWithoutExt.replace(/[^a-z0-9]/g, ' ');
  const cleanFolder = folder.replace(/[^a-z0-9]/g, ' ');
  const combined = `${cleanFolder} ${cleanName}`.trim();
  const words = combined.split(/\s+/).filter(Boolean);

  const containsSub = (sub: string) => combined.includes(sub);

  const hasFuzzyWord = (target: string, maxDist: number = 1): boolean => {
    return words.some(w => {
      if (w === target) return true;
      if (w.length >= 3 && Math.abs(w.length - target.length) <= maxDist) {
        return levenshteinDistance(w, target) <= maxDist;
      }
      return false;
    });
  };

  // 1. COLLAR PANEL (Handles: collar, colar, coler, coller, collor, cllr, neck, neckband, rib, ribbing)
  const collarKeywords = [
    'collar', 'collars', 'colar', 'coler', 'coller', 'collor', 'cllr', 
    'kollar', 'kolar', 'neck', 'neckband', 'neckrib', 'rib', 'ribbing',
    'collarband', 'collarstrip', 'collartrim', 'ribcollar'
  ];
  const isCollar = 
    words.some(w => collarKeywords.includes(w)) ||
    hasFuzzyWord('collar', 2) ||
    hasFuzzyWord('neckband', 2) ||
    containsSub('collar') ||
    containsSub('colar') ||
    containsSub('coler') ||
    containsSub('coller') ||
    containsSub('collor') ||
    containsSub('neck') ||
    containsSub('ribbing');

  if (isCollar) {
    return 'collar';
  }

  // 2. SLEEVE PANELS (Handles: sleeve, sleev, sleve, slevee, slv, arm, shoulder, lhs, rhs)
  const sleeveKeywords = ['sleeve', 'sleev', 'sleve', 'slevee', 'slev', 'slv', 'sl', 'sleeves', 'arm', 'shoulder', 'cuff', 'hand'];
  const hasSleeveWord = 
    words.some(w => sleeveKeywords.includes(w)) ||
    hasFuzzyWord('sleeve', 2) ||
    hasFuzzyWord('sleev', 1) ||
    containsSub('sleeve') ||
    containsSub('sleev') ||
    containsSub('sleve') ||
    containsSub('slv');

  // Left indicators
  const isLeft = 
    words.some(w => ['left', 'l', 'lhs', 'lft', 'leftside', 'lhand', 'leftsleeve', 'ls'].includes(w)) ||
    containsSub('left') ||
    containsSub('lhs') ||
    /(^|[\s_-])l([\s_-]|$)/i.test(combined);

  // Right indicators
  const isRight = 
    words.some(w => ['right', 'r', 'rhs', 'rgt', 'rightside', 'rhand', 'rightsleeve', 'rs'].includes(w)) ||
    containsSub('right') ||
    containsSub('rhs') ||
    /(^|[\s_-])r([\s_-]|$)/i.test(combined);

  if (hasSleeveWord) {
    if (isLeft && !isRight) return 'sleeve_left';
    if (isRight && !isLeft) return 'sleeve_right';
    return 'sleeve_both';
  }

  // Standalone L / R with sleeve intent
  if (isLeft && (containsSub('arm') || containsSub('hand') || words.includes('l'))) return 'sleeve_left';
  if (isRight && (containsSub('arm') || containsSub('hand') || words.includes('r'))) return 'sleeve_right';

  // 3. FRONT PANEL (Handles: front, frnt, fnt, fron, f, chest, belly, face)
  const frontKeywords = ['front', 'frnt', 'fnt', 'fron', 'frt', 'chest', 'belly', 'face', 'frontside', 'frontbody'];
  const isFront = 
    words.some(w => frontKeywords.includes(w)) ||
    hasFuzzyWord('front', 1) ||
    containsSub('front') ||
    containsSub('frnt') ||
    /(^|[\s_-])f([\s_-]|$)/i.test(combined);

  if (isFront && !containsSub('back')) {
    return 'front';
  }

  // 4. BACK PANEL (Handles: back, bck, bak, bk, rear, b, reverse, backside)
  const backKeywords = ['back', 'bck', 'bak', 'bk', 'rear', 'reverse', 'backside', 'backbody'];
  const isBack = 
    words.some(w => backKeywords.includes(w)) ||
    hasFuzzyWord('back', 1) ||
    containsSub('back') ||
    containsSub('bck') ||
    /(^|[\s_-])b([\s_-]|$)/i.test(combined);

  if (isBack) {
    return 'back';
  }

  return null;
}
