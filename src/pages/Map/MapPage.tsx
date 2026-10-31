// src/pages/Map/MapPage.tsx
import React, { Suspense, useEffect, useRef } from 'react';
import { MapLayout } from '@/components/ui/MapLayout';
import { MapHeader } from '@/components/ui/MapHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import { CampusNavigationProvider, useCampusNavigation } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSafetyStore } from '@/store/safetyStore';
import { useC3SStore } from '@/store/c3sStore';
import { useSearchParams } from 'react-router-dom';
import { SOSSystem } from '@/components/ui/SOSSystem';
import type { SosIncident } from '@/types/safety';

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
  const toNodeId = searchParams.get('to');
  const incidents = useSafetyStore((state) => state.incidents);
  const setSelectedIncident = useSafetyStore((state) => state.setSelectedIncident);
  const setActiveDashboard = useSafetyStore((state) => state.setActiveDashboard);
  const { loading, routeToSosIncident, nodes } = useCampusNavigation();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    // 1. Resolve Incident Navigation if requested (?incident=...)
    if (incidentId && handledRef.current !== `incident-${incidentId}`) {
      handledRef.current = `incident-${incidentId}`;
      setActiveDashboard('soc');
      let targetIncident = incidents.find((item) => item.id === incidentId);

      if (!targetIncident) {
        const c3s = useC3SStore.getState();
        const fallbackTargetNode = nodes.find((n) => n.id === c3s.sosNodeId) || nodes[0];
        targetIncident = {
          id: incidentId,
          category: 'security',
          severity: 'critical',
          title: '🚨 Emergency SOS Location',
          description: c3s.sosLocation || 'Active Student SOS Broadcast',
          lat: c3s.latitude || fallbackTargetNode?.lat || 26.230752,
          lng: c3s.longitude || fallbackTargetNode?.lng || 78.205341,
          map: fallbackTargetNode?.map || 'Campus_Map',
          floor: 0,
          x: fallbackTargetNode?.x ?? 500,
          y: fallbackTargetNode?.y ?? 350,
          timestamp: Date.now(),
          status: 'active'
        };
      }

      setSelectedIncident(targetIncident);
      routeToSosIncident(targetIncident);
      return;
    }

    // 2. Resolve Direct Node Navigation if ?to=nodeId is provided
    if (toNodeId && nodes.length > 0 && handledRef.current !== `to-${toNodeId}`) {
      handledRef.current = `to-${toNodeId}`;
      const destNode = nodes.find((n) => n.id === toNodeId);
      if (destNode) {
        const pseudoIncident: SosIncident = {
          id: `target-${destNode.id}`,
          category: 'infrastructure',
          severity: 'medium',
          title: destNode.name || destNode.id,
          description: `Direct Navigation Target: ${destNode.name || destNode.id}`,
          lat: destNode.lat || 26.230752,
          lng: destNode.lng || 78.205341,
          map: destNode.map,
          floor: 0,
          x: destNode.x,
          y: destNode.y,
          timestamp: Date.now(),
          status: 'resolved'
        };
        routeToSosIncident(pseudoIncident);
      }
    }
  }, [incidentId, toNodeId, incidents, loading, routeToSosIncident, setSelectedIncident, setActiveDashboard, nodes]);

  return null;
}
