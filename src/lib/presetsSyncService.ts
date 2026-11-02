// ─── Design Presets Cloud & IndexedDB Sync Service ───────────────────────────
// Provides rock-solid storage for Jersey Design Presets:
// 1. IndexedDB: Handles high-resolution artwork uploads & base64 textures (0 quota errors).
// 2. Cloud Sync: Automatically syncs presets across Windows, Mac, and mobile via Supabase & MongoDB.
// 3. Factory Templates: Pre-loads standard industrial presets so clients always have ready-to-use designs.
// 4. JSON Import/Export: Allows operators to back up or share presets via file.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabaseClient';
import { getActiveUserContext } from './orderSyncService';
import type { ArtDesignConfig } from '../components/studio/defaultDesignConfig';
import { defaultDesignConfig } from '../components/studio/defaultDesignConfig';

export interface DesignPresetItem {
  id: string;
  name: string;
  category: 'factory' | 'custom';
  description?: string;
  config: ArtDesignConfig;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string; // Auto-vanish after 3 days
}

export const MAX_CLOUD_PRESETS = 3;
export const PRESET_VALIDITY_DAYS = 3;
export const PRESET_VALIDITY_MS = PRESET_VALIDITY_DAYS * 24 * 60 * 60 * 1000; // 3 days (72 hours)

/**
 * Check if a preset is still valid (not expired beyond 3 days)
 */
export function isPresetValid(preset: DesignPresetItem): boolean {
  if (preset.category === 'factory') return true;
  const now = Date.now();
  if (preset.expiresAt) {
    return new Date(preset.expiresAt).getTime() > now;
  }
  if (preset.createdAt) {
    return now - new Date(preset.createdAt).getTime() < PRESET_VALIDITY_MS;
  }
  return true;
}

/**
 * Helper to display human-readable time remaining before 3-day expiration
 */
export function formatTimeRemaining(expiresAt?: string, createdAt?: string): string {
  const now = Date.now();
  let expireTime: number;
  if (expiresAt) {
    expireTime = new Date(expiresAt).getTime();
  } else if (createdAt) {
    expireTime = new Date(createdAt).getTime() + PRESET_VALIDITY_MS;
  } else {
    return '3 days left';
  }

  const diffMs = expireTime - now;
  if (diffMs <= 0) return 'Expired';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;

  if (diffDays > 0) {
    return `${diffDays}d ${remHours}h left`;
  }
  if (diffHours > 0) {
    return `${diffHours}h left`;
  }
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `${diffMins}m left`;
}

const BACKEND_BASE = 'https://fivenest-backend.onrender.com';
const IDB_NAME = 'fivenest_studio_db';
const IDB_STORE = 'design_presets';
const IDB_VERSION = 1;

// ─── 1. BUILT-IN FACTORY STARTER PRESETS ─────────────────────────────────────
interface UniformPresetSpec {
  id: string;
  name: string;
  category?: 'factory';
  description: string;
  fillType: 'solid' | 'gradient';
  gradientStyle?: 'gradient-linear-tb' | 'gradient-linear-lr' | 'gradient-linear-diag' | 'gradient-radial';
  color1: string;
  color2: string;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold';
  nameColor: string;
  nameStrokeColor: string;
  nameStrokeWidth?: number;
  numberColor: string;
  numberStrokeColor: string;
  numberStrokeWidth?: number;
  frontNumberEnabled?: boolean;
  collarBgColor?: string;
  collarStripeColor?: string;
  placketColor?: string;
  sleeveStripeColor?: string;
}

function buildUniformJerseyPreset(spec: UniformPresetSpec): DesignPresetItem {
  const genStyle = spec.fillType === 'solid' ? 'solid' : (spec.gradientStyle || 'gradient-linear-tb');
  const fw = spec.fontWeight || 'normal';

  const makeUniformPanel = (base: any, isFront: boolean, isBack: boolean) => ({
    ...base,
    backgroundType: 'generate' as const,
    generatedStyle: genStyle,
    generatedColor1: spec.color1,
    generatedColor2: spec.color2,
    uploadedFileUrl: null,
    uploadedFileHalfUrl: null,
    uploadedFileFullUrl: null,
    uploadedFileNoLogoUrl: null,
    nameConfig: {
      ...base.nameConfig,
      fontFamily: spec.fontFamily,
      fontWeight: fw,
      color: spec.nameColor,
      strokeColor: spec.nameStrokeColor,
      strokeWidth: spec.nameStrokeWidth ?? 1.5,
      enabled: isBack,
    },
    numberConfig: {
      ...base.numberConfig,
      fontFamily: spec.fontFamily,
      fontWeight: fw,
      color: spec.numberColor,
      strokeColor: spec.numberStrokeColor,
      strokeWidth: spec.numberStrokeWidth ?? 0.8,
      enabled: isBack ? true : (isFront ? (spec.frontNumberEnabled ?? true) : false),
      fontSize: isBack ? 9.0 : 3.5,
    }
  });

  return {
    id: spec.id,
    name: spec.name,
    category: 'factory',
    description: spec.description,
    config: {
      ...defaultDesignConfig,
      front: makeUniformPanel(defaultDesignConfig.front, true, false),
      back: makeUniformPanel(defaultDesignConfig.back, false, true),
      sleeveLeft: makeUniformPanel(defaultDesignConfig.sleeveLeft, false, false),
      sleeveRight: makeUniformPanel(defaultDesignConfig.sleeveRight, false, false),
      a4Print: makeUniformPanel(defaultDesignConfig.a4Print, false, false),
      collar: {
        ...(defaultDesignConfig.collar || {}),
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: spec.collarBgColor || spec.color1,
        generatedColor2: spec.collarBgColor || spec.color1,
        uploadedFileUrl: null,
        stripes: [
          { id: 'cs-1', color: spec.collarStripeColor || spec.color2, height: 0.25, yOffset: 0.5, fillType: 'solid' },
          { id: 'cs-2', color: '#FFFFFF', height: 0.15, yOffset: 1.0, fillType: 'solid' }
        ]
      },
      trim: {
        collar: { enabled: true, color: spec.collarBgColor || spec.color1, uploadedUrl: null },
        placket: { enabled: true, color: spec.placketColor || spec.collarBgColor || spec.color1, uploadedUrl: null },
        sleeveStripe: { 
          enabled: true, 
          color: spec.sleeveStripeColor || spec.color2, 
          uploadedUrl: null, 
          height: 2.0, 
          fillType: spec.fillType === 'gradient' ? 'gradient' : 'solid' 
        },
        buttonColor: '#FFFFFF'
      }
    }
  };
}

export const FACTORY_PRESETS: DesignPresetItem[] = [
  buildUniformJerseyPreset({
    id: 'factory_jersey_m54_navy',
    name: 'Jersey M54 · Navy & Gold (Solid)',
    description: 'Uniform deep navy solid kit across all panels with authentic Jersey M54 athletic numbers & gold accents.',
    fillType: 'solid',
    color1: '#0B192C',
    color2: '#0B192C',
    fontFamily: 'Jersey M54',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#000000',
    nameStrokeWidth: 1.5,
    numberColor: '#FFD700',
    numberStrokeColor: '#000000',
    numberStrokeWidth: 0.8,
    collarBgColor: '#0B192C',
    collarStripeColor: '#FFD700',
    placketColor: '#FFD700',
    sleeveStripeColor: '#FFD700'
  }),
  buildUniformJerseyPreset({
    id: 'factory_barcelona_blaugrana',
    name: 'Barcelona 2013 HD · Blaugrana (Gradient)',
    description: 'Iconic Barcelona 2013 HD typography over rich Garnet-to-Blue vertical gradient filled across all panels.',
    fillType: 'gradient',
    gradientStyle: 'gradient-linear-tb',
    color1: '#8A002E',
    color2: '#003366',
    fontFamily: 'Barcelona_2013_HD',
    nameColor: '#FFED02',
    nameStrokeColor: '#003366',
    nameStrokeWidth: 1.8,
    numberColor: '#FFED02',
    numberStrokeColor: '#8A002E',
    numberStrokeWidth: 1.0,
    collarBgColor: '#003366',
    collarStripeColor: '#FFED02',
    placketColor: '#FFED02',
    sleeveStripeColor: '#FFED02'
  }),
  buildUniformJerseyPreset({
    id: 'factory_impact_crimson',
    name: 'Impact · Crimson Striker (Solid)',
    description: 'All panels filled with vibrant solid crimson red with heavy Impact bold athletic lettering.',
    fillType: 'solid',
    color1: '#B91C1C',
    color2: '#B91C1C',
    fontFamily: 'Impact',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#000000',
    nameStrokeWidth: 1.5,
    numberColor: '#FFFFFF',
    numberStrokeColor: '#000000',
    numberStrokeWidth: 1.0,
    collarBgColor: '#FFFFFF',
    collarStripeColor: '#B91C1C',
    placketColor: '#FFFFFF',
    sleeveStripeColor: '#FFFFFF'
  }),
  buildUniformJerseyPreset({
    id: 'factory_arial_stealth_volt',
    name: 'Arial Bold · Stealth Volt (Solid)',
    description: 'Pitch dark charcoal solid jersey across all panels with modern Arial Bold font & electric volt numbers.',
    fillType: 'solid',
    color1: '#111827',
    color2: '#111827',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#000000',
    nameStrokeWidth: 1.5,
    numberColor: '#CCFF00',
    numberStrokeColor: '#000000',
    numberStrokeWidth: 0.8,
    collarBgColor: '#111827',
    collarStripeColor: '#CCFF00',
    placketColor: '#CCFF00',
    sleeveStripeColor: '#CCFF00'
  }),
  buildUniformJerseyPreset({
    id: 'factory_eaglore_ocean_cyan',
    name: 'Eaglore 2 · Ocean Cyan (Gradient)',
    description: 'Midnight-to-cyan gradient filled on all panels with authentic Eaglore 2 display lettering.',
    fillType: 'gradient',
    gradientStyle: 'gradient-linear-tb',
    color1: '#0F172A',
    color2: '#0284C7',
    fontFamily: 'Eaglore 2',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#0F172A',
    nameStrokeWidth: 1.5,
    numberColor: '#38BDF8',
    numberStrokeColor: '#FFFFFF',
    numberStrokeWidth: 1.0,
    collarBgColor: '#0F172A',
    collarStripeColor: '#38BDF8',
    placketColor: '#38BDF8',
    sleeveStripeColor: '#38BDF8'
  }),
  buildUniformJerseyPreset({
    id: 'factory_jersey_m54_bleed_blue',
    name: 'Jersey M54 · Bleed Blue (Gradient)',
    description: 'Cobalt blue gradient filled across all panels with Jersey M54 sports typography & saffron trim.',
    fillType: 'gradient',
    gradientStyle: 'gradient-linear-tb',
    color1: '#0A192F',
    color2: '#1D4ED8',
    fontFamily: 'Jersey M54',
    nameColor: '#FF9933',
    nameStrokeColor: '#0A192F',
    nameStrokeWidth: 1.8,
    numberColor: '#FFFFFF',
    numberStrokeColor: '#FF9933',
    numberStrokeWidth: 1.0,
    collarBgColor: '#0A192F',
    collarStripeColor: '#FF9933',
    placketColor: '#FF9933',
    sleeveStripeColor: '#FF9933'
  }),
  buildUniformJerseyPreset({
    id: 'factory_impact_emerald_gold',
    name: 'Impact · Emerald & Gold (Solid)',
    description: 'Solid deep emerald championship kit across all panels with bold Impact font & amber gold numbers.',
    fillType: 'solid',
    color1: '#064E3B',
    color2: '#064E3B',
    fontFamily: 'Impact',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#064E3B',
    nameStrokeWidth: 1.5,
    numberColor: '#F59E0B',
    numberStrokeColor: '#FFFFFF',
    numberStrokeWidth: 0.9,
    collarBgColor: '#064E3B',
    collarStripeColor: '#F59E0B',
    placketColor: '#F59E0B',
    sleeveStripeColor: '#F59E0B'
  }),
  buildUniformJerseyPreset({
    id: 'factory_barcelona_sunset_fire',
    name: 'Barcelona 2013 HD · Sunset Fire (Gradient)',
    description: 'Vibrant orange-to-mahogany gradient across all panels featuring Barcelona 2013 HD numbers.',
    fillType: 'gradient',
    gradientStyle: 'gradient-linear-tb',
    color1: '#EA580C',
    color2: '#7C2D12',
    fontFamily: 'Barcelona_2013_HD',
    nameColor: '#FFFFFF',
    nameStrokeColor: '#7C2D12',
    nameStrokeWidth: 1.8,
    numberColor: '#FEF08A',
    numberStrokeColor: '#1C1917',
    numberStrokeWidth: 1.0,
    collarBgColor: '#1C1917',
    collarStripeColor: '#EA580C',
    placketColor: '#EA580C',
    sleeveStripeColor: '#FEF08A'
  }),
  {
    id: 'factory_minimalist_blank',
    name: 'Standard Sublimation Artboard (Clean White)',
    category: 'factory',
    description: 'Clean default sublimation layout with calibrated industrial factory guidelines and size tags.',
    config: defaultDesignConfig
  }
];

// ─── 2. INDEXEDDB ENGINE ─────────────────────────────────────────────────────
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this browser.'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all custom presets saved locally in IndexedDB.
 * Also handles seamless one-time migration from legacy localStorage('fivenest_presets').
 */
export async function getLocalPresets(userEmail?: string | null): Promise<DesignPresetItem[]> {
  const emailKey = (userEmail || '').trim().toLowerCase();
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(IDB_STORE, 'readonly');
    const store = transaction.objectStore(IDB_STORE);
    const getAllReq = store.getAll();

    const items: DesignPresetItem[] = await new Promise((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });

    // If IndexedDB has items, purge expired (> 3 days) and enforce max 3
    if (items.length > 0) {
      const valid = items.filter(p => isPresetValid(p));
      const expired = items.filter(p => !isPresetValid(p));
      if (expired.length > 0) {
        try {
          const delTx = db.transaction(IDB_STORE, 'readwrite');
          const delStore = delTx.objectStore(IDB_STORE);
          expired.forEach(exp => delStore.delete(exp.id));
        } catch (e) {}
      }
      return valid.slice(-MAX_CLOUD_PRESETS);
    }
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
  }

  // Fallback / Legacy migration: read from localStorage('fivenest_presets')
  try {
    const legacyStr = localStorage.getItem('fivenest_presets');
    if (legacyStr) {
      const parsed = JSON.parse(legacyStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const now = Date.now();
        const migrated: DesignPresetItem[] = parsed.map((p, idx) => ({
          id: `custom_${now}_${idx}`,
          name: p.name || `Preset ${idx + 1}`,
          category: 'custom',
          config: p.config,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(now + PRESET_VALIDITY_MS).toISOString(),
          updatedAt: new Date(now).toISOString()
        })).slice(-MAX_CLOUD_PRESETS);

        // Asynchronously persist into IndexedDB
        saveMultipleToIndexedDB(migrated).catch(() => {});
        return migrated;
      }
    }
  } catch (e) {}

  return [];
}

/**
 * Save a single preset item to IndexedDB (with 3-day validity)
 */
export async function savePresetToIndexedDB(preset: DesignPresetItem): Promise<boolean> {
  try {
    const now = new Date();
    if (!preset.createdAt) preset.createdAt = now.toISOString();
    if (!preset.expiresAt) {
      preset.expiresAt = new Date(now.getTime() + PRESET_VALIDITY_MS).toISOString();
    }
    const db = await openIndexedDB();
    const transaction = db.transaction(IDB_STORE, 'readwrite');
    const store = transaction.objectStore(IDB_STORE);
    store.put(preset);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Safe lightweight backup in localStorage (names and metadata only to avoid quota)
    try {
      const lightweight = { id: preset.id, name: preset.name, updatedAt: preset.updatedAt };
      const currentListStr = localStorage.getItem('fivenest_preset_names') || '[]';
      const currentList = JSON.parse(currentListStr).filter((i: any) => i.id !== preset.id);
      currentList.push(lightweight);
      localStorage.setItem('fivenest_preset_names', JSON.stringify(currentList));
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('Failed to save preset to IndexedDB:', err);
    return false;
  }
}

/**
 * Delete a preset by ID or Name from IndexedDB
 */
export async function deletePresetFromIndexedDB(presetIdOrName: string): Promise<boolean> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(IDB_STORE, 'readwrite');
    const store = transaction.objectStore(IDB_STORE);

    // If matching id, delete directly
    store.delete(presetIdOrName);

    // Also scan in case passed by name
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const all = getAllReq.result || [];
      all.forEach((item: DesignPresetItem) => {
        if (item.name === presetIdOrName) {
          store.delete(item.id);
        }
      });
    };

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    return true;
  } catch (err) {
    console.error('Failed to delete preset from IndexedDB:', err);
    return false;
  }
}

/**
 * Batch save presets into IndexedDB
 */
async function saveMultipleToIndexedDB(presets: DesignPresetItem[]): Promise<void> {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(IDB_STORE, 'readwrite');
    const store = transaction.objectStore(IDB_STORE);
    presets.forEach(p => store.put(p));
  } catch (e) {}
}

// ─── 3. CLOUD SYNC ENGINE (Supabase & MongoDB) ───────────────────────────────
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Fetch presets from cloud (Supabase & backend MongoDB)
 */
export async function fetchCloudPresets(userEmail?: string | null, userId?: string | null): Promise<DesignPresetItem[]> {
  const context = await getActiveUserContext();
  const effectiveUserId = userId || context?.userId;
  const effectiveEmail = userEmail || context?.email;

  if (!effectiveUserId && !effectiveEmail) {
    return [];
  }

  // Strategy 1: Direct Supabase query to plugin_usage_logs (Instant response)
  if (effectiveUserId) {
    try {
      const { data, error } = await supabase
        .from('plugin_usage_logs')
        .select('details, created_at')
        .eq('user_id', effectiveUserId)
        .eq('plugin_type', 'design_presets')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.details) {
        const raw = data[0].details;
        const cloudPresets: DesignPresetItem[] = Array.isArray(raw) ? raw : (raw.presets || []);
        const validPresets = cloudPresets.filter(p => isPresetValid(p)).slice(-MAX_CLOUD_PRESETS);
        if (validPresets.length > 0) {
          saveMultipleToIndexedDB(validPresets).catch(() => {});
          return validPresets;
        }
      }
    } catch (err) {
      console.warn('Direct Supabase presets fetch warning:', err);
    }
  }

  // Strategy 2: Backend API query (serviced by Supabase admin / MongoDB)
  try {
    const params = new URLSearchParams();
    if (effectiveUserId) params.set('userId', effectiveUserId);
    if (effectiveEmail) params.set('email', effectiveEmail);

    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_BASE}/api/presets/store?${params.toString()}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.presets)) {
        const validPresets = json.presets.filter((p: DesignPresetItem) => isPresetValid(p)).slice(-MAX_CLOUD_PRESETS);
        if (validPresets.length > 0) {
          saveMultipleToIndexedDB(validPresets).catch(() => {});
          return validPresets;
        }
      }
    }
  } catch (err) {
    console.warn('Backend presets fetch warning:', err);
  }

  return [];
}

/**
 * Save custom presets to cloud (Supabase + backend)
 * Enforces maximum 3 presets, auto-expires after 3 days.
 */
export async function savePresetsToCloud(
  presets: DesignPresetItem[], 
  userEmail?: string | null, 
  userId?: string | null
): Promise<boolean> {
  const context = await getActiveUserContext();
  const effectiveUserId = userId || context?.userId;
  const effectiveEmail = userEmail || context?.email;

  if (!effectiveUserId && !effectiveEmail) {
    return false;
  }

  let saved = false;

  // Filter only custom valid presets, ensure expiration date (3 days), and cap at MAX 3
  const now = Date.now();
  const customOnly = presets
    .filter(p => p.category === 'custom' && isPresetValid(p))
    .slice(-MAX_CLOUD_PRESETS);

  customOnly.forEach(p => {
    if (!p.createdAt) p.createdAt = new Date(now).toISOString();
    if (!p.expiresAt) {
      p.expiresAt = new Date(new Date(p.createdAt).getTime() + PRESET_VALIDITY_MS).toISOString();
    }
  });

  // Strategy 1: Direct Supabase insert
  if (effectiveUserId) {
    try {
      const { error } = await supabase.from('plugin_usage_logs').insert({
        user_id: effectiveUserId,
        plugin_type: 'design_presets',
        action: 'save_design_presets',
        details: { presets: customOnly, updatedAt: new Date().toISOString(), maxLimit: MAX_CLOUD_PRESETS, validityDays: PRESET_VALIDITY_DAYS }
      });
      if (!error) saved = true;
    } catch (err) {
      console.warn('Direct Supabase presets save error:', err);
    }
  }

  // Strategy 2: Backend API save
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BACKEND_BASE}/api/presets/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        userId: effectiveUserId,
        email: effectiveEmail,
        presets: customOnly
      })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) saved = true;
    }
  } catch (err) {
    console.warn('Backend presets save error:', err);
  }

  return saved;
}

// ─── 4. JSON EXPORT & IMPORT UTILITIES ─────────────────────────────────────────
export function downloadPresetsFile(presets: DesignPresetItem[], filename = 'fivenest-jersey-presets.json') {
  const jsonStr = JSON.stringify(presets, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parsePresetsJSON(jsonStr: string): DesignPresetItem[] | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(item => item && item.name && item.config);
    return valid.map((item, idx) => ({
      id: item.id || `imported_${Date.now()}_${idx}`,
      name: item.name,
      category: 'custom',
      description: item.description || 'Imported preset',
      config: item.config,
      updatedAt: new Date().toISOString()
    }));
  } catch {
    return null;
  }
}
