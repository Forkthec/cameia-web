/**
 * Envoltorio delgado de fetch (CLAUDE.md §8: no usamos axios). Adjunta el ID
 * Token de Firebase cuando hay sesión, corta la petición a los 10 s, y
 * traduce cualquier respuesta no-OK a un ApiError vía errorMap.
 */
import { env } from '@/config/env';
import { getIdToken, signOut } from '../firebase/auth.service';
import { mapErrorResponse } from './errorMap';

const REQUEST_TIMEOUT_MS = 10_000;
const LOGIN_PATH = '/ingresar';

const I18NEXT_LANGUAGE_STORAGE_KEY = 'i18nextLng';
const DEFAULT_LOCALE = 'es-CO';

/**
 * Lee el locale activo directamente de localStorage —la misma llave que ya
 * escribe i18next-browser-languagedetector— en vez de importar el módulo
 * i18n/: la matriz de fronteras (docs/ARCHITECTURE.md §4) no deja que
 * `services` importe de `i18n`. Decisión confirmada explícitamente: aceptar
 * este acoplamiento puntual a un detalle de esa librería antes que tocar la
 * matriz de fronteras.
 */
function getActiveLocale(): string {
  try {
    return localStorage.getItem(I18NEXT_LANGUAGE_STORAGE_KEY) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  params?: QueryParams;
}

/**
 * VITE_API_BASE_URL es opcional fuera de producción (env.ts) porque el API
 * Gateway todavía no está desplegado. Cualquier llamada real sin esa
 * variable falla con este error de dominio en vez de un TypeError críptico
 * de `new URL(path, undefined)`.
 */
export class BackendNotConfiguredError extends Error {
  constructor() {
    super('No hay URL de backend configurada (VITE_API_BASE_URL) para este ambiente.');
    this.name = 'BackendNotConfiguredError';
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  if (!env.apiBaseUrl) {
    throw new BackendNotConfiguredError();
  }
  const url = new URL(path, env.apiBaseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Limpia la sesión y manda a /ingresar: un 401 del backend significa token inválido o expirado. */
async function handleUnauthorized(): Promise<void> {
  await signOut();
  window.location.href = LOGIN_PATH;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const idToken = await getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': getActiveLocale(),
    };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(buildUrl(path, options?.params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const apiError = await mapErrorResponse(response);
      if (apiError.isUnauthorized()) {
        await handleUnauthorized();
      }
      throw apiError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  del: <T = void>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
