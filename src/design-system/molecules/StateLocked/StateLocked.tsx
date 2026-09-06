/**
 * Envuelve una funcionalidad fuera de alcance con una insignia "Próximamente"
 * (CLAUDE.md §12: AUDIO y autocompletar con IA se muestran deshabilitados, no
 * ocultos). No oculta `children` de lectores de pantalla ni le quita eventos:
 * quien la usa ya le pasa una versión disabled del control envuelto.
 */
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';
import { Pill } from '../../atoms/Pill';

interface StateLockedProps {
  /** Texto de la insignia (p. ej. "Próximamente"). Sin texto por defecto. */
  label: string;
  children: ReactNode;
  className?: string;
}

export function StateLocked({ label, children, className }: StateLockedProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      <Pill className="right-space-2 top-space-2 gap-space-1 absolute">
        <Icon name="lock" size={12} />
        <span>{label}</span>
      </Pill>
    </div>
  );
}
