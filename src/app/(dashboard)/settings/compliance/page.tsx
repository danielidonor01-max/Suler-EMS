"use client";

/**
 * /settings/compliance — DEPRECATED stub.
 *
 * The compliance & tax controls that used to live here (PAYE bands,
 * pension rates, NHF, NHIS, CRA) now live at /payroll/statutory-rates
 * under Accounts & Finance. The HR-side page is the richer surface and
 * the single source of truth — keeping a duplicate stub here meant HR
 * could edit on one screen while admins saw stale state on another.
 *
 * This file stays in the tree so deep links / bookmarks resolve, but
 * it just routes the user to the canonical page.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function ComplianceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Hard-replace so the user can't back-button into the stub.
    router.replace('/payroll/statutory-rates');
  }, [router]);

  return (
    <div className="section-breathing max-w-[700px] mx-auto p-12">
      <div className="bg-white rounded-[20px] border border-slate-200 p-10 space-y-5 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Moved</h1>
          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
            Compliance &amp; tax controls now live at <strong>Payroll → Statutory Rates</strong>. Redirecting…
          </p>
        </div>
        <Link
          href="/payroll/statutory-rates"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest"
        >
          Go now <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
