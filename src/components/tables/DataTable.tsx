"use client";

import React from 'react';
import { Search, Filter, ArrowRight, MoreHorizontal } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  description, 
  data, 
  columns,
  onRowClick 
}) => {
  return (
    <div className="space-y-6 animate-in">
      {/* Header Layer: Floating on Canvas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tighter">{title}</h2>
          {description && (
            <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter registry..." 
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[12px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-400 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Surface: Floating Premium Rail */}
      <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden group">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map((col, idx) => (
                  <th key={idx} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {col.header}
                  </th>
                ))}
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {data.map((row, rowIdx) => (
                <tr 
                  key={rowIdx} 
                  onClick={() => onRowClick?.(row)}
                  className={`group/row transition-all hover:bg-slate-50/80 cursor-pointer ${onRowClick ? 'active:scale-[0.995]' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-8 py-5">
                      <div className="transition-transform group-hover/row:translate-x-0.5 duration-300">
                        {col.render ? col.render(row[col.accessor], row) : (
                          <span className="text-[13px] font-bold text-slate-600">{row[col.accessor]}</span>
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                       <ArrowRight className="w-4 h-4 text-slate-300 group-hover/row:text-slate-900 transition-all" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Registry Pagination: Quiet Metadata */}
        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Showing {data.length} operational records</span>
          <div className="flex gap-1">
             {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-slate-900' : 'bg-slate-200'}`} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
