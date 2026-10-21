/**
 * Respuesta escrita del chat de Simulación (HU-5.2): campo «Respuesta» de 1
 * a 4000 caracteres con contador, y «Enviar».
 *
 * - «Enviar» queda deshabilitado mientras el campo esté vacío o solo tenga
 *   espacios (CA-5.2.3) y mientras se procesa, con «Procesando tu
 *   respuesta…» (CA-5.2.4).
 * - Con más de 4000 caracteres el contador se marca y aparece el mensaje
 *   bajo el campo; no se corta lo escrito (CA-5.2.9, RT-01).
 * - El texto lo guarda quien lo usa: así sobrevive a un error de red
 *   (CA-5.2.18) y se limpia solo al avanzar de pregunta.
 *
 * Organismo de la feature: usa los átomos `Input`, `Label` y `Button` y la
 * molécula `CharacterCounter`. Superficie de vidrio sobre el escenario.
 */
import { useId } from 'react';
import { Button } from '@/design-system/atoms/Button';
import { Input } from '@/design-system/atoms/Input';
import { Label } from '@/design-system/atoms/Label';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
import { cn } from '@/utils/cn';

interface TextAnswerComposerProps {
  /** Texto escrito. */
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Máximo de caracteres (4000, CA-5.2.9). */
  maxLength: number;
  /** `true` mientras se registra la respuesta. */
  isSubmitting: boolean;
  /** Etiqueta del campo, ya traducida («Respuesta»). */
  label: string;
  /** Texto del botón, ya traducido («Enviar»). */
  submitLabel: string;
  /** Texto del botón en carga, ya traducido («Procesando tu respuesta…»). */
  submittingLabel: string;
  /** Mensaje bajo el campo cuando se pasa del máximo, ya traducido. */
  tooLongMessage: string;
  formatCounter: (count: number, max: number) => string;
  className?: string;
}

export function TextAnswerComposer({
  value,
  onChange,
  onSubmit,
  maxLength,
  isSubmitting,
  label,
  submitLabel,
  submittingLabel,
  tooLongMessage,
  formatCounter,
  className,
}: TextAnswerComposerProps) {
  const fieldId = useId();
  const counterId = `${fieldId}-contador`;
  const isEmpty = value.trim().length === 0;
  const isTooLong = value.length > maxLength;

  return (
    <form
      className={cn(
        'border-text-on-inverse/15 bg-text-on-inverse/[0.07] p-space-3 lg:p-space-4 rounded-xl border backdrop-blur-md',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (!isEmpty && !isTooLong && !isSubmitting) onSubmit();
      }}
    >
      <Label htmlFor={fieldId} className="text-text-on-inverse/80">
        {label}
      </Label>
      <Input
        id={fieldId}
        type="textarea"
        rows={3}
        value={value}
        readOnly={isSubmitting}
        state={isTooLong ? 'error' : 'default'}
        errorMessage={isTooLong ? tooLongMessage : undefined}
        describedBy={counterId}
        className="mt-space-1"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-space-2 gap-space-3 flex items-center justify-between">
        <span id={counterId}>
          <CharacterCounter
            count={value.length}
            max={maxLength}
            formatLabel={formatCounter}
            className="text-text-on-inverse/70"
          />
        </span>
        <Button
          type="submit"
          variant="primary"
          disabled={isEmpty || isTooLong}
          {...(isSubmitting
            ? { loading: true as const, loadingLabel: submittingLabel }
            : { loading: false as const })}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
