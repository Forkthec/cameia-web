/** Plantilla de las pantallas de entrevista (PRT-04.11, PRT-05.*): fondo invertido, sin navegación. */
import type { ReactNode } from 'react';

interface SessionLayoutProps {
  children: ReactNode;
}

export function SessionLayout({ children }: SessionLayoutProps) {
  return <div className="bg-bg-inverse text-text-on-inverse min-h-dvh">{children}</div>;
}
