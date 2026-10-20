/**
 * Validacion del paso "Oferta y rol" (CA-4.2.4 a CA-4.2.16).
 * Sin mensajes de texto: CLAUDE.md §3.2. El componente inspecciona
 * `error.type` y elige la llave i18n que corresponde.
 */
import { z } from 'zod';
import { JOB_OFFER_MAX_LENGTH } from '../model/interviewSetup.constants';

export const offerAndRoleSchema = z.object({
  jobOffer: z
    .string()
    .max(JOB_OFFER_MAX_LENGTH)
    .transform((v) => (v.trim().length === 0 ? '' : v)),
  targetRoleId: z.string().min(1),
});

export type OfferAndRoleFormValues = z.infer<typeof offerAndRoleSchema>;
