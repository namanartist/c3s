// src/pages/Map/Navigation.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import { usePathfinding } from '@/hooks/usePathfinding';
import { searchNodes } from '@/lib/graphUtils';
import { formatDistance, formatTime } from '@/lib/routeBuilder';
import { MapPin, Navigation as NavIcon, ArrowUpDown, ChevronDown, ChevronUp, Clock, Footprints, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui';

/** SearchPanel renders input fields for origin, destination, and building/floor selectors. */
export function SearchPanel() {
  const {
    graph,
    activeMap,
    activeFloor,
    setActiveMap,
    setActiveFloor,
    selectedFrom,
    selectedTo,
    setSelectedFrom,
    setSelectedTo,
    clearRoute
  } = useMapStore();

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);

  // Sync inputs with selected store nodes
  useEffect(() => {
    setFromQuery(selectedFrom ? selectedFrom.name : '');
  }, [selectedFrom]);

  useEffect(() => {
    setToQuery(selectedTo ? selectedTo.name : '');
  }, [selectedTo]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fromContainerRef.current && !fromContainerRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fromSuggestions = useMemo(() => {
    if (!graph || fromQuery.length < 2 || (selectedFrom && selectedFrom.name === fromQuery)) return [];
    return searchNodes(graph, fromQuery);
  }, [fromQuery, graph, selectedFrom]);

  const toSuggestions = useMemo(() => {
    if (!graph || toQuery.length < 2 || (selectedTo && selectedTo.name === toQuery)) return [];
    return searchNodes(graph, toQuery);
  }, [toQuery, graph, selectedTo]);

  const handleSwap = () => {
    const temp = selectedFrom;
    setSelectedFrom(selectedTo);
    setSelectedTo(temp);
  };

  const handleSelectBuilding = (buildingId: string) => {
    if (!graph) return;
    setActiveMap(buildingId);
    setActiveFloor(0);
  };

  const activeBuilding = useMemo(() => {
    if (!graph || !activeMap) return null;
    return graph.buildings.find(b => b.id === activeMap) || null;
  }, [graph, activeMap]);

  return (
    <div className="p-4 border-b border-[var(--border)] flex flex-col gap-4 bg-[var(--bg-card)]">
      {/* Building & Floor Selector */}
      {graph && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="building-select" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Select Building
            </label>
            <div className="relative">
              <select
                id="building-select"
                value={activeMap || ''}
                onChange={(e) => handleSelectBuilding(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                {graph.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={16} />
            </div>
          </div>

          {activeBuilding && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Floor
              </span>
              <div className="flex flex-wrap gap-2">
                {activeBuilding.floorIds.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveFloor(index)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                      activeFloor === index
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {index === 0 ? 'Ground' : `${index}F`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Origin / Destination Autocomplete Inputs */}
      <div className="relative flex flex-col gap-3 bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
        {/* From Input */}
        <div className="relative" ref={fromContainerRef}>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-all">
            <MapPin className="text-[var(--accent)] shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search start location..."
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setShowFromSuggestions(true);
              }}
              onFocus={() => setShowFromSuggestions(true)}
              className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
              aria-label="Start navigation location"
            />
          </div>

          {showFromSuggestions && fromSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-30 divide-y divide-[var(--border)]">
              {fromSuggestions.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFrom(node);
                      setFromQuery(node.name);
                      setShowFromSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--accent-light)] text-[var(--text-primary)] transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {node.map.replace(/_/g, ' ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwap}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] flex items-center justify-center transition-all z-10 shadow-sm"
          aria-label="Swap start and destination locations"
        >
          <ArrowUpDown size={14} />
        </button>

        {/* To Input */}
        <div className="relative" ref={toContainerRef}>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-all">
            <NavIcon className="text-[var(--route-to)] shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search destination room..."
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              className="w-full bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
              aria-label="Destination navigation location"
            />
          </div>

          {showToSuggestions && toSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-30 divide-y divide-[var(--border)]">
              {toSuggestions.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTo(node);
                      setToQuery(node.name);
                      setShowToSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--accent-light)] text-[var(--text-primary)] transition-colors flex flex-col gap-0.5"
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {node.map.replace(/_/g, ' ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Clear/Reset button */}
      {(selectedFrom || selectedTo) && (
        <Button variant="ghost" size="sm" onClick={clearRoute} className="self-end text-xs">
          Clear Navigation
        </Button>
      )}
    </div>
  );
}

/** RoutePanel displays step-by-step navigation instructions and distance details. */
export function RoutePanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { route, isComputing } = usePathfinding();
  const error = useMapStore(state => state.error);

  const toggleExpand = () => setIsExpanded(prev => !prev);

  if (isComputing) {
    return (
      <div className="p-6 flex items-center justify-center gap-3 text-sm text-[var(--text-secondary)]">
        <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        Calculating route...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-4 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 text-xs flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Route Calculation Failed</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-6 text-center text-xs text-[var(--text-muted)] leading-relaxed">
        <HelpCircle size={32} className="mx-auto mb-3 text-[var(--text-muted)]/50" />
        Select start and destination points to calculate path and show instructions.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-card)]">
      {/* Expand/Collapse Header */}
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-[var(--border)] hover:bg-[var(--accent-light)]/20 transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle navigation steps view"
      >
        <div className="flex items-center gap-2">
          <Footprints size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Route Summary</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-b border-[var(--border)] bg-[var(--bg)]">
            <div className="p-3 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Distance
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {formatDistance(route.totalDistance)}
              </span>
            </div>
            <div className="p-3 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Est. Time
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                <Clock size={12} className="text-[var(--accent)]" />
                {formatTime(route.estimatedTime)}
              </span>
            </div>
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Start Step */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-5 h-5 rounded-full bg-[var(--accent-light)] border border-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                  S
                </div>
                <div className="w-0.5 flex-1 bg-[var(--border)] my-1 min-h-[20px]" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Start at {route.from.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {route.from.map.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Path Steps */}
            {route.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-5 h-5 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                    {idx + 1}
                  </div>
                  {idx < route.steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-[var(--border)] my-1 min-h-[20px]" />
                  )}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-xs text-[var(--text-primary)]">
                    {step.instruction}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {step.type} • {formatDistance(step.distanceFromPrev)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Legacy wrapper container to hold components together. */
export default function Navigation() {
  return (
    <>
      <SearchPanel />
      <RoutePanel />
    </>
  );
}
