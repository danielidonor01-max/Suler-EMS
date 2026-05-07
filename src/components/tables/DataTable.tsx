'use client';

import React from 'react';
import { MoreHorizontal, Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export const DataTable: React.FC<DataTableProps> = ({ columns, data, title, description }) => {
  return (
    <div className="space-y-6">
      {/* Table Command Surface */}
      {(title || description) && (
        <div className="flex items-end justify-between px-2">
          <div>
            {title && <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h3>}
            {description && <p className="text-sm font-medium text-slate-400 mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter results..." 
                className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all w-64 shadow-sm"
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lightweight Table Container */}
      <div className="bg-white rounded-[32px] border border-slate-100/50 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {columns.map((col, i) => (
                  <th key={i} className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                    {col.header}
                  </th>
                ))}
                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="group hover:bg-slate-50/50 transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-8 py-5 text-[13px] font-semibold text-slate-700">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Minimalist Pagination */}
        <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Showing 1-10 of {data.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button className="p-2 text-slate-300 hover:text-slate-600 disabled:opacity-30" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button key={p} className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${p === 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button className="p-2 text-slate-300 hover:text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
