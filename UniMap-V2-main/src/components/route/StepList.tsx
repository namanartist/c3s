// src/components/route/StepList.tsx
import type { RouteStep } from '@/types';
import { formatDistance } from '@/lib/routeBuilder';
import {
  ArrowUp,
  ArrowDown,
  Footprints,
  ArrowUpDown,
  TrendingUp,
  Sun,
  DoorOpen,
  MapPin,
  Eye,
  ArrowRight
} from 'lucide-react';

export interface StepListProps {
  steps: RouteStep[];
}

export default function StepList({ steps }: StepListProps) {
  const getIcon = (instruction: string) => {
    const instLower = instruction.toLowerCase();
    if (instLower.includes('stairs up')) return ArrowUp;
    if (instLower.includes('stairs down')) return ArrowDown;
    if (instLower.includes('stairs')) return Footprints;
    if (instLower.includes('lift')) return ArrowUpDown;
    if (instLower.includes('ramp')) return TrendingUp;
    if (instLower.includes('outside')) return Sun;
    if (instLower.includes('exit')) return DoorOpen;
    if (instLower.includes('arrive')) return MapPin;
    if (instLower.includes('pass')) return Eye;
    return ArrowRight;
  };

  return (
    <div className="flex flex-col">
      {steps.map((step, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === steps.length - 1;
        const Icon = getIcon(step.instruction);
        const formattedDist = formatDistance(step.distanceFromPrev);

        // Styling classes
        let instructionClass = 'text-sm text-[var(--text-primary)] leading-snug';
        if (isFirst || isLast) {
          instructionClass += ' font-medium'; // font-weight 500
        }
        if (isLast) {
          instructionClass += ' text-[var(--accent)]';
        }

        let iconContainerClass = 'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0';
        if (isLast) {
          iconContainerClass += ' bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)]';
        } else {
          iconContainerClass += ' bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]';
        }

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 py-3 px-0 ${
              isLast ? '' : 'border-b border-[var(--border)]'
            }`}
          >
            <div className={iconContainerClass}>
              <Icon className="w-4 h-4" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={instructionClass}>
                {step.instruction}
              </p>
              {(formattedDist || isLast || !isFirst) && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5" style={{ fontSize: '12px' }}>
                  {formattedDist ? `${formattedDist} · ` : ''}Step {idx + 1} of {steps.length}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
