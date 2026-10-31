// src/components/c3s/LogoutConfirmModal.tsx
import React from 'react';
import { LogOut, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useC3SStore } from '@/store/c3sStore';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout, currentUser, currentRole } = useC3SStore();

  if (!isOpen) return null;

  const handleConfirmLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1020] p-6 shadow-2xl transition-all">
        {/* Glow ambient accent */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shadow-md">
              <LogOut className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">End terminal access for this session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card info */}
        <div className="mt-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3.5 flex items-center gap-3">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-blue-500/30"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{currentUser?.universityId}</p>
          </div>
          <span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-500 dark:text-blue-300">
            {currentRole.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Warning text */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-700 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Signing out will revoke local command privileges, reset active telemetric listeners, and return to institutional login.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
};

