/**
 * Tarjeta informativa no interactiva de la Landing pública (CM-186), usada
 * para los 3 "módulos" (`SPEC.md` §3.1/§3.2). No reutiliza `CardSelectable` a
 * propósito: su semántica (`role="radio"`, `aria-checked`) es de selección
 * excluyente y no le corresponde a contenido puramente informativo —
 * imponerla sería un defecto de accesibilidad, no un detalle cosmético
 * (`SPEC.md` §9). Por eso tampoco lleva ningún `role` interactivo ni
 * `onClick`.
 *
 * **«Amanecer» (CM-329, §3.7).** Lleva su número de orden, un tile de ícono
 * en `brand-tint` y una respuesta al hover puramente visual: sube 6 px, se
 * dibuja una línea mostaza arriba, el tile pasa a mostaza y el número toma
 * color. Es deliberadamente sutil: la tarjeta no es un enlace y no debe
 * parecerlo. Entra escalonada con `entranceDelayMs` cuando su sección se ve.
 */
import { cloneElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';

interface FeatureCardProps {
  /** Ícono a 28px (se fuerza el tamaño). */
  icon: ReactElement<{ size?: number; className?: string }>;
  title: string;
  description: string;
  /** Número de orden de la tarjeta dentro de su grupo (1, 2, 3). Se muestra con dos dígitos. */
  index?: number;
  /** Si su sección ya entró en pantalla. Sin este dato la tarjeta se muestra sin animación. */
  inView?: boolean;
  /** Retraso de la entrada, para escalonar varias tarjetas. */
  entranceDelayMs?: number;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  index,
  inView = true,
  entranceDelayMs = 0,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        // En `md` (tablet) la tarjeta va en horizontal: apiladas a todo el
        // ancho, en vertical dejaban mucho aire vacío a la derecha.
        'group/card border-border-subtle bg-bg-surface gap-space-3 p-space-6 md:gap-space-5 lg:gap-space-3 relative flex flex-col items-start overflow-hidden rounded-lg border md:flex-row lg:flex-col',
        'transition-[translate,box-shadow,border-color] duration-[var(--duration-deliberate)] ease-[var(--token-ease-expo)]',
        'hover:shadow-elevation-2 hover:border-brand-soft hover:-translate-y-1.5',
        'before:bg-brand-accent before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:origin-left before:scale-x-0 before:transition-[scale] before:duration-[var(--duration-deliberate)] hover:before:scale-x-100',
        inView ? 'animate-enter-up' : 'opacity-0',
        className,
      )}
      style={{ animationDelay: `${entranceDelayMs}ms` }}
    >
      {index ? (
        <span
          aria-hidden="true"
          className="text-small text-border-strong group-hover/card:text-brand-accent-strong right-space-5 top-space-5 absolute font-bold tracking-[0.08em] transition-colors"
        >
          {String(index).padStart(2, '0')}
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className="bg-brand-tint text-brand-base group-hover/card:bg-brand-accent group-hover/card:text-action-on-primary mb-space-2 lg:mb-space-2 grid size-14 shrink-0 place-items-center rounded-md transition-[background-color,color,rotate] duration-[var(--duration-deliberate)] group-hover/card:-rotate-6 md:mb-0"
      >
        {cloneElement(icon, { size: 28 })}
      </span>
      <span className="gap-space-3 md:pr-space-6 flex flex-col lg:pr-0">
        <span className="text-h3 font-body text-text-primary">{title}</span>
        <span className="text-body text-text-muted">{description}</span>
      </span>
    </div>
  );
}
