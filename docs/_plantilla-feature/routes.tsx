// PLANTILLA — se copia a src/features/<nombre>/routes.tsx.
//
// Mapea cada path de la feature a la página de pages/ que le corresponde,
// tal como hacen las features reales (ver src/features/auth/routes.tsx).
// Un RouteObject por entrada; el catálogo tipado de paths vive en
// app/router/routes.ts, este archivo solo lo referencia.
//
// Se llena en el paso 4 del orden de construcción de CLAUDE.md §8, cuando
// pages/ ya existe.
//
// Forma esperada (comentario, no código funcional):
//
// import type { RouteObject } from 'react-router';
// import { AlgunaPage } from './pages/AlgunaPage';
//
// export const <nombre>Routes: RouteObject[] = [
//   { path: '/ruta', element: <AlgunaPage /> },
// ];
