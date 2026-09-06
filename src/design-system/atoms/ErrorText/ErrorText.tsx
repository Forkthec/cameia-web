/**
 * Mensaje de error bajo un campo. `role="alert"` para que un lector de
 * pantalla lo anuncie apenas aparece (p. ej. tras un submit fallido), y
 * recibe `id` para que el campo la enlace por `aria-describedby`.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ErrorTextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'className'> {
  className?: string;
  children: ReactNode;
}

export function ErrorText({ className, children, ...rest }: ErrorTextProps) {
  return (
    <p role="alert" className={cn('text-small text-danger-text', className)} {...rest}>
      {children}
    </p>
  );
}
