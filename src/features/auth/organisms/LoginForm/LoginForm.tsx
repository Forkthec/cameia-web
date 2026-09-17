/**
 * Formulario de Login (`form-inner` de `PRT-01.03`, nodos `94:1126`/`97:1273`
 * de Figma): título, botón de Google y enlace de recuperación deshabilitados
 * (D-04/D-05, fuera de alcance de `HU-1.3`), campos de correo/contraseña,
 * botón "Ingresar" y el enlace a Registro.
 *
 * Sigue el mismo patrón que `GeneralInfoForm` (`professional-profile`): no
 * llama `useTranslation` (CLAUDE.md §14.7, aplicado por consistencia aunque
 * la regla textual solo obligue al design system) — todo texto visible entra
 * como prop obligatoria, y quien resuelve la sesión (`useLogin`) vive en
 * `LoginPage`, no aquí. Este organismo solo valida y expone `onSubmit`.
 *
 * `Input`/`PasswordField` no aceptan `ref` (no usan `forwardRef`), así que
 * los campos van por `Controller`, no por `register()` — mismo motivo que
 * documenta `GeneralInfoForm.tsx`.
 *
 * Cuando `genericErrorMessage` está presente (error de Firebase: credenciales,
 * rate limit, red), **ambos** campos pasan a `state="error"` sin texto
 * individual — confirmado contra Figma (`PRT-01.03 · Login · credenciales
 * inválidas`, nodos `96:1153`/`98:1306`): el borde rojo compartido, sin
 * señalar cuál campo falló, es la forma visual de cumplir CA-1.3.1.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { cn } from '@/utils/cn';
import { Button } from '@/design-system/atoms/Button';
import { Divider } from '@/design-system/atoms/Divider';
import { Icon } from '@/design-system/icons/Icon';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { FormField } from '@/design-system/molecules/FormField';
import { Input } from '@/design-system/atoms/Input';
import { PasswordField } from '@/design-system/molecules/PasswordField';
import { loginSchema, type LoginFormValues } from '../../schemas/login.schema';

interface LoginFormProps {
  isSubmitting: boolean;
  /** Mensaje ya traducido de `errors:codigos.*`; su presencia también fuerza el borde rojo de ambos campos. */
  genericErrorMessage?: string;
  onSubmit: (values: LoginFormValues) => void;
  titleText: string;
  googleButtonLabel: string;
  dividerLabel: string;
  correoLabel: string;
  correoPlaceholder: string;
  correoErrorRequired: string;
  correoErrorInvalid: string;
  contrasenaLabel: string;
  contrasenaPlaceholder: string;
  contrasenaErrorRequired: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  forgotPasswordLabel: string;
  submitLabel: string;
  submitLoadingLabel: string;
  footerQuestion: string;
  footerCta: string;
  className?: string;
}

export function LoginForm({
  isSubmitting,
  genericErrorMessage,
  onSubmit,
  titleText,
  googleButtonLabel,
  dividerLabel,
  correoLabel,
  correoPlaceholder,
  correoErrorRequired,
  correoErrorInvalid,
  contrasenaLabel,
  contrasenaPlaceholder,
  contrasenaErrorRequired,
  showPasswordLabel,
  hidePasswordLabel,
  forgotPasswordLabel,
  submitLabel,
  submitLoadingLabel,
  footerQuestion,
  footerCta,
  className,
}: LoginFormProps) {
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', contrasena: '' },
  });

  const hasGenericError = Boolean(genericErrorMessage);

  return (
    <form
      className={cn('gap-space-5 flex flex-col', className)}
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <h1 className="text-h1 font-display text-text-primary">{titleText}</h1>

      {genericErrorMessage ? (
        <AlertInline variant="error">{genericErrorMessage}</AlertInline>
      ) : null}

      <Button
        variant="secondary"
        size="lg"
        disabled
        icon={<Icon name="google" />}
        className="w-full"
      >
        {googleButtonLabel}
      </Button>

      <div className="gap-space-3 flex items-center">
        <Divider className="flex-1" />
        <span className="text-small text-text-muted">{dividerLabel}</span>
        <Divider className="flex-1" />
      </div>

      <Controller
        control={control}
        name="correo"
        render={({ field, fieldState }) => (
          <FormField
            label={correoLabel}
            error={
              fieldState.error?.type === 'too_small'
                ? correoErrorRequired
                : fieldState.error?.type === 'invalid_format'
                  ? correoErrorInvalid
                  : undefined
            }
          >
            <Input
              type="email"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={correoPlaceholder}
              autoComplete="email"
              state={
                isSubmitting
                  ? 'disabled'
                  : fieldState.error || hasGenericError
                    ? 'error'
                    : 'default'
              }
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="contrasena"
        render={({ field, fieldState }) => (
          <FormField
            label={contrasenaLabel}
            error={fieldState.error?.type === 'too_small' ? contrasenaErrorRequired : undefined}
          >
            <PasswordField
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={contrasenaPlaceholder}
              showPasswordLabel={showPasswordLabel}
              hidePasswordLabel={hidePasswordLabel}
              state={
                isSubmitting
                  ? 'disabled'
                  : fieldState.error || hasGenericError
                    ? 'error'
                    : 'default'
              }
            />
          </FormField>
        )}
      />

      <div className="flex justify-end">
        <button type="button" disabled className="text-small text-text-disabled cursor-not-allowed">
          {forgotPasswordLabel}
        </button>
      </div>

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
        <Button type="submit" size="lg" className="w-full">
          {submitLabel}
        </Button>
      )}

      <div className="gap-space-1 text-body flex justify-center">
        <span className="text-text-muted">{footerQuestion}</span>
        <Link to={ROUTES.registro} className="text-text-link font-semibold hover:underline">
          {footerCta}
        </Link>
      </div>
    </form>
  );
}
