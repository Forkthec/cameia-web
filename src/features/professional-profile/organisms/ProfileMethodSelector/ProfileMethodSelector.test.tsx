/**
 * Comportamiento observable de `ProfileMethodSelector` (HU-2.2, PRT-02.02,
 * backlog 12092026_01 CA-2.2.1): que expone un `radiogroup` con nombre
 * accesible, que la tarjeta de IA está deshabilitada y nunca dispara
 * `onSelectManual`, que la tarjeta manual sí lo dispara, que un segundo
 * toque mientras `loading` es true se ignora (SPEC professional-profile §9:
 * un segundo POST crearía un segundo perfil, y el Plan Gratis solo permite
 * uno), y que `loading`/`errorMessage` se anuncian por los roles correctos.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileMethodSelector } from './ProfileMethodSelector';

const baseProps = {
  groupLabel: 'Método de configuración del perfil',
  manualTitle: 'Llenado Manual',
  manualDescription: 'Escribes tú cada sección.',
  aiTitle: 'Autocompletar con IA',
  aiDescription: 'Subes tu Hoja de Vida.',
  aiBadgeLabel: 'Próximamente',
  loadingLabel: 'Creando perfil…',
  onSelectManual: () => {},
};

describe('ProfileMethodSelector', () => {
  it('renderiza las dos tarjetas con sus textos', () => {
    render(<ProfileMethodSelector {...baseProps} />);

    expect(screen.getByText('Llenado Manual')).toBeInTheDocument();
    expect(screen.getByText('Escribes tú cada sección.')).toBeInTheDocument();
    expect(screen.getByText('Autocompletar con IA')).toBeInTheDocument();
    expect(screen.getByText('Subes tu Hoja de Vida.')).toBeInTheDocument();
  });

  it('expone un radiogroup con nombre accesible', () => {
    render(<ProfileMethodSelector {...baseProps} />);

    expect(
      screen.getByRole('radiogroup', { name: 'Método de configuración del perfil' }),
    ).toBeInTheDocument();
  });

  it('la tarjeta de IA está deshabilitada y no dispara onSelectManual', async () => {
    const user = userEvent.setup();
    const onSelectManual = vi.fn();

    render(<ProfileMethodSelector {...baseProps} onSelectManual={onSelectManual} />);
    const aiCard = screen.getByRole('radio', { name: /Autocompletar con IA/ });

    expect(aiCard).toBeDisabled();
    await user.click(aiCard);
    expect(onSelectManual).not.toHaveBeenCalled();
  });

  it('tocar Llenado Manual dispara onSelectManual', async () => {
    const user = userEvent.setup();
    const onSelectManual = vi.fn();

    render(<ProfileMethodSelector {...baseProps} onSelectManual={onSelectManual} />);
    await user.click(screen.getByRole('radio', { name: /Llenado Manual/ }));

    expect(onSelectManual).toHaveBeenCalledOnce();
  });

  it('ignora un segundo toque mientras está cargando', async () => {
    const user = userEvent.setup();
    const onSelectManual = vi.fn();

    render(<ProfileMethodSelector {...baseProps} onSelectManual={onSelectManual} loading />);
    const manualCard = screen.getByRole('radio', { name: /Llenado Manual/ });

    await user.click(manualCard);
    await user.click(manualCard);

    expect(onSelectManual).not.toHaveBeenCalled();
  });

  it('loading marca la tarjeta manual como seleccionada y anuncia un estado de carga', () => {
    render(<ProfileMethodSelector {...baseProps} loading />);

    expect(screen.getByRole('radio', { name: /Llenado Manual/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('errorMessage se anuncia como una alerta', () => {
    render(<ProfileMethodSelector {...baseProps} errorMessage="Ocurrió un error." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error.');
  });
});
