/**
 * Contrato mínimo de la bandera transversal de "cambios sin guardar"
 * (`CM-194`): arranca en `false` y `setUnsavedChanges` es la única forma de
 * cambiarla, en cualquier dirección.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { useUnsavedChangesStore } from './unsavedChanges.store';

describe('useUnsavedChangesStore', () => {
  afterEach(() => {
    useUnsavedChangesStore.setState({ hasUnsavedChanges: false });
  });

  it('inicia con hasUnsavedChanges en false', () => {
    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(false);
  });

  it('setUnsavedChanges marca la bandera en true', () => {
    useUnsavedChangesStore.getState().setUnsavedChanges(true);

    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('setUnsavedChanges vuelve a poner la bandera en false', () => {
    useUnsavedChangesStore.getState().setUnsavedChanges(true);

    useUnsavedChangesStore.getState().setUnsavedChanges(false);

    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(false);
  });
});
