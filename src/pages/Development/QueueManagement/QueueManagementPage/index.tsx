import QueueManagementContent from '@/components/QueueManagement/QueueManagementContent';

import './index.less';

const QueueManagementPage = () => {
  return (
    <div className="queue-management-page">
      <QueueManagementContent context="development" />
    </div>
  );
};

export default QueueManagementPage;
