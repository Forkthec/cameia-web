import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { RootErrorBoundary } from './RootErrorBoundary';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function Bomb(): never {
  throw new Error('falla simulada');
}

describe('RootErrorBoundary', () => {
  beforeEach(() => {
    // React y el propio boundary registran el error en consola a propósito;
    // se silencia solo en esta prueba para no ensuciar la salida del test runner.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza sus hijos cuando no hay error', async () => {
    await waitUntilReady();

    render(
      <RootErrorBoundary>
        <p>Contenido normal</p>
      </RootErrorBoundary>,
    );

    expect(screen.getByText('Contenido normal')).toBeInTheDocument();
  });

  it('muestra el fallback cuando un hijo lanza durante el render', async () => {
    await waitUntilReady();

    render(
      <RootErrorBoundary>
        <Bomb />
      </RootErrorBoundary>,
    );

    expect(screen.getByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
  });
});
