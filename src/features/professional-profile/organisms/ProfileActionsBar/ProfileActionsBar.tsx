/**
 * Barra de acciones compartida entre las secciones de PRT-02.03 (nodo
 * `132:2570` lg / `142:747` sm de Figma, verificado en vivo — CLAUDE.md
 * §13): barra de completitud + "Guardar borrador" + "Finalizar y
 * Continuar". Nadie era dueño de esta pieza hasta CM-61 (SPEC.md §3).
 *
 * "Guardar borrador" envía `GeneralInfoForm` por el atributo HTML `form`
 * (`draftFormId`), no por `onClick`: Experiencia Laboral y Educación se
 * persisten al vuelo por ítem (POST/DELETE inmediato), así que no tienen
 * "borrador" que guardar — solo Información General lo tiene (SPEC.md §9,
 * decisión D-C).
 *
 * "Finalizar y Continuar" (CM-65) ya llama a `onFinish` — deshabilitado
 * mientras `isFinishDisabled` sea `true` (calculado por quien monta este
 * organismo a partir de `getCompletenessValue`, `model/profileCompleteness.ts`)
 * o mientras `isFinalizing` esté en curso. `finishDisabledHint` explica por
 * qué está deshabilitado y se enlaza por `aria-describedby`, en vez de
 * dejar un botón muerto sin contexto — sigue siendo necesario aunque ya
 * exista el endpoint real, porque esta rama sola nunca ve completo el 5º
 * requisito (≥1 rol objetivo, CM-69 en paralelo — ver
 * `model/profileCompleteness.ts`).
 *
 * Sin `useTranslation` (CLAUDE.md §14.7): todo texto visible entra por prop
 * obligatoria.
 */
import { useId } from 'react';
import { buttonLoadingProps } from '@/utils/buttonLoadingProps';
import { cn } from '@/utils/cn';
import { Button } from '@/design-system/atoms/Button';
import { ProgressBar } from '@/design-system/atoms/ProgressBar';

interface ProfileActionsBarProps {
  /** Id del `<form>` de Información General: el botón de borrador lo envía por el atributo HTML `form`. */
  draftFormId: string;
  completenessValue: number;
  completenessMax: number;
  /** "Completitud del Perfil Profesional". */
  completenessLabel: string;
  /** Fracción ya interpolada por quien monta este organismo (p. ej. "3 de 5 campos obligatorios"). */
  completenessFraction: string;
  saveDraftLabel: string;
  savingDraftLabel: string;
  isSavingDraft?: boolean;
  finishLabel: string;
  onFinish: () => void;
  isFinishDisabled: boolean;
  /** Por qué "Finalizar y Continuar" está deshabilitado (requisitos incompletos). */
  finishDisabledHint: string;
  /** `true` mientras el `POST .../completion` está en curso. */
  isFinalizing?: boolean;
  finalizingLabel: string;
  className?: string;
}

export function ProfileActionsBar({
  draftFormId,
  completenessValue,
  completenessMax,
  completenessLabel,
  completenessFraction,
  saveDraftLabel,
  savingDraftLabel,
  isSavingDraft = false,
  finishLabel,
  onFinish,
  isFinishDisabled,
  finishDisabledHint,
  isFinalizing = false,
  finalizingLabel,
  className,
}: ProfileActionsBarProps) {
  const finishHintId = useId();

  return (
    <div
      className={cn(
        'bg-bg-surface border-border-subtle gap-space-4 p-space-4 flex flex-col rounded-lg border-t md:border',
        className,
      )}
    >
      <div className="gap-space-1 flex flex-col">
        <div className="text-small flex items-center justify-between">
          <span className="text-text-muted">{completenessLabel}</span>
          <span className="text-text-primary font-bold">{completenessFraction}</span>
        </div>
        <ProgressBar
          context="profile-completeness"
          value={completenessValue}
          max={completenessMax}
          label={completenessLabel}
        />
      </div>

      <div className="gap-space-3 flex flex-col md:flex-row md:justify-end">
        <Button
          type="submit"
          form={draftFormId}
          variant="secondary"
          size="lg"
          className="w-full md:w-auto"
          {...buttonLoadingProps(isSavingDraft, savingDraftLabel)}
        >
          {saveDraftLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onFinish}
          disabled={isFinishDisabled || isFinalizing}
          aria-describedby={isFinishDisabled ? finishHintId : undefined}
          className="w-full md:w-auto"
          {...buttonLoadingProps(isFinalizing, finalizingLabel)}
        >
          {finishLabel}
        </Button>
        {isFinishDisabled ? (
          <span id={finishHintId} className="sr-only">
            {finishDisabledHint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
