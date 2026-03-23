import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import WorkerManagement from '../index';
import WorkerGroupManagement from '../WorkerGroupManagement';
import '../index.less';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const WorkerManagementPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('workers');
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);
  const [openCreateWorker, setOpenCreateWorker] = useState(false);

  // from首页快捷入口跳转时auto-open新建Modal
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setOpenCreateWorker(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleNavigateToWorkerDetail = useCallback((workerId: string) => {
    setPendingWorkerId(workerId);
    setActiveTab('workers');
  }, []);

  const handleWorkerDetailOpened = useCallback(() => {
    setPendingWorkerId(null);
  }, []);

  return (
    <div className="worker-management-container">
      <div className="worker-management-container-header">
        <Title heading={3} className="title">{t('worker.title')}</Title>
        <Text type="tertiary">{t('worker.description')}</Text>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        className="worker-management-tabs"
        keepDOM={false}
      >
        <TabPane tab={t('workerGroup.tabs.workerManagement')} itemKey="workers">
          <WorkerManagement 
            isActive={activeTab === 'workers'} 
            pendingWorkerId={pendingWorkerId}
            onWorkerDetailOpened={handleWorkerDetailOpened}
            openCreateFromHome={openCreateWorker}
            onCreateFromHomeHandled={() => setOpenCreateWorker(false)}
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
