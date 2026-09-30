// src/components/ui/Button.tsx
import { forwardRef, memo } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/** A standard primitive button supporting primary, secondary, and ghost styling variants. */
const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
      const baseStyle =
        'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

      const variants = {
        primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
        secondary:
          'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)]',
        ghost:
          'bg-transparent text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent-light)]',
      };

      const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
      };

      const combinedClass = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

      return (
        <button ref={ref} className={combinedClass} {...props}>
          {children}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export default Button;

