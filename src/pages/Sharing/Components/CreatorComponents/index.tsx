import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tabs, Input, Select } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import ComponentCard from '../components/ComponentCard';
import ComponentDetailDrawer from '../components/ComponentDetailDrawer';
import FilterPopover, { FilterSection } from '@/components/FilterPopover';
import { commandsMockData, apiConnectorsMockData, customComponentsMockData } from './mockData';
import { ComponentItem } from './types';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const CreatorComponents = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('commands');
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ComponentItem | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  const getDataByTab = (tab: string): ComponentItem[] => {
    switch (tab) {
      case 'commands': return commandsMockData;
      case 'apiConnectors': return apiConnectorsMockData;
      case 'customComponents': return customComponentsMockData;
      default: return [];
    }
  };

  const currentData = getDataByTab(activeTab);

  const tagOptions = useMemo(() => {
    const allTags = new Set<string>();
    currentData.forEach((item) => item.tags.forEach((tag) => allTags.add(tag)));
    return Array.from(allTags).map((tag) => ({ value: tag, label: tag }));
  }, [currentData]);

  const filterSections: FilterSection[] = useMemo(() => [
    {
      key: 'status',
      label: t('sharing.filter.status'),
      type: 'checkbox',
      options: [
        { value: 'published', label: t('sharing.detail.status.published') },
        { value: 'draft', label: t('sharing.detail.status.draft') },
        { value: 'deprecated', label: t('sharing.detail.status.deprecated') },
      ],
      value: statusFilter,
    },
  ], [t, statusFilter]);

  const filteredData = currentData.filter((item) => {
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    if (statusFilter.length > 0 && !statusFilter.includes(item.status)) return false;
    if (tagsFilter.length > 0 && !tagsFilter.some((tag) => item.tags.includes(tag))) return false;
    return true;
  });

  const handleCardClick = useCallback((item: ComponentItem) => {
    setSelectedItem(item);
    setDrawerVisible(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const handleDrawerNavigate = useCallback((item: ComponentItem) => {
    setSelectedItem(item);
  }, []);

  const handleFilterConfirm = useCallback((values: Record<string, unknown>) => {
    setStatusFilter(values.status as string[] || []);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setSearchText('');
    setStatusFilter([]);
    setTagsFilter([]);
  }, []);

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
        <Select
          placeholder={t('sharing.filter.tags')}
          value={tagsFilter}
          onChange={(v) => setTagsFilter(v as string[])}
          multiple
          showClear
          maxTagCount={1}
          style={{ width: 260 }}
          optionList={tagOptions}
        />
        <FilterPopover
          sections={filterSections}
          visible={filterVisible}
          onVisibleChange={setFilterVisible}
          onConfirm={handleFilterConfirm}
        />
      </div>
      <div className="creator-components-grid">
        {filteredData.map((item) => (
          <ComponentCard key={item.id} item={item} onClick={handleCardClick} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="creator-components">
      <div className="creator-components-header">
        <Title heading={3} className="title">
          {t('sharing.creatorComponents.pageTitle')}
        </Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
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

      <ComponentDetailDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        item={selectedItem}
        dataList={filteredData}
        onNavigate={handleDrawerNavigate}
      />
    </div>
  );
};

export default CreatorComponents;
