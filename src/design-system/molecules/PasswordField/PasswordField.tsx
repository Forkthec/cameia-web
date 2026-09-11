/**
 * Input de contraseña con botón de mostrar/ocultar superpuesto. El botón usa
 * `variant="icon"` (44x44, cuadrado) posicionado sobre el borde derecho del
 * campo — coincide exactamente con la altura mínima de Input (44px), así que
 * no hace falta ningún cálculo de alineación vertical.
 *
 * El `pr-touch-target` de Input **no es área táctil**: reserva el ancho
 * exacto del botón para que el texto no quede debajo. Usa el mismo token
 * porque debe seguir su tamaño si `--touch-target` cambia.
 */
import { useId, useState, type ChangeEvent, type FocusEvent } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';
import { Icon } from '../../icons/Icon';
import { Input, type InputState } from '../../atoms/Input';

interface PasswordFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  state?: InputState;
  errorMessage?: string;
  helperText?: string;
  describedBy?: string;
  className?: string;
  /** Nombre accesible del botón cuando la contraseña está oculta. Sin texto por defecto. */
  showPasswordLabel: string;
  /** Nombre accesible del botón cuando la contraseña está visible. */
  hidePasswordLabel: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function PasswordField({
  id,
  className,
  showPasswordLabel,
  hidePasswordLabel,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('relative', className)}>
      <Input
        id={inputId}
        type={visible ? 'text' : 'password'}
        className="pr-touch-target"
        {...rest}
      />
      <Button
        type="button"
        variant="icon"
        size="md"
        className="absolute top-0 right-0"
        onClick={() => setVisible((current) => !current)}
        icon={<Icon name={visible ? 'eye-off' : 'eye'} />}
      >
        {visible ? hidePasswordLabel : showPasswordLabel}
      </Button>
    </div>
  );
}
