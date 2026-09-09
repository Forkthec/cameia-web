/**
 * Componente de ícono único de la app (CLAUDE.md §3.3): nadie renderiza un
 * ícono de Lucide directamente, todos pasan por aquí.
 */
import { useId } from 'react';
import { icons } from './registry';

/** Nombre semántico válido: una llave de {@link icons}. */
export type IconName = keyof typeof icons;

interface IconProps {
  /** Nombre semántico del ícono a renderizar (ver registry.tsx). */
  name: IconName;
  /**
   * Lado del ícono en px.
   * @defaultValue 24
   */
  size?: number;
  className?: string;
  /** Nombre accesible. Si se omite, el ícono es decorativo (aria-hidden). */
  title?: string;
}

/**
 * Calcula el grosor de trazo según el tamaño del ícono.
 *
 * El trazo no se escala estirando el SVG: sube en escalones fijos para que
 * un ícono grande no se vea "delgado" en proporción a su tamaño.
 *
 * @param size Lado del ícono en px.
 * @returns 2 por defecto, 2.25 a partir de 32px y 2.5 a partir de 48px.
 */
function getStrokeWidth(size: number): number {
  if (size >= 48) return 2.5;
  if (size >= 32) return 2.25;
  return 2;
}

/**
 * Ícono con tamaño y accesibilidad consistentes en toda la app.
 *
 * Sin `title`, el ícono es puramente decorativo y se oculta de lectores de
 * pantalla (`aria-hidden`). Con `title`, se expone como imagen accesible
 * (`role="img"` + un `<title>` enlazado vía `aria-labelledby`) en vez de
 * depender del manejo implícito de accesibilidad de Lucide.
 *
 * @example
 * ```tsx
 * <Icon name="microphone" size={32} title="Grabar audio" />
 * ```
 */
export function Icon({ name, size = 24, className, title }: IconProps) {
  const titleId = useId();
  const LucideIcon = icons[name];

  return (
    <LucideIcon
      size={size}
      strokeWidth={getStrokeWidth(size)}
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-labelledby={title ? titleId : undefined}
    >
      {title ? <title id={titleId}>{title}</title> : null}
    </LucideIcon>
  );
}
