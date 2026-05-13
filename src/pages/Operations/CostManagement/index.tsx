import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography } from '@douyinfe/semi-ui';
import CostTabContent from './components/CostTabContent';
import type { CostType } from './mockData';
import './index.less';

const { Title, Text } = Typography;

const TAB_TYPES: { key: CostType; labelKey: string }[] = [
  { key: 'PROJECT', labelKey: 'operations.costManagement.tabs.project' },
  { key: 'LICENSE', labelKey: 'operations.costManagement.tabs.license' },
  { key: 'INFRASTRUCTURE', labelKey: 'operations.costManagement.tabs.infrastructure' },
  { key: 'THIRD_PARTY', labelKey: 'operations.costManagement.tabs.thirdParty' },
  { key: 'TRAINING', labelKey: 'operations.costManagement.tabs.training' },
  { key: 'OTHER', labelKey: 'operations.costManagement.tabs.other' },
];

const CostManagement = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<CostType>('PROJECT');

  return (
    <div className="cost-management-page">
      <div className="cost-management-page-header">
        <Title heading={3} className="title">
          {t('operations.costManagement.title')}
        </Title>
        <Text type="tertiary">{t('operations.costManagement.description')}</Text>
      </div>

      <Tabs
        activeKey={activeKey}
        onChange={(k) => setActiveKey(k as CostType)}
        type="line"
        keepDOM={false}
      >
        {TAB_TYPES.map((tab) => (
          <TabPane tab={t(tab.labelKey)} itemKey={tab.key} key={tab.key}>
            <CostTabContent costType={tab.key} />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default CostManagement;
