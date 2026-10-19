/**
 * Paso 2 del wizard: Modo y Tono (PRT-04.07, HU-4.3).
 * Modalidad: Simulacion seleccionada, Entreno deshabilitada con "Proximamente" (CA-4.3.1).
 * Tono: 4 opciones con descripcion corta, Profesional y neutro preseleccionado (CA-4.3.2).
 */
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { cn } from '@/utils/cn';
import {
  INTERVIEW_MODES,
  INTERVIEW_TONES,
  type InterviewMode,
  type InterviewTone,
} from '../../model/interviewSetup.types';

interface ModeAndToneFormProps {
  selectedMode: InterviewMode;
  selectedTone: InterviewTone;
  onModeChange: (mode: InterviewMode) => void;
  onToneChange: (tone: InterviewTone) => void;
  modeLabel: string;
  toneLabel: string;
  modeLabels: Record<InterviewMode, string>;
  toneLabels: Record<InterviewTone, string>;
  toneDescriptions: Record<InterviewTone, string>;
  comingSoonLabel: string;
}

const DISABLED_MODES: ReadonlySet<InterviewMode> = new Set(['ENTRENO']);

export function ModeAndToneForm({
  selectedMode,
  selectedTone,
  onModeChange,
  onToneChange,
  modeLabel,
  toneLabel,
  modeLabels,
  toneLabels,
  toneDescriptions,
  comingSoonLabel,
}: ModeAndToneFormProps) {
  return (
    <div className="gap-space-6 flex flex-col">
      <fieldset>
        <legend className="text-body text-text-primary mb-space-3 font-semibold">
          {modeLabel}
        </legend>
        <div className="gap-space-3 grid grid-cols-2" role="radiogroup" aria-label={modeLabel}>
          {INTERVIEW_MODES.map((mode) => {
            const isDisabled = DISABLED_MODES.has(mode);
            return (
              <CardSelectable
                key={mode}
                state={isDisabled ? 'disabled' : selectedMode === mode ? 'selected' : 'default'}
                onClick={() => !isDisabled && onModeChange(mode)}
                title={modeLabels[mode]}
                description={isDisabled ? comingSoonLabel : undefined}
              />
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-body text-text-primary mb-space-3 font-semibold">
          {toneLabel}
        </legend>
        <div
          className={cn('gap-space-3 grid grid-cols-1 sm:grid-cols-2')}
          role="radiogroup"
          aria-label={toneLabel}
        >
          {INTERVIEW_TONES.map((tone) => (
            <CardSelectable
              key={tone}
              state={selectedTone === tone ? 'selected' : 'default'}
              onClick={() => onToneChange(tone)}
              title={toneLabels[tone]}
              description={toneDescriptions[tone]}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
