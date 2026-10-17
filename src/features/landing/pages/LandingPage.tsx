/**
 * Landing pública (CM-186, HU-10.1, PRT-00.01). Compone las secciones de
 * Figma (`67:2` lg / `69:63` sm, `SPEC.md` §3.1): header, hero, tres
 * tarjetas de "módulos", dos de "Entreno/Simulación", banner de cierre y pie
 * de página.
 *
 * **Dirección «Amanecer» (CM-329, `SPEC.md` §3.7).** Sobre esa misma
 * estructura y el mismo copy:
 * - Una intro de marca opcional (`BrandIntro`, una vez por sesión, saltable)
 *   que se recoge para descubrir el hero; el hero retrasa su propia entrada
 *   para encadenarse con ella, y la adelanta si el usuario la salta.
 * - Cada sección de contenido es una `LandingSection`: ocupa una pantalla en
 *   `lg` con encaje suave del scroll (`scroll-snap-sections`, solo mientras
 *   esta página está montada) y revela su contenido al entrar.
 * - Una sección nueva, «Cómo funciona» (`JourneySteps`), antes del cierre.
 *
 * `<title>`/Open Graph vía `react-helmet-async` (`SPEC.md` §3.5), usando las
 * mismas llaves de `landing.json` que el resto del copy para no duplicarlo.
 */
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Icon } from '@/design-system/icons/Icon';
import { useBrandIntro } from '../hooks/useBrandIntro';
import { useDocumentClass } from '../hooks/useDocumentClass';
import { BrandIntro } from '../organisms/BrandIntro';
import { ClosingBanner } from '../organisms/ClosingBanner';
import { FeatureCard } from '../organisms/FeatureCard';
import { Footer } from '../organisms/Footer';
import { HeaderPublico } from '../organisms/HeaderPublico';
import { HeroSection } from '../organisms/HeroSection';
import { JourneySteps } from '../organisms/JourneySteps';
import { LandingSection } from '../organisms/LandingSection';
import { ModeCard } from '../organisms/ModeCard';
import { SectionHeader } from '../organisms/SectionHeader';

/** Cuánto espera el hero cuando la intro está en pantalla: justo cuando empieza el telón. */
const HERO_DELAY_WITH_INTRO_MS = 1450;
const HERO_DELAY_MS = 100;
/** Escalonado entre tarjetas hermanas al revelarse. */
const CARD_STAGGER_MS = 120;

const MODULES = [
  { key: 'simulacros', icon: 'microphone' },
  { key: 'perfil', icon: 'document' },
  { key: 'retroalimentacion', icon: 'chart' },
] as const;

export function LandingPage() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const intro = useBrandIntro();
  useDocumentClass('scroll-snap-sections');

  const heroDelayMs =
    intro.startedVisible && !intro.skipped ? HERO_DELAY_WITH_INTRO_MS : HERO_DELAY_MS;
  const goToRegistration = () => void navigate(ROUTES.registro);

  return (
    <div className="bg-bg-canvas flex min-h-dvh flex-col">
      <Helmet>
        <title>{t('seo.titulo')}</title>
        <meta property="og:title" content={t('seo.titulo')} />
        <meta name="description" content={t('seo.descripcion')} />
        <meta property="og:description" content={t('seo.descripcion')} />
      </Helmet>

      {intro.visible ? <BrandIntro onSkip={intro.skip} /> : null}

      <HeaderPublico />

      <main>
        <HeroSection entranceDelayMs={heroDelayMs} onCreateAccount={goToRegistration} />

        <LandingSection labelledBy="landing-modulos-titulo">
          {(inView) => (
            <>
              <SectionHeader
                index={1}
                label={t('modulos.etiqueta')}
                title={t('modulos.titulo')}
                titleId="landing-modulos-titulo"
                inView={inView}
              />
              <div className="gap-space-4 lg:gap-space-5 grid lg:grid-cols-3">
                {MODULES.map((module, index) => (
                  <FeatureCard
                    key={module.key}
                    index={index + 1}
                    icon={<Icon name={module.icon} />}
                    title={t(`modulos.${module.key}.titulo`)}
                    description={t(`modulos.${module.key}.descripcion`)}
                    inView={inView}
                    entranceDelayMs={150 + index * CARD_STAGGER_MS}
                  />
                ))}
              </div>
            </>
          )}
        </LandingSection>

        <LandingSection labelledBy="landing-modos-titulo" background="surface">
          {(inView) => (
            <>
              <SectionHeader
                index={2}
                label={t('entrenoVsSimulacion.etiqueta')}
                title={t('entrenoVsSimulacion.titulo')}
                titleId="landing-modos-titulo"
                inView={inView}
              />
              <div className="gap-space-4 lg:gap-space-6 grid lg:grid-cols-2">
                <ModeCard
                  mode="ENTRENO"
                  title={t('entrenoVsSimulacion.entreno.titulo')}
                  tag={t('entrenoVsSimulacion.entreno.etiqueta')}
                  description={t('entrenoVsSimulacion.entreno.descripcion')}
                  timelineStart={t('entrenoVsSimulacion.entreno.lineaTiempo.inicio')}
                  timelineEnd={t('entrenoVsSimulacion.entreno.lineaTiempo.fin')}
                  inView={inView}
                  entranceDelayMs={150}
                />
                <ModeCard
                  mode="SIMULACION"
                  title={t('entrenoVsSimulacion.simulacion.titulo')}
                  tag={t('entrenoVsSimulacion.simulacion.etiqueta')}
                  description={t('entrenoVsSimulacion.simulacion.descripcion')}
                  timelineStart={t('entrenoVsSimulacion.simulacion.lineaTiempo.inicio')}
                  timelineEnd={t('entrenoVsSimulacion.simulacion.lineaTiempo.fin')}
                  inView={inView}
                  entranceDelayMs={150 + CARD_STAGGER_MS}
                />
              </div>
            </>
          )}
        </LandingSection>

        <LandingSection labelledBy="landing-pasos-titulo">
          {(inView) => <JourneySteps index={3} titleId="landing-pasos-titulo" inView={inView} />}
        </LandingSection>

        <ClosingBanner onCreateAccount={goToRegistration} />
      </main>

      <Footer />
    </div>
  );
}
