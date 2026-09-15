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
 * Sin `useTranslation` (CLAUDE.md §14.7): todo texto visible entra por prop
 * obligatoria.
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
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FormField } from '@/design-system/molecules/FormField';
import { DESCRIPTION_MAX_LENGTH } from '../../model/profile.constants';
import type { WorkExperienceItem } from '../../model/profile.types';
import {
  EMPTY_WORK_EXPERIENCE_VALUES,
  workExperienceSchema,
  workExperienceSchemaErrorCodes,
  type WorkExperienceFormValues,
} from '../../schemas/workExperience.schema';

interface WorkExperienceSectionProps {
  formId: string;
  items: WorkExperienceItem[];
  onAdd: (values: WorkExperienceFormValues) => void;
  onRemove: (workExperienceId: string) => void;
  isAdding?: boolean;
  removingId?: string | null;
  showSectionTitle?: boolean;

  sectionTitle: string;
  positionLabel: string;
  positionPlaceholder: string;
  positionErrorRequired: string;
  companyLabel: string;
  companyPlaceholder: string;
  companyErrorRequired: string;
  startDateLabel: string;
  startDateErrorRequired: string;
  endDateLabel: string;
  endDateErrorRequired: string;
  endDateErrorBeforeStart: string;
  currentJobLabel: string;
  unknownEndLabel: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
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
  companyLabel,
  companyPlaceholder,
  companyErrorRequired,
  startDateLabel,
  startDateErrorRequired,
  endDateLabel,
  endDateErrorRequired,
  endDateErrorBeforeStart,
  currentJobLabel,
  unknownEndLabel,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionCounterLabel,
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
}: WorkExperienceSectionProps) {
  const headingId = useId();
  const { control, handleSubmit, watch, setValue, reset } = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: EMPTY_WORK_EXPERIENCE_VALUES,
  });
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
                <p className="text-body text-text-primary font-semibold">{item.position}</p>
                <p className="text-small text-text-muted">{item.company}</p>
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
          name="position"
          render={({ field, fieldState }) => (
            <FormField
              label={positionLabel}
              error={fieldState.error?.type === 'too_small' ? positionErrorRequired : undefined}
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
              error={fieldState.error?.type === 'too_small' ? companyErrorRequired : undefined}
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
              <FormField label={descriptionLabel}>
                <Input
                  type="textarea"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={descriptionPlaceholder}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
                />
              </FormField>
              <CharacterCounter
                count={field.value.length}
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
          {...buttonLoadingProps(isAdding, addingButtonLabel)}
        >
          {addButtonLabel}
        </Button>
      </form>
    </section>
  );
}
