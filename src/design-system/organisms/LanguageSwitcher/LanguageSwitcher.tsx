/**
 * Selector de idioma de la app (Figma, componente "language-switcher", nodo
 * `49:421`; instancia `49:355`). No es el idioma de la sesión de entrevista —
 * ver `GLOSSARY.md` §4. `context="public-header"` es la única variante que
 * consumía esta HU (CM-186, `HeaderPublico`); `context="settings"` sigue
 * declarada en el tipo porque Figma la modela como variante real del mismo
 * componente, pero sin rama de renderizado propia todavía (`CLAUDE.md` §4).
 *
 * `context="menu-row"` (`CM-194`, nodo `49:421` variante `menu-row`): fila
 * dentro de `MenuUsuario` — `icon/globe` + `label` (texto de la fila) +
 * `valueLabel` (nombre visible del idioma activo, ej. "Español" —
 * obligatorio en la práctica para esta variante; el componente no lo
 * inventa a partir de `value` porque eso sería texto hardcodeado, `CLAUDE.md`
 * §3.2) + un ícono de intercambio (`swap`, `icons/registry.tsx`). Es un
 * botón simple que alterna `es`/`en` con el `onChange` ya existente — Figma
 * no dibuja un sub-panel de selección para esta fila, y las variantes
 * `settings`/`settings-sm` (que sí lo harían) no se construyen en esta
 * iteración.
 *
 * **Dos desviaciones conscientes de Figma en `menu-row`, pedidas
 * explícitamente por el usuario tras revisar la UI/UX real (20-sep-2026,
 * seguimiento de `CM-194` — no un hallazgo de Figma ni un CA del backlog):**
 * el nodo real usa `icon/chevron-right` y un `label` más largo ("Idioma de
 * la app"). El chevron sugiere que el clic despliega algo, cuando en
 * realidad alterna el valor al instante — se reemplaza por un ícono de
 * intercambio, más honesto sobre el comportamiento real. El `label` se
 * acorta a "Idioma" porque el slot real donde vive esta fila dentro de
 * `MenuUsuario` mide 224px, más angosto que los 258px que el propio symbol
 * de Figma mide de forma nativa (confirmado inspeccionando la página "02 ·
 * Componentes") — con el texto largo, "Idioma de la app" + el valor
 * ("Español"/"English") no cabían en una sola línea, ni en la app ni en el
 * propio prototipo de Figma. Ver `SPEC.md` de `features/auth` §3 y §9 para
 * el detalle completo de la decisión.
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que el resto del
 * design system): quien lo consuma decide `value`/`onChange` y traduce
 * `label`/`valueLabel`. El componente no sabe qué es i18next.
 *
 * Altura de 34px en `public-header`/`settings`, exacta a Figma — por debajo
 * del `--touch-target` de 44px. Misma excepción ya trackeada en `CLAUDE.md`
 * §17 para `Button` `size="sm"` (también 34px). `menu-row` sí mide 44px
 * (`--touch-target`), como el resto de ítems de `MenuUsuario`.
 */
import { cn } from '@/utils/cn';
import { Icon } from '../../icons/Icon';

interface LanguageSwitcherProps {
  /** Dónde se usa: cambia tanto la semántica de agrupación como el layout de `menu-row`. */
  context?: 'public-header' | 'settings' | 'menu-row';
  /** Idioma actualmente activo. Obligatorio: el componente no infiere el idioma por su cuenta. */
  value: 'es' | 'en';
  onChange: (language: 'es' | 'en') => void;
  /** Nombre accesible del grupo (`public-header`/`settings`) o texto visible de la fila (`menu-row`). */
  label: string;
  /** Nombre visible del idioma activo, ej. "Español". Solo lo usa `context="menu-row"`. */
  valueLabel?: string;
  className?: string;
}

export function LanguageSwitcher({
  context = 'public-header',
  value,
  onChange,
  label,
  valueLabel,
  className,
}: LanguageSwitcherProps) {
  if (context === 'menu-row') {
    return (
      <button
        type="button"
        onClick={() => onChange(value === 'es' ? 'en' : 'es')}
        data-context={context}
        className={cn(
          'gap-space-2 px-space-3 text-body text-text-primary hover:bg-bg-surface-sunken min-h-touch-target flex w-full items-center rounded-md',
          'focus-visible:shadow-focus-ring cursor-pointer focus-visible:outline-none',
          className,
        )}
      >
        <Icon name="globe" size={20} className="text-text-muted shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {valueLabel ? <span className="text-small text-text-muted">{valueLabel}</span> : null}
        <Icon name="swap" size={16} className="text-text-muted shrink-0" />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={label}
      data-context={context}
      className={cn(
        'border-border-strong gap-space-1 flex h-[34px] items-center rounded-full border-[1.5px] p-1',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={value === 'es'}
        onClick={() => onChange('es')}
        className={cn(
          'text-small h-6 w-[38px] cursor-pointer rounded-full font-semibold transition-colors',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          value === 'es' ? 'bg-brand-tint text-brand-base' : 'text-text-muted font-normal',
        )}
      >
        ES
      </button>
      <div className="bg-border-strong h-5 w-px shrink-0" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={value === 'en'}
        onClick={() => onChange('en')}
        className={cn(
          'text-small h-6 w-[38px] cursor-pointer rounded-full font-semibold transition-colors',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          value === 'en' ? 'bg-brand-tint text-brand-base' : 'text-text-muted font-normal',
        )}
      >
        EN
      </button>
    </div>
  );
}
