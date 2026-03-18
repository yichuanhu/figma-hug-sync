import { useTranslation } from 'react-i18next';
import '@/pages/Requirements/index.less';

const MaintenanceWorkbench = () => {
  const { t } = useTranslation();
  return (
    <div className="enterprise-exclusive-page">
      <img src="/images/maintenance-coming-soon.png" alt={t('exclusivePage.comingSoonTitle')} style={{ width: 280, height: 280, objectFit: 'contain', marginBottom: 20 }} />
      <p className="enterprise-exclusive-title">{t('exclusivePage.comingSoonTitle')}</p>
      <p className="enterprise-exclusive-hint" style={{ maxWidth: 560 }}>{t('exclusivePage.maintenanceDesc')}</p>
    </div>
  );
};

export default MaintenanceWorkbench;
