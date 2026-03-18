import { useTranslation } from 'react-i18next';
import '@/pages/Requirements/index.less';

const Operations = () => {
  const { t } = useTranslation();
  return (
    <div className="enterprise-exclusive-page">
      <img src="/images/enterprise-exclusive.png" alt={t('exclusivePage.enterpriseTitle')} className="enterprise-exclusive-img" />
      <p className="enterprise-exclusive-title">{t('exclusivePage.enterpriseTitle')}</p>
      <p className="enterprise-exclusive-hint">{t('exclusivePage.operationsDesc')}</p>
    </div>
  );
};

export default Operations;
