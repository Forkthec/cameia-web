// PROVISIONAL — pendiente de OpenAPI de cameia-cuentas (CM-35)
/**
 * Activación de la Cuenta tras verificar el correo: `POST
 * /api/v1/users/me/verification` (`CU-2`/`REQ-CU-13` de
 * `cameia-cuentas/specs/CM-14-RegistroUsuario/spec.md`).
 *
 * Verificar el correo del lado de Firebase **no** activa nada: la Cuenta sigue
 * en `PENDING_VERIFICATION` hasta que llega esta llamada, porque Firebase no
 * avisa a `cameia-cuentas` y el único portador de la prueba es el claim
 * `email_verified` del ID Token. De ahí que el cliente tenga que refrescar el
 * token antes (`refreshIdToken()`), no como optimización sino como requisito.
 *
 * No hay `verification.dto.ts` ni `verification.mapper.ts` a propósito: la
 * respuesta de éxito no está especificada todavía (`SPEC.md` B-23) y la UI no
 * consume ningún campo de ella, así que un DTO vacío sería un archivo muerto
 * (`CLAUDE.md` §4). Entran el día que el backend publique un cuerpo útil.
 *
 * La operación es **idempotente** por `REQ-CU-13`: repetirla sobre una Cuenta
 * ya `ACTIVE` responde éxito sin cambiar nada. Eso es lo que permite
 * reintentarla al iniciar sesión sin saber si hacía falta (`SPEC.md` §2, B-24).
 */
import { httpClient } from '@/services/http/httpClient';

export async function activateAccount(): Promise<void> {
  await httpClient.post<void>('/api/v1/users/me/verification');
}
