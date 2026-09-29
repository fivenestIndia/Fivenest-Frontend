// ─── Orders & Order Definitions Cloud Sync Service (Supabase) ─────────────────
// Moves order definitions (~2 KB JSON) into Supabase database so users can
// access their orders from any device without hitting localStorage limits.
// Provides 2-way sync, debounced saves, instant local fallback, and cross-device sync.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabaseClient';
import type { OrderStore, Customer, ManufacturerOrder, DesignerBill, PrintingOrder, Payment, Quotation } from '../hooks/useOrderStore';

const BACKEND_BASE = 'https://fivenest-backend.onrender.com';
const STORAGE_KEY = 'fn_orders_v1';
let syncTimer: any = null;
let isSaving = false;

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
type SyncStatusListener = (status: CloudSyncStatus, lastSyncedAt?: Date) => void;
const listeners = new Set<SyncStatusListener>();

let currentStatus: CloudSyncStatus = 'synced';
let lastSyncedTime: Date | undefined = undefined;

export function subscribeSyncStatus(listener: SyncStatusListener): () => void {
  listeners.add(listener);
  listener(currentStatus, lastSyncedTime);
  return () => {
    listeners.delete(listener);
  };
}

function notifyStatus(status: CloudSyncStatus) {
  currentStatus = status;
  if (status === 'synced') {
    lastSyncedTime = new Date();
  }
  listeners.forEach(fn => fn(currentStatus, lastSyncedTime));
}

/**
 * Helper to get active user ID and email from Supabase Auth or active user storage
 */
export async function getActiveUserContext(): Promise<{ userId?: string; email?: string } | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      return {
        userId: authData.user.id,
        email: authData.user.email
      };
    }
  } catch (e) {
    // Ignore auth fetch failure
  }

  // Fallback to active user session in localStorage
  try {
    const activeStr = localStorage.getItem('fivenest_active_user');
    if (activeStr) {
      const parsed = JSON.parse(activeStr);
      if (parsed?.id || parsed?.email) {
        return {
          userId: parsed.id,
          email: parsed.email
        };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Merge local and remote stores without duplicate entries
 */
export function mergeOrderStores(local: OrderStore, remote: OrderStore): OrderStore {
  if (!remote) return local;
  if (!local) return remote;

  // Merge customers
  const custMap = new Map<string, Customer>();
  (remote.customers || []).forEach(c => c && c.id && custMap.set(c.id, c));
  (local.customers || []).forEach(c => c && c.id && custMap.set(c.id, c));

  // Merge manufacturer orders
  const mfgMap = new Map<string, ManufacturerOrder>();
  (remote.manufacturerOrders || []).forEach(o => o && o.id && mfgMap.set(o.id, o));
  (local.manufacturerOrders || []).forEach(o => o && o.id && mfgMap.set(o.id, o));

  // Merge designer bills
  const dsgMap = new Map<string, DesignerBill>();
  (remote.designerBills || []).forEach(b => b && b.id && dsgMap.set(b.id, b));
  (local.designerBills || []).forEach(b => b && b.id && dsgMap.set(b.id, b));

  // Merge printing orders
  const prtMap = new Map<string, PrintingOrder>();
  (remote.printingOrders || []).forEach(p => p && p.id && prtMap.set(p.id, p));
  (local.printingOrders || []).forEach(p => p && p.id && prtMap.set(p.id, p));

  // Merge payments
  const payMap = new Map<string, Payment>();
  (remote.payments || []).forEach(p => p && p.id && payMap.set(p.id, p));
  (local.payments || []).forEach(p => p && p.id && payMap.set(p.id, p));

  // Merge quotations
  const quoMap = new Map<string, Quotation>();
  (remote.quotations || []).forEach(q => q && q.id && quoMap.set(q.id, q));
  (local.quotations || []).forEach(q => q && q.id && quoMap.set(q.id, q));

  // Counters take max
  const counters = {
    mfg: Math.max(local.counters?.mfg || 0, remote.counters?.mfg || 0),
    dsg: Math.max(local.counters?.dsg || 0, remote.counters?.dsg || 0),
    prt: Math.max(local.counters?.prt || 0, remote.counters?.prt || 0),
    pay: Math.max(local.counters?.pay || 0, remote.counters?.pay || 0),
    quo: Math.max(local.counters?.quo || 0, remote.counters?.quo || 0),
  };

  return {
    customers: Array.from(custMap.values()),
    manufacturerOrders: Array.from(mfgMap.values()),
    designerBills: Array.from(dsgMap.values()),
    printingOrders: Array.from(prtMap.values()),
    printingServices: local.printingServices || remote.printingServices,
    payments: Array.from(payMap.values()),
    quotations: Array.from(quoMap.values()),
    counters
  };
}

/**
 * Fetch latest order definitions (~2 KB JSON) from Supabase database
 */
export async function fetchCloudOrderStore(): Promise<OrderStore | null> {
  const user = await getActiveUserContext();
  if (!user || (!user.userId && !user.email)) {
    return null;
  }

  notifyStatus('syncing');

  // Strategy 1: Direct Supabase query to plugin_usage_logs (client authenticated)
  if (user.userId) {
    try {
      const { data, error } = await supabase
        .from('plugin_usage_logs')
        .select('details, created_at')
        .eq('user_id', user.userId)
        .eq('plugin_type', 'order_definitions')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.details) {
        notifyStatus('synced');
        return data[0].details as OrderStore;
      }
    } catch (err) {
      console.warn('Direct Supabase order fetch warning:', err);
    }
  }

  // Strategy 2: Backend order store API (which queries Supabase via service role admin key)
  try {
    const params = new URLSearchParams();
    if (user.userId) params.set('userId', user.userId);
    if (user.email) params.set('email', user.email);

    const res = await fetch(`${BACKEND_BASE}/api/orders/store?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.orderStore) {
        notifyStatus('synced');
        return json.orderStore as OrderStore;
      }
    }
  } catch (err) {
    console.warn('Backend order store fetch warning:', err);
  }

  notifyStatus('offline');
  return null;
}

/**
 * Save order definitions (~2 KB JSON) to Supabase database
 */
export async function saveCloudOrderStore(store: OrderStore): Promise<boolean> {
  const user = await getActiveUserContext();
  if (!user || (!user.userId && !user.email)) {
    return false;
  }

  notifyStatus('syncing');

  let saved = false;

  // Strategy 1: Direct Supabase insert to plugin_usage_logs
  if (user.userId) {
    try {
      const { error } = await supabase
        .from('plugin_usage_logs')
        .insert({
          user_id: user.userId,
          plugin_type: 'order_definitions',
          action: 'sync_orders',
          details: store
        });

      if (!error) {
        saved = true;
      }
    } catch (err) {
      console.warn('Direct Supabase order save error:', err);
    }
  }

  // Strategy 2: Backend order store API (ensures persistence via service_role admin and fallback)
  try {
    const res = await fetch(`${BACKEND_BASE}/api/orders/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.userId,
        email: user.email,
        orderStore: store
      })
    });
    if (res.ok) {
      saved = true;
    }
  } catch (err) {
    console.warn('Backend order store save error:', err);
  }

  if (saved) {
    notifyStatus('synced');
  } else {
    notifyStatus('error');
  }

  return saved;
}

/**
 * Schedule a debounced cloud sync save (e.g. 800ms)
 */
export function queueCloudOrderSave(store: OrderStore) {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(async () => {
    if (isSaving) return;
    try {
      isSaving = true;
      await saveCloudOrderStore(store);
    } finally {
      isSaving = false;
    }
  }, 800);
}
