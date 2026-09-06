/**
 * Franja informativa para gates de funcionalidad (CLAUDE.md §12: AUDIO y
 * autocompletar con IA se muestran deshabilitados en vez de ocultarse). Tono
 * único (info): un feature gate avisa, no alarma.
 */
import type { ReactElement } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '../../atoms/Button';
import { Icon } from '../../icons/Icon';

interface BannerProps {
  icon?: ReactElement<{ size?: number }>;
  children: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function Banner({ icon, children, actionLabel, onAction, className }: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'gap-space-3 border-info-base bg-info-tint p-space-3 flex items-center rounded-md border',
        className,
      )}
    >
      {icon ?? <Icon name="info" size={20} className="text-info-base shrink-0" />}
      <p className="text-small text-text-primary flex-1">{children}</p>
      {actionLabel && onAction ? (
        <Button variant="tertiary" size="sm" onClick={onAction} className="shrink-0">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
