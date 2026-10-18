/**
 * Bloque de acción con el que cierran `LoginForm` y `RegisterForm`: el botón
 * de envío y el enlace a la otra pantalla («¿No tienes cuenta? Crear cuenta»
 * / «¿Ya tienes cuenta? Inicia sesión»). Mismo comportamiento que tenían ambos
 * formularios por separado —`type="submit"`, estado de carga con gerundio,
 * mismo destino del enlace—; lo nuevo es solo la presentación (CM-329,
 * `SPEC.md` §3.8):
 *
 * - **Por debajo de `lg`** queda al fondo de la pantalla: `mt-auto` lo empuja
 *   abajo cuando el formulario es corto (Login), y `sticky bottom-0` lo deja a
 *   la vista mientras un formulario largo hace scroll (Registro). Lleva fondo
 *   y una sombra hacia arriba para separarse del contenido que pasa debajo.
 * - **En `lg`** vuelve a ser parte del flujo normal, sin fondo ni sombra.
 *
 * El gesto del botón (leve elevación, flecha que avanza) es el de `Button`
 * `primary` con `iconPosition="end"`: vive en el átomo, no aquí (ADR-0001).
 */
import { Link } from 'react-router';
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';

interface AuthFormActionsProps {
  isSubmitting: boolean;
  submitLabel: string;
  /** Gerundio mientras se envía (`Button` lo exige con `loading`). */
  submitLoadingLabel: string;
  /** Pregunta que antecede al enlace («¿No tienes cuenta?»). */
  footerQuestion: string;
  /** Texto del enlace a la otra pantalla de autenticación. */
  footerCta: string;
  /** Ruta del enlace (`ROUTES.registro` o `ROUTES.ingresar`). */
  footerTo: string;
}

export function AuthFormActions({
  isSubmitting,
  submitLabel,
  submitLoadingLabel,
  footerQuestion,
  footerCta,
  footerTo,
}: AuthFormActionsProps) {
  return (
    <div className="bg-bg-canvas -mx-space-4 px-space-4 pt-space-3 pb-space-5 gap-space-3 sticky bottom-0 z-10 mt-auto flex flex-col shadow-[0_-12px_20px_-14px_color-mix(in_srgb,var(--brand-base)_30%,transparent)] lg:static lg:mx-0 lg:mt-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      {isSubmitting ? (
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading
          loadingLabel={submitLoadingLabel}
        >
          {submitLabel}
        </Button>
      ) : (
        <Button
          type="submit"
          size="lg"
          icon={<Icon name="arrow-right" />}
          iconPosition="end"
          className="w-full"
        >
          {submitLabel}
        </Button>
      )}

      <div className="gap-space-1 text-body flex flex-wrap justify-center">
        <span className="text-text-muted">{footerQuestion}</span>
        <Link
          to={footerTo}
          className="text-brand-base decoration-brand-accent focus-visible:shadow-focus-ring rounded-sm font-semibold underline decoration-2 underline-offset-4 focus-visible:outline-none"
        >
          {footerCta}
        </Link>
      </div>
    </div>
  );
}
