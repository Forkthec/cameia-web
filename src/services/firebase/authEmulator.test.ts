/**
 * Regla de cuándo conectar al emulador de Firebase Auth (CM-188): solo en
 * `local` y solo si se configuró un host — nunca en `staging`/`production`,
 * ni en `local` sin host. `shouldUseAuthEmulator` es una función pura, así
 * que se prueba directamente, sin mockear módulos ni reimportar nada.
 */
import { describe, expect, it } from 'vitest';
import { shouldUseAuthEmulator } from './auth.service';

describe('shouldUseAuthEmulator', () => {
  it('es true en local con un host configurado', () => {
    expect(shouldUseAuthEmulator('local', 'localhost:9099')).toBe(true);
  });

  it('es false en local sin host configurado', () => {
    expect(shouldUseAuthEmulator('local', undefined)).toBe(false);
  });

  it('es false en staging aunque haya un host configurado', () => {
    expect(shouldUseAuthEmulator('staging', 'localhost:9099')).toBe(false);
  });

  it('es false en production aunque haya un host configurado', () => {
    expect(shouldUseAuthEmulator('production', 'localhost:9099')).toBe(false);
  });

  it('es false en local con un host vacío', () => {
    expect(shouldUseAuthEmulator('local', '')).toBe(false);
  });
});
