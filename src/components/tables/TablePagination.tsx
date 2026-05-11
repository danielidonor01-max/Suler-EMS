import React from 'react';

export interface TablePaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  className = ''
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Simple array for demo purposes, could be expanded for responsive ellipsis
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`p-4 border-t border-border flex items-center justify-between ${className}`}>
      <span className="text-sm text-text-muted">
        Showing {startItem} to {endItem} of {totalItems} entries
      </span>
      <div className="flex gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-border rounded-md text-sm text-text-secondary hover:bg-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              currentPage === page 
                ? 'bg-primary text-white border border-primary' 
                : 'border border-border text-text-secondary hover:bg-bg'
            }`}
          >
            {page}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-border rounded-md text-sm text-text-secondary hover:bg-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
