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
export const FACTORY_PRESETS: DesignPresetItem[] = [
  {
    id: 'factory_navy_gold',
    name: 'Pro Sublimation (Navy & Gold)',
    category: 'factory',
    description: 'Deep navy jersey with gold athletic lettering, dual sleeve ribbing, and contrast collar.',
    config: {
      ...defaultDesignConfig,
      front: {
        ...defaultDesignConfig.front,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#0B192C',
        generatedColor2: '#0B192C',
        nameConfig: {
          ...defaultDesignConfig.front.nameConfig,
          enabled: false
        },
        numberConfig: {
          ...defaultDesignConfig.front.numberConfig,
          enabled: true,
          fontSize: 3.5,
          color: '#FFD700',
          strokeColor: '#000000',
          strokeWidth: 0.8
        }
      },
      back: {
        ...defaultDesignConfig.back,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#0B192C',
        generatedColor2: '#0B192C',
        nameConfig: {
          ...defaultDesignConfig.back.nameConfig,
          enabled: true,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 1.5
        },
        numberConfig: {
          ...defaultDesignConfig.back.numberConfig,
          enabled: true,
          fontSize: 9.0,
          color: '#FFD700',
          strokeColor: '#FFFFFF',
          strokeWidth: 0.8
        }
      },
      collar: {
        ...defaultDesignConfig.collar!,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#FFD700',
        stripes: [
          { color: '#0B192C', height: 0.25, yPos: 0.5 },
          { color: '#FFFFFF', height: 0.15, yPos: 1.0 }
        ]
      }
    }
  },
  {
    id: 'factory_cricket_royal',
    name: 'Cricket Pro (Royal & Amber)',
    category: 'factory',
    description: 'Tournament jersey in royal blue with vibrant amber accents and high-visibility back numbers.',
    config: {
      ...defaultDesignConfig,
      front: {
        ...defaultDesignConfig.front,
        backgroundType: 'generate',
        generatedStyle: 'gradient-linear-tb',
        generatedColor1: '#0F52BA',
        generatedColor2: '#051E54',
        nameConfig: {
          ...defaultDesignConfig.front.nameConfig,
          enabled: false
        },
        numberConfig: {
          ...defaultDesignConfig.front.numberConfig,
          enabled: false
        }
      },
      back: {
        ...defaultDesignConfig.back,
        backgroundType: 'generate',
        generatedStyle: 'gradient-linear-tb',
        generatedColor1: '#0F52BA',
        generatedColor2: '#051E54',
        nameConfig: {
          ...defaultDesignConfig.back.nameConfig,
          enabled: true,
          color: '#FFBF00',
          strokeColor: '#051E54',
          strokeWidth: 1.8
        },
        numberConfig: {
          ...defaultDesignConfig.back.numberConfig,
          enabled: true,
          fontSize: 9.0,
          color: '#FFFFFF',
          strokeColor: '#FFBF00',
          strokeWidth: 0.9
        }
      }
    }
  },
  {
    id: 'factory_striker_red',
    name: 'Football Striker (Crimson Stripes)',
    category: 'factory',
    description: 'Athletic vertical striped front with solid crimson back panel for crisp number legibility.',
    config: {
      ...defaultDesignConfig,
      front: {
        ...defaultDesignConfig.front,
        backgroundType: 'generate',
        generatedStyle: 'classic-stripes',
        generatedColor1: '#B91C1C',
        generatedColor2: '#FFFFFF'
      },
      back: {
        ...defaultDesignConfig.back,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#B91C1C',
        generatedColor2: '#B91C1C',
        nameConfig: {
          ...defaultDesignConfig.back.nameConfig,
          enabled: true,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 1.5
        },
        numberConfig: {
          ...defaultDesignConfig.back.numberConfig,
          enabled: true,
          color: '#FFFFFF',
          strokeColor: '#000000',
          strokeWidth: 1.0
        }
      }
    }
  },
  {
    id: 'factory_esports_stealth',
    name: 'Esports Stealth (Obsidian & Cyan)',
    category: 'factory',
    description: 'Modern esports gamer style with electric cyan glow typography on dark obsidian panels.',
    config: {
      ...defaultDesignConfig,
      front: {
        ...defaultDesignConfig.front,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#111827',
        generatedColor2: '#1F2937',
        numberConfig: {
          ...defaultDesignConfig.front.numberConfig,
          enabled: true,
          color: '#06B6D4',
          strokeColor: '#FFFFFF',
          strokeWidth: 0.6
        }
      },
      back: {
        ...defaultDesignConfig.back,
        backgroundType: 'generate',
        generatedStyle: 'solid',
        generatedColor1: '#111827',
        generatedColor2: '#1F2937',
        nameConfig: {
          ...defaultDesignConfig.back.nameConfig,
          enabled: true,
          color: '#06B6D4',
          strokeColor: '#000000',
          strokeWidth: 1.5
        },
        numberConfig: {
          ...defaultDesignConfig.back.numberConfig,
          enabled: true,
          color: '#FFFFFF',
          strokeColor: '#06B6D4',
          strokeWidth: 1.2
        }
      }
    }
  },
  {
    id: 'factory_minimalist_blank',
    name: 'Standard Sublimation Artboard',
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
