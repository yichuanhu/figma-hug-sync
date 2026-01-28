import { useState, useEffect, useCallback } from 'react';
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
  IconDeleteStroked,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
} from '@douyinfe/semi-icons';
import { Play, RotateCcw } from 'lucide-react';
import type { LYQueueMessageResponse, MessageStatus, MessagePriority } from '@/api/index';

import './index.less';

interface MessageDetailDrawerProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onConsume: (message: LYQueueMessageResponse) => void;
  onRequeue: (message: LYQueueMessageResponse) => void;
  onDelete: (message: LYQueueMessageResponse) => void;
  allMessages: LYQueueMessageResponse[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => Promise<LYQueueMessageResponse[]>;
  onMessageChange: (message: LYQueueMessageResponse) => void;
}

const DRAWER_WIDTH_KEY = 'message-detail-drawer-width';
const DEFAULT_WIDTH = 900;
const MIN_WIDTH = 576;

const MessageDetailDrawer = ({
  visible,
  message,
  context,
  onClose,
  onConsume,
  onRequeue,
  onDelete,
  allMessages,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onMessageChange,
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

  // 计算当前消息在列表中的索引
  const currentIndex = allMessages.findIndex(
    (m) => m.message_id === message?.message_id
  );

  // 计算全局索引
  const globalIndex = (currentPage - 1) * pageSize + currentIndex;

  // 导航到上一个/下一个
  const handleNavigate = async (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentIndex > 0) {
        onMessageChange(allMessages[currentIndex - 1]);
      } else if (currentPage > 1) {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          onMessageChange(newData[newData.length - 1]);
        }
      }
    } else {
      if (currentIndex < allMessages.length - 1) {
        onMessageChange(allMessages[currentIndex + 1]);
      } else if (globalIndex < total - 1) {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          onMessageChange(newData[0]);
        }
      }
    }
  };

  const canGoPrev = globalIndex > 0;
  const canGoNext = globalIndex < total - 1;

  const { Title, Text } = Typography;

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取状态标签
  const getStatusTag = (status: MessageStatus) => {
    const statusConfig: Record<MessageStatus, { color: TagColor; text: string }> = {
      UNCONSUMED_NOT_ACTIVE: { color: 'grey', text: t('queueMessage.status.unconsumedNotActive') },
      UNCONSUMED_ACTIVE: { color: 'blue', text: t('queueMessage.status.unconsumedActive') },
      CONSUMED: { color: 'grey', text: t('queueMessage.status.consumed') },
      EXPIRED: { color: 'grey', text: t('queueMessage.status.expired') },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取优先级标签
  const getPriorityTag = (priority: MessagePriority) => {
    const priorityConfig: Record<MessagePriority, { color: TagColor; text: string }> = {
      HIGH: { color: 'red', text: t('queueMessage.priority.high') },
      MEDIUM: { color: 'orange', text: t('queueMessage.priority.medium') },
      LOW: { color: 'grey', text: t('queueMessage.priority.low') },
    };
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 自定义header
  const renderHeader = () => (
    <Row type="flex" justify="space-between" align="middle" className="message-detail-drawer-header">
      <Col>
        <Title heading={5} className="message-detail-drawer-header-title">
          {t('queueMessage.detail.title')}
        </Title>
      </Col>
      <Col>
        <Space spacing={8}>
          {(allMessages.length > 1 || total > pageSize) && (
            <>
              <Tooltip content={t('common.previous')}>
                <Button
                  icon={<IconChevronLeft />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoPrev}
                  onClick={() => handleNavigate('prev')}
                />
              </Tooltip>
              <Tooltip content={t('common.next')}>
                <Button
                  icon={<IconChevronRight />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoNext}
                  onClick={() => handleNavigate('next')}
                />
              </Tooltip>
              <Divider layout="vertical" className="message-detail-drawer-header-divider" />
            </>
          )}
          {message?.status === 'UNCONSUMED_ACTIVE' && (
            <Tooltip content={t('queueMessage.actions.consume')}>
              <Button
                icon={<Play size={16} />}
                theme="borderless"
                size="small"
                onClick={() => message && onConsume(message)}
              />
            </Tooltip>
          )}
          {(message?.status === 'CONSUMED' || message?.status === 'EXPIRED') && (
            <Tooltip content={t('queueMessage.actions.requeue')}>
              <Button
                icon={<RotateCcw size={16} />}
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
          {t('queueMessage.detail.messageInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('common.status')}>
            {message?.status && getStatusTag(message.status)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.priority')}>
            {message?.priority && getPriorityTag(message.priority)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.detail.content')}>
            <div className="message-detail-drawer-content-text">
              {message?.content || '-'}
            </div>
          </Descriptions.Item>
        </Descriptions>

        <Text strong className="message-detail-drawer-section-title">
          {t('queueMessage.detail.timeInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queueMessage.table.createdAt')}>
            {formatDate(message?.created_at || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.table.effectiveTime')}>
            {formatDate(message?.effective_time || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queueMessage.detail.expiryTime')}>
            {formatDate(message?.expiry_time || null)}
          </Descriptions.Item>
        </Descriptions>

        {message?.status === 'CONSUMED' && (
          <>
            <Text strong className="message-detail-drawer-section-title">
              {t('queueMessage.detail.consumerInfo')}
            </Text>
            <Descriptions align="left">
              <Descriptions.Item itemKey={t('queueMessage.detail.consumerType')}>
                {message?.consumer_type === 'MANUAL' 
                  ? t('queueMessage.consumerType.manual') 
                  : t('queueMessage.consumerType.robot')}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('queueMessage.detail.consumerName')}>
                {message?.consumer_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('queueMessage.detail.consumedAt')}>
                {formatDate(message?.consumed_at || null)}
              </Descriptions.Item>
              {message?.consume_task_id && (
                <Descriptions.Item itemKey={t('queueMessage.detail.consumeTaskId')}>
                  {message.consume_task_id}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </div>
    </SideSheet>
  );
};

export default MessageDetailDrawer;
