import React from 'react';
import { AppShell } from '@/components/c3s/AppShell';
import { useC3SStore } from '@/store/c3sStore';
import { ROLE_LABELS } from '@/lib/mock-data/users';
import { Shield, QrCode, Phone, Mail, Building, CheckCircle2 } from 'lucide-react';

export default function C3SProfilePage() {
  const { currentUser, currentRole } = useC3SStore();
  const roleMeta = ROLE_LABELS[currentRole];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase">DIGITAL CAMPUS IDENTITY</h1>
          <p className="text-xs text-slate-400">NFC-enabled campus smart card credential & safety clearance.</p>
        </div>

        {/* Digital ID Badge */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-blue-500/40 bg-gradient-to-br from-slate-900 via-[#0B1020] to-blue-950 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-blue-500"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h2>
                <p className="font-mono text-xs font-bold text-blue-400 mt-0.5">{currentUser.universityId}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                  {roleMeta.title}
                </div>
              </div>
            </div>

            <QrCode className="h-14 w-14 text-white/40" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-800/80 pt-5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-500" />
              <span>{currentUser.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <span>{currentUser.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Security Clearance Active</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}