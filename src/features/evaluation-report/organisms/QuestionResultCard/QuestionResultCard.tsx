/**
 * Una de las 5 preguntas del reporte (CA-6.4.1, CA-6.4.7): número, tipo, origen, texto, la
 * respuesta guardada (con su «?») y, si fue por voz, sus datos de voz (con su «?»). En lugar de lo
 * que no llega muestra, visible: «Sin respuesta registrada.», «Respondida por texto: sin datos de
 * voz.» o «Respondida por voz: sin datos de voz.». Recibe los textos traducidos y formateados.
 */
import { Pill } from '@/design-system/atoms/Pill';
import { HelpTip } from '@/design-system/molecules/HelpTip';

interface HelpProps {
  label: string;
  text: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuestionResultCardProps {
  /** «Pregunta N». */
  numberLabel: string;
  /** «Técnica», «Conductual»…; vacío si el tipo no se conoce. */
  typeLabel: string;
  /** «Respondida por voz» / «Respondida por texto»; vacío sin respuesta. */
  originLabel: string;
  questionText: string;
  /** Título «Respuesta» y su ayuda. */
  answerTitle: string;
  answerHelp: HelpProps;
  /** Respuesta guardada, o el aviso «Sin respuesta registrada.». */
  answer: { text: string; missing: boolean };
  /** Datos de voz ya formateados, o el aviso que va en su lugar. */
  voice:
    | { kind: 'data'; title: string; help: HelpProps; items: { label: string; value: string }[] }
    | { kind: 'notice'; text: string }
    | null;
}

export function QuestionResultCard({
  numberLabel,
  typeLabel,
  originLabel,
  questionText,
  answerTitle,
  answerHelp,
  answer,
  voice,
}: QuestionResultCardProps) {
  return (
    <article className="gap-space-4 border-border-subtle bg-bg-surface p-space-5 shadow-elevation-1 flex flex-col rounded-xl border">
      <div className="gap-space-2 flex flex-wrap items-center">
        <h3 className="text-small text-text-muted font-bold tracking-[0.06em] uppercase">
          {numberLabel}
        </h3>
        {typeLabel ? (
          <Pill className="border-brand-soft bg-brand-tint text-brand-base font-bold">
            {typeLabel}
          </Pill>
        ) : null}
        {originLabel ? <Pill>{originLabel}</Pill> : null}
      </div>
      <p className="text-body text-text-primary font-semibold">{questionText}</p>

      <div className="gap-space-2 flex flex-col">
        <div className="gap-space-2 flex items-center">
          <span className="text-small text-text-primary font-bold">{answerTitle}</span>
          <HelpTip
            label={answerHelp.label}
            open={answerHelp.open}
            onOpenChange={answerHelp.onOpenChange}
          >
            {answerHelp.text}
          </HelpTip>
        </div>
        {answer.missing ? (
          <p className="text-small text-text-muted">{answer.text}</p>
        ) : (
          <blockquote className="bg-bg-canvas p-space-4 text-body text-text-primary rounded-md whitespace-pre-line">
            {answer.text}
          </blockquote>
        )}
      </div>

      {voice?.kind === 'data' ? (
        <div className="gap-space-2 flex flex-col">
          <div className="gap-space-2 flex items-center">
            <span className="text-small text-text-primary font-bold">{voice.title}</span>
            <HelpTip
              label={voice.help.label}
              open={voice.help.open}
              onOpenChange={voice.help.onOpenChange}
            >
              {voice.help.text}
            </HelpTip>
          </div>
          <dl className="gap-space-2 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {voice.items.map((item) => (
              <div
                key={item.label}
                className="border-border-subtle px-space-3 py-space-2 rounded-md border"
              >
                <dt className="text-small text-text-muted">{item.label}</dt>
                <dd className="text-body text-text-primary font-bold tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      {voice?.kind === 'notice' ? <p className="text-small text-text-muted">{voice.text}</p> : null}
    </article>
  );
}
