/**
 * Formulario de Información General del Perfil Profesional (HU-2.3,
 * PRT-02.03, CM-53): captura `name` y `summary`. Se renderiza como
 * `<form id={formId}>` para que el botón primario de `WizardLayout`
 * (`primaryActionFormId`) lo envíe por `type="submit"`/`form` en vez de un
 * `onClick` — así el envío pasa siempre por la validación de
 * `react-hook-form` antes de llegar a `onSubmit`.
 *
 * Los campos van por `<Controller>`, no por `register()`: `Input` (átomo
 * del design system) no acepta `ref` — no usa `forwardRef` ni expone `ref`
 * entre sus props (verificado leyendo `design-system/atoms/Input/Input.tsx`) —
 * así que `register()` no tiene dónde enganchar el nodo del DOM.
 *
 * `name`/`summary` (los valores iniciales) se pasan por props en vez de que
 * el propio formulario haga el `fetch`: quien lo monta (`EditProfilePage`)
 * decide cuándo hay datos suficientes para montar el formulario, y este
 * componente no necesita saber que existe una petición de red detrás.
 *
 * Igual que `ProfileMethodSelector` (CM-46), sigue la regla de CLAUDE.md
 * §14.7 aunque viva en `features`: no llama `useTranslation`, todo texto
 * visible entra como prop obligatoria (consistencia deliberada con ese
 * organismo, no la alternativa de traducir aquí mismo).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { cn } from '@/utils/cn';
import { Input } from '@/design-system/atoms/Input';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
import { FormField } from '@/design-system/molecules/FormField';
import { NAME_MAX_LENGTH, SUMMARY_MAX_LENGTH } from '../../model/profile.constants';
import { generalInfoSchema, type GeneralInfoFormValues } from '../../schemas/generalInfo.schema';

interface GeneralInfoFormProps {
  /** Id del `<form>` que el botón primario del `WizardLayout` envía. */
  formId: string;
  name: string;
  summary: string;
  /** `true` mientras la mutación de guardado está en curso: deshabilita los campos. */
  isSaving?: boolean;
  onSubmit: (values: GeneralInfoFormValues) => void;
  nameLabel: string;
  /** CA-2.3.5: `name` vacío. */
  nameErrorRequired: string;
  /** CA-2.3.5: `name` mayor a 120 caracteres. */
  nameErrorTooLong: string;
  summaryLabel: string;
  summaryHelperText?: string;
  /** CA-2.3.3: red de seguridad si `summary` llega a superar 2000 caracteres pese al `maxLength` del campo. */
  summaryErrorTooLong: string;
  /** Recibe el conteo y el máximo ya interpolados (ver `CharacterCounter`). */
  summaryCounterLabel: (count: number, max: number) => string;
  className?: string;
}

export function GeneralInfoForm({
  formId,
  name,
  summary,
  isSaving = false,
  onSubmit,
  nameLabel,
  nameErrorRequired,
  nameErrorTooLong,
  summaryLabel,
  summaryHelperText,
  summaryErrorTooLong,
  summaryCounterLabel,
  className,
}: GeneralInfoFormProps) {
  const { control, handleSubmit } = useForm<GeneralInfoFormValues>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: { name, summary },
  });

  return (
    <form
      id={formId}
      className={cn('gap-space-5 flex flex-col', className)}
      // `handleSubmit` devuelve una función async (el resolver de zod lo es);
      // el `onSubmit` nativo espera `void`, de ahí el `void` explícito.
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormField
            label={nameLabel}
            error={
              fieldState.error?.type === 'too_small'
                ? nameErrorRequired
                : fieldState.error?.type === 'too_big'
                  ? nameErrorTooLong
                  : undefined
            }
          >
            <Input
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={NAME_MAX_LENGTH}
              state={isSaving ? 'disabled' : fieldState.error ? 'error' : 'default'}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="summary"
        render={({ field, fieldState }) => (
          <div className="gap-space-1 flex flex-col">
            <FormField
              label={summaryLabel}
              helperText={fieldState.error ? undefined : summaryHelperText}
              error={fieldState.error?.type === 'too_big' ? summaryErrorTooLong : undefined}
            >
              <Input
                type="textarea"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={SUMMARY_MAX_LENGTH}
                state={isSaving ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
            <CharacterCounter
              count={field.value.length}
              max={SUMMARY_MAX_LENGTH}
              formatLabel={summaryCounterLabel}
            />
          </div>
        )}
      />
    </form>
  );
}
