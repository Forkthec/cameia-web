/**
 * Escenario del chat de Simulación (PRT-05.10) en la dirección «Escenario +
 * orbe» aprobada para CM-217: cielo de madrugada, el progreso como el arco
 * del sol («Pregunta k de 5»), el orbe del camello que muestra qué está
 * pasando y la pregunta pendiente al centro. El área de respuesta (texto o
 * voz) entra por `children` y se acomoda abajo.
 *
 * Organismo de la feature (ADR-0001): arma átomos y moléculas del design
 * system (`Logo`, `Pill`, `ProgressArc`, `BrandOrb`). No agrega acciones: el
 * backlog no pone pausa ni salida en el chat (CA-5.2.15). El estado que
 * muestra el orbe se anuncia con `statusText` en una región `aria-live`,
 * porque el orbe es decorativo.
 */
import type { ReactNode } from 'react';
import { Logo } from '@/design-system/atoms/Logo';
import { Pill } from '@/design-system/atoms/Pill';
import { BrandOrb, type BrandOrbState } from '@/design-system/molecules/BrandOrb';
import { ProgressArc } from '@/design-system/molecules/ProgressArc';

interface SessionStageProps {
  /** Nombre de la marca para el logo, ya traducido. */
  wordmarkLabel: string;
  /** Modalidad y forma de respuesta, ya traducidas (p. ej. «Simulación · Texto»). */
  modeLabel: string;
  /** Pregunta actual y total. */
  progress: { current: number; total: number };
  /** «Pregunta k de 5», ya traducido. */
  progressLabel: string;
  /** Qué muestra el orbe. */
  orbState: BrandOrbState;
  /** Texto que acompaña al orbe y se anuncia; solo textos del backlog. */
  statusText?: string;
  /** Pregunta pendiente o mensaje final; se pinta como título de la pantalla. */
  heading: ReactNode;
  /** Área de respuesta. */
  children?: ReactNode;
}

export function SessionStage({
  wordmarkLabel,
  modeLabel,
  progress,
  progressLabel,
  orbState,
  statusText,
  heading,
  children,
}: SessionStageProps) {
  return (
    <div className="bg-brand-dawn text-text-on-inverse relative flex min-h-dvh flex-col overflow-hidden">
      <header className="px-space-4 pt-space-4 lg:px-space-7 lg:pt-space-6 flex items-center justify-between">
        <Logo variant="lockup" tone="inverse" size="sm" wordmarkLabel={wordmarkLabel} />
        <Pill className="border-text-on-inverse/20 text-text-on-inverse/85 bg-transparent">
          {modeLabel}
        </Pill>
      </header>

      <main className="px-space-4 pb-space-5 lg:pb-space-7 mx-auto flex w-full max-w-[60rem] flex-1 flex-col items-center">
        <ProgressArc
          current={progress.current}
          total={progress.total}
          label={progressLabel}
          className="mt-space-4 lg:mt-space-2"
        />

        <div className="py-space-5 flex flex-1 flex-col items-center justify-center text-center">
          <BrandOrb state={orbState} className="max-lg:size-32" />
          <p
            aria-live="polite"
            className="text-small text-brand-accent-light mt-space-2 min-h-[1.5em] font-semibold"
          >
            {statusText}
          </p>
          <h1
            key={typeof heading === 'string' ? heading : undefined}
            className="font-display text-h2 lg:text-display-sm mt-space-4 animate-enter-up max-w-[22em] text-balance"
          >
            {heading}
          </h1>
        </div>

        {children ? <div className="w-full max-w-[55rem]">{children}</div> : null}
      </main>
    </div>
  );
}
