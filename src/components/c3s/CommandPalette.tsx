/**
 * src/components/c3s/CommandPalette.tsx
 *
 * The top bar used to contain a search input that did nothing - it had no
 * submit handler, no results and no keyboard behaviour. It was worse than no
 * search at all because it promised a capability the product did not have.
 *
 * This is the real thing: a keyboard-driven command palette (Cmd/Ctrl + K)
 * that searches navigation destinations, campus gates, CCTV cameras and
 * incidents, and navigates directly to the selected result.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CornerDownLeft,
  DoorOpen,
  LayoutDashboard,
  MapPin,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useC3SStore } from '@/store/c3sStore';
import { normalizeRole } from '@/lib/rbac';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  to: string;
  icon: LucideIcon;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [rawActiveIndex, setActiveIndex] = useState(0);

  const currentRole = useC3SStore((state) => state.currentRole);
  const gates = useC3SStore((state) => state.gates);
  const cameras = useC3SStore((state) => state.cameras);
  const incidents = useC3SStore((state) => state.incidents);

  const items = useMemo<CommandItem[]>(() => {
    const roleKey = normalizeRole(currentRole);
    const navigation: CommandItem[] = [];

    const add = (item: CommandItem) => navigation.push(item);

    add({
      id: 'nav-map',
      label: 'Open Campus Grid & SOS Routing',
      group: 'Navigate',
      to: '/map',
      icon: MapPin,
      keywords: 'digital twin indoor wayfinding directions',
    });

    if (roleKey === 'STUDENT') {
      add({
        id: 'nav-sos',
        label: 'Emergency SOS',
        hint: 'Broadcast your live location to campus security',
        group: 'Navigate',
        to: '/student/sos',
        icon: ShieldAlert,
        keywords: 'emergency help danger alert beacon',
      });
      add({
        id: 'nav-scan',
        label: 'Scan Gate QR',
        group: 'Navigate',
        to: '/student/scan',
        icon: DoorOpen,
        keywords: 'entry exit pass checkpoint',
      });
      add({
        id: 'nav-hub',
        label: 'Student Pass & Hub',
        group: 'Navigate',
        to: '/student/dashboard',
        icon: LayoutDashboard,
        keywords: 'id card profile pass',
      });
    } else if (roleKey === 'GUARD') {
      add({
        id: 'nav-incidents',
        label: 'Active Incidents',
        group: 'Navigate',
        to: '/security/incidents',
        icon: ShieldAlert,
        keywords: 'dispatch queue alerts response',
      });
      add({
        id: 'nav-dispatch-map',
        label: 'Dispatch Map',
        group: 'Navigate',
        to: '/security/map',
        icon: MapPin,
        keywords: 'patrol route navigation',
      });
    } else if (roleKey === 'PROCTOR') {
      add({
        id: 'nav-cctv',
        label: 'CCTV Matrix',
        group: 'Navigate',
        to: '/control-room/cameras',
        icon: Camera,
        keywords: 'camera feeds surveillance aggression detection',
      });
      add({
        id: 'nav-incidents',
        label: 'Incident Hub',
        group: 'Navigate',
        to: '/control-room/incidents',
        icon: ShieldAlert,
        keywords: 'dispatch queue alerts response',
      });
      add({
        id: 'nav-occupancy',
        label: 'Campus Occupancy',
        group: 'Navigate',
        to: '/control-room/occupancy',
        icon: LayoutDashboard,
        keywords: 'crowd density flow headcount',
      });
    } else if (roleKey === 'ADMIN') {
      add({
        id: 'nav-users',
        label: 'User Directory & RBAC',
        group: 'Navigate',
        to: '/admin/users',
        icon: LayoutDashboard,
        keywords: 'accounts roles permissions',
      });
      add({
        id: 'nav-cameras',
        label: 'CCTV Fleet',
        group: 'Navigate',
        to: '/admin/cameras',
        icon: Camera,
        keywords: 'camera health devices',
      });
      add({
        id: 'nav-audit',
        label: 'Audit Trail',
        group: 'Navigate',
        to: '/admin/audit',
        icon: LayoutDashboard,
        keywords: 'compliance logs chain of custody',
      });
      add({
        id: 'nav-analytics',
        label: 'Safety Analytics',
        group: 'Navigate',
        to: '/admin/analytics',
        icon: LayoutDashboard,
        keywords: 'reports statistics trends',
      });
    } else if (roleKey === 'GATEKEEPER') {
      add({
        id: 'nav-gate-qr',
        label: 'Daily Gate QR',
        group: 'Navigate',
        to: '/gate-keeper/qr',
        icon: DoorOpen,
        keywords: 'pass display boarding',
      });
      add({
        id: 'nav-gate-activity',
        label: 'Live Gate Activity',
        group: 'Navigate',
        to: '/gate-keeper/activity',
        icon: LayoutDashboard,
        keywords: 'entry exit register log',
      });
    }

    const gateItems: CommandItem[] = gates.map((gate) => ({
      id: `gate-${gate.id}`,
      label: gate.name,
      hint: 'Campus checkpoint',
      group: 'Gates',
      to: `/gate/${gate.id}`,
      icon: DoorOpen,
      keywords: `${gate.id} checkpoint barrier entry exit`,
    }));

    const cameraItems: CommandItem[] = cameras.map((camera) => ({
      id: `camera-${camera.id}`,
      label: camera.name,
      hint: camera.zone ? `${camera.zone} · ${camera.status}` : camera.status,
      group: 'Cameras',
      to: '/control-room/cameras',
      icon: Camera,
      keywords: `${camera.id} cctv feed video surveillance`,
    }));

    const incidentItems: CommandItem[] = incidents
      .filter((incident) => incident.status !== 'RESOLVED')
      .slice(0, 12)
      .map((incident) => ({
        id: `incident-${incident.id}`,
        label: incident.title,
        hint: `${incident.id} · ${incident.priority}`,
        group: 'Incidents',
        to: `/security/incidents/${incident.id}`,
        icon: ShieldAlert,
        keywords: `${incident.location} ${incident.type} ${incident.zone} alert`,
      }));

    return [...navigation, ...incidentItems, ...gateItems, ...cameraItems];
  }, [currentRole, gates, cameras, incidents]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items.slice(0, 12);
    return items
      .filter((item) =>
        `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 20);
  }, [items, query]);

  // Reset the palette state whenever it is opened. React's recommended
  // pattern for "adjust state when something changes" is to compare during
  // render rather than to fire a setState from an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  // Focus the input after the overlay has been painted.
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Lock body scroll while the palette is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the highlighted row inside the result window without an effect.
  const activeIndex = Math.min(rawActiveIndex, Math.max(0, filtered.length - 1));

  const commit = (item: CommandItem | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % Math.max(1, filtered.length));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex(
          (current) => (current - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length),
        );
        break;
      case 'Enter':
        event.preventDefault();
        commit(filtered[activeIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  // Scroll the highlighted row into view.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#111A2E]"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/[0.08]">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search pages, gates, cameras and incidents..."
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          className="max-h-[52vh] overflow-y-auto p-2"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No results for “{query}”.
            </li>
          ) : (
            filtered.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      index === activeIndex
                        ? 'bg-blue-500/10 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold">{item.label}</span>
                      {item.hint && (
                        <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    {index === activeIndex ? (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-2.5 text-[10px] font-medium text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-white/15">↑</kbd>
            <kbd className="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-white/15">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-white/15">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-300 px-1 py-0.5 font-mono dark:border-white/15">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
