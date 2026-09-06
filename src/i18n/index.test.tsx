import { render, screen } from '@testing-library/react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from './index';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

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
