/**
 * Sección «Formación académica» del Formulario de Perfil Profesional
 * (HU-2.4, PRT-02.03, CM-61): lista de formaciones ya persistidas +
 * formulario de alta de una nueva. Layout y copy verificados contra el
 * prototipo real de Figma (nodo `132:2467` lg, acordeón `142:670`/`142:675`
 * sm) — CLAUDE.md §13.
 *
 * A diferencia de `GeneralInfoForm` (un solo `<form>` que edita el perfil
 * completo), aquí cada formación es su propio recurso: se agrega con un
 * `POST` inmediato y se elimina con un `DELETE` inmediato — no hay
 * "borrador" que guardar (SPEC.md §9, decisión D-C). Por eso este
 * componente NO usa `useFieldArray`: la lista visible (`items`) es estado
 * de servidor, ya en la caché de TanStack Query, nunca duplicado dentro del
 * formulario (CLAUDE.md §3.6) — el `<form>` interno solo gestiona el ítem
 * que se está a punto de agregar.
 *
 * Campos agregados que Figma NO dibuja: «Campo de estudio» y «Fecha de
 * inicio» (el backend real, `AddEducationRequest`/`Education.java` de
 * `cameia-perfil`, sí los exige — `startDate` es obligatoria) y el
 * checkbox «En curso» (`inProgress`, que el dominio sí soporta). Bloqueo
 * C-12 de `SPEC.md` §8: el comportamiento lo fija el contrato real
 * (CLAUDE.md §16), no lo que el frame alcanzó a dibujar. «Campo de
 * estudio» es el único de los tres NO obligatorio: el backend tampoco lo
 * valida (`Education.java` no lo pasa por `requireNonBlankMax`).
 *
 * El formulario se resetea a valores vacíos cuando `items` crece (detectado
 * comparando su longitud entre renders) — es la señal de que el `POST` que
 * disparó `onAdd` tuvo éxito y el ítem ya llegó a la caché. Si `onAdd`
 * falla, `items` no cambia, así que el formulario conserva lo que el
 * usuario escribió para que pueda corregir sin retipear todo
 * (`addErrorMessage` se lo indica con un `AlertInline`).
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que `GeneralInfoForm`
 * y `ProfileMethodSelector`): todo texto visible entra por prop obligatoria.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { buttonLoadingProps } from '@/utils/buttonLoadingProps';
import { cn } from '@/utils/cn';
import { Button } from '@/design-system/atoms/Button';
import { Checkbox } from '@/design-system/atoms/Checkbox';
import { Icon } from '@/design-system/icons/Icon';
import { Input } from '@/design-system/atoms/Input';
import { Select, type SelectOption } from '@/design-system/atoms/Select';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FormField } from '@/design-system/molecules/FormField';
import type { EducationItem } from '../../model/profile.types';
import {
  educationSchema,
  educationSchemaErrorCodes,
  EMPTY_EDUCATION_VALUES,
  type EducationFormValues,
} from '../../schemas/education.schema';

interface EducationSectionProps {
  /** Id del `<form>` de alta de un ítem nuevo. */
  formId: string;
  /** Formaciones ya persistidas, desde la caché de `useProfileQuery` — nunca estado de formulario. */
  items: EducationItem[];
  onAdd: (values: EducationFormValues) => void;
  onRemove: (educationId: string) => void;
  /** `true` mientras el `POST` de alta está en curso. */
  isAdding?: boolean;
  /** Id del ítem cuyo `DELETE` está en curso: solo ese botón queda deshabilitado y con carga. */
  removingId?: string | null;
  /** `false` en el acordeón `sm`, donde el encabezado del propio acordeón ya es el título. */
  showSectionTitle?: boolean;

  sectionTitle: string;
  levelLabel: string;
  levelPlaceholder: string;
  levelOptions: SelectOption[];
  levelErrorRequired: string;
  degreeLabel: string;
  degreePlaceholder: string;
  degreeErrorRequired: string;
  fieldOfStudyLabel: string;
  fieldOfStudyPlaceholder: string;
  institutionLabel: string;
  institutionPlaceholder: string;
  institutionErrorRequired: string;
  startDateLabel: string;
  startDateErrorRequired: string;
  endDateLabel: string;
  /** Solo puede mostrarse cuando `inProgress` es falso: con el checkbox marcado el campo se oculta antes de que este error pueda surgir. */
  endDateErrorBeforeStart: string;
  inProgressLabel: string;
  addButtonLabel: string;
  addingButtonLabel: string;
  /** Nombre accesible del botón de eliminar un ítem concreto (p. ej. "Eliminar Ingeniería de Sistemas"). */
  removeItemLabel: (item: EducationItem) => string;
  removingItemLabel: string;
  /** Texto del periodo ya formateado por quien monta este organismo (tiene el locale; este componente no llama `Intl` por su cuenta). */
  formatItemPeriod: (item: EducationItem) => string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  addErrorMessage?: string;
  removeErrorMessage?: string;
  confirmationMessage?: string;
  className?: string;
}

export function EducationSection({
  formId,
  items,
  onAdd,
  onRemove,
  isAdding = false,
  removingId = null,
  showSectionTitle = true,
  sectionTitle,
  levelLabel,
  levelPlaceholder,
  levelOptions,
  levelErrorRequired,
  degreeLabel,
  degreePlaceholder,
  degreeErrorRequired,
  fieldOfStudyLabel,
  fieldOfStudyPlaceholder,
  institutionLabel,
  institutionPlaceholder,
  institutionErrorRequired,
  startDateLabel,
  startDateErrorRequired,
  endDateLabel,
  endDateErrorBeforeStart,
  inProgressLabel,
  addButtonLabel,
  addingButtonLabel,
  removeItemLabel,
  removingItemLabel,
  formatItemPeriod,
  emptyStateTitle,
  emptyStateDescription,
  addErrorMessage,
  removeErrorMessage,
  confirmationMessage,
  className,
}: EducationSectionProps) {
  const headingId = useId();
  const { control, handleSubmit, watch, setValue, reset } = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: EMPTY_EDUCATION_VALUES,
  });
  // `watch` (no un <Controller> aparte) porque este valor decide si se
  // renderiza OTRO campo (endDate), no solo el suyo propio — no hay forma
  // de "levantar" ese booleano fuera de un render-prop de Controller sin
  // duplicar estado. `eslint-plugin-react-hooks` avisa que React Compiler
  // no puede memoizar `watch()`; informativo, no bloquea `pnpm lint`.
  const inProgress = watch('inProgress');

  const previousItemCount = useRef(items.length);
  useEffect(() => {
    if (items.length > previousItemCount.current) {
      reset(EMPTY_EDUCATION_VALUES);
    }
    previousItemCount.current = items.length;
  }, [items.length, reset]);

  return (
    <section
      aria-label={showSectionTitle ? undefined : sectionTitle}
      aria-labelledby={showSectionTitle ? headingId : undefined}
      className={cn('gap-space-4 flex flex-col', className)}
    >
      {showSectionTitle ? (
        <h2 id={headingId} className="text-h2 font-display text-text-primary">
          {sectionTitle}
        </h2>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title={emptyStateTitle} description={emptyStateDescription} />
      ) : (
        <ul className="gap-space-3 flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="gap-space-3 border-border-subtle p-space-4 flex items-start justify-between rounded-md border"
            >
              <div className="gap-space-1 flex flex-col">
                <p className="text-body text-text-primary font-semibold">{item.degree}</p>
                <p className="text-small text-text-muted">{item.institution}</p>
                <p className="text-small text-text-muted">{formatItemPeriod(item)}</p>
              </div>
              <Button
                variant="icon"
                size="sm"
                icon={<Icon name="trash" />}
                onClick={() => onRemove(item.id)}
                disabled={removingId === item.id}
                {...buttonLoadingProps(removingId === item.id, removingItemLabel)}
              >
                {removeItemLabel(item)}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {confirmationMessage ? (
        <AlertInline variant="success">{confirmationMessage}</AlertInline>
      ) : null}
      {addErrorMessage ? <AlertInline variant="error">{addErrorMessage}</AlertInline> : null}
      {removeErrorMessage ? <AlertInline variant="error">{removeErrorMessage}</AlertInline> : null}

      <form
        id={formId}
        className="gap-space-4 flex flex-col"
        onSubmit={(event) => void handleSubmit(onAdd)(event)}
        noValidate
      >
        <Controller
          control={control}
          name="level"
          render={({ field, fieldState }) => (
            <FormField
              label={levelLabel}
              error={fieldState.error?.type === 'too_small' ? levelErrorRequired : undefined}
            >
              <Select
                options={levelOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={levelPlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="degree"
          render={({ field, fieldState }) => (
            <FormField
              label={degreeLabel}
              error={fieldState.error?.type === 'too_small' ? degreeErrorRequired : undefined}
            >
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={degreePlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="fieldOfStudy"
          render={({ field }) => (
            <FormField label={fieldOfStudyLabel}>
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={fieldOfStudyPlaceholder}
                state={isAdding ? 'disabled' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="institution"
          render={({ field, fieldState }) => (
            <FormField
              label={institutionLabel}
              error={fieldState.error?.type === 'too_small' ? institutionErrorRequired : undefined}
            >
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={institutionPlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="startDate"
          render={({ field, fieldState }) => (
            <FormField
              label={startDateLabel}
              error={fieldState.error?.type === 'too_small' ? startDateErrorRequired : undefined}
            >
              <Input
                type="date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        {!inProgress && (
          <Controller
            control={control}
            name="endDate"
            render={({ field, fieldState }) => (
              <FormField
                label={endDateLabel}
                error={
                  fieldState.error?.message === educationSchemaErrorCodes.END_BEFORE_START
                    ? endDateErrorBeforeStart
                    : undefined
                }
              >
                <Input
                  type="date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
                />
              </FormField>
            )}
          />
        )}

        <Controller
          control={control}
          name="inProgress"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(event) => {
                field.onChange(event);
                if (event.target.checked) setValue('endDate', '');
              }}
              disabled={isAdding}
            >
              {inProgressLabel}
            </Checkbox>
          )}
        />

        <Button
          type="submit"
          variant="tertiary"
          icon={<Icon name="plus" />}
          className="self-start"
          {...buttonLoadingProps(isAdding, addingButtonLabel)}
        >
          {addButtonLabel}
        </Button>
      </form>
    </section>
  );
}
