import QueueMessagesContent from '@/components/QueueManagement/QueueMessagesContent';

import './index.less';

const DevQueueMessagesPage = () => {
  return (
    <div className="dev-queue-messages-page">
      <QueueMessagesContent context="development" />
    </div>
  );
};

export default DevQueueMessagesPage;
