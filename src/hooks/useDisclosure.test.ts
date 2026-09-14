/**
 * Contrato de `useDisclosure`: empieza cerrado por defecto salvo que se
 * pida un estado inicial explícito, y `open`/`close`/`toggle` cambian el
 * estado de la forma esperada por su nombre.
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDisclosure } from './useDisclosure';

describe('useDisclosure', () => {
  it('empieza cerrado por defecto', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it('respeta el estado inicial explícito', () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('open, close y toggle cambian el estado', () => {
    const { result } = renderHook(() => useDisclosure());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });
});
