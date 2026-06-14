'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';

function ForbiddenContent() {
  const params = useSearchParams();
  const path = params?.get('path');
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-[24px] border border-slate-200 p-10 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-rose-50 mx-auto flex items-center justify-center">
          <ShieldOff className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access denied</h1>
          <p className="text-[13px] text-slate-500 mt-2">
            Your account doesn't have permission to view this page.
            {path && <span className="block text-[11px] text-slate-400 mt-1 font-mono">{path}</span>}
          </p>
        </div>
        <p className="text-[12px] text-slate-500">
          If this is unexpected, ask a Super Admin to grant the required permission on the Roles & Permissions page.
        </p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-[12px] bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[13px] text-slate-500">Loading…</div>}>
      <ForbiddenContent />
    </Suspense>
  );
}
