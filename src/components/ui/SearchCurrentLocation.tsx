// src/components/ui/SearchCurrentLocation.tsx
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Locate, Building2, X } from 'lucide-react';
import { Input } from './input';
import Badge from './Badge';
import useDebouncedValue from './hooks/useDebouncedValue';

export interface LocationItem {
  id: string;
  name: string;
  searchName: string;
  map: string | null;
  building: string;
  floor: number | null;
  category: string;
  x: number;
  y: number;
}

interface SearchCurrentLocationProps {
  currentLocation: LocationItem | null;
  onCurrentLocationSelect: (location: LocationItem) => void;
  onCurrentLocationClear: () => void;
  campusLocations: LocationItem[];
}

export default function SearchCurrentLocation({
  currentLocation: _currentLocation,
  onCurrentLocationSelect,
  onCurrentLocationClear,
  campusLocations
}: SearchCurrentLocationProps) {
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);

  useEffect(() => {
    setCurrentSearchQuery(_currentLocation?.name || '');
  }, [_currentLocation]);

  const debouncedQuery = useDebouncedValue(currentSearchQuery, 120);
  const normalizedQuery = useMemo(() => debouncedQuery.trim().toLowerCase(), [debouncedQuery]);

  const filteredCurrentLocations = useMemo(() =>
    normalizedQuery
      ? campusLocations.filter((loc) =>
        (loc.searchName ?? loc.name.toLowerCase()).includes(normalizedQuery)
      )
      : [], [normalizedQuery, campusLocations]
  );

  const handleSelect = (location: LocationItem) => {
    onCurrentLocationSelect(location);
    setCurrentSearchQuery(location.name);
    setShowCurrentSuggestions(false);
  };

  const handleClear = () => {
    setCurrentSearchQuery('');
    onCurrentLocationClear();
  };

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
        Where are you currently?
      </label>
      <div className="relative">
        <Locate className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />

        <Input
          type="text"
          placeholder="Search current location..."
          value={currentSearchQuery}
          onChange={(e) => {
            setCurrentSearchQuery(e.target.value);
            setShowCurrentSuggestions(true);
          }}
          onFocus={() => setShowCurrentSuggestions(true)}
          className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-green-400 focus:ring-green-400/20"
        />

        {currentSearchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCurrentSuggestions && filteredCurrentLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-auto overscroll-contain"
          >
            {filteredCurrentLocations.slice(0, 6).map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location)}
                className="w-full px-4 py-3 hover:bg-green-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0 text-left"
              >
                <Building2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{location.name}</p>
                  <p className="text-xs text-gray-500">
                    {location.building} • Floor {location.floor}
                  </p>
                </div>
                <Badge variant="accent" className="text-xs flex-shrink-0">
                  {location.category}
                </Badge>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
