/**
 * Catálogo tipado de rutas (respuesta a DevOps del 4-sep-2026, §6). Nadie
 * escribe un string de ruta a mano fuera de este archivo: las rutas con
 * parámetro son funciones builder, el resto son constantes.
 */
export const ROUTES = {
  landing: '/',
  registro: '/registro',
  ingresar: '/ingresar',
  verificarCorreo: '/verificar-correo',
  inicio: '/inicio',
  perfilNuevo: '/perfiles/nuevo',
  perfilEditar: (id: string) => `/perfiles/${id}/editar`,
  perfilRoles: (id: string) => `/perfiles/${id}/roles`,
  entrenarNueva: '/entrenar/nueva',
  entrenarIniciando: '/entrenar/nueva/iniciando',
  entrenarSesion: (sessionId: string) => `/entrenar/sesion/${sessionId}`,
} as const;

/** Paths con parámetros, tal como los necesita `<Route path="...">` de react-router. */
export const ROUTE_PATTERNS = {
  perfilEditar: '/perfiles/:id/editar',
  perfilRoles: '/perfiles/:id/roles',
  entrenarSesion: '/entrenar/sesion/:sessionId',
} as const;
