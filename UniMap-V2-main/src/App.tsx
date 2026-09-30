import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import useSmoothScroll from '@/hooks/smoothscroll';
import './styles/globals.css';

// Lazy loaded page components
const LandingPage = React.lazy(() => import('@/pages/Landing/LandingPage'));
const MapPage = React.lazy(() => import('@/pages/Map/MapPage'));
const SupportPage = React.lazy(() => import('@/pages/Support/SupportPage'));
const NotFoundPage = React.lazy(() => import('@/pages/404'));

// Spinner loading fallback component matching MapCanvas design
const LoadingFallback = () => (
  <div className="w-screen h-screen flex items-center justify-center bg-[var(--bg)]">
    <div className="animate-spin border-2 border-navy-500 rounded-full w-8 h-8 border-t-transparent" />
  </div>
);

function CampusMapWrapper() {
  return <MapPage />;
}

// Automatically scrolls the viewport and smooth scroll engine back to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}

/** Root App component setting up global routing, theme, and code-split pages. */
export default function App() {
  useSmoothScroll();
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<CampusMapWrapper />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Analytics />
    </Router>
  );
}

