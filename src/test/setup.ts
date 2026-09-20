/**
 * Se carga antes de cada archivo de prueba (ver `test.setupFiles` en
 * vite.config.ts). Registra los matchers de jest-dom (`toBeInTheDocument`,
 * `toHaveAttribute`, etc.) para que estén disponibles sin importarlos en
 * cada test, arranca el servidor de MSW (Node) para toda la suite —
 * `src/mocks/server.ts`, único punto de arranque de mocks en pruebas—,
 * reinicia el estado en memoria de `profiles.handlers.ts` antes de cada
 * prueba individual, e instala el stub de `window.matchMedia` (CM-61:
 * jsdom 30 no lo implementa, y `ProfileSectionsLayout`/`EditProfilePage`
 * usan `useMediaQuery` para alternar `StepList` y acordeón).
 *
 * `resetProfiles()` vivía como responsabilidad de cada archivo de prueba que
 * consumiera esos handlers (ver la nota de cabecera de
 * `profiles.handlers.ts`); se centraliza aquí porque es infraestructura de
 * pruebas, no de una feature: así ninguna prueba nueva puede olvidarlo y
 * heredar datos de la prueba anterior (SPEC professional-profile §9).
 *
 * Idioma fijo a "es-CO" antes de cada prueba (CM-186): jsdom reporta
 * `navigator.language` como "en" por defecto, y hasta este commit eso no
 * importaba porque `locales/en/` no tenía recursos propios — cualquier
 * detección caía en `fallbackLng: 'es-CO'` sin que nadie lo notara. Ahora que
 * "en" sí tiene traducción real (`features/landing/SPEC.md` §3.3), esa misma
 * detección de jsdom rompía en silencio cualquier prueba que renderizara
 * texto a través de la instancia compartida de i18next sin fijar idioma
 * explícitamente — se descubrió al correr `src/i18n/index.test.tsx`. Se fija
 * aquí, no en cada archivo de prueba, por la misma razón que `resetProfiles`:
 * es infraestructura, no algo que cada prueba nueva deba recordar. Una
 * prueba que sí necesite ejercitar inglés (ej. `LanguageSwitcher`) lo cambia
 * explícitamente con `i18n.changeLanguage('en')`.
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import i18n from '@/i18n';
import { resetProfiles } from '@/mocks/handlers/profiles.handlers';
import { server } from '@/mocks/server';
import { installMatchMediaStub, resetViewportMatches } from './matchMedia';

installMatchMediaStub();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
beforeEach(async () => {
  resetProfiles();
  await i18n.changeLanguage('es-CO');
});
afterEach(() => {
  server.resetHandlers();
  resetViewportMatches();
});
afterAll(() => server.close());
