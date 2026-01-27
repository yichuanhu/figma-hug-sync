import { useState, useCallback } from 'react';
import { Breadcrumb, Tabs } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import WorkerManagement from '../index';
import WorkerGroupManagement from '../WorkerGroupManagement';
import '../index.less';

const { TabPane } = Tabs;

const WorkerManagementPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('workers');
  // 用于跨Tab跳转时传递要打开的机器人ID
  const [pendingWorkerId, setPendingWorkerId] = useState<string | null>(null);

  // 从机器人组详情跳转到机器人详情
  const handleNavigateToWorkerDetail = useCallback((workerId: string) => {
    setPendingWorkerId(workerId);
    setActiveTab('workers');
  }, []);

  // 机器人详情打开后清除pending状态
  const handleWorkerDetailOpened = useCallback(() => {
    setPendingWorkerId(null);
  }, []);

  return (
    <AppLayout>
      <div className="worker-management-container">
        {/* 固定面包屑 */}
        <div className="worker-management-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('worker.breadcrumb.schedulingCenter')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('worker.breadcrumb.executionResourceMonitoring')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('worker.breadcrumb.workerManagement')}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/* Tab页签 */}
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
    </AppLayout>
  );
};

export default WorkerManagementPage;
