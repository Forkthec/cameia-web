/**
 * «Escuchar» junto a la pregunta del chat de Simulación (HU-5.15, CM-373). Sin prototipo nuevo:
 * sigue el estilo del escenario (texto claro sobre el cielo, `Button` secundario).
 *
 * Muestra el botón con su nombre accesible «Escuchar la pregunta N» (CA-5.15.16), los usos que
 * quedan («2 de 3», CA-5.15.1), «Preparando el audio…» y «Detener» (CA-5.15.2), el mensaje de
 * error, el aviso del tratamiento del texto antes de la primera reproducción (CA-5.15.29) y la
 * casilla de escucha automática (CA-5.15.30). Recibe los textos ya traducidos.
 */
import { Button } from '@/design-system/atoms/Button';
import { Checkbox } from '@/design-system/atoms/Checkbox';
import type { QuestionAudioStatus } from '../../hooks/useQuestionAudio';

interface QuestionAudioControlProps {
  /** Estado del audio de la pregunta. */
  status: QuestionAudioStatus;
  /** Usos que quedan; en 0 el botón se deshabilita (CA-5.15.6), salvo que el audio ya esté en memoria. */
  canPlay: boolean;
  /** Si la casilla automática está marcada. */
  autoListen: boolean;
  /** Si se muestra el aviso del tratamiento del texto (antes de la primera reproducción). */
  showNotice: boolean;
  /** Mensaje de error ya traducido. */
  errorMessage?: string;
  /** Textos ya traducidos. */
  labels: {
    listen: string;
    listenAria: string;
    preparing: string;
    stop: string;
    remaining: string;
    notice: string;
    autoListen: string;
  };
  onPlay: () => void;
  onStop: () => void;
  onAutoListenChange: (value: boolean) => void;
}

export function QuestionAudioControl({
  status,
  canPlay,
  autoListen,
  showNotice,
  errorMessage,
  labels,
  onPlay,
  onStop,
  onAutoListenChange,
}: QuestionAudioControlProps) {
  return (
    <div className="gap-space-2 mt-space-4 flex flex-col items-center">
      <div className="gap-space-3 flex items-center">
        {status === 'playing' ? (
          <Button variant="secondary" onClick={onStop}>
            {labels.stop}
          </Button>
        ) : status === 'loading' ? (
          <Button variant="secondary" loading loadingLabel={labels.preparing}>
            {labels.listen}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={onPlay}
            disabled={!canPlay}
            aria-label={labels.listenAria}
          >
            {labels.listen}
          </Button>
        )}
        <span className="text-small text-text-on-inverse/85">{labels.remaining}</span>
      </div>
      {errorMessage ? (
        <p role="alert" className="text-small text-brand-accent-light max-w-[28em]">
          {errorMessage}
        </p>
      ) : null}
      {showNotice ? (
        <p className="text-small text-text-on-inverse/85 max-w-[28em]">{labels.notice}</p>
      ) : null}
      <Checkbox
        id="escuchar-automaticamente"
        checked={autoListen}
        onChange={(event) => onAutoListenChange(event.target.checked)}
        className="text-text-on-inverse"
      >
        {labels.autoListen}
      </Checkbox>
    </div>
  );
}
