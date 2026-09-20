/**
 * Landing pública (CM-186, HU-10.1, PRT-00.01). Reemplaza el placeholder
 * anterior (sin HU, `ARCHITECTURE.md` riesgo #1 — ya resuelto para esta
 * pantalla, sigue abierto para el Tablero/PRT-00.02). Compone las seis
 * secciones de Figma (`67:2` lg / `69:63` sm, `SPEC.md` §3.1): header, hero,
 * tres tarjetas de "módulos", dos de "Entreno/Simulación", banner de cierre
 * y pie de página.
 *
 * `<title>`/Open Graph vía `react-helmet-async` (`SPEC.md` §3.5), usando las
 * mismas llaves de `landing.json` que el resto del copy para no duplicarlo.
 */
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Button } from '@/design-system/atoms/Button';
import { Icon } from '@/design-system/icons/Icon';
import { FeatureCard } from '../organisms/FeatureCard';
import { Footer } from '../organisms/Footer';
import { HeaderPublico } from '../organisms/HeaderPublico';

export function LandingPage() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <div className="bg-bg-canvas flex min-h-dvh flex-col">
      <Helmet>
        <title>{t('seo.titulo')}</title>
        <meta property="og:title" content={t('seo.titulo')} />
        <meta name="description" content={t('seo.descripcion')} />
        <meta property="og:description" content={t('seo.descripcion')} />
      </Helmet>

      <HeaderPublico />

      <section className="gap-space-4 p-space-4 py-space-6 lg:gap-space-8 lg:p-space-9 flex flex-col items-center lg:flex-row lg:justify-between">
        <div className="gap-space-4 lg:gap-space-5 flex flex-col items-start lg:w-140">
          <h1 className="text-display-sm lg:text-display font-display text-text-primary">
            {t('hero.titulo')}
          </h1>
          <p className="text-body text-text-muted">{t('hero.subtitulo')}</p>
          <div className="gap-space-2 flex flex-col items-start">
            <Button variant="primary" size="lg" onClick={() => void navigate(ROUTES.registro)}>
              {t('cta.crearCuenta')}
            </Button>
            <span className="text-small text-text-muted">{t('hero.esGratis')}</span>
          </div>
        </div>

        <div className="bg-bg-inverse gap-space-3 lg:gap-space-4 p-space-4 lg:p-space-6 flex w-full flex-col items-start rounded-lg lg:w-120">
          <Icon name="microphone" size={28} className="text-action-primary lg:size-8" />
          <span className="text-h3 font-body text-text-on-inverse">{t('hero.tarjeta.titulo')}</span>
          <p className="text-body text-text-on-inverse">{t('hero.tarjeta.descripcion')}</p>
        </div>
      </section>

      <section className="gap-space-4 p-space-4 py-space-6 lg:gap-space-6 lg:px-space-9 lg:py-space-8 flex flex-col items-center">
        <h2 className="text-h2-sm lg:text-h2 font-display text-text-primary">
          {t('modulos.titulo')}
        </h2>
        <div className="gap-space-4 lg:gap-space-5 flex w-full flex-col items-stretch lg:flex-row">
          <FeatureCard
            className="lg:w-100"
            icon={<Icon name="microphone" />}
            title={t('modulos.simulacros.titulo')}
            description={t('modulos.simulacros.descripcion')}
          />
          <FeatureCard
            className="lg:w-100"
            icon={<Icon name="document" />}
            title={t('modulos.perfil.titulo')}
            description={t('modulos.perfil.descripcion')}
          />
          <FeatureCard
            className="lg:w-100"
            icon={<Icon name="chart" />}
            title={t('modulos.retroalimentacion.titulo')}
            description={t('modulos.retroalimentacion.descripcion')}
          />
        </div>
      </section>

      <section className="bg-bg-surface gap-space-4 p-space-4 py-space-6 lg:gap-space-6 lg:px-space-9 lg:py-space-8 flex flex-col items-center">
        <h2 className="text-h2-sm lg:text-h2 font-display text-text-primary">
          {t('entrenoVsSimulacion.titulo')}
        </h2>
        <div className="gap-space-4 lg:gap-space-6 flex w-full flex-col items-stretch lg:flex-row lg:justify-center">
          <FeatureCard
            className="p-space-4 lg:p-space-5 lg:w-110"
            icon={<Icon name="check-circle" className="lg:size-8" />}
            title={t('entrenoVsSimulacion.entreno.titulo')}
            description={t('entrenoVsSimulacion.entreno.descripcion')}
          />
          <FeatureCard
            className="p-space-4 lg:p-space-5 lg:w-110"
            icon={<Icon name="check-circle" className="lg:size-8" />}
            title={t('entrenoVsSimulacion.simulacion.titulo')}
            description={t('entrenoVsSimulacion.simulacion.descripcion')}
          />
        </div>
      </section>

      <section className="bg-bg-inverse gap-space-4 p-space-4 py-space-7 lg:gap-space-5 lg:py-space-9 flex flex-col items-center">
        <h2 className="text-display-sm font-display text-text-on-inverse text-center">
          {t('cierre.titulo')}
        </h2>
        <Button
          variant="primary"
          size="lg"
          className="w-full lg:w-auto"
          onClick={() => void navigate(ROUTES.registro)}
        >
          {t('cta.crearCuenta')}
        </Button>
      </section>

      <Footer />
    </div>
  );
}
