import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal, Eye, CreditCard, FileText, Trash2, Package, CheckSquare, Square } from 'lucide-react';
import { STATUS_COLORS, STATUS_LABELS, fmt } from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

export type RowAction = 'view' | 'edit' | 'payment' | 'invoice' | 'whatsapp' | 'delete' | 'convert' | 'duplicate';

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface Props<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  actions: RowAction[];
  onAction: (action: RowAction, row: T) => void;
  emptyTitle?: string;
  emptyDesc?: string;
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
}

const ACTION_CONFIG: Record<RowAction, { icon: React.FC<{size?: number}>, label: string, cls?: string }> = {
  view:      { icon: Eye,          label: 'View'              },
  edit:      { icon: FileText,     label: 'Edit'              },
  payment:   { icon: CreditCard,   label: 'Receive Payment'   },
  invoice:   { icon: FileText,     label: 'View Invoice'      },
  whatsapp:  { icon: MoreHorizontal, label: 'Share WhatsApp'  },
  delete:    { icon: Trash2,       label: 'Delete', cls: 'text-red-600 hover:bg-red-50' },
  convert:   { icon: ChevronDown,  label: 'Convert to Order'  },
  duplicate: { icon: Package,      label: 'Duplicate'         },
};

export default function TransactionTable<T extends { id: string }>({
  columns, rows, actions, onAction,
  emptyTitle = 'No Records Found',
  emptyDesc = 'No transactions to display.',
  onAdd, addLabel = '+ Add New',
  pageSize: defaultPageSize = 25,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuRow, setMenuRow] = useState<string | null>(null);

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as Record<string,unknown>)[sortKey];
    const bv = (b as Record<string,unknown>)[sortKey];
    if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    setSelected(selected.size === visible.length ? new Set() : new Set(visible.map(r => r.id)));
  };

  const primaryActions = actions.filter(a => ['view','payment','delete'].includes(a));
  const moreActions = actions.filter(a => !['view','payment','delete'].includes(a));

  const renderCell = (col: Column<T>, row: T) => {
    if (col.render) return col.render(row);
    const val = (row as Record<string,unknown>)[col.key];
    if (val === undefined || val === null) return <span className="text-[#71717A]">—</span>;
    if (typeof val === 'string' && STATUS_LABELS[val]) {
      return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border', STATUS_COLORS[val])}>
          {STATUS_LABELS[val]}
        </span>
      );
    }
    if (typeof val === 'number') return <span>{fmt(val)}</span>;
    return <span>{String(val)}</span>;
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-[#E8E4DE] rounded-2xl bg-white">
        <Package size={42} className="mx-auto text-[#D8D5CF] mb-3" />
        <p className="text-[#171717] font-semibold text-lg">{emptyTitle}</p>
        <p className="text-sm text-[#71717A] mt-1 max-w-xs mx-auto">{emptyDesc}</p>
        {onAdd && (
          <button onClick={onAdd} className="mt-5 px-5 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B]">
            {addLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="flex items-center gap-3 px-4 py-2.5 bg-[#E4572E]/10 border border-[#E4572E]/30 rounded-xl">
            <span className="text-sm font-semibold text-[#E4572E]">{selected.size} row{selected.size>1?'s':''} selected</span>
            <button onClick={() => { if(confirm(`Delete ${selected.size} records?`)) setSelected(new Set()); }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100">
              <Trash2 size={12}/> Delete Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-[#52525B] hover:text-[#171717]">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5]">
              <th className="w-10 px-4 py-3">
                <button onClick={toggleAll} className="text-[#71717A] hover:text-[#E4572E]">
                  {selected.size === visible.length && visible.length > 0 ? <CheckSquare size={16}/> : <Square size={16}/>}
                </button>
              </th>
              {columns.map(col => (
                <th key={col.key}
                  className={cn('text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A]', col.hideOnMobile && 'hidden md:table-cell', col.sortable && 'cursor-pointer hover:text-[#171717] select-none')}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(row => (
              <tr key={row.id}
                className={cn('border-t border-[#E8E4DE] hover:bg-[#FAF8F5] transition-colors', selected.has(row.id) && 'bg-[#FDF2ED]')}
              >
                <td className="px-4 py-3">
                  <button onClick={() => toggleSelect(row.id)} className="text-[#71717A] hover:text-[#E4572E]">
                    {selected.has(row.id) ? <CheckSquare size={15} className="text-[#E4572E]"/> : <Square size={15}/>}
                  </button>
                </td>
                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm text-[#171717]', col.hideOnMobile && 'hidden md:table-cell')}>
                    {renderCell(col, row)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {primaryActions.map(a => {
                      const cfg = ACTION_CONFIG[a];
                      const Icon = cfg.icon;
                      return (
                        <button key={a} title={cfg.label} onClick={() => onAction(a, row)}
                          className={cn('p-1.5 rounded-lg hover:bg-[#F0EDE8] transition-colors', cfg.cls)}>
                          <Icon size={15}/>
                        </button>
                      );
                    })}
                    {moreActions.length > 0 && (
                      <div className="relative">
                        <button onClick={() => setMenuRow(menuRow === row.id ? null : row.id)}
                          className="p-1.5 rounded-lg hover:bg-[#F0EDE8]">
                          <MoreHorizontal size={15} className="text-[#71717A]"/>
                        </button>
                        <AnimatePresence>
                          {menuRow === row.id && (
                            <motion.div
                              initial={{opacity:0,scale:0.95,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:-4}}
                              className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-30"
                              onMouseLeave={() => setMenuRow(null)}
                            >
                              {moreActions.map(a => {
                                const cfg = ACTION_CONFIG[a];
                                const Icon = cfg.icon;
                                return (
                                  <button key={a} onClick={() => { onAction(a, row); setMenuRow(null); }}
                                    className={cn('flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#171717] hover:bg-[#F5F3EF]', cfg.cls)}>
                                    <Icon size={13}/>{cfg.label}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-[#71717A]">
        <span>Showing {start+1}–{Math.min(start+pageSize, total)} of {total}</span>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 rounded-lg border border-[#E8E4DE] text-xs">
            {[25,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-medium hover:bg-[#F5F3EF] disabled:opacity-40 disabled:cursor-not-allowed">
            ← Prev
          </button>
          <span className="text-xs font-semibold">Page {page} / {pages}</span>
          <button disabled={page===pages} onClick={() => setPage(p=>p+1)}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-medium hover:bg-[#F5F3EF] disabled:opacity-40 disabled:cursor-not-allowed">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
