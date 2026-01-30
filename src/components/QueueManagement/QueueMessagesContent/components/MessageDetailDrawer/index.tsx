import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Typography,
  Descriptions,
  Tag,
  Space,
  Divider,
  Tooltip,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';
import {
  IconClose,
  IconPlayCircle,
  IconRefresh,
  IconDeleteStroked,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import type { LYQueueMessageResponse, QueueMessageStatus, QueueMessagePriority } from '@/api/index';

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

const DRAWER_WIDTH_KEY = 'queue-message-detail-drawer-width';
const DEFAULT_WIDTH = 640;
const MIN_WIDTH = 480;

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
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(DRAWER_WIDTH_KEY);
    return saved ? Math.max(Number(saved), MIN_WIDTH) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(MIN_WIDTH, window.innerWidth - e.clientX);
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem(DRAWER_WIDTH_KEY, String(width));
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  const { Title, Text, Paragraph } = Typography;

  // 格式化日期
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态标签
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

  // 获取优先级标签
  const getPriorityTag = (priority: QueueMessagePriority) => {
    const priorityConfig: Record<QueueMessagePriority, { color: TagColor; text: string }> = {
      HIGH: { color: 'red', text: t('queueMessage.priority.high') },
      MEDIUM: { color: 'orange', text: t('queueMessage.priority.medium') },
      LOW: { color: 'green', text: t('queueMessage.priority.low') },
    };
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 计算当前索引和导航状态
  const currentIndex = useMemo(() => {
    if (!message) return -1;
    return messages.findIndex((m) => m.message_id === message.message_id);
  }, [message, messages]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < messages.length - 1;

  // 导航到上一条
  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      const prevMessage = messages[currentIndex - 1];
      onNavigate(prevMessage);
      // 滚动到对应行
      const row = document.getElementById(`queue-message-row-${prevMessage.message_id}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hasPrevious, messages, currentIndex, onNavigate]);

  // 导航到下一条
  const handleNext = useCallback(() => {
    if (hasNext) {
      const nextMessage = messages[currentIndex + 1];
      onNavigate(nextMessage);
      // 滚动到对应行
      const row = document.getElementById(`queue-message-row-${nextMessage.message_id}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hasNext, messages, currentIndex, onNavigate]);

  // 自定义header
  const renderHeader = () => (
    <Row type="flex" justify="space-between" align="middle" className="message-detail-drawer-header">
      <Col>
        <Title heading={5} className="message-detail-drawer-header-title">
          {message?.message_number || ''}
        </Title>
      </Col>
      <Col>
        <Space spacing={8}>
          {message?.status === 'UNCONSUMED_ACTIVE' && (
            <Tooltip content={t('queueMessage.actions.consume')}>
              <Button
                icon={<IconPlayCircle />}
                theme="borderless"
                size="small"
                onClick={() => message && onConsume(message)}
              />
            </Tooltip>
          )}
          {(message?.status === 'CONSUMED' || message?.status === 'EXPIRED') && (
            <Tooltip content={t('queueMessage.actions.requeue')}>
              <Button
                icon={<IconRefresh />}
                theme="borderless"
                size="small"
                onClick={() => message && onRequeue(message)}
              />
            </Tooltip>
          )}
          <Tooltip content={t('common.delete')}>
            <Button
              icon={<IconDeleteStroked className="message-detail-drawer-header-delete-icon" />}
              theme="borderless"
              size="small"
              onClick={() => message && onDelete(message)}
            />
          </Tooltip>
          <Divider layout="vertical" className="message-detail-drawer-header-divider" />
          <Tooltip content={t('common.previous')}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Button
                icon={<IconChevronLeft />}
                theme="borderless"
                size="small"
                disabled={!hasPrevious}
                onClick={handlePrevious}
              />
            </span>
          </Tooltip>
          <Tooltip content={t('common.next')}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Button
                icon={<IconChevronRight />}
                theme="borderless"
                size="small"
                disabled={!hasNext}
                onClick={handleNext}
              />
            </span>
          </Tooltip>
          <Divider layout="vertical" className="message-detail-drawer-header-divider" />
          <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
            <Button
              icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
              theme="borderless"
              size="small"
              onClick={toggleFullscreen}
            />
          </Tooltip>
          <Tooltip content={t('common.close')}>
            <Button
              icon={<IconClose />}
              theme="borderless"
              size="small"
              onClick={onClose}
              className="message-detail-drawer-header-close-btn"
            />
          </Tooltip>
        </Space>
      </Col>
    </Row>
  );

  return (
    <SideSheet
      className={`card-sidesheet resizable-sidesheet message-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
      visible={visible}
      onCancel={onClose}
      width={isFullscreen ? '100%' : width}
      placement="right"
      mask={false}
      closable={false}
      title={renderHeader()}
    >
      {!isFullscreen && (
        <div
          className="message-detail-drawer-resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="message-detail-drawer-content">
        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.messageContent')}
        </Text>
        <div className="message-detail-drawer-content-box">
          <Paragraph className="message-detail-drawer-content-text">
            {message?.content || '-'}
          </Paragraph>
        </div>

        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queueMessage.table.messageNumber')}>
            {message?.message_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.status')}>
            {message && getStatusTag(message.status)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.priority')}>
            {message && getPriorityTag(message.priority)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.enqueueTime')}>
            {formatDate(message?.enqueue_time)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.effectiveTime')}>
            {formatDate(message?.effective_time)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.fields.expiryTime')}>
            {formatDate(message?.expiry_time)}
          </Descriptions.Item>
        </Descriptions>

        {message?.status === 'CONSUMED' && (
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

        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.systemInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatDate(message?.created_at)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatDate(message?.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </SideSheet>
  );
};

export default MessageDetailDrawer;
