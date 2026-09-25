/**
 * Valida `import.meta.env` con zod al arrancar (CLAUDE.md §8) y expone un
 * objeto `env` tipado y con nombres de dominio, en vez de que cada archivo
 * lea `import.meta.env.VITE_*` por su cuenta.
 */
import { z } from 'zod';

/**
 * Forma cruda de las variables de entorno, tal como llegan de Vite.
 *
 * VITE_API_BASE_URL es opcional aquí a propósito: el Gateway de producción
 * todavía no existe, así que exigirla siempre dejaría el sitio en blanco en
 * cualquier ambiente que aún no tenga backend. El `superRefine` de abajo la
 * vuelve a exigir, pero solo en producción — ver
 * comunicaciones/11092026_frontend_variable-api-base-url.md (opción 1,
 * decidida por Frontend el 11-sep-2026, implementada por DevOps con permiso
 * de Frontend el 12-sep-2026). En staging sí tiene valor real desde el
 * environment "staging" de GitHub Actions.
 */
const rawEnvSchema = z
  .object({
    VITE_APP_NAME: z.string().min(1),
    VITE_APP_ENV: z.enum(['local', 'staging', 'production']),
    // Vite no deja `import.meta.env.VITE_X` como `undefined` cuando la
    // variable nunca se definió: la deja como string vacío (verificado en un
    // build real de CI, no solo en pruebas). z.optional() por sí solo no
    // trata el string vacío como "ausente", así que el preprocess lo
    // normaliza a undefined antes de validar la URL.
    VITE_API_BASE_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.optional(z.url()),
    ),
    VITE_FIREBASE_API_KEY: z.string().min(1),
    VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    VITE_FIREBASE_PROJECT_ID: z.string().min(1),
    VITE_FIREBASE_APP_ID: z.string().min(1),
    // Opcional a propósito: solo la define quien desarrolla en local con el emulador de
    // Firebase Auth (CM-188). El valor efectivo se calcula abajo en "firebase.authEmulatorHost",
    // que además solo lo respeta en local (mismo patrón que "enableMsw").
    VITE_FIREBASE_AUTH_EMULATOR_HOST: z.optional(z.string()),
    // Opcional a propósito: puede no existir en .env. El valor efectivo se
    // calcula abajo en "enableMsw", que además solo lo respeta en local.
    VITE_ENABLE_MSW: z.optional(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.VITE_APP_ENV === 'production' && !value.VITE_API_BASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['VITE_API_BASE_URL'],
        message: 'VITE_API_BASE_URL es obligatoria cuando VITE_APP_ENV=production.',
      });
    }
  });

/**
 * Parsea y valida `import.meta.env` contra {@link rawEnvSchema}.
 *
 * @throws Error con un mensaje legible que nombra cada variable faltante o
 * inválida, si el `.env` no cumple el esquema.
 */
function parseRawEnv() {
  const result = rawEnvSchema.safeParse(import.meta.env);

  if (!result.success) {
    const missingVariables = result.error.issues.map((issue) => issue.path.join('.')).join(', ');

    throw new Error(
      `Configuración de entorno inválida. Falta o es inválida la(s) variable(s): ${missingVariables}. Revisa tu archivo .env contra .env.example.`,
    );
  }

  return result.data;
}

const rawEnv = parseRawEnv();

/** Configuración de entorno ya validada, lista para consumir en toda la app. */
export const env = {
  appName: rawEnv.VITE_APP_NAME,
  appEnv: rawEnv.VITE_APP_ENV,
  apiBaseUrl: rawEnv.VITE_API_BASE_URL,
  firebase: {
    apiKey: rawEnv.VITE_FIREBASE_API_KEY,
    authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: rawEnv.VITE_FIREBASE_PROJECT_ID,
    appId: rawEnv.VITE_FIREBASE_APP_ID,
    // Solo tiene efecto en 'local' (ver auth.service.ts) — igual que "enableMsw" de abajo.
    authEmulatorHost: rawEnv.VITE_FIREBASE_AUTH_EMULATOR_HOST,
  },
  // VITE_ENABLE_MSW solo tiene efecto en entorno local; fuera de local se ignora siempre.
  enableMsw: rawEnv.VITE_APP_ENV === 'local' && rawEnv.VITE_ENABLE_MSW === 'true',
} as const;
