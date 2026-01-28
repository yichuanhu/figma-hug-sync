import AppLayout from '@/components/layout/AppLayout';
import QueueManagementContent from '@/components/QueueManagement/QueueManagementContent';

import './index.less';

const QueueManagementPage = () => {
  return (
    <AppLayout>
      <div className="queue-management-page">
        <QueueManagementContent context="development" />
      </div>
    </AppLayout>
  );
};

export default QueueManagementPage;
