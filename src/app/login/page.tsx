'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ChevronRight,
  ArrowRight,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccess, RoleName } from '@/context/AccessContext';
import { useToast } from '@/components/common/ToastContext';
import { useActivity } from '@/context/ActivityContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/employees';
  const errorParam = searchParams.get('error');
  const sessionExpired = searchParams.get('expired');
  const { setRole } = useAccess();
  const { toast } = useToast();
  const { pushActivity } = useActivity();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    sessionExpired ? 'Your session expired due to inactivity. Please sign in again.' :
    errorParam ? 'Authentication failed. Identity protocol could not be verified.' : ''
  );
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const SEEDED_CREDENTIALS: { role: string; email: string; pass: string; target: string; roleKey: RoleName }[] = [
    { role: 'Super Administrator', email: 'superadmin@sulerems.dev', pass: 'SulerEMS@2026', target: '/admin/ecc', roleKey: 'SUPER_ADMIN' },
    { role: 'HR Administrator', email: 'hr@sulerems.dev', pass: 'SulerEMS@2026', target: '/employees', roleKey: 'HR_ADMIN' },
    { role: 'Finance Controller', email: 'finance@sulerems.dev', pass: 'SulerEMS@2026', target: '/analytics', roleKey: 'FINANCE_ADMIN' },
    { role: 'Operations Manager', email: 'manager@sulerems.dev', pass: 'SulerEMS@2026', target: '/team', roleKey: 'MANAGER' },
    { role: 'Staff Practitioner', email: 'employee@sulerems.dev', pass: 'SulerEMS@2026', target: '/attendance', roleKey: 'STAFF' },
  ];

  const handleSeedClick = (cred: typeof SEEDED_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.pass);
    setActiveRole(cred.role);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const matchedSeed = SEEDED_CREDENTIALS.find(c => c.email === email);
    
    if (matchedSeed) {
      if (password === matchedSeed.pass) {
        setTimeout(() => {
          setRole(matchedSeed.roleKey);
          setIsLoading(false);
          
          pushActivity({
            type: 'SECURITY',
            label: 'Identity Verified',
            message: `Successful login for [${matchedSeed.email}] as ${matchedSeed.role}.`,
            author: matchedSeed.roleKey,
            status: 'SUCCESS'
          });

          toast({
            type: 'success',
            message: 'Identity Verified',
            description: `Authorized as ${matchedSeed.role}. Workspace initializing...`
          });
          router.push(matchedSeed.target);
        }, 1500);
        return;
      } else {
        setTimeout(() => {
          setErrorMessage('Unable to sign in. Please verify your credentials.');
          setIsLoading(false);
          
          pushActivity({
            type: 'SECURITY',
            label: 'Login Attempt Failed',
            message: `Invalid password for identity node [${email}].`,
            author: 'SYSTEM',
            status: 'FAILURE'
          });
        }, 800);
        return;
      }
    }

    // Generic fallback for non-seeded or real auth
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        setErrorMessage('Access denied. Identity protocol could not be verified.');
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage('Operational disruption detected. Please retry.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 md:p-12 selection:bg-indigo-100 selection:text-indigo-900 font-sans relative overflow-hidden">
      {/* Premium Enterprise Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-indigo-500/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-blue-500/[0.03] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Column: Brand & Context */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block space-y-12"
        >
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                Suler EMS <br />
                <span className="text-indigo-600">Operating System.</span>
              </h1>
              <p className="text-[16px] font-medium text-slate-500 leading-relaxed max-w-[420px]">
                The enterprise-grade infrastructure for organizational intelligence, workforce governance, and operational excellence.
              </p>
            </div>
          </div>

          {/* Seeded Testing Credentials Matrix */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seeded Identity Matrix</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {SEEDED_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => handleSeedClick(cred)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                    email === cred.email ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-100' : 'bg-white/50 border-slate-100 hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      email === cred.email ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-[13px] font-black transition-colors ${email === cred.email ? 'text-slate-900' : 'text-slate-500'}`}>{cred.role}</p>
                      <p className="text-[11px] font-medium text-slate-400">{cred.email}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${email === cred.email ? 'text-indigo-600 translate-x-0' : 'text-slate-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Secure Entry Surface */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden">
            <div className="mb-10">
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tight">Suler EMS</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Initialize Session</h2>
              <p className="text-slate-400 text-[14px] font-medium leading-relaxed">Identity verification required to access operational workspaces.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[13px] font-bold"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4.5 pl-14 pr-5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-[15px] font-bold shadow-sm"
                    placeholder="name@suler.ems"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
                  <button type="button" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">Forgot Access?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4.5 pl-14 pr-14 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-[15px] font-bold shadow-sm"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 text-white font-black text-[12px] uppercase tracking-[0.15em] py-5 rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Initialize Operational Session</span>
                    <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </form>

            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                End-to-End Encrypted Session
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">v4.5 Enterprise</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ISO/IEC 27001</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">256-bit AES</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
