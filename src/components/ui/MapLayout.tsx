// src/components/ui/MapLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Footprints,
  Sparkles,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Volume2,
  VolumeX,
  Accessibility,
  LocateFixed,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useCampusNavigation } from '@/hooks/useCampusNavigation';
import { useSafetyStore } from '@/store/safetyStore';
import { useC3SStore } from '@/store/c3sStore';
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
    handleDestinationClear,
    handleCurrentLocationSelect,
    handleCurrentLocationClear,
    handleStartNavigation,
    handleExitNavigation,
    handleResetNavigation,
    navigationDirections,
    navigationSteps,
    activeStepIndex,
    setActiveStepIndex,
    floors,
    routeDistance,
    routeDuration,
    accessibleOnly,
    setAccessibleOnly,
    compassHeading,
    useGpsAsStartLocation
  } = useCampusNavigation();

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const toggleVoice = () => setIsVoiceEnabled((prev) => !prev);

  const currentRole = useC3SStore((s) => s.currentRole);
  const isStudent = currentRole === 'STUDENT';
  const activeDashboard = useSafetyStore((s) => s.activeDashboard);
  const proctorMode = isProctorRole();
  const [activeTab, setActiveTab] = useState<SidebarTab>('route');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [mobileDrawerHeight, setMobileDrawerHeight] = useState<'collapsed' | 'half' | 'full'>('collapsed');

  // Mobile navigation state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileStepsOpen, setIsMobileStepsOpen] = useState(false);
  const [mobileSearchField, setMobileSearchField] = useState<'destination' | 'start'>('destination');
  const [mobileSearchQuery, setLocalMobileQuery] = useState('');
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState<'all' | 'classrooms' | 'labs' | 'amenities' | 'gates'>('all');

  const renderGuidanceIcon = (direction?: string) => {
    switch (direction) {
      case 'left':
        return <CornerUpLeft className="w-5 h-5 text-white" />;
      case 'right':
        return <CornerUpRight className="w-5 h-5 text-white" />;
      case 'up':
        return <ArrowUp className="w-5 h-5 text-white animate-pulse" />;
      case 'down':
        return <ArrowDown className="w-5 h-5 text-white animate-pulse" />;
      case 'straight':
      default:
        return <ArrowUp className="w-5 h-5 text-white animate-pulse" />;
    }
  };

  const mobileFilteredNodes = useMemo(() => {
    let list = nodes.filter((n) => n.name && n.name.trim().length > 0);
    if (isStudent) {
      list = list.filter(
        (n) =>
          !n.id?.toLowerCase().includes('sos') &&
          !n.name?.toLowerCase().includes('sos') &&
          !n.id?.toLowerCase().includes('cctv')
      );
    }
    if (mobileCategoryFilter === 'classrooms') {
      list = list.filter(
        (n) =>
          n.category === 'Classroom' ||
          n.category === 'Auditorium' ||
          n.name?.toLowerCase().includes('classroom') ||
          n.name?.toLowerCase().includes('hall') ||
          n.name?.toLowerCase().includes('room')
      );
    } else if (mobileCategoryFilter === 'labs') {
      list = list.filter(
        (n) =>
          n.category === 'Laboratory' ||
          n.category === 'Academic' ||
          n.name?.toLowerCase().includes('lab')
      );
    } else if (mobileCategoryFilter === 'gates') {
      list = list.filter(
        (n) => n.category === 'Gate' || n.name?.toLowerCase().includes('gate')
      );
    } else if (mobileCategoryFilter === 'amenities') {
      list = list.filter(
        (n) =>
          n.category === 'Amenity' ||
          n.name?.toLowerCase().includes('canteen') ||
          n.name?.toLowerCase().includes('cafeteria') ||
          n.name?.toLowerCase().includes('parking')
      );
    }
    if (!mobileSearchQuery.trim()) {
      return list.slice(0, 30);
    }
    const q = mobileSearchQuery.toLowerCase();
    return list
      .filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.id?.toLowerCase().includes(q) ||
          ((n as any).building && (n as any).building.toLowerCase().includes(q)) ||
          ((n as any).category && (n as any).category.toLowerCase().includes(q))
      )
      .slice(0, 30);
  }, [nodes, isStudent, mobileCategoryFilter, mobileSearchQuery]);

  const handleSelectMobileNode = (node: any) => {
    if (mobileSearchField === 'start') {
      handleCurrentLocationSelect(node);
    } else {
      handleDestinationSelect(node);
    }
    if (node.map) {
      setSelectedMapId(node.map);
    }
    setIsMobileSearchOpen(false);
    setLocalMobileQuery('');
  };

  // Automatically reveal the navigation drawer and focus the Route tab on desktop when navigating
  useEffect(() => {
    if (isNavigating || destination) {
      if (!isMobile) {
        setSidebarOpen(true);
      }
      setActiveTab('route');
    }
  }, [isNavigating, destination, isMobile, setSidebarOpen]);

  // Ensure sidebar is closed on mobile view
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

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

  // MOBILE VIEW (< 768px) - Fullscreen map with dedicated Top Bar & Bottom Bar for navigation
  if (isMobile) {
    const activeStep = navigationSteps[activeStepIndex] || null;
    const currentInstruction = navigationDirections[0]?.instruction || 'Proceed toward destination along highlighted path';
    const currentDirection = navigationDirections[0]?.direction || 'straight';
    const currentDistance = navigationDirections[0]?.distance || '';

    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-50 dark:bg-[#070b14] select-none flex flex-col font-sans">
        {/* Top Proctor Dashboard Switcher if active */}
        {proctorMode && <ProctorDashboard />}

        {/* Full-Screen Map Canvas */}
        <div className="flex-1 relative w-full h-full z-0 pt-28 pb-20">
          {mapCanvas}
        </div>

        {/* ======================================================== */}
        {/* 1. MOBILE TOP NAVIGATION BAR */}
        {/* ======================================================== */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-md select-none transition-all">
          {/* Top Row: Navigation status / Brand & Action buttons */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 gap-2">
            {isNavigating ? (
              <button
                type="button"
                onClick={handleExitNavigation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-black text-xs active:scale-95 transition-all cursor-pointer"
                title="Stop Navigation"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Nav</span>
              </button>
            ) : destination ? (
              <button
                type="button"
                onClick={() => {
                  handleDestinationSelect(null as any);
                  handleCurrentLocationClear();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                title="Clear Destination"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            ) : (
              <div
                onClick={() => navigate(isStudent ? '/student' : '/')}
                className="flex items-center gap-2 cursor-pointer active:opacity-80"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    MITS MAP
                  </span>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    Campus Navigation
                  </span>
                </div>
              </div>
            )}

            {/* Quick Actions (Step-free accessibility, voice guidance, theme/SOS) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAccessibleOnly(!accessibleOnly)}
                className={`p-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                  accessibleOnly
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                }`}
                title={accessibleOnly ? 'Step-Free Active' : 'Enable Step-Free Paths'}
              >
                <Accessibility className="w-4 h-4" />
              </button>

              {isNavigating && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                    isVoiceEnabled
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                  }`}
                  title={isVoiceEnabled ? 'Voice Guidance Active' : 'Enable Voice Guidance'}
                >
                  {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}

              {header}
            </div>
          </div>

          {/* Middle Row: Active Turn-by-Turn Instruction OR 1-Tap Search Bar */}
          <div className="px-3 pb-1.5">
            {isNavigating ? (
              <div
                onClick={() => setIsMobileStepsOpen(true)}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] transition-all"
                title="Tap to view all navigation steps"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                    {renderGuidanceIcon(currentDirection)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-200 block truncate">
                      {activeStep ? `Stage ${activeStepIndex + 1}/${navigationSteps.length} • ${activeStep.map ? activeStep.map.replace('_', ' ') : 'Campus'}` : 'Navigating'}
                    </span>
                    <p className="text-xs font-black leading-tight truncate mt-0.5">
                      {currentInstruction}
                    </p>
                    {currentDistance && (
                      <span className="text-[10px] text-blue-100 font-bold block mt-0.5">
                        For {currentDistance}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMobileStepsOpen(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-mono text-[10px] font-black flex items-center gap-1 border border-white/20 shadow-xs cursor-pointer"
                    title="View All Steps"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Steps</span>
                  </button>
                  <div
                    className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/15"
                    title="Compass Direction"
                  >
                    <Compass
                      className="w-4.5 h-4.5 text-white transition-transform duration-300 ease-out"
                      style={{ transform: `rotate(${compassHeading}deg)` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileSearchField('destination');
                  setIsMobileSearchOpen(true);
                }}
                className="w-full h-10 px-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {destination ? `To: ${destination.name}` : 'Search Classrooms (101/102), Labs, Gates...'}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  {destination ? 'Route' : 'Search'}
                </span>
              </button>
            )}
          </div>

          {/* Bottom Row: Quick Horizontal Floor Selector Pills */}
          <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {CAMPUS_FLOORS.map((f) => {
              const isSelected = activeMapId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedMapId(f.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap backdrop-blur-xl transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400'
                      : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Conditional Dashboards for Mobile (Proctor / Security only) */}
        {proctorMode && activeDashboard === 'soc' && <CctvSocDashboard />}
        {proctorMode && activeDashboard === 'analytics' && <SafetyAnalyticsDashboard />}
        {proctorMode && activeDashboard === 'patrol' && <PatrolDispatchDashboard />}

        {/* ======================================================== */}
        {/* 2. MOBILE BOTTOM NAVIGATION BAR */}
        {/* ======================================================== */}
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] select-none transition-all pb-safe">
          {isNavigating ? (
            /* Mode 1: Active Turn-by-Turn Step Controls */
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={activeStepIndex <= 0}
                  onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev Step</span>
                </button>

                <div className="flex flex-col items-center px-2">
                  <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{routeDuration ? `${Math.ceil(routeDuration / 60)} min` : '~2 min'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    {routeDistance ? `${Math.round(routeDistance)} m` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={activeStepIndex >= Math.max(0, navigationSteps.length - 1)}
                  onClick={() => setActiveStepIndex(Math.min(navigationSteps.length - 1, activeStepIndex + 1))}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileStepsOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Footprints className="w-4 h-4" />
                  <span>View All Steps ({navigationDirections.length > 0 ? navigationDirections.length : navigationSteps.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleExitNavigation}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                  title="Finish / Exit Navigation"
                >
                  <X className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          ) : destination ? (
            /* Mode 2: Route Preview Card with Start CTA */
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/25">
                    <NavigationIcon className="w-5 h-5 fill-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {destination.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {destination.building || 'Campus'} • Floor {destination.floor ?? 0}
                      </span>
                      {routeDistance ? (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          • {Math.round(routeDistance)} m (~{Math.ceil((routeDuration || 60) / 60)} min)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleDestinationSelect(null as any);
                    handleCurrentLocationClear();
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                  title="Clear Destination"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileStepsOpen(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Footprints className="w-4 h-4" />
                  <span>View Steps ({navigationDirections.length > 0 ? navigationDirections.length : navigationSteps.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartNavigation}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <NavigationIcon className="w-4 h-4 fill-white" />
                  <span>Start Nav</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Mode 3: Idle Exploration 4-Tab Navigation Dock */
            <div className="grid grid-cols-4 px-2 py-1.5 gap-1">
              {/* 1. Search Destination */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchField('destination');
                  setIsMobileSearchOpen(true);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer active:scale-95"
              >
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold mt-1">Search</span>
              </button>

              {/* 2. My Location / GPS */}
              <button
                type="button"
                onClick={() => {
                  useGpsAsStartLocation();
                  if (activeMapId !== 'Campus_Map') {
                    setSelectedMapId('Campus_Map');
                  }
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                  isGpsActive ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LocateFixed className={`w-5 h-5 ${isGpsActive ? 'text-blue-600 dark:text-blue-400 animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold mt-1">Location</span>
              </button>

              {/* 3. Featured Campus Places */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchField('destination');
                  setIsMobileSearchOpen(true);
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer active:scale-95"
              >
                <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-bold mt-1">Places</span>
              </button>

              {/* 4. Full Campus View */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMapId('Campus_Map');
                }}
                className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer active:scale-95"
              >
                <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold mt-1">Campus</span>
              </button>
            </div>
          )}
        </footer>

        {/* ======================================================== */}
        {/* 3. MOBILE SEARCH & PLACES DRAWER MODAL */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="bg-white dark:bg-[#0A0F1D] rounded-t-3xl border-t border-slate-200 dark:border-white/10 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {mobileSearchField === 'start' ? 'Choose Starting Location' : 'Choose Destination'}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Search rooms, laboratories, gates, or amenities
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      setLocalMobileQuery('');
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Input Box */}
                <div className="p-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={mobileSearchQuery}
                      onChange={(e) => setLocalMobileQuery(e.target.value)}
                      placeholder="Type classroom (e.g. 101, 102), lab, gate..."
                      autoFocus
                      className="w-full h-11 pl-4 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {mobileSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLocalMobileQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
                    {[
                      { id: 'all', label: 'All Places' },
                      { id: 'classrooms', label: 'Classrooms' },
                      { id: 'labs', label: 'Labs' },
                      { id: 'amenities', label: 'Cafeteria & Amenities' },
                      { id: 'gates', label: 'Gates' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMobileCategoryFilter(cat.id as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap transition-all cursor-pointer ${
                          mobileCategoryFilter === cat.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {mobileFilteredNodes.length > 0 ? (
                    mobileFilteredNodes.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleSelectMobileNode(node)}
                        className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 hover:border-blue-500/50 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {node.name || node.id}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                              {(node as any).building || 'MITS Campus'} • Floor {(node as any).floor ?? 0}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {(node as any).category || 'Place'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs font-semibold text-slate-400">
                      No matching campus spots found
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* 4. MOBILE NAVIGATION STEPS MODAL SHEET                  */}
        {/* ======================================================== */}
        <AnimatePresence>
          {isMobileStepsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end pointer-events-auto"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="bg-white dark:bg-[#0A0F1D] rounded-t-3xl border-t border-slate-200 dark:border-white/10 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Grab handle & Sheet Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25">
                      <Footprints className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Turn-by-Turn Navigation Steps
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                        {routeDistance ? `${Math.round(routeDistance)} meters` : ''} • {routeDuration ? `~${Math.ceil(routeDuration / 60)} min walk` : '~2 min'} • {navigationSteps.length} Floor Segments
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileStepsOpen(false)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Multi-Map Floor Step Pills (if route spans multiple floors) */}
                {navigationSteps.length > 1 && (
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      Route Floor Stages:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {navigationSteps.map((step, idx) => {
                        const isActive = idx === activeStepIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveStepIndex(idx);
                              if (step.map && setSelectedMapId) {
                                setSelectedMapId(step.map);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                            }`}
                          >
                            <span>Step {idx + 1}:</span>
                            <span>{step.map ? step.map.replace('_', ' ') : `Floor ${step.step ?? 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Steps List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {navigationDirections && navigationDirections.length > 0 ? (
                    navigationDirections.map((dir, idx) => {
                      const isCurrent = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`pt-2.5 first:pt-0 flex items-start gap-3 transition-colors ${
                            isCurrent ? 'bg-blue-50/60 dark:bg-blue-950/20 p-2.5 rounded-2xl border border-blue-200/60 dark:border-blue-800/40' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {renderGuidanceIcon(dir.direction)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                {isCurrent ? '● Current Action' : `Step ${idx + 1}`}
                              </span>
                              {dir.distance && (
                                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                  {dir.distance}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                              {dir.instruction}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center">
                      <Footprints className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Proceed along the highlighted campus route
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Follow the directional arrows on the vector map to reach your destination.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-3 border-t border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setIsMobileStepsOpen(false)}
                    className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
                  >
                    <span>Back to Interactive Map</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
