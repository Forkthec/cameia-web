/**
 * Tarjeta informativa no interactiva de la Landing pública (CM-186), usada 5
 * veces: 3 "módulos" + 2 "Entreno/Simulación" (`SPEC.md` §3.1/§3.2). No
 * reutiliza `CardSelectable` a propósito: su semántica (`role="radio"`,
 * `aria-checked`) es de selección excluyente y no le corresponde a contenido
 * puramente informativo — imponerla sería un defecto de accesibilidad, no un
 * detalle cosmético (`SPEC.md` §9). Por eso tampoco lleva ningún `role`
 * interactivo ni `onClick`: si en el futuro una tarjeta se vuelve clicable,
 * es un cambio de alcance explícito, no una extensión silenciosa de esta
 * pieza.
 */
import { cloneElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';

interface FeatureCardProps {
  /** Ícono a 28px por defecto — las tarjetas de Entreno/Simulación lo agrandan a 32px en `lg` vía `className` (`SPEC.md` §3.1). */
  icon: ReactElement<{ size?: number; className?: string }>;
  title: string;
  description: string;
  /** Padding por defecto `space-5` (24px, ambos breakpoints — tarjetas de "módulos"). Las de Entreno/Simulación lo sobrescriben a `p-space-4 lg:p-space-5` (`SPEC.md` §3.1). */
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        'border-border-subtle bg-bg-surface gap-space-2 p-space-5 flex flex-col items-start rounded-lg border',
        className,
      )}
    >
      <span className="text-text-primary">{cloneElement(icon, { size: 28 })}</span>
      <span className="text-h3 font-body text-text-primary">{title}</span>
      <span className="text-small text-text-muted">{description}</span>
    </div>
  );
}
