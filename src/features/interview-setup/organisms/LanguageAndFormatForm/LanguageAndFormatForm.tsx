/**
 * Paso 3 del wizard: Idioma y Forma de respuesta (PRT-04.09, HU-4.3).
 * Idioma: es-CO preseleccionado, en disponible en todos los planes (CA-4.3.4, CA-4.3.9).
 * Forma: Audio preseleccionado, Texto seleccionable (CA-4.3.3);
 * si el navegador no permite grabar, Audio queda deshabilitado (CA-4.3.7).
 * Las opciones y su disponibilidad llegan del catálogo de Backend (CA-4.3.10).
 */
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { Icon, type IconName } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';
import type {
  AnswerFormat,
  CatalogOption,
  SessionLanguage,
} from '../../model/interviewSetup.types';

const LANGUAGE_ICONS: Record<SessionLanguage, IconName> = {
  'es-CO': 'globe',
  en: 'globe',
};

const FORMAT_ICONS: Record<AnswerFormat, IconName> = {
  AUDIO: 'microphone',
  TEXTO: 'keyboard',
};

interface LanguageAndFormatFormProps {
  languages: CatalogOption<SessionLanguage>[];
  answerFormats: CatalogOption<AnswerFormat>[];
  selectedLanguage: SessionLanguage;
  selectedFormat: AnswerFormat;
  onLanguageChange: (lang: SessionLanguage) => void;
  onFormatChange: (format: AnswerFormat) => void;
  canRecordAudio: boolean;
  languageLabel: string;
  formatLabel: string;
  languageLabels: Record<SessionLanguage, string>;
  formatLabels: Record<AnswerFormat, string>;
  formatDescriptions: Record<AnswerFormat, string>;
  browserCannotRecordMessage: string;
}

export function LanguageAndFormatForm({
  languages,
  answerFormats,
  selectedLanguage,
  selectedFormat,
  onLanguageChange,
  onFormatChange,
  canRecordAudio,
  languageLabel,
  formatLabel,
  languageLabels,
  formatLabels,
  formatDescriptions,
  browserCannotRecordMessage,
}: LanguageAndFormatFormProps) {
  return (
    <div className="gap-space-6 flex flex-col">
      <fieldset>
        <legend className="text-body text-text-primary mb-space-3 font-semibold">
          {languageLabel}
        </legend>
        <div className="gap-space-3 grid grid-cols-2" role="radiogroup" aria-label={languageLabel}>
          {languages.map(({ value: lang, available }) => (
            <CardSelectable
              key={lang}
              state={!available ? 'disabled' : selectedLanguage === lang ? 'selected' : 'default'}
              onClick={() => available && onLanguageChange(lang)}
              icon={<Icon name={LANGUAGE_ICONS[lang]} />}
              title={languageLabels[lang]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-body text-text-primary mb-space-3 font-semibold">
          {formatLabel}
        </legend>
        {!canRecordAudio ? (
          <AlertInline variant="warning" className="mb-space-3">
            {browserCannotRecordMessage}
          </AlertInline>
        ) : null}
        <div
          className={cn('gap-space-3 grid grid-cols-1 sm:grid-cols-2')}
          role="radiogroup"
          aria-label={formatLabel}
        >
          {answerFormats.map(({ value: format, available }) => {
            const isAudioDisabled = !available || (format === 'AUDIO' && !canRecordAudio);
            return (
              <CardSelectable
                key={format}
                state={
                  isAudioDisabled ? 'disabled' : selectedFormat === format ? 'selected' : 'default'
                }
                onClick={() => !isAudioDisabled && onFormatChange(format)}
                icon={<Icon name={FORMAT_ICONS[format]} />}
                title={formatLabels[format]}
                description={formatDescriptions[format]}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
