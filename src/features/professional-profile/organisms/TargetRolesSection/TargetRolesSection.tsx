/**
 * Sección «Roles Objetivo» del Formulario de Perfil Profesional (HU-2.11,
 * PRT-02.03, CM-69): lista de roles ya asociados al perfil + selector para
 * agregar uno nuevo del catálogo cerrado. El Figma vinculado a esta tarea es
 * solo guía visual desactualizada (instrucción explícita del PO para
 * CM-65/CM-69) — el patrón real que manda es el ya construido por
 * `EducationSection`/`WorkExperienceSection` (CM-61).
 *
 * A diferencia de esas dos secciones, no hay texto libre que capturar: el
 * catálogo es cerrado (`ProfessionalRole[]`, vía `useProfessionalRolesQuery`),
 * así que no hace falta un `useForm`/schema de validación — "agregar" es
 * elegir una opción de `Combobox` (que ya renderiza sus seleccionados como
 * `Chip` removible, construido en CM-61 anticipando este uso). Como aquí
 * `selected` se pasa siempre vacío (los roles ya persistidos se muestran en
 * la lista propia de abajo, no como chips del combobox), elegir una opción
 * dispara `onAdd` de inmediato — nunca "quitar" desde ese control.
 *
 * "Sustituir" es una acción propia, no "eliminar y agregar" (memo del PO del
 * 13-sep, C-05: el backend real conserva el id del Rol Objetivo vía
 * `PATCH`): cada ítem de la lista tiene su propio control de sustitución,
 * un `Select` acotado a los roles todavía no usados (más el propio, para
 * poder cancelar sin cambiar nada) que dispara `onSubstitute` al elegir.
 *
 * "Eliminar" el último rol objetivo solo se bloquea con el perfil ya
 * `COMPLETED` (`isProfileCompleted`) — con `IN_PROGRESS` sí se puede quedar
 * sin roles, igual que el backend real (`ProfileController.java#removeTargetRole`).
 *
 * Sin `useTranslation` (CLAUDE.md §14.7): todo texto visible entra por prop
 * obligatoria.
 */
import { useId, useState } from 'react';
import { buttonLoadingProps } from '@/utils/buttonLoadingProps';
import { cn } from '@/utils/cn';
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { Select, type SelectOption } from '@/design-system/atoms/Select';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { Combobox, type ComboboxOption } from '@/design-system/molecules/Combobox';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { FormField } from '@/design-system/molecules/FormField';
import { MAX_TARGET_ROLES } from '../../model/profile.constants';
import type { ProfessionalRole, TargetRoleItem } from '../../model/profile.types';

interface TargetRolesSectionProps {
  /** Roles ya persistidos, desde la caché de `useProfileQuery` — nunca estado de formulario. */
  items: TargetRoleItem[];
  /** Catálogo cerrado, desde `useProfessionalRolesQuery`. */
  catalog: ProfessionalRole[];
  onAdd: (professionalRoleId: string) => void;
  onSubstitute: (roleId: string, professionalRoleId: string) => void;
  onRemove: (roleId: string) => void;
  /** `true` mientras el `POST` de alta está en curso. */
  isAdding?: boolean;
  /** Id del Rol Objetivo cuyo `PATCH` de sustitución está en curso. */
  substitutingId?: string | null;
  /** Id del Rol Objetivo cuyo `DELETE` está en curso. */
  removingId?: string | null;
  /** El perfil ya está `COMPLETED`: bloquea eliminar el único rol restante. */
  isProfileCompleted?: boolean;
  /** `false` en el acordeón `sm`, donde el encabezado del propio acordeón ya es el título. */
  showSectionTitle?: boolean;

  sectionTitle: string;
  addLabel: string;
  addPlaceholder: string;
  /** Anunciado (`aria-live`) mientras el `POST` de alta está en curso: `Combobox` no tiene un estado de carga propio que deshabilitar. */
  addingLabel: string;
  noResultsLabel: string;
  /** Se llegó al máximo de roles objetivo: reemplaza el selector de alta. */
  maxReachedMessage: string;
  substituteFieldLabel: string;
  substitutePlaceholder: string;
  /** Nombre accesible del botón que abre el sustituto de un ítem concreto (p. ej. "Sustituir Desarrollador Backend"). */
  substituteItemLabel: (roleName: string) => string;
  substitutingItemLabel: string;
  /** Nombre accesible del botón de eliminar un ítem concreto (p. ej. "Eliminar Desarrollador Backend"). */
  removeItemLabel: (roleName: string) => string;
  removingItemLabel: string;
  /** Por qué "Eliminar" está deshabilitado en el último rol objetivo de un perfil activo. */
  removeLastRoleBlockedHint: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  addErrorMessage?: string;
  substituteErrorMessage?: string;
  removeErrorMessage?: string;
  confirmationMessage?: string;
  className?: string;
}

export function TargetRolesSection({
  items,
  catalog,
  onAdd,
  onSubstitute,
  onRemove,
  isAdding = false,
  substitutingId = null,
  removingId = null,
  isProfileCompleted = false,
  showSectionTitle = true,
  sectionTitle,
  addLabel,
  addPlaceholder,
  addingLabel,
  noResultsLabel,
  maxReachedMessage,
  substituteFieldLabel,
  substitutePlaceholder,
  substituteItemLabel,
  substitutingItemLabel,
  removeItemLabel,
  removingItemLabel,
  removeLastRoleBlockedHint,
  emptyStateTitle,
  emptyStateDescription,
  addErrorMessage,
  substituteErrorMessage,
  removeErrorMessage,
  confirmationMessage,
  className,
}: TargetRolesSectionProps) {
  const headingId = useId();
  const [openSubstituteId, setOpenSubstituteId] = useState<string | null>(null);

  function roleName(professionalRoleId: string): string {
    return catalog.find((role) => role.id === professionalRoleId)?.name ?? professionalRoleId;
  }

  const usedRoleIds = new Set(items.map((item) => item.professionalRoleId));
  const addOptions: ComboboxOption[] = catalog
    .filter((role) => !usedRoleIds.has(role.id))
    .map((role) => ({ value: role.id, label: role.name }));
  const atMax = items.length >= MAX_TARGET_ROLES;
  const isLastRoleBlocked = isProfileCompleted && items.length === 1;

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
          {items.map((item) => {
            const name = roleName(item.professionalRoleId);
            const isSubstituting = openSubstituteId === item.id;
            const substituteOptions: SelectOption[] = catalog
              .filter((role) => role.id === item.professionalRoleId || !usedRoleIds.has(role.id))
              .map((role) => ({ value: role.id, label: role.name }));
            const removeHintId = `target-role-${item.id}-remove-hint`;

            return (
              <li
                key={item.id}
                className="gap-space-3 border-border-subtle p-space-4 flex flex-col rounded-md border"
              >
                <div className="gap-space-3 flex items-start justify-between">
                  <p className="text-body text-text-primary font-semibold">{name}</p>
                  <div className="gap-space-1 flex items-center">
                    <Button
                      variant="icon"
                      size="sm"
                      icon={<Icon name="edit" />}
                      onClick={() => setOpenSubstituteId(isSubstituting ? null : item.id)}
                      disabled={substitutingId === item.id}
                      {...buttonLoadingProps(substitutingId === item.id, substitutingItemLabel)}
                    >
                      {substituteItemLabel(name)}
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      icon={<Icon name="trash" />}
                      onClick={() => onRemove(item.id)}
                      disabled={removingId === item.id || isLastRoleBlocked}
                      aria-describedby={isLastRoleBlocked ? removeHintId : undefined}
                      {...buttonLoadingProps(removingId === item.id, removingItemLabel)}
                    >
                      {removeItemLabel(name)}
                    </Button>
                    {isLastRoleBlocked ? (
                      <span id={removeHintId} className="sr-only">
                        {removeLastRoleBlockedHint}
                      </span>
                    ) : null}
                  </div>
                </div>
                {isSubstituting ? (
                  <FormField label={substituteFieldLabel}>
                    <Select
                      options={substituteOptions}
                      value=""
                      onChange={(event) => {
                        const professionalRoleId = event.target.value;
                        if (professionalRoleId && professionalRoleId !== item.professionalRoleId) {
                          onSubstitute(item.id, professionalRoleId);
                        }
                        setOpenSubstituteId(null);
                      }}
                      placeholder={substitutePlaceholder}
                      state={substitutingId === item.id ? 'disabled' : 'default'}
                    />
                  </FormField>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {confirmationMessage ? (
        <AlertInline variant="success">{confirmationMessage}</AlertInline>
      ) : null}
      {addErrorMessage ? <AlertInline variant="error">{addErrorMessage}</AlertInline> : null}
      {substituteErrorMessage ? (
        <AlertInline variant="error">{substituteErrorMessage}</AlertInline>
      ) : null}
      {removeErrorMessage ? <AlertInline variant="error">{removeErrorMessage}</AlertInline> : null}

      {atMax ? (
        <p className="text-small text-text-muted">{maxReachedMessage}</p>
      ) : (
        <FormField label={addLabel}>
          <Combobox
            label={addLabel}
            options={addOptions}
            selected={[]}
            onSelectionChange={(selected) => {
              const added = selected.at(-1);
              if (added) onAdd(added.value);
            }}
            placeholder={addPlaceholder}
            noResultsLabel={noResultsLabel}
            getRemoveLabel={(option) => removeItemLabel(option.label)}
          />
        </FormField>
      )}
      {isAdding ? (
        <p className="sr-only" role="status">
          {addingLabel}
        </p>
      ) : null}
    </section>
  );
}
