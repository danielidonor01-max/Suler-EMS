"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit3,
  UserMinus,
  History,
  UserCog
} from 'lucide-react';

import { PermissionType } from '@/modules/auth/domain/permission.model';
import { useAccess } from '@/context/AccessContext';
import { Lock } from 'lucide-react';
import { Portal } from '../common/Portal';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface RowAction {
  label: string;
  icon: any;
  onClick: (row: any) => void;
  variant?: 'default' | 'danger';
  hidden?: boolean | ((row: any) => boolean);
  permission?: PermissionType;
}

/**
 * Per-table filter declaration. Each filter renders as a dropdown chip
 * above the table.
 *
 *   key       — accessor on the row (supports dotted paths like
 *               "employee.hub.name" for nested data)
 *   label     — display label on the chip
 *   options   — selectable values; the empty-string value clears the filter
 *   accessor  — optional function for derived filter targets that aren't a
 *               simple property path (e.g. computed status, joined fields).
 *               Falls back to walking `key` when omitted.
 */
export interface FilterDef {
  key: string;
  label: string;
  options: Array<{ label: string; value: string }>;
  accessor?: (row: any) => string | null | undefined;
}

interface DataTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  totalItems?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  rowActions?: RowAction[];
  filters?: FilterDef[];
  recoveryAction?: {
    label: string;
    onClick: () => void;
    icon?: any;
  };
}

import { Select } from '../forms/Select';

export const DataTable: React.FC<DataTableProps> = ({
  title,
  description,
  data,
  columns,
  onRowClick,
  totalItems,
  isLoading = false,
  emptyMessage = "No records found in this registry.",
  rowActions,
  filters,
  recoveryAction
}) => {
  const [activeActions, setActiveActions] = useState<{ id: string, rect: DOMRect, row: any } | null>(null);
  const [pageSize, setPageSize] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Reset page to 1 if search query, filter selections, or data length changes.
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchQuery, filterValues]);

  const setFilter = (key: string, value: string) => {
    setFilterValues(prev => {
      // Empty string clears the filter — drop the key entirely so the
      // active-filter count stays accurate.
      if (!value) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearAllFilters = () => setFilterValues({});

  const activeFilterCount = Object.keys(filterValues).length;

  const handleActionClick = (e: React.MouseEvent, id: string, row: any) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveActions(activeActions?.id === id ? null : { id, rect, row });
  };

  // Walks a dotted accessor path like "employee.hub.name" against a row.
  // Used by FilterDef when no custom accessor is supplied.
  const resolveAccessor = React.useCallback((row: any, path: string): unknown => {
    return path.split('.').reduce((obj: any, k) => (obj == null ? obj : obj[k]), row);
  }, []);

  // Client-side filter + search pipeline. Filters run first because they
  // typically slash the dataset more aggressively than free-text search.
  const filteredData = React.useMemo(() => {
    let result = data;

    if (filters && Object.keys(filterValues).length > 0) {
      result = result.filter(row =>
        filters.every(def => {
          const selected = filterValues[def.key];
          if (!selected) return true; // no filter on this key
          const value = def.accessor ? def.accessor(row) : resolveAccessor(row, def.key);
          return value != null && String(value) === selected;
        }),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = row[col.accessor];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        }),
      );
    }

    return result;
  }, [data, filterValues, filters, searchQuery, columns, resolveAccessor]);

  const finalTotalItems = totalItems !== undefined ? totalItems : filteredData.length;
  const limit = parseInt(pageSize);
  const totalPages = Math.ceil(finalTotalItems / limit);
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (activePage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, finalTotalItems);

  // Client-side pagination slicing
  const paginatedData = React.useMemo(() => {
    return filteredData.slice(startIndex, startIndex + limit);
  }, [filteredData, startIndex, limit]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (activePage > 3) {
        pages.push(-1); // ellipsis
      }
      const start = Math.max(2, activePage - 1);
      const end = Math.min(totalPages - 1, activePage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (activePage < totalPages - 2) {
        pages.push(-2); // ellipsis
      }
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Header Layer: Contextual Workspace Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tighter">{title}</h2>
          {description && (
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input
              type="text"
              aria-label="Filter records"
              placeholder="Filter records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 pl-11 pr-4 text-[12px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-400 transition-all w-64 shadow-sm"
            />
          </div>
          {(filters && filters.length > 0) ? (
            <div className="flex items-center gap-1.5 h-[40px] px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              <Filter className="w-3.5 h-3.5 stroke-[1.5px]" />
              {activeFilterCount > 0 ? (
                <span className="text-slate-900">{activeFilterCount} Active</span>
              ) : (
                <span>Filters</span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Filter chip row — only renders when consumer page declared filters */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {filters.map(def => (
            <div key={def.key} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-0.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{def.label}</span>
              <Select
                variant="minimal"
                value={filterValues[def.key] ?? ''}
                onChange={(val) => setFilter(def.key, val)}
                options={[{ label: 'All', value: '' }, ...def.options]}
                className="w-28"
              />
            </div>
          ))}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table Surface: Anchored Operational Registry */}
      <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-premium overflow-hidden group">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] first:w-[40%]">
                    {col.header}
                  </th>
                ))}
                {rowActions && (
                  <th className="w-[96px] pr-8 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse" aria-hidden="true">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-8 py-5">
                         <div className="h-4 bg-slate-50 rounded-lg w-full" />
                      </td>
                    ))}
                    {rowActions && (
                      <td className="w-[96px] pr-8 py-5">
                         <div className="h-8 w-8 bg-slate-50 rounded-lg ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => {
                  const uniqueId = `row-${startIndex + rowIdx}`;
                  return (
                    <tr 
                      key={uniqueId} 
                      onClick={() => onRowClick?.(row)}
                      className="group/row transition-all hover:bg-slate-50 cursor-pointer"
                    >
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className="px-8 py-4 align-middle">
                          {col.render ? col.render(row[col.accessor], row) : (
                            <span className="text-[13px] font-bold text-slate-600">{row[col.accessor]}</span>
                          )}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="w-[96px] pr-8 py-4 text-right align-middle">
                           <div className="flex justify-end">
                              <button
                                type="button"
                                aria-label="Row actions"
                                onClick={(e) => handleActionClick(e, uniqueId, row)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  activeActions?.id === uniqueId ? 'bg-slate-900 text-white shadow-md' : 'text-slate-300 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'
                                }`}
                              >
                                 <MoreHorizontal className="w-4 h-4 stroke-[1.5px]" />
                              </button>
                           </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="px-8 py-24 text-center">
                    <p className="text-[15px] font-bold text-slate-400">{emptyMessage}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Global Action Menu Portal */}
        {activeActions && (
          <Portal>
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setActiveActions(null)}
            />
            <div 
              className="fixed z-[101] w-52 bg-white border border-slate-200 rounded-[16px] shadow-premium py-2 animate-in zoom-in-95 duration-200"
              style={{ 
                top: activeActions.rect.bottom + 8, 
                left: activeActions.rect.right - 208,
                ...(activeActions.rect.bottom + 250 > window.innerHeight && {
                   top: 'auto',
                   bottom: window.innerHeight - activeActions.rect.top + 8,
                })
              }}
            >
                {rowActions ? rowActions.map((action, aIdx) => {
                  const isHidden = typeof action.hidden === 'function' ? action.hidden(activeActions.row) : action.hidden;
                  if (isHidden) return null;
                  
                  return (
                    <React.Fragment key={aIdx}>
                      {action.variant === 'danger' && aIdx > 0 && <div className="h-px bg-slate-100 my-1.5 mx-2" />}
                      <ActionMenuItem 
                        icon={action.icon} 
                        label={action.label} 
                        variant={action.variant}
                        permission={action.permission}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          action.onClick(activeActions.row);
                          setActiveActions(null);
                        }}
                      />
                    </React.Fragment>
                  );
                }) : (
                 <>
                   <ActionMenuItem icon={Edit3} label="Edit Identity" />
                   <ActionMenuItem icon={UserCog} label="Modify Role" />
                   <ActionMenuItem icon={History} label="Audit Trail" />
                   <div className="h-px bg-slate-100 my-1.5 mx-2" />
                   <ActionMenuItem icon={UserMinus} label="Suspend Access" variant="danger" />
                 </>
               )}
            </div>
          </Portal>
        )}
        
        {/* Enterprise Pagination: Tighter Segmented Treatment */}
        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-400 tracking-tight">
              Showing <span className="text-slate-900 font-bold">{finalTotalItems === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="text-slate-900 font-bold">{finalTotalItems}</span> records
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <Select 
              variant="minimal"
              value={pageSize}
              onChange={(val) => {
                setPageSize(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'Rows: 10', value: '10' },
                { label: 'Rows: 25', value: '25' },
                { label: 'Rows: 50', value: '50' }
              ]}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
            >
               <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center">
               {getPageNumbers().map((p, idx) => {
                 if (p < 0) {
                   return <span key={`ellipsis-${idx}`} className="px-2 text-slate-300 text-[11px] font-bold">...</span>;
                 }
                 return (
                   <PageButton 
                     key={p} 
                     label={String(p)} 
                     active={p === activePage} 
                     onClick={() => setCurrentPage(p)}
                   />
                 );
               })}
            </div>
            <button 
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages || totalPages === 0}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
            >
               <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageButton = ({ label, active, onClick }: { label: string, active?: boolean, onClick: () => void }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {label}
  </button>
);

const ActionMenuItem = ({ icon: Icon, label, variant, onClick, permission }: any) => {
  const { checkPermission } = useAccess();
  const isAllowed = !permission || checkPermission(permission).allowed;

  return (
    <button 
      onClick={isAllowed ? onClick : undefined}
      disabled={!isAllowed}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-bold transition-all ${
        !isAllowed 
          ? 'opacity-40 grayscale cursor-not-allowed text-slate-400' 
          : 'hover:bg-slate-50 ' + (variant === 'danger' ? 'text-rose-500' : 'text-slate-600 hover:text-slate-900')
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 stroke-[1.5px]" />
        {label}
      </div>
      {!isAllowed && <Lock className="w-3 h-3 text-slate-300" />}
    </button>
  );
};
