/**
 * Texto de ayuda bajo un campo. Recibe `id` para que el campo la enlace por
 * `aria-describedby` (esa asociación es responsabilidad del campo, no de esta
 * pieza) y así lectores de pantalla la anuncien al enfocar el control.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface HelperTextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'className'> {
  className?: string;
  children: ReactNode;
}

export function HelperText({ className, children, ...rest }: HelperTextProps) {
  return (
    <p className={cn('text-small text-text-muted', className)} {...rest}>
      {children}
    </p>
  );
}
