/**
 * Presentación de los periodos de la lista de Educación y Experiencia Laboral. Los `YearMonth`
 * (`java.time.YearMonth`, formato `"YYYY-MM"`, sin día) se pintan como «mm/aaaa» (CM-273, PR 2, `SPEC.md` §3.3
 * punto 1). Desde CM-273 (PR 1, D-K) el formulario ya guarda «AAAA-MM» y `toYearMonth` (bloqueo C-14) dejó de
 * existir; en el PR 2 se borró también `formatYearMonth`, que ya no tenía consumidor.
 */
import type { TFunction } from 'i18next';
import { formatMonthValue } from '@/utils/monthMask';
import type { EducationItem, WorkExperienceItem } from './profile.types';

/**
 * Periodo de una experiencia en «mm/aaaa» con el separador «–» (CM-273, PR 2, `SPEC.md` §3.3 punto 1): «06/2024 –
 * actual», «06/2024 – Fin no registrado», «Sin fechas», «Sin fecha de inicio – 06/2024». Un inicio nulo se
 * sustituye por la pieza «Sin fecha de inicio» (CA-2.4.42, D-U), así que ningún literal sale del código.
 *
 * @param item experiencia ya persistida; `startDate` puede ser `null`.
 * @param t función de traducción con el idioma activo.
 * @returns el periodo ya traducido.
 */
export function formatWorkExperiencePeriod(item: WorkExperienceItem, t: TFunction): string {
  const start = item.startDate ? formatMonthValue(item.startDate) : null;
  const startPiece = start ?? t('profile:experiencia.sinFechaInicio');

  if (item.employmentStatus === 'CURRENT') {
    return t('profile:experiencia.periodoActual', { inicio: startPiece });
  }
  if (item.endDate) {
    return t('profile:experiencia.periodo', {
      inicio: startPiece,
      fin: formatMonthValue(item.endDate),
    });
  }
  return start
    ? t('profile:experiencia.periodoFinDesconocido', { inicio: start })
    : t('profile:experiencia.periodoSinFechas');
}

/**
 * Periodo de una formación en «mm/aaaa» con el separador «–» (CM-273, PR 2, `SPEC.md` §3.3 punto 1): «02/2025 – en
 * curso», «02/2025 – Sin fecha de fin», «01/2018 – 12/2023». El inicio de una formación es obligatorio.
 *
 * @param item formación ya persistida.
 * @param t función de traducción con el idioma activo.
 * @returns el periodo ya traducido.
 */
export function formatEducationPeriod(item: EducationItem, t: TFunction): string {
  const start = formatMonthValue(item.startDate);

  if (item.inProgress) return t('profile:educacion.periodoEnCurso', { inicio: start });
  if (item.endDate) {
    return t('profile:educacion.periodo', { inicio: start, fin: formatMonthValue(item.endDate) });
  }
  return t('profile:educacion.periodoSinFin', { inicio: start });
}
