/**
 * Primer `Modal` del design system (CM-34, `SPEC.md` de `features/auth` §3).
 * Especificación exacta de Figma para la variante `type=confirm` (nodo
 * `41:211`/`41:181`): 480px fijo centrado, `radius/lg`, `padding space-5`,
 * `elevation/3`, velo `neutral-900` al 45%, botones alineados a la derecha
 * (el primario al final), cierra con Esc o clic en el velo.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que el resto del
 * design system): todo texto visible entra por prop obligatoria.
 */
import { useEffect, useId, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';
import { Icon } from '../../icons/Icon';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Nombre accesible del botón de cierre (la `X` de la esquina). */
  closeLabel: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function Modal({
  title,
  children,
  onClose,
  closeLabel,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        // `<button>`, no un `<div onClick>`: jsx-a11y exige un elemento
        // nativamente interactivo para un manejador de clic (§14, no se
        // desactiva la regla). `tabIndex={-1}`/`aria-hidden`: Esc ya cierra
        // por teclado, este velo es solo una conveniencia de mouse — no debe
        // aparecer en la navegación por tabulador ni anunciarse a un lector
        // de pantalla.
        // CLAUDE.md §3.1: ningún color literal — `bg-bg-inverse` ya es
        // `--neutral-900` (semantic.css), el mismo velo que exige Figma, solo
        // que por su token semántico, no por el primitivo directo.
        className="bg-bg-inverse/45 absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'bg-bg-surface p-space-5 shadow-elevation-3 gap-space-4 relative flex w-120 flex-col rounded-lg',
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <h2 id={titleId} className="text-h2 font-display text-text-primary">
            {title}
          </h2>
          <Button
            variant="icon"
            size="sm"
            className="shrink-0"
            onClick={onClose}
            icon={<Icon name="close" />}
          >
            {closeLabel}
          </Button>
        </div>

        <div className="text-body text-text-primary">{children}</div>

        <div className="gap-space-3 flex justify-end">
          {secondaryActionLabel && onSecondaryAction ? (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          <Button variant="primary" onClick={onPrimaryAction}>
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
