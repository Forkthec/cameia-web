/**
 * Selector del método de configuración del Perfil Profesional (HU-2.2,
 * PRT-02.02): dos tarjetas excluyentes, "Llenado Manual" y "Autocompletar
 * con IA". Tocar la tarjeta ES la acción — no hay campo de nombre ni botón
 * "Continuar" (CA-2.2.1: el perfil se crea vacío, sin body, y el nombre se
 * fija después por PATCH en HU-2.3). La tarjeta de IA está deshabilitada:
 * HU-2.6 a HU-2.10 (autocompletar con CV) son Sprint 2 (CLAUDE.md §12,
 * abierta 7); diverge de Figma, que la dibuja habilitada con una insignia
 * "Recomendado" — ver SPEC professional-profile §9.
 *
 * Aunque vive en `features` (tiene dominio: sabe que existe un método
 * "manual" y uno de "IA"), sigue la misma regla que el design system
 * (CLAUDE.md §14.7): no llama `useTranslation`, todo texto visible entra
 * como prop obligatoria. `NewProfilePage` es quien traduce.
 *
 * Guarda contra doble creación: mientras `loading` es true, tocar la
 * tarjeta manual no dispara `onSelectManual`. TanStack Query no ignora por
 * sí solo una segunda llamada a `mutate` mientras la primera está en
 * vuelo — sin esta guarda, dos toques rápidos crearían dos perfiles, y el
 * Plan Gratis solo permite uno sin que exista todavía forma de borrar el
 * sobrante (consulta C-03).
 */
import { cn } from '@/utils/cn';
import { Spinner } from '@/design-system/atoms/Spinner';
import { Icon } from '@/design-system/icons/Icon';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { CardSelectable } from '@/design-system/molecules/CardSelectable';
import { StateLocked } from '@/design-system/molecules/StateLocked';

/**
 * Desfase, en milisegundos, entre la aparición de cada tarjeta al montar.
 * `semantic.css` no define un token de stagger (CLAUDE.md §6): es un valor
 * arbitrario, declarado una sola vez aquí en vez de repetir `delay-[Nms]`
 * suelto en cada tarjeta.
 */
const STAGGER_DELAY_MS = 60;

/**
 * Transición de entrada compartida por ambas tarjetas: aparecen con un
 * ligero desplazamiento vertical (nunca una propiedad que dispare layout,
 * solo `opacity`/`transform`) y quedan inmóviles bajo
 * `prefers-reduced-motion` (CLAUDE.md §10).
 */
const ENTRANCE_TRANSITION_CLASSES =
  'starting:translate-y-2 starting:opacity-0 transition-[opacity,transform] duration-[var(--duration-smooth)] ease-out motion-reduce:transition-none motion-reduce:transform-none';

interface ProfileMethodSelectorProps {
  /** Nombre accesible del grupo de tarjetas (aria-label del radiogroup que aporta este componente). */
  groupLabel: string;
  manualTitle: string;
  manualDescription: string;
  aiTitle: string;
  aiDescription: string;
  /** Texto de la insignia "Próximamente" sobre la tarjeta de IA. */
  aiBadgeLabel: string;
  /** Anunciado a lectores de pantalla mientras se crea el perfil. */
  loadingLabel: string;
  /** Se dispara al elegir "Llenado Manual". Se ignora mientras `loading` es true (ver TSDoc de cabecera). */
  onSelectManual: () => void;
  /** `true` mientras la creación del perfil está en curso. */
  loading?: boolean;
  /** Mensaje de la última creación fallida. Las tarjetas siguen activas: volver a tocarlas reintenta. */
  errorMessage?: string;
  className?: string;
}

export function ProfileMethodSelector({
  groupLabel,
  manualTitle,
  manualDescription,
  aiTitle,
  aiDescription,
  aiBadgeLabel,
  loadingLabel,
  onSelectManual,
  loading = false,
  errorMessage,
  className,
}: ProfileMethodSelectorProps) {
  function handleSelectManual() {
    if (loading) return;
    onSelectManual();
  }

  return (
    <div className={cn('gap-space-4 flex flex-col', className)}>
      <div
        role="radiogroup"
        aria-label={groupLabel}
        aria-busy={loading}
        className="gap-space-4 grid md:grid-cols-2"
      >
        <div
          className={ENTRANCE_TRANSITION_CLASSES}
          style={{ transitionDelay: `${STAGGER_DELAY_MS}ms` }}
        >
          <CardSelectable
            state={loading ? 'selected' : 'default'}
            onClick={handleSelectManual}
            icon={<Icon name="edit" />}
            title={manualTitle}
            description={manualDescription}
            className={cn(
              'min-h-touch-target h-full w-full',
              // Lista explícita en vez de "transition-colors" + "transition-[transform,box-shadow]":
              // tailwind-merge trata cualquier "transition-*" (incluida la sintaxis arbitraria) como
              // un solo slot de conflicto, así que dos utilidades de transición nunca conviven — la
              // segunda se come a la primera. Esta lista es la unión de las propiedades que traía
              // "transition-colors" en CardSelectable (color, background-color, border-color,
              // text-decoration-color, fill, stroke) más las que necesita el hover de esta tarjeta
              // (box-shadow, transform), para no perder la transición de fondo que ya tenía por defecto.
              'transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-quick)] ease-out',
              'enabled:cursor-pointer',
              'enabled:hover:border-brand-base enabled:hover:shadow-elevation-2 enabled:hover:scale-102',
              'enabled:focus-visible:border-brand-base enabled:focus-visible:shadow-elevation-2 enabled:focus-visible:scale-102',
              'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100',
            )}
          />
        </div>
        <div
          className={ENTRANCE_TRANSITION_CLASSES}
          style={{ transitionDelay: `${STAGGER_DELAY_MS * 2}ms` }}
        >
          <StateLocked label={aiBadgeLabel} className="block h-full">
            <CardSelectable
              state="disabled"
              icon={<Icon name="sparkles" />}
              title={aiTitle}
              description={aiDescription}
              className="min-h-touch-target h-full w-full"
            />
          </StateLocked>
        </div>
      </div>
      {loading ? <Spinner label={loadingLabel} hideLabel={false} /> : null}
      {errorMessage ? <AlertInline variant="error">{errorMessage}</AlertInline> : null}
    </div>
  );
}
