// src/pages/Map/MapPage.tsx
import React, { Suspense } from 'react';
import { MapLayout } from '@/components/ui/MapLayout';
import { MapHeader } from '@/components/ui/MapHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { CampusNavigationProvider, useCampusNavigation } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSafetyStore } from '@/store/safetyStore';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { SOSSystem } from '@/components/ui/SOSSystem';

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
    'Interactive MITS Map - Campus Navigation',
    'Navigate Madhav Institute of Technology and Science (MITS) Gwalior campus. Plan routes to classrooms, departments, laboratories, and blocks with ease.'
  );

  return (
    <CampusNavigationProvider>
      <IncidentMapResolver />
      <MapLayout
        header={<MapHeader />}
        searchBar={<SearchBar />}
        mapCanvas={<MapCanvas />}
        routePanel={<RoutePanel />}
      />
      <SOSSystem />
    </CampusNavigationProvider>
  );
}

function IncidentMapResolver() {
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('incident');
  const incidents = useSafetyStore((state) => state.incidents);
  const setSelectedIncident = useSafetyStore((state) => state.setSelectedIncident);
  const { loading, routeToSosIncident } = useCampusNavigation();
  const handledIncidentRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !incidentId || handledIncidentRef.current === incidentId) return;
    const incident = incidents.find((item) => item.id === incidentId);
    if (!incident) return;

    handledIncidentRef.current = incidentId;
    setSelectedIncident(incident);
    routeToSosIncident(incident);
  }, [incidentId, incidents, loading, routeToSosIncident, setSelectedIncident]);

  return null;
}

