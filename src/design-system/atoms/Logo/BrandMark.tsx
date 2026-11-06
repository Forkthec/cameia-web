/**
 * Glifo de la marca: el camello abstracto de dos trazos con el sol (propuesta
 * de logo «Amanecer», CM-329). Sustituye a los SVG exportados
 * `glyph-default.svg`/`glyph-inverse.svg` del camello geométrico anterior.
 *
 * Se dibuja en línea, no como un `*.svg` importado, por dos razones: los
 * colores salen de tokens (`fill-brand-base`, `fill-brand-accent`…) en vez de
 * hex dentro del archivo exportado (CLAUDE.md §3.1), y cada pieza (joroba,
 * cuello, sol) acepta su propia clase para que una intro de marca pueda
 * animarlas por separado sin duplicar la geometría.
 *
 * El trazado es un calco vectorial de la hoja de marca entregada por Diseño,
 * no el archivo fuente: cuando exista el SVG original, se reemplazan los tres
 * `d` de abajo sin tocar a quien consuma este componente.
 *
 * La «ranura» blanca entre el cuello y la joroba (y entre la cabeza y el sol)
 * es un trazo del color del fondo, no un hueco real: se lee de la variable
 * `--logo-seam`, que cada tono inicializa con el fondo donde suele vivir y que
 * quien lo consuma puede redefinir con una clase (`[--logo-seam:var(--brand-deep)]`).
 */
import { cn } from '@/utils/cn';

const HUMP_PATH =
  'M65 620 C 20 430, 140 175, 300 165 C 390 160, 435 250, 430 365 C 330 320, 170 400, 65 620 Z';
const NECK_PATH =
  'M432 380 C 410 420, 370 470, 368 530 C 366 590, 410 625, 460 622 C 520 618, 555 580, 568 500 L 600 330 C 606 300, 625 292, 650 290 C 685 287, 700 262, 696 225 C 694 205, 670 196, 640 198 L 580 202 C 545 205, 528 225, 520 260 L 497 350 C 490 390, 470 412, 452 410 C 440 408, 434 395, 432 380 Z';

interface BrandMarkProps {
  /** `default` (índigo) para fondos claros; `inverse` (blanco) para fondos de marca oscuros. */
  tone?: 'default' | 'inverse';
  /** Oculta el sol: para marcas de agua, donde el acento mostaza competiría con el contenido. */
  withSun?: boolean;
  /** Clases por pieza, para animarlas por separado (intro de marca). */
  partClassNames?: { hump?: string; neck?: string; sun?: string };
  className?: string;
}

export function BrandMark({
  tone = 'default',
  withSun = true,
  partClassNames,
  className,
}: BrandMarkProps) {
  const bodyFill = tone === 'inverse' ? 'fill-text-on-inverse' : 'fill-brand-base';

  return (
    <svg
      viewBox="20 30 740 600"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'overflow-visible',
        tone === 'inverse' ? '[--logo-seam:var(--brand-base)]' : '[--logo-seam:var(--bg-canvas)]',
        className,
      )}
    >
      {withSun ? (
        <circle
          cx="635"
          cy="132"
          r="100"
          className={cn('fill-brand-accent', partClassNames?.sun)}
        />
      ) : null}
      <path d={HUMP_PATH} className={cn(bodyFill, partClassNames?.hump)} />
      <path
        d={NECK_PATH}
        strokeWidth={22}
        paintOrder="stroke"
        className={cn(bodyFill, '[stroke:var(--logo-seam)]', partClassNames?.neck)}
      />
    </svg>
  );
}
