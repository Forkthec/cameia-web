/**
 * Paso 3 del wizard: Idioma y Forma de respuesta (PRT-04.09, HU-4.3).
 * Idioma: es-CO preseleccionado, en disponible en todos los planes (CA-4.3.4, CA-4.3.9).
 * Forma: Audio preseleccionado, Texto seleccionable (CA-4.3.3);
 * si el navegador no permite grabar, Audio queda deshabilitado (CA-4.3.7).
 */
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { cn } from '@/utils/cn';
import {
  ANSWER_FORMATS,
  SESSION_LANGUAGES,
  type AnswerFormat,
  type SessionLanguage,
} from '../../model/interviewSetup.types';

interface LanguageAndFormatFormProps {
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
          {SESSION_LANGUAGES.map((lang) => (
            <CardSelectable
              key={lang}
              state={selectedLanguage === lang ? 'selected' : 'default'}
              onClick={() => onLanguageChange(lang)}
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
          <p className="text-small text-status-warning mb-space-3" role="alert">
            {browserCannotRecordMessage}
          </p>
        ) : null}
        <div
          className={cn('gap-space-3 grid grid-cols-1 sm:grid-cols-2')}
          role="radiogroup"
          aria-label={formatLabel}
        >
          {ANSWER_FORMATS.map((format) => {
            const isAudioDisabled = format === 'AUDIO' && !canRecordAudio;
            return (
              <CardSelectable
                key={format}
                state={
                  isAudioDisabled ? 'disabled' : selectedFormat === format ? 'selected' : 'default'
                }
                onClick={() => !isAudioDisabled && onFormatChange(format)}
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
