// ─── Size Editor Cloud Sync Service (Supabase) ───────────────────────────────
// Stores and synchronizes Size Editor Data (Factory sizing matrix, calibrated
// measurements, collar dimensions, and sizing presets) into the Supabase database.
// Size Editor Data changes infrequently, so persisting it in Supabase guarantees
// the factory sizing matrix is preserved across all devices without losing customizations.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabaseClient';
import { defaultSizes, DEFAULT_SIZE_AGE_MAP, DEFAULT_COLLAR_EXPORT_SIZES, type SizeDatabase, type CollarExportDimensions } from '../components/studio/sizesDb';
import { getActiveUserContext } from './orderSyncService';

const BACKEND_BASE = 'https://fivenest-backend.onrender.com';
let saveTimer: any = null;

export interface SizeEditorData {
  sizeDB: SizeDatabase;
  savedPresets: Record<string, SizeDatabase>;
  activePreset: string;
  ageMap: Record<string, string>;
  collarSizes: CollarExportDimensions;
  centerMarks?: boolean;
  sizeWatermarks?: boolean;
}

/**
 * Fetch latest Size Editor Data from Supabase database
 */
export async function fetchCloudSizesData(): Promise<SizeEditorData | null> {
  const user = await getActiveUserContext();
  if (!user || (!user.userId && !user.email)) {
    return null;
  }

  // Strategy 1: Direct Supabase query to plugin_usage_logs
  if (user.userId) {
    try {
      const { data, error } = await supabase
        .from('plugin_usage_logs')
        .select('details, created_at')
        .eq('user_id', user.userId)
        .eq('plugin_type', 'size_editor_data')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.details) {
        const cloudData = data[0].details as SizeEditorData;
        syncToLocalStorage(cloudData);
        return cloudData;
      }
    } catch (err) {
      console.warn('Direct Supabase sizes fetch warning:', err);
    }
  }

  // Strategy 2: Backend sizes API (queries Supabase via service role admin key)
  try {
    const params = new URLSearchParams();
    if (user.userId) params.set('userId', user.userId);
    if (user.email) params.set('email', user.email);

    const res = await fetch(`${BACKEND_BASE}/api/sizes/store?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.sizesData) {
        const cloudData = json.sizesData as SizeEditorData;
        syncToLocalStorage(cloudData);
        return cloudData;
      }
    }
  } catch (err) {
    console.warn('Backend sizes fetch warning:', err);
  }

  return null;
}

/**
 * Save Size Editor Data to Supabase database
 */
export async function saveCloudSizesData(data: SizeEditorData): Promise<boolean> {
  const user = await getActiveUserContext();
  if (!user || (!user.userId && !user.email)) {
    return false;
  }

  let saved = false;

  // Strategy 1: Direct Supabase insert to plugin_usage_logs
  if (user.userId) {
    try {
      const { error } = await supabase
        .from('plugin_usage_logs')
        .insert({
          user_id: user.userId,
          plugin_type: 'size_editor_data',
          action: 'save_factory_sizes',
          details: data
        });

      if (!error) saved = true;
    } catch (err) {
      console.warn('Direct Supabase sizes save warning:', err);
    }
  }

  // Strategy 2: Backend sizes API
  try {
    const res = await fetch(`${BACKEND_BASE}/api/sizes/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.userId,
        email: user.email,
        sizesData: data
      })
    });
    if (res.ok) saved = true;
  } catch (err) {
    console.warn('Backend sizes save warning:', err);
  }

  return saved;
}

/**
 * Schedule a debounced cloud sizes save (e.g. 1000ms)
 */
export function queueCloudSizesSave(data: SizeEditorData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveCloudSizesData(data);
    } catch (e) {
      console.warn('Queued cloud sizes save error:', e);
    }
  }, 1000);
}

/**
 * Helper to cache cloud sizes data into localStorage for instant zero-latency loading
 */
export function syncToLocalStorage(data: SizeEditorData) {
  try {
    if (data.sizeDB) {
      localStorage.setItem('teedex_size_database', JSON.stringify(data.sizeDB));
      localStorage.setItem('fivenest_size_db', JSON.stringify(data.sizeDB));
    }
    if (data.savedPresets) {
      localStorage.setItem('fivenest_size_presets', JSON.stringify(data.savedPresets));
    }
    if (data.activePreset) {
      localStorage.setItem('fivenest_active_size_preset', data.activePreset);
    }
    if (data.ageMap) {
      localStorage.setItem('fivenest_size_age_map', JSON.stringify(data.ageMap));
    }
    if (data.collarSizes) {
      localStorage.setItem('fivenest_collar_export_sizes', JSON.stringify(data.collarSizes));
    }
    if (data.centerMarks !== undefined) {
      localStorage.setItem('fivenest_pref_center_marks', JSON.stringify(data.centerMarks));
    }
    if (data.sizeWatermarks !== undefined) {
      localStorage.setItem('fivenest_pref_size_watermarks', JSON.stringify(data.sizeWatermarks));
    }
  } catch (e) {
    console.warn('Error syncing sizes to localStorage:', e);
  }
}
