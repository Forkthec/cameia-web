/**
 * Comportamiento observable de `PhoneField`: Colombia por defecto entre las
 * opciones, cambiar de país actualiza el indicativo del placeholder, y el
 * error/helper se muestran mutuamente excluyentes bajo el número nacional.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhoneField } from './PhoneField';

const baseProps = {
  paisLabel: 'País',
  paisValue: 'CO',
  onPaisChange: () => {},
  numeroLabel: 'Celular',
  numeroValue: '',
  onNumeroChange: () => {},
  numeroPlaceholder: '300 000 0000',
};

describe('PhoneField', () => {
  it('muestra Colombia (+57) como país por defecto', () => {
    render(<PhoneField {...baseProps} />);

    expect(screen.getByLabelText('País')).toHaveValue('CO');
    expect(screen.getByLabelText('Celular')).toHaveAttribute('placeholder', '+57 300 000 0000');
  });

  it('cambiar de país llama a onPaisChange con el nuevo código ISO', async () => {
    const user = userEvent.setup();
    const onPaisChange = vi.fn();
    render(<PhoneField {...baseProps} onPaisChange={onPaisChange} />);

    await user.selectOptions(screen.getByLabelText('País'), 'US');

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
