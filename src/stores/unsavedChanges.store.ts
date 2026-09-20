/**
 * Bandera de cliente transversal para "hay cambios sin guardar" (`CM-194`,
 * `SPEC.md` de `features/auth` §3 "Menú de usuario y Cerrar sesión"): el
 * menú de usuario la consulta antes de confirmar el cierre de sesión, para
 * mostrar una advertencia adicional en vez de dejar que el usuario pierda
 * trabajo en curso sin avisarle.
 *
 * **Limitación consciente:** es un único booleano, no un registro por
 * formulario — asume que como máximo un formulario "sucio" está montado a
 * la vez, cierto hoy porque la app no permite dos pantallas de edición
 * simultáneas. Sube a un registro real (`CLAUDE.md` §4, regla de
 * crecimiento) solo cuando exista un segundo formulario simultáneo de
 * verdad, no antes.
 *
 * Cualquier `feature` puede importar este store directamente: `stores` está
 * permitido desde `features` en `boundaries/dependencies`
 * (`eslint.config.js`).
 */
import { create } from 'zustand';

interface UnsavedChangesState {
  hasUnsavedChanges: boolean;
  /** Lo llama el formulario que sincroniza su propio `formState.isDirty`. */
  setUnsavedChanges: (value: boolean) => void;
}

export const useUnsavedChangesStore = create<UnsavedChangesState>((set) => ({
  hasUnsavedChanges: false,
  setUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
}));
