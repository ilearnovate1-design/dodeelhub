import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertOctagon, LogOut, ShieldAlert, MapPin, Mail, Award, Phone } from 'lucide-react';

export const SuspendedAccountView: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-rose-100 border-2 border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Account Access Suspended
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              DO-DEEL CDS Access Disabled
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your member account is currently inactive on the portal.
            </p>
          </div>
        </div>

        {/* Reassurance Notice Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Historical Records Safely Preserved</span>
          </div>
          <p className="leading-relaxed text-amber-800/90 text-[11px]">
            In accordance with DO-DEEL operational policy, your past CDS attendance, assigned task submissions,
            verified evidence, and monthly contributions remain fully intact in the Directorate records and have <strong>not</strong> been deleted.
          </p>
        </div>

        {/* Member Profile Summary */}
        {currentUser && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Corps Member</span>
              <span className="font-bold text-slate-900">{currentUser.fullName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Registered Email</span>
              <span className="font-mono text-slate-700">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">LG Chapter</span>
              <span className="font-semibold text-slate-800">{currentUser.lgName}</span>
            </div>
            {currentUser.stateCode && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">State Code</span>
                <span className="font-mono font-bold text-emerald-800">{currentUser.stateCode}</span>
              </div>
            )}
          </div>
        )}

        {/* Resolution Instructions */}
        <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
          <p className="font-bold text-slate-800">How to request account reactivation:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
            <li>Contact your designated <strong>Local Government President</strong> at your weekly Thursday meeting.</li>
            <li>Or contact the <strong>State CDS Coordinator</strong> at the Ondo State NYSC Directorate.</li>
            <li>Once an authorized administrator reactivates your account in the management panel, you will immediately regain portal access.</li>
          </ul>
        </div>

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={logout}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};
