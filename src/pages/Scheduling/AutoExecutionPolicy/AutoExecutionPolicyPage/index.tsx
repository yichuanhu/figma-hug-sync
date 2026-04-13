import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Typography, Tabs, Button } from '@douyinfe/semi-ui';
import TimeTriggerList from './components/TimeTriggerList';
import QueueTriggerList from './components/QueueTriggerList';
import './index.less';
import { Calendar } from 'lucide-react';

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
    <div className="auto-execution-policy">
      {/* Title area */}
      <div className="auto-execution-policy-header">
        <div className="auto-execution-policy-header-title">
          <Title heading={3} className="title">
            {t('autoExecutionPolicy.pageTitle')}
          </Title>
        </div>
        <Button
          icon={<Calendar size={16} strokeWidth={2} />}
          onClick={handleWorkCalendarClick}
        >
          {t('workCalendar.entryButton')}
        </Button>
      </div>

      {/* Tab switch */}
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
  );
};

export default AutoExecutionPolicyPage;
