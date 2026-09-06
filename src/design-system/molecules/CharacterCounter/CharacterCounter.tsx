/**
 * `formatLabel` recibe el conteo y el máximo ya interpolados por quien
 * consume el componente (vía i18n) — CharacterCounter nunca arma el texto
 * "X/Y caracteres" por su cuenta.
 */
import { ErrorText } from '../../atoms/ErrorText';
import { HelperText } from '../../atoms/HelperText';

interface CharacterCounterProps {
  count: number;
  max: number;
  formatLabel: (count: number, max: number) => string;
  className?: string;
}

export function CharacterCounter({ count, max, formatLabel, className }: CharacterCounterProps) {
  const text = formatLabel(count, max);

  return count > max ? (
    <ErrorText className={className}>{text}</ErrorText>
  ) : (
    <HelperText className={className}>{text}</HelperText>
  );
}
