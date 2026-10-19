/**
 * Tablero de inicio provisional (HU-10.4, PRT-00.02). Muestra un saludo y
 * tarjetas de acceso rapido a las funciones principales: nueva entrevista y
 * perfil profesional. Se reemplazara por el dashboard completo cuando entre
 * su HU con metricas y resumen de progreso.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/design-system/icons/Icon';
import { cn } from '@/utils/cn';

interface QuickActionCardProps {
  to: string;
  iconName: 'plus' | 'user';
  title: string;
  description: string;
}

function QuickActionCard({ to, iconName, title, description }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'border-border-subtle bg-bg-surface rounded-radius-md p-space-5 border',
        'hover:border-brand-accent hover:shadow-elevation-1 transition-all',
        'focus-visible:shadow-focus-ring focus-visible:outline-none',
        'gap-space-4 flex items-start',
      )}
    >
      <div className="bg-brand-accent/10 text-brand-accent rounded-radius-sm p-space-3 flex shrink-0 items-center justify-center">
        <Icon name={iconName} size={24} />
      </div>
      <div>
        <h2 className="text-body text-text-primary font-semibold">{title}</h2>
        <p className="text-small text-text-muted mt-space-1">{description}</p>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { t } = useTranslation('home');

  return (
    <div className="p-space-5 mx-auto max-w-2xl">
      <div className="mb-space-8">
        <h1 className="text-h2 text-text-primary font-bold">{t('saludo')}</h1>
        <p className="text-body text-text-muted mt-space-2">{t('descripcion')}</p>
      </div>

      <div className="gap-space-4 flex flex-col">
        <QuickActionCard
          to="/entrevistas/nueva"
          iconName="plus"
          title={t('nuevaEntrevista.titulo')}
          description={t('nuevaEntrevista.descripcion')}
        />
        <QuickActionCard
          to="/perfiles"
          iconName="user"
          title={t('miPerfil.titulo')}
          description={t('miPerfil.descripcion')}
        />
      </div>
    </div>
  );
}
