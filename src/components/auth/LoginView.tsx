import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, 
  Mail, 
  Lock, 
  LogIn, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  UserCheck,
  Send,
  Building2
} from 'lucide-react';

type AuthViewMode = 'LOGIN' | 'ACTIVATE' | 'FORGOT_PASSWORD';

export const LoginView: React.FC = () => {
  const { login, activateAccount, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<AuthViewMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Check URL query parameters for direct invitation links: ?activate=true&email=...&code=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isActivateParam = params.get('activate');
      const emailParam = params.get('email');
      const codeParam = params.get('code');

      if (isActivateParam === 'true' || codeParam) {
        setMode('ACTIVATE');
        if (emailParam) setEmail(emailParam);
        if (codeParam) setInvitationCode(codeParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. If you recently received an invitation, please click "Activate Account" below.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please provide the email address registered with your invitation.');
      return;
    }
    if (!invitationCode.trim()) {
      setError('Please enter your official DO-DEEL invitation code (e.g. DEEL-XXXXXX).');
      return;
    }
    if (password.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      await activateAccount(email, invitationCode, password);
      setSuccessMessage('Account activated successfully! Logging you in...');
    } catch (err: any) {
      setError(err.message || 'Failed to activate account. Please check your invitation code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccessMessage('Password reset instructions sent. Please check your email inbox.');
    } catch (err: any) {
      // Security best practice: avoid account enumeration
      setSuccessMessage('If an account exists for this email address, a password reset link has been dispatched.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md">
        {/* Directorate Brand Header */}
        <div className="text-center mb-6 text-white space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-1">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">DO-DEEL CDS Manager</h1>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Digital Onboarders Directorate • Ondo State NYSC CDS Portal
          </p>
        </div>

        {/* Controlled Access Notice Banner */}
        <div className="bg-emerald-900/40 backdrop-blur-sm border border-emerald-500/30 text-emerald-200 text-[11px] p-3 rounded-2xl mb-4 text-center">
          <p className="font-semibold">Controlled Membership Portal</p>
          <p className="text-emerald-300/80 text-[10px] mt-0.5">
            Access is managed by Local Government Presidents and the State Directorate.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('ACTIVATE');
                setError('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'ACTIVATE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Activate Account
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* ----------------- MODE 1: LOGIN ----------------- */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@dodeel.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                {!loading && <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>

              {/* Invitation Help */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  New member awaiting first login?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('ACTIVATE');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Activate Invitation Code
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ----------------- MODE 2: ACTIVATE ACCOUNT ----------------- */}
          {mode === 'ACTIVATE' && (
            <form onSubmit={handleActivateSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Activate Authorized Membership</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Enter your registered email and the activation code provided by your Local Government President or CDS Coordinator to set your private password.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. member@dodeel.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Activation Code / Invitation Token <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DEEL-K89M2A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs font-mono uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Invitation tokens are issued by your Local Government President or State CDS Coordinator.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Create Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Activating Account...' : 'Set Password & Activate Account'}</span>
                {!loading && <CheckCircle2 className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already activated? Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ----------------- MODE 3: FORGOT PASSWORD ----------------- */}
          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your registered email address to receive Firebase password recovery instructions.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dodeel.org"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Sending...' : 'Send Password Reset Link'}</span>
                {!loading && <Send className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Notice */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
              Ondo State NYSC Community Development Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
