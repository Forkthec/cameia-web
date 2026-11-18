/**
 * Botón «?» que abre un texto de ayuda junto a un dato (CA-6.4.7, reporte de evaluación; sin
 * dominio: sirve para cualquier explicación corta). Se abre con clic, toque o teclado (Tab y
 * Enter) y, con un puntero fino, también al pasar el cursor; se cierra con Esc, al tocar fuera
 * o al pulsarlo de nuevo.
 *
 * Es controlado (`open` / `onOpenChange`) para que quien lo usa mantenga **un solo texto abierto
 * a la vez** entre varios `HelpTip`. El botón se ve de 28 px pero su área táctil es de 44×44
 * (CLAUDE.md §10), con un pseudo-elemento que no mueve el diseño. Sin texto propio (§14.7).
 */
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface HelpTipProps {
  /** Nombre accesible del botón (p. ej. «Qué mide Precisión y Claridad»). */
  label: string;
  /** Texto de ayuda, ya traducido. */
  children: ReactNode;
  /** Si el texto está abierto. */
  open: boolean;
  /** Pide abrir o cerrar. */
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function HelpTip({ label, children, open, onOpenChange, className }: HelpTipProps) {
  const panelId = useId();
  const root = useRef<HTMLSpanElement>(null);
  // Abierto al pasar el cursor: el clic que sigue lo deja abierto en vez de cerrarlo.
  const openedByHover = useRef(false);
  const panel = useRef<HTMLSpanElement>(null);

  // El texto se centra bajo el botón, pero junto a un borde de la pantalla se correría hacia
  // afuera: se mide al abrir y se desplaza lo justo para quedar dentro, con 8 px de margen.
  useLayoutEffect(() => {
    const node = panel.current;
    if (!open || !node) return;
    node.style.marginLeft = '0px';
    const rect = node.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) shift = margin - rect.left;
    else if (rect.right > window.innerWidth - margin)
      shift = window.innerWidth - margin - rect.right;
    node.style.marginLeft = `${shift}px`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }
    function onPointer(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) onOpenChange(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, onOpenChange]);

  return (
    <span ref={root} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          onOpenChange(!open);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && !open) {
            openedByHover.current = true;
            onOpenChange(true);
          }
        }}
        className={cn(
          'text-small relative inline-flex size-7 items-center justify-center rounded-full border font-bold',
          'border-border-strong bg-bg-surface text-brand-base hover:bg-brand-tint',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          "before:absolute before:-inset-2 before:content-['']",
          open && 'bg-brand-tint border-brand-base',
        )}
      >
        ?
      </button>
      {open ? (
        <span
          ref={panel}
          id={panelId}
          role="note"
          className={cn(
            'mt-space-2 p-space-4 absolute top-full left-1/2 z-20 w-[min(22rem,80vw)] -translate-x-1/2',
            'bg-bg-inverse text-text-on-inverse text-small shadow-elevation-3 rounded-xl text-left leading-relaxed font-normal',
          )}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
