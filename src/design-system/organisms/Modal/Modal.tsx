/**
 * Primer `Modal` del design system (CM-34, `SPEC.md` de `features/auth` §3).
 * Especificación exacta de Figma para la variante `type=confirm` (nodo
 * `41:211`/`41:181`): 480px fijo centrado, `radius/lg`, `padding space-5`,
 * `elevation/3`, velo `neutral-900` al 45%, botones alineados a la derecha
 * (el primario al final), cierra con Esc o clic en el velo.
 *
 * `variant`/`primaryActionLoading` se agregan en `CM-194` (Cerrar sesión,
 * `CA-1.8.1`): la confirmación de logout necesita el botón primario en rojo
 * (`Button` `variant="destructive"`, ya existente) y en `loading` mientras
 * `signOut()` está en curso — ninguno de los dos casos existía en el primer
 * consumidor (`RegisterPage`, siempre `variant="primary"` sin `loading`),
 * que sigue funcionando igual por los valores por defecto.
 *
 * Foco atrapado + retorno de foco (también `CM-194`): la `SPEC.md` pedía
 * "el mismo criterio de accesibilidad que `Modal`" para el nuevo
 * `BottomSheet`, dando por hecho que `Modal` ya atrapaba el foco — no era
 * cierto (solo cerraba con Esc/velo). Se agrega aquí, de forma aditiva
 * (`CLAUDE.md` §10: el foco nunca se escapa de un diálogo abierto), y
 * `BottomSheet` reutiliza la misma lógica de `utils/focusTrap.ts`.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que el resto del
 * design system): todo texto visible entra por prop obligatoria.
 */
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { buttonLoadingProps } from '@/utils/buttonLoadingProps';
import { handleFocusTrapKeyDown } from '@/utils/focusTrap';
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';
import { Icon } from '../../icons/Icon';

type ModalBaseProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Nombre accesible del botón de cierre (la `X` de la esquina). */
  closeLabel: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Estilo de la acción primaria. `'destructive'` la pinta con `Button` `variant="destructive"` (CM-194). */
  variant?: 'primary' | 'destructive';
  className?: string;
};

type ModalProps = ModalBaseProps &
  (
    | { primaryActionLoading?: false; primaryActionLoadingLabel?: never }
    // Con primaryActionLoading=true, el gerundio es obligatorio — mismo
    // criterio que `Button.loading`/`loadingLabel`.
    | { primaryActionLoading: true; primaryActionLoadingLabel: string }
  );

export function Modal({
  title,
  children,
  onClose,
  closeLabel,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'primary',
  primaryActionLoading = false,
  primaryActionLoadingLabel,
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (dialogRef.current) handleFocusTrapKeyDown(event.nativeEvent, dialogRef.current);
  }

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
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- `role="dialog"` no cuenta como interactivo para el plugin, pero atrapar `Tab` aquí es el patrón estándar de WAI-ARIA APG para diálogos modales (CLAUDE.md §10). */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className={cn(
          'bg-bg-surface p-space-5 shadow-elevation-3 gap-space-4 relative flex w-120 flex-col rounded-lg focus:outline-none',
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
          <Button
            variant={variant}
            onClick={onPrimaryAction}
            {...buttonLoadingProps(primaryActionLoading, primaryActionLoadingLabel ?? '')}
          >
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
