import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Typography, Breadcrumb } from '@douyinfe/semi-ui';
import AppLayout from '@/components/layout/AppLayout';
import PersonalCredentialManagement from './PersonalCredentialManagement';

import './index.less';

const PersonalCenter = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // 从URL解析当前tab
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

  const { Title } = Typography;

  return (
    <AppLayout>
      <div className="personal-center-page">
        {/* 面包屑 */}
        <div className="personal-center-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item>{t('personalCenter.title')}</Breadcrumb.Item>
            <Breadcrumb.Item>
              {activeTab === 'personalCredentials' 
                ? t('personalCenter.tabs.personalCredentials') 
                : t('personalCenter.tabs.settings')}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>


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
    </AppLayout>
  );
};

export default PersonalCenter;
