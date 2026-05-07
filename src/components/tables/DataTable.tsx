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
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium overflow-hidden transition-all duration-300">
      {/* Executive Command Toolbar */}
      <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          {title && <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>}
          {description && <p className="text-[13px] font-bold text-slate-400 mt-1 tracking-tight">{description}</p>}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search registry..." 
              className="bg-slate-50/50 border border-slate-200/50 rounded-2xl py-3 pl-12 pr-6 text-[13px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all w-72 shadow-sm"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all shadow-sm">
            <Filter className="w-4.5 h-4.5" />
          </button>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all shadow-sm">
            <Download className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Registry Stream */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-50">
              {columns.map((col, i) => (
                <th key={i} className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                  {col.header}
                </th>
              ))}
              <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="group hover:bg-slate-50/40 transition-colors duration-200">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-10 py-6 text-[14px] font-bold text-slate-700 tracking-tight">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                  </td>
                ))}
                <td className="px-10 py-6 text-right">
                  <button className="p-2 text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Principal Pagination Controller */}
      <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Registry Index: 1-10
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Depth: {data.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-200 hover:text-indigo-600 disabled:opacity-20 transition-colors" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(p => (
              <button 
                key={p} 
                className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                  p === 1 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="p-2.5 text-slate-200 hover:text-indigo-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
