/** Etiqueta de un campo de formulario. Sin texto por defecto: `children` es obligatorio. */
import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface LabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'className'> {
  className?: string;
  children: ReactNode;
}

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label className={cn('text-small text-text-primary font-semibold', className)} {...rest}>
      {children}
    </label>
  );
}
