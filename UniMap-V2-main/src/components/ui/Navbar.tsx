// src/components/ui/Navbar.tsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import unimapLogo from '@/assets/Logo_navbar.png';

/** A sticky top navigation bar component providing page links and theme settings. */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path: string) => location.pathname === path;

  // On the landing page, support page, or 404 page, render the custom floating glass-capsule navbar
  const isSupport = location.pathname === '/support';
  const isLanding = location.pathname === '/';
  const is404 = !['/', '/map', '/support'].includes(location.pathname);

  if (isLanding || isSupport || is404) {
    return (
      <nav className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[94%] max-w-2xl px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xl shadow-black/20 ${isSupport ? 'bg-[#121212] border border-white/10' : 'glass-capsule'
        }`}>
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity group flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#ff602e] flex-shrink-0">
            <img src={unimapLogo} alt="UniMap Logo" className="w-full h-full object-contain rounded-full p-0.1" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">UniMap</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
          <Link to="/" className={`hover:text-white transition-colors ${isLanding ? 'text-white' : ''}`}>Home</Link>
          <Link to="/support" className={`hover:text-white transition-colors ${isSupport ? 'text-white' : ''}`}>Support</Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link to="/support" className={`md:hidden text-xs font-semibold text-neutral-300 hover:text-white transition-colors px-1 ${isSupport ? 'text-white' : ''}`}>
            Support
          </Link>
          <Link to="/map" className="flex-shrink-0">
            <button className="bg-[#ff602e] hover:bg-[#ff7b52] text-white text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 shadow-md whitespace-nowrap">
              Start Navigating
            </button>
          </Link>
        </div>
      </nav>
    );
  }

  // Standard sticky navbar for other pages
  return (
    <nav className="sticky top-0 z-50 h-[56px] w-full bg-[var(--bg)]/80 backdrop-blur-sm border-b border-[var(--border)] px-4 md:px-6 flex flex-col justify-center">
      <div className="flex items-center justify-between w-full">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#ff602e]">
            <img src={unimapLogo} alt="UniMap Logo" className="w-full h-full object-contain rounded-full p-0.5" />
          </div>
          <span className="text-[17px] font-medium text-[var(--text-primary)]">UniMap</span>
        </Link>

        {/* Center: Nav links (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm transition-colors ${isActive('/')
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'
              }`}
          >
            Home
          </Link>
          <Link
            to="/map"
            className={`text-sm transition-colors ${isActive('/map')
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'
              }`}
          >
            Map
          </Link>
          <Link
            to="/support"
            className={`text-sm transition-colors ${isActive('/support')
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'
              }`}
          >
            Support
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/map"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Open Map
          </Link>
          <button
            onClick={toggleMenu}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--accent-light)] transition-colors"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[55px] left-0 w-full bg-[var(--bg-card)] border-b border-[var(--border)] flex flex-col p-4 gap-4 md:hidden">
          <Link
            to="/"
            onClick={toggleMenu}
            className={`text-sm py-1 transition-colors ${isActive('/') ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)]'
              }`}
          >
            Home
          </Link>
          <Link
            to="/map"
            onClick={toggleMenu}
            className={`text-sm py-1 transition-colors ${isActive('/map') ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)]'
              }`}
          >
            Map
          </Link>
          <Link
            to="/support"
            onClick={toggleMenu}
            className={`text-sm py-1 transition-colors ${isActive('/support') ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)]'
              }`}
          >
            Support
          </Link>
          <Link
            to="/map"
            onClick={toggleMenu}
            className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Open Map
          </Link>
        </div>
      )}
    </nav>
  );
}
