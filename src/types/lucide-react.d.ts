// src/types/lucide-react.d.ts
import 'lucide-react';
import type { SVGProps, CSSProperties } from 'react';

declare module 'lucide-react' {
  export interface LucideProps extends Partial<SVGProps<SVGSVGElement>> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
    style?: CSSProperties;
  }
}
