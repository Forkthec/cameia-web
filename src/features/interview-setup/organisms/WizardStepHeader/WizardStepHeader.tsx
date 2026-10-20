/**
 * Encabezado de cada paso del asistente de entrevista (CM-208, presentación
 * «Amanecer»): índice del paso (`Eyebrow` `section`, p. ej. «02 · Oferta y
 * rol»), una pregunta como título y una línea de contexto.
 *
 * Al cambiar de paso, la página lo vuelve a montar (`key`) para que entre con
 * `animate-enter-up` y para mover el foco al título: así un lector de
 * pantalla anuncia el paso nuevo en lugar de quedarse en el botón
 * «Continuar» (CLAUDE.md §10).
 */
import { useEffect, useRef } from 'react';
import { Eyebrow } from '@/design-system/atoms/Eyebrow';

interface WizardStepHeaderProps {
  /** Posición del paso (1…n). */
  index: number;
  /** Nombre corto del paso, el mismo del `Stepper`. */
  stepLabel: string;
  /** Pregunta que encabeza el paso. */
  title: string;
  /** Línea de contexto bajo el título. */
  description: string;
  /** Mueve el foco al título al montarse (no en la primera carga de la página). */
  focusOnMount?: boolean;
}

export function WizardStepHeader({
  index,
  stepLabel,
  title,
  description,
  focusOnMount = false,
}: WizardStepHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) titleRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="animate-enter-up mb-space-6">
      <Eyebrow variant="section" index={index} className="mb-space-3">
        {stepLabel}
      </Eyebrow>
      <h1
        ref={titleRef}
        tabIndex={-1}
        className="text-h1 font-display text-brand-deep mb-space-2 focus:outline-none"
      >
        {title}
      </h1>
      <p className="text-body text-text-muted max-w-[40em]">{description}</p>
    </div>
  );
}
