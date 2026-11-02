// src/components/search/SearchBar.tsx
import { useMemo, useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Navigation,
  ArrowRight,
  Menu,
  ArrowUpDown,
  School,
  ArrowLeft,
  X,
  MapPin,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ArrowDown,
  Accessibility,
  Compass,
  LocateFixed,
  Sparkles,
  Route as RouteIcon,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui';
import SearchDestination from '@/components/ui/SearchDestination';
import SearchCurrentLocation from '@/components/ui/SearchCurrentLocation';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { buildGlobalGraph } from '@/lib/multiMapNavigation';

export interface SearchBarProps { }

const QUICK_PRESETS = [
  { label: 'Main Gate', query: 'main gate', icon: '🚪' },
  { label: 'Library', query: 'library', icon: '📚' },
  { label: 'AI Block', query: 'ai building', icon: '💻' },
  { label: 'Canteen', query: 'canteen', icon: '☕' },
  { label: 'Restrooms', query: 'washroom', icon: '🚻' },
  { label: 'Electrical', query: 'electrical', icon: '⚡' },
];

const POPULAR_GALI_ROUTES = [
  {
    title: 'Main Gate ➔ Canteen',
    subtitle: 'Via Central Lawn Rasta',
    from: 'main gate',
    to: 'canteen',
    icon: '☕'
  },
  {
    title: 'Library ➔ AI Block',
    subtitle: 'Via Courtyard Walkway',
    from: 'library',
    to: 'ai building',
    icon: '💻'
  },
  {
    title: 'Jubilee Gate ➔ Conclave',
    subtitle: 'Direct East Corridor',
    from: 'jubilee gate',
    to: 'conclave',
    icon: '🏛️'
  },
  {
    title: 'Canteen ➔ Electrical',
    subtitle: 'Via West Alley & Gali',
    from: 'canteen',
    to: 'electrical',
    icon: '⚡'
  }
];

export function SearchBar({ }: SearchBarProps) {
  const navigate = useNavigate();
  const {
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    isMenuOpen,
    setIsMenuOpen,
    destination,
    currentLocation,
    isNavigating,
    isComputingRoute,
    activeSearchField,
    setActiveSearchField,
    mobileSearchQuery,
    setMobileSearchQuery,
    filteredSuggestions,
    handleDestinationSelect,
    handleDestinationClear,
    handleCurrentLocationSelect,
    handleCurrentLocationClear,
    handleSwapLocations,
    handleStartNavigation,
    handleExitNavigation,
    campusLocations,
    edges,
    navigationSteps,
    activeStepIndex,
    navigationDirections,
    accessibleOnly,
    setAccessibleOnly,
    compassHeading,
    isSimulating,
    isGpsActive,
    isGpsLocating,
    useGpsAsStartLocation
  } = useCampusNavigation();

  const [localSearchQuery, setLocalSearchQuery] = useState(mobileSearchQuery);

  useEffect(() => {
    setLocalSearchQuery(mobileSearchQuery);
  }, [mobileSearchQuery]);

  const handleMobileQueryChange = (val: string) => {
    setLocalSearchQuery(val);
    startTransition(() => {
      setMobileSearchQuery(val);
    });
  };

  const graph = useMemo(() => buildGlobalGraph(edges, { accessibleOnly }), [edges, accessibleOnly]);

  const handleQuickPreset = (query: string) => {
    const match = campusLocations.find((loc) =>
      (loc.searchName ?? loc.name.toLowerCase()).includes(query.toLowerCase())
    );
    if (match) {
      handleDestinationSelect(match);
      setActiveSearchField(null);
      setMobileSearchQuery('');
    }
  };

  const handleSelectGaliRoute = (route: typeof POPULAR_GALI_ROUTES[0]) => {
    const fromLoc = campusLocations.find((loc) =>
      (loc.searchName ?? loc.name.toLowerCase()).includes(route.from.toLowerCase())
    );
    const toLoc = campusLocations.find((loc) =>
      (loc.searchName ?? loc.name.toLowerCase()).includes(route.to.toLowerCase())
    );
    if (fromLoc && toLoc) {
      handleCurrentLocationSelect(fromLoc);
      handleDestinationSelect(toLoc);
      setActiveSearchField(null);
      setMobileSearchQuery('');
    }
  };

  const renderGuidanceIcon = (direction?: string) => {
    switch (direction) {
      case 'left':
        return <CornerUpLeft className="w-6 h-6 text-white animate-bounce" />;
      case 'right':
        return <CornerUpRight className="w-6 h-6 text-white animate-bounce" />;
      case 'up':
        return <ArrowUp className="w-6 h-6 text-white animate-pulse" />;
      case 'down':
        return <ArrowDown className="w-6 h-6 text-white animate-pulse" />;
      case 'straight':
      default:
        return <ArrowUp className="w-6 h-6 text-white animate-pulse" />;
    }
  };

  // MOBILE VIEW (< 768px)
  if (isMobile) {
    const showDualInput = !!destination;

    if (isNavigating) {
      const activeStep = navigationSteps[activeStepIndex] || null;
      const currentInstruction = navigationDirections[0]?.instruction || 'Head to start point';
      const currentDirection = navigationDirections[0]?.direction || 'straight';
      const currentDistance = navigationDirections[0]?.distance || '';

      return (
        <div className="absolute top-16 left-3 right-3 z-30 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl shadow-xl border border-white/20 p-3.5 flex items-center gap-3 text-white animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
            {renderGuidanceIcon(currentDirection)}
          </div>

          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10" title="Device Compass">
            <Compass
              className="w-5.5 h-5.5 text-white transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[8px] font-black uppercase tracking-wider text-blue-200 block">
              {activeStep ? `Step ${activeStepIndex + 1} of ${navigationSteps.length} • ${activeStep.map ? activeStep.map.replace('_', ' ') : 'Campus'}` : 'Navigating'}
              {isSimulating && " • SIMULATING"}
            </span>
            <p className="text-xs font-black mt-0.5 leading-snug truncate">
              {currentInstruction}
            </p>
            {currentDistance && (
              <p className="text-[10px] text-blue-100 font-bold mt-0.5">
                For {currentDistance}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleExitNavigation}
            className="p-2 hover:bg-white/15 rounded-xl text-white transition-colors cursor-pointer shrink-0"
            title="Exit Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Full Screen Slide-Over for Mobile Search Input */}
        <AnimatePresence>
          {activeSearchField && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col p-4 select-none"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSearchField(null);
                    setMobileSearchQuery('');
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={localSearchQuery}
                    onChange={(e) => handleMobileQueryChange(e.target.value)}
                    placeholder={activeSearchField === 'start' ? 'Search start point...' : 'Search destination (e.g. 101, Canteen)...'}
                    autoFocus
                    className="w-full h-11 pl-4 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {localSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleMobileQueryChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions List */}
              <div className="flex-1 overflow-y-auto space-y-2 pt-3 custom-scrollbar" data-lenis-prevent>
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => {
                        if (activeSearchField === 'start') {
                          handleCurrentLocationSelect(location);
                        } else {
                          handleDestinationSelect(location);
                        }
                        setActiveSearchField(null);
                        setMobileSearchQuery('');
                      }}
                      className="w-full bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs flex items-start gap-3 text-left transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <School className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{location.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {location.building} • Floor {location.floor === 0 ? 'G' : `F${location.floor}`}
                        </p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                        {location.category}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs font-semibold text-slate-400">
                    No matching campus spots found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="space-y-4">
      {/* Search Header Pill */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <RouteIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Plan Campus Route</span>
        </h2>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/50">
          Multi-Floor Non-Blocking
        </span>
      </div>

      <div className="space-y-3.5">
        {/* Connected Journey Card (Start & Destination with Connecting Rail) */}
        <div className="relative p-3.5 rounded-3xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs">
          {/* Vertical Connecting Guide Rail */}
          <div className="absolute left-[26px] top-[30px] bottom-[30px] w-0.5 bg-dashed border-l-2 border-dashed border-blue-400/40 dark:border-blue-500/30 pointer-events-none" />

          <div className="space-y-3">
            {/* Origin Input */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center shrink-0 mt-2 z-10 bg-white dark:bg-slate-900">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <SearchCurrentLocation
                  currentLocation={currentLocation}
                  onCurrentLocationSelect={handleCurrentLocationSelect}
                  onCurrentLocationClear={handleCurrentLocationClear}
                  campusLocations={campusLocations}
                  onUseCurrentLocation={useGpsAsStartLocation}
                  isGpsActive={isGpsActive}
                  isGpsLocating={isGpsLocating}
                />
              </div>
            </div>

            {/* Destination Input */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border-2 border-blue-600 flex items-center justify-center shrink-0 mt-2 z-10 bg-white dark:bg-slate-900">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <SearchDestination
                  destination={destination}
                  onDestinationSelect={handleDestinationSelect}
                  onDestinationClear={handleDestinationClear}
                  currentLocation={currentLocation}
                  campusLocations={campusLocations}
                  graph={graph}
                />
              </div>
            </div>
          </div>

          {/* Swap Locations Button */}
          <button
            type="button"
            onClick={handleSwapLocations}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition-all z-10 cursor-pointer active:scale-90"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Quick 1-Tap Destination Presets */}
        <div>
          <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Quick 1-Tap Destinations
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleQuickPreset(preset.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Walkways & Gali Shortcuts */}
        <div>
          <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            🚶 Walkways & Gali Shortcuts
          </span>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_GALI_ROUTES.map((route) => (
              <button
                key={route.title}
                type="button"
                onClick={() => handleSelectGaliRoute(route)}
                className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 text-left transition-all active:scale-[0.98] cursor-pointer group shadow-xs"
              >
                <span className="text-base shrink-0 mt-0.5">{route.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {route.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {route.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step-Free Accessibility Toggle */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 shadow-xs select-none transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Accessibility className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Step-Free Routes Only
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Prioritizes ramps and lifts over staircases
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAccessibleOnly(!accessibleOnly)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
              accessibleOnly ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                accessibleOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Button to Start Navigation */}
        <AnimatePresence>
          {destination && currentLocation && !isNavigating && !isComputingRoute && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                onClick={handleStartNavigation}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 group font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Start Turn-by-Turn Navigation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
