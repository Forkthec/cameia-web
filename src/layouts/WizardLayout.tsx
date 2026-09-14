/**
 * Plantilla de los asistentes de pasos (PRT-02.03 · PRT-04.*): encabezado con
 * `Stepper` y pie con la acción primaria. En móvil el botón primario ocupa el
 * ancho completo y se ancla al fondo de la pantalla; en escritorio queda en
 * el flujo normal, alineado a la derecha.
 *
 * `primaryActionFormId` (CM-53) conecta el botón primario con un `<form>`
 * que vive dentro de `children`, vía el atributo HTML `form`: el botón pasa
 * a `type="submit"` y deja de necesitar `onClick`, para que el envío real lo
 * decida el `onSubmit` del formulario (validación incluida) y no un
 * `onPrimaryAction` que solo sabe hacer clic. Opcional y retrocompatible:
 * sin ella, el layout se comporta exactamente como antes (`interview-setup`
 * no la usa).
 */
import type { ReactNode } from 'react';
import { Button } from '@/design-system/atoms/Button';
import { Stepper, type Step } from '@/design-system/molecules/Stepper';

interface WizardLayoutProps {
  steps: Step[];
  /** Nombre accesible de la lista de pasos, p. ej. "Progreso del asistente". */
  stepsLabel: string;
  backLabel?: string;
  onBack?: () => void;
  primaryActionLabel: string;
  /** Ignorado cuando se pasa `primaryActionFormId`: el envío lo dispara el `<form>`, no un clic. */
  onPrimaryAction?: () => void;
  /** Id del `<form>` (dentro de `children`) que este botón debe enviar como `type="submit"`. */
  primaryActionFormId?: string;
  primaryActionLoading?: boolean;
  primaryActionLoadingLabel?: string;
  primaryActionDisabled?: boolean;
  children: ReactNode;
}

export function WizardLayout({
  steps,
  stepsLabel,
  backLabel,
  onBack,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionFormId,
  primaryActionLoading = false,
  primaryActionLoadingLabel,
  primaryActionDisabled = false,
  children,
}: WizardLayoutProps) {
  return (
    <div className="min-h-dvh">
      <header className="border-border-subtle bg-bg-surface px-space-5 py-space-4 border-b">
        <Stepper steps={steps} label={stepsLabel} className="mx-auto max-w-2xl" />
      </header>

      <main className="p-space-5 pb-space-9 md:pb-space-5 mx-auto max-w-2xl">{children}</main>

      <footer className="border-border-subtle bg-bg-surface p-space-4 gap-space-3 fixed inset-x-0 bottom-0 flex items-center justify-end border-t md:static md:mx-auto md:max-w-2xl md:border-t-0 md:px-0">
        {onBack ? (
          <Button variant="secondary" size="md" onClick={onBack} className="hidden md:inline-flex">
            {backLabel}
          </Button>
        ) : null}
        {primaryActionLoading ? (
          <Button
            variant="primary"
            size="lg"
            type={primaryActionFormId ? 'submit' : 'button'}
            form={primaryActionFormId}
            loading
            loadingLabel={primaryActionLoadingLabel ?? primaryActionLabel}
            className="w-full md:w-auto"
          >
            {primaryActionLabel}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            type={primaryActionFormId ? 'submit' : 'button'}
            form={primaryActionFormId}
            onClick={primaryActionFormId ? undefined : onPrimaryAction}
            disabled={primaryActionDisabled}
            className="w-full md:w-auto"
          >
            {primaryActionLabel}
          </Button>
        )}
      </footer>
    </div>
  );
}
