// src/hooks/smoothscroll.ts
import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Custom hook to initialize Lenis smooth scrolling globally and intercept anchor
 * clicks to scroll smoothly with a custom offset.
 * Bypasses smooth scrolling on full-screen interactive map views to prevent wheel conflicts and UI lag.
 */
export default function useSmoothScroll(offset = 90) {
  useEffect(() => {
    // Disable Lenis on interactive map routes to allow direct native zoom & pan
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/map')) {
      return;
    }

    // Initialize Lenis with smooth settings
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      // Do not hijack scroll on map elements or interactive canvases
      prevent: (node) => {
        if (!node) return false;
        return (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') !== null ||
          node.tagName.toLowerCase() === 'svg' ||
          node.closest('svg') !== null
        );
      }
    });

    // Request animation frame loop (pauses when tab is hidden to prevent background CPU spin)
    let rafId: number;
    function raf(time: number) {
      if (document.visibilityState !== 'hidden') {
        lenis.raf(time);
      }
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Intercept anchor clicks
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;

      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      e.preventDefault();
      lenis.scrollTo(targetElement, {
        offset: -offset,
        duration: 1.2,
      });
    };

    document.addEventListener('click', handleAnchorClick);

    // Expose Lenis globally for custom functions
    (window as any).lenis = lenis;

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as any).lenis;
    };
  }, [offset]);
}

/**
 * Programmatic utility to smooth scroll to a target element selector using the active Lenis instance.
 */
export function smoothScrollTo(targetSelector: string, offset = 90) {
  const lenis = (window as any).lenis;
  if (lenis) {
    lenis.scrollTo(targetSelector, {
      offset: -offset,
      duration: 1.2,
    });
  } else {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return;
    targetElement.scrollIntoView({ behavior: 'smooth' });
  }
}
