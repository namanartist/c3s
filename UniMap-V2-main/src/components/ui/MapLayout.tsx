import React from 'react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';

export interface MapLayoutProps {
  header?: React.ReactNode;
  searchBar?: React.ReactNode;
  mapCanvas?: React.ReactNode;
  routePanel?: React.ReactNode;
}

export function MapLayout({ header, searchBar, mapCanvas, routePanel }: MapLayoutProps) {
  const { isMobile, loading } = useCampusNavigation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#ff602e] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-650 text-sm font-semibold">Loading campus navigation...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#fcfaf6] select-none flex flex-col">
        {/* Full Screen Interactive Map Canvas */}
        <div className="flex-1 relative w-full h-full z-0">
          {mapCanvas}
        </div>
        {searchBar}
        {routePanel}
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fcfaf6] select-none flex flex-col">
      {/* Full Screen Interactive Map Canvas */}
      <div className="flex-1 relative w-full h-full z-0">
        {mapCanvas}
      </div>

      {header}

      {/* Floating Search & Route Drawer (Left Side) */}
      <div className="absolute top-6 left-6 z-10 w-[385px] h-[calc(100vh-48px)] flex flex-col bg-gradient-to-b from-white via-white to-[#faf8f5] rounded-[24px] shadow-2xl border border-black/[0.04] overflow-hidden pointer-events-auto">
        {/* Drawer Mini Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-[#ff602e]/5 to-[#ff7b52]/5">
          <span className="text-base font-black text-gray-900 tracking-wider uppercase">UniMap Navigation</span>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar" data-lenis-prevent>
          {searchBar}
          {routePanel}
        </div>
      </div>
    </div>
  );
}
