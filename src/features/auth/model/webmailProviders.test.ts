/**
 * Protege la decisión de `SPEC.md` B-27: el atajo «Abrir correo» solo existe
 * para dominios conocidos, y ante cualquier otro devuelve `null` para que la
 * pantalla no renderice un botón que llevaría a ninguna parte.
 */
import { describe, expect, it } from 'vitest';
import { resolveWebmailUrl } from './webmailProviders';

describe('resolveWebmailUrl', () => {
  it('resuelve el webmail de un dominio conocido', () => {
    expect(resolveWebmailUrl('ada@gmail.com')).toBe('https://mail.google.com/');
    expect(resolveWebmailUrl('ada@hotmail.com')).toBe('https://outlook.live.com/mail/');
  });

  it('ignora mayúsculas en el dominio', () => {
    expect(resolveWebmailUrl('Ada@GMAIL.com')).toBe('https://mail.google.com/');
  });

  it('devuelve null con un dominio corporativo desconocido', () => {
    expect(resolveWebmailUrl('ada@cameia.tech')).toBeNull();
  });

  it('devuelve null sin correo o con un valor sin arroba', () => {
    expect(resolveWebmailUrl(null)).toBeNull();
    expect(resolveWebmailUrl('ada')).toBeNull();
  });
});
