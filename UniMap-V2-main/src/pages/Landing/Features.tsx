// src/pages/Landing/Features.tsx
import { Link } from 'react-router-dom';
import { Layers, Search, Accessibility, Navigation, School, HelpCircle, Coffee, Compass } from 'lucide-react';
import BorderGlow from '@/components/ui/borderGlow/borderGlow';
import './features.css';

export default function Features() {
  return (
    <section id="features" className="w-full bg-transparent px-[10px] py-4 relative select-none">
      <div className="w-full bg-[#050505] text-white border border-white/10 rounded-[32px] md:rounded-[40px] py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle background glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#ff602e]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Top Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-[42px] font-medium tracking-tight leading-[1.08] text-white">
                Your ultimate campus <br />
                companion, <br />
                packed with smart tools
              </h2>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3 text-left md:text-right shrink-0">
              <p className="text-neutral-400 text-sm font-medium">From turn-by-turn indoor directions</p>
              <p className="text-neutral-400 text-sm font-medium">UniMap elevates every campus experience.</p>
              <Link to="/map">
                <button className="mt-2 bg-[#121212] border border-white/10 hover:bg-neutral-900 hover:border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 shadow-md cursor-pointer">
                  Start Navigating
                </button>
              </Link>
            </div>
          </div>

          {/* Outer container box wrapping the 2x2 Feature Cards Grid */}
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[40px] p-3">
            {/* 2x2 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">

              {/* Card 1: Multi-Floor Routing with Floor Switcher / Step list mockup */}
              <BorderGlow
                className="feature-grid-card h-[480px] w-full relative overflow-visible group cursor-pointer"
                borderRadius={32}
                backgroundColor="rgba(10, 10, 10, 0.75)"
                glowColor="270 90 70"
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                glowIntensity={1.2}
              >
                <div className="p-8 flex flex-col justify-between h-full w-full">
                  {/* Top Area: Floor Selector & Step List */}
                  <div className="h-[240px] w-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-40 h-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

                    {/* Visual: Floating Floor Cards in 3D perspective */}
                    <div className="relative w-[210px] h-[190px] flex gap-3 items-center justify-center select-none" style={{ perspective: '800px' }}>
                      {/* Floor switcher tabs */}
                      <div className="flex flex-col gap-1.5 p-1.5 bg-neutral-900/90 border border-white/10 rounded-xl shadow-xl -rotate-[6deg] transform translate-x-2 z-20">
                        {['L3', 'L2', 'L1', 'GF'].map((floor) => (
                          <div
                            key={floor}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black tracking-wider transition-all duration-300 ${floor === 'L2'
                              ? 'bg-[#ff602e] text-white shadow-md shadow-[#ff602e]/30 scale-105'
                              : 'text-neutral-400 hover:text-white'
                              }`}
                          >
                            {floor}
                          </div>
                        ))}
                      </div>

                      {/* Step list snippet */}
                      <div className="flex-1 flex flex-col gap-2 p-3 bg-neutral-950/85 border border-white/5 rounded-2xl shadow-xl rotate-[4deg] translate-x-1 z-10 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[9px] font-bold text-neutral-200 truncate">Enter Main Block • GF</span>
                        </div>
                        <div className="flex items-center gap-2 pl-1 border-l border-neutral-800 py-1">
                          <div className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <Layers size={10} />
                          </div>
                          <span className="text-[9px] text-neutral-400 font-bold truncate">Take Lift to L2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ff602e] flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <span className="text-[9px] font-bold text-white truncate">Target: Room L204</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text Area */}
                  <div className="relative z-10">
                    <Layers className="w-5 h-5 text-neutral-400 mb-3" />
                    <h3 className="text-[17px] font-bold text-white mb-1.5">Multi-Floor Navigation</h3>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                      Seamless transitions and routing steps across multiple building levels and floor plans.
                    </p>
                  </div>
                </div>
              </BorderGlow>

              {/* Card 2: Room Finder with campus Search List mockup */}
              <BorderGlow
                className="feature-grid-card h-[480px] w-full relative overflow-visible group cursor-pointer"
                borderRadius={32}
                backgroundColor="rgba(10, 10, 10, 0.75)"
                glowColor="270 90 70"
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                glowIntensity={1.2}
              >
                <div className="p-8 flex flex-col justify-between h-full w-full">
                  {/* Top Area: Floating Campus Search list */}
                  <div className="h-[240px] w-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                    <div className="w-[85%] bg-neutral-900/90 border border-white/10 rounded-2xl p-3 shadow-2xl rotate-[-4deg] translate-y-3 flex flex-col gap-2.5 text-left select-none">
                      {/* Search bar mockup */}
                      <div className="flex items-center gap-2 bg-neutral-950 border border-white/5 rounded-xl px-2.5 py-1.5">
                        <Search className="w-3.5 h-3.5 text-[#ff602e] shrink-0" />
                        <span className="text-[10px] font-medium text-neutral-500">Search rooms, labs, blocks...</span>
                      </div>

                      {/* Results stack */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg border border-white/5">
                          <div>
                            <h5 className="text-[10px] font-bold text-white">CIoT Lab</h5>
                            <p className="text-[8px] text-neutral-400">AI Building • Floor 0</p>
                          </div>
                          <span className="text-[7px] font-black uppercase bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Lab</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 bg-white/5 rounded-lg border border-white/5">
                          <div>
                            <h5 className="text-[10px] font-bold text-white">Conclave Centre</h5>
                            <p className="text-[8px] text-neutral-400">Main Building • Floor 0</p>
                          </div>
                          <span className="text-[7px] font-black uppercase bg-orange-500/20 text-[#ff602e] px-1.5 py-0.5 rounded">Seminar</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text Area */}
                  <div className="relative z-10">
                    <Search className="w-5 h-5 text-neutral-400 mb-3" />
                    <h3 className="text-[17px] font-bold text-white mb-1.5">Smart Room Finder</h3>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                      Search classrooms, labs, offices, and facilities instantly and get directions in seconds.
                    </p>
                  </div>
                </div>
              </BorderGlow>

              {/* Card 3: Accessibility-First with Step-Free toggle mockup */}
              <BorderGlow
                className="feature-grid-card h-[480px] w-full relative overflow-visible group cursor-pointer"
                borderRadius={32}
                backgroundColor="rgba(10, 10, 10, 0.75)"
                glowColor="270 90 70"
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                glowIntensity={1.2}
              >
                <div className="p-8 flex flex-col justify-between h-full w-full">
                  {/* Top Area: Accessibility toggles */}
                  <div className="h-[240px] w-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-40 h-40 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

                    <div className="w-[85%] bg-neutral-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl rotate-[3deg] translate-y-3 flex flex-col gap-3 text-left select-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                            <Accessibility size={16} />
                          </div>
                          <div>
                            <h5 className="text-[10px] font-bold text-white">Step-Free Routing</h5>
                            <p className="text-[8px] text-neutral-450">Avoid stairs and escalators</p>
                          </div>
                        </div>
                        {/* Premium Toggle Switch in active state */}
                        <div className="w-8 h-4.5 rounded-full bg-[#ff602e] p-0.5 flex items-center justify-end cursor-pointer">
                          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-2.5 flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2 py-1 px-2 bg-neutral-950 rounded-lg border border-white/5">
                          <span className="text-[8px] text-emerald-500 font-extrabold uppercase">Elevators</span>
                          <span className="text-[8px] text-neutral-400">Preferred</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2 py-1 px-2 bg-neutral-950 rounded-lg border border-white/5">
                          <span className="text-[8px] text-red-500 font-extrabold uppercase">Stairs</span>
                          <span className="text-[8px] text-neutral-450">Avoided</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text Area */}
                  <div className="relative z-10">
                    <Accessibility className="w-5 h-5 text-neutral-400 mb-3" />
                    <h3 className="text-[17px] font-bold text-white mb-1.5">Accessibility First</h3>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                      Customize paths to prefer step-free alternatives like ramps and elevators.
                    </p>
                  </div>
                </div>
              </BorderGlow>

              {/* Card 4: Live ETA HUD mockup */}
              <BorderGlow
                className="feature-grid-card h-[480px] w-full relative overflow-visible group cursor-pointer"
                borderRadius={32}
                backgroundColor="rgba(10, 10, 10, 0.75)"
                glowColor="270 90 70"
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                glowIntensity={1.2}
              >
                <div className="p-8 flex flex-col justify-between h-full w-full">
                  {/* Top Area: Live HUD card */}
                  <div className="h-[240px] w-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

                    <div className="w-[85%] bg-neutral-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl rotate-[-3deg] translate-y-3 flex flex-col gap-3 text-left select-none">
                      <div className="flex justify-between items-center text-neutral-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Navigation
                        </span>
                        <span className="text-[8px] text-neutral-450 font-bold">ETA: 3 min</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ff602e]/10 text-[#ff602e] flex items-center justify-center shrink-0">
                          <Compass className="w-5 h-5 rotate-[45deg]" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-extrabold text-white">Turn Left in 20m</h4>
                          <p className="text-[8px] text-neutral-450">After passing the central lobby stairs</p>
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#ff602e] h-full w-[65%]" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Text Area */}
                  <div className="relative z-10">
                    <Navigation className="w-5 h-5 text-neutral-400 mb-3" />
                    <h3 className="text-[17px] font-bold text-white mb-1.5">Live ETA & Compass</h3>
                    <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                      Track your position and remaining travel time with responsive direction cues.
                    </p>
                  </div>
                </div>
              </BorderGlow>

            </div>
          </div>

          {/* Second Sub-section Header */}
          <div className="text-center mt-28 mb-16">
            <h3 className="text-3xl md:text-[36px] font-medium tracking-tight text-white leading-tight">
              Explore Every Corner of Campus
            </h3>
          </div>

          {/* 3-Column Small Cards Grid */}
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-0 max-w-5xl mx-auto">

            {/* Card A */}
            <div className="feature-grid-card card-overlap-a feature-glass-card w-full md:w-1/3 rounded-[24px] p-6 flex flex-col justify-between min-h-[180px]">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#ff602e] shadow-sm select-none shrink-0 mb-4">
                <School size={22} />
              </div>
              <p className="text-[14px] font-semibold text-neutral-200 leading-snug max-w-[200px]">
                Locate classrooms, lecture theatres, and labs.
              </p>
            </div>

            {/* Card B */}
            <div className="feature-grid-card card-overlap-b feature-glass-card w-full md:w-1/3 rounded-[24px] p-6 flex flex-col justify-between min-h-[180px]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm select-none shrink-0 mb-4">
                <HelpCircle size={22} />
              </div>
              <p className="text-[14px] font-semibold text-neutral-200 leading-snug max-w-[200px]">
                Find administration offices, help desks, and support centers.
              </p>
            </div>

            {/* Card C */}
            <div className="feature-grid-card card-overlap-c feature-glass-card w-full md:w-1/3 rounded-[24px] p-6 flex flex-col justify-between min-h-[180px]">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm select-none shrink-0 mb-4">
                <Coffee size={22} />
              </div>
              <p className="text-[14px] font-semibold text-neutral-200 leading-snug max-w-[200px]">
                Discover cafeterias, libraries, auditoriums, and common areas.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
