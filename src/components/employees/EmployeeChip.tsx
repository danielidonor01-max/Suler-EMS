'use client';

/**
 * Reusable clickable employee chip.
 *
 * Drop-in replacement for the standard "round avatar + name" pair
 * scattered across tables, cards, modals, and dashboards. Clicking
 * the chip opens the central EmployeeProfileModal via the global
 * EmployeeProfileContext.
 *
 * Variants:
 *   size="sm" — compact, for table cells / list rows
 *   size="md" — default, for cards / detail strips
 *   size="lg" — feature, for hero headers
 *
 *   sublabel — optional secondary line (job title, role, status…)
 *
 *   nameOnly — render only the name (no avatar) — useful when the
 *              row already has an avatar elsewhere and you want
 *              just the linkable name.
 */

import React from 'react';
import { useEmployeeProfile } from '@/context/EmployeeProfileContext';

interface Props {
  employeeId: string;
  name: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  nameOnly?: boolean;
  className?: string;
}

export function EmployeeChip({
  employeeId, name, sublabel, size = 'md', nameOnly, className,
}: Props) {
  const { openProfile } = useEmployeeProfile();

  if (!employeeId) {
    // Render the visual without click affordance when there's no id to
    // open against — e.g. unassigned manager slots.
    return <StaticChip name={name} sublabel={sublabel} size={size} nameOnly={nameOnly} className={className} />;
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: { box: 'w-7 h-7 text-[10px]', name: 'text-[12px]', sub: 'text-[10px]' },
    md: { box: 'w-9 h-9 text-[11px]', name: 'text-[13px]', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12 text-[13px]', name: 'text-[14px]', sub: 'text-[11px]' },
  }[size];

  if (nameOnly) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openProfile(employeeId); }}
        className={`text-left font-bold text-slate-900 hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2 transition-colors ${sizeClasses.name} ${className ?? ''}`}
        aria-label={`Open profile for ${name}`}
      >
        {name}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); openProfile(employeeId); }}
      aria-label={`Open profile for ${name}`}
      className={`group flex items-center gap-3 text-left hover:opacity-90 transition-opacity ${className ?? ''}`}
    >
      <div className={`${sizeClasses.box} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shrink-0`}>
        {initials}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate ${sizeClasses.name}`}>
          {name}
        </span>
        {sublabel && (
          <span className={`text-slate-400 font-bold uppercase tracking-widest truncate ${sizeClasses.sub}`}>
            {sublabel}
          </span>
        )}
      </div>
    </button>
  );
}

function StaticChip({
  name, sublabel, size = 'md', nameOnly, className,
}: {
  name: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  nameOnly?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: { box: 'w-7 h-7 text-[10px]', name: 'text-[12px]', sub: 'text-[10px]' },
    md: { box: 'w-9 h-9 text-[11px]', name: 'text-[13px]', sub: 'text-[10px]' },
    lg: { box: 'w-12 h-12 text-[13px]', name: 'text-[14px]', sub: 'text-[11px]' },
  }[size];

  if (nameOnly) {
    return <span className={`font-bold text-slate-700 ${sizeClasses.name} ${className ?? ''}`}>{name}</span>;
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className={`${sizeClasses.box} rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 shrink-0`}>
        {initials || '?'}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`font-bold text-slate-700 truncate ${sizeClasses.name}`}>{name}</span>
        {sublabel && (
          <span className={`text-slate-400 font-bold uppercase tracking-widest truncate ${sizeClasses.sub}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
