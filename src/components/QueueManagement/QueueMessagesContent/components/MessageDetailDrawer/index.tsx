import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';
import {
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { PlayCircle, RefreshCw } from 'lucide-react';
import type { LYQueueMessageResponse, QueueMessageStatus, QueueMessagePriority } from '@/api/index';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';

import './index.less';

interface MessageDetailDrawerProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  messages: LYQueueMessageResponse[];
  context: 'development' | 'scheduling';
  onClose: () => void;
  onConsume: (message: LYQueueMessageResponse) => void;
  onRequeue: (message: LYQueueMessageResponse) => void;
  onDelete: (message: LYQueueMessageResponse) => void;
  onNavigate: (message: LYQueueMessageResponse) => void;
}

const MessageDetailDrawer = ({
  visible,
  message,
  messages,
  context,
  onClose,
  onConsume,
  onRequeue,
  onDelete,
  onNavigate,
}: MessageDetailDrawerProps) => {
  const { t } = useTranslation();
  const { Text, Paragraph } = Typography;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusTag = (status: QueueMessageStatus) => {
    const statusConfig: Record<QueueMessageStatus, { color: TagColor; text: string }> = {
      UNCONSUMED_INACTIVE: { color: 'grey', text: t('queueMessage.status.unconsumedInactive') },
      UNCONSUMED_ACTIVE: { color: 'blue', text: t('queueMessage.status.unconsumedActive') },
      CONSUMED: { color: 'grey', text: t('queueMessage.status.consumed') },
      EXPIRED: { color: 'grey', text: t('queueMessage.status.expired') },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPriorityTag = (priority: QueueMessagePriority) => {
    const priorityConfig: Record<QueueMessagePriority, { color: TagColor; text: string }> = {
      HIGH: { color: 'red', text: t('queueMessage.priority.high') },
      MEDIUM: { color: 'orange', text: t('queueMessage.priority.medium') },
      LOW: { color: 'green', text: t('queueMessage.priority.low') },
    };
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (!message) return null;

  const extraActions = (
    <>
      {message.status === 'UNCONSUMED_ACTIVE' && (
        <Tooltip content={t('queueMessage.actions.consume')}>
          <Button icon={<PlayCircle size={16} strokeWidth={2} />} theme="borderless" size="small" onClick={() => onConsume(message)} />
        </Tooltip>
      )}
      {(message.status === 'CONSUMED' || message.status === 'EXPIRED') && (
        <Tooltip content={t('queueMessage.actions.requeue')}>
          <Button icon={<RefreshCw size={16} strokeWidth={2} />} theme="borderless" size="small" onClick={() => onRequeue(message)} />
        </Tooltip>
      )}
      <Tooltip content={t('common.delete')}>
        <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={() => onDelete(message)} />
      </Tooltip>
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={message.message_number}
      dataList={messages}
      currentId={message.message_id}
      getId={(item) => item.message_id}
      onNavigate={onNavigate}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="queue-message-detail-drawer-width"
      className="message-detail-drawer"
    >
      <div className="message-detail-drawer-content">
        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.messageContent')}
        </Text>
        <div className="message-detail-drawer-content-box">
          <Paragraph className="message-detail-drawer-content-text">
            {message.content || '-'}
          </Paragraph>
        </div>

        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queueMessage.table.messageNumber')}>
            {message.message_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.status')}>
            {getStatusTag(message.status)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.priority')}>
            {getPriorityTag(message.priority)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.enqueueTime')}>
            {formatDate(message.enqueue_time)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.effectiveTime')}>
            {formatDate(message.effective_time)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.expiryTime')}>
            {formatDate(message.expiry_time)}
          </Descriptions.Item>
        </Descriptions>

        {message.status === 'CONSUMED' && (
          <>
            <Text strong className="message-detail-drawer-section-title">
              {t('queueMessage.detail.consumerInfo')}
            </Text>
            <Descriptions align="left">
              <Descriptions.Item itemKey={t('queueMessage.detail.consumerType')}>
                {message.consumer_type === 'HUMAN'
                  ? t('queueMessage.consumerType.human')
                  : t('queueMessage.consumerType.robot')}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('queueMessage.table.consumer')}>
                {message.consumer_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('queueMessage.detail.consumeTime')}>
                {formatDate(message.consume_time)}
              </Descriptions.Item>
              {message.consume_task_id && (
                <Descriptions.Item itemKey={t('queueMessage.table.consumeTask')}>
                  {message.consume_task_id}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </div>
    </DetailDrawerWrapper>
  );
};

export default MessageDetailDrawer;
