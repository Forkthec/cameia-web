/**
 * Protege los literales de fechas de `profile.json` que exige el backlog v7 de HU-2.4 (CM-273, PR 1;
 * `SPEC.md` §3.3): el texto sale del documento de criterios, no se redacta aquí. Las pruebas de las
 * secciones reciben estos textos por propiedades, así que no pueden vigilar el JSON real; esta sí. Los
 * nombres de las llaves nuevas (`fechas.errorFormato`, `fechas.errorPosteriorMesActual`) son propuesta de
 * estas pruebas en rojo: el SPEC no los fija. Las llaves del panel de `MonthField` (marcador de posición,
 * abrir, título, año anterior y siguiente) no están en el backlog y no se vigilan aquí hasta que se acuerden.
 */
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';

function resource(lng: 'es-CO' | 'en', key: string): unknown {
  return i18n.getResource(lng, 'profile', key);
}

describe('literales de fechas en profile.json', () => {
  it('«Ingresa una fecha válida con el formato mm/aaaa.» existe en es-CO (CA-2.4.43, 44 y 60)', () => {
    expect(resource('es-CO', 'fechas.errorFormato')).toBe(
      'Ingresa una fecha válida con el formato mm/aaaa.',
    );
  });

  it('«La fecha no puede ser posterior al mes actual.» existe en es-CO (CA-2.4.25, 26, 34 y 35)', () => {
    expect(resource('es-CO', 'fechas.errorPosteriorMesActual')).toBe(
      'La fecha no puede ser posterior al mes actual.',
    );
  });

  it('«La fecha de fin no puede ser anterior a la de inicio.» es el mismo texto en experiencia y en formación (CA-2.4.14 y CA-2.4.30)', () => {
    const literal = 'La fecha de fin no puede ser anterior a la de inicio.';

    expect(resource('es-CO', 'experiencia.fechaFin.errorAnterior')).toBe(literal);
    expect(resource('es-CO', 'educacion.fechaFin.errorAnterior')).toBe(literal);
  });

  it('los dos mensajes nuevos existen también en inglés, con texto propio', () => {
    for (const key of ['fechas.errorFormato', 'fechas.errorPosteriorMesActual']) {
      const english = resource('en', key);

      expect(typeof english).toBe('string');
      expect((english as string).length).toBeGreaterThan(0);
      expect(english).not.toBe(resource('es-CO', key));
    }
  });
});
