/**
 * Protege que el par de props que produce `buttonLoadingProps` sea siempre
 * el que `Button` acepta: `loadingLabel` presente solo cuando `loading` es
 * `true`, ausente cuando es `false` (CM-61).
 */
import { describe, expect, it } from 'vitest';
import { buttonLoadingProps } from './buttonLoadingProps';

describe('buttonLoadingProps', () => {
  it('loading=true incluye loadingLabel', () => {
    expect(buttonLoadingProps(true, 'Guardando…')).toEqual({
      loading: true,
      loadingLabel: 'Guardando…',
    });
  });

  it('loading=false no incluye loadingLabel', () => {
    expect(buttonLoadingProps(false, 'Guardando…')).toEqual({ loading: false });
  });
});
