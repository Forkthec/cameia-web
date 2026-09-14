// PLANTILLA — se copia a src/features/<nombre>/index.ts.
//
// Superficie pública de la feature: solo lo que otra capa (normalmente
// app/router) necesita importar desde fuera, casi siempre el array de
// RouteObject de routes.tsx (ver src/features/auth/index.ts como ejemplo
// real). Nunca reexporta organisms/, hooks/ ni model/ hacia afuera: eso
// rompería el aislamiento entre features (CLAUDE.md, regla dura 4).
//
// Se llena junto con routes.tsx, en el paso 4 del orden de construcción de
// CLAUDE.md §8.
//
// Forma esperada (comentario, no código funcional):
//
// export { <nombre>Routes } from './routes';
