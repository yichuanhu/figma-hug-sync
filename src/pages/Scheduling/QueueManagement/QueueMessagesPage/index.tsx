import AppLayout from '@/components/layout/AppLayout';
import QueueMessagesContent from '@/components/QueueManagement/QueueMessagesContent';

import './index.less';

const SchedulingQueueMessagesPage = () => {
  return (
    <AppLayout>
      <div className="scheduling-queue-messages-page">
        <QueueMessagesContent context="scheduling" />
      </div>
    </AppLayout>
  );
};

export default SchedulingQueueMessagesPage;
