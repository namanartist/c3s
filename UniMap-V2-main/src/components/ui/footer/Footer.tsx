// src/components/ui/Footer.tsx
import { Link } from 'react-router-dom';
import './footer.css';

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import chrome from '@/assets/chrome.webp';
import firefox from '@/assets/firefox.webp';
import apple from '@/assets/safari.webp';


/** A dark themed, starry-sky styled card footer component matching the design spec. */
export default function Footer() {
  return (
    <footer className="w-full bg-transparent px-[10px] pb-6 pt-4 relative select-none">
      <div className="footer-card w-full text-white rounded-[32px] md:rounded-[40px] py-16 px-6 md:px-12 relative flex flex-col items-center">
        {/* Glow Effects */}
        <div className="footer-glow" />
        <div className="footer-star-glow" />
        <div className="footer-star-glow-2" />

        {/* Shooting Stars */}
        <div className="shooting-stars-container">
          <div className="shooting-star shooting-star-1" />
          <div className="shooting-star shooting-star-2" />
          <div className="shooting-star shooting-star-3" />
          <div className="shooting-star shooting-star-4" />
        </div>

        {/* Content Area - Relative & Z-indexed to be above the glow/stars */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col items-center text-center">

          {/* Header Title */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-[1.15] max-w-2xl mt-4 mb-8">
            Experience your campus like <br className="hidden sm:inline" />
            never before with UniMap
          </h2>

          {/* Action Button */}
          <Link to="/map" className="mb-8 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
            <button className="bg-[#FF4D00] hover:bg-[#FF6A00] text-white font-semibold text-xs px-8 py-3.5 rounded-full shadow-[0_8px_30px_rgba(255,77,0,0.4)] transition-all duration-200 cursor-pointer">
              Start Navigating
            </button>
          </Link>

          {/* Browser Icons Badges */}
          <div className="flex items-center gap-3 mb-2">

            {/* Google Chrome Badge */}
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1.5 select-none">
              <img
                src={chrome}
                alt="Chrome"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Mozilla Firefox Badge */}
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1.5 select-none">
              <img
                src={firefox}
                alt="Firefox"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Safari Badge */}
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1.5 select-none">
              <img
                src={apple}
                alt="Safari"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Subtext availability */}
          <span className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase select-none mb-16">
            Also available in browsers
          </span>

          {/* Dotted separator line */}
          <div className="w-full border-t border-dashed border-white/10 mb-10" />

          {/* Bottom links and details */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Left Column: Vertically stacked site links & description */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 text-sm font-normal text-neutral-300">
                <Link to="/" className="hover:text-white transition-colors w-fit">Home</Link>
                <Link to="/map" className="hover:text-white transition-colors w-fit">Map</Link>
                <Link to="/support" className="hover:text-white transition-colors w-fit">Support</Link>
                <Link to="/404" className="hover:text-white transition-colors w-fit">404</Link>
              </div>
              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                UniMap is the official campus map of Madhav Institute of Technology and Science (MITS) Gwalior. Built to provide students, faculty, and visitors with precise indoor navigation across all academic blocks.
              </p>
            </div>

            {/* Right Column: stay in touch, socials, dev info */}
            <div className="flex flex-col justify-between h-full md:border-l md:border-dashed md:border-white/10 md:pl-12 py-1">
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-normal text-neutral-300">Stay in touch</span>
                <div className="flex gap-4 items-center">
                  <a
                    href="https://x.com/dotrwt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <TwitterIcon size={16} />
                  </a>
                  <a
                    href="https://www.instagram.com/rawwithharsh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <InstagramIcon size={16} />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/harshvardhan-rawat/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <LinkedinIcon size={16} />
                  </a>
                </div>
              </div>
              <div className="mt-6 md:mt-auto">
                <a
                  href="https://dotrwt.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white transition-colors text-xs font-normal"
                >
                  developed by dotrwt
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

