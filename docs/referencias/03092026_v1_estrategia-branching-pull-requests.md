# Estrategia de branching y Pull Requests de CAMEIA

- **Versión:** 1.2
- **Fecha:** 3 de septiembre de 2026
- **Estado:** aprobada por el equipo según confirmación de Paula Andrea Muñoz Delgado
- **Corrección del 5-sep-2026:** Paula Andrea Muñoz Delgado confirma el prefijo `CM-`. Se corrige la documentación, no se cambia el flujo ni se renombran ramas remotas.
- **Aplicación:** todos los repositorios activos de CAMEIA
- **Registro relacionado:** Jira `CM-99`

## 1. Ramas principales

### `main`

- Es la rama estable, integrada, validada y preparada para entrega.
- No recibe desarrollo ni pushes directos.
- Recibe cambios exclusivamente mediante Pull Request desde `develop`.
- Se integra mediante **Merge commit**.
- No se elimina.

### `develop`

- Es la rama principal de integración y representa el desarrollo integrado.
- Recibe las ramas de trabajo mediante Pull Request y **Squash and merge**.
- Es la única rama autorizada como origen de Pull Requests hacia `main`.
- No se elimina después de promover cambios a `main`.
- No recibe pushes directos; todo cambio ingresa mediante una rama `CM-*` y Pull Request.

## 2. Ramas de trabajo

- Nacen siempre desde `develop`.
- Son de corta duración y se eliminan después de integrarse.
- Utilizan el formato `CM-<numero>-<descripcion-kebab-case>`.
- `CM-<numero>` corresponde a la clave real de la tarea Jira; rama, título del PR y enlace Jira identifican el mismo trabajo.
- No incorporan prefijos como `feature/`, `fix/` o `chore/`.
- La descripción es breve y expresa el propósito del cambio.

Ejemplos válidos:

```text
CM-101-configuracion-docker
CM-102-login-usuario
CM-103-validacion-ofertas
```

## 3. Flujo de integración

```text
CM-numero-descripcion ── PR + Squash ──> develop ── PR + Merge commit ──> main
```

### Ramas `CM-*` hacia `develop`

- Todo trabajo funcional, corrección o tarea ordinaria entra mediante Pull Request.
- `proteccion-develop` utiliza temporalmente cero aprobaciones obligatorias; se solicita revisión distinta del autor como control manual y se mantiene la resolución de conversaciones.
- Utiliza exclusivamente **Squash and merge**.
- La rama se elimina después de integrarse.

### `develop` hacia `main`

- La promoción se realiza exclusivamente mediante Pull Request `develop → main`.
- Una rama `CM-*` nunca abre un Pull Request directo hacia `main`.
- Utiliza exclusivamente **Merge commit**.
- `develop` se conserva después de la integración.
- La restricción del origen `develop` se revisa humanamente mientras no exista un check automático estable que la valide.

## 4. Convención de Pull Requests

Un Pull Request ordinario utiliza:

```text
CM-NNN | tipo(scope): resultado
```

El cuerpo enlaza la tarea Jira correspondiente. Su clave `CM-NNN` coincide con la usada en la rama y en el título del PR; no se mantiene un identificador paralelo de cambio.

Una promoción utiliza:

```text
release: promover <version> de develop a main
```

El cuerpo enumera las tareas Jira incluidas, evidencia de validación, riesgos y rollback.

## 5. Prohibición de cambios directos

- `main` y `develop` no tienen bypass operativo.
- Ningún team, cuenta administrativa o rol DevOps utiliza push directo como flujo de mantenimiento.
- La configuración o reparación de la integración también se realiza desde una rama `CM-*`, mediante Pull Request hacia `develop` y revisión de una persona distinta del autor.
- Una emergencia que no pueda seguir este flujo requiere una decisión humana nueva y explícita; no existe una excepción permanente configurada de antemano.

## 6. Convención de commits

Los commits no requieren incluir `CM-NNN` ni la clave Jira. Deben describir claramente un cambio coherente y se recomienda Conventional Commits.

Tipos permitidos:

- `feat`: nueva funcionalidad;
- `fix`: corrección de errores;
- `test`: creación o modificación de pruebas;
- `chore`: mantenimiento o configuración;
- `docs`: documentación;
- `refactor`: reestructuración sin cambio de comportamiento;
- `build`: construcción o dependencias;
- `ci`: integración o despliegue continuo.

Ejemplos:

```text
feat: agregar validación de ofertas laborales
fix: corregir validación de campos obligatorios
test: agregar pruebas para autenticación
chore: actualizar configuración de Docker
docs: actualizar documentación de despliegue
refactor: simplificar manejo de errores
ci: configurar pipeline de integración
```

## 7. Rulesets

### `proteccion-develop`

- patrón: `develop`;
- bypass: vacío;
- PR obligatorio y cero aprobaciones obligatorias temporalmente;
- aprobaciones obsoletas descartadas;
- conversaciones resueltas;
- eliminación y force-push bloqueados;
- historial lineal obligatorio;
- método permitido: **Squash**.

### `proteccion-main`

- patrón: `main`;
- bypass: vacío;
- PR obligatorio y una aprobación;
- aprobaciones obsoletas descartadas;
- conversaciones resueltas;
- eliminación y force-push bloqueados;
- historial lineal deshabilitado porque debe admitir merge commits;
- método permitido: **Merge**.

Los status checks, despliegues, firmas, análisis de código y cobertura se hacen obligatorios solo después de existir y superar pruebas positivas y negativas.

`proteccion-main` conserva una aprobación obligatoria. La justificación y fecha de revisión de la excepción temporal de `develop` permanecen pendientes.

## 8. Registro en Jira

Actualizar `CM-99` como mínimo con:

- la decisión y fecha de aprobación;
- el cambio de convención anterior a `CM-<numero>-<descripcion>`;
- métodos Squash hacia `develop` y Merge commit hacia `main`;
- ausencia de bypass en ambos rulesets;
- enlaces a rulesets y pruebas de rechazo;
- documentos y plantillas actualizados;
- bloqueos, siguiente paso y responsable.

No cerrar `CM-99` hasta verificar ambos rulesets y al menos un flujo `CM-* → develop → main`.
