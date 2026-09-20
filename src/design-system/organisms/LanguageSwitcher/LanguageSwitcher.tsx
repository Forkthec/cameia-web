/**
 * Selector de idioma de la app (Figma, componente "language-switcher", nodo
 * `49:421`; instancia `49:355`). No es el idioma de la sesión de entrevista —
 * ver `GLOSSARY.md` §4. `context="public-header"` es la única variante que
 * consume esta HU (CM-186, `HeaderPublico`); `context="settings"` queda
 * declarada en el tipo porque Figma la modela como variante real del mismo
 * componente, pero sin rama de renderizado propia todavía — se agrega cuando
 * una pantalla de configuración la necesite (CLAUDE.md §4).
 *
 * Sin `useTranslation` (CLAUDE.md §14.7, mismo patrón que el resto del
 * design system): quien lo consuma decide `value`/`onChange` y traduce
 * `label`. El componente no sabe qué es i18next.
 *
 * Altura de 34px, exacta a Figma — por debajo del `--touch-target` de 44px.
 * Misma excepción ya trackeada en `CLAUDE.md` §17 para `Button` `size="sm"`
 * (también 34px); no se infla el componente a un alto que Figma no dibuja.
 */
import { cn } from '@/utils/cn';

interface LanguageSwitcherProps {
  /** Dónde se usa: solo cambia semántica de agrupación, no estilos (ambas variantes se ven igual). */
  context?: 'public-header' | 'settings';
  /** Idioma actualmente activo. Obligatorio: el componente no infiere el idioma por su cuenta. */
  value: 'es' | 'en';
  onChange: (language: 'es' | 'en') => void;
  /** Nombre accesible del grupo, ej. "Idioma de la interfaz". Sin valor por defecto (CLAUDE.md §14.7). */
  label: string;
  className?: string;
}

export function LanguageSwitcher({
  context = 'public-header',
  value,
  onChange,
  label,
  className,
}: LanguageSwitcherProps) {
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
          'text-small h-6 w-[38px] rounded-full font-semibold transition-colors',
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
          'text-small h-6 w-[38px] rounded-full font-semibold transition-colors',
          'focus-visible:shadow-focus-ring focus-visible:outline-none',
          value === 'en' ? 'bg-brand-tint text-brand-base' : 'text-text-muted font-normal',
        )}
      >
        EN
      </button>
    </div>
  );
}
