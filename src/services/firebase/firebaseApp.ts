/** Inicializa el SDK de Firebase una sola vez, con la config validada de config/env. */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { env } from '@/config/env';

export const firebaseApp: FirebaseApp = initializeApp({
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  appId: env.firebase.appId,
});
