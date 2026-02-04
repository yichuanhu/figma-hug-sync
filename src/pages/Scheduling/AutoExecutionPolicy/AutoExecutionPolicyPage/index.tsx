import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, Typography, Tabs, Button } from '@douyinfe/semi-ui';
import { IconCalendar } from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
import TimeTriggerList from './components/TimeTriggerList';
import QueueTriggerList from './components/QueueTriggerList';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const AutoExecutionPolicyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeTrigger');

  const handleWorkCalendarClick = () => {
    navigate('/scheduling-center/task-execution/work-calendar');
  };

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
          <Button
            icon={<IconCalendar />}
            onClick={handleWorkCalendarClick}
          >
            {t('workCalendar.entryButton')}
          </Button>
        </div>

        {/* Tab切换 */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          className="auto-execution-policy-tabs"
          keepDOM={false}
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
              <QueueTriggerList />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AutoExecutionPolicyPage;
