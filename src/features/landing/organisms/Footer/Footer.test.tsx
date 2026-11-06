/**
 * Comportamiento observable de {@link Footer}: muestra los enlaces legales y
 * el copyright. La agrupación distinta entre `sm`/`lg` (`SPEC.md` §3.1) se
 * resuelve renderizando ambas variantes y alternando visibilidad por CSS
 * (mismo patrón que `NavHeader`/`TabBar`), así que jsdom ve ambas a la vez —
 * esta prueba solo verifica que el contenido de cada una está completo, la
 * visibilidad real por breakpoint se valida a ojo contra Figma (§9 SPEC).
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { Footer } from './Footer';

describe('Footer', () => {
  it('muestra los enlaces legales y el copyright', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Footer />
      </I18nextProvider>,
    );

    expect(screen.getAllByText('Términos')).not.toHaveLength(0);
    expect(screen.getAllByText('Privacidad')).not.toHaveLength(0);
    expect(screen.getAllByText('© 2026 Cameia')).not.toHaveLength(0);
  });

  it('muestra el wordmark de la marca', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Footer />
      </I18nextProvider>,
    );

    expect(screen.getAllByText('cameia').length).toBeGreaterThan(0);
  });
});
