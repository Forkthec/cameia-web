/**
 * Método STAR de una pregunta conductual (CA-6.4.1, CA-6.4.2): el texto de la pregunta, cada
 * parte como «Presente» o «Ausente» y «N de 4». Sin resultado (`level` nulo): «Sin resultado» en
 * lugar de las partes y del nivel; un nivel 0 se muestra «0 de 4». El estado de cada parte se
 * distingue por ícono y texto, no solo por color (CLAUDE.md §10). Recibe los textos traducidos.
 */
import { Pill } from '@/design-system/atoms/Pill';
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

interface StarCardProps {
  /** «Pregunta N». */
  questionLabel: string;
  questionText: string;
  /** «N de 4», o `null` si no hay resultado. */
  levelLabel: string | null;
  /** Partes en orden (Situación, Tarea, Acción, Resultado). */
  parts: { name: string; present: boolean; stateLabel: string }[];
  noResultLabel: string;
  noResultHelp: string;
}

export function StarCard({
  questionLabel,
  questionText,
  levelLabel,
  parts,
  noResultLabel,
  noResultHelp,
}: StarCardProps) {
  return (
    <article className="gap-space-4 border-border-subtle bg-bg-surface p-space-5 shadow-elevation-1 flex flex-col rounded-xl border">
      <div className="gap-space-4 flex flex-wrap items-start justify-between">
        <div className="gap-space-1 flex max-w-[70ch] flex-col">
          <span className="text-small text-text-muted font-bold tracking-[0.06em] uppercase">
            {questionLabel}
          </span>
          <p className="text-body text-text-primary font-semibold">{questionText}</p>
        </div>
        {levelLabel ? (
          <Pill className="border-brand-accent bg-brand-accent/15 text-text-primary font-bold">
            {levelLabel}
          </Pill>
        ) : null}
      </div>

      {levelLabel === null ? (
        <div className="gap-space-1 flex flex-col">
          <p className="text-h3 text-text-muted font-display font-bold">{noResultLabel}</p>
          <p className="text-small text-text-muted">{noResultHelp}</p>
        </div>
      ) : (
        <ul className="gap-space-3 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {parts.map((part) => (
            <li
              key={part.name}
              className={cn(
                'gap-space-2 px-space-4 py-space-3 flex items-center rounded-md border',
                part.present
                  ? 'border-brand-soft bg-brand-tint text-brand-base'
                  : 'border-border-subtle bg-bg-surface-sunken text-text-muted',
              )}
            >
              <Icon name={part.present ? 'check-circle' : 'close'} size={18} />
              <span className="text-body font-bold">{part.name}</span>
              <span className="text-small ml-auto">{part.stateLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
