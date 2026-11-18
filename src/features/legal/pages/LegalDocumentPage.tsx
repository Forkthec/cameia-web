/**
 * Página pública de una política (CM-365, criterio 1): título, versión
 * (`POLICY_VERSION`), fecha de vigencia y el texto aprobado por la Product
 * Owner, por secciones. El texto vive en el namespace `legal` (CLAUDE.md §3.2)
 * para editarlo sin tocar código. Se abre desde el registro en otra pestaña,
 * así que no depende de la sesión.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { POLICY_VERSION } from '@/config/policy';
import { Logo } from '@/design-system/atoms/Logo';
import type { LegalDocument, LegalSection } from '../model/legalDocuments';

interface LegalDocumentPageProps {
  /** Qué política muestra. */
  document: LegalDocument;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const { t } = useTranslation(['legal', 'common']);
  const sections = t(`legal:documentos.${document}.secciones`, { returnObjects: true });
  const list: LegalSection[] = Array.isArray(sections) ? (sections as LegalSection[]) : [];

  return (
    <div className="bg-bg-canvas px-space-4 py-space-7 min-h-dvh">
      <article className="gap-space-6 mx-auto flex max-w-[45rem] flex-col">
        <Link to={ROUTES.landing} className="self-start">
          <Logo wordmarkLabel={t('common:marca.nombre')} />
        </Link>
        <header className="gap-space-2 flex flex-col">
          <h1 className="text-h1 font-display text-text-primary">
            {t(`legal:documentos.${document}.titulo`)}
          </h1>
          <p className="text-small text-text-muted">
            {t('legal:version', { version: POLICY_VERSION })} ·{' '}
            {t('legal:vigencia', { fecha: t('legal:fechaVigencia') })}
          </p>
        </header>
        {list.map((section) => (
          <section key={section.titulo} className="gap-space-2 flex flex-col">
            <h2 className="text-h3 font-display text-text-primary">{section.titulo}</h2>
            {section.parrafos.map((paragraph) => (
              <p key={paragraph} className="text-body text-text-primary">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
