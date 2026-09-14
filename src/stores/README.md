# stores/

Regla de tres líneas para decidir dónde vive un dato:

- **Servidor → TanStack Query.** Cualquier respuesta HTTP (perfil, catálogo, sesión de
  entrevista) vive en el cache de queries, con su propio `staleTime` e invalidación.
- **Cliente → Zustand.** Sesión de auth, preferencias de UI, borradores de wizard: estado
  que no vino de una petición y que varias partes de la app necesitan leer o modificar.
- **Formularios → React Hook Form.** El estado de un formulario en progreso (valores,
  errores de validación) vive en su propio `useForm`, no en Zustand ni en Query.

Nunca dupliques en Zustand una respuesta HTTP: si un valor ya vive en una query, se lee
de ahí (o de un selector sobre ella), no se copia a un store aparte que puede quedar
desincronizado del servidor.
