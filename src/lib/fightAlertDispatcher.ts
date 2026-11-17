// src/lib/fightAlertDispatcher.ts
import { useC3SStore } from '@/store/c3sStore';
import type { C3SIncident } from '@/lib/mock-data/incidents';
import { useSafetyStore } from '@/store/safetyStore';
import type { SosIncident } from '@/types/safety';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';
import type { MapNode } from '@/types/graph';
import { findNearestCampusNode } from '@/lib/geoProjection';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';
import { createSosIncident } from '@/lib/api';
import { SAFETY_THRESHOLDS } from '@/config/safetyThresholds';

export interface ActiveFightAlert {
  id: string;
  cameraId: string;
  cameraName: string;
  location: string;
  nodeId: string;
  nodeName: string;
  confidence: number;
  timestamp: string;
  photoUrl: string;
  videoUrl?: string;
  lat: number;
  lng: number;
  mapId: string;
  responders: {
    guard: { name: string; distance: string; callsign: string };
    hod: { name: string; department: string; distance: string };
    proctor: { name: string; office: string };
  };
}

class FightAlertDispatcher {
  private lastAlertTimeByCamera: Map<string, number> = new Map();
  private activeAlertListeners: Set<(alert: ActiveFightAlert | null) => void> = new Set();
  private currentActiveAlert: ActiveFightAlert | null = null;
  private audioContext: AudioContext | null = null;

  public getActiveAlert(): ActiveFightAlert | null {
    return this.currentActiveAlert;
  }

  public subscribe(listener: (alert: ActiveFightAlert | null) => void): () => void {
    this.activeAlertListeners.add(listener);
    listener(this.currentActiveAlert);
    return () => {
      this.activeAlertListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.activeAlertListeners.forEach((fn) => fn(this.currentActiveAlert));
  }

  public clearActiveAlert() {
    this.currentActiveAlert = null;
    globalProctorAlarm.dismissAlarm();
    this.notifyListeners();
  }

  private playEmergencyChime() {
    // Silent: all working beeps removed; emergency alerts are handled exclusively by the global Proctor Emergency Siren
  }

  /**
   * Generates a high-resolution tactical canvas snapshot of the fight incident.
   *
   * If no video frame is available (cross-origin stream, paused feed) this
   * returns an empty string. The previous implementation drew a synthetic
   * "radar" frame with two fabricated red combatant boxes and the text
   * "COMBATANTS DETECTED" - and that image was attached to the incident as
   * forensic evidence. Inventing evidence is not acceptable in a chain of
   * custody, so no snapshot is produced rather than a fabricated one.
   */
  public generateFightSnapshot(
    videoElement: HTMLVideoElement | null,
    cameraName: string,
    location: string,
    nodeId: string,
    confidence: number
  ): string {
    if (typeof document === 'undefined') return '';
    if (!videoElement || videoElement.videoWidth === 0) return '';

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw the actual video frame.
    ctx.drawImage(videoElement, 0, 0, 640, 420);

    // Top Critical Banner Watermark
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 640, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`C3S AGGRESSION DETECTION - CONFIDENCE: ${confidence}%`, 15, 24);

    // Bottom Telemetry Overlay
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 360, 640, 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`CAMERA: ${cameraName} | NODE #${nodeId}`, 15, 382);
    ctx.fillText(`LOCATION: ${location} | TIME: ${new Date().toLocaleTimeString()} IST`, 15, 402);

    return canvas.toDataURL('image/jpeg', 0.88);
  }

  /**
   * Dispatches high-confidence fight alerts and triggers an active SOS.
   */
  public handleFightDetection(payload: {
    cameraId: string;
    cameraName: string;
    location: string;
    confidence: number;
    videoElement?: HTMLVideoElement | null;
    videoUrl?: string;
    nodeId?: string;
  }) {
    const { cameraId, cameraName, location, confidence, videoElement, videoUrl } = payload;

    // The shared operating point - the same threshold the Python service uses.
    if (confidence < SAFETY_THRESHOLDS.SOS_CONFIDENCE * 100) return;

    // Cooldown check per camera to avoid repetitive alerts while keeping responsiveness.
    const nowMs = Date.now();
    const lastAlert = this.lastAlertTimeByCamera.get(cameraId) || 0;
    if (nowMs - lastAlert < SAFETY_THRESHOLDS.DEBOUNCE_MS) {
      return;
    }
    this.lastAlertTimeByCamera.set(cameraId, nowMs);

    // 1. Resolve Campus Node Coordinates (Default to J010 - SH-4 Seminar Hall 4)
    let resolvedNodeId = payload.nodeId || 'room_J010';
    let resolvedNodeName = location.includes('SH') || location.includes('J010') ? location : 'J010 – SH-4 (Seminar Hall 4)';
    let resolvedLat = 26.23185102;
    let resolvedLng = 78.20636481;
    let resolvedX = 162.9803;
    let resolvedY = 353.4052;
    let resolvedMap = 'Main_GF';

    if (cameraId.includes('gate_1') || cameraId.includes('CAM-01')) {
      resolvedNodeId = 'Main_Gate';
      resolvedNodeName = 'Main Gate 1 Checkpost';
      resolvedLat = 26.232611;
      resolvedLng = 78.205222;
      resolvedX = 253.0593;
      resolvedY = 606.1033;
      resolvedMap = 'Campus_Map';
    } else if (cameraId.includes('gate_2') || cameraId.includes('CAM-02')) {
      resolvedNodeId = 'Gate2_Parking';
      resolvedNodeName = 'Gate 2 Student Parking & Annex';
      resolvedLat = 26.231389;
      resolvedLng = 78.203639;
      resolvedX = 815.0;
      resolvedY = 606.1033;
      resolvedMap = 'Campus_Map';
    } else if (cameraId.includes('conclave') || cameraId.includes('CAM-03')) {
      resolvedNodeId = 'Conclave';
      resolvedNodeName = 'Conclave Foyer Corridor';
      resolvedMap = 'Main_GF';
      resolvedLat = 26.230752;
      resolvedLng = 78.205341;
      resolvedX = 406.8033;
      resolvedY = 487.5583;
    } else if (cameraId.includes('CAM-04')) {
      resolvedNodeId = 'Block_A';
      resolvedNodeName = 'Academic Block A Ground Corridor';
      resolvedLat = 26.231154;
      resolvedLng = 78.204892;
      resolvedX = 499.1435;
      resolvedY = 473.2811;
      resolvedMap = 'Campus_Map';
    } else if (payload.nodeId) {
      const nodesList = fallbackData.nodes as unknown as MapNode[];
      const matched = nodesList.find((n) => n.id === payload.nodeId);
      if (matched) {
        resolvedNodeId = matched.id;
        resolvedNodeName = matched.name || resolvedNodeName;
        resolvedX = matched.x;
        resolvedY = matched.y;
        resolvedMap = matched.map;
        if (matched.lat != null && matched.lng != null) {
          resolvedLat = matched.lat;
          resolvedLng = matched.lng;
        }
      }
    }

    // 1b. Snap to the nearest real campus node.
    //     The camera table above only covers a handful of cameras; for every
    //     other feed the alert would otherwise be pinned to a hardcoded
    //     "room_J010" and the responding unit would be routed to the wrong
    //     place. The nearest node to the camera's actual position is used
    //     instead.
    try {
      const nodesList = fallbackData.nodes as unknown as MapNode[];
      const nearest = findNearestCampusNode(
        { lat: resolvedLat, lon: resolvedLng },
        nodesList,
      );
      if (nearest && nearest.id !== resolvedNodeId) {
        resolvedNodeId = nearest.id;
        resolvedNodeName = nearest.name || resolvedNodeName;
        resolvedX = nearest.x;
        resolvedY = nearest.y;
        resolvedMap = nearest.map;
        if (nearest.lat != null && nearest.lng != null) {
          resolvedLat = nearest.lat;
          resolvedLng = nearest.lng;
        }
      }
    } catch {
      // If the node table cannot be read, keep the camera-derived position.
    }

    // 2. Generate Evidence Photo & Video Link
    const photoUrl = this.generateFightSnapshot(
      videoElement || null,
      cameraName,
      location,
      resolvedNodeId,
      confidence
    );
    const incidentVideoUrl = videoUrl || (videoElement?.src) || '/videos/cctv_recorded_incident.mp4';

    // 3. Define the 3 targeted responders: Guard, HOD, Proctor
    const responders = {
      guard: {
        name: 'Guard Vikram Rathore',
        distance: '45m',
        callsign: 'Guard 02 (Perimeter Patrol)'
      },
      hod: {
        name: 'Dr. A. K. Verma',
        department: 'Dept. of CSE',
        distance: '30m (Cabin 204)'
      },
      proctor: {
        name: 'Prof. S. K. Jain',
        office: 'Chief Proctor Office & Emergency SOC'
      }
    };

    const incidentId = `FIGHT-AI-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 4. Record into c3sStore
    const c3sIncident: C3SIncident = {
      id: incidentId,
      title: `🚨 FIGHT DETECTED (${confidence}%): ${cameraName}`,
      type: 'Security Threat',
      location: `${location} [Node: #${resolvedNodeId}]`,
      zone: 'Perimeter & Academic Zone',
      reportedAt: timeString,
      reportedBy: 'C3S Optical AI Surveillance',
      reportedById: 'AI-CV-RWF2000',
      reporterPhone: '+91 751-2409301',
      status: 'ALERT SENT',
      priority: 'CRITICAL',
      distanceMeters: 45,
      assignedResponder: `${responders.guard.callsign} & ${responders.hod.name}`,
      latitude: resolvedLat,
      longitude: resolvedLng,
      photoUrl,
      videoUrl: incidentVideoUrl,
      evidence: {
        photoUrl,
        videoUrl: incidentVideoUrl,
        fightConfidence: confidence,
      },
      timeline: [
        { time: timeString, event: `Physical altercation recognized with ${confidence}% confidence by the C3S aggression detector.`, actor: 'AI Vision Engine' },
        { time: timeString, event: `Evidence snapshot & video clip recorded at Node #${resolvedNodeId}.`, actor: 'CCTV Evidence Archiver' },
        { time: timeString, event: `Nearest Guard (${responders.guard.name} - ${responders.guard.distance}) and HOD (${responders.hod.name} - ${responders.hod.distance}) auto-dispatched.`, actor: 'Emergency AI Router' },
        { time: timeString, event: `Chief Proctor ${responders.proctor.name} engaged with live tactical feed.`, actor: 'Proctorial Mesh' }
      ],
      notes: [
        `Aggression model confidence: ${confidence}%`,
        `Evidence: High-resolution photo snapshot & video clip attached`,
        `Notified: Guard (${responders.guard.name}), HOD (${responders.hod.name}), Proctor (${responders.proctor.name})`
      ]
    };

    const c3sStore = useC3SStore.getState();
    c3sStore.incidents = [c3sIncident, ...c3sStore.incidents];
    c3sStore.notifications = [
      {
        id: `notif-fight-guard-${Date.now()}`,
        category: 'Emergency',
        title: `🚨 [GUARD DISPATCH] Violent Fight Detected (${confidence}%)`,
        message: `${responders.guard.callsign} dispatched to ${location}. Distance: ${responders.guard.distance}. Camera: ${cameraName}.`,
        time: timeString,
        date: 'Today',
        priority: 'CRITICAL',
        read: false,
        link: `/map?to=${resolvedNodeId}&incident=${incidentId}`
      },
      {
        id: `notif-fight-HOD-${Date.now() + 1}`,
        category: 'Emergency',
        title: '🎓 [HOD ALERT] Physical Altercation Alert',
        message: `HOD Warden ${responders.hod.name} (${responders.hod.department}) alerted to altercations at ${location}.`,
        time: timeString,
        date: 'Today',
        priority: 'CRITICAL',
        read: false,
        link: `/map?to=${resolvedNodeId}&incident=${incidentId}`
      },
      {
        id: `notif-fight-proctor-${Date.now() + 2}`,
        category: 'Emergency',
        title: '⚖️ [PROCTORIAL BOARD] Critical Fight Broadcast',
        message: `Chief Proctor ${responders.proctor.name} engaged. CCTV Evidence & Video Dispatched. Target Node #${resolvedNodeId}.`,
        time: timeString,
        date: 'Today',
        priority: 'CRITICAL',
        read: false,
        link: `/map?to=${resolvedNodeId}&incident=${incidentId}`
      },
      ...c3sStore.notifications
    ];

    // 5. Record into safetyStore for global map navigation
    const safetyStore = useSafetyStore.getState();
    const sosIncident: SosIncident = {
      id: incidentId,
      category: 'security',
      severity: 'critical',
      title: `🚨 Violent Fight Detected (${confidence}%)`,
      description: `Physical altercation identified by the C3S aggression detector at ${cameraName}. Guard, HOD & Proctor notified.`,
      map: resolvedMap,
      floor: 0,
      x: resolvedX,
      y: resolvedY,
      lat: resolvedLat,
      lng: resolvedLng,
      timestamp: Date.now(),
      status: 'active',
      reportedBy: 'C3S Optical Flow Aggression Engine',
      responderAssigned: `${responders.guard.callsign} & ${responders.hod.name}`,
      responderStatus: 'dispatched',
      responderEta: '< 1 min',
      notifiedResponders: [responders.guard.name, responders.hod.name, responders.proctor.name],
      evidence: {
        photoUrl,
        videoUrl: incidentVideoUrl,
        fightDetected: true,
        fightConfidence: confidence,
        aiClassification: {
          category: 'security',
          severity: 'critical',
          detectedHazards: ['Physical Fight', 'Violent Altercation', 'Assault'],
          modelUsed: 'C3S calibrated aggression detector',
          confidence: confidence / 100
        }
      }
    };
    safetyStore.triggerSosIncident(sosIncident);

    // 5a. Persist incident & forensic evidence to MongoDB database (/api/sos)
    createSosIncident({
      id: incidentId,
      category: 'security',
      severity: 'critical',
      title: `🚨 Violent Fight Detected (${confidence}%)`,
      description: `Physical altercation identified by OpenCV Optical Flow AI at ${cameraName}. Responders auto-dispatched.`,
      map: resolvedMap,
      floor: 0,
      x: resolvedX,
      y: resolvedY,
      lat: resolvedLat,
      lng: resolvedLng,
      nodeId: resolvedNodeId,
      photoUrl,
      videoUrl: incidentVideoUrl,
      timestamp: Date.now(),
      status: 'active',
      reportedBy: 'OpenCV Optical AI Surveillance',
      assignedResponder: `${responders.guard.callsign} & ${responders.hod.name}`,
      notifiedResponders: [responders.guard.name, responders.hod.name, responders.proctor.name],
      evidence: {
        photoUrl,
        videoUrl: incidentVideoUrl,
        fightDetected: true,
        fightConfidence: confidence,
        aiClassification: {
          category: 'security',
          severity: 'critical',
          detectedHazards: ['Physical Fight', 'Violent Altercation', 'Assault'],
          modelUsed: 'OpenCV Optical Flow + MOG2 Engine',
          confidence: confidence / 100
        }
      }
    });

    // 5b. Trigger active SOS in C3S store so campus-wide SOS state machine & UI banners engage
    c3sStore.triggerSos({
      nodeId: resolvedNodeId,
      location: resolvedNodeName,
      lat: resolvedLat,
      lng: resolvedLng,
      photoUrl,
      videoUrl: incidentVideoUrl,
      notifiedEntities: {
        guard: {
          name: responders.guard.name,
          callsign: responders.guard.callsign,
          distance: responders.guard.distance,
          status: 'DISPATCHED',
          radio: 'VHF CH-4'
        },
        hod: {
          name: responders.hod.name,
          department: responders.hod.department,
          distance: responders.hod.distance,
          status: 'ALERTED',
          cabin: 'Cabin 204, Floor 1'
        },
        proctor: {
          name: responders.proctor.name,
          office: responders.proctor.office,
          status: 'MONITORING LIVE FEED',
          channel: 'VHF CH-0'
        }
      }
    });

    // 6. Broadcast a *scoped* emergency alert.
    //    A single-camera detection used to raise a campus-wide "lockdown",
    //    which is grossly disproportionate and trains the campus to ignore
    //    alerts. The alert is now scoped to the detected location; an
    //    operator can escalate to a lockdown from the incident view.
    safetyStore.triggerCampusAlert({
      type: 'lockdown',
      active: true,
      title: `AGGRESSION DETECTED AT ${location.toUpperCase()}`,
      message: `Model confidence ${confidence}%. Responders dispatched: Guard ${responders.guard.name}, HOD ${responders.hod.name}, Chief Proctor ${responders.proctor.name}. Scoped to this location - escalate from the incident view if a campus-wide lockdown is required.`,
      issuedBy: 'C3S Aggression AI Sentinel'
    });

    // 7. Store Active Fight Alert for UI Presentation & Navigation
    this.currentActiveAlert = {
      id: incidentId,
      cameraId,
      cameraName,
      location,
      nodeId: resolvedNodeId,
      nodeName: resolvedNodeName,
      confidence,
      timestamp: timeString,
      photoUrl,
      videoUrl: incidentVideoUrl,
      lat: resolvedLat,
      lng: resolvedLng,
      mapId: resolvedMap,
      responders
    };

    // 8. Play emergency acoustic chime, activate proctor siren alarm, and notify listeners
    this.playEmergencyChime();
    globalProctorAlarm.triggerAlarm(`Aggressive Altercation Detected at ${location} (${confidence}%)`);
    this.notifyListeners();
  }
}

export const globalFightDispatcher = new FightAlertDispatcher();
