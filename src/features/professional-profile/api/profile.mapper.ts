/**
 * Cortafuegos entre el contrato crudo (`ProfileDto`) y el modelo de UI
 * (`Profile`) — CLAUDE.md §8: todo lo que el backend pueda cambiar se
 * detiene aquí, nunca llega directo a un componente. Hoy es una copia
 * campo a campo porque el mock y el modelo de dominio coinciden en
 * nombre, pero es el único sitio que se toca si eso deja de ser cierto
 * cuando exista el contrato real (bloqueo C-01).
 */
import type { Profile } from '../model/profile.types';
import type { ProfileDto } from './profile.dto';

export function toProfile(dto: ProfileDto): Profile {
  return {
    id: dto.id,
    status: dto.status,
    name: dto.name,
    summary: dto.summary,
    summaryProvenance: dto.summaryProvenance,
  };
}
