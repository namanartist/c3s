// src/lib/gateSecurity.ts
import type { GateId, GateQrToken, MovementStatus, MovementType, GeofenceStatus } from '@/types/gate';

// Secret salt for campus QR tokens (simulated cryptographic signature)
const CAMPUS_QR_SECRET = 'C3S-MITS-GWL-2026-SECURE-KEY-8F39D';

/**
 * Campus Geofence Boundary Polygon for MITS Gwalior
 * Defined in GPS coordinates [latitude, longitude]
 */
export const CAMPUS_GEOFENCE_POLYGON: [number, number][] = [
  [26.233350, 78.204500], // North perimeter (near Main Gate approach)
  [26.233200, 78.206200], // North-East corner (behind Workshop Labs)
  [26.231200, 78.207600], // East perimeter (Workshop boundary)
  [26.229200, 78.206500], // South-East (Jubilee Gate entrance)
  [26.228900, 78.204800], // South perimeter (Hostels boundary)
  [26.230400, 78.203100], // South-West perimeter (Sports ground)
  [26.232100, 78.203000], // West boundary (New Gate / Parking area)
  [26.233100, 78.203800]  // North-West approach
];

/**
 * Gate names lookup
 */
export const GATE_NAMES: Record<GateId, string> = {
  'GATE-MAIN': 'Main Gate (Gate 1)',
  'GATE-JUBILEE': 'Jubilee Gate (Gate 4)',
  'GATE-PARKING': 'New Parking Gate (Gate 2)'
};

/**
 * Formats a Date object to YYYYMMDD
 */
export function getDailyDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Calculates end of the day (23:59:59.999) timestamp
 */
export function getDailyExpirationTimestamp(date: Date = new Date()): number {
  const exp = new Date(date);
  exp.setHours(23, 59, 59, 999);
  return exp.getTime();
}

/**
 * Lightweight hash helper for token signing (portable across browsers/workers)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex;
}

/**
 * Generates an authoritative, daily-rotating QR token for a physical gate
 */
export function generateDailyGateQr(gateId: GateId, version = 1, date: Date = new Date()): GateQrToken {
  const dateStr = getDailyDateString(date);
  const expiresAt = getDailyExpirationTimestamp(date);
  const issuedAt = Date.now();
  const rawPayload = `${gateId}:${dateStr}:v${version}:${CAMPUS_QR_SECRET}:${expiresAt}`;
  const signature = simpleHash(rawPayload);
  const token = `C3S-QR-${gateId}-${dateStr}-V${version}-${signature}`;

  return {
    gateId,
    gateName: GATE_NAMES[gateId] || gateId,
    dateStr,
    version,
    token,
    expiresAt,
    signature,
    issuedAt
  };
}

/**
 * Encodes token object to standard string for QR display
 */
export function serializeQrToken(token: GateQrToken): string {
  return JSON.stringify({
    sys: 'C3S',
    gid: token.gateId,
    dt: token.dateStr,
    v: token.version,
    exp: token.expiresAt,
    sig: token.signature,
    tok: token.token
  });
}

export interface QrValidationResult {
  valid: boolean;
  error?: string;
  gateId?: GateId;
  gateName?: string;
  token?: GateQrToken;
}

/**
 * Validates a scanned QR string against cryptographic rules, expiration, and gate identity
 */
export function validateGateQrToken(qrString: string, expectedGateId?: GateId): QrValidationResult {
  if (!qrString || typeof qrString !== 'string') {
    return { valid: false, error: 'Empty or invalid QR code format' };
  }

  try {
    let parsed: any = null;

    // Check if JSON format
    if (qrString.trim().startsWith('{')) {
      parsed = JSON.parse(qrString.trim());
    } else if (qrString.startsWith('C3S-QR-')) {
      // Direct token format: C3S-QR-GATE-MAIN-20260929-V1-abcd1234
      const parts = qrString.split('-');
      if (parts.length >= 6) {
        const gid = `${parts[2]}-${parts[3]}` as GateId;
        const dt = parts[4];
        const v = parseInt(parts[5].replace('V', ''), 10) || 1;
        const sig = parts[6] || '';
        parsed = {
          sys: 'C3S',
          gid,
          dt,
          v,
          exp: getDailyExpirationTimestamp(),
          sig,
          tok: qrString
        };
      }
    }

    if (!parsed || parsed.sys !== 'C3S' || !parsed.gid) {
      return { valid: false, error: 'Unrecognized QR code: Not a valid C3S Campus Gate token' };
    }

    const gateId = parsed.gid as GateId;
    if (!GATE_NAMES[gateId]) {
      return { valid: false, error: `Invalid Gate ID '${parsed.gid}' specified in QR` };
    }

    if (expectedGateId && gateId !== expectedGateId) {
      return {
        valid: false,
        error: `Gate Mismatch: Scanned QR is for ${GATE_NAMES[gateId]}, not ${GATE_NAMES[expectedGateId]}`
      };
    }

    // Verify Date
    const todayStr = getDailyDateString();
    if (parsed.dt !== todayStr) {
      return {
        valid: false,
        error: `Expired QR Code: Generated for date ${parsed.dt}, but today is ${todayStr}. Please scan today's active gate QR.`
      };
    }

    // Verify Expiration Timestamp
    const now = Date.now();
    if (parsed.exp && now > parsed.exp) {
      return { valid: false, error: 'QR Code has expired for today. Contact Gate Keeper for rollover.' };
    }

    // Verify Signature
    const rawPayload = `${gateId}:${parsed.dt}:v${parsed.v || 1}:${CAMPUS_QR_SECRET}:${parsed.exp}`;
    const expectedSig = simpleHash(rawPayload);
    if (parsed.sig && parsed.sig !== expectedSig) {
      return { valid: false, error: 'Cryptographic signature verification failed: QR token appears forged or altered.' };
    }

    const tokenObj: GateQrToken = {
      gateId,
      gateName: GATE_NAMES[gateId],
      dateStr: parsed.dt,
      version: parsed.v || 1,
      token: parsed.tok || qrString,
      expiresAt: parsed.exp || getDailyExpirationTimestamp(),
      signature: parsed.sig,
      issuedAt: now
    };

    return {
      valid: true,
      gateId,
      gateName: GATE_NAMES[gateId],
      token: tokenObj
    };
  } catch (err) {
    return { valid: false, error: 'Corrupted QR code data payload' };
  }
}

/**
 * Validates movement state machine transitions
 * OUTSIDE -> CHECK-IN (Valid)
 * INSIDE -> CHECK-OUT (Valid)
 * OUTSIDE -> CHECK-OUT (Invalid)
 * INSIDE -> CHECK-IN (Invalid)
 */
export function validateMovementTransition(
  currentStatus: MovementStatus,
  action: MovementType
): { allowed: boolean; reason?: string } {
  if (action === 'CHECK-IN') {
    if (currentStatus === 'INSIDE') {
      return {
        allowed: false,
        reason: 'Already registered INSIDE campus. You must check out before checking in again, or request a staff override.'
      };
    }
    return { allowed: true };
  }

  if (action === 'CHECK-OUT') {
    if (currentStatus === 'OUTSIDE') {
      return {
        allowed: false,
        reason: 'Currently registered OUTSIDE campus. You cannot check out without an active check-in record.'
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Point-in-polygon ray-casting algorithm to test if GPS coordinates are inside campus bounds
 */
export function checkCampusGeofence(lat?: number, lng?: number): GeofenceStatus {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    return 'UNKNOWN';
  }

  const polygon = CAMPUS_GEOFENCE_POLYGON;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  if (inside) {
    return 'INSIDE_CAMPUS';
  }

  // Check if near boundary (within ~80 meters)
  const campusCenterLat = 26.2312;
  const campusCenterLng = 26.2051;
  const distApprox = Math.sqrt(Math.pow(lat - campusCenterLat, 2) + Math.pow(lng - campusCenterLng, 2));

  if (distApprox < 0.0035) {
    return 'NEAR_BOUNDARY';
  }

  return 'OUTSIDE_CAMPUS';
}
