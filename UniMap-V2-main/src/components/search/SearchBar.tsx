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
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui';
import SearchDestination from '@/components/ui/SearchDestination';
import SearchCurrentLocation from '@/components/ui/SearchCurrentLocation';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { buildGlobalGraph } from '@/lib/multiMapNavigation';

export interface SearchBarProps { }

export function SearchBar({ }: SearchBarProps) {
  const navigate = useNavigate();
  const {
    isMobile,
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
    isSimulating
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
            <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-3.5 flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-700 transition-colors cursor-pointer"
                  aria-label="Menu"
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
            <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-3 flex items-center gap-3">
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
                  className="flex items-center bg-[#f1f3f4] rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 bg-white mr-2 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-800 truncate">
                    {currentLocation?.name || 'Choose starting point...'}
                  </span>
                </div>

                {/* To Input */}
                <div
                  onClick={() => setActiveSearchField('dest')}
                  className="flex items-center bg-[#f1f3f4] rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 mr-1.5 flex-shrink-0" />
                  <span className="text-xs font-bold text-gray-800 truncate">
                    {destination?.name || 'Choose destination...'}
                  </span>
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwapLocations}
                className="w-10 h-10 rounded-full bg-[#f1f3f4] hover:bg-orange-50 hover:text-[#ff602e] flex items-center justify-center text-gray-500 transition-all active:scale-95 cursor-pointer shrink-0"
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
              className="fixed inset-0 z-50 bg-[#fcfaf6] flex flex-col p-4"
            >
              {/* Header with Back and search input */}
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-md border border-black/5 p-2 mb-4">
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
                  className="flex-1 bg-transparent border-0 outline-none text-sm font-semibold text-gray-800 py-1"
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
                        className="w-full bg-white px-4 py-3 rounded-2xl border border-black/[0.03] shadow-sm hover:bg-orange-50/55 flex items-start gap-3 text-left transition-all cursor-pointer"
                      >
                        <div className="p-2 bg-orange-50 text-[#ff602e] rounded-xl">
                          <School className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{location.name}</p>
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
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
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
            className="absolute right-0 top-[54%] -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-[#ff602e] hover:border-orange-300 transition-all duration-200 z-10 pointer-events-auto cursor-pointer"
            title="Swap locations"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Step-Free Toggle Option for Desktop */}
        <div className="flex items-center justify-between bg-white border border-neutral-200/60 rounded-xl p-3 shadow-sm select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Accessibility className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-800">Step-Free Routes Only</span>
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
