import { Link } from 'react-router-dom';
// src/pages/Support/Developer.tsx
import DrDKD from '@/assets/DrDheerajDixit.jpg';
import { Code2, GraduationCap, Mail, Users } from 'lucide-react';

export default function Developer() {
  const mentors = [
    {
      name: 'Dr. Dheeraj Kumar Dixit',
      dept: 'HOD, Department of Mathematics and Computing',
      roleBadge: 'Faculty Mentor & HOD',
      image: DrDKD,
      email: 'dheerajdixit@mitsgwalior.in',
      website: 'https://web.mitsgwalior.in/faculty-profiles-emc-2/dr-dheeraj-kumar-dixit'
    }
  ];

  const partners = [
    {
      name: 'Abhinav Jaiswal',
      role: 'Project Partner',
      initials: 'AJ'
    },
    {
      name: 'Abhinav Gupta',
      role: 'Project Partner',
      initials: 'AG'
    }
  ];

  return (
    <section className="w-full mt-24 text-left select-none relative z-10">
      {/* Divider */}
      <div className="w-full border-t border-dashed border-slate-200 dark:border-white/10 mb-16" />

      {/* Heading */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#ff602e]/10 border border-[#ff602e]/20 px-4 py-1.5 rounded-full mb-4 shadow-sm">
          <GraduationCap className="w-3.5 h-3.5 text-[#ff602e]" />
          <span className="text-[10px] tracking-wide font-extrabold uppercase text-[#ff602e]">
            Project Guidance &amp; Development
          </span>
        </div>
        <h2 className="text-[32px] sm:text-[38px] font-extrabold text-slate-900 dark:text-white tracking-tight">
          Meet the Creators
        </h2>
        <p className="text-slate-600 dark:text-neutral-450 text-sm mt-3 max-w-xl mx-auto">
          C3S was built under expert academic guidance to bring a premium, high-fidelity mapping and surveillance safety experience to our campus.
        </p>
      </div>

      {/* Development & Guidance Grid: 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-2">

        {/* Developer Card (Naman Lahariya) */}
        <div className="h-[390px] rounded-[24px] border border-slate-200 dark:border-blue-500/30 bg-white dark:bg-[#0e1424]/90 p-7 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/60 transition-all duration-300 shadow-lg dark:shadow-xl">
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Code2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Campus Creator
                </span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block mb-1">
                Lead Architect &amp; Full Stack Developer
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5">Naman Lahariya</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Full Stack Developer crafting high-performance institutional MERN &amp; AI architectures for MITS Gwalior.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-white/10">
              <Link
                to="/developers"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
              >
                <span>View Full Profile</span>
                <span>→</span>
              </Link>
              <a
                href="https://github.com/namanartist"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Mentor Card (Dr. Dheeraj Kumar Dixit) */}
        {mentors.map((mentor, index) => (
          <div
            key={index}
            className="h-[390px] rounded-[24px] border border-slate-200 dark:border-amber-500/30 bg-white dark:bg-[#0f0f0f]/80 p-7 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/60 transition-all duration-300 shadow-lg dark:shadow-xl"
          >
            <div className="flex flex-col justify-between h-full w-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-900 shadow-md">
                    <img
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Faculty Mentor &amp; HOD
                  </span>
                </div>

                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block mb-1">
                  Academic Guidance
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{mentor.name}</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">{mentor.dept}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">MITS Gwalior</p>
              </div>

              {/* Contact Icons */}
              <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                <a
                  href={`mailto:${mentor.email}`}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all duration-300"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href={mentor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                  title="Official Faculty Bio"
                >
                  <span>Faculty Bio</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* Supporting Partners Card (Abhinav Jaiswal & Abhinav Gupta) */}
        <div className="h-[390px] rounded-[24px] border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-[#0e1424]/90 p-7 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300 shadow-lg dark:shadow-xl">
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Project Partners
                </span>
              </div>

              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 block mb-2">
                Technical Collaboration
              </span>

              <div className="space-y-3">
                {partners.map((partner, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                      {partner.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{partner.name}</h4>
                      <p className="text-[10px] text-cyan-300 font-semibold">{partner.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-400 font-medium">
              <span>MITS Gwalior</span>
              <span className="text-cyan-400 font-bold">C3S Network</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
