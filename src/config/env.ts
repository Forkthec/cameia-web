import { z } from 'zod';

const rawEnvSchema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_APP_ENV: z.enum(['local', 'staging', 'production']),
  VITE_API_BASE_URL: z.url(),
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_ENABLE_MSW: z.optional(z.string()),
});

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

export const env = {
  appName: rawEnv.VITE_APP_NAME,
  appEnv: rawEnv.VITE_APP_ENV,
  apiBaseUrl: rawEnv.VITE_API_BASE_URL,
  firebase: {
    apiKey: rawEnv.VITE_FIREBASE_API_KEY,
    authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: rawEnv.VITE_FIREBASE_PROJECT_ID,
    appId: rawEnv.VITE_FIREBASE_APP_ID,
  },
  // VITE_ENABLE_MSW solo tiene efecto en entorno local; fuera de local se ignora siempre.
  enableMsw: rawEnv.VITE_APP_ENV === 'local' && rawEnv.VITE_ENABLE_MSW === 'true',
} as const;
