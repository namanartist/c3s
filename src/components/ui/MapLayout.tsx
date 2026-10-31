import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  MapPin,
  Building,
  ShieldCheck,
  LocateFixed,
  School,
  DoorOpen,
  ShieldAlert,
  QrCode,
  LayoutDashboard,
  ExternalLink,
  Navigation as NavigationIcon,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { useGateStore } from '@/store/gateStore';
import { CctvSocDashboard } from '@/components/safety/CctvSocDashboard';
import { SafetyAnalyticsDashboard } from '@/components/safety/SafetyAnalyticsDashboard';
import { PatrolDispatchDashboard } from '@/components/safety/PatrolDispatchDashboard';
import { ProctorDashboard } from '@/components/safety/ProctorDashboard';
import { isProctorRole } from '@/lib/viewerRole';
import { detectIndoorBuilding } from '@/lib/geoProjection';

export interface MapLayoutProps {
  header?: React.ReactNode;
  searchBar?: React.ReactNode;
  mapCanvas?: React.ReactNode;
  routePanel?: React.ReactNode;
}

type SidebarTab = 'route' | 'places' | 'portals';

const FEATURED_PLACES = [
  {
    id: 'room_J125',
    name: 'Classroom 101 (J125)',
    category: 'Classroom',
    map: 'Main_FF',
    floorLabel: 'First Floor',
    building: 'Main Academic Block',
    badge: '101',
    description: 'First Floor Lecture Room near East Staircase',
  },
  {
    id: 'room_J126',
    name: 'Classroom 102 (J126)',
    category: 'Classroom',
    map: 'Main_FF',
    floorLabel: 'First Floor',
    building: 'Main Academic Block',
    badge: '102',
    description: 'First Floor Lecture Room adjacent to Room 101',
  },
  {
    id: 'room_J101',
    name: 'Colloquium Hall (J101)',
    category: 'Auditorium',
    map: 'Main_GF',
    floorLabel: 'Ground Floor',
    building: 'Main Academic Block',
    badge: 'Hall',
    description: 'Central Seminar & Conference Hall',
  },
  {
    id: 'room_M101',
    name: 'AI & Robotics Lab M101',
    category: 'Laboratory',
    map: 'AI_GF',
    floorLabel: 'AI Ground',
    building: 'AI Complex',
    badge: 'AI Lab',
    description: 'High Performance AI Computing & Robotics Center',
  },
  {
    id: 'canteen_node',
    name: 'Campus Canteen & Cafeteria',
    category: 'Amenity',
    map: 'Campus_Map',
    floorLabel: 'Ground',
    building: 'Student Amenities',
    badge: 'Food',
    description: 'Student & Faculty Refreshment Hub',
  },
  {
    id: 'library_node',
    name: 'Central Library & Reading Hall',
    category: 'Academic',
    map: 'Campus_Map',
    floorLabel: 'Campus',
    building: 'Library Block',
    badge: 'Library',
    description: 'Digital Archives & Study Reference Section',
  },
  {
    id: 'main_gate_1',
    name: 'Gate 1 (Main Entrance)',
    category: 'Gate',
    map: 'Campus_Map',
    floorLabel: 'Perimeter',
    building: 'Campus Perimeter',
    badge: 'Gate 1',
    description: 'Main Campus Check-in Terminal with Automated Scanner',
  },
  {
    id: 'jubilee_gate_2',
    name: 'Gate 2 (Jubilee Gate)',
    category: 'Gate',
    map: 'Campus_Map',
    floorLabel: 'Perimeter',
    building: 'Campus Perimeter',
    badge: 'Gate 2',
    description: 'East Campus Access & Vehicle Screening Gate',
  },
];

export function MapLayout({ header, searchBar, mapCanvas, routePanel }: MapLayoutProps) {
  const navigate = useNavigate();
  const {
    isMobile,
    loading,
    sidebarOpen,
    setSidebarOpen,
    userGpsCoords,
    isGpsActive,
    isOutsideCampus,
    activeMapId,
    setSelectedMapId,
    currentLocation,
    nodes,
    handleDestinationSelect,
  } = useCampusNavigation();

  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const proctorMode = isProctorRole();
  const [activeTab, setActiveTab] = useState<SidebarTab>('route');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const detectedBuilding = userGpsCoords ? detectIndoorBuilding(userGpsCoords) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#070b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-700 text-sm font-semibold">Loading MITS campus map...</p>
        </div>
      </div>
    );
  }

  const handleSelectFeaturedPlace = (place: typeof FEATURED_PLACES[0]) => {
    // 1. Find matching node from graph if available
    const matchedNode =
      nodes.find((n) => n.id === place.id) ||
      nodes.find((n) => n.name?.toLowerCase().includes(place.badge.toLowerCase())) ||
      nodes.find((n) => n.name?.toLowerCase().includes(place.name.toLowerCase()));

    const target = matchedNode || {
      id: place.id,
      name: place.name,
      map: place.map,
      category: place.category,
      building: place.building,
    };

    // 2. Select destination and switch floor
    handleDestinationSelect(target);
    if (place.map) {
      setSelectedMapId(place.map);
    }
    // 3. Switch back to Route tab so the user sees the route preview immediately
    setActiveTab('route');
  };

  const filteredPlaces = FEATURED_PLACES.filter((p) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'classrooms') return p.category === 'Classroom' || p.category === 'Auditorium';
    if (filterCategory === 'labs') return p.category === 'Laboratory' || p.category === 'Academic';
    if (filterCategory === 'gates') return p.category === 'Gate';
    if (filterCategory === 'amenities') return p.category === 'Amenity';
    return true;
  });

  // Render the core sidebar contents
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Sidebar Top Brand & Indoor GPS Precision Header */}
      <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase block truncate">
                MITS C3S NAVIGATOR
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isGpsActive
                      ? isOutsideCampus
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="truncate">
                  {isGpsActive
                    ? isOutsideCampus
                      ? 'Outside Perimeter • Gate 1'
                      : detectedBuilding
                      ? `${detectedBuilding.name} (Indoor)`
                      : 'Campus Outdoor Live GPS'
                    : 'Interactive Waypoint Routing'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Precision Floor Selector Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-100/80 dark:border-white/5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Floors:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'Campus_Map', label: 'Campus' },
              { id: 'Main_GF', label: 'Main GF' },
              { id: 'Main_FF', label: 'Main FF (R-101/102)' },
              { id: 'Main_SF', label: 'Main SF' },
              { id: 'AI_GF', label: 'AI GF' },
            ].map((f) => {
              const isActive = activeMapId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedMapId(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar View Mode Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('route')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'route'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'places'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Places</span>
          </button>

          <button
            onClick={() => setActiveTab('portals')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'portals'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>C3S Portals</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Route Planning & Steps */}
      {activeTab === 'route' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" data-lenis-prevent>
          {searchBar}
          {routePanel}
        </div>
      )}

      {/* Tab 2: Directory of Classrooms & Campus Spots */}
      {activeTab === 'places' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" data-lenis-prevent>
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'classrooms', label: 'Rooms (101/102)' },
              { id: 'labs', label: 'Labs' },
              { id: 'amenities', label: 'Canteen & Library' },
              { id: 'gates', label: 'Gates' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectFeaturedPlace(place)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {place.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
                        {place.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                      {place.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      <span>{place.building}</span>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{place.floorLabel}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"
                    title="Route to location"
                  >
                    <NavigationIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: C3S Ecosystem Portals & Safety */}
      {activeTab === 'portals' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" data-lenis-prevent>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
              MITS C3S PLATFORM
            </span>
            <p className="text-sm font-black mt-0.5">Campus Surveillance & Safety Ecosystem</p>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Real-time gate terminals, automated guard dispatches, and emergency broadcast network.
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'Daily Gate QR Scanner',
                subtitle: 'Scan check-in / check-out QR codes at campus gates',
                icon: QrCode,
                action: () => useGateStore.getState().setScannerModalOpen(true),
                color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
                badge: 'Gate 1, 2, 3',
              },
              {
                title: 'Student Safety Portal',
                subtitle: 'View attendance logs, movement history & campus alerts',
                icon: School,
                action: () => navigate('/student'),
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
                badge: 'Student',
              },
              {
                title: 'Security Guard Terminal',
                subtitle: 'Patrol schedules, incident alerts & rapid response',
                icon: ShieldCheck,
                action: () => navigate('/security'),
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
                badge: 'Guard',
              },
              {
                title: 'Control Room SOC',
                subtitle: 'Live tactical operations map & CCTV matrices',
                icon: LayoutDashboard,
                action: () => navigate('/control-room'),
                color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
                badge: 'SOC',
              },
              {
                title: 'Emergency SOS Broadcast',
                subtitle: 'Instantly notify security control room & emergency contacts',
                icon: ShieldAlert,
                action: () => useSafetyStore.getState().setSosModalOpen(true),
                color: 'text-red-600 bg-red-50 dark:bg-red-950/50',
                badge: 'Emergency',
              },
            ].map((portal) => {
              const Icon = portal.icon;
              return (
                <button
                  key={portal.title}
                  type="button"
                  onClick={portal.action}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 text-left transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${portal.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {portal.title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                          {portal.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                        {portal.subtitle}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // MOBILE VIEW (< 768px)
  if (isMobile) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#070b14] select-none flex flex-col">
        {/* Floating Top Dashboard Mode Switcher */}
        {proctorMode && <ProctorDashboard />}

        {/* Full Screen Interactive Map Canvas */}
        <div className="flex-1 relative w-full h-full z-0">
          {mapCanvas}
        </div>

        {/* Floating Mobile Sidebar Trigger Button on Top-Left */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-full shadow-lg text-xs font-bold text-slate-800 dark:text-slate-200 active:scale-95 transition-all cursor-pointer pointer-events-auto"
          title="Open Map Sidebar"
        >
          <PanelLeftOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Sidebar</span>
        </button>

        {header}

        {/* Conditional Dashboards for Mobile */}
        {activeDashboard === 'soc' && <CctvSocDashboard />}
        {activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
        {activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

        {/* Standard Mobile In-Map Route Panel & Search when Sidebar is closed */}
        {activeDashboard === 'nav' && !sidebarOpen && (
          <>
            {searchBar}
            {routePanel}
          </>
        )}

        {/* Mobile Slide-Over Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex pointer-events-auto">
            {/* Backdrop Dimmer */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Slide-In Sidebar Card */}
            <div className="relative w-[88vw] max-w-[380px] h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col z-10 border-r border-slate-200/80 dark:border-white/10 animate-in slide-in-from-left duration-250">
              {renderSidebarContent()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VIEW (>= 768px)
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#070b14] select-none flex flex-col">
      {/* Top Center Floating Dashboard Context Switcher */}
      {proctorMode && <ProctorDashboard />}

      {/* Full Screen Interactive Map Canvas */}
      <div className="flex-1 relative w-full h-full z-0">
        {mapCanvas}
      </div>

      {header}

      {/* Conditional Full-Screen / Overlay Dashboards */}
      {proctorMode && activeDashboard === 'soc' && <CctvSocDashboard />}
      {proctorMode && activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
      {proctorMode && activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

      {/* Floating Toggle Pill when Sidebar is Collapsed on Desktop */}
      {!sidebarOpen && activeDashboard === 'nav' && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-6 left-6 z-20 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group active:scale-95 pointer-events-auto"
          title="Open Navigation Sidebar"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <PanelLeftOpen className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
              Open Sidebar
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {currentLocation ? currentLocation.name : 'Route, Classrooms 101/102 & Floors'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-1" />
        </button>
      )}

      {/* Dedicated Desktop Sidebar (Docked / Floating Left Panel) */}
      <div
        className={`absolute top-6 left-6 z-20 w-[420px] max-w-[calc(100vw-48px)] h-[calc(100vh-48px)] flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden pointer-events-auto transition-all duration-300 ${
          activeDashboard !== 'nav'
            ? 'opacity-0 pointer-events-none -translate-x-6'
            : sidebarOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 pointer-events-none -translate-x-12'
        }`}
      >
        {renderSidebarContent()}
      </div>
    </div>
  );
}
