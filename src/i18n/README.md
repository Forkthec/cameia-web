# i18n

Tres reglas, sin excepciones:

1. **Ningún texto visible se escribe en un componente.** Todo string que ve un humano pasa
   por `t('namespace:llave')` — incluidos placeholders, `aria-label` y mensajes de error.
2. **Los catálogos guardan códigos, no etiquetas.** La etiqueta visible sale de i18n
   (`t('interview:tono.ESTRICTO')`), nunca se hardcodea el nombre legible en el catálogo.
3. **El idioma de la interfaz y `sesion_entrevista.idioma` son cosas distintas y no se
   acoplan.** Uno es preferencia de UI (este módulo); el otro es un dato de negocio del
   entrevistador IA en formato BCP-47. Uno puede sugerirse como valor por defecto del otro,
   nada más.
