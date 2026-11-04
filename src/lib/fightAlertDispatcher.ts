// src/lib/fightAlertDispatcher.ts
import { useC3SStore } from '@/store/c3sStore';
import type { C3SIncident } from '@/lib/mock-data/incidents';
import { useSafetyStore } from '@/store/safetyStore';
import type { SosIncident } from '@/types/safety';
import fallbackData from '@/lib/mock-data/campusDataFallback.json';
import type { MapNode } from '@/types/graph';
import { findNearestCampusNode } from '@/lib/geoProjection';
import { globalProctorAlarm } from '@/lib/proctorAlarmAudio';

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
    faculty: { name: string; department: string; distance: string };
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
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      osc.frequency.setValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      /* Audio policy or unavailable */
    }
  }

  /**
   * Generates a high-resolution tactical canvas snapshot of the fight incident
   */
  public generateFightSnapshot(
    videoElement: HTMLVideoElement | null,
    cameraName: string,
    location: string,
    nodeId: string,
    confidence: number
  ): string {
    if (typeof document === 'undefined') return '';

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (videoElement && videoElement.videoWidth > 0) {
      // Draw actual video frame
      ctx.drawImage(videoElement, 0, 0, 640, 420);
    } else {
      // Neutral camera stream snapshot (no synthetic people)
      const grad = ctx.createLinearGradient(0, 0, 640, 420);
      grad.addColorStop(0, '#0a0d16');
      grad.addColorStop(1, '#050811');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 420);

      // Camera grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 420);
        ctx.stroke();
      }
      for (let y = 0; y < 420; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`CCTV VIDEO STREAM: ${cameraName}`, 20, 210);
      ctx.fillText(`TELEMETRY CAPTURED AT ${new Date().toISOString()}`, 20, 230);
    }

    // Top Critical Banner Watermark
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 640, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 14px monospace';
    ctx.fillText(`🚨 C3S AI SURVEILLANCE • CONFIDENCE: ${confidence}%`, 15, 24);

    // Bottom Telemetry Overlay
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.fillRect(0, 360, 640, 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`CAMERA: ${cameraName} | NODE #${nodeId}`, 15, 382);
    ctx.fillText(`LOCATION: ${location} | TIME: ${new Date().toLocaleTimeString()} IST`, 15, 402);

    ctx.fillStyle = '#10b981';
    ctx.fillText('DISPATCH: GUARD 02 (45m) • FACULTY (30m) • CHIEF PROCTOR', 310, 402);

    return canvas.toDataURL('image/jpeg', 0.88);
  }

  /**
   * Dispatches validated high-confidence fight alerts (>= 85%) confirmed by the SOS decision engine
   */
  public handleFightDetection(payload: {
    cameraId: string;
    cameraName: string;
    location: string;
    confidence: number;
    videoElement?: HTMLVideoElement | null;
    videoUrl?: string;
    nodeId?: string;
    incidentId?: string;
  }) {
    const { cameraId, cameraName, location, confidence, videoElement, videoUrl, incidentId: providedIncidentId } = payload;

    // Strict SOS gate: minimum 85% confidence
    if (confidence < 85) return;

    // Strict cooldown check (30 seconds per camera)
    const nowMs = Date.now();
    const lastAlert = this.lastAlertTimeByCamera.get(cameraId) || 0;
    if (nowMs - lastAlert < 30000) {
      return;
    }
    this.lastAlertTimeByCamera.set(cameraId, nowMs);

    // 1. Resolve Campus Node Coordinates (Fallback to UNKNOWN if not mapped)
    let resolvedNodeId = payload.nodeId || 'UNKNOWN_NODE';
    let resolvedNodeName = location && location !== 'UNKNOWN' ? location : 'Location Unverified (Zone Monitoring)';
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
      try {
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
      } catch {}
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

    // 3. Define the 3 targeted responders: Guard, Faculty, Proctor
    const responders = {
      guard: {
        name: 'Guard Vikram Rathore',
        distance: '45m',
        callsign: 'Guard 02 (Perimeter Patrol)'
      },
      faculty: {
        name: 'Dr. A. K. Verma',
        department: 'Dept. of CSE',
        distance: '30m (Cabin 204)'
      },
      proctor: {
        name: 'Prof. S. K. Jain',
        office: 'Chief Proctor Office & Emergency SOC'
      }
    };

    const incidentId = providedIncidentId || `FIGHT-AI-${Math.floor(1000 + Math.random() * 9000)}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 4. Record into c3sStore
    const c3sIncident: C3SIncident = {
      id: incidentId,
      title: `🚨 FIGHT DETECTED (${confidence}%): ${cameraName}`,
      type: 'Security Threat',
      location: `${resolvedNodeName} [Node: #${resolvedNodeId}]`,
      zone: 'Perimeter & Academic Zone',
      reportedAt: timeString,
      reportedBy: 'C3S AI Surveillance Engine',
      reportedById: 'AI-CV-C3S',
      reporterPhone: '+91 751-2409301',
      status: 'ALERT SENT',
      priority: 'CRITICAL',
      distanceMeters: 45,
      assignedResponder: `${responders.guard.callsign} & ${responders.faculty.name}`,
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
        { time: timeString, event: `Physical fight recognized with ${confidence}% confidence by Kaggle RWF-2000 model.`, actor: 'AI Vision Engine' },
        { time: timeString, event: `Evidence snapshot & video clip recorded at Node #${resolvedNodeId}.`, actor: 'CCTV Evidence Archiver' },
        { time: timeString, event: `Nearest Guard (${responders.guard.name} - ${responders.guard.distance}) and Faculty (${responders.faculty.name} - ${responders.faculty.distance}) auto-dispatched.`, actor: 'Emergency AI Router' },
        { time: timeString, event: `Chief Proctor ${responders.proctor.name} engaged with live tactical feed.`, actor: 'Proctorial Mesh' }
      ],
      notes: [
        `Kaggle RWF-2000 Confidence: ${confidence}%`,
        `Evidence: High-resolution photo snapshot & video clip attached`,
        `Notified: Guard (${responders.guard.name}), Faculty (${responders.faculty.name}), Proctor (${responders.proctor.name})`
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
        id: `notif-fight-faculty-${Date.now() + 1}`,
        category: 'Emergency',
        title: '🎓 [FACULTY ALERT] Physical Altercation Alert',
        message: `Faculty Warden ${responders.faculty.name} (${responders.faculty.department}) alerted to altercations at ${location}.`,
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
      description: `Physical altercation identified by Kaggle RWF-2000 AI at ${cameraName}. Guard, Faculty & Proctor notified.`,
      map: resolvedMap,
      floor: 0,
      x: resolvedX,
      y: resolvedY,
      lat: resolvedLat,
      lng: resolvedLng,
      timestamp: Date.now(),
      status: 'active',
      reportedBy: 'Kaggle RWF-2000 Optical Flow Engine',
      responderAssigned: `${responders.guard.callsign} & ${responders.faculty.name}`,
      responderStatus: 'dispatched',
      responderEta: '< 1 min',
      notifiedResponders: [responders.guard.name, responders.faculty.name, responders.proctor.name],
      evidence: {
        photoUrl,
        videoUrl: incidentVideoUrl,
        fightDetected: true,
        fightConfidence: confidence,
        aiClassification: {
          category: 'security',
          severity: 'critical',
          detectedHazards: ['Physical Fight', 'Violent Altercation', 'Assault'],
          modelUsed: 'Kaggle RWF-2000 Spatio-Temporal Model',
          confidence: confidence / 100
        }
      }
    };
    safetyStore.triggerSosIncident(sosIncident);

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
        faculty: {
          name: responders.faculty.name,
          department: responders.faculty.department,
          distance: responders.faculty.distance,
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

    // 6. Broadcast Campus-Wide Emergency Alert Banner
    safetyStore.triggerCampusAlert({
      type: 'lockdown',
      active: true,
      title: `🚨 FIGHT DETECTED AT ${location.toUpperCase()}`,
      message: `AI Confidence: ${confidence}%. Responders Dispatched: Guard ${responders.guard.name}, Faculty ${responders.faculty.name}, Chief Proctor ${responders.proctor.name}.`,
      issuedBy: 'C3S Kaggle RWF-2000 AI Sentinel'
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
