'use client';

import React from 'react';
import { MoreHorizontal, Search, Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  description?: string;
  onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  columns, 
  data, 
  title, 
  description,
  onRowClick
}) => {
  return (
    <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300">
      {/* Executive Command Toolbar */}
      <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {title && <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>}
          {description && <p className="text-[12px] font-bold text-slate-400 mt-0.5 tracking-tight">{description}</p>}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-slate-50 border border-slate-100 rounded-xl py-2 pl-11 pr-6 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Registry Stream */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-50">
              {columns.map((col, i) => (
                <th key={i} className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {col.header}
                </th>
              ))}
              <th className="px-8 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`group transition-colors duration-200 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/60' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-8 py-5 text-[13px] font-bold text-slate-700 tracking-tight">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                     <button className="p-1.5 text-slate-200 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                        <Eye className="w-4 h-4" />
                     </button>
                     <button className="p-1.5 text-slate-200 hover:text-slate-900 transition-all">
                        <MoreHorizontal className="w-4.5 h-4.5" />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controller */}
      <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Index: 1-10
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total: {data.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-200 hover:text-slate-900 disabled:opacity-20" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(p => (
              <button 
                key={p} 
                className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                  p === 1 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="p-2 text-slate-200 hover:text-slate-900">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
