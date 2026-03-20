import { useTranslation } from 'react-i18next';

const PerformanceAnalysis = () => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '24px' }}>
      <h2>{t('sidebar.performanceAnalysis')}</h2>
    </div>
  );
};

export default PerformanceAnalysis;
