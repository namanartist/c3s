// src/components/ui/SearchDestination.tsx
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Building2, X, Check } from 'lucide-react';
import { Input } from './input';
import Badge from './Badge';
import type { DijkstraGraph } from '@/lib/dijkstra';
import useDebouncedValue from './hooks/useDebouncedValue';
import useNearestWashroom from './hooks/useNearestWashroom';
import type { WashroomLocation } from './hooks/useNearestWashroom';

interface SearchDestinationProps {
  destination: WashroomLocation | null;
  onDestinationSelect: (location: WashroomLocation) => void;
  onDestinationClear: () => void;
  currentLocation: { id: string } | null;
  campusLocations: WashroomLocation[];
  graph: DijkstraGraph;
}

export default function SearchDestination({
  destination,
  onDestinationSelect,
  onDestinationClear,
  currentLocation,
  campusLocations,
  graph,
}: SearchDestinationProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(destination?.name || '');
  }, [destination]);

  const debouncedQuery = useDebouncedValue(searchQuery, 120);
  const normalizedQuery = useMemo(() => debouncedQuery.trim().toLowerCase(), [debouncedQuery]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [washroomPage, setWashroomPage] = useState(0);
  const washroomPageSize = 6;

  const filteredLocations = useMemo(() =>
    normalizedQuery
      ? campusLocations.filter((loc) =>
        (loc.searchName ?? loc.name.toLowerCase()).includes(normalizedQuery)
      )
      : [], [normalizedQuery, campusLocations]
  );

  const isWashroomSelectionMode =
    filteredLocations.length > 0 && filteredLocations.every((loc) => loc.category === 'Washroom');

  const resultsToShow = useMemo(() => {
    if (!isWashroomSelectionMode) return filteredLocations.slice(0, 6);

    const baseCount = (washroomPage + 1) * washroomPageSize;
    const selectedIndex = destination
      ? filteredLocations.findIndex((loc) => loc.id === destination.id)
      : -1;
    const count = selectedIndex >= 0 ? Math.max(baseCount, selectedIndex + 1) : baseCount;
    return filteredLocations.slice(0, count);
  }, [isWashroomSelectionMode, filteredLocations, washroomPage, destination]);

  const canLoadMoreWashrooms = isWashroomSelectionMode && resultsToShow.length < filteredLocations.length;

  useEffect(() => {
    setWashroomPage(0);
  }, [debouncedQuery, isWashroomSelectionMode]);

  const { nearestWashroom } = useNearestWashroom({
    currentLocation,
    isWashroomSelectionMode,
    filteredLocations,
    graph,
  });

  useEffect(() => {
    if (!currentLocation || !isWashroomSelectionMode) return;
    if (!nearestWashroom) return;

    const destinationInResults =
      destination && filteredLocations.some((loc) => loc.id === destination.id);

    if (!destinationInResults) {
      onDestinationSelect(nearestWashroom);
    }
  }, [currentLocation?.id, isWashroomSelectionMode, nearestWashroom?.id, destination?.id, filteredLocations, onDestinationSelect]);

  const handleSelect = (location: WashroomLocation) => {
    onDestinationSelect(location);
    setSearchQuery(location.name);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    onDestinationClear();
  };

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
        Where do you want to go?
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff602e]" />

        <Input
          type="text"
          placeholder="Search destination..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 text-sm"
        />

        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && filteredLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-auto overscroll-contain"
          >
            {resultsToShow.map((location) => {
              const isSelected = destination?.id === location.id;
              return (
                <button
                  key={location.id}
                  onClick={() => handleSelect(location)}
                  className={`w-full px-4 py-3 hover:bg-orange-50/50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0 text-left ${isSelected ? 'bg-orange-50/50' : ''
                    }`}
                >
                  <Building2 className="w-4 h-4 text-[#ff602e] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{location.name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {location.building} • Floor {location.floor}
                    </p>
                  </div>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#ff602e] flex-shrink-0 mt-0.5" />
                  ) : null}
                  <Badge variant="accent" className="text-xs flex-shrink-0">
                    {location.category}
                  </Badge>
                </button>
              );
            })}

            {canLoadMoreWashrooms ? (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setWashroomPage((p) => p + 1)}
                  className="w-full px-4 py-2 text-xs font-bold text-[#ff602e] hover:text-[#ff7b52] hover:bg-orange-50 transition-colors rounded-lg"
                >
                  Load more
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
