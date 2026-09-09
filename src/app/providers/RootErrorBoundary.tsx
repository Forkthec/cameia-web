/**
 * Boundary de React de último recurso, fuera del router (complementa
 * `app/router/RouteErrorBoundary.tsx`, que solo captura errores de carga o
 * render de una ruta). React todavía exige una clase para
 * `componentDidCatch`/`getDerivedStateFromError`; no hay `react-error-boundary`
 * en las dependencias y no se agrega sin pedirlo (CLAUDE.md §2).
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary]', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-body text-text-primary">{i18n.t('errors:generico')}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
