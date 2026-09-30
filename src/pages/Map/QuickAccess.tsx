// src/pages/Map/QuickAccess.tsx
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';


interface QuickAccessProps {
  isNavigating: boolean;
  onDestinationSelect: (location: any) => void;
}

export default function QuickAccess({ isNavigating, onDestinationSelect }: QuickAccessProps) {
  if (isNavigating) return null;

  const quickLocations = [
    { id: 'room_J101', name: 'Colloquium', map: 'Main_FF', x: 341.3025, y: 489.9517, building: 'Main', floor: 1, category: 'Academic' },
    { id: 'room_J001', name: 'Conclave', map: 'Main_GF', x: 406.8033, y: 487.5583, building: 'Main', floor: 0, category: 'Academic' },
    { id: 'room_J102', name: 'SH-7', map: 'Main_FF', x: 156.9493, y: 469.9952, building: 'Main', floor: 1, category: 'Academic' },
    { id: 'Jubilee_Gate', name: 'Jubilee Gate', map: 'Campus_Map', x: 749.9669, y: 127.5277, building: 'Campus', floor: 0, category: 'Gate' }
  ];

  const handleLocationClick = (location: any) => {
    onDestinationSelect(location);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Popular Destinations</h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Quick Access</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {quickLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => handleLocationClick(location)}
            className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500 hover:bg-blue-50/40 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {location.floor === 0 ? 'GF' : `F${location.floor}`}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
              {location.name}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {location.map.replace('_', ' ')}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
