// src/components/ui/MapLayout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Building2,
  ShieldCheck,
  School,
  ShieldAlert,
  QrCode,
  LayoutDashboard,
  ExternalLink,
  Navigation as NavigationIcon,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Footprints,
  Sparkles,
  ArrowRightLeft,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
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
    floorLabel: '1st Floor',
    building: 'Main Academic Block',
    badge: '101',
    description: 'First Floor Lecture Room near East Staircase',
    icon: '📚'
  },
  {
    id: 'room_J126',
    name: 'Classroom 102 (J126)',
    category: 'Classroom',
    map: 'Main_FF',
    floorLabel: '1st Floor',
    building: 'Main Academic Block',
    badge: '102',
    description: 'First Floor Lecture Room adjacent to Room 101',
    icon: '📚'
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
    icon: '🏛️'
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
    icon: '🤖'
  },
  {
    id: 'canteen_node',
    name: 'Campus Canteen & Cafeteria',
    category: 'Amenity',
    map: 'Campus_Map',
    floorLabel: 'Campus',
    building: 'Student Amenities',
    badge: 'Food',
    description: 'Student & Faculty Refreshment Hub',
    icon: '☕'
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
    icon: '📖'
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
    icon: '🚪'
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
    icon: '🚪'
  },
];

const CAMPUS_FLOORS = [
  { id: 'Campus_Map', label: 'Campus' },
  { id: 'Main_GF', label: 'Main GF' },
  { id: 'Main_FF', label: 'Main 1F' },
  { id: 'Main_SF', label: 'Main 2F' },
  { id: 'AI_GF', label: 'AI GF' },
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
    destination,
    isNavigating,
    nodes,
    handleDestinationSelect,
    floors,
    routeDistance,
    routeDuration
  } = useCampusNavigation();

  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const proctorMode = isProctorRole();
  const [activeTab, setActiveTab] = useState<SidebarTab>('route');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [mobileDrawerHeight, setMobileDrawerHeight] = useState<'collapsed' | 'half' | 'full'>('collapsed');

  // Automatically reveal the navigation drawer and focus the Route tab when navigating (e.g. SOS incident or selected destination)
  useEffect(() => {
    if (isNavigating || destination) {
      setSidebarOpen(true);
      setActiveTab('route');
      if (isMobile) {
        setMobileDrawerHeight('half');
      }
    }
  }, [isNavigating, destination, isMobile, setSidebarOpen]);

  const detectedBuilding = userGpsCoords ? detectIndoorBuilding(userGpsCoords) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070b14] transition-colors select-none">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/80 dark:bg-[#0d1424]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
            <Compass className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              MITS C3S NAVIGATOR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Synchronizing multi-floor campus graph & vector maps...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectFeaturedPlace = (place: typeof FEATURED_PLACES[0]) => {
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

    handleDestinationSelect(target);
    if (place.map) {
      setSelectedMapId(place.map);
    }
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
      {/* Navigator Top Glass Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-blue-50/60 dark:from-blue-950/20 to-transparent shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/25 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase block truncate">
                  CAMPUS NAVIGATOR
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  MITS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isGpsActive
                      ? isOutsideCampus
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500 animate-pulse'
                      : 'bg-blue-500'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                  {isGpsActive
                    ? isOutsideCampus
                      ? 'Outside Perimeter • Gate 1 Nearest'
                      : detectedBuilding
                      ? `${detectedBuilding.name} (Indoor)`
                      : 'Campus Outdoor Live GPS'
                    : 'Interactive Waypoint Routing'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Floor Quick-Access Segmented Tabs */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Map:</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'Campus_Map', label: 'Campus' },
              { id: 'Main_GF', label: 'Main GF' },
              { id: 'Main_FF', label: 'Main 1F (R101/102)' },
              { id: 'Main_SF', label: 'Main 2F' },
              { id: 'AI_GF', label: 'AI GF' },
            ].map((f) => {
              const isActive = activeMapId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedMapId(f.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-white/5'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigator Mode Navigation Pill Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-1 bg-slate-200/50 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('route')}
            className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'route'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-white/5'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Route</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'places'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-white/5'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Places</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portals')}
            className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'portals'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-white/5'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Route Planning & Steps */}
      {activeTab === 'route' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar" data-lenis-prevent>
          {searchBar}
          {routePanel}
        </div>
      )}

      {/* Tab 2: Directory of Classrooms & Campus Spots */}
      {activeTab === 'places' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar" data-lenis-prevent>
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Places' },
              { id: 'classrooms', label: 'Classrooms (101/102)' },
              { id: 'labs', label: 'Labs' },
              { id: 'amenities', label: 'Canteen & Library' },
              { id: 'gates', label: 'Gates' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelectFeaturedPlace(place)}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:bg-blue-950/20 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {place.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {place.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                          {place.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                        {place.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        <span>{place.building}</span>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400">{place.floorLabel}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"
                    title="Route to location"
                  >
                    <NavigationIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: C3S Ecosystem Portals & Safety */}
      {activeTab === 'portals' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar" data-lenis-prevent>
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
              MITS C3S ECOSYSTEM
            </span>
            <p className="text-sm font-black mt-1">Campus Surveillance & Safety Defense</p>
            <p className="text-xs text-blue-100 mt-1.5 leading-relaxed font-medium">
              Real-time gate terminals, automated guard dispatches, and emergency mesh wayfinding.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                title: 'Student Safety Base',
                subtitle: 'View attendance logs, movement history & campus alerts',
                icon: School,
                action: () => navigate('/student'),
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
                badge: 'Portal',
              },
              {
                title: 'Faculty Welfare & Staff Desk',
                subtitle: 'Acknowledge alerts, view student logs & campus safety reports',
                icon: Users,
                action: () => navigate('/faculty'),
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
                badge: 'Academic',
              },
              {
                title: 'Security Guard Terminal',
                subtitle: 'Patrol schedules, incident alerts & rapid response',
                icon: ShieldCheck,
                action: () => navigate('/security'),
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
                badge: 'Security',
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
                subtitle: 'Instantly notify security control room & nearby responders',
                icon: ShieldAlert,
                action: () => useSafetyStore.getState().setSosModalOpen(true),
                color: 'text-red-600 bg-red-50 dark:bg-red-950/50',
                badge: 'Urgent',
              },
            ].map((portal) => {
              const Icon = portal.icon;
              return (
                <button
                  key={portal.title}
                  type="button"
                  onClick={portal.action}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md text-left transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${portal.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {portal.title}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
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
      <div className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-[#070b14] select-none flex flex-col">
        {/* Top Proctor Dashboard Switcher if active */}
        {proctorMode && <ProctorDashboard />}

        {/* Full-Screen Map Canvas (Untouched) */}
        <div className="flex-1 relative w-full h-full z-0">
          {mapCanvas}
        </div>

        {/* Floating Top Control Island */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-full shadow-lg text-xs font-black text-slate-900 dark:text-white active:scale-95 transition-all cursor-pointer pointer-events-auto"
            title="Open Campus Navigator"
          >
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Search & Floors</span>
          </button>

          {header}
        </div>

        {/* Mobile Horizontal Quick-Floor Pill Selector */}
        <div className="absolute top-15 left-3 right-3 z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1">
          {CAMPUS_FLOORS.map((f) => {
            const isSelected = activeMapId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedMapId(f.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap backdrop-blur-xl shadow-md transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-white/10'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Conditional Dashboards for Mobile */}
        {activeDashboard === 'soc' && <CctvSocDashboard />}
        {activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
        {activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

        {/* Mobile Floating Bottom Summary Pill when route or destination is selected (leaves right-side map controls clear) */}
        {activeDashboard === 'nav' && !sidebarOpen && destination && (
          <div className="absolute bottom-4 left-3 right-[84px] z-20 pointer-events-auto">
            <div
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 shadow-2xl flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/25">
                  <NavigationIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">
                    {isNavigating ? 'Route Active' : 'Destination'}
                  </span>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {destination.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                    Tap for turn-by-turn guidance
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>
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
            <div className="relative w-[88vw] max-w-[390px] h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col z-10 border-r border-slate-200/80 dark:border-white/10 animate-in slide-in-from-left duration-250">
              {renderSidebarContent()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VIEW (>= 768px)
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-[#070b14] select-none flex flex-col font-sans">
      {/* Top Center Floating Dashboard Context Switcher */}
      {proctorMode && <ProctorDashboard />}

      {/* Full Screen Interactive Map Canvas (Untouched) */}
      <div className="flex-1 relative w-full h-full z-0">
        {mapCanvas}
      </div>

      {/* Sleek Floating Header on Top-Right */}
      {header}

      {/* Conditional Full-Screen / Overlay Dashboards */}
      {proctorMode && activeDashboard === 'soc' && <CctvSocDashboard />}
      {proctorMode && activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
      {proctorMode && activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

      {/* Floating Toggle Pill when Sidebar is Collapsed on Desktop */}
      {!sidebarOpen && activeDashboard === 'nav' && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute top-5 left-5 z-20 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group active:scale-95 pointer-events-auto"
          title="Open Campus Navigator Sidebar"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <PanelLeftOpen className="w-4.5 h-4.5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
              Campus Navigator
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {destination ? destination.name : 'Search Classrooms 101/102, Labs & Routes'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ml-1" />
        </button>
      )}

      {/* Dedicated Desktop Navigator Card (Floating Left Panel) */}
      <div
        className={`absolute top-5 left-5 z-20 w-[390px] lg:w-[410px] max-w-[calc(100vw-40px)] h-[calc(100vh-40px)] flex flex-col bg-white/90 dark:bg-[#0A0F1D]/90 backdrop-blur-2xl rounded-[30px] shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden pointer-events-auto transition-all duration-300 ${
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
