/**
 * Celular internacional (CM-34, seguimiento): Figma (`73:449`) dibuja un
 * solo campo de texto libre con placeholder "+57 300 000 0000" y el helper
 * "Formato internacional, por ejemplo +57 300 000 0000" — **diferencia
 * consciente con Figma** (`CLAUDE.md` §16, aprobada explícitamente): se
 * reemplaza por un selector de país (`CountryCodeSelect`, opciones de
 * `libphonenumber-js`) + el número nacional (`Input`), para que la persona
 * no tenga que escribir el indicativo a mano y el cliente pueda validar el
 * formato E.164 real antes de enviarlo. Por defecto Colombia (`CO`, +57) —
 * único mercado del producto hoy (`CLAUDE.md` §1); el selector permite
 * cambiarlo a cualquiera de los ~245 países que conoce la librería.
 *
 * El selector de país es `CountryCodeSelect` (archivo interno de esta
 * carpeta, ver su propio TSDoc): un `Select` nativo con el nombre completo
 * del país se truncaba en un ancho angosto ("Colombia (+57)" no cabía,
 * seguimiento de esta sesión) — el disparador compacto (`CO +57`) nunca se
 * trunca porque su contenido siempre es corto.
 *
 * El placeholder del número nacional **ya no repite el indicativo**
 * (`"300 000 0000"`, sin `+57`): con el indicativo visible en el disparador
 * de al lado, pedirle a la persona que también lo escriba en el campo del
 * número era contradictorio (mismo hallazgo). El helper de abajo sí sigue
 * mostrando el número completo de ejemplo ("+57 300 000 0000"): describe el
 * resultado combinado final, no vive dentro de un campo específico, así que
 * no repite el mismo problema.
 *
 * Vive en `features/auth/organisms/`, no en `design-system/`: es su primer
 * y único consumidor (`CLAUDE.md` §4, "sube a design-system cuando lo usa
 * una segunda feature").
 *
 * Vacío (país por defecto + número vacío) es válido — CA-1.1.1 no exige
 * celular. Renderiza su propio label/helper/error para cada control: es un
 * control compuesto de dos partes, y `FormField.cloneElement` solo clona un
 * hijo, así que no puede envolver esto directamente.
 */
import { useId, type ChangeEvent, type FocusEvent } from 'react';
import { Input, type InputState } from '@/design-system/atoms/Input';
import { ErrorText } from '@/design-system/atoms/ErrorText';
import { HelperText } from '@/design-system/atoms/HelperText';
import { Label } from '@/design-system/atoms/Label';
import { CountryCodeSelect } from './CountryCodeSelect';

interface PhoneFieldProps {
  paisLabel: string;
  paisValue: string;
  onPaisChange: (value: string) => void;
  paisBuscarLabel: string;
  paisSinResultadosLabel: string;
  numeroLabel: string;
  numeroValue: string;
  onNumeroChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onNumeroBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  numeroPlaceholder: string;
  helperText?: string;
  errorMessage?: string;
  state?: InputState;
  className?: string;
}

export function PhoneField({
  paisLabel,
  paisValue,
  onPaisChange,
  paisBuscarLabel,
  paisSinResultadosLabel,
  numeroLabel,
  numeroValue,
  onNumeroChange,
  onNumeroBlur,
  numeroPlaceholder,
  helperText,
  errorMessage,
  state = 'default',
  className,
}: PhoneFieldProps) {
  const isError = state === 'error';
  const paisId = useId();
  const numeroId = useId();

  return (
    <div className={className}>
      <div className="gap-space-3 flex items-start">
        <div className="gap-space-1 flex shrink-0 flex-col">
          <Label htmlFor={paisId}>{paisLabel}</Label>
          <CountryCodeSelect
            id={paisId}
            value={paisValue}
            onChange={onPaisChange}
            label={paisLabel}
            buscarLabel={paisBuscarLabel}
            sinResultadosLabel={paisSinResultadosLabel}
            state={state === 'error' ? 'default' : state}
          />
        </div>
        <div className="gap-space-1 flex flex-1 flex-col">
          <Label htmlFor={numeroId}>{numeroLabel}</Label>
          <Input
            id={numeroId}
            type="text"
            inputMode="numeric"
            autoComplete="tel-national"
            value={numeroValue}
            onChange={onNumeroChange}
            onBlur={onNumeroBlur}
            placeholder={numeroPlaceholder}
            state={state}
          />
        </div>
      </div>
      {isError && errorMessage ? (
        <ErrorText>{errorMessage}</ErrorText>
      ) : helperText ? (
        <HelperText>{helperText}</HelperText>
      ) : null}
    </div>
  );
}
