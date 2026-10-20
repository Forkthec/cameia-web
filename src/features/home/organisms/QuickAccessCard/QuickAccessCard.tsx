/**
 * Acceso del Tablero de inicio provisional (HU-10.4): un enlace grande con
 * ícono y nombre («Nueva entrevista», «Mi Perfil Profesional»).
 *
 * Organismo de la feature (ADR-0001): solo lo usa el tablero. Usa los mismos
 * tokens y el mismo gesto que las tarjetas seleccionables del design system
 * (recuadro de ícono, borde que se acentúa y elevación al pasar el cursor) y
 * supera el área táctil mínima (CLAUDE.md §10).
 *
 * `emphasis="primary"` marca la acción principal (recuadro mostaza y borde
 * cálido); `secondary`, el resto (recuadro índigo). En escritorio la tarjeta
 * es una «puerta» alta con el ícono arriba; en móvil, una fila compacta.
 * Solo cambia la presentación: destino y nombre son los del backlog.
 */
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

interface QuickAccessCardProps {
  /** Ruta de destino. */
  to: string;
  /** Ícono decorativo del acceso. */
  icon: IconName;
  /** Nombre del acceso, ya traducido. */
  title: string;
  /** Jerarquía visual del acceso. */
  emphasis?: 'primary' | 'secondary';
  /** Retardo de la entrada escalonada, en milisegundos. */
  enterDelayMs?: number;
}

export function QuickAccessCard({
  to,
  icon,
  title,
  emphasis = 'secondary',
  enterDelayMs = 0,
}: QuickAccessCardProps) {
  const isPrimary = emphasis === 'primary';
  const style: CSSProperties = { animationDelay: `${enterDelayMs}ms` };

  return (
    <Link
      to={to}
      style={style}
      className={cn(
        'group/access animate-enter-up bg-bg-surface gap-space-4 p-space-4 lg:gap-space-7 lg:p-space-6 flex min-h-[5.25rem] items-center rounded-lg border-[1.5px] transition-[border-color,box-shadow,translate] duration-[var(--duration-smooth)] ease-[var(--token-ease-out)] lg:min-h-[12.5rem] lg:flex-col lg:items-stretch lg:justify-between',
        'hover:border-brand-muted hover:shadow-elevation-1 focus-visible:shadow-focus-ring hover:-translate-y-1 focus-visible:outline-none',
        isPrimary
          ? 'border-brand-accent from-brand-soft to-bg-surface bg-linear-to-b to-60%'
          : 'border-border-strong',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-[3.25rem] shrink-0 place-items-center rounded-md transition-[background-color,color,rotate] duration-[var(--duration-smooth)] group-hover/access:-rotate-6 lg:size-16',
          isPrimary
            ? 'bg-brand-accent text-action-on-primary'
            : 'bg-brand-tint text-brand-base group-hover/access:bg-brand-accent group-hover/access:text-action-on-primary',
        )}
      >
        <Icon name={icon} size={28} />
      </span>
      <span className="gap-space-4 flex flex-1 items-center justify-between lg:flex-none">
        <span className="text-h3 lg:text-h2 font-display text-brand-deep">{title}</span>
        <span
          aria-hidden="true"
          className="border-border-subtle text-brand-base group-hover/access:bg-brand-tint grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] transition-[translate,background-color] duration-[var(--duration-smooth)] group-hover/access:translate-x-1"
        >
          <Icon name="arrow-right" size={20} />
        </span>
      </span>
    </Link>
  );
}
