/**
 * Compone Label + control + HelperText/ErrorText con los aria correctos en
 * un solo lugar, para no repetir esa asociación en cada formulario.
 *
 * `children` debe ser un control que acepte `id` y `describedBy` (Input y
 * PasswordField lo hacen). Checkbox/Toggle/Radio NO pasan por aquí: ya
 * gestionan su propia etiqueta e id internamente (son un `<label>` que
 * envuelve su propio `<input>`), así que envolverlos duplicaría la etiqueta.
 */
import { cloneElement, useId, type ReactElement } from 'react';
import { cn } from '@/utils/cn';
import { ErrorText } from '../../atoms/ErrorText';
import { HelperText } from '../../atoms/HelperText';
import { Label } from '../../atoms/Label';

interface ControlProps {
  id?: string;
  describedBy?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  className?: string;
  children: ReactElement<ControlProps>;
}

export function FormField({ label, error, helperText, className, children }: FormFieldProps) {
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={cn('gap-space-1 flex flex-col', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      {cloneElement(children, { id: fieldId, describedBy })}
      {error ? (
        <ErrorText id={errorId}>{error}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
    </div>
  );
}
