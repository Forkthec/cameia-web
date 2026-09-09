/** Plantilla centrada, sin navegación, para las pantallas de registro/ingreso (PRT-01.*). */
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-bg-canvas px-space-4 flex min-h-dvh items-center justify-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
