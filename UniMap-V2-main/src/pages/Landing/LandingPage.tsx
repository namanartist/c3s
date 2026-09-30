// src/pages/Landing/LandingPage.tsx
import './landing.css';
import Hero from './Hero';
import Features from './Features';
import About from './About';
import { Navbar, Footer } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';

/** 
 * Redesigned Landing Page component for UniMap.
 * Renders Hero sections, feature grids, and project details matching reference visual styles.
 */
export default function LandingPage() {
  usePageMeta(
    'MITS Map — Official Campus Map of MITS Gwalior',
    'Navigate the Madhav Institute of Technology and Science (MITS) Gwalior campus. Find classrooms, labs, departments, blocks, and hostels instantly with UniMap.'
  );

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#fcfaf6] dark:bg-[#050505]">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Header & Interactive Mockup */}
      <Hero />

      {/* Feature Capabilities grid */}
      <Features />

      {/* Project Specs stack details */}
      <About />

      {/* Beta Disclaimer Banner */}
      <div className="max-w-4xl mx-auto px-6 w-full mb-16 select-none">
        <div className="bg-orange-500/[0.02] dark:bg-neutral-900/20 border border-[#ff602e]/10 dark:border-white/5 rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 shadow-sm">
          {/* Beta Badge */}
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
              Beta
            </span>
          </div>
          {/* Explanation Text */}
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-semibold">
            We're continuously improving route accuracy by expanding our campus map and refining navigation. Thanks for helping us build a better campus experience.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
