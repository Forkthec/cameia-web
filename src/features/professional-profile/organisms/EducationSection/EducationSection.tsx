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
 * CM-273 (PR 1, SPEC.md §3.3 y D-K, D-M): las dos fechas son `MonthField`
 * (máscara «mm/aaaa» y panel de mes). El esquema se crea con el mes actual
 * que calcula la página (`currentMonth`) y entrega «AAAA-MM» a `onAdd`.
 *
 * CM-273 (PR 2, SPEC.md §3.3 y D-V, D-AB, D-AC, D-AG): institución y título muestran su mensaje de longitud
 * bajo el campo; con `maxItems` alcanzado el formulario sigue visible pero «Agregar» queda deshabilitado y el
 * envío no sale. `onAdd` y `onRemove` devuelven la promesa de la mutación: la sección activa una guarda
 * síncrona (`useRef`) al empezar, la suelta en `finally` y atrapa el rechazo sin propagarlo, porque el mensaje
 * de error lo decide la página.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que `GeneralInfoForm`
 * y `ProfileMethodSelector`): todo texto visible entra por prop obligatoria.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';
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
import { MonthField } from '@/design-system/molecules/MonthField';
import type { EducationItem } from '../../model/profile.types';
import {
  createEducationSchema,
  educationSchemaErrorCodes,
  EMPTY_EDUCATION_VALUES,
  type EducationFormValues,
} from '../../schemas/education.schema';

/** `type` con el que `setError` marca un error que viene del servidor: su `message` ya es el texto final. */
const SERVER_ERROR_TYPE = 'server';

interface EducationSectionProps {
  /** Id del `<form>` de alta de un ítem nuevo. */
  formId: string;
  /** Formaciones ya persistidas, desde la caché de `useProfileQuery` — nunca estado de formulario. */
  items: EducationItem[];
  /** Devuelve la promesa de la mutación; la sección atrapa su rechazo (el mensaje lo decide la página). */
  onAdd: (values: EducationFormValues) => Promise<unknown>;
  onRemove: (educationId: string) => Promise<unknown>;
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
  /** Mensaje de un título de más de 150 caracteres (CA-2.4.28). */
  degreeErrorTooLong: string;
  institutionLabel: string;
  institutionPlaceholder: string;
  institutionErrorRequired: string;
  /** Mensaje de una institución de más de 150 caracteres (CA-2.4.28). */
  institutionErrorTooLong: string;
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
  /** Mes actual en UTC («AAAA-MM»); lo calcula la página (D-M) y alimenta el esquema y los meses apagados del panel. */
  currentMonth: string;
  /** Locale de la interfaz, para los nombres de los meses del panel. */
  locale: string;
  /** Textos ya traducidos de las dos entradas de fecha. */
  monthFieldTexts: {
    placeholder: string;
    openPanelLabel: string;
    panelLabel: string;
    previousYearLabel: string;
    nextYearLabel: string;
  };
  /** Mensaje de una fecha que no es «mm/aaaa» válido (CA-2.4.44 y 60). */
  dateErrorFormat: string;
  /** Mensaje de una fecha posterior al mes actual (CA-2.4.34 y 35). */
  dateErrorFuture: string;
  /** Tope de formaciones (D-V); sin él la sección no limita el alta. */
  maxItems?: number;
  /** Mensaje que se muestra al alcanzar `maxItems` (CA-2.4.10). */
  maxItemsMessage?: string;
  /**
   * Errores del servidor por campo (D-T), ya traducidos por la página: la sección solo los aplica con `setError`
   * y no decide textos. Cada rechazo llega como un objeto nuevo, así que dos rechazos iguales se vuelven a pintar.
   */
  serverFieldErrors?: { startDate?: string; endDate?: string };
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
  degreeErrorTooLong,
  institutionLabel,
  institutionPlaceholder,
  institutionErrorRequired,
  institutionErrorTooLong,
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
  currentMonth,
  locale,
  monthFieldTexts,
  dateErrorFormat,
  dateErrorFuture,
  maxItems,
  maxItemsMessage,
  serverFieldErrors,
  addErrorMessage,
  removeErrorMessage,
  confirmationMessage,
  className,
}: EducationSectionProps) {
  const headingId = useId();
  const schema = useMemo(() => createEducationSchema(currentMonth), [currentMonth]);
  const { control, handleSubmit, watch, setValue, reset, setError, formState } = useForm<
    EducationFormValues,
    unknown,
    EducationFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_EDUCATION_VALUES,
  });

  /** Mensaje de las reglas de fecha comunes a inicio y fin; `undefined` si el código es de otra regla. */
  function getDateRuleError(code: string | undefined) {
    if (code === educationSchemaErrorCodes.INVALID_DATE_FORMAT) return dateErrorFormat;
    if (code === educationSchemaErrorCodes.DATE_IN_FUTURE) return dateErrorFuture;
    return undefined;
  }
  /** Como `getDateRuleError`, y además devuelve tal cual el texto de un error del servidor (D-T). */
  function getDateFieldError(error: { type?: string; message?: string } | undefined) {
    return error?.type === SERVER_ERROR_TYPE ? error.message : getDateRuleError(error?.message);
  }
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

  useEffect(() => {
    if (!serverFieldErrors) return;
    if (serverFieldErrors.startDate) {
      setError('startDate', { type: SERVER_ERROR_TYPE, message: serverFieldErrors.startDate });
    }
    if (serverFieldErrors.endDate) {
      setError('endDate', { type: SERVER_ERROR_TYPE, message: serverFieldErrors.endDate });
    }
  }, [serverFieldErrors, setError]);

  useEffect(() => {
    if (formState.isDirty) useUnsavedChangesStore.getState().setUnsavedChanges(true);
  }, [formState.isDirty]);

  useEffect(() => {
    return () => useUnsavedChangesStore.getState().setUnsavedChanges(false);
  }, []);

  const isAtMax = maxItems !== undefined && items.length >= maxItems;

  // Guardas síncronas (D-AC, D-AG): `disabled` llega con el re-render y dos envíos en el mismo turno lo
  // atraviesan (DF-004); la `ref` se activa y se suelta con la promesa, no con `isAdding`.
  const isAddingRef = useRef(false);
  const removingIdsRef = useRef(new Set<string>());

  async function addItem(values: EducationFormValues) {
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    try {
      await onAdd(values);
    } catch {
      // El mensaje lo decide la página con el estado de la mutación, no con este rechazo (D-AG).
    } finally {
      isAddingRef.current = false;
    }
  }

  async function removeItem(educationId: string) {
    if (removingIdsRef.current.has(educationId)) return;
    removingIdsRef.current.add(educationId);
    try {
      await onRemove(educationId);
    } catch {
      // Igual que en el alta: el error de la baja lo muestra la página (D-AG).
    } finally {
      removingIdsRef.current.delete(educationId);
    }
  }

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
              <div className="gap-space-1 flex min-w-0 flex-col">
                <p className="text-body text-text-primary font-semibold wrap-anywhere">
                  {item.degree}
                </p>
                <p className="text-small text-text-muted wrap-anywhere">{item.institution}</p>
                <p className="text-small text-text-muted wrap-anywhere">{formatItemPeriod(item)}</p>
              </div>
              <Button
                variant="icon"
                size="sm"
                className="shrink-0"
                icon={<Icon name="trash" />}
                onClick={() => void removeItem(item.id)}
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
      {isAtMax && maxItemsMessage ? (
        <AlertInline variant="info">{maxItemsMessage}</AlertInline>
      ) : null}

      <form
        id={formId}
        className="gap-space-4 flex flex-col"
        onSubmit={(event) => {
          // Enter dentro de un campo envía el formulario aunque el botón esté deshabilitado.
          if (isAtMax) {
            event.preventDefault();
            return;
          }
          void handleSubmit(addItem)(event);
        }}
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
              error={
                fieldState.error?.type === 'too_small'
                  ? degreeErrorRequired
                  : fieldState.error?.type === 'too_big'
                    ? degreeErrorTooLong
                    : undefined
              }
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
          name="institution"
          render={({ field, fieldState }) => (
            <FormField
              label={institutionLabel}
              error={
                fieldState.error?.type === 'too_small'
                  ? institutionErrorRequired
                  : fieldState.error?.type === 'too_big'
                    ? institutionErrorTooLong
                    : undefined
              }
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
              error={
                fieldState.error?.type === 'too_small'
                  ? startDateErrorRequired
                  : getDateFieldError(fieldState.error)
              }
            >
              <MonthField
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                currentMonth={currentMonth}
                locale={locale}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
                {...monthFieldTexts}
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
                    : getDateFieldError(fieldState.error)
                }
              >
                <MonthField
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  currentMonth={currentMonth}
                  locale={locale}
                  state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
                  {...monthFieldTexts}
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
          disabled={isAtMax}
          {...buttonLoadingProps(isAdding, addingButtonLabel)}
        >
          {addButtonLabel}
        </Button>
      </form>
    </section>
  );
}
