import { useId } from 'react';
import { icons } from './registry';

type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Nombre accesible. Si se omite, el ícono es decorativo (aria-hidden). */
  title?: string;
}

function getStrokeWidth(size: number): number {
  if (size >= 48) return 2.5;
  if (size >= 32) return 2.25;
  return 2;
}

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
