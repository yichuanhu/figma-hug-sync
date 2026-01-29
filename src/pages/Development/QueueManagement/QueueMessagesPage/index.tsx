import AppLayout from '@/components/layout/AppLayout';
import QueueMessagesContent from '@/components/QueueManagement/QueueMessagesContent';

import './index.less';

const DevQueueMessagesPage = () => {
  return (
    <AppLayout>
      <div className="dev-queue-messages-page">
        <QueueMessagesContent context="development" />
      </div>
    </AppLayout>
  );
};

export default DevQueueMessagesPage;
