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
}

interface DataTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  totalItems?: number;
<<<<<<< Updated upstream
=======
  isLoading?: boolean;
  emptyMessage?: string;
  rowActions?: RowAction[];
  recoveryAction?: {
    label: string;
    onClick: () => void;
    icon?: any;
  };
>>>>>>> Stashed changes
}

import { Select } from '../forms/Select';

export const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  description, 
  data, 
  columns,
  onRowClick,
<<<<<<< Updated upstream
  totalItems = 284 // Default mock for demo
=======
  totalItems = 284,
  isLoading = false,
  emptyMessage = "No records found in this registry.",
  rowActions,
  recoveryAction
>>>>>>> Stashed changes
}) => {
  const [activeActions, setActiveActions] = useState<{ id: string, rect: DOMRect, row: any } | null>(null);
  const [pageSize, setPageSize] = useState('10');

  const handleActionClick = (e: React.MouseEvent, id: string, row: any) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveActions(activeActions?.id === id ? null : { id, rect, row });
  };

  return (
    <div className="space-y-5 animate-in">
      {/* Header Layer: Contextual Workspace Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tighter">{title}</h2>
          {description && (
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter records..." 
              className="bg-white border border-slate-200 rounded-xl py-2 pl-11 pr-4 text-[12px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-400 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 h-[40px] px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <Filter className="w-3.5 h-3.5 stroke-[1.5px]" />
            Filters
          </button>
        </div>
      </div>

      {/* Table Surface: Anchored Operational Registry */}
      <div className="bg-white border border-slate-200/60 rounded-[20px] shadow-sm overflow-hidden group">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] first:w-[40%]">
                    {col.header}
                  </th>
                ))}
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
<<<<<<< Updated upstream
              {data.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  className="group/row transition-all hover:bg-slate-50/80 cursor-pointer"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-8 py-4" onClick={() => onRowClick?.(row)}>
                      <div className="transition-transform group-hover/row:translate-x-0.5 duration-300">
                        {col.render ? col.render(row[col.accessor], row) : (
                          <span className="text-[13px] font-bold text-slate-600">{row[col.accessor]}</span>
                        )}
                      </div>
=======
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-8 py-5">
                         <div className="h-4 bg-slate-50 rounded-lg w-full" />
                      </td>
                    ))}
                    <td className="px-8 py-5">
                       <div className="h-8 w-8 bg-slate-50 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => onRowClick?.(row)}
                    className="group/row border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-8 py-4 align-middle">
                        {col.render ? col.render(row[col.accessor], row) : (
                          <span className="text-[13px] font-bold text-slate-600">{row[col.accessor]}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-8 py-4 text-right align-middle">
                       <div className="flex justify-end">
                          <button 
                            onClick={(e) => handleActionClick(e, `row-${idx}`, row)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              activeActions?.id === `row-${idx}` ? 'bg-slate-900 text-white shadow-md' : 'text-slate-300 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'
                            }`}
                          >
                             <MoreHorizontal className="w-4 h-4" />
                          </button>
                       </div>
>>>>>>> Stashed changes
                    </td>
                  ))}
                  <td className="px-8 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all translate-x-2 group-hover/row:translate-x-0">
                       <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
                          <Eye className="w-4 h-4 stroke-[1.5px]" />
                       </button>
                       <div className="relative">
                          <button 
                            onClick={(e) => handleActionClick(e, row.id)}
                            className={`p-2 rounded-lg border transition-all shadow-sm ${
                              activeActions?.id === row.id 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'text-slate-400 hover:text-slate-900 hover:bg-white border-transparent hover:border-slate-200'
                            }`}
                          >
                             <MoreHorizontal className="w-4 h-4 stroke-[1.5px]" />
                          </button>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
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
              className="fixed z-[101] w-52 bg-white border border-slate-200 rounded-[18px] shadow-floating py-2 animate-in zoom-in-95 duration-200"
              style={{ 
                top: activeActions.rect.bottom + 8, 
                left: activeActions.rect.right - 208,
                ...(activeActions.rect.bottom + 250 > window.innerHeight && {
                   top: 'auto',
                   bottom: window.innerHeight - activeActions.rect.top + 8,
                })
              }}
            >
               {rowActions ? rowActions.map((action, aIdx) => (
                 <React.Fragment key={aIdx}>
                   {action.variant === 'danger' && aIdx > 0 && <div className="h-px bg-slate-100 my-1.5 mx-2" />}
                   <ActionMenuItem 
                     icon={action.icon} 
                     label={action.label} 
                     variant={action.variant}
                     onClick={(e: React.MouseEvent) => {
                       e.stopPropagation();
                       action.onClick(activeActions.row);
                       setActiveActions(null);
                     }}
                   />
                 </React.Fragment>
               )) : (
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
        <div className="px-8 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-400 tracking-tight">
              Showing <span className="text-slate-900 font-black">1–{pageSize}</span> of <span className="text-slate-900 font-black">{totalItems}</span> records
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <Select 
              variant="minimal"
              value={pageSize}
              onChange={setPageSize}
              options={[
                { label: 'Rows: 10', value: '10' },
                { label: 'Rows: 25', value: '25' },
                { label: 'Rows: 50', value: '50' }
              ]}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm disabled:opacity-30" disabled>
               <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center">
               <PageButton label="1" active />
               <PageButton label="2" />
               <PageButton label="3" />
               <span className="px-2 text-slate-300 text-[11px] font-black">...</span>
               <PageButton label="28" />
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm">
               <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PageButton = ({ label, active }: { label: string, active?: boolean }) => (
  <button className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-black transition-all ${
    active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
  }`}>
    {label}
  </button>
);

const ActionMenuItem = ({ icon: Icon, label, variant, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold transition-all hover:bg-slate-50 ${
      variant === 'danger' ? 'text-rose-500' : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    <Icon className="w-4 h-4 stroke-[1.5px]" />
    {label}
  </button>
);
