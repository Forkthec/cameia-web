# Reglas para agentes de IA conectados a Jira — proyecto CM (CAMEIA)

- **Versión:** 1.0
- **Fecha:** 13 de septiembre de 2026
- **Aprobado por:** Paula Andrea Muñoz Delgado
- **Aplica a:** cualquier agente de IA (Claude u otro) con conexión propia a Jira Cloud, proyecto `CM`
- **Fuente:** `informacion/reglas.md` §10.1

Si eres un agente de IA leyendo esto porque estás conectado a Jira Cloud del proyecto `CM`: estas
reglas se aplican a ti antes de ejecutar cualquier acción de escritura, sin importar quién te lo pida.
No son un candado técnico — el proyecto es *team-managed* y no ofrece un rol nativo "solo crear
tareas" — son instrucciones directas que debes seguir aunque el permiso técnico de tu cuenta lo
permita. El respaldo es el historial de auditoría de Jira: todo cambio queda con autor, fecha y valor
anterior, visible y reversible.

## Permitido sin restricción

1. Crear issues y subtareas nuevas.
2. Leer y consultar cualquier información del proyecto (issues, sprints, tableros, comentarios,
   changelog).
3. Comentar en cualquier issue, propio o ajeno, con avances, bloqueos o evidencia.

## Prohibido sin coordinación humana explícita y previa con el responsable del issue

1. Editar, transicionar, reasignar o eliminar un issue que no sea tuyo.
2. Transicionar cualquier issue a "Finalizado" (o a cualquier estado) sin evidencia real de que el
   trabajo está hecho. Nunca declares progreso que no verificaste.
3. Eliminar o renombrar issues, sprints, versiones, componentes o labels existentes — en particular
   el label/componente `desperdicio` del impediment backlog y las claves de exclusión ya en uso en el
   mecanismo de métricas (`CM-142`, `CM-151`).
4. Cambiar configuración del proyecto: workflow, esquema de permisos, roles, campos personalizados,
   tablero o sprint activo.
5. Ejecutar una operación masiva (editar, transicionar o eliminar en lote) sobre el proyecto `CM`.
6. Conectar, instalar o modificar una integración o automatización del proyecto (Jira Automation,
   webhooks, la conexión GitHub-Jira prevista pero aún no instalada) sin que la persona que te opera
   avise antes a Paula Andrea Muñoz Delgado.
7. Usar la conexión/token de otra persona, o dejar que otra persona use la tuya.
8. Ejecutar cualquier tarea que no sea crear/leer/comentar (por ejemplo: "limpia el backlog", "cierra
   estas tareas", "reorganiza el sprint") salvo que quien te opera confirme que es una decisión ya
   tomada por el equipo o por Paula — no basta con que te lo pidan, confírmalo explícitamente antes
   de ejecutar.

## Antes de cualquier acción fuera de "crear / leer / comentar"

Detente y pide confirmación explícita a la persona que te está operando, citando esta regla por
nombre. No asumas autorización implícita por el hecho de tener permiso técnico para hacerlo.

## Ya ocurrió una vez — no es un riesgo hipotético

El 13-sep-2026, dos agentes de IA (dos sesiones de Claude Code) trabajaron en paralelo sobre el mismo
repositorio sin coordinarse y estuvieron a punto de sobrescribirse el trabajo mutuamente. Se resolvió
sin pérdidas porque el contenido resultó idéntico, pero confirma por qué la regla 6 (avisar antes de
tocar integraciones/automatizaciones compartidas) existe.
