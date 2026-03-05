import QueueMessagesContent from '@/components/QueueManagement/QueueMessagesContent';

import './index.less';

const SchedulingQueueMessagesPage = () => {
  return (
    <div className="scheduling-queue-messages-page">
      <QueueMessagesContent context="scheduling" />
    </div>
  );
};

export default SchedulingQueueMessagesPage;
