'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error ? 'Authentication failed. Please check your credentials.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (result?.error) {
        setErrorMessage('Invalid email or password.');
        setIsLoading(false);
      } else {
        // Hard navigation forces a full reload so server components, every
        // React context (Access, Activity, Sidebar, Header), and useSession()
        // all see the new cookie. router.push + refresh leaves stale client
        // state in places — particularly when the destination was previously
        // viewable as the (no longer existing) GUEST fallback.
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden">
      <div className="mb-10 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Secure Access</h2>
        <p className="text-slate-400 text-[13px] font-medium leading-relaxed">Enter your corporate credentials to initiate your operational session.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-bold"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMessage}
          </motion.div>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Principal Email</label>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="email"
              aria-label="Principal Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-sm font-semibold shadow-sm"
              placeholder="admin@suler.com"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secret Key</label>
            <a href="#" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">Forgot Access?</a>
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="password"
              aria-label="Secret Key"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-sm font-semibold shadow-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-[13px] uppercase tracking-[0.1em] py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3 group relative"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Initiate Operational Session
              <ShieldCheck className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>
      </form>

      {process.env.NEXT_PUBLIC_GOOGLE_SSO_ENABLED === 'true' && (
        <>
          <div className="my-7 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <button
            type="button"
            aria-label="Sign in with Google"
            onClick={() => signIn('google', { redirectTo: callbackUrl })}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[13px] uppercase tracking-[0.1em] py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </>
      )}

      {/* Dev-only seeded credentials hint. Never rendered in production
          builds — `NEXT_PUBLIC_SHOW_SEED_CREDENTIALS=true` opts in for
          short-lived demo deploys (e.g. staging review apps). */}
      {(process.env.NODE_ENV !== 'production'
        || process.env.NEXT_PUBLIC_SHOW_SEED_CREDENTIALS === 'true') && (
        <div className="mt-12 pt-10 border-t border-slate-50">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em]">Seeded Demo Credentials (dev only)</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Principal</span>
              <code className="text-xs text-indigo-600 font-bold">admin@suler.com</code>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secret</span>
              <code className="text-xs text-indigo-600 font-bold">Admin123!</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center py-12 px-8 selection:bg-indigo-100 selection:text-indigo-900 font-sans relative">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] relative z-10"
      >
        {/* Workspace Brand Identity */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-[20px] bg-white shadow-premium flex items-center justify-center mb-6 border border-slate-100">
            <div className="w-11 h-11 rounded-[14px] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Suler EMS</h1>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">Operational Workspace v4.5</p>
        </div>

        {/* Secure Command Surface wrapped in Suspense */}
        <Suspense fallback={<div className="flex items-center justify-center p-12 bg-white rounded-[40px] shadow-sm border border-slate-100"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
          <LoginContent />
        </Suspense>

        {/* Global Compliance Footer */}
        <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale contrast-125">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">ISO 27001 Certified</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">SOC2 Governance</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
