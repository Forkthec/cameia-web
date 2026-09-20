/**
 * Menú desplegable del usuario, disparado desde el avatar del navbar
 * (Figma `menu-usuario`, nodo `439:1243`; documentado en contexto en
 * `PRT-01.08`, nodo `228:6443` — "Usado en toda página autenticada").
 * `CM-194`, `CA-1.8.1`.
 *
 * Estructura fija, no `items[]` genérico: "Mi cuenta" · "Planes" · selector
 * de idioma (`languageSwitcher`, ya resuelto por quien compone) · divisor ·
 * "Cerrar sesión". El symbol maestro de Figma no define variantes ni
 * estados propios (confirmado con dos búsquedas independientes sobre la
 * página "02 · Componentes"), así que la forma es la del propio diseño, no
 * una API abierta.
 *
 * Patrón ARIA de menú de acciones, no de listbox (a diferencia de
 * `CountryCodeSelect`, que sí es una lista de selección): disparador
 * `aria-haspopup="menu"`, panel `role="menu"`, ítems `role="menuitem"`. La
 * fila de idioma es un widget con sus propios controles internos, no un
 * `menuitem` simple — se envuelve en `role="none"`, el escape hatch que el
 * propio WAI-ARIA Authoring Practices define para meter contenido no-
 * `menuitem` dentro de un `role="menu"`.
 *
 * Sin navegación por flechas ni "roving tabindex" del patrón completo de
 * menú de teclado — decisión consciente: el contenido ya mezcla acciones
 * simples con un widget interactivo, y ni el backlog ni el symbol de Figma
 * piden ese nivel de teclado. `Escape` (con retorno de foco al disparador),
 * clic/foco fuera y `Tab` normal ya cubren `CA-1.8.1`.
 *
 * Los ítems son `<button>` reales (no `<li>`): al hacer clic dentro del
 * panel, el foco se mueve a ese botón antes de que el manejador de blur del
 * contenedor se dispare, así que `onClick` normal alcanza — a diferencia de
 * `CountryCodeSelect`, que sí necesita `onMouseDown` porque sus opciones son
 * `<li>` no enfocables.
 *
 * Icono `log-out` en "Cerrar sesión": desviación consciente de Figma (el
 * nodo real, `439:1241`, no dibuja icono ahí) — mismo criterio que otras
 * diferencias documentadas de la feature (`CLAUDE.md` §16).
 *
 * Sin `useTranslation` ni import de dominio (`CLAUDE.md` §3.5/§14.7): todo
 * texto y callback entra ya resuelto por props. Tampoco importa `@/hooks/*`:
 * `design-system` no tiene permiso hacia `hooks` en `boundaries/dependencies`
 * (mismo motivo que documenta `utils/focusTrap.ts`), así que el estado de
 * apertura es un `useState` de React normal, igual que `CountryCodeSelect`.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Avatar } from '../../atoms/Avatar';
import { Icon } from '../../icons/Icon';

interface MenuUsuarioAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface MenuUsuarioProps {
  avatarSrc?: string;
  avatarAlt: string;
  avatarFallback: string;
  /** Nombre accesible del disparador, ej. "Menú de usuario". */
  triggerLabel: string;
  /** Nombre accesible del panel (`role="menu"`). */
  menuLabel: string;
  miCuenta: MenuUsuarioAction;
  planes: MenuUsuarioAction;
  /** `<LanguageSwitcher context="menu-row" .../>` ya resuelto por quien compone. */
  languageSwitcher: ReactNode;
  cerrarSesion: MenuUsuarioAction;
  className?: string;
}

export function MenuUsuario({
  avatarSrc,
  avatarAlt,
  avatarFallback,
  triggerLabel,
  menuLabel,
  miCuenta,
  planes,
  languageSwitcher,
  cerrarSesion,
  className,
}: MenuUsuarioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  function close() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleActionClick(action: MenuUsuarioAction) {
    close();
    action.onClick();
  }

  return (
    <div
      className={cn('relative', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={triggerLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="gap-space-1 focus-visible:shadow-focus-ring flex cursor-pointer items-center rounded-full focus-visible:outline-none"
      >
        <Avatar src={avatarSrc} alt={avatarAlt} fallback={avatarFallback} size={36} />
        <Icon name="chevron-down" size={16} className="text-text-muted" />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          className="bg-bg-surface shadow-elevation-2 py-space-2 absolute top-full right-0 z-10 mt-2 flex w-60 flex-col rounded-lg"
        >
          <MenuUsuarioItem action={miCuenta} onSelect={handleActionClick} />
          <MenuUsuarioItem action={planes} onSelect={handleActionClick} />
          <div role="none" className="px-space-2">
            {languageSwitcher}
          </div>
          <div
            role="separator"
            aria-hidden="true"
            className="bg-border-subtle my-space-1 h-px w-full"
          />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleActionClick(cerrarSesion)}
            className="gap-space-2 px-space-4 py-space-3 text-body text-danger-text hover:bg-bg-surface-sunken flex cursor-pointer items-center text-left"
          >
            <Icon name="log-out" size={20} />
            {cerrarSesion.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface MenuUsuarioItemProps {
  action: MenuUsuarioAction;
  onSelect: (action: MenuUsuarioAction) => void;
}

function MenuUsuarioItem({ action, onSelect }: MenuUsuarioItemProps) {
  if (action.disabled) {
    return (
      <span
        role="menuitem"
        aria-disabled="true"
        className="px-space-4 py-space-3 text-body text-text-disabled cursor-not-allowed"
      >
        {action.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(action)}
      className="px-space-4 py-space-3 text-body text-text-primary hover:bg-bg-surface-sunken cursor-pointer text-left"
    >
      {action.label}
    </button>
  );
}
