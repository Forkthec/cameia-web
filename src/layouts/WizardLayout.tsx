/**
 * Plantilla de los asistentes de pasos (PRT-04.*): banda superior con el
 * `Stepper` y barra de acciones con «Atrás» y la acción primaria.
 *
 * **No es la plantilla de PRT-02.03** (Formulario de Perfil Profesional):
 * verificado contra Figma en CM-53 — esa pantalla no es un asistente por
 * pasos, es una página única con índice de secciones y una barra de
 * acciones compartida (`docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`).
 *
 * **Presentación «Amanecer» (CM-208).** Solo diseño; mismas props y mismo
 * comportamiento:
 * - Se monta dentro de `AppShell` (como el resto del área autenticada): la
 *   navegación de la app (NavHeader / TabBar / menú de usuario) la pone el
 *   shell, no esta plantilla.
 * - Arriba, una salida explícita (`exitLabel`/`exitTo`, p. ej. «Volver al
 *   inicio», `Button` `tertiary`), distinta de «Atrás», que solo cambia de paso.
 * - El progreso vive en una tarjeta blanca con el `Stepper` («camino del
 *   amanecer»), y el contenido en una columna de lectura cómoda (`max-w-3xl`).
 * - La barra de acciones usa solo átomos `Button`: «Atrás» `secondary` con
 *   chevron y la acción primaria con flecha final (`iconPosition="end"`).
 *   `progressText` (opcional, p. ej. «Paso 2 de 5») va en el centro en
 *   escritorio.
 * - Por debajo de `md` la barra va al final del contenido (no fija: el shell
 *   ya fija su `TabBar` abajo y dos barras fijas se taparían) y «Atrás» pasa a
 *   botón de solo ícono (`variant="icon"`, 44×44, con nombre accesible) para
 *   dejarle el ancho a la acción primaria.
 */
import type { ReactNode } from 'react';
import { Button, ButtonLink } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { Stepper, type Step } from '@/design-system/molecules/Stepper';

interface WizardLayoutProps {
  steps: Step[];
  /** Nombre accesible de la lista de pasos, p. ej. "Progreso del asistente". */
  stepsLabel: string;
  backLabel?: string;
  onBack?: () => void;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  primaryActionLoading?: boolean;
  primaryActionLoadingLabel?: string;
  primaryActionDisabled?: boolean;
  /** Texto de progreso entre las acciones en escritorio, p. ej. «Paso 2 de 5». Ya traducido. */
  progressText?: string;
  /** Texto de la salida del asistente (p. ej. «Volver al inicio»). Ya traducido. */
  exitLabel?: string;
  /** Ruta de salida del asistente. Sin ella no se muestra la salida. */
  exitTo?: string;
  /** Oculta la barra de acciones; útil cuando el paso tiene su propia acción (p. ej. «Iniciar entrevista»). */
  hidePrimaryAction?: boolean;
  children: ReactNode;
}

export function WizardLayout({
  steps,
  stepsLabel,
  backLabel,
  onBack,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionLoading = false,
  primaryActionLoadingLabel,
  primaryActionDisabled = false,
  progressText,
  exitLabel,
  exitTo,
  hidePrimaryAction = false,
  children,
}: WizardLayoutProps) {
  return (
    <div className="gap-space-5 mx-auto flex w-full max-w-4xl flex-col">
      {exitTo && exitLabel ? (
        <ButtonLink
          to={exitTo}
          variant="tertiary"
          icon={<Icon name="chevron-left" />}
          // Margen negativo igual al padding del botón: el ícono queda alineado con
          // el borde del contenido y el fondo del hover conserva su aire.
          className="-ml-space-5 self-start"
        >
          {exitLabel}
        </ButtonLink>
      ) : null}

      <div className="border-border-subtle bg-bg-surface px-space-4 py-space-5 md:px-space-6 rounded-xl border">
        <Stepper steps={steps} label={stepsLabel} />
      </div>

      <div className="mx-auto w-full max-w-3xl">{children}</div>

      {hidePrimaryAction ? null : (
        <footer className="border-border-subtle pt-space-5 border-t">
          <div className="gap-space-3 mx-auto flex w-full max-w-3xl items-center">
            {onBack ? (
              <>
                <Button
                  variant="icon"
                  size="lg"
                  icon={<Icon name="chevron-left" />}
                  onClick={onBack}
                  className="border-border-strong bg-bg-surface border md:hidden"
                >
                  {backLabel}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Icon name="chevron-left" />}
                  onClick={onBack}
                  className="hidden md:inline-flex"
                >
                  {backLabel}
                </Button>
              </>
            ) : null}

            {progressText ? (
              <span className="text-small text-text-muted hidden flex-1 text-center md:block">
                {progressText}
              </span>
            ) : (
              <span className="hidden flex-1 md:block" />
            )}

            {primaryActionLoading ? (
              <Button
                variant="primary"
                size="lg"
                loading
                loadingLabel={primaryActionLoadingLabel ?? primaryActionLabel}
                className="flex-1 md:flex-none"
              >
                {primaryActionLabel}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                icon={<Icon name="arrow-right" />}
                iconPosition="end"
                onClick={onPrimaryAction}
                disabled={primaryActionDisabled}
                className="flex-1 md:flex-none"
              >
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
