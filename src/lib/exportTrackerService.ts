import { supabase } from './supabaseClient';

export interface ExportRecordEvent {
  id?: string;
  fileCount: number;
  jerseyCount: number;
  customerName?: string;
  orderNum?: string;
  exportType?: string;
  date: string;
  timestamp: number;
  userEmail?: string;
}

export interface ExportTrackerStats {
  totalExportJerseys: number; // Count of jerseys exported (FiveNest billing unit)
  todayExportJerseys: number; // Count of jerseys exported today
  todayExportJobs: number;
  allTimeJobs: number;
  lastExportedAt?: string;
  startDate: string;
  // Aliases for compatibility
  totalExportFiles: number;
  todayExportFiles: number;
}

// V2 storage key (ensures clean migration from panel count to jersey count)
const STORAGE_KEY = 'fivenest_export_tracker_jerseys_v2';
const EVENTS_STORAGE_KEY = 'fivenest_local_export_events_v2';

// Start tracking date (Today: 2026-11-04)
export const TRACKER_START_DATE = '2026-11-04';

// Helper to get today's date formatted as YYYY-MM-DD in local time
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse jersey count from transaction description.
 * Charges in FiveNest are based strictly on 1 Jersey (not individual panels).
 * e.g. "Exported 25 items (25 back, 0 A4)" -> 25 jerseys.
 */
export const parseJerseysFromTransaction = (desc: string): number => {
  if (!desc) return 0;
  
  // Look for "Exported X items" -> X jerseys
  const m1 = desc.match(/Exported\s+(\d+)\s+items?/i);
  if (m1 && m1[1]) {
    return parseInt(m1[1], 10) || 0;
  }

  // Look for "(X Jerseys)" or "X jersey data"
  const m2 = desc.match(/(\d+)\s+jerseys?/i);
  if (m2 && m2[1]) {
    return parseInt(m2[1], 10) || 0;
  }

  // Look for "X pcs"
  const m3 = desc.match(/(\d+)\s+pcs/i);
  if (m3 && m3[1]) {
    return parseInt(m3[1], 10) || 0;
  }

  // Generic export transaction
  if (/export/i.test(desc)) {
    return 1;
  }

  return 0;
};

/**
 * Read cached stats from localStorage
 */
export const getCachedExportStats = (): ExportTrackerStats => {
  const todayStr = getTodayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (typeof parsed.totalExportJerseys === 'number' || typeof parsed.totalExportFiles === 'number')) {
        const total = typeof parsed.totalExportJerseys === 'number' ? parsed.totalExportJerseys : parsed.totalExportFiles;
        const today = typeof parsed.todayExportJerseys === 'number' ? parsed.todayExportJerseys : (parsed.todayExportFiles || 0);

        // Reset today stats if cached date was before today
        if (parsed.startDate !== todayStr && parsed.lastExportDate !== todayStr) {
          return {
            totalExportJerseys: Math.max(total, 0),
            todayExportJerseys: 0,
            todayExportJobs: 0,
            allTimeJobs: parsed.allTimeJobs || 0,
            lastExportedAt: parsed.lastExportedAt,
            startDate: todayStr,
            totalExportFiles: Math.max(total, 0),
            todayExportFiles: 0
          };
        }

        return {
          totalExportJerseys: total,
          todayExportJerseys: today,
          todayExportJobs: parsed.todayExportJobs || 0,
          allTimeJobs: parsed.allTimeJobs || 0,
          lastExportedAt: parsed.lastExportedAt,
          startDate: todayStr,
          totalExportFiles: total,
          todayExportFiles: today
        };
      }
    }
  } catch (e) {
    console.warn("Failed to parse cached export stats:", e);
  }

  return {
    totalExportJerseys: 0,
    todayExportJerseys: 0,
    todayExportJobs: 0,
    allTimeJobs: 0,
    startDate: todayStr,
    totalExportFiles: 0,
    todayExportFiles: 0
  };
};

/**
 * Save stats to cache and notify all listeners
 */
export const saveAndBroadcastStats = (stats: ExportTrackerStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("Failed to write export stats to localStorage:", e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fivenest_export_count_updated', { detail: stats }));
  }
};

/**
 * Calculate export statistics based on JERSEYS (not panels).
 * Combines:
 * 1. Admin credit_transactions ledger entries
 * 2. Supabase plugin_usage_logs (export_tracker)
 * 3. Local storage export events
 */
export async function calculateAdminExportCounts(transactions?: any[]): Promise<ExportTrackerStats> {
  const todayStr = getTodayDateString();
  let totalJerseys = 0;
  let todayJerseys = 0;
  let todayJobs = 0;
  let allTimeJobs = 0;
  let latestTimestamp: number | null = null;

  // 1. Process passed or fetched transactions from admin ledger
  let txList = transactions;
  if (!txList || txList.length === 0) {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && Array.isArray(data)) {
        txList = data;
      }
    } catch (e) {
      // Non-blocking
    }
  }

  if (Array.isArray(txList)) {
    txList.forEach(t => {
      const desc = t.description || '';
      const type = t.transaction_type || '';
      const isExportTx = type.includes('export') || desc.toLowerCase().includes('export');
      
      if (isExportTx) {
        allTimeJobs++;
        // Extract count of jerseys (1 jersey per kit, not panels)
        const count = parseJerseysFromTransaction(desc) || 1;
        totalJerseys += count;

        const txDate = t.created_at ? new Date(t.created_at) : null;
        if (txDate) {
          const txDateStr = txDate.toISOString().split('T')[0];
          if (txDateStr >= todayStr) {
            todayJerseys += count;
            todayJobs++;
          }
          if (!latestTimestamp || txDate.getTime() > latestTimestamp) {
            latestTimestamp = txDate.getTime();
          }
        }
      }
    });
  }

  // 2. Fetch specific export_tracker logs from Supabase plugin_usage_logs
  try {
    const { data: logs, error } = await supabase
      .from('plugin_usage_logs')
      .select('details, created_at')
      .eq('plugin_type', 'export_tracker')
      .order('created_at', { ascending: false })
      .limit(300);

    if (!error && Array.isArray(logs)) {
      logs.forEach(l => {
        const details = l.details || {};
        // Use jerseyCount strictly
        const count = typeof details.jerseyCount === 'number' 
          ? details.jerseyCount 
          : (typeof details.fileCount === 'number' ? Math.max(1, Math.round(details.fileCount / 4)) : 1);
        
        allTimeJobs++;
        totalJerseys += count;

        const logDate = l.created_at ? new Date(l.created_at) : null;
        const logDateStr = details.date || (logDate ? logDate.toISOString().split('T')[0] : '');
        if (logDateStr >= todayStr) {
          todayJerseys += count;
          todayJobs++;
        }

        if (logDate && (!latestTimestamp || logDate.getTime() > latestTimestamp)) {
          latestTimestamp = logDate.getTime();
        }
      });
    }
  } catch (logErr) {
    // Non-blocking
  }

  // 3. Fallback to local stored events
  try {
    const rawLocal = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (rawLocal) {
      const localEvents: ExportRecordEvent[] = JSON.parse(rawLocal);
      if (Array.isArray(localEvents)) {
        localEvents.forEach(ev => {
          if (ev.date >= todayStr) {
            if (todayJobs === 0) {
              const count = ev.jerseyCount || 1;
              todayJerseys += count;
              todayJobs++;
              totalJerseys += count;
              allTimeJobs++;
            }
          }
        });
      }
    }
  } catch (e) {}

  const stats: ExportTrackerStats = {
    totalExportJerseys: Math.max(totalJerseys, todayJerseys),
    todayExportJerseys: todayJerseys,
    todayExportJobs: todayJobs,
    allTimeJobs: Math.max(allTimeJobs, todayJobs),
    lastExportedAt: latestTimestamp ? new Date(latestTimestamp).toISOString() : new Date().toISOString(),
    startDate: todayStr,
    totalExportFiles: Math.max(totalJerseys, todayJerseys),
    todayExportFiles: todayJerseys
  };

  saveAndBroadcastStats(stats);
  return stats;
}

/**
 * Record a live export event when user generates print-ready files.
 * Counts by JERSEYS (not panels).
 */
export async function recordExportEvent(params: {
  fileCount: number;
  jerseyCount: number;
  customerName?: string;
  orderNum?: string;
  exportType?: string;
  userEmail?: string;
}): Promise<ExportTrackerStats> {
  const todayStr = getTodayDateString();
  const now = Date.now();
  // 1 Jersey = 1 unit
  const jerseyCount = Math.max(1, params.jerseyCount || Math.ceil((params.fileCount || 4) / 4));
  const fileCount = params.fileCount || (jerseyCount * 4);

  const newEvent: ExportRecordEvent = {
    id: `FN-EXP-${now}-${Math.random().toString(36).substring(2, 7)}`,
    fileCount,
    jerseyCount,
    customerName: params.customerName || 'Standard Client',
    orderNum: params.orderNum || '01',
    exportType: params.exportType || 'zip',
    date: todayStr,
    timestamp: now,
    userEmail: params.userEmail || 'guest'
  };

  // 1. Save locally in events list
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    const list: ExportRecordEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(newEvent);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn("Failed to store local export event:", e);
  }

  // 2. Update cached stats immediately
  const current = getCachedExportStats();
  const updated: ExportTrackerStats = {
    totalExportJerseys: current.totalExportJerseys + jerseyCount,
    todayExportJerseys: current.todayExportJerseys + jerseyCount,
    todayExportJobs: current.todayExportJobs + 1,
    allTimeJobs: current.allTimeJobs + 1,
    lastExportedAt: new Date(now).toISOString(),
    startDate: todayStr,
    totalExportFiles: current.totalExportJerseys + jerseyCount,
    todayExportFiles: current.todayExportJerseys + jerseyCount
  };
  saveAndBroadcastStats(updated);

  // 3. Persist to Supabase plugin_usage_logs (asynchronous & non-blocking)
  try {
    let currentUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) currentUserId = user.id;
    } catch (e) {}

    await supabase.from('plugin_usage_logs').insert({
      user_id: currentUserId || 'guest',
      plugin_type: 'export_tracker',
      action: 'export_files',
      details: {
        fileCount,
        jerseyCount,
        customerName: params.customerName || '',
        orderNum: params.orderNum || '',
        date: todayStr,
        timestamp: now,
        userEmail: params.userEmail || ''
      }
    });
  } catch (syncErr) {
    console.warn("Supabase export tracker log warning:", syncErr);
  }

  return updated;
}
