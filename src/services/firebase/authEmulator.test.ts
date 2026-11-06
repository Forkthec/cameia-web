/**
 * Regla de cuándo conectar al emulador de Firebase Auth (CM-233): solo en `local` — nunca en
 * `staging`/`production`, aunque haya un host configurado. Las decisiones son funciones puras,
 * así que se prueban directamente, sin mockear módulos ni reimportar nada.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTH_EMULATOR_HOST,
  getAuthEmulatorUrl,
  resolveAuthEmulatorHost,
  shouldUseAuthEmulator,
} from './auth.service';

describe('shouldUseAuthEmulator', () => {
  it('es true en local', () => {
    expect(shouldUseAuthEmulator('local')).toBe(true);
  });

  it('es false en staging', () => {
    expect(shouldUseAuthEmulator('staging')).toBe(false);
  });

  it('es false en production', () => {
    expect(shouldUseAuthEmulator('production')).toBe(false);
  });
});

describe('resolveAuthEmulatorHost', () => {
  it('usa localhost:9099 por defecto si no hay host', () => {
    expect(resolveAuthEmulatorHost(undefined)).toBe('localhost:9099');
    expect(DEFAULT_AUTH_EMULATOR_HOST).toBe('localhost:9099');
  });

  it('usa el host por defecto si el configurado está vacío', () => {
    expect(resolveAuthEmulatorHost('')).toBe('localhost:9099');
    expect(resolveAuthEmulatorHost('   ')).toBe('localhost:9099');
  });

  it('respeta un host personalizado', () => {
    expect(resolveAuthEmulatorHost('emulador:9199')).toBe('emulador:9199');
  });
});

describe('getAuthEmulatorUrl', () => {
  it('en local sin host usa el host por defecto', () => {
    expect(getAuthEmulatorUrl('local', undefined)).toBe('http://localhost:9099');
  });

  it('en local con host personalizado lo usa', () => {
    expect(getAuthEmulatorUrl('local', 'emulador:9199')).toBe('http://emulador:9199');
  });

  it('en staging no devuelve URL aunque haya host', () => {
    expect(getAuthEmulatorUrl('staging', 'localhost:9099')).toBeUndefined();
  });

  it('en production no devuelve URL aunque haya host', () => {
    expect(getAuthEmulatorUrl('production', 'localhost:9099')).toBeUndefined();
  });
});
