/**
 * Acceso del Tablero de inicio provisional (HU-10.4): un enlace grande con
 * ícono y nombre («Nueva entrevista», «Mi Perfil Profesional»).
 *
 * Organismo de la feature (ADR-0001): solo lo usa el tablero. Usa los mismos
 * tokens y el mismo gesto que las tarjetas seleccionables del design system
 * (recuadro de ícono en `brand-tint`, borde que se acentúa y elevación al
 * pasar el cursor) y supera el área táctil mínima (CLAUDE.md §10).
 */
import { Link } from 'react-router';
import { Icon, type IconName } from '@/design-system/icons/Icon';

interface QuickAccessCardProps {
  /** Ruta de destino. */
  to: string;
  /** Ícono decorativo del acceso. */
  icon: IconName;
  /** Nombre del acceso, ya traducido. */
  title: string;
}

export function QuickAccessCard({ to, icon, title }: QuickAccessCardProps) {
  return (
    <Link
      to={to}
      className="group/access border-border-strong bg-bg-surface gap-space-4 p-space-5 hover:border-brand-muted hover:shadow-elevation-1 focus-visible:shadow-focus-ring flex min-h-[4.5rem] items-center rounded-lg border-[1.5px] transition-[border-color,box-shadow,translate] duration-[var(--duration-smooth)] ease-[var(--token-ease-out)] hover:-translate-y-px focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="bg-brand-tint text-brand-base group-hover/access:bg-brand-accent group-hover/access:text-action-on-primary grid size-12 shrink-0 place-items-center rounded-md transition-colors duration-[var(--duration-smooth)]"
      >
        <Icon name={icon} size={24} />
      </span>
      <span className="text-h3 text-text-primary flex-1 font-semibold">{title}</span>
      <Icon
        name="arrow-right"
        size={20}
        className="text-brand-base transition-[translate] duration-[var(--duration-smooth)] group-hover/access:translate-x-1"
      />
    </Link>
  );
}
