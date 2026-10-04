import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Modal } from './Modal';
import { RoleBadge } from './RoleBadge';
import { Check, Shield } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentRole, switchRole, availableRoles, currentUser } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Operational Role"
      subtitle="Experience DO-DEEL CDS Manager under any of the 9 official roles with active RBAC permissions"
      maxWidth="lg"
    >
      <div className="space-y-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Current Active Persona: {currentUser?.fullName || 'Guest'}</p>
            <p className="text-emerald-700 mt-0.5">
              Permissions and dashboard view automatically configure according to the selected role.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {availableRoles.map(({ role, label, desc }) => {
            const isSelected = currentRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSelectRole(role)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RoleBadge role={role} size="sm" />
                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{desc}</p>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
