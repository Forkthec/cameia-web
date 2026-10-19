/**
 * Sección «Experiencia Laboral» del Formulario de Perfil Profesional
 * (HU-2.4, PRT-02.03, CM-61): lista de experiencias ya persistidas +
 * formulario de alta de una nueva. Layout y copy verificados contra el
 * prototipo real de Figma (nodo `132:2503` lg, acordeón `142:675` sm) —
 * CLAUDE.md §13.
 *
 * Mismo patrón que `EducationSection` (alta con `POST` inmediato, baja con
 * `DELETE` inmediato, sin `useFieldArray` — SPEC.md §9, decisión D-A/D-C).
 *
 * Los dos checkboxes del frame («Trabajo aquí actualmente» / «No recuerdo
 * la fecha exacta de finalización») son mutuamente excluyentes: marcar uno
 * desmarca el otro y limpia la fecha de fin, que además se OCULTA mientras
 * cualquiera de los dos esté marcado. `employmentStatus` (el enum real del
 * backend, `CURRENT`/`UNKNOWN_END`/`ENDED`) no es un campo de este
 * formulario — se deriva de estos dos booleanos en `profile.mapper.ts`
 * (SPEC.md §9, decisión D-F): el organismo no conoce el contrato.
 *
 * CM-273 (PR 1, SPEC.md §3.3 y D-K, D-M): las dos fechas son `MonthField`
 * (máscara «mm/aaaa» y panel de mes). El esquema se crea con el mes actual
 * que calcula la página (`currentMonth`) y entrega «AAAA-MM» a `onAdd`.
 *
 * CM-273 (PR 2, SPEC.md §3.3 y D-V, D-X, D-AB, D-AC, D-AG): la fecha de inicio es opcional; los campos no cortan
 * lo escrito y muestran su mensaje de longitud bajo el campo; la descripción se cuenta con `unicodeLength`; con
 * `maxItems` alcanzado el formulario sigue visible pero «Agregar» queda deshabilitado y el envío no sale. `onAdd`
 * y `onRemove` devuelven la promesa de la mutación: la sección activa una guarda síncrona (`useRef`) al empezar,
 * la suelta en `finally` y atrapa el rechazo sin propagarlo, porque el mensaje de error lo decide la página.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7): todo texto visible entra por prop
 * obligatoria.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';
import { buttonLoadingProps } from '@/utils/buttonLoadingProps';
import { cn } from '@/utils/cn';
import { unicodeLength } from '@/utils/unicodeLength';
import { Button } from '@/design-system/atoms/Button';
import { Checkbox } from '@/design-system/atoms/Checkbox';
import { Icon } from '@/design-system/icons/Icon';
import { Input } from '@/design-system/atoms/Input';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FormField } from '@/design-system/molecules/FormField';
import { MonthField } from '@/design-system/molecules/MonthField';
import { DESCRIPTION_MAX_LENGTH } from '../../model/profile.constants';
import type { WorkExperienceItem } from '../../model/profile.types';
import {
  createWorkExperienceSchema,
  EMPTY_WORK_EXPERIENCE_VALUES,
  workExperienceSchemaErrorCodes,
  type WorkExperienceFormValues,
} from '../../schemas/workExperience.schema';

/** `type` con el que `setError` marca un error que viene del servidor: su `message` ya es el texto final. */
const SERVER_ERROR_TYPE = 'server';

/** Campos del formulario a los que la página puede entregar un error del servidor ya traducido (D-T, CM-336). */
const SERVER_ERROR_FIELDS = ['startDate', 'endDate', 'company', 'position', 'description'] as const;
type ServerErrorField = (typeof SERVER_ERROR_FIELDS)[number];

interface WorkExperienceSectionProps {
  formId: string;
  items: WorkExperienceItem[];
  /** Devuelve la promesa de la mutación; la sección atrapa su rechazo (el mensaje lo decide la página). */
  onAdd: (values: WorkExperienceFormValues) => Promise<unknown>;
  onRemove: (workExperienceId: string) => Promise<unknown>;
  isAdding?: boolean;
  removingId?: string | null;
  showSectionTitle?: boolean;

  sectionTitle: string;
  positionLabel: string;
  positionPlaceholder: string;
  positionErrorRequired: string;
  /** Mensaje de un cargo de más de 100 caracteres (CA-2.4.18). */
  positionErrorTooLong: string;
  companyLabel: string;
  companyPlaceholder: string;
  companyErrorRequired: string;
  /** Mensaje de una empresa de más de 100 caracteres (CA-2.4.18). */
  companyErrorTooLong: string;
  startDateLabel: string;
  endDateLabel: string;
  endDateErrorRequired: string;
  endDateErrorBeforeStart: string;
  currentJobLabel: string;
  unknownEndLabel: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  /** Mensaje de una descripción de más de 500 caracteres (CA-2.4.12). */
  descriptionErrorTooLong: string;
  /** Recibe el conteo y el máximo ya interpolados (ver `CharacterCounter`). */
  descriptionCounterLabel: (count: number, max: number) => string;
  addButtonLabel: string;
  addingButtonLabel: string;
  removeItemLabel: (item: WorkExperienceItem) => string;
  removingItemLabel: string;
  /** Texto del periodo ya formateado por quien monta este organismo (tiene el locale). */
  formatItemPeriod: (item: WorkExperienceItem) => string;
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
  /** Mensaje de una fecha que no es «mm/aaaa» válido (CA-2.4.43, 44 y 60). */
  dateErrorFormat: string;
  /** Mensaje de una fecha posterior al mes actual (CA-2.4.25, 26, 34 y 35). */
  dateErrorFuture: string;
  /** Tope de experiencias (D-V); sin él la sección no limita el alta. */
  maxItems?: number;
  /** Mensaje que se muestra al alcanzar `maxItems` (CA-2.4.47). */
  maxItemsMessage?: string;
  /**
   * Errores del servidor por campo (D-T), ya traducidos por la página: la sección solo los aplica con `setError`
   * y no decide textos. Cada rechazo llega como un objeto nuevo, así que dos rechazos iguales se vuelven a pintar.
   */
  serverFieldErrors?: Partial<Record<ServerErrorField, string>>;
  addErrorMessage?: string;
  removeErrorMessage?: string;
  confirmationMessage?: string;
  className?: string;
}

export function WorkExperienceSection({
  formId,
  items,
  onAdd,
  onRemove,
  isAdding = false,
  removingId = null,
  showSectionTitle = true,
  sectionTitle,
  positionLabel,
  positionPlaceholder,
  positionErrorRequired,
  positionErrorTooLong,
  companyLabel,
  companyPlaceholder,
  companyErrorRequired,
  companyErrorTooLong,
  startDateLabel,
  endDateLabel,
  endDateErrorRequired,
  endDateErrorBeforeStart,
  currentJobLabel,
  unknownEndLabel,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionErrorTooLong,
  descriptionCounterLabel,
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
}: WorkExperienceSectionProps) {
  const headingId = useId();
  const schema = useMemo(() => createWorkExperienceSchema(currentMonth), [currentMonth]);
  const { control, handleSubmit, watch, setValue, reset, setError, formState } = useForm<
    WorkExperienceFormValues,
    unknown,
    WorkExperienceFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_WORK_EXPERIENCE_VALUES,
  });

  /** Mensaje de las reglas de fecha comunes a inicio y fin; `undefined` si el código es de otra regla. */
  function getDateRuleError(code: string | undefined) {
    if (code === workExperienceSchemaErrorCodes.INVALID_DATE_FORMAT) return dateErrorFormat;
    if (code === workExperienceSchemaErrorCodes.DATE_IN_FUTURE) return dateErrorFuture;
    return undefined;
  }
  /** Como `getDateRuleError`, y además devuelve tal cual el texto de un error del servidor (D-T). */
  function getDateFieldError(error: { type?: string; message?: string } | undefined) {
    return error?.type === SERVER_ERROR_TYPE ? error.message : getDateRuleError(error?.message);
  }
  // `watch` (mismo motivo que en `EducationSection`): estos dos booleanos
  // deciden si se renderiza OTRO campo (endDate), no solo el suyo propio.
  // El aviso de `eslint-plugin-react-hooks` sobre React Compiler es
  // informativo, no bloquea `pnpm lint`.
  const isCurrent = watch('isCurrent');
  const unknownEnd = watch('unknownEnd');
  const stillOpen = isCurrent || unknownEnd;

  const previousItemCount = useRef(items.length);
  useEffect(() => {
    if (items.length > previousItemCount.current) {
      reset(EMPTY_WORK_EXPERIENCE_VALUES);
    }
    previousItemCount.current = items.length;
  }, [items.length, reset]);

  useEffect(() => {
    if (!serverFieldErrors) return;
    for (const field of SERVER_ERROR_FIELDS) {
      const message = serverFieldErrors[field];
      if (message) setError(field, { type: SERVER_ERROR_TYPE, message });
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

  async function addItem(values: WorkExperienceFormValues) {
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

  async function removeItem(workExperienceId: string) {
    if (removingIdsRef.current.has(workExperienceId)) return;
    removingIdsRef.current.add(workExperienceId);
    try {
      await onRemove(workExperienceId);
    } catch {
      // Igual que en el alta: el error de la baja lo muestra la página (D-AG).
    } finally {
      removingIdsRef.current.delete(workExperienceId);
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
                  {item.position}
                </p>
                <p className="text-small text-text-muted wrap-anywhere">{item.company}</p>
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
          name="position"
          render={({ field, fieldState }) => (
            <FormField
              label={positionLabel}
              error={
                fieldState.error?.type === SERVER_ERROR_TYPE
                  ? fieldState.error.message
                  : fieldState.error?.type === 'too_small'
                    ? positionErrorRequired
                    : fieldState.error?.type === 'too_big'
                      ? positionErrorTooLong
                      : undefined
              }
            >
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={positionPlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="company"
          render={({ field, fieldState }) => (
            <FormField
              label={companyLabel}
              error={
                fieldState.error?.type === SERVER_ERROR_TYPE
                  ? fieldState.error.message
                  : fieldState.error?.type === 'too_small'
                    ? companyErrorRequired
                    : fieldState.error?.type === 'too_big'
                      ? companyErrorTooLong
                      : undefined
              }
            >
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={companyPlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

        <div className="gap-space-4 grid md:grid-cols-2">
          <Controller
            control={control}
            name="startDate"
            render={({ field, fieldState }) => (
              <FormField label={startDateLabel} error={getDateFieldError(fieldState.error)}>
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

          {!stillOpen && (
            <Controller
              control={control}
              name="endDate"
              render={({ field, fieldState }) => (
                <FormField
                  label={endDateLabel}
                  error={
                    fieldState.error?.message === workExperienceSchemaErrorCodes.END_DATE_REQUIRED
                      ? endDateErrorRequired
                      : fieldState.error?.message ===
                          workExperienceSchemaErrorCodes.END_BEFORE_START
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
        </div>

        <Controller
          control={control}
          name="isCurrent"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(event) => {
                field.onChange(event);
                if (event.target.checked) {
                  setValue('unknownEnd', false);
                  setValue('endDate', '');
                }
              }}
              disabled={isAdding}
            >
              {currentJobLabel}
            </Checkbox>
          )}
        />

        <Controller
          control={control}
          name="unknownEnd"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={(event) => {
                field.onChange(event);
                if (event.target.checked) {
                  setValue('isCurrent', false);
                  setValue('endDate', '');
                }
              }}
              disabled={isAdding}
            >
              {unknownEndLabel}
            </Checkbox>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <div className="gap-space-1 flex flex-col">
              <FormField
                label={descriptionLabel}
                error={
                  fieldState.error?.type === SERVER_ERROR_TYPE
                    ? fieldState.error.message
                    : fieldState.error?.message ===
                        workExperienceSchemaErrorCodes.DESCRIPTION_TOO_LONG
                      ? descriptionErrorTooLong
                      : undefined
                }
              >
                <Input
                  type="textarea"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={descriptionPlaceholder}
                  state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
                />
              </FormField>
              <CharacterCounter
                count={unicodeLength(field.value)}
                max={DESCRIPTION_MAX_LENGTH}
                formatLabel={descriptionCounterLabel}
              />
            </div>
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
