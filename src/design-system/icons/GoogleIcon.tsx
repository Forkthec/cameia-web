/**
 * Adapta el SVG real de Google (`icon/google`, excepción explícita a la
 * regla R2 de Figma — los 4 colores de marca de Google no se tokenizan) a la
 * misma firma que `Icon.tsx` usa para cualquier ícono de Lucide del
 * registro: acepta `size` y `strokeWidth` (este último se ignora, es un
 * ícono de relleno con colores fijos, no de trazo) para que `icons` en
 * `registry.tsx` siga siendo un mapa homogéneo y `Icon.tsx` no necesite
 * distinguir este ícono de los demás.
 */
import type { ReactNode } from 'react';
import RawGoogleIcon from './svg/google.svg?react';

interface GoogleIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
  role?: string;
  'aria-labelledby'?: string;
  children?: ReactNode;
}

export function GoogleIcon({ size = 24, ...rest }: GoogleIconProps) {
  // `strokeWidth` viaja en `rest` sin usarse a propósito: es válido como
  // atributo SVG (`stroke-width`), inofensivo para un ícono de solo relleno,
  // y aceptarlo (sin desestructurarlo aparte) es lo que mantiene a `icons`
  // homogéneo para `Icon.tsx` sin duplicar código.
  return <RawGoogleIcon width={size} height={size} {...rest} />;
}
