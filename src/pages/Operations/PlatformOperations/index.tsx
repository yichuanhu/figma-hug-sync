import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography } from '@douyinfe/semi-ui';
import AnnouncementsTab from './components/AnnouncementsTab';
import ResourcesTab from './components/ResourcesTab';
import './index.less';

const { Title } = Typography;

const PlatformOperations = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('announcements');

  return (
    <div className="platform-operations-page">
      <Title heading={3} className="page-title">
        {t('operations.platformOperations.title')}
      </Title>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        type="line"
        keepDOM={false}
      >
        <TabPane tab={t('operations.platformOperations.tabs.announcements')} itemKey="announcements">
          <AnnouncementsTab />
        </TabPane>
        <TabPane tab={t('operations.platformOperations.tabs.resources')} itemKey="resources">
          <ResourcesTab />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PlatformOperations;
