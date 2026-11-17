/**
 * CM-379 · HU-6.4 · PRT-06.03 — pantalla «Reporte de Evaluación».
 *
 * Tiene dirección propia por sesión (`/entrenar/sesion/:sessionId/reporte`), así que también se
 * abre pegando el enlace; vive dentro del `AppShell`, con el menú general (HU-6.4, navegación).
 * Muestra el encabezado (fecha local en formato largo, idioma y tono), el aviso sobre la IA, las 3
 * métricas de contenido y las 4 de voz, el Método STAR de cada pregunta conductual, las 5
 * preguntas con su respuesta y sus datos de voz, el bloque «Reporte completo · Próximamente» y
 * «Volver a inicio» (CA-6.4.1, CA-6.4.7). Estados: generando (CA-6.4.3), abandonada o sin
 * terminar (CA-6.4.4), ajena (CA-6.4.5) y error con «Reintentar» (CA-6.4.6).
 *
 * Los textos son los literales del anexo de Backend del 16-11-2026 (namespace `report`). Solo un
 * texto de ayuda («?») abierto a la vez: la página guarda cuál.
 */
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Button } from '@/design-system/atoms/Button';
import { Pill } from '@/design-system/atoms/Pill';
import { Spinner } from '@/design-system/atoms/Spinner';
import { Icon } from '@/design-system/icons/Icon';
import { HelpTip } from '@/design-system/molecules/HelpTip';
import { cn } from '@/utils/cn';
import { useEvaluationReport, type ReportError } from '../hooks/useEvaluationReport';
import { formatInteger, formatOneDecimal } from '../model/formatReportNumber';
import { STAR_PARTS, type Metric, type QuestionResult } from '../model/evaluationReport.types';
import { MetricCard } from '../organisms/MetricCard';
import { QuestionResultCard } from '../organisms/QuestionResultCard';
import { StarCard } from '../organisms/StarCard';

/**
 * Las métricas con valor se reparten en columnas parejas; las que no tienen resultado van debajo,
 * a lo ancho, para que su explicación no estire ni deje huecos en la fila de las demás.
 */
function MetricGrid({
  metrics,
  minWidth,
  render,
}: {
  metrics: Metric[];
  minWidth: '14rem' | '16rem';
  render: (metric: Metric) => ComponentProps<typeof MetricCard>;
}) {
  const withValue = metrics.filter((metric) => metric.value !== null);
  const withoutValue = metrics.filter((metric) => metric.value === null);
  return (
    <div className="gap-space-4 flex flex-col">
      {withValue.length > 0 ? (
        <div
          className={cn(
            'gap-space-4 grid',
            minWidth === '14rem'
              ? 'grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]'
              : 'grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]',
          )}
        >
          {withValue.map((metric) => (
            <MetricCard key={metric.code} {...render(metric)} />
          ))}
        </div>
      ) : null}
      {withoutValue.map((metric) => (
        <MetricCard key={metric.code} {...render(metric)} />
      ))}
    </div>
  );
}

const ERROR_KEYS: Record<ReportError, string> = {
  noEncontrada: 'errors:codigos.NOT_FOUND',
  abandonada: 'report:abandonada',
  noTerminada: 'report:noTerminada',
  generico: 'errors:generico',
  red: 'errors:red',
};

export function EvaluationReportPage() {
  const { sessionId = '' } = useParams();
  const { t, i18n } = useTranslation(['report', 'common', 'errors', 'interview']);
  const { state, retry } = useEvaluationReport(sessionId);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const locale = i18n.language;

  const help = (id: string) => ({
    open: openHelp === id,
    onOpenChange: (open: boolean) => setOpenHelp(open ? id : null),
  });

  if (state.status === 'generating') {
    return (
      <div className="py-space-9 flex flex-col items-center justify-center">
        <Spinner size={40} hideLabel={false} label={t('report:generando')} />
      </div>
    );
  }

  if (state.status === 'error') {
    const canRetry = state.error === 'generico' || state.error === 'red';
    return (
      <div className="gap-space-4 py-space-9 mx-auto flex max-w-xl flex-col items-center text-center">
        <p role="alert" className="text-h3 text-text-primary font-bold">
          {t(ERROR_KEYS[state.error])}
        </p>
        {canRetry ? (
          <Button onClick={retry}>{t('common:acciones.reintentar')}</Button>
        ) : (
          <Link
            to={ROUTES.inicio}
            className="border-border-strong px-space-5 text-body text-text-primary focus-visible:shadow-focus-ring min-h-touch-target inline-flex items-center rounded-full border font-bold focus-visible:outline-none"
          >
            {t('common:acciones.volverInicio')}
          </Link>
        )}
      </div>
    );
  }

  const { report } = state;
  const one = (value: number) => formatOneDecimal(value, locale);

  function metricProps(metric: Metric) {
    const name = t(`report:pantalla.nombresMetricas.${metric.code}`);
    const base = {
      name,
      help: t(`report:metricas.${metric.code}`),
      helpLabel: t('report:pantalla.nombresAccesibles.metrica', { name }),
      helpOpen: openHelp === metric.code,
      onHelpOpenChange: (open: boolean) => setOpenHelp(open ? metric.code : null),
      noResultLabel: t('report:pantalla.sinResultadoEtiqueta'),
      noResultHelp: t('report:sinResultado'),
    };
    if (metric.value === null || metric.unit === null) {
      return { ...base, value: null, unit: '', valueText: base.noResultLabel };
    }
    const value =
      metric.unit === 'WORDS_PER_MINUTE' ? formatInteger(metric.value, locale) : one(metric.value);
    const full = t(`report:pantalla.unidades.${metric.unit}`, { value });
    if (metric.unit === 'SCORE_1_5') {
      return {
        ...base,
        value,
        unit: full.replace(value, '').trim(),
        valueText: full,
        bar: { value: metric.value, min: 1, max: 5, startLabel: '1', endLabel: '5' },
      };
    }
    if (metric.unit === 'PERCENT') {
      return {
        ...base,
        value: full,
        unit: '',
        valueText: full,
        bar: {
          value: metric.value,
          min: 0,
          max: 100,
          startLabel: t('report:pantalla.unidades.PERCENT', { value: 0 }),
          endLabel: t('report:pantalla.unidades.PERCENT', { value: 100 }),
        },
      };
    }
    return { ...base, value, unit: full.replace(value, '').trim(), valueText: full };
  }

  // Separa el número de su unidad («132» y «palabras por minuto») para que la unidad vaya debajo,
  // en pequeño, sin partir la línea. Con «%» el número la lleva pegada («9,4 %»).
  function split(unit: 'WORDS_PER_MINUTE' | 'PERCENT' | 'PER_100_WORDS', value: string | null) {
    if (value === null) return { value: t('report:pantalla.sinResultadoEtiqueta') };
    const full = t(`report:pantalla.unidades.${unit}`, { value });
    if (unit === 'PERCENT') return { value: full };
    return { value, unit: full.replace(value, '').trim() };
  }

  function voiceOf(question: QuestionResult) {
    if (question.voice) {
      const voice = question.voice;
      return {
        kind: 'data' as const,
        title: t('report:pantalla.datosDeVozTitulo'),
        help: {
          label: t('report:pantalla.nombresAccesibles.vozDeLaRespuesta'),
          text: t('report:vozDeLaRespuesta'),
          ...help(`voz-${question.number}`),
        },
        items: [
          {
            label: t('report:pantalla.datosDeVoz.words'),
            value: formatInteger(voice.words, locale),
          },
          {
            label: t('report:pantalla.datosDeVoz.fillers'),
            value: formatInteger(voice.fillers, locale),
          },
          {
            label: t('report:pantalla.datosDeVoz.speechRate'),
            ...split(
              'WORDS_PER_MINUTE',
              voice.speechRate === null ? null : formatInteger(voice.speechRate, locale),
            ),
          },
          {
            label: t('report:pantalla.datosDeVoz.pauseTime'),
            ...split('PERCENT', voice.pauseTime === null ? null : one(voice.pauseTime)),
          },
          {
            label: t('report:pantalla.datosDeVoz.hesitationRate'),
            ...split(
              'PER_100_WORDS',
              voice.hesitationRate === null ? null : one(voice.hesitationRate),
            ),
          },
        ],
      };
    }
    if (question.origin === 'TEXT')
      return { kind: 'notice' as const, text: t('report:estados.sinDatosDeVoz') };
    if (question.origin === 'VOICE')
      return { kind: 'notice' as const, text: t('report:estados.vozSinDatos') };
    return null;
  }

  const interviewDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
    new Date(report.interviewDate),
  );

  return (
    <div className="gap-space-8 py-space-6 mx-auto flex w-full max-w-5xl flex-col">
      <header className="gap-space-4 flex flex-col">
        <h1 className="text-h1 font-display text-text-primary font-extrabold">
          {t('report:pantalla.titulo')}
        </h1>
        <dl className="gap-x-space-6 gap-y-space-2 text-body flex flex-wrap">
          <div className="gap-space-2 flex">
            <dt className="text-text-muted">{t('report:pantalla.encabezado.fecha')}</dt>
            <dd className="text-text-primary font-semibold">{interviewDate}</dd>
          </div>
          <div className="gap-space-2 flex">
            <dt className="text-text-muted">{t('report:pantalla.encabezado.idioma')}</dt>
            <dd className="text-text-primary font-semibold">
              {t(`interview:idioma.${report.sessionLanguage}`)}
            </dd>
          </div>
          <div className="gap-space-2 flex">
            <dt className="text-text-muted">{t('report:pantalla.encabezado.tono')}</dt>
            <dd className="text-text-primary font-semibold">
              {t(`interview:tono.${report.tone}`)}
            </dd>
          </div>
        </dl>
        <p className="bg-brand-tint p-space-4 text-body text-text-primary max-w-[72ch] rounded-lg">
          {t('report:aviso')}
        </p>
      </header>

      <section aria-labelledby="reporte-contenido" className="gap-space-4 flex flex-col">
        <h2 id="reporte-contenido" className="text-h2 font-display text-text-primary font-bold">
          {t('report:pantalla.secciones.contenido')}
        </h2>
        <MetricGrid metrics={report.contentMetrics} minWidth="16rem" render={metricProps} />
      </section>

      <section aria-labelledby="reporte-voz" className="gap-space-4 flex flex-col">
        <h2 id="reporte-voz" className="text-h2 font-display text-text-primary font-bold">
          {t('report:pantalla.secciones.voz')}
        </h2>
        <MetricGrid metrics={report.voiceMetrics} minWidth="14rem" render={metricProps} />
      </section>

      {report.star.length > 0 ? (
        <section aria-labelledby="reporte-star" className="gap-space-4 flex flex-col">
          <div className="gap-space-2 flex items-center">
            <h2 id="reporte-star" className="text-h2 font-display text-text-primary font-bold">
              {t('report:pantalla.secciones.star')}
            </h2>
            <HelpTip label={t('report:pantalla.nombresAccesibles.star')} {...help('star')}>
              {t('report:star')}
            </HelpTip>
          </div>
          {report.star.map((item) => (
            <StarCard
              key={item.questionNumber}
              questionLabel={t('report:pantalla.pregunta', { n: item.questionNumber })}
              questionText={item.questionText}
              levelLabel={
                item.level === null ? null : t('report:pantalla.starNivel', { n: item.level })
              }
              parts={STAR_PARTS.map((part) => ({
                name: t(`report:pantalla.starComponentes.${part}`),
                present: item.parts[part] === true,
                stateLabel:
                  item.parts[part] === true
                    ? t('report:pantalla.starPresente')
                    : t('report:pantalla.starAusente'),
              }))}
              noResultLabel={t('report:pantalla.sinResultadoEtiqueta')}
              noResultHelp={t('report:sinResultado')}
            />
          ))}
        </section>
      ) : null}

      <section aria-labelledby="reporte-preguntas" className="gap-space-4 flex flex-col">
        <h2 id="reporte-preguntas" className="text-h2 font-display text-text-primary font-bold">
          {t('report:pantalla.secciones.preguntas')}
        </h2>
        {report.questions.map((question) => (
          <QuestionResultCard
            key={question.number}
            numberLabel={t('report:pantalla.pregunta', { n: question.number })}
            typeLabel={question.type ? t(`report:tiposDePregunta.${question.type}`) : ''}
            originLabel={question.origin ? t(`report:pantalla.origen.${question.origin}`) : ''}
            questionText={question.text}
            answerTitle={t('report:pantalla.respuestaTitulo')}
            answerHelp={{
              label: t('report:pantalla.nombresAccesibles.respuesta'),
              text: t('report:respuesta'),
              ...help(`respuesta-${question.number}`),
            }}
            answer={
              question.answer === null
                ? { text: t('report:estados.sinRespuesta'), missing: true }
                : { text: question.answer, missing: false }
            }
            voice={voiceOf(question)}
          />
        ))}
      </section>

      <section
        aria-labelledby="reporte-completo"
        className="gap-space-2 border-border-strong bg-bg-surface p-space-5 flex flex-col rounded-xl border border-dashed"
      >
        <div className="gap-space-3 flex flex-wrap items-center">
          <h2 id="reporte-completo" className="text-h3 font-display text-text-muted font-bold">
            {t('report:reporteCompleto.titulo')}
          </h2>
          <Pill>
            <Icon name="lock" size={12} />
            <span>{t('report:reporteCompleto.etiqueta')}</span>
          </Pill>
        </div>
        <p className="text-body text-text-muted">{t('report:reporteCompleto.texto')}</p>
      </section>

      <div className="flex justify-center">
        <Link
          to={ROUTES.inicio}
          className="bg-action-primary px-space-6 text-body text-action-on-primary hover:bg-action-primary-hover focus-visible:shadow-focus-ring min-h-touch-target inline-flex items-center rounded-full font-bold focus-visible:outline-none"
        >
          {t('common:acciones.volverInicio')}
        </Link>
      </div>
    </div>
  );
}
