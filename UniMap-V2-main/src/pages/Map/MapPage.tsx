// src/pages/Map/MapPage.tsx
import React, { Suspense } from 'react';
import { MapLayout } from '@/components/ui/MapLayout';
import { MapHeader } from '@/components/ui/MapHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { CampusNavigationProvider } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';

const RoutePanelLazy = React.lazy(() =>
  import('@/components/route/RoutePanel').then((m) => ({ default: m.RoutePanel }))
);

export function RoutePanel(props: Record<string, unknown>) {
  return (
    <Suspense fallback={null}>
      <RoutePanelLazy {...props} />
    </Suspense>
  );
}

export default function MapPage() {
  usePageMeta(
    'Interactive MITS Map — Campus Navigation',
    'Navigate Madhav Institute of Technology and Science (MITS) Gwalior campus. Plan routes to classrooms, departments, laboratories, and blocks with ease.'
  );

  return (
    <CampusNavigationProvider>
      <MapLayout
        header={<MapHeader />}
        searchBar={<SearchBar />}
        mapCanvas={<MapCanvas />}
        routePanel={<RoutePanel />}
      />
    </CampusNavigationProvider>
  );
}

