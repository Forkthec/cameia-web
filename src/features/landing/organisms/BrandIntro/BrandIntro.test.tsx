/**
 * Comportamiento observable de {@link BrandIntro} (`SPEC.md` §3.7): el único
 * elemento interactivo es «Saltar intro», que avisa a quien la controla. El
 * logo y el lema son decorativos (el header ya anuncia la marca), así que no
 * aportan texto accesible duplicado.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { BrandIntro } from './BrandIntro';

describe('BrandIntro', () => {
  it('llama a onSkip al pulsar «Saltar intro»', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <BrandIntro onSkip={onSkip} />
      </I18nextProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Saltar intro' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('solo expone el botón de saltar como contenido accesible', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BrandIntro onSkip={() => {}} />
      </I18nextProvider>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
