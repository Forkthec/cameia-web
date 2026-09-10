/**
 * Barra de navegación inferior para móvil (la usa `layouts/AppShell`). Mismo
 * contrato `NavItem` que NavHeader; ambas alternan por breakpoint con clases
 * de Tailwind (`md:hidden` / `md:flex` en NavHeader), no con `useMediaQuery`
 * — `design-system` no puede importar `hooks` (docs/ARCHITECTURE.md §4).
 */
import { NavLink } from 'react-router';
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';
import type { NavItem } from '../NavHeader';

interface TabBarProps {
  items: NavItem[];
  /** Nombre accesible de la barra, p. ej. "Navegación principal". */
  label: string;
  className?: string;
}

const itemBaseClass = 'gap-space-1 flex flex-1 flex-col items-center text-small font-semibold';

export function TabBar({ items, label, className }: TabBarProps) {
  return (
    <nav
      aria-label={label}
      // padding-bottom suma el espacio base del token y el safe-area del
      // notch/home indicator del dispositivo: Tailwind no tiene una utilidad
      // que combine ambos, así que se calcula en un estilo en línea.
      style={{ paddingBottom: 'calc(var(--space-2) + env(safe-area-inset-bottom))' }}
      className={cn(
        'border-border-subtle bg-bg-surface px-space-2 pt-space-2 fixed inset-x-0 bottom-0 flex border-t md:hidden',
        className,
      )}
    >
      {items.map((item) =>
        item.disabled || !item.to ? (
          <span
            key={item.label}
            aria-disabled="true"
            className={cn(itemBaseClass, 'text-text-disabled')}
          >
            <Icon name={item.icon} size={22} />
            {item.label}
          </span>
        ) : (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(itemBaseClass, isActive ? 'text-brand-base' : 'text-text-muted')
            }
          >
            <Icon name={item.icon} size={22} />
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
