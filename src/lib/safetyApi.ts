import { API_BASE } from '@/lib/api';

export interface SafetyIncidentResponse {
    id: string;
    studentId: number;
    studentName: string;
    type: string;
    latitude: number;
    longitude: number;
    zone: string | null;
    status: string;
    assignedResponderId: number | null;
    assignedResponderName: string | null;
    createdAt: string;
}

export interface SafetyLoginResponse {
    token: string;
    type: string;
    expiresIn: number;
    userId: number;
    name: string;
    role: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c3s-session') || 'null')?.token : undefined;
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
    if (!response.ok) throw new Error(`Safety API request failed: ${response.status}`);
    return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export function loginSafety(email: string, password: string) {
    return request<SafetyLoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function createSos(payload: { type: string; latitude: number; longitude: number; note?: string }) {
    return request<SafetyIncidentResponse>('/api/sos', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateIncidentStatus(id: string, action: 'acknowledge' | 'accept' | 'responding' | 'on-site' | 'resolve', note?: string) {
    return request<SafetyIncidentResponse>(`/api/sos/${id}/${action}`, { method: 'POST', body: JSON.stringify({ note }) });
}

export function updateIncidentLocation(incidentId: string, latitude: number, longitude: number, accuracyMeters?: number) {
    return request<void>('/api/location', { method: 'POST', body: JSON.stringify({ incidentId, latitude, longitude, accuracyMeters }) });
}
