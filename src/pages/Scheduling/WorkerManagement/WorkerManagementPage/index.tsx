import { useState, useCallback } from 'react';
import { Tabs } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import WorkerManagement from '../index';
import WorkerGroupManagement from '../WorkerGroupManagement';
import '../index.less';

const { TabPane } = Tabs;

const WorkerManagementPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('workers');
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);

  const handleNavigateToWorkerDetail = useCallback((workerId: string) => {
    setPendingWorkerId(workerId);
    setActiveTab('workers');
  }, []);

  const handleWorkerDetailOpened = useCallback(() => {
    setPendingWorkerId(null);
  }, []);

  return (
    <div className="worker-management-container">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        className="worker-management-tabs"
      >
        <TabPane tab={t('workerGroup.tabs.workerManagement')} itemKey="workers">
          <WorkerManagement 
            isActive={activeTab === 'workers'} 
            pendingWorkerId={pendingWorkerId}
            onWorkerDetailOpened={handleWorkerDetailOpened}
          />
        </TabPane>
        <TabPane tab={t('workerGroup.tabs.workerGroupManagement')} itemKey="groups">
          <WorkerGroupManagement 
            isActive={activeTab === 'groups'} 
            onNavigateToWorkerDetail={handleNavigateToWorkerDetail}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkerManagementPage;
