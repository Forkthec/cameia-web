/**
 * Comportamiento observable de `PhoneField`: Colombia por defecto entre las
 * opciones, cambiar de país llama a `onPaisChange`, el placeholder del
 * número nacional no repite el indicativo (seguimiento: era contradictorio
 * con el disparador de país, que ya lo muestra), y el error/helper se
 * muestran mutuamente excluyentes bajo el número nacional.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhoneField } from './PhoneField';

const baseProps = {
  paisLabel: 'País',
  paisValue: 'CO',
  onPaisChange: () => {},
  paisBuscarLabel: 'Buscar país',
  paisSinResultadosLabel: 'No encontramos ese país.',
  numeroLabel: 'Celular',
  numeroValue: '',
  onNumeroChange: () => {},
  numeroPlaceholder: '300 000 0000',
};

describe('PhoneField', () => {
  it('muestra Colombia (+57) como país por defecto', () => {
    render(<PhoneField {...baseProps} />);

    expect(screen.getByRole('button', { name: 'País' })).toHaveTextContent('CO +57');
  });

  it('el placeholder del número nacional no repite el indicativo', () => {
    render(<PhoneField {...baseProps} />);

    expect(screen.getByLabelText('Celular')).toHaveAttribute('placeholder', '300 000 0000');
  });

  it('cambiar de país llama a onPaisChange con el nuevo código ISO', async () => {
    const user = userEvent.setup();
    const onPaisChange = vi.fn();
    render(<PhoneField {...baseProps} onPaisChange={onPaisChange} />);

    await user.click(screen.getByRole('button', { name: 'País' }));
    await user.type(screen.getByRole('combobox', { name: 'Buscar país' }), 'Estados Unidos');
    await user.click(screen.getByRole('option', { name: /Estados Unidos/ }));

    expect(onPaisChange).toHaveBeenCalledWith('US');
  });

  it('con errorMessage y state="error", muestra el error y no el helper', () => {
    render(
      <PhoneField
        {...baseProps}
        state="error"
        errorMessage="Formato inválido"
        helperText="Formato internacional"
      />,
    );

    expect(screen.getByText('Formato inválido')).toBeInTheDocument();
    expect(screen.queryByText('Formato internacional')).not.toBeInTheDocument();
  });

  it('sin error, muestra el helper', () => {
    render(<PhoneField {...baseProps} helperText="Formato internacional" />);

    expect(screen.getByText('Formato internacional')).toBeInTheDocument();
  });
});
