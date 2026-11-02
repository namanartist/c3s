// src/components/safety/OfflineMeshBridge.tsx
import { useEffect, useRef } from 'react';
import { createOfflineMesh } from '@/lib/offlineMesh';
import { useSafetyStore } from '@/store/safetyStore';
import { useC3SStore } from '@/store/c3sStore';
import { broadcastSosIncident, startRealtimeSosSync } from '@/lib/realtimeSosMesh';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';
import type { SosIncident } from '@/types/safety';

export function OfflineMeshBridge() {
  const processedIncidentIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 1. Local Browser Tab Mesh
    const mesh = createOfflineMesh((packet) => {
      if (packet.type === 'incident' && packet.incident) {
        useSafetyStore.getState().mergeMeshIncident(packet.incident);
      }
    });

    // 2. Cross-Device Real-Time Sync (Supabase Realtime + LAN /api/sos Polling)
    const stopRealtimeSync = startRealtimeSosSync((remoteIncident: SosIncident) => {
      const isNew = !processedIncidentIds.current.has(remoteIncident.id);
      processedIncidentIds.current.add(remoteIncident.id);

      // Merge into safetyStore
      useSafetyStore.getState().mergeMeshIncident(remoteIncident);

      // Also merge into c3sStore so Security & Proctor stations see it immediately
      const c3sStore = useC3SStore.getState();
      const existingC3S = c3sStore.incidents.find((i) => i.id === remoteIncident.id);
      if (!existingC3S) {
        c3sStore.incidents = [
          {
            id: remoteIncident.id,
            title: remoteIncident.title,
            type: 'Security Threat',
            priority: (remoteIncident.severity?.toUpperCase() as any) || 'CRITICAL',
            location: `${remoteIncident.map} (Floor ${remoteIncident.floor})`,
            zone: remoteIncident.map,
            reportedAt: new Date(remoteIncident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reportedBy: remoteIncident.reportedBy || 'Student Distress Signal',
            reportedById: 'STU-DISTRESS',
            reporterPhone: '+91 751-2409300',
            status: remoteIncident.status === 'resolved' ? 'RESOLVED' : 'ALERT SENT',
            distanceMeters: 45,
            assignedResponder: remoteIncident.responderAssigned || 'Guard 02 & Faculty',
            latitude: remoteIncident.lat,
            longitude: remoteIncident.lng,
            timeline: [
              { time: 'Just now', event: 'Real-time SOS telemetry received from campus mesh.', actor: 'Emergency Network' }
            ],
            photoUrl: remoteIncident.evidence?.photoUrl,
            videoUrl: remoteIncident.evidence?.videoUrl || '/videos/cctv_recorded_incident.mp4',
            evidence: remoteIncident.evidence
          },
          ...c3sStore.incidents
        ];
      } else if (remoteIncident.status === 'resolved' && existingC3S.status !== 'RESOLVED') {
        existingC3S.status = 'RESOLVED';
      }

      // If active and new, trigger proctor emergency siren and campus alert banner!
      if (isNew && remoteIncident.status === 'active' && remoteIncident.severity === 'critical') {
        globalProctorAlarm.triggerAlarm(`Real-time SOS from ${remoteIncident.title}`);
        useSafetyStore.getState().triggerCampusAlert({
          type: 'lockdown',
          active: true,
          title: remoteIncident.title,
          message: `Location: ${remoteIncident.map} • Dispatched: Guard, Faculty & Proctor.`,
          issuedBy: 'Emergency C3S Network'
        });
      }
    });

    // 3. Watch local store changes and broadcast to network
    const initialIds = new Set(useSafetyStore.getState().incidents.map((incident) => incident.id));
    let known = new Map(useSafetyStore.getState().incidents.map((incident) => [incident.id, JSON.stringify(incident)]));

    const unsubscribe = useSafetyStore.subscribe((state) => {
      for (const incident of state.incidents) {
        const serialized = JSON.stringify(incident);
        if (known.get(incident.id) === serialized) continue;
        known.set(incident.id, serialized);

        if (!initialIds.has(incident.id) || incident.deliveryState === 'queued') {
          // Send to local browser tabs
          mesh?.sendIncident(incident);
          // Broadcast to other physical devices over network / IP
          broadcastSosIncident(incident);
        }
      }
    });

    return () => {
      unsubscribe();
      mesh?.close();
      stopRealtimeSync();
    };
  }, []);

  return null;
}
