import { useTranslation } from 'react-i18next';

const TargetManagement = () => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '24px' }}>
      <h2>{t('sidebar.targetManagement')}</h2>
    </div>
  );
};

export default TargetManagement;
