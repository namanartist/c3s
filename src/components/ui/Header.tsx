// src/components/ui/Header.tsx
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import c3sLogo from '@/assets/c3s_logo.png';
import clgLogo from '@/assets/clg_logo.webp';

interface HeaderProps {
  onOpenDeveloperPage: () => void;
}

export default function Header({ onOpenDeveloperPage }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img src={clgLogo} alt="College Logo" className="h-12 w-auto" decoding="async" />
            <span className="text-gray-400 text-xl font-light">×</span>
            <img src={c3sLogo} alt="C3S Logo" className="h-12 w-auto object-contain" decoding="async" />
          </div>

          {/* Developer & Feedback Button */}
          <Button
            variant="ghost"
            onClick={() => { if (onOpenDeveloperPage) onOpenDeveloperPage(); navigate('/developers'); }}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-4"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Developer & Feedback</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
