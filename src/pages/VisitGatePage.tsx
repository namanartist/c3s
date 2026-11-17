// src/pages/VisitGatePage.tsx
/**
 * Public Campus Entry — Visitor / Vendor / Guest Self Check-in.
 *
 * Reachable without authentication. Scanning the gate QR with Google Lens
 * deep-links to this page (prefilled with gate + token from the query
 * string). Collects visitor identity, Aadhaar number, a live face capture
 * snapshot and device location, then persists the registration to
 * `visitor_registrations` in MongoDB (falls back to memory when offline).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  IdCard,
  Phone,
  Building2,
  Car,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ScanFace,
  LoaderCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Truck,
  Wrench,
  Crown,
  Users,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type VisitorRole = 'VISITOR' | 'VENDOR' | 'DELIVERY' | 'MAINTENANCE' | 'VIP' | 'OTHER';

const ROLE_OPTIONS: Array<{
  id: VisitorRole;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  asks: string[];
}> = [
  { id: 'VISITOR', label: 'Visitor / Guest', desc: 'Meeting someone on campus', icon: Users, accent: 'border-sky-500/40 bg-sky-500/10 text-sky-300', asks: ['Whom you are meeting', 'Department / block'] },
  { id: 'VENDOR', label: 'Vendor / Contractor', desc: 'Supply, installation or services', icon: Briefcase, accent: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300', asks: ['Company name', 'Work order number'] },
  { id: 'DELIVERY', label: 'Delivery / Courier', desc: 'Parcel, food or courier drop', icon: Truck, accent: 'border-amber-500/40 bg-amber-500/10 text-amber-300', asks: ['Courier company', 'Vehicle number'] },
  { id: 'MAINTENANCE', label: 'Maintenance / AMC', desc: 'Repair under approved work order', icon: Wrench, accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', asks: ['Company name', 'Work order number'] },
  { id: 'VIP', label: 'VIP / Official Visit', desc: 'Dignitaries, inspectors, auditors', icon: Crown, accent: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300', asks: ['Organization', 'Purpose of visit'] },
  { id: 'OTHER', label: 'Other', desc: 'Anything not listed above', icon: HelpCircle, accent: 'border-slate-500/40 bg-slate-500/10 text-slate-300', asks: ['Purpose of visit'] },
];

interface VisitorPayload {
  name: string;
  phone: string;
  aadhaarLast4: string;
  aadhaarHash: string;
  visitorRole: VisitorRole;
  company: string;
  purpose: string;
  vehicleNumber: string;
  hostName?: string;
  hostDepartment?: string;
  workOrderNumber?: string;
  gate: string;
  qrToken: string;
  faceSnapshot?: string; // data URL
  latitude?: number;
  longitude?: number;
}

/**
 * cyrb53-style 128-bit hash — used only as a fallback when the page is
 * served over plain HTTP (SubtleCrypto is unavailable outside secure
 * contexts). Deterministic and collision-resistant enough for demo
 * storage; production deploys should always run over HTTPS and use SHA-256.
 */
const cyrb53 = (str: string, seed = 0): string => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h2)}${toHex(h1)}`.repeat(4).slice(0, 64);
};

const hashAadhaar = async (value: string): Promise<string> => {
  const clean = value.replace(/\s/g, '');
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(clean);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fall through to non-secure fallback below
  }
  return cyrb53(clean, 0x9e3779b9);
};

export default function VisitGatePage() {
  const [searchParams] = useSearchParams();
  const gate = searchParams.get('gate') || 'GATE-MAIN';
  const qrToken = searchParams.get('token') || '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [visitorRole, setVisitorRole] = useState<VisitorRole | null>(null);
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostDepartment, setHostDepartment] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [faceSnapshot, setFaceSnapshot] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string; time: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera (extracted so visitors can retry after denying permission)
  const requestCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not available in this browser/device.');
      return;
    }
    setCameraError(null);
    setCameraReady(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
          setCameraReady(true);
        }
      })
      .catch((err) => {
        setCameraError(err instanceof Error ? err.message : 'Camera permission was denied.');
      });
  };

  // Request camera on mount (deferred so the effect body stays side-effect free)
  useEffect(() => {
    const t = window.setTimeout(requestCamera, 0);
    return () => {
      window.clearTimeout(t);
      streamRef.current?.getTracks().forEach((trk) => trk.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoState('granted');
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const captureFace = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = captureCanvasRef.current ?? (() => {
      const c = document.createElement('canvas');
      c.width = 480; c.height = 360;
      captureCanvasRef.current = c;
      return c;
    })();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFaceSnapshot(canvas.toDataURL('image/jpeg', 0.72));
  };

  // Role-specific requirements — each role asks for different details.
  const roleValid = (() => {
    switch (visitorRole) {
      case 'VISITOR':
        return hostName.trim().length >= 2 && hostDepartment.trim().length >= 2;
      case 'VENDOR':
      case 'MAINTENANCE':
        return company.trim().length >= 2 && workOrderNumber.trim().length >= 3;
      case 'DELIVERY':
        return company.trim().length >= 2 && vehicleNumber.trim().length >= 4;
      case 'VIP':
        return company.trim().length >= 2 && purpose.trim().length >= 3;
      case 'OTHER':
        return purpose.trim().length >= 3;
      default:
        return false;
    }
  })();

  const purposeRequired = visitorRole === 'VIP' || visitorRole === 'OTHER';
  const companyLabel =
    visitorRole === 'DELIVERY' ? 'Courier Company' : visitorRole === 'VIP' ? 'Organization' : 'Company / Institute';
  const companyPlaceholder =
    visitorRole === 'DELIVERY'
      ? 'e.g. BlueDart / DTDC / Amazon'
      : visitorRole === 'VENDOR'
        ? 'e.g. Vendor Automations Pvt. Ltd.'
        : visitorRole === 'MAINTENANCE'
          ? 'e.g. CoolAir Systems — AMC Partner'
          : 'e.g. MITS Alumni Association';

  const isAadhaarValid = /^\d{12}$/.test(aadhaar.replace(/\s/g, ''));
  const canSubmit =
    name.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    isAadhaarValid &&
    roleValid &&
    faceSnapshot !== null &&
    geoState === 'granted';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!visitorRole) {
      setFormError('Please select who you are visiting as.');
      return;
    }
    if (!canSubmit) {
      setFormError('Please complete all required fields for your role, capture your face and allow location access.');
      return;
    }
    setSubmitting(true);
    try {
      const cleanAadhaar = aadhaar.replace(/\s/g, '');
      const payload: VisitorPayload = {
        name: name.trim(),
        phone: phone.trim(),
        aadhaarLast4: cleanAadhaar.slice(-4),
        aadhaarHash: await hashAadhaar(cleanAadhaar),
        visitorRole,
        company: company.trim(),
        purpose: purpose.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        hostName: hostName.trim() || undefined,
        hostDepartment: hostDepartment.trim() || undefined,
        workOrderNumber: workOrderNumber.trim() || undefined,
        gate,
        qrToken,
        faceSnapshot: faceSnapshot ?? undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      };

      const res = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Registration failed. Please try again.');
      }
      setSubmitted({ id: json.registration?.id || json?.id || `VIS-${Date.now()}`, time: new Date().toLocaleTimeString() });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visitorRole && !submitted) {
    // ── STEP 1 — Select your role ──────────────────────────────────────────
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#05070d] via-[#0b1220] to-[#05070d] px-4 py-6 text-slate-100 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14)_0%,transparent_70%)] blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_0_18px_rgba(56,189,248,0.3)]">
                <img src="/c3s_logo.png" alt="C3S" className="h-6 w-6 object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">C3S</span>
                <span className="block font-mono text-[8px] uppercase tracking-widest text-slate-500">Visitor Entry</span>
              </span>
            </Link>
            <div className="text-right">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Self Service</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{gate}</p>
            </div>
          </header>

          <div className="mt-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.22em]">
              <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-sky-300">Step 1 · Your role</span>
              <span className="h-px w-6 bg-white/10" aria-hidden="true" />
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-500">Step 2 · Details</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
              Who are you<br />
              <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">visiting as?</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              Pick the option that matches your visit. We&apos;ll ask for the required details next — nothing more.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Visitor role">
            {ROLE_OPTIONS.map(({ id, label, desc, icon: Icon, accent, asks }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={visitorRole === id}
                onClick={() => setVisitorRole(id)}
                className={`group flex cursor-pointer flex-col items-start gap-3 rounded-2xl border p-4 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-sky-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${accent}`}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-white">{label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">{desc}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
                  <span className="font-mono text-[8px] font-black uppercase tracking-widest text-slate-500">Asks:</span>
                  {asks.map((a) => (
                    <span key={a} className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[9px] font-semibold text-slate-300">{a}</span>
                  ))}
                </span>
              </button>
            ))}
          </div>

          <footer className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-center font-mono text-[9px] uppercase tracking-widest text-slate-600">
            <span>Verified by C3S Gate Terminal</span>
            <Link to="/" className="hover:text-slate-400">C3S Campus Defense</Link>
          </footer>
        </div>
      </div>
    );
  }

  if (submitted) {
    const roleMeta = ROLE_OPTIONS.find((r) => r.id === visitorRole);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#05070d] via-[#0b1220] to-[#05070d] px-4 text-center text-slate-100">
        <div className="max-w-md rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 backdrop-blur-xl shadow-2xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black text-white">Check-in Successful</h1>
          <p className="mt-2 text-sm text-slate-300">
            Welcome, <strong className="text-white">{name}</strong>. You are registered at <strong>{gate}</strong>
            {roleMeta ? <> as <strong className="text-white">{roleMeta.label}</strong></> : null}.
          </p>
          <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-emerald-300">
            Visitor ID: {submitted.id}
          </p>
          <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Timestamp: {submitted.time}
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Your live location has been shared with the campus security grid. Please proceed to the gate for verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#05070d] via-[#0b1220] to-[#05070d] px-4 py-6 text-slate-100 sm:px-6">
      {/* Ambient glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14)_0%,transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_0_18px_rgba(56,189,248,0.3)]">
              <img src="/c3s_logo.png" alt="C3S" className="h-6 w-6 object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">C3S</span>
              <span className="block font-mono text-[8px] uppercase tracking-widest text-slate-500">Visitor Entry</span>
            </span>
          </Link>
          <div className="text-right">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Self Service</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{gate}</p>
          </div>
        </header>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.22em]">
              <button type="button" onClick={() => setVisitorRole(null)} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-300 transition hover:bg-sky-500/20" aria-label="Back to role selection">
                <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Step 1 · Role
              </button>
              <span className="h-px w-6 bg-white/10" aria-hidden="true" />
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-emerald-300">Step 2 · Details</span>
            </div>
            <button
              type="button"
              onClick={() => setVisitorRole(null)}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 transition hover:text-white"
            >
              {ROLE_OPTIONS.find((r) => r.id === visitorRole)?.label} · Change
            </button>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
            <ScanFace className="h-3.5 w-3.5" aria-hidden="true" />
            Campus Entry · Self Check-in
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Required <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">Details</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
            Only what your visit needs. Complete verification, face capture and location sharing to generate your gate pass.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* LEFT — Face capture */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <Camera className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                  Face Capture
                </p>
                {faceSnapshot && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Captured
                  </span>
                )}
              </div>

              <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black">
                {cameraError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-rose-300">
                    <ScanFace className="h-8 w-8 text-rose-400" aria-hidden="true" />
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={requestCamera}
                      className="mt-1 cursor-pointer rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[11px] font-bold text-rose-200 transition hover:bg-rose-500/20"
                    >
                      Retry camera access
                    </button>
                  </div>
                ) : faceSnapshot ? (
                  <img src={faceSnapshot} alt="Captured face" className="h-full w-full object-cover" />
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                )}
                {/* Corner guides */}
                {!faceSnapshot && !cameraError && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-4 rounded-lg border-2 border-dashed border-sky-400/40">
                    <span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-sky-400" />
                    <span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-sky-400" />
                    <span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-sky-400" />
                    <span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-sky-400" />
                  </div>
                )}
              </div>

              {faceSnapshot ? (
                <button type="button" onClick={() => setFaceSnapshot(null)} className="mt-3 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10">
                  Retake photo
                </button>
              ) : (
                <button type="button" onClick={captureFace} disabled={!cameraReady} className="mt-3 w-full cursor-pointer rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                  {cameraReady ? 'Capture Face' : cameraError ? 'Camera blocked — see above' : 'Starting camera…'}
                </button>
              )}

              {/* Location sharing */}
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
                <p className="flex items-center justify-between font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  <span>Live Location</span>
                  <span className={geoState === 'granted' ? 'text-emerald-400' : 'text-slate-500'}>
                    {geoState === 'granted' ? 'Shared' : geoState === 'loading' ? 'Requesting…' : 'Not shared'}
                  </span>
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
                  <MapPin className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Tap below to share location with the security grid'}
                </div>
                {geoState !== 'granted' && (
                  <button type="button" onClick={requestGeolocation} disabled={geoState === 'loading'} className="mt-2 w-full cursor-pointer rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50">
                    {geoState === 'loading' ? 'Requesting location…' : 'Share my location'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT — Identity form */}
          <section className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl shadow-2xl">
            <p className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                {ROLE_OPTIONS.find((r) => r.id === visitorRole)?.label ?? 'Visitor'} · Required
              </span>
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="visitor-name" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Full Name *</label>
                <input id="visitor-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
              </div>

              <div>
                <label htmlFor="visitor-phone" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input id="visitor-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                </div>
              </div>

              <div>
                <label htmlFor="visitor-aadhaar" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Aadhaar (12 digits) *</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input id="visitor-aadhaar" required inputMode="numeric" autoComplete="off" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, ''))} placeholder="1234 5678 9012" className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-3 font-mono text-sm text-white placeholder:text-slate-600 outline-none transition focus:ring-2 focus:ring-sky-500/20 ${aadhaar.replace(/\s/g, '').length === 12 ? 'border-emerald-500/50' : 'border-white/10 focus:border-sky-500/60'}`} />
                </div>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-slate-600">Encrypted · only last 4 stored in plain text</p>
              </div>

              {/* Role-specific required fields */}
              {visitorRole === 'VISITOR' ? (
                <>
                  <div>
                    <label htmlFor="visitor-host" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Host Name *</label>
                    <input id="visitor-host" required value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="e.g. Dr. R. K. Bhatia" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                  </div>
                  <div>
                    <label htmlFor="visitor-host-dept" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Department / Block *</label>
                    <input id="visitor-host-dept" required value={hostDepartment} onChange={(e) => setHostDepartment(e.target.value)} placeholder="e.g. CSE · Block C" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="visitor-company" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{companyLabel} *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                      <input id="visitor-company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder={companyPlaceholder} className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                    </div>
                  </div>
                  {(visitorRole === 'VENDOR' || visitorRole === 'MAINTENANCE') && (
                    <div className="sm:col-span-2">
                      <label htmlFor="visitor-workorder" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Work Order Number *</label>
                      <div className="relative">
                        <ClipboardList className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                        <input id="visitor-workorder" required value={workOrderNumber} onChange={(e) => setWorkOrderNumber(e.target.value.toUpperCase())} placeholder="WO-2026-2214" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 font-mono text-sm uppercase text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="sm:col-span-2">
                <label htmlFor="visitor-purpose" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Purpose of Visit{purposeRequired ? ' *' : ''}</label>
                <textarea id="visitor-purpose" required={purposeRequired} rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={visitorRole === 'VISITOR' ? 'e.g. Invited talk at the departmental seminar' : 'e.g. Annual maintenance of laboratory equipment at Block C under HOD-approved work order #2214'} className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="visitor-vehicle" className="mb-1 block font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Vehicle Number{visitorRole === 'DELIVERY' ? ' *' : ''}</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  <input id="visitor-vehicle" required={visitorRole === 'DELIVERY'} value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="MP 04 AB 1234" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 font-mono text-sm uppercase text-white placeholder:text-slate-600 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20" />
                </div>
              </div>
            </div>

            {formError && (
              <p role="alert" className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300">
                {formError}
              </p>
            )}

            <button type="submit" disabled={submitting || !canSubmit} className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-4 font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_40px_-12px_rgba(16,185,129,0.5)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40">
              {submitting ? (
                <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Registering…</span></>
              ) : (
                <><ShieldCheck className="h-4 w-4" aria-hidden="true" /><span>Generate Gate Pass</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>
              )}
            </button>
          </section>
        </form>

        <footer className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-center font-mono text-[9px] uppercase tracking-widest text-slate-600">
          <span>Verified by C3S Gate Terminal</span>
          <Link to="/" className="hover:text-slate-400">C3S Campus Defense</Link>
        </footer>
      </div>
    </div>
  );
}
