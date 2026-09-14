/**
 * Barra de navegación horizontal para escritorio (la usa `layouts/AppShell`).
 * Puramente presentacional: boundaries no deja que `design-system` importe
 * `hooks` ni `stores` (docs/ARCHITECTURE.md §4), así que quien resuelve
 * `items` — etiqueta ya traducida, ruta activa, deshabilitado por feature
 * flag — es AppShell, no este componente.
 */
import { NavLink } from 'react-router';
import { cn } from '@/utils/cn';
import { Icon, type IconName } from '../../icons/Icon';

export interface NavItem {
  /** Ruta de destino. Se omite en un ítem deshabilitado sin pantalla todavía. */
  to?: string;
  /** Etiqueta ya traducida (este componente no llama a `t()`, igual que Button o EmptyState). */
  label: string;
  icon: IconName;
  disabled?: boolean;
}

interface NavHeaderProps {
  items: NavItem[];
  /** Nombre accesible de la barra, p. ej. "Navegación principal". */
  label: string;
  className?: string;
}

const itemBaseClass =
  'gap-space-2 px-space-4 py-space-2 text-body inline-flex items-center rounded-full font-semibold transition-colors';

export function NavHeader({ items, label, className }: NavHeaderProps) {
  return (
    <nav aria-label={label} className={cn('gap-space-2 hidden items-center md:flex', className)}>
      {items.map((item) =>
        item.disabled || !item.to ? (
          <span
            key={item.label}
            aria-disabled="true"
            className={cn(itemBaseClass, 'text-text-disabled cursor-not-allowed')}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </span>
        ) : (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                itemBaseClass,
                isActive
                  ? 'bg-brand-tint text-brand-base'
                  : 'text-text-primary hover:bg-bg-surface-sunken',
              )
            }
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </NavLink>
        ),
      )}
    </nav>
  );
}
