/**
 * Banda de título de las páginas del Perfil Profesional en la dirección
 * «Amanecer» (CM-337): el título que ya tenía cada página sobre el índigo de
 * marca (`bg-brand-surface`), con el sol y su resplandor. Solo decoración
 * alrededor del `<h1>` existente; no agrega textos ni cambia el flujo
 * (misma idea que `HomeHero` del tablero, que no se importa por ser de otra
 * feature, CLAUDE.md §3.4).
 *
 * Organismo de la feature (ADR-0001). Recibe el título ya traducido.
 */
interface ProfilePageHeroProps {
  /** Título de la página, ya traducido. Se mantiene como `<h1>`. */
  title: string;
}

export function ProfilePageHero({ title }: ProfilePageHeroProps) {
  return (
    <div className="bg-brand-surface animate-enter-up px-space-5 pt-space-6 pb-space-8 lg:px-space-8 lg:pt-space-8 lg:pb-space-9 relative isolate overflow-hidden rounded-xl">
      <span
        aria-hidden="true"
        className="bg-brand-glow absolute -right-[10rem] -bottom-[18rem] -z-10 size-[30rem] rounded-full"
      />
      <span
        aria-hidden="true"
        className="bg-brand-sun animate-sun-rise absolute -right-[1.5rem] -bottom-[3.5rem] -z-10 size-28 rounded-full lg:right-[6rem] lg:-bottom-[6rem] lg:size-48"
      />
      <h1 className="text-h1 lg:text-display-sm font-display text-text-on-inverse max-w-[14em]">
        {title}
      </h1>
    </div>
  );
}
