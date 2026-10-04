import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LocalGovernment } from '../../types';
import { isSuperAdminEmail } from '../../utils/permissions';
import { Shield, Mail, Lock, LogIn, Sparkles, UserPlus, ArrowRight, Building2, KeyRound } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedLgId, setSelectedLgId] = useState('');
  const [lgs, setLgs] = useState<LocalGovernment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    // Sync LGs for signup dropdown
    const updateLgs = () => {
      let list = dataService.getLGs();
      // If live list is empty (not seeded yet), use INITIAL_LGS as fallback
      // so new users can still sign up and "connect" to an LG
      if (list.length === 0) {
        import('../../services/mockData').then(m => {
          setLgs(m.INITIAL_LGS);
          if (!selectedLgId && m.INITIAL_LGS.length > 0) {
            setSelectedLgId(m.INITIAL_LGS[0].id);
          }
        });
      } else {
        setLgs(list);
        if (!selectedLgId && list.length > 0) {
          setSelectedLgId(list[0].id);
        }
      }
    };
    updateLgs();
    const unsubscribe = dataService.subscribe(updateLgs);
    return unsubscribe;
  }, [selectedLgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!fullName.trim()) throw new Error('Full name is required');
        if (!selectedLgId) throw new Error('Please select a Local Government chapter');
        
        const lg = lgs.find(l => l.id === selectedLgId);
        const isSuper = isSuperAdminEmail(email);
        await signup(email, password, { 
          fullName: fullName.trim(),
          lgId: selectedLgId,
          lgName: lg?.name || '',
          role: isSuper ? 'CDS_COORDINATOR' : 'MEMBER'
        });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setIsForgotPassword(false);
      setResetSent(false);
      setResetEmail('');
    }, 3000);
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
            <p className="text-slate-500 text-sm mt-2">Enter your email to receive a reset link</p>
          </div>

          {resetSent ? (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium text-center">
              Reset link sent! Please check your email inbox and follow the instructions.
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@dodeel.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200"
              >
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-slate-500 hover:text-slate-700 text-sm font-semibold py-2"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:w-1/2 bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full -ml-48 -mb-48" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">DO-DEEL CDS</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Ondo State NYSC Directorate</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Accountability Engine & <span className="text-emerald-500">Growth Hub</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            The official management portal for Digital Onboarders CDS. Track responsibilities, evidence community impact, and grow as a digital leader.
          </p>
        </div>

        <div className="relative z-10 text-slate-500 text-sm font-medium">
          &copy; 2026 DO-DEEL CDS Manager. All Rights Reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">{isSignup ? 'Create Account' : 'Sign In'}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isSignup ? 'Enroll as a new DO-DEEL participant' : 'Enter your credentials to access your dashboard'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Daniel Babajide"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">LG Chapter</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      required
                      value={selectedLgId}
                      onChange={(e) => setSelectedLgId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all appearance-none"
                    >
                      <option value="" disabled>Select your LG</option>
                      {lgs.map(lg => (
                        <option key={lg.id} value={lg.id}>{lg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@dodeel.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In to Dashboard')}</span>
              {!loading && (isSignup ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />)}
            </button>
          </form>

          {/* Quick Super Admin demo credentials helper */}
          {!isSignup && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Super Admin Portal:</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">
                  kolawoles445@gmail.com
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('kolawoles445@gmail.com');
                  setPassword('password123');
                }}
                className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Autofill
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest leading-relaxed">
              Authorized NYSC DO-DEEL Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
