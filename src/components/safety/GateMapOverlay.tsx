import React from 'react';
import { animated, to } from '@react-spring/web';
import type { SpringValue } from '@react-spring/web';
import { useGateStore } from '@/store/gateStore';
import { useSafetyStore } from '@/store/safetyStore';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { CAMPUS_GEOFENCE_POLYGON } from '@/lib/gateSecurity';
import { gpsToSvg } from '@/lib/geoProjection';
import type { CampusGate } from '@/types/gate';

interface GateMapOverlayProps {
  mapId: string | null;
  zoom: SpringValue<number>;
  onSelectGate?: (gate: CampusGate) => void;
}

export const GateMapOverlay: React.FC<GateMapOverlayProps> = ({
  mapId,
  zoom,
  onSelectGate
}) => {
  const gates = useGateStore((s) => s.gates);
  const setActiveGate = useGateStore((s) => s.setActiveGate);
  const setScannerModalOpen = useGateStore((s) => s.setScannerModalOpen);
  const cctvCameras = useSafetyStore((s) => s.cctvCameras);
  const setSelectedCamera = useSafetyStore((s) => s.setSelectedCamera);
  const { handleDestinationSelect } = useCampusNavigation();

  // Gates and Geofence are on the main Campus_Map
  if (mapId !== 'Campus_Map') return null;

  // Convert GPS Geofence boundary polygon vertices to SVG coordinates
  const svgGeofencePoints = CAMPUS_GEOFENCE_POLYGON.map(([lat, lon]) => {
    const pt = gpsToSvg({ lat, lon });
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const handleGateClick = (e: React.MouseEvent, gate: CampusGate) => {
    e.stopPropagation();
    setActiveGate(gate.id);
    if (onSelectGate) {
      onSelectGate(gate);
    } else {
      // Set destination in UniMap for turn-by-turn routing
      handleDestinationSelect({
        id: gate.id,
        name: gate.name,
        map: gate.map,
        floor: gate.floor,
        x: gate.x,
        y: gate.y,
        category: 'Gate'
      });
    }
  };

  const handleCameraClick = (e: React.MouseEvent, cam: typeof cctvCameras[0]) => {
    e.stopPropagation();
    setSelectedCamera(cam);
  };

  return (
    <g aria-label="C3S Campus Security & Gate Overlay" className="pointer-events-auto">
      <defs>
        {/* CCTV Field-of-View Sweep Gradient */}
        <radialGradient id="cctvConeGradient" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>

        <filter id="gateBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* 1. CAMPUS GEOFENCE PERIMETER POLYGON */}
      {svgGeofencePoints && (
        <g className="pointer-events-none">
          {/* Subtle perimeter fill */}
          <polygon
            points={svgGeofencePoints}
            fill="#3b82f6"
            fillOpacity="0.02"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinejoin="round"
            strokeOpacity="0.5"
          />
          {/* Outer glow ring */}
          <polygon
            points={svgGeofencePoints}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="6"
            strokeOpacity="0.1"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* 2. CCTV CAMERA FOV CONES & ICONS */}
      {cctvCameras
        .filter((cam) => cam.map === mapId)
        .map((cam) => {
          const isAlert = cam.status === 'alert';
          const coneColor = isAlert ? '#ef4444' : '#2563eb';
          const angle = cam.bearingDeg || 0;
          const fov = cam.coverageAngleDeg || 90;
          const coneLength = 55;
          const rad1 = ((angle - fov / 2) * Math.PI) / 180;
          const rad2 = ((angle + fov / 2) * Math.PI) / 180;
          const x1 = Math.sin(rad1) * coneLength;
          const y1 = -Math.cos(rad1) * coneLength;
          const x2 = Math.sin(rad2) * coneLength;
          const y2 = -Math.cos(rad2) * coneLength;
          const fovPath = `M 0 0 L ${x1} ${y1} A ${coneLength} ${coneLength} 0 0 1 ${x2} ${y2} Z`;

          return (
            <animated.g
              key={cam.id}
              onClick={(e) => handleCameraClick(e, cam)}
              className="cursor-pointer transition-transform hover:opacity-90"
              style={{
                transform: to([zoom], (z) => `translate(${cam.x}px, ${cam.y}px) scale(${1 / z})`)
              }}
            >
              {/* CCTV FOV Viewing Cone */}
              <path
                d={fovPath}
                fill={isAlert ? '#ef4444' : 'url(#cctvConeGradient)'}
                opacity={isAlert ? 0.25 : 0.8}
                stroke={coneColor}
                strokeWidth="0.8"
                strokeOpacity="0.4"
                strokeDasharray="3 2"
              />

              {/* Central Camera Node */}
              <circle cx="0" cy="0" r="7" fill={isAlert ? '#dc2626' : '#1e293b'} stroke="#ffffff" strokeWidth="2" />
              <circle cx="0" cy="0" r="2.5" fill={isAlert ? '#ffffff' : '#38bdf8'} />

              {/* Real-time Crowd Headcount Badge */}
              {cam.crowdCount !== undefined && (
                <g transform="translate(0, -14)">
                  <rect
                    x="-18"
                    y="-9"
                    width="36"
                    height="17"
                    rx="8.5"
                    fill={isAlert ? '#dc2626' : '#0f172a'}
                    stroke={isAlert ? '#f87171' : '#38bdf8'}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    👥{cam.crowdCount}
                  </text>
                </g>
              )}
            </animated.g>
          );
        })}

      {/* 3. PHYSICAL CAMPUS GATES (MAIN, JUBILEE, PARKING) */}
      {(Object.values(gates) as CampusGate[]).map((gate) => (
        <animated.g
          key={gate.id}
          onClick={(e) => handleGateClick(e, gate)}
          className="cursor-pointer group"
          style={{
            transform: to([zoom], (z) => `translate(${gate.x}px, ${gate.y}px) scale(${1 / z})`)
          }}
        >
          {/* Outer Pulsing Gate Ring */}
          <circle cx="0" cy="0" r="18" fill="#2563eb" opacity="0.15" />
          <circle cx="0" cy="0" r="12" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2.5" />

          {/* Gate Barrier / Shield Graphic */}
          <path
            d="M -4 -3 L 4 -3 L 4 2 C 4 4 0 6 0 6 C 0 6 -4 4 -4 2 Z"
            fill="#ffffff"
          />

          {/* Interactive Gate Info Badge Overlay */}
          <g transform="translate(0, -28)" filter="url(#gateBadgeShadow)">
            <rect
              x="-60"
              y="-12"
              width="120"
              height="24"
              rx="12"
              fill="#0f172a"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              fontSize="8.5"
              fill="#ffffff"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              🚪 {gate.name.split(' ')[0]} {gate.name.split(' ')[1]}
            </text>
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fontSize="6.5"
              fill="#38bdf8"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              IN: {gate.checkInsToday} • OUT: {gate.checkOutsToday}
            </text>
          </g>

          {/* Daily Rotating QR Mini Badge */}
          <g
            transform="translate(14, -8)"
            onClick={(e) => {
              e.stopPropagation();
              setActiveGate(gate.id);
              setScannerModalOpen(true);
            }}
            className="hover:scale-110 transition-transform"
          >
            <rect x="-10" y="-8" width="20" height="16" rx="4" fill="#16a34a" stroke="#ffffff" strokeWidth="1" />
            <text x="0" y="3" textAnchor="middle" fontSize="6.5" fill="#ffffff" fontWeight="bold">
              QR
            </text>
          </g>
        </animated.g>
      ))}
    </g>
  );
};
