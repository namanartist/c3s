// src/components/ui/SearchCurrentLocation.tsx
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Locate, Building2, X, LocateFixed, Loader2, Sparkles } from 'lucide-react';
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
  onUseCurrentLocation?: () => void;
  isGpsActive?: boolean;
  isGpsLocating?: boolean;
}

export default function SearchCurrentLocation({
  currentLocation: _currentLocation,
  onCurrentLocationSelect,
  onCurrentLocationClear,
  campusLocations,
  onUseCurrentLocation,
  isGpsActive = false,
  isGpsLocating = false,
}: SearchCurrentLocationProps) {
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [showCurrentSuggestions, setShowCurrentSuggestions] = useState(false);

  useEffect(() => {
    setCurrentSearchQuery(_currentLocation?.name || '');
  }, [_currentLocation]);

  const debouncedQuery = useDebouncedValue(currentSearchQuery, 120);
  const normalizedQuery = useMemo(() => debouncedQuery.trim().toLowerCase(), [debouncedQuery]);

  const filteredCurrentLocations = useMemo(() => {
    if (!normalizedQuery) return campusLocations.slice(0, 8);
    const cleanQ = normalizedQuery
      .replace(/^(i am in|i'm in|im in|my location is)\s*/i, '')
      .replace(/room\s*no\.?|room\s*number|room\s*no|room|rm|classroom/gi, '')
      .replace(/[-\s]/g, '')
      .trim();

    return campusLocations.filter((loc) => {
      const searchStr = (loc.searchName ?? loc.name.toLowerCase()).toLowerCase();
      if (searchStr.includes(normalizedQuery)) return true;
      if (cleanQ && searchStr.replace(/[-\s]/g, '').includes(cleanQ)) return true;
      return false;
    });
  }, [normalizedQuery, campusLocations]);

  const handleSelect = (location: LocationItem) => {
    onCurrentLocationSelect(location);
    setCurrentSearchQuery(location.name);
    setShowCurrentSuggestions(false);
  };

  const handleClear = () => {
    setCurrentSearchQuery('');
    onCurrentLocationClear();
  };

  const handleUseGpsClick = () => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      setShowCurrentSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Locate className="w-3.5 h-3.5 text-emerald-500" />
          Where are you starting?
        </label>
        
        {onUseCurrentLocation && (
          <button
            type="button"
            onClick={handleUseGpsClick}
            disabled={isGpsLocating}
            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              isGpsActive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
            }`}
            title="Detect GPS & use closest campus spot"
          >
            {isGpsLocating ? (
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            ) : (
              <LocateFixed className={`w-3 h-3 ${isGpsActive ? 'text-emerald-500' : 'text-blue-500'}`} />
            )}
            <span>{isGpsLocating ? 'Locating...' : 'Use Current Location'}</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
        </div>

        <Input
          type="text"
          placeholder="Search starting room, gate, or use GPS..."
          value={currentSearchQuery}
          onChange={(e) => {
            setCurrentSearchQuery(e.target.value);
            setShowCurrentSuggestions(true);
          }}
          onFocus={() => setShowCurrentSuggestions(true)}
          className="pl-9 pr-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium text-sm"
        />

        {currentSearchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCurrentSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 w-full mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 max-h-72 overflow-y-auto overscroll-contain transition-colors"
          >
            {/* Dedicated Top Action: Use Current Location */}
            {onUseCurrentLocation && (
              <button
                type="button"
                onClick={handleUseGpsClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-slate-900 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-slate-800 transition-colors flex items-center gap-3 border-b border-emerald-100 dark:border-white/5 text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <LocateFixed className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Use Current Location
                    </p>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      GPS Live
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-slate-400 truncate">
                    Tap to auto-detect nearest campus node &amp; start routing
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            )}

            {/* Quick Indoor Rooms (Room 101, Room 102/J126, J101) */}
            {!currentSearchQuery && (
              <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-white/5">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 mb-2">
                  📍 Quick Indoor Rooms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Room 101 (J125)', id: 'room_J125' },
                    { label: 'Room 102 (J126)', id: 'room_J126' },
                    { label: 'Colloquium (J101)', id: 'room_J101' },
                    { label: 'AI Block M101', id: 'room_AI_FF_M101' },
                  ].map((room) => {
                    const matchedLoc = campusLocations.find((l) => l.id === room.id);
                    if (!matchedLoc) return null;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleSelect(matchedLoc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-emerald-400 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{room.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredCurrentLocations.length > 0 ? (
              filteredCurrentLocations.slice(0, 6).map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleSelect(location)}
                  className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors flex items-start gap-3 border-b border-slate-100 dark:border-white/5 last:border-0 text-left cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {location.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {location.building} • Floor {location.floor ?? 0}
                    </p>
                  </div>
                  <Badge variant="accent" className="text-xs flex-shrink-0">
                    {location.category}
                  </Badge>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching locations found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
