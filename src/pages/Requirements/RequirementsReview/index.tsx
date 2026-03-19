import { useTranslation } from 'react-i18next';
import './index.less';

const RequirementsReview = () => {
  const { t } = useTranslation();
  return (
    <div className="requirements-review">
      <div className="requirements-review-header">
        <h1 className="requirements-review-title">{t('sidebar.requirementsReview')}</h1>
      </div>
      <div className="requirements-review-content">
        <div className="requirements-review-card">
          <p className="requirements-review-placeholder">{t('sidebar.requirementsReview')}</p>
        </div>
      </div>
    </div>
  );
};

export default RequirementsReview;
