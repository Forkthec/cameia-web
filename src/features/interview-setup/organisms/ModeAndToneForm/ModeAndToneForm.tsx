/**
 * Paso 2 del wizard: Modo y Tono (PRT-04.07, HU-4.3).
 * Modalidad: Simulacion seleccionada, Entreno deshabilitada con "Proximamente" (CA-4.3.1).
 * Tono: 4 opciones con descripcion corta, Profesional y neutro preseleccionado (CA-4.3.2).
 * Las opciones y su disponibilidad llegan del catálogo de Backend, en su orden
 * (CA-4.3.10): una modalidad no disponible lleva «Próximamente».
 */
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { Icon, type IconName } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';
import type { CatalogOption, InterviewMode, InterviewTone } from '../../model/interviewSetup.types';

const MODE_ICONS: Record<InterviewMode, IconName> = {
  SIMULACION: 'target',
  ENTRENO: 'dumbbell',
};

const TONE_ICONS: Record<InterviewTone, IconName> = {
  PROFESIONAL_NEUTRO: 'briefcase',
  CALIDO: 'heart',
  ESTRICTO: 'shield',
  MOTIVADOR: 'trophy',
};

interface ModeAndToneFormProps {
  modes: CatalogOption<InterviewMode>[];
  tones: CatalogOption<InterviewTone>[];
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

export function ModeAndToneForm({
  modes,
  tones,
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
        <div
          className="gap-space-3 grid grid-cols-1 sm:grid-cols-2"
          role="radiogroup"
          aria-label={modeLabel}
        >
          {modes.map(({ value: mode, available }) => {
            const isDisabled = !available;
            return (
              <CardSelectable
                key={mode}
                state={isDisabled ? 'disabled' : selectedMode === mode ? 'selected' : 'default'}
                onClick={() => !isDisabled && onModeChange(mode)}
                icon={<Icon name={MODE_ICONS[mode]} />}
                title={modeLabels[mode]}
                badge={isDisabled ? comingSoonLabel : undefined}
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
          {tones.map(({ value: tone, available }) => (
            <CardSelectable
              key={tone}
              state={!available ? 'disabled' : selectedTone === tone ? 'selected' : 'default'}
              onClick={() => available && onToneChange(tone)}
              icon={<Icon name={TONE_ICONS[tone]} />}
              title={toneLabels[tone]}
              description={toneDescriptions[tone]}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
