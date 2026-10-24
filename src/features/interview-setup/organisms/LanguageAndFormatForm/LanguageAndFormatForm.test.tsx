/**
 * Protege el paso 3 del wizard: idioma y forma de respuesta (CA-4.3.3,
 * CA-4.3.4, CA-4.3.7, CA-4.3.8, CA-4.3.9). Fuente: backlog v8.2.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageAndFormatForm } from './LanguageAndFormatForm';
import type { AnswerFormat, SessionLanguage } from '../../model/interviewSetup.types';

const LANG_LABELS: Record<SessionLanguage, string> = {
  'es-CO': 'Español (Colombia)',
  en: 'English',
};

const FORMAT_LABELS: Record<AnswerFormat, string> = {
  AUDIO: 'Audio',
  TEXTO: 'Texto',
};

const FORMAT_DESCRIPTIONS: Record<AnswerFormat, string> = {
  AUDIO: 'Responde con tu voz',
  TEXTO: 'Escribe tus respuestas',
};

function renderForm(props: Partial<React.ComponentProps<typeof LanguageAndFormatForm>> = {}) {
  const defaults: React.ComponentProps<typeof LanguageAndFormatForm> = {
    languages: [
      { value: 'es-CO', available: true },
      { value: 'en', available: true },
    ],
    answerFormats: [
      { value: 'AUDIO', available: true },
      { value: 'TEXTO', available: true },
    ],
    selectedLanguage: 'es-CO',
    selectedFormat: 'AUDIO',
    onLanguageChange: vi.fn(),
    onFormatChange: vi.fn(),
    canRecordAudio: true,
    languageLabel: 'Idioma de la entrevista',
    formatLabel: 'Forma de respuesta',
    languageLabels: LANG_LABELS,
    formatLabels: FORMAT_LABELS,
    formatDescriptions: FORMAT_DESCRIPTIONS,
    browserCannotRecordMessage: 'Tu navegador no soporta grabación de audio',
    ...props,
  };
  return { ...render(<LanguageAndFormatForm {...defaults} />), props: defaults };
}

describe('LanguageAndFormatForm', () => {
  it('muestra los dos idiomas con es-CO disponible (CA-4.3.4)', () => {
    renderForm();
    expect(screen.getByText('Español (Colombia)')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('muestra Audio y Texto con descripciones (CA-4.3.3)', () => {
    renderForm();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Responde con tu voz')).toBeInTheDocument();
  });

  it('llama a onLanguageChange al seleccionar inglés (CA-4.3.9)', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByText('English'));
    expect(props.onLanguageChange).toHaveBeenCalledWith('en');
  });

  it('llama a onFormatChange al seleccionar Texto (CA-4.3.8)', async () => {
    const user = userEvent.setup();
    const { props } = renderForm();
    await user.click(screen.getByText('Texto'));
    expect(props.onFormatChange).toHaveBeenCalledWith('TEXTO');
  });

  it('deshabilita Audio y muestra alerta cuando el navegador no graba (CA-4.3.7)', () => {
    renderForm({ canRecordAudio: false });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu navegador no soporta grabación de audio',
    );
  });

  it('no llama a onFormatChange al hacer clic en Audio deshabilitado (CA-4.3.7)', async () => {
    const user = userEvent.setup();
    const { props } = renderForm({ canRecordAudio: false });
    await user.click(screen.getByText('Audio'));
    expect(props.onFormatChange).not.toHaveBeenCalled();
  });

  it('tiene radiogroups accesibles para idioma y formato', () => {
    renderForm();
    expect(screen.getByRole('radiogroup', { name: 'Idioma de la entrevista' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Forma de respuesta' })).toBeInTheDocument();
  });
});
