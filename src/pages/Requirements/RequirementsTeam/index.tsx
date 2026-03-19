import { useTranslation } from 'react-i18next';
import './index.less';

const RequirementsTeam = () => {
  const { t } = useTranslation();
  return (
    <div className="requirements-team">
      <div className="requirements-team-header">
        <h1 className="requirements-team-title">{t('sidebar.teamMembers')}</h1>
      </div>
      <div className="requirements-team-content">
        <div className="requirements-team-card">
          <p className="requirements-team-placeholder">{t('sidebar.teamMembers')}</p>
        </div>
      </div>
    </div>
  );
};

export default RequirementsTeam;
