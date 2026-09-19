/**
 * Formulario de Registro (`PRT-01.01`, nodos `70:170` lg / `75:410` sm):
 * Google (deshabilitado), divisor, Nombre(s)/Apellido(s) (lado a lado en
 * `lg`, apilados en `sm`), Fecha de nacimiento, Correo, Celular (opcional),
 * Contraseña (+ medidor de fuerza), Confirmar contraseña, Pronombres, botón
 * "Registrarse".
 *
 * Mismo patrón que `LoginForm`/`GeneralInfoForm`: sin `useTranslation`
 * (CLAUDE.md §14.7), todo texto visible entra por prop obligatoria.
 * `Controller` de react-hook-form, cada uno pasando `ref={field.ref}` al
 * control real (CM-34 seguimiento: `Input`/`Select`/`PasswordField` ya
 * reenvían `ref`) — así `handleSubmit` enfoca solo el primer campo con
 * error al enviar (`shouldFocusError`, por defecto en react-hook-form).
 *
 * `fechaNacimientoAyuda` es el mismo texto en el helper permanente y en el
 * error de "menor de edad" (Figma, nodo `73:535`: el error solo cambia el
 * borde, nunca el texto) — se reutiliza también cuando el backend rechaza
 * la fecha (`birthDateRejectedByServer`, `InvalidBirthDateException`,
 * `SPEC.md` §3): es la misma causa, solo que detectada del otro lado. El
 * campo además lleva `max={todayLocalIsoDate()}` para que el selector nativo
 * del navegador no deje elegir una fecha futura (pedido explícito del
 * usuario, no solo capturado al enviar) — `todayLocalIsoDate` (no
 * `toISOString()`) porque Colombia es `UTC-5`: de noche, la fecha en UTC ya
 * es la de mañana, y un `max` calculado así dejaba elegir esa fecha desde el
 * selector nativo en móvil (segundo seguimiento de CM-34, hallazgo real del
 * usuario). Mismo criterio en el otro extremo: `min={oldestPlausibleBirthDateIsoDate()}`
 * (pedido explícito del usuario) no deja elegir, desde el propio calendario,
 * una fecha que ya implica más de 110 años — el mismo límite que
 * `isImplausiblyOld` valida al enviar.
 *
 * `duplicateEmailErrorMessage` fuerza el campo `correo` a estado de error y
 * revela el bloque de dos acciones que dibuja Figma para ese caso
 * ("Iniciar sesión" funcional, "Recuperar contraseña" deshabilitado — mismo
 * tratamiento que Login).
 *
 * `contrasena`/`celular.numeroNacional` replican reglas reales del backend
 * (`PasswordPolicy.java`/`PhoneNumber.java`, `register.schema.ts`) —
 * `contrasenaServerErrorMessage` cubre el residual improbable de que el
 * backend rechace algo que el cliente no supo replicar (p. ej. una regla
 * nueva); el celular no tiene un residual equivalente, porque
 * `BusinessExceptionHandler.valorInvalido()` no etiqueta el campo (cae al
 * `genericErrorMessage` general de la página).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { oldestPlausibleBirthDateIsoDate, todayLocalIsoDate } from '@/utils/calculateAge';
import { cn } from '@/utils/cn';
import { calculatePasswordStrength } from '@/utils/passwordStrength';
import { Button } from '@/design-system/atoms/Button';
import { Divider } from '@/design-system/atoms/Divider';
import { Icon } from '@/design-system/icons/Icon';
import { Select, type SelectOption } from '@/design-system/atoms/Select';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { FormField } from '@/design-system/molecules/FormField';
import { Input } from '@/design-system/atoms/Input';
import { PasswordField } from '@/design-system/molecules/PasswordField';
import { PasswordStrength } from '@/design-system/molecules/PasswordStrength';
import { PhoneField } from '../PhoneField';
import {
  registerSchema,
  registerSchemaErrorCodes,
  type RegisterFormValues,
} from '../../schemas/register.schema';

interface RegisterFormProps {
  isSubmitting: boolean;
  onSubmit: (values: RegisterFormValues) => void;

  titleText: string;
  googleButtonLabel: string;
  dividerLabel: string;

  nombreLabel: string;
  nombrePlaceholder: string;
  nombreErrorRequired: string;
  apellidoLabel: string;
  apellidoPlaceholder: string;
  apellidoErrorRequired: string;

  fechaNacimientoLabel: string;
  fechaNacimientoAyuda: string;
  fechaNacimientoErrorFutura: string;
  fechaNacimientoErrorImplausible: string;
  fechaNacimientoErrorFormatoInvalido: string;
  /** `InvalidBirthDateException` del backend — mismo tratamiento visual que "menor de edad" de cliente. */
  birthDateRejectedByServer?: boolean;

  correoLabel: string;
  correoPlaceholder: string;
  correoErrorRequired: string;
  correoErrorInvalid: string;
  /** Correo duplicado (`EmailAlreadyRegisteredException`): mensaje bajo el campo + bloque de dos acciones. */
  duplicateEmailErrorMessage?: string;
  duplicateEmailLoginLabel: string;
  duplicateEmailRecoverLabel: string;

  celularPaisLabel: string;
  celularBuscarPaisLabel: string;
  celularSinResultadosLabel: string;
  celularNumeroLabel: string;
  celularNumeroPlaceholder: string;
  celularAyuda: string;
  celularErrorInvalido: string;

  contrasenaLabel: string;
  contrasenaPlaceholder: string;
  contrasenaErrorMuyCorta: string;
  contrasenaErrorMuyLarga: string;
  contrasenaErrorComun: string;
  /** Residual: el backend rechazó la contraseña por una regla que el cliente no replica. */
  contrasenaServerErrorMessage?: string;
  contrasenaFuerzaDebil: string;
  contrasenaFuerzaAceptable: string;
  contrasenaFuerzaBuena: string;
  contrasenaFuerzaFuerte: string;
  confirmarContrasenaLabel: string;
  confirmarContrasenaPlaceholder: string;
  confirmarContrasenaErrorRequired: string;
  confirmarContrasenaErrorNoCoincide: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;

  pronombresLabel: string;
  pronombresPlaceholder: string;
  pronombresOptions: SelectOption[];
  pronombresErrorRequired: string;

  /** Cualquier otro `4xx`/fallo de red no cubierto por los casos específicos de arriba. */
  genericErrorMessage?: string;

  submitLabel: string;
  submitLoadingLabel: string;
  footerQuestion: string;
  footerCta: string;
  className?: string;
}

export function RegisterForm({
  isSubmitting,
  onSubmit,
  titleText,
  googleButtonLabel,
  dividerLabel,
  nombreLabel,
  nombrePlaceholder,
  nombreErrorRequired,
  apellidoLabel,
  apellidoPlaceholder,
  apellidoErrorRequired,
  fechaNacimientoLabel,
  fechaNacimientoAyuda,
  fechaNacimientoErrorFutura,
  fechaNacimientoErrorImplausible,
  fechaNacimientoErrorFormatoInvalido,
  birthDateRejectedByServer = false,
  correoLabel,
  correoPlaceholder,
  correoErrorRequired,
  correoErrorInvalid,
  duplicateEmailErrorMessage,
  duplicateEmailLoginLabel,
  duplicateEmailRecoverLabel,
  celularPaisLabel,
  celularBuscarPaisLabel,
  celularSinResultadosLabel,
  celularNumeroLabel,
  celularNumeroPlaceholder,
  celularAyuda,
  celularErrorInvalido,
  contrasenaLabel,
  contrasenaPlaceholder,
  contrasenaErrorMuyCorta,
  contrasenaErrorMuyLarga,
  contrasenaErrorComun,
  contrasenaServerErrorMessage,
  contrasenaFuerzaDebil,
  contrasenaFuerzaAceptable,
  contrasenaFuerzaBuena,
  contrasenaFuerzaFuerte,
  confirmarContrasenaLabel,
  confirmarContrasenaPlaceholder,
  confirmarContrasenaErrorRequired,
  confirmarContrasenaErrorNoCoincide,
  showPasswordLabel,
  hidePasswordLabel,
  pronombresLabel,
  pronombresPlaceholder,
  pronombresOptions,
  pronombresErrorRequired,
  genericErrorMessage,
  submitLabel,
  submitLoadingLabel,
  footerQuestion,
  footerCta,
  className,
}: RegisterFormProps) {
  const strengthLabels = {
    weak: contrasenaFuerzaDebil,
    fair: contrasenaFuerzaAceptable,
    good: contrasenaFuerzaBuena,
    strong: contrasenaFuerzaFuerte,
  } as const;

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      fechaNacimiento: '',
      correo: '',
      celular: { paisIso: 'CO', numeroNacional: '' },
      contrasena: '',
      confirmarContrasena: '',
      pronombres: '',
    },
  });

  const hasDuplicateEmailError = Boolean(duplicateEmailErrorMessage);
  const hasContrasenaServerError = Boolean(contrasenaServerErrorMessage);

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

      <div className="gap-space-4 grid grid-cols-1 lg:grid-cols-2">
        <Controller
          control={control}
          name="nombre"
          render={({ field, fieldState }) => (
            <FormField
              label={nombreLabel}
              error={fieldState.error?.type === 'too_small' ? nombreErrorRequired : undefined}
            >
              <Input
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={nombrePlaceholder}
                autoComplete="given-name"
                state={isSubmitting ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="apellido"
          render={({ field, fieldState }) => (
            <FormField
              label={apellidoLabel}
              error={fieldState.error?.type === 'too_small' ? apellidoErrorRequired : undefined}
            >
              <Input
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={apellidoPlaceholder}
                autoComplete="family-name"
                state={isSubmitting ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />
      </div>

      <Controller
        control={control}
        name="fechaNacimiento"
        render={({ field, fieldState }) => {
          // En cuanto la persona toca el campo tras un rechazo del backend,
          // el aviso deja de describir el valor que ve en pantalla — se
          // apaga con `isDirty`, no con un timeout ni un evento aparte.
          const isServerRejected = birthDateRejectedByServer && !fieldState.isDirty;
          const errorMessage =
            fieldState.error?.message === registerSchemaErrorCodes.FECHA_NACIMIENTO_FUTURA
              ? fechaNacimientoErrorFutura
              : fieldState.error?.message === registerSchemaErrorCodes.FECHA_NACIMIENTO_IMPLAUSIBLE
                ? fechaNacimientoErrorImplausible
                : fieldState.error?.message ===
                    registerSchemaErrorCodes.FECHA_NACIMIENTO_FORMATO_INVALIDO
                  ? fechaNacimientoErrorFormatoInvalido
                  : fieldState.error?.message ===
                        registerSchemaErrorCodes.FECHA_NACIMIENTO_MENOR_DE_EDAD || isServerRejected
                    ? fechaNacimientoAyuda
                    : undefined;

          return (
            <FormField
              label={fechaNacimientoLabel}
              helperText={errorMessage ? undefined : fechaNacimientoAyuda}
              error={errorMessage}
            >
              <Input
                ref={field.ref}
                type="date"
                max={todayLocalIsoDate()}
                min={oldestPlausibleBirthDateIsoDate()}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                state={
                  isSubmitting
                    ? 'disabled'
                    : fieldState.error || isServerRejected
                      ? 'error'
                      : 'default'
                }
              />
            </FormField>
          );
        }}
      />

      <div className="gap-space-1 flex flex-col">
        <Controller
          control={control}
          name="correo"
          render={({ field, fieldState }) => (
            <FormField
              label={correoLabel}
              error={
                hasDuplicateEmailError
                  ? duplicateEmailErrorMessage
                  : fieldState.error?.type === 'too_small'
                    ? correoErrorRequired
                    : fieldState.error?.type === 'invalid_format'
                      ? correoErrorInvalid
                      : undefined
              }
            >
              <Input
                ref={field.ref}
                type="email"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={correoPlaceholder}
                autoComplete="email"
                state={
                  isSubmitting
                    ? 'disabled'
                    : fieldState.error || hasDuplicateEmailError
                      ? 'error'
                      : 'default'
                }
              />
            </FormField>
          )}
        />
        {hasDuplicateEmailError ? (
          <div className="gap-space-3 flex items-center">
            <Link
              to={ROUTES.ingresar}
              className="text-small text-text-link font-semibold hover:underline"
            >
              {duplicateEmailLoginLabel}
            </Link>
            <button
              type="button"
              disabled
              className="text-small text-text-disabled cursor-not-allowed"
            >
              {duplicateEmailRecoverLabel}
            </button>
          </div>
        ) : null}
      </div>

      <Controller
        control={control}
        name="celular.numeroNacional"
        render={({ field: numeroField, fieldState }) => (
          <Controller
            control={control}
            name="celular.paisIso"
            render={({ field: paisField }) => (
              <PhoneField
                paisLabel={celularPaisLabel}
                paisValue={paisField.value}
                onPaisChange={paisField.onChange}
                paisBuscarLabel={celularBuscarPaisLabel}
                paisSinResultadosLabel={celularSinResultadosLabel}
                numeroLabel={celularNumeroLabel}
                numeroValue={numeroField.value}
                onNumeroChange={numeroField.onChange}
                onNumeroBlur={numeroField.onBlur}
                numeroPlaceholder={celularNumeroPlaceholder}
                helperText={fieldState.error ? undefined : celularAyuda}
                errorMessage={fieldState.error ? celularErrorInvalido : undefined}
                state={isSubmitting ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="contrasena"
        render={({ field, fieldState }) => {
          const errorMessage = hasContrasenaServerError
            ? contrasenaServerErrorMessage
            : fieldState.error?.message === registerSchemaErrorCodes.CONTRASENA_MUY_CORTA
              ? contrasenaErrorMuyCorta
              : fieldState.error?.message === registerSchemaErrorCodes.CONTRASENA_MUY_LARGA
                ? contrasenaErrorMuyLarga
                : fieldState.error?.message === registerSchemaErrorCodes.CONTRASENA_COMUN
                  ? contrasenaErrorComun
                  : undefined;
          const strength = calculatePasswordStrength(field.value);

          return (
            <div className="gap-space-2 flex flex-col">
              <FormField label={contrasenaLabel} error={errorMessage}>
                <PasswordField
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={contrasenaPlaceholder}
                  showPasswordLabel={showPasswordLabel}
                  hidePasswordLabel={hidePasswordLabel}
                  state={
                    isSubmitting
                      ? 'disabled'
                      : errorMessage || fieldState.error
                        ? 'error'
                        : 'default'
                  }
                />
              </FormField>
              <PasswordStrength
                level={strength}
                label={strength === 'empty' ? undefined : strengthLabels[strength]}
              />
            </div>
          );
        }}
      />

      <Controller
        control={control}
        name="confirmarContrasena"
        render={({ field, fieldState }) => (
          <FormField
            label={confirmarContrasenaLabel}
            error={
              fieldState.error?.type === 'too_small'
                ? confirmarContrasenaErrorRequired
                : fieldState.error?.message ===
                    registerSchemaErrorCodes.CONFIRMAR_CONTRASENA_NO_COINCIDE
                  ? confirmarContrasenaErrorNoCoincide
                  : undefined
            }
          >
            <PasswordField
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={confirmarContrasenaPlaceholder}
              showPasswordLabel={showPasswordLabel}
              hidePasswordLabel={hidePasswordLabel}
              state={isSubmitting ? 'disabled' : fieldState.error ? 'error' : 'default'}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="pronombres"
        render={({ field, fieldState }) => (
          <FormField
            label={pronombresLabel}
            error={fieldState.error?.type === 'too_small' ? pronombresErrorRequired : undefined}
          >
            <Select
              ref={field.ref}
              options={pronombresOptions}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={pronombresPlaceholder}
              state={isSubmitting ? 'disabled' : fieldState.error ? 'error' : 'default'}
            />
          </FormField>
        )}
      />

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
        <Link to={ROUTES.ingresar} className="text-text-link font-semibold hover:underline">
          {footerCta}
        </Link>
      </div>
    </form>
  );
}
