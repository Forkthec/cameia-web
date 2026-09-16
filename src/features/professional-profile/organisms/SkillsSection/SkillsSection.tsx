/**
 * Sección «Habilidades» del Formulario de Perfil Profesional (HU-2.5,
 * PRT-02.03, CM-65): lista de habilidades ya persistidas + formulario de
 * alta de una nueva (texto libre + nivel). El Figma vinculado a esta tarea
 * es solo guía visual desactualizada (instrucción explícita del PO) — el
 * patrón real que manda es el ya construido por
 * `EducationSection`/`WorkExperienceSection` (CM-61): alta con `POST`
 * inmediato, baja con `DELETE` inmediato, sin `useFieldArray` (SPEC.md §9,
 * decisión D-A). El `<form>` interno solo gestiona el ítem que se está a
 * punto de agregar; la lista visible (`items`) es siempre la caché del
 * servidor.
 *
 * Las habilidades se muestran como `Chip` (átomo de CM-61, ya soporta
 * remoción con `onRemove`/`removeLabel`) en vez de tarjetas — no hace falta
 * ningún átomo nuevo de `design-system`. `Chip` no tiene estado de carga
 * propio (a diferencia de `Button`), así que un `DELETE` en curso no se ve
 * distinto de uno resuelto: mismo límite que ya acepta el uso de `Chip` en
 * `Combobox` (CM-61/CM-69) para sus seleccionados.
 *
 * El duplicado (mismo texto ignorando mayúsculas y espacios) se valida en
 * este organismo, no en el schema (`skill.schema.ts` no conoce `items`):
 * si el texto normalizado ya existe, se marca el campo con `setError`
 * manual en vez de llamar a `onAdd` — salvaguarda de cliente; el backend
 * real también lo rechaza con `409` (memo del PO del 13-sep, C-06).
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
import { Chip } from '@/design-system/atoms/Chip';
import { Icon } from '@/design-system/icons/Icon';
import { Input } from '@/design-system/atoms/Input';
import { Select, type SelectOption } from '@/design-system/atoms/Select';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FormField } from '@/design-system/molecules/FormField';
import type { SkillItem } from '../../model/profile.types';
import {
  EMPTY_SKILL_VALUES,
  skillSchema,
  skillSchemaErrorCodes,
  type SkillFormValues,
} from '../../schemas/skill.schema';

interface SkillsSectionProps {
  /** Id del `<form>` de alta de un ítem nuevo. */
  formId: string;
  /** Habilidades ya persistidas, desde la caché de `useProfileQuery` — nunca estado de formulario. */
  items: SkillItem[];
  onAdd: (values: SkillFormValues) => void;
  onRemove: (skillId: string) => void;
  /** `true` mientras el `POST` de alta está en curso. */
  isAdding?: boolean;
  /** `false` en el acordeón `sm`, donde el encabezado del propio acordeón ya es el título. */
  showSectionTitle?: boolean;

  sectionTitle: string;
  skillNameLabel: string;
  skillNamePlaceholder: string;
  skillNameErrorRequired: string;
  skillNameErrorTooLong: string;
  skillNameErrorDuplicate: string;
  levelLabel: string;
  levelPlaceholder: string;
  levelOptions: SelectOption[];
  levelErrorRequired: string;
  /** Texto visible del chip para un ítem ya persistido (p. ej. "React · Avanzado"). */
  formatItemLabel: (item: SkillItem) => string;
  addButtonLabel: string;
  addingButtonLabel: string;
  /** Nombre accesible del botón de quitar un ítem concreto (p. ej. "Quitar React"). */
  removeItemLabel: (item: SkillItem) => string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  addErrorMessage?: string;
  removeErrorMessage?: string;
  confirmationMessage?: string;
  className?: string;
}

export function SkillsSection({
  formId,
  items,
  onAdd,
  onRemove,
  isAdding = false,
  showSectionTitle = true,
  sectionTitle,
  skillNameLabel,
  skillNamePlaceholder,
  skillNameErrorRequired,
  skillNameErrorTooLong,
  skillNameErrorDuplicate,
  levelLabel,
  levelPlaceholder,
  levelOptions,
  levelErrorRequired,
  formatItemLabel,
  addButtonLabel,
  addingButtonLabel,
  removeItemLabel,
  emptyStateTitle,
  emptyStateDescription,
  addErrorMessage,
  removeErrorMessage,
  confirmationMessage,
  className,
}: SkillsSectionProps) {
  const headingId = useId();
  const { control, handleSubmit, reset, setError } = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: EMPTY_SKILL_VALUES,
  });

  const previousItemCount = useRef(items.length);
  useEffect(() => {
    if (items.length > previousItemCount.current) {
      reset(EMPTY_SKILL_VALUES);
    }
    previousItemCount.current = items.length;
  }, [items.length, reset]);

  function onValid(values: SkillFormValues) {
    const normalized = values.skillName.trim().toLowerCase();
    const isDuplicate = items.some((item) => item.skillName.trim().toLowerCase() === normalized);
    if (isDuplicate) {
      setError('skillName', { type: 'manual', message: skillSchemaErrorCodes.DUPLICATE });
      return;
    }
    onAdd(values);
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
        <div className="gap-space-2 flex flex-wrap">
          {items.map((item) => (
            <Chip
              key={item.id}
              onRemove={() => onRemove(item.id)}
              removeLabel={removeItemLabel(item)}
            >
              {formatItemLabel(item)}
            </Chip>
          ))}
        </div>
      )}

      {confirmationMessage ? (
        <AlertInline variant="success">{confirmationMessage}</AlertInline>
      ) : null}
      {addErrorMessage ? <AlertInline variant="error">{addErrorMessage}</AlertInline> : null}
      {removeErrorMessage ? <AlertInline variant="error">{removeErrorMessage}</AlertInline> : null}

      <form
        id={formId}
        className="gap-space-4 flex flex-col"
        onSubmit={(event) => void handleSubmit(onValid)(event)}
        noValidate
      >
        <Controller
          control={control}
          name="skillName"
          render={({ field, fieldState }) => (
            <FormField
              label={skillNameLabel}
              error={
                fieldState.error?.type === 'too_small'
                  ? skillNameErrorRequired
                  : fieldState.error?.type === 'too_big'
                    ? skillNameErrorTooLong
                    : fieldState.error?.message === skillSchemaErrorCodes.DUPLICATE
                      ? skillNameErrorDuplicate
                      : undefined
              }
            >
              <Input
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={skillNamePlaceholder}
                state={isAdding ? 'disabled' : fieldState.error ? 'error' : 'default'}
              />
            </FormField>
          )}
        />

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
