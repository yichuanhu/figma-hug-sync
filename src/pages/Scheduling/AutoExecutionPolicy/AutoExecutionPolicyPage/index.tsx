import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('timeTrigger');
  const [pendingTriggerId, setPendingTriggerId] = useState<string | null>(null);

  // 从 URL 同步 tab 与待打开抽屉的 triggerId（通知中心跳转入口）
  useEffect(() => {
    const tab = searchParams.get('tab');
    const triggerId = searchParams.get('triggerId');
    if (tab === 'queueTrigger' || tab === 'timeTrigger') {
      setActiveTab(tab);
    } else if (triggerId) {
      // 默认时间触发器
      setActiveTab('timeTrigger');
    }
    if (triggerId) {
      setPendingTriggerId(triggerId);
      // 消费一次后清掉 URL 参数，避免重复打开
      const next = new URLSearchParams(searchParams);
      next.delete('triggerId');
      next.delete('tab');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePendingHandled = () => setPendingTriggerId(null);

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
            <TimeTriggerList
              pendingTriggerId={activeTab === 'timeTrigger' ? pendingTriggerId : null}
              onPendingHandled={handlePendingHandled}
            />
          </div>
        </TabPane>
        <TabPane
          tab={t('autoExecutionPolicy.tabs.queueTrigger')}
          itemKey="queueTrigger"
        >
          <div className="auto-execution-policy-tab-content">
            <QueueTriggerList
              pendingTriggerId={activeTab === 'queueTrigger' ? pendingTriggerId : null}
              onPendingHandled={handlePendingHandled}
            />
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AutoExecutionPolicyPage;
