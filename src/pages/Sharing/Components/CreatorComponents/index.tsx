import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tabs, Input } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import ComponentCard from '../components/ComponentCard';
import { commandsMockData, apiConnectorsMockData, customComponentsMockData } from './mockData';
import { ComponentItem } from './types';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const CreatorComponents = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('commands');
  const [searchText, setSearchText] = useState('');

  const getDataByTab = (tab: string): ComponentItem[] => {
    switch (tab) {
      case 'commands': return commandsMockData;
      case 'apiConnectors': return apiConnectorsMockData;
      case 'customComponents': return customComponentsMockData;
      default: return [];
    }
  };

  const filteredData = getDataByTab(activeTab).filter((item) =>
    !searchText || item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.toLowerCase()) ||
    item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderTabContent = () => (
    <div className="creator-components-tab-content">
      <div className="creator-components-toolbar">
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('common.search')}
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ width: 280 }}
        />
      </div>
      <div className="creator-components-grid">
        {filteredData.map((item) => (
          <ComponentCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="creator-components">
      <div className="creator-components-header">
        <Title heading={4} className="title">
          {t('sharing.creatorComponents.pageTitle')}
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setSearchText(''); }}
        className="creator-components-tabs"
        keepDOM={false}
      >
        <TabPane tab={t('sharing.creatorComponents.tabs.commands')} itemKey="commands">
          {renderTabContent()}
        </TabPane>
        <TabPane tab={t('sharing.creatorComponents.tabs.apiConnectors')} itemKey="apiConnectors">
          {renderTabContent()}
        </TabPane>
        <TabPane tab={t('sharing.creatorComponents.tabs.customComponents')} itemKey="customComponents">
          {renderTabContent()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default CreatorComponents;
