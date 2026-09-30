// src/pages/404.tsx
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '@/components/ui';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Landing/landing.css';

/**
 * NotFoundPage (404) Component.
 * Displays a clean 404 message using the signature blueprint grid background,
 * custom navbar, and footer.
 */
export default function NotFoundPage() {
  usePageMeta(
    'Page Not Found — MITS Map',
    'The requested page could not be found on UniMap - MITS Gwalior Campus Map.'
  );
  return (
    <div className="w-full flex flex-col min-h-screen blueprint-grid text-[var(--text-primary)]">
      {/* Global navbar */}
      <Navbar />

      {/* Center 404 messaging (occupies full viewport height to fill the fold) */}
      <main className="w-full flex-grow min-h-screen flex flex-col items-center justify-center px-4 text-center select-none">
        <h1 className="text-[28px] sm:text-[36px] md:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
          404 - Page not found
        </h1>
        <Link to="/" className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
          <button className="bg-[#ff602e] hover:bg-[#ff7b52] text-white font-semibold text-xs px-6 py-3 rounded-full shadow-lg shadow-[#ff602e]/20 transition-all duration-200 cursor-pointer">
            Back to homepage
          </button>
        </Link>
      </main>

      {/* Starry footer (visible only when scrolling down) */}
      <Footer />
    </div>
  );
}
