import { useTranslation } from 'react-i18next';
import './index.less';

const Requirements = () => {
  const { t } = useTranslation();
  return (
    <div className="enterprise-exclusive-page">
      <img src="/images/enterprise-exclusive.png" alt={t('exclusivePage.enterpriseTitle')} className="enterprise-exclusive-img" />
      <p className="enterprise-exclusive-title">{t('exclusivePage.enterpriseTitle')}</p>
      <p className="enterprise-exclusive-hint">{t('exclusivePage.requirementsDesc')}</p>
    </div>
  );
};

export default Requirements;
