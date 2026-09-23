/**
 * Destino del botón «Abrir correo» de la pantalla de verificación, por dominio
 * del correo (`SPEC.md` §3, `PRT-01.02`).
 *
 * Es un catálogo de conveniencia de la interfaz, no un dato de negocio: no
 * viene del backend ni del glosario, y nadie decide nada a partir de él.
 *
 * **Si el dominio no está aquí, no hay botón** (`SPEC.md` B-27): mandar a
 * alguien a una página que no es su correo es peor que no ofrecer el atajo, y
 * la instrucción de la pantalla ya dice qué hacer. Solo webmails que se abren
 * en el navegador; un cliente de escritorio no tiene URL a la que apuntar.
 */
const WEBMAIL_BY_DOMAIN: Record<string, string> = {
  'gmail.com': 'https://mail.google.com/',
  'googlemail.com': 'https://mail.google.com/',
  'outlook.com': 'https://outlook.live.com/mail/',
  'outlook.es': 'https://outlook.live.com/mail/',
  'hotmail.com': 'https://outlook.live.com/mail/',
  'hotmail.es': 'https://outlook.live.com/mail/',
  'live.com': 'https://outlook.live.com/mail/',
  'msn.com': 'https://outlook.live.com/mail/',
  'yahoo.com': 'https://mail.yahoo.com/',
  'yahoo.es': 'https://mail.yahoo.com/',
  'icloud.com': 'https://www.icloud.com/mail',
  'me.com': 'https://www.icloud.com/mail',
  'proton.me': 'https://mail.proton.me/',
  'protonmail.com': 'https://mail.proton.me/',
};

/**
 * @param email correo completo del usuario, tal como lo guarda el store.
 * @returns la URL del webmail, o `null` si el dominio no se conoce o el
 *   correo no tiene forma de correo.
 */
export function resolveWebmailUrl(email: string | null): string | null {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return WEBMAIL_BY_DOMAIN[domain] ?? null;
}
