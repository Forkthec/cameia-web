/**
 * Beneficios del panel de marca de Registro (CM-329, `SPEC.md` §3.8):
 * Practica · Mejora · Avanza, cada uno con su ícono y una línea de contexto.
 *
 * Es contenido informativo, **no** un indicador de pasos: no lleva números,
 * no marca un paso actual y no se sincroniza con nada. La app no impone un
 * orden después del registro, así que el panel no debe sugerirlo.
 */
import { Icon, type IconName } from '@/design-system/icons/Icon';

interface BrandHighlightsProps {
  /** Los beneficios, ya traducidos, en el orden en que se muestran. */
  items: Array<{ icon: IconName; title: string; description: string }>;
}

export function BrandHighlights({ items }: BrandHighlightsProps) {
  return (
    <ul className="gap-space-3 flex max-w-[28rem] flex-col">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="animate-enter-up gap-space-4 px-space-4 py-space-3 flex items-center rounded-lg border border-[color-mix(in_srgb,var(--text-on-inverse)_10%,transparent)] bg-[color-mix(in_srgb,var(--text-on-inverse)_6%,transparent)]"
          style={{ animationDelay: `${400 + index * 80}ms` }}
        >
          <span
            aria-hidden="true"
            className="text-brand-accent grid size-11 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--brand-accent)_14%,transparent)]"
          >
            <Icon name={item.icon} size={22} />
          </span>
          <span className="flex flex-col">
            <span className="text-h3 font-display">{item.title}</span>
            <span className="text-small text-text-on-inverse/70">{item.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
