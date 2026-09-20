/**
 * Primer `BottomSheet` del design system (`CM-194`, Cerrar sesión,
 * `CA-1.8.1`): versión móvil de una confirmación, fiel a Figma (`bottom-sheet`,
 * nodo `41:248`; variante `type=destructive` inspeccionada en `41:224` — las
 * variantes `confirm`/`upgrade` no se construyen, sin consumidor todavía,
 * mismo criterio que `Modal` con `type=confirm` en `CM-34`). Descripción del
 * propio componente en Figma: "Versión móvil obligatoria de modal (nunca un
 * modal centrado en móvil)."
 *
 * Diferencias deliberadas frente a `Modal` (misma familia, no la misma
 * forma): Figma no dibuja un botón de cierre (`X`) en la esquina — solo la
 * agarradera decorativa arriba, el velo y el botón "Cancelar" cierran —, así
 * que no hay `closeLabel` ni botón de cierre propio; los botones van
 * apilados de ancho completo con el primario arriba (Figma: "Botones
 * apilados ancho completo, primario arriba"), no en fila a la derecha; y
 * `secondaryActionLabel`/`onSecondaryAction` son obligatorios (Figma no
 * modela una variante de un solo botón). El botón secundario usa
 * `text-brand-base` sobre `Button` `variant="secondary"` — mismo override
 * puntual que ya documenta `HeaderPublico.tsx` para "Iniciar sesión": el
 * secundario por defecto pinta `text-primary`, pero Figma usa `brand/base`
 * aquí también (confirmado contra el nodo real, no inventado).
 *
 * **No implementa "cerrar arrastrando hacia abajo"** (gesto táctil que sí
 * describe Figma): fuera de alcance de `CA-1.8.1` — el velo, `Escape` y el
 * botón "Cancelar" ya cubren el cierre sin necesidad de reconocer gestos de
 * arrastre, que además no tiene sentido con teclado/lector de pantalla.
 * Decisión de Frontend, documentada aquí igual que otras diferencias
 * conscientes de la feature (`CLAUDE.md` §16).
 *
 * Foco atrapado + Escape + retorno de foco: mismo criterio y misma utilidad
 * compartida (`utils/focusTrap.ts`) que `Modal.tsx` — ver su TSDoc para el
 * porqué de que esa lógica viva en `utils/` y no en un hook.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7): todo texto visible entra por prop
 * obligatoria.
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

type BottomSheetBaseProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel: string;
  onSecondaryAction: () => void;
  /** Estilo de la acción primaria. Solo `'destructive'` tiene consumidor real hoy. */
  variant?: 'primary' | 'destructive';
  className?: string;
};

type BottomSheetProps = BottomSheetBaseProps &
  (
    | { primaryActionLoading?: false; primaryActionLoadingLabel?: never }
    | { primaryActionLoading: true; primaryActionLoadingLabel: string }
  );

export function BottomSheet({
  title,
  children,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'primary',
  primaryActionLoading = false,
  primaryActionLoadingLabel,
  className,
}: BottomSheetProps) {
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
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        // Mismo criterio que el velo de `Modal.tsx`: `<button>` por jsx-a11y,
        // fuera del orden de tabulación y oculto a lectores de pantalla
        // (Esc ya cierra por teclado).
        className="bg-bg-inverse/45 absolute inset-0 cursor-default"
      />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mismo criterio que `Modal.tsx`: `role="dialog"` no cuenta como interactivo para el plugin, pero atrapar `Tab` aquí es el patrón estándar de WAI-ARIA APG para diálogos modales (CLAUDE.md §10). */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        style={{ paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}
        className={cn(
          'bg-bg-surface shadow-elevation-3 gap-space-4 fixed inset-x-0 bottom-0 flex flex-col items-center rounded-t-[26px] px-[20px] pt-[14px] focus:outline-none',
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="bg-border-strong h-[4px] w-[36px] shrink-0 rounded-full"
        />

        <div className="gap-space-3 flex w-full flex-col items-start">
          <h2 id={titleId} className="text-h2 font-display text-text-primary w-full">
            {title}
          </h2>
          <div className="text-body text-text-primary w-full">{children}</div>
        </div>

        <div className="gap-space-2 flex w-full flex-col items-stretch">
          <Button
            variant={variant}
            onClick={onPrimaryAction}
            {...buttonLoadingProps(primaryActionLoading, primaryActionLoadingLabel ?? '')}
          >
            {primaryActionLabel}
          </Button>
          <Button variant="secondary" className="text-brand-base" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
