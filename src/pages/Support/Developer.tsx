// src/pages/Support/Developer.tsx
import DrSA from '@/assets/DrSA.webp';
import DrMD from '@/assets/DrMD.webp';
import { Code2, GraduationCap, Mail, Globe } from 'lucide-react';

export default function Developer() {
  const mentors = [
    {
      name: 'Dr. Saurabh Agarwal',
      dept: 'Assistant Professor, Department of Computer Science',
      image: DrSA,
      email: 'saurabhagarwal@mitsgwalior.in',
      website: 'https://web.mitsgwalior.in/faculty-profiles-cse-2/dr-saurabh-agarwal'
    },
    {
      name: 'Dr. Manish Dixit',
      dept: 'Professor & Head, Department of Computer Science',
      image: DrMD,
      email: 'dixitmits@mitsgwalior.in',
      website: 'https://web.mitsgwalior.in/faculty-profiles-cse-2/dr-manish-dixit-2'
    }
  ];

  return (
    <section className="w-full mt-24 text-left select-none relative z-10">
      {/* Divider */}
      <div className="w-full border-t border-dashed border-white/10 mb-16" />

      {/* Heading */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#ff602e]/10 border border-[#ff602e]/20 px-4 py-1.5 rounded-full mb-4 shadow-sm">
          <GraduationCap className="w-3.5 h-3.5 text-[#ff602e]" />
          <span className="text-[10px] tracking-wide font-extrabold uppercase text-[#ff602e]">
            Project Guidance & Development
          </span>
        </div>
        <h2 className="text-[32px] sm:text-[38px] font-extrabold text-white tracking-tight">
          Meet the Creators
        </h2>
        <p className="text-neutral-450 text-sm mt-3 max-w-xl mx-auto">
          UniMap was built under expert academic guidance to bring a premium, high-fidelity mapping experience to our campus.
        </p>
      </div>

      {/* Development & Guidance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-2">

        {/* Developer Card (dotrwt) */}
        <div className="h-[380px] rounded-[24px] border border-white/10 bg-[#0f0f0f]/75 p-7 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff602e]/30 transition-all duration-300">
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#ff602e]/10 text-[#ff602e] flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#ff602e] block mb-2">
                Lead Development
              </span>
              <h3 className="text-xl font-bold text-white mb-2">developed by dotrwt</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Responsible for full-stack architecture, Dijkstra multi-floor routing graphs, and vector mapping interface integration.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <a
                href="https://dotrwt.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-[#ff602e] hover:border-[#ff602e] px-4 py-2 rounded-xl transition-all duration-300"
              >
                Visit Website
              </a>
            </div>
          </div>
        </div>

        {/* Mentor Cards */}
        {mentors.map((mentor, index) => (
          <div
            key={index}
            className="h-[380px] rounded-[24px] border border-white/10 bg-[#0f0f0f]/75 p-7 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff602e]/30 transition-all duration-300"
          >
            <div className="flex flex-col justify-between h-full w-full">
              <div>
                {/* Photo / Avatar */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 mb-6 group-hover:border-[#ff602e]/50 transition-colors duration-300">
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{mentor.name}</h3>
                <p className="text-[11px] text-neutral-400 mb-2">{mentor.dept}</p>
              </div>

              {/* Contact Icons */}
              <div className="flex items-center gap-3 mt-4 border-t border-white/5 pt-4">
                <a
                  href={`mailto:${mentor.email}`}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#ff602e] hover:bg-[#ff602e]/10 hover:border-[#ff602e]/20 transition-all duration-300"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href={mentor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#ff602e] hover:bg-[#ff602e]/10 hover:border-[#ff602e]/20 transition-all duration-300"
                  title="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}

      </div>
    </section>
  );
}
