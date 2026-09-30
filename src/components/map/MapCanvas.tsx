// src/components/map/MapCanvas.tsx
import { memo } from 'react';
import MapBox from '@/components/ui/MapBox';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { isProctorRole } from '@/lib/viewerRole';

export interface MapCanvasProps {
  className?: string;
}

function MapCanvasComponent({ className = '' }: MapCanvasProps) {
  const {
    nodes,
    activeMapId,
    destination,
    currentLocation,
    isNavigating,
    pathPoints,
    autoFitNonce,
    floors,
    buildings,
    setSelectedMapId,
  } = useCampusNavigation();
  const proctorMode = isProctorRole();

  return (
    <div className={`w-full h-full relative ${className}`}>
      <MapBox
        mapId={activeMapId}
        destination={destination}
        currentLocation={currentLocation}
        isNavigating={isNavigating}
        pathPoints={pathPoints}
        autoFitNonce={autoFitNonce}
        floors={floors}
        buildings={buildings}
        nodes={nodes}
        proctorMode={proctorMode}
        onMapChange={setSelectedMapId}
      />
    </div>
  );
}

export const MapCanvas = memo(MapCanvasComponent);

