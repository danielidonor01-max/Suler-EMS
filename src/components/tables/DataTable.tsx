import React from 'react';
import { EmptyState } from '../ui/EmptyState';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({ data, columns, keyExtractor, emptyState, className = '' }: DataTableProps<T>) {
  if (data.length === 0) {
    return emptyState ? <>{emptyState}</> : (
      <EmptyState
        icon={
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        }
        title="No data available"
      />
    );
  }

  return (
    <div className={`table-responsive ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((col, idx) => (
                <td 
                  key={idx} 
                  className={`${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}
                >
                  {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
