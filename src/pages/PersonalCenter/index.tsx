import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Typography } from '@douyinfe/semi-ui';
import PersonalCredentialManagement from './PersonalCredentialManagement';

import './index.less';

const PersonalCenter = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    if (location.pathname.includes('/personal-credentials')) {
      return 'personalCredentials';
    }
    if (location.pathname.includes('/settings')) {
      return 'settings';
    }
    return 'personalCredentials';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'personalCredentials') {
      navigate('/personal-center/personal-credentials');
    } else if (key === 'settings') {
      navigate('/personal-center/settings');
    }
  };

  return (
    <div className="personal-center-page">
      {/* Tabs */}
      <div className="personal-center-tabs">
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane
            tab={t('personalCenter.tabs.settings')}
            itemKey="settings"
          >
            <div className="personal-center-settings-placeholder">
              {t('personalCenter.settings.comingSoon')}
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={t('personalCenter.tabs.personalCredentials')}
            itemKey="personalCredentials"
          >
            <PersonalCredentialManagement />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default PersonalCenter;
