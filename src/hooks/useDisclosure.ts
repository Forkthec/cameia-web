/**
 * Estado booleano con las tres acciones típicas de un control de dos
 * estados (modal, acordeón, bottom sheet): abrir, cerrar y alternar. Evita
 * repetir el mismo `useState(false)` más tres callbacks en cada componente
 * que necesita este patrón.
 */
import { useCallback, useState } from 'react';

export interface Disclosure {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * @param initialOpen estado inicial; por defecto cerrado.
 * @returns el estado `isOpen` y las acciones para cambiarlo.
 */
export function useDisclosure(initialOpen = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((current) => !current), []);

  return { isOpen, open, close, toggle };
}
