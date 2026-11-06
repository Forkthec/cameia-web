/**
 * Comprueba la hipótesis de D-K (`SPEC.md` §3.3 punto 5 y §9): que `zodResolver` entregue a
 * `handleSubmit` los valores YA TRANSFORMADOS por Zod, de modo que lo que llegue a `onAdd` sea «AAAA-MM» y
 * no el texto «mm/aaaa» que escribe la persona. No prueba código de la feature: usa un esquema mínimo propio
 * con la misma forma que describe D-K (validar «mm/aaaa» y transformar a «AAAA-MM») para saber si la
 * librería se comporta así antes de construir los esquemas reales. Si esta prueba falla, D-K y el SPEC se
 * corrigen antes de escribir producción.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const MONTH_TEXT = /^(0[1-9]|1[0-2])\/\d{4}$/;

const schema = z.object({
  startDate: z
    .string()
    .regex(MONTH_TEXT)
    .transform((text) => {
      const [month, year] = text.split('/');
      return `${year}-${month}`;
    }),
});

describe('zodResolver con transform (hipótesis de D-K)', () => {
  it('entrega a handleSubmit el valor transformado «AAAA-MM», no el texto «mm/aaaa»', async () => {
    const onValid = vi.fn();
    const { result } = renderHook(() =>
      useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { startDate: '06/2024' },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledOnce();
    expect(onValid.mock.calls[0]?.[0]).toEqual({ startDate: '2024-06' });
  });
});
