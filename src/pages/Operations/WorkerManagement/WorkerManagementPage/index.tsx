import { useState } from 'react';
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
            <WorkerManagement isActive={activeTab === 'workers'} />
          </TabPane>
          <TabPane tab={t('workerGroup.tabs.workerGroupManagement')} itemKey="groups">
            <WorkerGroupManagement isActive={activeTab === 'groups'} />
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default WorkerManagementPage;
