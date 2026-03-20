import { useTranslation } from 'react-i18next';

const ExecutionReport = () => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '24px' }}>
      <h2>{t('sidebar.executionReport')}</h2>
    </div>
  );
};

export default ExecutionReport;
