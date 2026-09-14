/**
 * Validación del formulario de Información General (CA-2.3.3, CA-2.3.5).
 * A propósito sin mensajes de texto: CLAUDE.md §3.2 prohíbe cualquier texto
 * visible fuera de `t(...)`, y un mensaje de zod nunca llega a pantalla —
 * el componente inspecciona `error.type` (`too_small` / `too_big`) y elige
 * la prop de texto ya traducida que le corresponde. Ver
 * `GeneralInfoForm.tsx`.
 */
import { z } from 'zod';
import { NAME_MAX_LENGTH, SUMMARY_MAX_LENGTH } from '../model/profile.constants';

export const generalInfoSchema = z.object({
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  summary: z.string().max(SUMMARY_MAX_LENGTH),
});

export type GeneralInfoFormValues = z.infer<typeof generalInfoSchema>;
