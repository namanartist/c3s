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
  Sparkles
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
        return <CornerUpLeft className="w-7 h-7 text-white animate-bounce" />;
      case 'right':
        return <CornerUpRight className="w-7 h-7 text-white animate-bounce" />;
      case 'up':
        return <ArrowUp className="w-7 h-7 text-white animate-pulse" />;
      case 'down':
        return <ArrowDown className="w-7 h-7 text-white animate-pulse" />;
      case 'straight':
      default:
        return <ArrowUp className="w-7 h-7 text-white animate-pulse" />;
    }
  };

  if (isMobile) {
    const showDualInput = !!destination;

    if (isNavigating) {
      const activeStep = navigationSteps[activeStepIndex] || null;
      const currentInstruction = navigationDirections[0]?.instruction || 'Head to start point';
      const currentDirection = navigationDirections[0]?.direction || 'straight';
      const currentDistance = navigationDirections[0]?.distance || '';

      return (
        <div className="absolute top-4 left-4 right-4 z-20 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-xl border border-emerald-500/20 p-4 flex items-center gap-3 text-white animate-in slide-in-from-top duration-300">
          {/* Direction Icon Container */}
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
            {renderGuidanceIcon(currentDirection)}
          </div>

          {/* Compass Icon Container */}
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10" title="Device Compass">
            <Compass
              className="w-5.5 h-5.5 text-white transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />
          </div>

          {/* Instruction Details */}
          <div className="flex-1 min-w-0">
            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100 block">
              {activeStep ? `Step ${activeStepIndex + 1} of ${navigationSteps.length} • ${activeStep.map ? activeStep.map.replace('_', ' ') : 'Campus'}` : 'Navigating'}
              {isSimulating && " • SIMULATING"}
            </span>
            <p className="text-xs font-black mt-0.5 leading-snug truncate">
              {currentInstruction}
            </p>
            {currentDistance && (
              <p className="text-[10px] text-emerald-100 font-bold mt-0.5">
                For {currentDistance}
              </p>
            )}
          </div>

          {/* Exit Button */}
          <button
            onClick={handleExitNavigation}
            className="p-2 hover:bg-white/10 rounded-xl text-emerald-50 transition-colors cursor-pointer shrink-0"
            title="Exit Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Floating Search Bar / Capsule (Top) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2">
          {!showDualInput ? (
            /* Single Search Bar (When no destination is active) */
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 dark:border-white/10 p-3.5 flex items-center gap-3 transition-colors">
              <div className="relative">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors cursor-pointer"
                  aria-label="Open Sidebar"
                  title="Open Map Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 mt-3 w-40 bg-white rounded-xl shadow-xl border border-black/[0.04] p-1.5 flex flex-col gap-0.5 z-30"
                    >
                      <button
                        onClick={() => {
                          navigate('/');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] rounded-lg transition-colors cursor-pointer"
                      >
                        Home
                      </button>
                      <button
                        onClick={() => {
                          navigate('/support');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-[#ff602e] rounded-lg transition-colors cursor-pointer"
                      >
                        Support
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                onClick={() => setActiveSearchField('dest')}
                className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
              >
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs font-semibold text-gray-400 truncate">
                  Search destination room, lab, washroom...
                </span>
              </div>
            </div>
          ) : (
            /* Dual Stacked Capsule (When destination is active) */
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 dark:border-white/10 p-3 flex items-center gap-3 transition-colors">
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    if (currentLocation) {
                      handleCurrentLocationClear();
                    } else {
                      handleDestinationClear();
                    }
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Stacked inputs */}
              <div className="flex-1 flex flex-col gap-1.5 relative py-1">
                {/* From Input */}
                <div
                  onClick={() => setActiveSearchField('start')}
                  className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 bg-white mr-2 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {currentLocation?.name || 'Choose starting point...'}
                  </span>
                </div>

                {/* To Input */}
                <div
                  onClick={() => setActiveSearchField('dest')}
                  className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 mr-1.5 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {destination?.name || 'Choose destination...'}
                  </span>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwapLocations}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-[#ff602e] flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Swap locations"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Search Overlay Modal */}
        <AnimatePresence>
          {activeSearchField !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#070b14] flex flex-col p-4 transition-colors"
            >
              {/* Header with Back and search input */}
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 p-2 mb-4 transition-colors">
                <button
                  onClick={() => {
                    setActiveSearchField(null);
                    setMobileSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-655 cursor-pointer block"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <input
                  autoFocus
                  type="text"
                  placeholder={activeSearchField === 'start' ? "Search starting point..." : "Search destination..."}
                  value={localSearchQuery}
                  onChange={(e) => handleMobileQueryChange(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 py-1"
                />
                {localSearchQuery && (
                  <button
                    onClick={() => handleMobileQueryChange('')}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              
              {/* Quick Action: Use My Current Location */}
              {activeSearchField === 'start' && (
                <button
                  type="button"
                  onClick={() => {
                    useGpsAsStartLocation();
                    setActiveSearchField(null);
                    setMobileSearchQuery('');
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 px-4 py-3 rounded-2xl flex items-center gap-3 text-left transition-all active:scale-[0.98] mb-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <LocateFixed className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                      Use My Current Location
                    </p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400">
                      Auto-detect nearest campus spot via live GPS
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    GPS
                  </span>
                </button>
              )}

              {/* Quick Start Room Presets for Mobile */}
              {activeSearchField === 'start' && !localSearchQuery && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Quick Starting Rooms
                  </p>
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
                          onClick={() => {
                            handleCurrentLocationSelect(matchedLoc);
                            setActiveSearchField(null);
                            setMobileSearchQuery('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{room.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile Quick Destination Presets */}
              {activeSearchField === 'dest' && !localSearchQuery && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Quick Destinations
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleQuickPreset(preset.query)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-orange-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Walkways & Gali Shortcuts
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {POPULAR_GALI_ROUTES.map((route) => (
                      <button
                        key={route.title}
                        type="button"
                        onClick={() => handleSelectGaliRoute(route)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-orange-400 text-left transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{route.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {route.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {route.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#ff602e] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full uppercase shrink-0">
                          Route
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions List */}
              <div className="flex-1 overflow-y-auto space-y-2" data-lenis-prevent>
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((location) => {
                    return (
                      <button
                        key={location.id}
                        onClick={() => {
                          if (activeSearchField === 'start') {
                            handleCurrentLocationSelect(location);
                          } else {
                            handleDestinationSelect(location);
                          }
                          setActiveSearchField(null);
                          setMobileSearchQuery('');
                        }}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:bg-blue-50/50 dark:hover:bg-slate-800/80 flex items-start gap-3 text-left transition-all cursor-pointer"
                      >
                        <div className="p-2 bg-orange-50 text-[#ff602e] rounded-xl">
                          <School className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{location.name}</p>
                          <p className="text-xs text-gray-400 font-semibold mt-0.5">
                            {location.building} • Floor {location.floor === 0 ? 'G' : `F${location.floor}`}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-[#ff602e] bg-orange-50 px-2 py-1 rounded-md shrink-0">
                          {location.category}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs font-semibold text-gray-400">
                    No matching locations found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Search className="w-4.5 h-4.5 text-[#ff602e]" />
        Plan Your Route
      </h2>

      <div className="space-y-4">
        <div className="relative flex items-center">
          <div className="flex-1 space-y-4 pr-10">
                        <SearchCurrentLocation
              currentLocation={currentLocation}
              onCurrentLocationSelect={handleCurrentLocationSelect}
              onCurrentLocationClear={handleCurrentLocationClear}
              campusLocations={campusLocations}
              onUseCurrentLocation={useGpsAsStartLocation}
              isGpsActive={isGpsActive}
              isGpsLocating={isGpsLocating}
            />

            <SearchDestination
              destination={destination}
              onDestinationSelect={handleDestinationSelect}
              onDestinationClear={handleDestinationClear}
              currentLocation={currentLocation}
              campusLocations={campusLocations}
              graph={graph}
            />
          </div>

          <button
            type="button"
            onClick={handleSwapLocations}
            className="absolute right-0 top-[54%] -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#ff602e] hover:border-orange-300 transition-all duration-200 z-10 pointer-events-auto cursor-pointer"
            title="Swap locations"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        
        {/* Quick 1-Tap Destination Presets */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Quick 1-Tap Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleQuickPreset(preset.query)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#ff602e] hover:border-orange-300 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-sm">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Walkways & Gali Shortcuts */}
        <div>
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            🚶 Walkways & Gali Shortcuts
          </span>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_GALI_ROUTES.map((route) => (
              <button
                key={route.title}
                type="button"
                onClick={() => handleSelectGaliRoute(route)}
                className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-50/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-white/10 hover:border-orange-300 text-left transition-all active:scale-[0.98] cursor-pointer group"
              >
                <span className="text-sm shrink-0 mt-0.5">{route.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#ff602e] truncate">
                    {route.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {route.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step-Free Toggle Option for Desktop */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-sm select-none transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Accessibility className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 dark:text-white">Step-Free Routes Only</span>
              <span className="text-[10px] text-gray-400 font-bold">Avoid stairs & use lifts</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAccessibleOnly(!accessibleOnly)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${accessibleOnly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${accessibleOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>

        <AnimatePresence>
          {destination && currentLocation && !isNavigating && !isComputingRoute && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                onClick={handleStartNavigation}
                className="w-full h-11 rounded-xl bg-[#ff602e] hover:bg-[#ff7b52] text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 group font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 mr-1" />
                Start Navigation
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
