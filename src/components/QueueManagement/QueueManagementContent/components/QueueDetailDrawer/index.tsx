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
import {
  IconClose,
  IconEditStroked,
  IconDeleteStroked,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
} from '@douyinfe/semi-icons';
import type { LYQueueResponse } from '@/api/index';

import './index.less';

interface QueueDetailDrawerProps {
  visible: boolean;
  queue: LYQueueResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (queue: LYQueueResponse) => void;
  onDelete?: (queue: LYQueueResponse) => void;
  allQueues: LYQueueResponse[];
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => Promise<LYQueueResponse[]>;
  onQueueChange: (queue: LYQueueResponse) => void;
}

const DRAWER_WIDTH_KEY = 'queue-detail-drawer-width';
const DEFAULT_WIDTH = 900;
const MIN_WIDTH = 576;

const QueueDetailDrawer = ({
  visible,
  queue,
  context,
  onClose,
  onEdit,
  onDelete,
  allQueues,
  currentPage,
  pageSize,
  total,
  onPageChange,
  onQueueChange,
}: QueueDetailDrawerProps) => {
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

  // 计算当前队列在列表中的索引
  const currentIndex = allQueues.findIndex(
    (q) => q.queue_id === queue?.queue_id
  );

  // 计算全局索引
  const globalIndex = (currentPage - 1) * pageSize + currentIndex;

  // 导航到上一个/下一个
  const handleNavigate = async (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentIndex > 0) {
        onQueueChange(allQueues[currentIndex - 1]);
      } else if (currentPage > 1) {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          onQueueChange(newData[newData.length - 1]);
        }
      }
    } else {
      if (currentIndex < allQueues.length - 1) {
        onQueueChange(allQueues[currentIndex + 1]);
      } else if (globalIndex < total - 1) {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          onQueueChange(newData[0]);
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

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 自定义header
  const renderHeader = () => (
    <Row type="flex" justify="space-between" align="middle" className="queue-detail-drawer-header">
      <Col>
        <Title heading={5} className="queue-detail-drawer-header-title">
          {queue?.queue_name || ''}
        </Title>
      </Col>
      <Col>
        <Space spacing={8}>
          {(allQueues.length > 1 || total > pageSize) && (
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
              <Divider layout="vertical" className="queue-detail-drawer-header-divider" />
            </>
          )}
          <Tooltip content={t('common.edit')}>
            <Button
              icon={<IconEditStroked />}
              theme="borderless"
              size="small"
              onClick={() => queue && onEdit(queue)}
            />
          </Tooltip>
          {onDelete && context === 'development' && (
            <Tooltip content={queue?.is_published ? t('queue.detail.cannotDeletePublished') : t('common.delete')}>
              <Button
                icon={<IconDeleteStroked className={queue?.is_published ? '' : 'queue-detail-drawer-header-delete-icon'} />}
                theme="borderless"
                size="small"
                disabled={queue?.is_published}
                onClick={() => queue && onDelete(queue)}
              />
            </Tooltip>
          )}
          <Divider layout="vertical" className="queue-detail-drawer-header-divider" />
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
              className="queue-detail-drawer-header-close-btn"
            />
          </Tooltip>
        </Space>
      </Col>
    </Row>
  );

  return (
    <SideSheet
      className={`card-sidesheet resizable-sidesheet queue-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
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
          className="queue-detail-drawer-resize-handle"
          onMouseDown={handleMouseDown}
        />
      )}

      <div className="queue-detail-drawer-content">
        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.tabs.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queue.fields.name')}>
            {queue?.queue_name || '-'}
          </Descriptions.Item>
          {context === 'development' && (
            <Descriptions.Item itemKey={t('queue.detail.isPublished')}>
              {queue?.is_published ? (
                <Tag color="green">{t('queue.detail.published')}</Tag>
              ) : (
                <Tag color="grey">{t('queue.detail.unpublished')}</Tag>
              )}
            </Descriptions.Item>
          )}
          <Descriptions.Item itemKey={t('common.description')}>
            {queue?.description || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.messageStats')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queue.table.unconsumedCount')}>
            {context === 'development' 
              ? queue?.test_unconsumed_count 
              : queue?.prod_unconsumed_count}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queue.table.consumedCount')}>
            {context === 'development' 
              ? queue?.test_consumed_count 
              : queue?.prod_consumed_count}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queue.table.failedCount')}>
            <Text type={((context === 'development' ? queue?.test_failed_count : queue?.prod_failed_count) || 0) > 0 ? 'danger' : undefined}>
              {context === 'development' 
                ? queue?.test_failed_count 
                : queue?.prod_failed_count}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.systemInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('common.creator')}>
            {queue?.created_by_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatDate(queue?.created_at || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatDate(queue?.updated_at || null)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </SideSheet>
  );
};

export default QueueDetailDrawer;
