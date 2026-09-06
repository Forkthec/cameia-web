/**
 * Verifica que la configuración de i18n realmente funciona: que la instancia
 * resuelve una llave real (`common:acciones.continuar`) y que lo hace también
 * a través de React (`I18nextProvider` + `useTranslation`), no solo en el
 * objeto i18next crudo.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from './index';

/**
 * Espera a que i18next termine de inicializar.
 *
 * Con recursos inline la espera suele resolverse en el mismo tick, pero no
 * hay garantía de orden entre módulos: en vez de asumirlo, se escucha el
 * evento "initialized" si todavía no ocurrió.
 */
async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

/** Componente mínimo para probar la integración con react-i18next. */
function TranslatedProbe() {
  const { t } = useTranslation();
  return <span>{t('common:acciones.continuar')}</span>;
}

describe('i18n', () => {
  it('resuelve common:acciones.continuar sobre la instancia configurada', async () => {
    await waitUntilReady();

    expect(i18n.t('common:acciones.continuar')).toBe('Continuar');
  });

  it('funciona a través de I18nextProvider + useTranslation', async () => {
    await waitUntilReady();

    render(
      <I18nextProvider i18n={i18n}>
        <TranslatedProbe />
      </I18nextProvider>,
    );

    expect(screen.getByText('Continuar')).toBeInTheDocument();
  });
});
