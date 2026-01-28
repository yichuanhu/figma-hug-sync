import { useParams, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import QueueMessagesContent from '@/components/QueueManagement/QueueMessagesContent';

import './index.less';

const QueueMessagesPage = () => {
  const { queueId } = useParams<{ queueId: string }>();
  const location = useLocation();
  
  // 根据URL路径判断入口
  const context = location.pathname.includes('/dev-center/') ? 'development' : 'scheduling';
  
  // 从 location.state 获取队列名称
  const queueName = (location.state as { queueName?: string })?.queueName;

  if (!queueId) {
    return null;
  }

  return (
    <AppLayout>
      <div className="queue-messages-page">
        <QueueMessagesContent 
          queueId={queueId} 
          queueName={queueName}
          context={context} 
        />
      </div>
    </AppLayout>
  );
};

export default QueueMessagesPage;
