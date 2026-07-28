import React, { useState, useRef } from 'react';
import { HardDrive, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

// All localStorage keys that belong to FiveNest local data.
// Auth session and wallet are managed by Supabase — not stored here.
const LOCAL_DATA_KEY_PREFIXES = [
  'fivenest_',
  'teedex_',
];

/** Collect all FiveNest localStorage keys. */
function collectLocalKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && LOCAL_DATA_KEY_PREFIXES.some(p => key.startsWith(p))) {
      // Skip Supabase auth tokens
      if (key.startsWith('sb-') || key.includes('supabase')) continue;
      keys.push(key);
    }
  }
  return keys;
}

/** Download all local production data as a .json file */
export function exportAllLocalData(): void {
  const keys = collectLocalKeys();
  const data: Record<string, any> = {
    _meta: {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0',
      description: 'FiveNest Studio local data backup. Auth and wallet remain in Supabase.'
    }
  };

  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw === null) return;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw; // plain string
    }
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `fivenest_backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restore all local data from a backup JSON file */
export function importLocalData(jsonText: string): { restored: number; skipped: number } {
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid backup file — could not parse JSON.');
  }

  let restored = 0;
  let skipped = 0;

  Object.entries(parsed).forEach(([key, value]) => {
    if (key === '_meta') return; // skip metadata
    // Only restore fivenest/teedex keys
    if (!LOCAL_DATA_KEY_PREFIXES.some(p => key.startsWith(p))) {
      skipped++;
      return;
    }
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, val);
      restored++;
    } catch {
      skipped++;
    }
  });

  return { restored, skipped };
}

interface LocalDataManagerProps {
  /** If true, renders as a compact icon-only button */
  compact?: boolean;
}

export const LocalDataManager: React.FC<LocalDataManagerProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<'idle' | 'saved' | 'restored' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (type: 'saved' | 'restored' | 'error', msg: string) => {
    setStatus(type);
    setStatusMsg(msg);
    setTimeout(() => {
      setStatus('idle');
      setStatusMsg('');
    }, 3500);
  };

  const handleSave = () => {
    try {
      exportAllLocalData();
      showStatus('saved', 'Backup downloaded!');
    } catch (e: any) {
      showStatus('error', e.message || 'Export failed');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const { restored, skipped } = importLocalData(text);
        showStatus('restored', `Restored ${restored} items${skipped ? ` (${skipped} skipped)` : ''}. Reload to apply.`);
        // Trigger storage event so components re-read prefs
        window.dispatchEvent(new Event('storage-preference-changed'));
      } catch (err: any) {
        showStatus('error', err.message || 'Restore failed');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const iconColor =
    status === 'saved' ? '#00e676' :
    status === 'restored' ? '#00b0ff' :
    status === 'error' ? '#ff5252' :
    'var(--text-muted)';

  const Icon =
    status === 'saved' || status === 'restored' ? CheckCircle :
    status === 'error' ? AlertTriangle :
    HardDrive;

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <button
            title="Save / Backup Local Data"
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '5px 9px',
              cursor: 'pointer',
              color: iconColor,
              fontSize: '11px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={13} />
            {status === 'idle' ? 'Save Data' : statusMsg.length > 20 ? statusMsg.slice(0, 18) + '…' : statusMsg}
          </button>
          <button
            title="Restore from Backup"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '5px 8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload size={13} />
          </button>
        </div>
      </>
    );
  }

  // Full version (for sidebar footer or settings page)
  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
        <HardDrive size={14} style={{ color: 'var(--color-secondary)' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-secondary)' }}>LOCAL DATA</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Saved on your machine</span>
      </div>

      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
        All production data, presets, orders & billing are saved locally. Only login & wallet credits use Supabase.
      </p>

      {status !== 'idle' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px',
          borderRadius: '7px',
          marginBottom: '10px',
          background: status === 'error' ? 'rgba(255,82,82,0.1)' : 'rgba(0,230,118,0.1)',
          border: `1px solid ${status === 'error' ? 'rgba(255,82,82,0.2)' : 'rgba(0,230,118,0.2)'}`,
          fontSize: '11px',
          color: status === 'error' ? '#ff5252' : '#00e676',
        }}>
          {status === 'error'
            ? <AlertTriangle size={12} />
            : <CheckCircle size={12} />}
          {statusMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 8px',
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '8px',
            color: 'var(--color-secondary)',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Download size={13} />
          💾 Save Data
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={13} />
          Restore
        </button>
      </div>
    </div>
  );
};
