/**
 * Marca de «este navegador tenía una sesión abierta» (CA-1.8.9, CM-337). Al
 * arrancar, si la sesión fue revocada en otro dispositivo, Firebase valida el
 * usuario guardado, lo borra y avisa directamente «sin usuario»: desde ese
 * aviso no se distingue de alguien que nunca inició sesión. La marca permite
 * distinguirlos. Es solo un indicador, sin datos del usuario (CLAUDE.md §3.9),
 * y `signOut()` la borra, así que un cierre voluntario no muestra el aviso.
 */
const SESSION_MARKER_KEY = 'cameia.sesionAbierta';

export function markSessionOpen(): void {
  try {
    localStorage.setItem(SESSION_MARKER_KEY, '1');
  } catch {
    // Sin almacenamiento solo se pierde el aviso; la sesión funciona igual.
  }
}

export function clearSessionMarker(): void {
  try {
    localStorage.removeItem(SESSION_MARKER_KEY);
  } catch {
    // Igual que en `markSessionOpen`.
  }
}

/** @returns `true` si este navegador tenía una sesión abierta que no se cerró con `signOut()`. */
export function hasSessionMarker(): boolean {
  try {
    return localStorage.getItem(SESSION_MARKER_KEY) !== null;
  } catch {
    return false;
  }
}
