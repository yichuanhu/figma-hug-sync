import QueueManagementContent from '@/components/QueueManagement/QueueManagementContent';

import './index.less';

const SchedulingQueueManagementPage = () => {
  return (
    <div className="scheduling-queue-management-page">
      <QueueManagementContent context="scheduling" />
    </div>
  );
};

export default SchedulingQueueManagementPage;
