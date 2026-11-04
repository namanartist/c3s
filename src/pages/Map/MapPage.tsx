// src/pages/Map/MapPage.tsx
import React, { useEffect, useRef } from 'react';
import { MapLayout } from '@/components/ui/MapLayout';
import { MapHeader } from '@/components/ui/MapHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { MapCanvas } from '@/components/map/MapCanvas';
import RoutePanel from '@/components/route/RoutePanel';
import { CampusNavigationProvider, useCampusNavigation } from '@/hooks/useCampusNavigation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSafetyStore } from '@/store/safetyStore';
import { useC3SStore } from '@/store/c3sStore';
import { useSearchParams } from 'react-router-dom';
import { SOSSystem } from '@/components/ui/SOSSystem';
import { haversineDistanceMeters } from '@/lib/geoProjection';

export default function MapPage() {
  const currentRole = useC3SStore((s) => s.currentRole);
  const isStudent = currentRole === 'STUDENT';

  usePageMeta(
    'Interactive MITS Map - Campus Navigation',
    'Navigate Madhav Institute of Technology and Science (MITS) Gwalior campus. Plan routes to classrooms, departments, laboratories, and blocks with ease.'
  );

  return (
    <CampusNavigationProvider>
      <CampusUrlNavigationResolver />
      <MapLayout
        header={<MapHeader />}
        searchBar={<SearchBar />}
        mapCanvas={<MapCanvas />}
        routePanel={<RoutePanel />}
      />
      {!isStudent && <SOSSystem />}
    </CampusNavigationProvider>
  );
}

function CampusUrlNavigationResolver() {
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('incident');
  const toNodeId = searchParams.get('to');
  const destQuery = searchParams.get('dest') || searchParams.get('q');
  const mapParam = searchParams.get('map');
  const incidents = useSafetyStore((state) => state.incidents);
  const setSelectedIncident = useSafetyStore((state) => state.setSelectedIncident);
  const setActiveDashboard = useSafetyStore((state) => state.setActiveDashboard);
  const { loading, routeToSosIncident, handleDestinationSelect, setSelectedMapId, nodes } = useCampusNavigation();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !nodes || nodes.length === 0) return;

    const navKey = `${incidentId || ''}__${toNodeId || ''}__${destQuery || ''}__${mapParam || ''}`;
    if (!incidentId && !toNodeId && !destQuery && !mapParam) return;
    if (handledRef.current === navKey) return;
    handledRef.current = navKey;

    // Always ensure the interactive navigation UI is visible, not obstructed by the SOC dashboard
    setActiveDashboard('nav');

    // 1. Resolve Incident Navigation if requested (?incident=...)
    if (incidentId) {
      let targetIncident = incidents.find((item) => item.id === incidentId);

      if (!targetIncident) {
        const c3s = useC3SStore.getState();
        const c3sIncident = c3s.incidents.find((i) => i.id === incidentId);

        let targetNode = toNodeId ? nodes.find((n) => n.id === toNodeId) : null;
        if (!targetNode && c3sIncident) {
          if (c3sIncident.latitude && c3sIncident.longitude) {
            let minGeo = Infinity;
            for (const n of nodes) {
              if (n.lat != null && n.lng != null) {
                const d = haversineDistanceMeters(
                  { lat: c3sIncident.latitude, lon: c3sIncident.longitude },
                  { lat: n.lat, lon: n.lng }
                );
                if (d < minGeo) {
                  minGeo = d;
                  targetNode = n;
                }
              }
            }
          }
          if (!targetNode && c3sIncident.location) {
            const locLow = c3sIncident.location.toLowerCase();
            targetNode = nodes.find((n) => n.name && locLow.includes(n.name.toLowerCase())) ||
              nodes.find((n) => (n as any).building && locLow.includes((n as any).building.toLowerCase())) ||
              null;
          }
        }

        if (!targetNode) {
          targetNode = nodes.find((n) => n.id === c3s.sosNodeId) ||
            nodes.find((n) => n.id === 'Conclave') ||
            nodes[0];
        }

        targetIncident = {
          id: incidentId,
          category: c3sIncident?.type?.toLowerCase().includes('medical') ? 'medical' : 'security',
          severity: c3sIncident?.priority?.toLowerCase() === 'critical' ? 'critical' : 'high',
          title: c3sIncident?.title ? `🚨 SOS: ${c3sIncident.title}` : (targetNode?.name ? `🚨 SOS: ${targetNode.name}` : '🚨 Emergency SOS Location'),
          description: c3sIncident?.location || c3s.sosLocation || `Active SOS at ${targetNode?.name || 'Campus'}`,
          lat: targetNode?.lat || c3sIncident?.latitude || c3s.latitude || 26.230752,
          lng: targetNode?.lng || c3sIncident?.longitude || c3s.longitude || 78.205341,
          map: targetNode?.map || 'Campus_Map',
          floor: (targetNode as any)?.floor ?? 0,
          x: targetNode?.x ?? 500,
          y: targetNode?.y ?? 350,
          nodeId: targetNode?.id,
          timestamp: Date.now(),
          status: 'active'
        };
      }

      if (targetIncident) {
        setSelectedIncident(targetIncident);
        routeToSosIncident(targetIncident);
      }
      return;
    }

    // 2. Direct Destination Node Navigation (?to=nodeId)
    if (toNodeId) {
      const destNode = nodes.find((n) => n.id === toNodeId);
      if (destNode) {
        handleDestinationSelect({
          id: destNode.id,
          name: destNode.name || destNode.id,
          searchName: (destNode.name || destNode.id).toLowerCase(),
          map: destNode.map,
          floor: (destNode as any)?.floor ?? 0,
          building: (destNode as any)?.building || 'Campus',
          category: (destNode as any)?.category || 'Location',
          x: destNode.x,
          y: destNode.y,
          lat: destNode.lat,
          lng: destNode.lng,
        });
        if (destNode.map) {
          setSelectedMapId(destNode.map);
        }
      }
      return;
    }

    // 3. Search query or quick-destination navigation (?dest=... or ?q=...)
    if (destQuery) {
      const q = destQuery.trim().toLowerCase();
      const matchedNode =
        nodes.find((n) => n.id.toLowerCase() === q || (n.name && n.name.toLowerCase() === q)) ||
        nodes.find((n) => n.name && n.name.toLowerCase().includes(q)) ||
        nodes.find((n) => n.id.toLowerCase().includes(q)) ||
        (mapParam ? nodes.find((n) => n.map === mapParam && (n.name?.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))) : null);

      if (matchedNode) {
        handleDestinationSelect({
          id: matchedNode.id,
          name: matchedNode.name || matchedNode.id,
          searchName: (matchedNode.name || matchedNode.id).toLowerCase(),
          map: matchedNode.map,
          floor: (matchedNode as any)?.floor ?? 0,
          building: (matchedNode as any)?.building || 'Campus',
          category: (matchedNode as any)?.category || 'Location',
          x: matchedNode.x,
          y: matchedNode.y,
          lat: matchedNode.lat,
          lng: matchedNode.lng,
        });
        if (matchedNode.map) {
          setSelectedMapId(matchedNode.map);
        }
      } else if (mapParam) {
        setSelectedMapId(mapParam);
      }
      return;
    }

    // 4. Direct map selection (?map=...)
    if (mapParam) {
      setSelectedMapId(mapParam);
    }
  }, [
    incidentId,
    toNodeId,
    destQuery,
    mapParam,
    incidents,
    loading,
    nodes,
    routeToSosIncident,
    handleDestinationSelect,
    setSelectedMapId,
    setSelectedIncident,
    setActiveDashboard
  ]);

  return null;
}
