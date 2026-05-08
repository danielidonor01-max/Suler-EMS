"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Key, 
  Sparkles,
  Building2,
  Mail,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function ActivationPage() {
  const [step, setStep] = useState<'verify' | 'password' | 'profile' | 'complete'>('verify');
  const [password, setPassword] = useState('');
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-700">
         
         {/* Activation Header */}
         <div className="bg-slate-900 p-10 text-white relative">
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Suler Identity</span>
               </div>
               <div className="space-y-1">
                  <h1 className="text-3xl font-black tracking-tighter leading-none">Activate Account</h1>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed">Secure onboarding protocol for newly provisioned organizational members.</p>
               </div>
            </div>
            {/* Background Grain */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
         </div>

         <div className="p-10">
            {/* Step 1: Verification */}
            {step === 'verify' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                       <Mail className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Verification Pending</p>
                       <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none">d.okoro@sulerglobal.com</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="text-[13px] font-medium text-slate-500 leading-relaxed text-center">
                       An organizational identity has been provisioned for you. Please verify your identity to begin the activation protocol.
                    </p>
                    <button 
                      onClick={() => setStep('password')}
                      className="w-full bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-3 h-[56px] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 group"
                    >
                       Verify Identity
                       <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                 </div>
              </div>
            )}

            {/* Step 2: Password Configuration */}
            {step === 'password' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Setup Secure Password</label>
                       <div className="relative">
                          <input 
                            type="password" 
                            className="w-full h-[56px] bg-slate-50 border border-slate-200 rounded-2xl px-12 text-[14px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                       </div>
                    </div>
                    
                    {/* Password Strength Indicators */}
                    <div className="grid grid-cols-4 gap-2">
                       <div className={`h-1.5 rounded-full ${password.length >= 8 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                       <div className={`h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                       <div className={`h-1.5 rounded-full ${/[0-9]/.test(password) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                       <div className={`h-1.5 rounded-full ${/[!@#$%^&*]/.test(password) ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest">Enterprise Complexity Enforcement Active</p>
                 </div>

                 <button 
                   onClick={() => setStep('profile')}
                   className="w-full bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-3 h-[56px] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 group"
                 >
                    Set Password & Continue
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                 </button>
              </div>
            )}

            {/* Step 3: Profile Completion */}
            {step === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Verify Full Legal Name</label>
                       <input 
                         type="text" 
                         defaultValue="Daniel Okoro"
                         className="w-full h-[56px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-[14px] font-bold text-slate-900 outline-none"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">Assigned Hub</p>
                          <p className="text-[13px] font-black text-slate-700">Lagos HQ</p>
                       </div>
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-2">Assigned Dept</p>
                          <p className="text-[13px] font-black text-slate-700">Operations</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => setStep('complete')}
                   className="w-full bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-3 h-[56px] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 group"
                 >
                    Complete Onboarding
                    <CheckCircle2 className="w-4 h-4" />
                 </button>
              </div>
            )}

            {/* Step 4: Completion */}
            {step === 'complete' && (
              <div className="py-6 space-y-10 animate-in zoom-in-95 duration-500">
                 <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                       <Sparkles className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Identity Verified</h2>
                       <p className="text-[14px] font-medium text-slate-500 leading-relaxed">
                          Welcome to the **Suler Enterprise Ecosystem**. Your organizational authority has been provisioned and synced.
                       </p>
                    </div>
                 </div>

                 <Link 
                   href="/employees"
                   className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3 h-[56px] rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 group"
                 >
                    Access Command Center
                    <Zap className="w-4 h-4 fill-white" />
                 </Link>

                 <p className="text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest italic">
                    Security Policy: Active Monitoring Enabled
                 </p>
              </div>
            )}
         </div>

         {/* Footer Disclaimer */}
         <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Secure 256-bit AES Encryption</span>
         </div>
      </div>
    </div>
  );
}
