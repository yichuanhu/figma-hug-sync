import AppLayout from '@/components/layout/AppLayout';
import QueueManagementContent from '@/components/QueueManagement/QueueManagementContent';

import './index.less';

const SchedulingQueueManagementPage = () => {
  return (
    <AppLayout>
      <div className="scheduling-queue-management-page">
        <QueueManagementContent context="scheduling" />
      </div>
    </AppLayout>
  );
};

export default SchedulingQueueManagementPage;
