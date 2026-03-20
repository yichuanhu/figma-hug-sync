import { useTranslation } from 'react-i18next';
import { IllustrationConstruction } from '@douyinfe/semi-illustrations';
import { Empty } from '@douyinfe/semi-ui';
import './index.less';

const BusinessOutcomes = () => {
  const { t } = useTranslation();
  return (
    <div className="business-outcomes-page">
      <h2>{t('operations.businessOutcomes.title')}</h2>
      <Empty
        image={<IllustrationConstruction style={{ width: 150, height: 150 }} />}
        description={t('operations.comingSoon')}
      />
    </div>
  );
};

export default BusinessOutcomes;
