/**
 * Banda de bienvenida del Tablero de inicio provisional (HU-10.4) en la
 * dirección «Amanecer»: el título y el mensaje del backlog sobre el índigo de
 * marca (`bg-brand-surface`), con el sol y el glifo del logo como marca de
 * agua. Solo decoración alrededor de los textos que ya define CA-10.4.1; no
 * agrega contenido.
 *
 * Organismo de la feature (ADR-0001). Recibe los textos ya traducidos.
 */
import { BrandMark } from '@/design-system/atoms/Logo';

interface HomeHeroProps {
  /** Título del tablero, ya traducido. */
  title: string;
  /** Mensaje del tablero, ya traducido. */
  message: string;
}

export function HomeHero({ title, message }: HomeHeroProps) {
  return (
    <section
      aria-labelledby="inicio-titulo"
      className="bg-brand-surface animate-enter-up px-space-5 py-space-6 lg:px-space-8 lg:py-space-8 relative isolate overflow-hidden rounded-xl"
    >
      <span
        aria-hidden="true"
        className="bg-brand-glow absolute -top-[14rem] -right-[12rem] -z-10 size-[35rem] rounded-full"
      />
      <span
        aria-hidden="true"
        className="bg-brand-sun animate-sun-rise absolute -top-[2.75rem] -right-[2.5rem] -z-10 size-32 rounded-full lg:-top-[4.5rem] lg:-right-[4rem] lg:size-60"
      />
      <BrandMark
        tone="inverse"
        className="absolute right-[8rem] -bottom-[4rem] -z-10 hidden w-72 opacity-[0.07] lg:block"
        partClassNames={{ sun: 'hidden' }}
      />
      <h1
        id="inicio-titulo"
        className="text-display-sm lg:text-display font-display text-text-on-inverse max-w-[8em] lg:max-w-none"
      >
        {title}
      </h1>
      <p className="text-body text-text-on-inverse/80 mt-space-3 max-w-[30em]">{message}</p>
    </section>
  );
}
