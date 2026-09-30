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
      <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Quick Access</h3>
      <div className="grid grid-cols-2 gap-3">
        {quickLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => handleLocationClick(location)}
            className="p-3.5 rounded-xl border border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all text-left group"
          >
            <MapPin className="w-4.5 h-4.5 text-[#ff602e] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-gray-900 leading-tight">{location.name}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">{location.map.replace('_', ' ')}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
