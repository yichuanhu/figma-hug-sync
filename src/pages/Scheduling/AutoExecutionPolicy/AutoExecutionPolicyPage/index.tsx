import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Typography, Tabs, TabPane } from '@douyinfe/semi-ui';
import AppLayout from '@/components/layout/AppLayout';
import TimeTriggerList from './components/TimeTriggerList';
import QueueTriggerPlaceholder from './components/QueueTriggerPlaceholder';
import './index.less';

const { Title } = Typography;

const AutoExecutionPolicyPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('timeTrigger');

  return (
    <AppLayout>
      <div className="auto-execution-policy">
        {/* 面包屑 */}
        <Breadcrumb className="auto-execution-policy-breadcrumb">
          <Breadcrumb.Item>{t('autoExecutionPolicy.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('autoExecutionPolicy.breadcrumb.taskExecution')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('autoExecutionPolicy.pageTitle')}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 标题区域 */}
        <div className="auto-execution-policy-header">
          <div className="auto-execution-policy-header-title">
            <Title heading={4} className="title">
              {t('autoExecutionPolicy.pageTitle')}
            </Title>
          </div>
        </div>

        {/* Tab切换 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="auto-execution-policy-tabs"
        >
          <TabPane
            tab={t('autoExecutionPolicy.tabs.timeTrigger')}
            itemKey="timeTrigger"
          >
            <div className="auto-execution-policy-tab-content">
              <TimeTriggerList />
            </div>
          </TabPane>
          <TabPane
            tab={t('autoExecutionPolicy.tabs.queueTrigger')}
            itemKey="queueTrigger"
          >
            <div className="auto-execution-policy-tab-content">
              <QueueTriggerPlaceholder />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AutoExecutionPolicyPage;
